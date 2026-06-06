import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Layers, Activity, Sparkles, Send, ShieldCheck, Box } from 'lucide-react';
import SidebarInput from './components/SidebarInput.jsx';
import ThreeViewer from './components/ThreeViewer.jsx';
import Dashboard from './components/Dashboard.jsx';
import LarkImporter from './components/LarkImporter.jsx';
import { packContainers, STANDARD_CONTAINERS } from './utils/binPacking.js';
import { MOCK_PRESETS } from './utils/mockData.js';

export default function App() {
  const [items, setItems] = useState(() => {
    return MOCK_PRESETS.length > 0 ? MOCK_PRESETS[0].items : [];
  });
  const [containerType, setContainerType] = useState(STANDARD_CONTAINERS[2]); // Default 40HQ
  const [activeContainerIndex, setActiveContainerIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(null); // null means default to maxSteps
  const [hoveredBox, setHoveredBox] = useState(null);
  
  // Importer state
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // Engine Mode: 'fast' or 'max'
  const [engineMode, setEngineMode] = useState('fast');

  // Web Worker for Max Mode
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationStats, setOptimizationStats] = useState({
    containerName: '',
    bestUtilization: 0,
    elapsedTime: 0
  });
  const [maxModeResult, setMaxModeResult] = useState(null);
  const workerRef = useRef(null);

  const triggerMaxModeOptimization = useCallback((targetItems = items, targetContainer = containerType) => {
    // Terminate existing worker
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    if (targetItems.length === 0) {
      setMaxModeResult({ containers: [], unpacked: [] });
      setIsOptimizing(false);
      return;
    }

    setIsOptimizing(true);
    setOptimizationProgress(0);
    setOptimizationStats({
      containerName: '正在初始化...',
      bestUtilization: 0,
      elapsedTime: 0
    });

    // Create a new Web Worker
    const worker = new Worker(
      new URL('./workers/gaOptimizer.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    // Send payload
    worker.postMessage({
      items: targetItems,
      containerType: targetContainer,
      options: {
        generations: 60, // Optimal balance of depth and speed
        populationSize: 20,
        supportThreshold: 0.60
      }
    });

    // Receive message
    worker.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'progress') {
        setOptimizationProgress(data.totalProgress);
        setOptimizationStats({
          containerName: data.containerName,
          bestUtilization: data.bestUtilization,
          elapsedTime: data.elapsedTime
        });
      } else if (data.type === 'done') {
        setMaxModeResult({
          containers: data.containers,
          unpacked: data.unpacked
        });
        setActiveContainerIndex(0);
        setCurrentStep(null); // Reset so it defaults to maxSteps
        setIsOptimizing(false);
        workerRef.current = null;
      }
    };
  }, [items, containerType]);

  const handleUpdateItems = useCallback((newItemsOrUpdater) => {
    setItems((prevItems) => {
      const nextItems = typeof newItemsOrUpdater === 'function' ? newItemsOrUpdater(prevItems) : newItemsOrUpdater;
      if (engineMode === 'max') {
        setTimeout(() => {
          triggerMaxModeOptimization(nextItems, containerType);
        }, 0);
      }
      return nextItems;
    });
    setCurrentStep(null); // Reset step to full view
  }, [engineMode, containerType, triggerMaxModeOptimization]);

  const handleUpdateContainerType = useCallback((newContainer) => {
    setContainerType(newContainer);
    setCurrentStep(null); // Reset step to full view
    if (engineMode === 'max') {
      triggerMaxModeOptimization(items, newContainer);
    }
  }, [engineMode, items, triggerMaxModeOptimization]);

  const handleImportData = useCallback((newItems) => {
    setItems(newItems);
    setCurrentStep(null); // Reset step to full view
    if (engineMode === 'max') {
      triggerMaxModeOptimization(newItems, containerType);
    }
  }, [engineMode, containerType, triggerMaxModeOptimization]);

  const handleSelectEngineMode = useCallback((mode) => {
    setEngineMode(mode);
    setCurrentStep(null); // Reset step to full view
    if (mode === 'max') {
      triggerMaxModeOptimization(items, containerType);
    } else {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        setIsOptimizing(false);
      }
      setMaxModeResult(null);
    }
  }, [items, containerType, triggerMaxModeOptimization]);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Compute Fast Mode on render dynamically (zero latency)
  const fastModeResult = useMemo(() => {
    return packContainers(items, containerType, { sortingStrategy: 'volume' });
  }, [items, containerType]);

  const packedContainers = engineMode === 'fast' || !maxModeResult
    ? fastModeResult.containers
    : maxModeResult.containers;

  const unpackedItems = engineMode === 'fast' || !maxModeResult
    ? fastModeResult.unpacked
    : maxModeResult.unpacked;

  const activeContainer = packedContainers[activeContainerIndex] || null;
  const maxSteps = activeContainer?.items?.length || 0;
  const effectiveStep = (currentStep === null || currentStep > maxSteps) ? maxSteps : currentStep;

  return (
    <div className="app-container">
      {/* Top Header Section */}
      <header className="header glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <div className="logo-section">
          <Layers size={28} className="logo-icon" />
          <div>
            <h1 className="logo-title">3D 家具智能装柜优化系统</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Sandra Logistics & Sales Assistant Pro</span>
          </div>
          <span className="logo-badge">V1.2 Premium</span>
        </div>

        {/* Engine Toggle Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: '600' }}>
            算法核心引擎:
          </span>
          <div className="engine-selector">
            <button 
              className={`engine-btn ${engineMode === 'fast' ? 'active fast' : ''}`}
              onClick={() => handleSelectEngineMode('fast')}
              title="极速装载：秒级出库量评估，适合前端销售报价"
            >
              <Sparkles size={16} /> 极速估算模式 (Fast Mode)
            </button>
            <button 
              className={`engine-btn ${engineMode === 'max' ? 'active max' : ''}`}
              onClick={() => handleSelectEngineMode('max')}
              title="极限装载：多维遗传启发式算法，榨干集装箱空间"
            >
              <Activity size={16} /> 极限装载模式 (Max Mode)
            </button>
          </div>

          {engineMode === 'max' && (
            <button 
              className="btn-primary" 
              onClick={() => triggerMaxModeOptimization(items, containerType)} 
              disabled={isOptimizing}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Send size={14} /> 重新计算 (Recalculate)
            </button>
          )}
        </div>

        {/* Security / Standard Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}>
          <ShieldCheck size={18} className="glow-text-secondary" />
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Stable & Certified
          </span>
        </div>
      </header>

      {/* Main Core Layout Grid */}
      {/* 1. Left Input Sidebar */}
      <SidebarInput 
        items={items}
        setItems={handleUpdateItems}
        containerType={containerType}
        setContainerType={handleUpdateContainerType}
        onImportMock={handleImportData}
        onOpenImporter={() => setIsImporterOpen(true)}
      />

      {/* 2. Middle 3D Viewport Panel */}
      <main className="main-content">
        {activeContainer ? (
          <ThreeViewer 
            containerData={activeContainer}
            currentStep={effectiveStep}
            setCurrentStep={setCurrentStep}
            onHoverBox={setHoveredBox}
            hoveredBox={hoveredBox}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', gap: '16px', background: '#0b0b10' }}>
            <Box size={48} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '1rem' }}>请录入货物或选用预设套件一键计算 3D 载重图</span>
          </div>
        )}
      </main>

      {/* 3. Right Stats Dashboard Sidebar */}
      <Dashboard 
        packedContainers={packedContainers}
        unpackedCount={unpackedItems.length}
        activeContainerIndex={activeContainerIndex}
        setActiveContainerIndex={(idx) => {
          setActiveContainerIndex(idx);
          setCurrentStep(null);
        }}
        isOptimizing={isOptimizing}
        optimizationProgress={optimizationProgress}
        optimizationStats={optimizationStats}
      />

      {/* CSV/Excel/Lark Importer Modal */}
      <LarkImporter 
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImport={handleImportData}
      />
    </div>
  );
}
