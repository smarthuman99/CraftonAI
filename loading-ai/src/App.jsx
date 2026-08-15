import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Layers, Activity, Sparkles, Send, ShieldCheck, Box, Globe } from 'lucide-react';
import SidebarInput from './components/SidebarInput.jsx';
import ThreeViewer from './components/ThreeViewer.jsx';
import Dashboard from './components/Dashboard.jsx';
import LarkImporter from './components/LarkImporter.jsx';
import { packContainers, STANDARD_CONTAINERS } from './utils/binPacking.js';
import { MOCK_PRESETS } from './utils/mockData.js';
import { TRANSLATIONS } from './utils/translations.js';

export default function App() {
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [projectContext, setProjectContext] = useState({
    projectId: queryParams.get('projectId') || '',
    projectName: '',
    sourceLabel: '',
    omittedItems: []
  });
  const [lang, setLang] = useState(() => {
    return new URLSearchParams(window.location.search).get('lang') || 'en';
  });

  const t = useCallback((key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  }, [lang]);

  const handleToggleLang = () => {
    const nextLang = lang === 'en' ? 'cn' : 'en';
    setLang(nextLang);
    // Send postMessage to parent to keep parent in sync if embedded in iframe
    try {
      window.parent.postMessage({ 
        type: 'CRAFTON_CHILD_LANG_CHANGE', 
        lang: nextLang === 'cn' ? 'Cn' : 'En' 
      }, '*');
    } catch (e) {
      console.error(e);
    }
  };

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

  useEffect(() => {
    const handleUrlChange = () => {
      const urlLang = new URLSearchParams(window.location.search).get('lang');
      if (urlLang && urlLang !== lang) setLang(urlLang);
    };

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'CRAFTON_SET_LANG') {
        setLang(event.data.lang?.toLowerCase() === 'cn' ? 'cn' : 'en');
      }
      if (event.data?.type === 'CRAFTON_LOADING_INIT') {
        const payload = event.data.payload || {};
        const incomingItems = Array.isArray(payload.items)
          ? payload.items.filter(
              (item) => Number(item.l) > 0 && Number(item.w) > 0 && Number(item.h) > 0 && Number(item.qty) > 0
            )
          : [];
        setProjectContext({
          projectId: payload.projectId || '',
          projectName: payload.projectName || '',
          sourceLabel: payload.sourceLabel || '',
          omittedItems: Array.isArray(payload.omittedItems) ? payload.omittedItems : []
        });
        setItems(incomingItems);
        setMaxModeResult(null);
        setCurrentStep(null);
        setActiveContainerIndex(0);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('message', handleMessage);
    };
  }, [lang]);

  useEffect(() => {
    const host = window.parent !== window ? window.parent : window.opener;
    host?.postMessage({ type: 'CRAFTON_LOADING_READY' }, window.location.origin);
  }, []);

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

  useEffect(() => {
    if (window.parent === window || !projectContext.projectId) return;
    const totalVolume = packedContainers.reduce((sum, container) => sum + Number(container.stats?.totalVolume || 0), 0);
    const usedVolume = packedContainers.reduce((sum, container) => sum + Number(container.stats?.usedVolume || 0), 0);
    const utilizationPercent = totalVolume > 0 ? Math.round((usedVolume / totalVolume) * 1000) / 10 : 0;
    window.parent.postMessage({
      type: 'CRAFTON_LOADING_RESULT',
      payload: {
        projectId: projectContext.projectId,
        projectName: projectContext.projectName,
        engineMode,
        containerType: containerType.id,
        totalContainers: packedContainers.length,
        utilizationPercent,
        unpackedCount: unpackedItems.length,
        sourceItems: items,
        containers: packedContainers,
        unpacked: unpackedItems,
        generatedAt: new Date().toISOString()
      }
    }, window.location.origin);
  }, [containerType.id, engineMode, items, packedContainers, projectContext, unpackedItems]);

  return (
    <div className="app-container">
      {/* Top Header Section */}
      <header className="header glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <div className="logo-section">
          <Layers size={28} className="logo-icon" />
          <div>
            <h1 className="logo-title">{t('title')}</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{t('subtitle')}</span>
            {projectContext.projectName && (
              <>
                <span style={{ display: 'block', marginTop: '2px', fontSize: '0.68rem', color: 'var(--color-primary)' }}>
                  {projectContext.projectName}
                </span>
                <span style={{ display: 'block', marginTop: '2px', fontSize: '0.65rem', color: 'var(--color-success)' }}>
                  {lang === 'cn' ? '已载入订单 BOM' : 'Order BOM loaded'}: {items.length} SKU / {items.reduce((sum, item) => sum + Number(item.qty || 0), 0)} pcs
                  {projectContext.sourceLabel ? ` · ${projectContext.sourceLabel}` : ''}
                </span>
                {projectContext.omittedItems.length > 0 && (
                  <span style={{ display: 'block', marginTop: '2px', fontSize: '0.62rem', color: 'var(--color-warning)' }}>
                    {lang === 'cn' ? '缺少尺寸，未装载' : 'Skipped for missing dimensions'}: {projectContext.omittedItems.length}
                  </span>
                )}
              </>
            )}
          </div>
          <span className="logo-badge">V1.2 Premium</span>
        </div>

        {/* Engine Toggle Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: '600' }}>
            {t('engineTitle')}
          </span>
          <div className="engine-selector">
            <button 
              className={`engine-btn ${engineMode === 'fast' ? 'active fast' : ''}`}
              onClick={() => handleSelectEngineMode('fast')}
              title={t('fastDesc')}
            >
              <Sparkles size={16} /> {t('fastMode')}
            </button>
            <button 
              className={`engine-btn ${engineMode === 'max' ? 'active max' : ''}`}
              onClick={() => handleSelectEngineMode('max')}
              title={t('maxDesc')}
            >
              <Activity size={16} /> {t('maxMode')}
            </button>
          </div>

          {engineMode === 'max' && (
            <button 
              className="btn-primary" 
              onClick={() => triggerMaxModeOptimization(items, containerType)} 
              disabled={isOptimizing}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Send size={14} /> {t('recalculate')}
            </button>
          )}
        </div>

        {/* Language Switcher and Security / Standard Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Globe Language Switch Button */}
          <button
            onClick={handleToggleLang}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--color-text)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
            title="Switch Language / 切换语言"
          >
            <Globe size={14} className="glow-text-primary" style={{ transform: 'translateY(-0.5px)' }} />
            {lang === 'en' ? 'English (EN)' : '简体中文 (CN)'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}>
            <ShieldCheck size={18} className="glow-text-secondary" />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('statusStable')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Core Layout Grid */}
      {/* 1. Left Input Sidebar */}
      <SidebarInput 
        lang={lang}
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
            lang={lang}
            containerData={activeContainer}
            currentStep={effectiveStep}
            setCurrentStep={setCurrentStep}
            onHoverBox={setHoveredBox}
            hoveredBox={hoveredBox}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', gap: '16px', background: '#0b0b10' }}>
            <Box size={48} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '1rem' }}>{t('noLoadingResult')}</span>
          </div>
        )}
      </main>

      {/* 3. Right Stats Dashboard Sidebar */}
      <Dashboard 
        lang={lang}
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
        lang={lang}
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImport={handleImportData}
      />
    </div>
  );
}
