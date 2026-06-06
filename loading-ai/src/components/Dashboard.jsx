import { Activity, ShieldAlert, Navigation, Scale, Box } from 'lucide-react';

export default function Dashboard({
  packedContainers,
  unpackedCount,
  activeContainerIndex,
  setActiveContainerIndex,
  isOptimizing,
  optimizationProgress,
  optimizationStats
}) {
  const activeContainer = packedContainers[activeContainerIndex] || null;

  // Render circular SVG utilization meter
  const renderUtilizationCircle = (percent) => {
    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <div className="metric-circle-container">
        <svg className="metric-circle-svg">
          <circle 
            className="metric-circle-bg" 
            cx="70" 
            cy="70" 
            r={radius} 
          />
          <circle 
            className={`metric-circle-fill ${percent > 80 ? 'primary' : 'secondary'}`} 
            cx="70" 
            cy="70" 
            r={radius}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: isNaN(offset) ? circumference : offset
            }}
          />
        </svg>
        <div className="metric-circle-text">
          <span className="metric-percentage glow-text-primary">
            {percent}%
          </span>
          <span className="metric-label">空间利用率</span>
        </div>
      </div>
    );
  };

  // Helper to check weight distribution
  const getWeightStatusLabel = (shiftX, shiftY) => {
    const shift = Math.sqrt(shiftX * shiftX + shiftY * shiftY);
    if (shift < 8) return { label: '极度平衡 (Excellent)', color: 'var(--color-success)' };
    if (shift < 18) return { label: '适度偏离 (Safe)', color: 'var(--color-warning)' };
    return { label: '严重倾斜 (Unbalanced)', color: 'var(--color-danger)' };
  };

  return (
    <div className="sidebar-right">
      {/* Container Selection Tabs (For Multi-Container results) */}
      {packedContainers.length > 0 && (
        <div className="panel-section glass-panel">
          <h3 className="panel-header">
            <span>4. 货柜选用方案</span>
            <span className="logo-badge" style={{ background: 'var(--color-primary-glow)', color: '#fff' }}>
              共 {packedContainers.length} 个柜
            </span>
          </h3>
          <div className="container-tabs" style={{ marginTop: '8px' }}>
            {packedContainers.map((c, idx) => (
              <button
                key={c.id}
                className={`container-tab ${idx === activeContainerIndex ? 'active' : ''}`}
                onClick={() => setActiveContainerIndex(idx)}
              >
                柜 {idx + 1} ({c.stats.utilization}%)
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            自动分拨：货物超过单柜上限，已依次分拨至后续货柜中。
          </p>
        </div>
      )}

      {/* Engine Status / Progress Loader */}
      {isOptimizing && (
        <div className="panel-section glass-panel" style={{ borderColor: 'var(--color-primary)' }}>
          <h3 className="panel-header">
            <span>引擎深度求解中...</span>
            <Activity size={18} className="glow-text-primary" />
          </h3>
          <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '4px' }}>
              <span>正在计算: {optimizationStats.containerName || '装载分析'}</span>
              <span>{optimizationProgress}%</span>
            </div>
            
            {/* Pulsing Loading Bar */}
            <div className="gauge-bar-container">
              <div 
                className="gauge-bar-fill" 
                style={{ 
                  width: `${optimizationProgress}%`, 
                  background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                  boxShadow: '0 0 8px var(--color-primary-glow)'
                }} 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '8px' }}>
              <div>最佳利用率: <strong style={{ color: '#fff' }}>{optimizationStats.bestUtilization}%</strong></div>
              <div>用时: <strong style={{ color: '#fff' }}>{(optimizationStats.elapsedTime / 1000).toFixed(1)}s</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Analysis Dashboard (The Active Container Statistics) */}
      {activeContainer ? (
        <>
          <div className="panel-section glass-panel metric-card">
            {renderUtilizationCircle(activeContainer.stats.utilization)}

            {/* Minor Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', display: 'block' }}>已装载体积</span>
                <strong style={{ fontSize: '1rem' }}>{(activeContainer.stats.usedVolume / 1e9).toFixed(2)} m³</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', display: 'block' }}>货柜总体积</span>
                <strong style={{ fontSize: '1rem' }}>{(activeContainer.stats.totalVolume / 1e9).toFixed(2)} m³</strong>
              </div>
            </div>
          </div>

          {/* Stacking weight safety indicator */}
          <div className="panel-section glass-panel">
            <h3 className="panel-header">
              <span>5. 载重及配载安全</span>
              <Scale size={18} className="glow-text-secondary" />
            </h3>

            {/* Weight Bar Gauge */}
            <div style={{ marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span>货物载重重量:</span>
                <strong>{activeContainer.stats.usedWeight} / {activeContainer.maxWeight} kg</strong>
              </div>
              <div className="gauge-bar-container">
                <div 
                  className="gauge-bar-fill" 
                  style={{ 
                    width: `${Math.min(100, (activeContainer.stats.usedWeight / activeContainer.maxWeight) * 100)}%`,
                    background: (activeContainer.stats.usedWeight > activeContainer.maxWeight) ? 'var(--color-danger)' : 'var(--color-success)'
                  }} 
                />
              </div>
              {activeContainer.stats.usedWeight > activeContainer.maxWeight && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '6px' }}>
                  <ShieldAlert size={14} /> 警告：已超重！请考虑增加集装箱。
                </div>
              )}
            </div>
          </div>

          {/* Center of Gravity Crosshair Card */}
          <div className="panel-section glass-panel">
            <h3 className="panel-header">
              <span>6. 货柜重心分布</span>
              <Navigation size={18} className="glow-text-primary" />
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '8px' }}>
              海运平衡指数 (重心偏离中心点百分比)：
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* COG Grid */}
              <div 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: 'rgba(0,0,0,0.4)', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: 'var(--radius-sm)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Horizontal / Vertical gridlines */}
                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', position: 'absolute', top: '50%' }} />
                <div style={{ width: '1px', height: '100%', background: 'rgba(255,255,255,0.1)', position: 'absolute', left: '50%' }} />
                
                {/* Center marker */}
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.5 }} />

                {/* Gravity point crosshair (Shift values are range -100 to 100) */}
                {/* We map -100 to 100 shift value to 0px to 80px */}
                <div 
                  style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    background: 'var(--color-secondary)', 
                    border: '2px solid #fff',
                    position: 'absolute', 
                    top: `${50 + (activeContainer.stats.cgYShift || 0) / 2}%`, 
                    left: `${50 + (activeContainer.stats.cgXShift || 0) / 2}%`, 
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 10px var(--color-secondary-glow)'
                  }} 
                  title={`X偏离: ${activeContainer.stats.cgXShift}%, Y偏离: ${activeContainer.stats.cgYShift}%`}
                />
              </div>

              {/* COG Metadata */}
              <div style={{ flex: 1, fontSize: '0.8rem' }}>
                <div>长轴偏离 (X Shift): <strong style={{ color: '#fff' }}>{activeContainer.stats.cgXShift || 0}%</strong></div>
                <div>横轴偏离 (Y Shift): <strong style={{ color: '#fff' }}>{activeContainer.stats.cgYShift || 0}%</strong></div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  marginTop: '4px', 
                  fontWeight: '600', 
                  color: getWeightStatusLabel(activeContainer.stats.cgXShift || 0, activeContainer.stats.cgYShift || 0).color 
                }}>
                  {getWeightStatusLabel(activeContainer.stats.cgXShift || 0, activeContainer.stats.cgYShift || 0).label}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--color-muted)', gap: '12px' }}>
          <Box size={32} style={{ opacity: 0.4 }} />
          <span style={{ fontSize: '0.8rem' }}>无可用装载结果</span>
        </div>
      )}

      {/* Unpacked Remainder Notice */}
      {unpackedCount > 0 && (
        <div className="panel-section glass-panel" style={{ borderColor: 'var(--color-danger)' }}>
          <h3 className="panel-header" style={{ color: 'var(--color-danger)' }}>
            <span>待处理未装箱件</span>
            <ShieldAlert size={18} />
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#fda4af', marginTop: '4px' }}>
            检测到有 <strong>{unpackedCount}</strong> 件货物因重量或极端尺寸超出当前任何集装箱空间限制，无法成功装入。
          </p>
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '4px' }}>
            建议：切换为容量更大的 40HQ 柜型，或者调配第二个柜子。
          </span>
        </div>
      )}
    </div>
  );
}
