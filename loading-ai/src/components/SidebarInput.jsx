import { useState } from 'react';
import { Plus, Trash2, Database, Upload, Layers } from 'lucide-react';
import { MOCK_PRESETS } from '../utils/mockData.js';
import { STANDARD_CONTAINERS } from '../utils/binPacking.js';
import { TRANSLATIONS } from '../utils/translations.js';

export default function SidebarInput({
  lang,
  items,
  setItems,
  containerType,
  setContainerType,
  onImportMock,
  onOpenImporter
}) {
  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  const [newSku, setNewSku] = useState('');
  const [newL, setNewL] = useState('1200');
  const [newW, setNewW] = useState('800');
  const [newH, setNewH] = useState('600');
  const [newQty, setNewQty] = useState('5');
  const [newWeight, setNewWeight] = useState('30');
  const [newGrade, setNewGrade] = useState('2'); // Medium
  const [newAllowSide, setNewAllowSide] = useState(true);
  const [newAllowUpsideDown, setNewAllowUpsideDown] = useState(true);
  const [newColor, setNewColor] = useState('#8b5cf6');

  const addManualItem = (e) => {
    e.preventDefault();
    if (!newSku.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      sku: newSku.trim(),
      skuEn: newSku.trim(), // For manually added ones, SKU En is the same
      l: parseInt(newL),
      w: Math.max(10, parseInt(newW)),
      h: Math.max(10, parseInt(newH)),
      qty: Math.max(1, parseInt(newQty)),
      weight: Math.max(1, parseInt(newWeight)),
      stackingGrade: parseInt(newGrade),
      allowSide: newAllowSide,
      allowUpsideDown: newAllowUpsideDown,
      color: newColor
    };

    setItems([...items, newItem]);
    setNewSku(''); // Clear SKU for next item
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const selectPreset = (presetId) => {
    const preset = MOCK_PRESETS.find(p => p.id === presetId);
    if (preset) {
      onImportMock(preset.items);
    }
  };

  const getStackingClass = (grade) => {
    if (grade === 3) return 'heavy';
    if (grade === 2) return 'medium';
    return 'light';
  };

  const getStackingLabel = (grade) => {
    if (grade === 3) return t('heavy');
    if (grade === 2) return t('medium');
    return t('light');
  };

  const colorsList = [
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Teal
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#a855f7', // Purple
  ];

  return (
    <div className="sidebar-left">
      {/* Container Settings */}
      <div className="panel-section glass-panel">
        <h3 className="panel-header">
          <span>{t('panel1Header')}</span>
          <Layers size={18} className="glow-text-primary" />
        </h3>
        
        <div className="form-group" style={{ marginTop: '8px' }}>
          <label>{t('containerSpecLabel')}</label>
          <select 
            className="form-input" 
            value={containerType.id} 
            onChange={(e) => {
              const selected = STANDARD_CONTAINERS.find(c => c.id === e.target.value);
              if (selected) setContainerType(selected);
            }}
          >
            {STANDARD_CONTAINERS.map(c => (
              <option key={c.id} value={c.id}>
                {(lang === 'en' ? c.nameEn : c.name) || c.name} ({c.l}×{c.w}×{c.h} mm, {lang === 'en' ? 'MaxPayload' : '载重'}:{c.maxWeight}kg)
              </option>
            ))}
            <option value="custom">{t('customContainer')}</option>
          </select>
        </div>

        {containerType.id === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            <div className="form-group">
              <label>{t('length')}</label>
              <input 
                type="number" 
                className="form-input" 
                value={containerType.l}
                onChange={(e) => setContainerType({ ...containerType, l: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>{t('width')}</label>
              <input 
                type="number" 
                className="form-input" 
                value={containerType.w}
                onChange={(e) => setContainerType({ ...containerType, w: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>{t('height')}</label>
              <input 
                type="number" 
                className="form-input" 
                value={containerType.h}
                onChange={(e) => setContainerType({ ...containerType, h: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>{t('payload')}</label>
              <input 
                type="number" 
                className="form-input" 
                value={containerType.maxWeight}
                onChange={(e) => setContainerType({ ...containerType, maxWeight: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Preset Packages */}
      <div className="panel-section glass-panel">
        <h3 className="panel-header">
          <span>{t('panel2Header')}</span>
          <Database size={18} className="glow-text-secondary" />
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '4px' }}>
          {t('presetSub')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {MOCK_PRESETS.map(preset => (
            <button 
              key={preset.id} 
              className="preset-tag" 
              onClick={() => selectPreset(preset.id)}
              style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                  {lang === 'en' ? preset.nameEn : preset.name}
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', display: 'block', marginTop: '2px', lineHeight: '1.2' }}>
                  {lang === 'en' ? preset.descriptionEn : preset.description}
                </span>
              </div>
            </button>
          ))}
        </div>
        <button 
          className="btn-secondary" 
          onClick={onOpenImporter} 
          style={{ width: '100%', marginTop: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
        >
          <Upload size={14} /> {t('batchImport')}
        </button>
      </div>

      {/* Manual Input Form */}
      <form className="panel-section glass-panel" onSubmit={addManualItem}>
        <h3 className="panel-header">
          <span>{t('panel3Header')}</span>
          <Plus size={18} className="glow-text-primary" />
        </h3>

        <div className="form-group">
          <label>{t('skuName')}</label>
          <input 
            type="text" 
            placeholder={t('skuPlaceholder')} 
            className="form-input" 
            value={newSku} 
            onChange={(e) => setNewSku(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <div className="form-group">
            <label>{lang === 'en' ? 'L (mm)' : '长 (L, mm)'}</label>
            <input type="number" className="form-input" value={newL} onChange={(e) => setNewL(e.target.value)} />
          </div>
          <div className="form-group">
            <label>{lang === 'en' ? 'W (mm)' : '宽 (W, mm)'}</label>
            <input type="number" className="form-input" value={newW} onChange={(e) => setNewW(e.target.value)} />
          </div>
          <div className="form-group">
            <label>{lang === 'en' ? 'H (mm)' : '高 (H, mm)'}</label>
            <input type="number" className="form-input" value={newH} onChange={(e) => setNewH(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="form-group">
            <label>{t('packingQty')}</label>
            <input type="number" className="form-input" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('unitWeight')}</label>
            <input type="number" className="form-input" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '8px' }}>
          <div className="form-group">
            <label>{t('stackingPriority')}</label>
            <select className="form-input" value={newGrade} onChange={(e) => setNewGrade(e.target.value)}>
              <option value="3">{t('heavyBottom')}</option>
              <option value="2">{t('mediumMiddle')}</option>
              <option value="1">{t('lightTop')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t('skuColor')}</label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input 
                type="color" 
                value={newColor} 
                onChange={(e) => setNewColor(e.target.value)} 
                style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                {colorsList.map(c => (
                  <span 
                    key={c} 
                    onClick={() => setNewColor(c)}
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: c, 
                      cursor: 'pointer',
                      border: newColor === c ? '1px solid #fff' : 'none'
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Orientation checkboxes */}
        <div style={{ display: 'flex', gap: '12px', margin: '4px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={newAllowSide} onChange={(e) => setNewAllowSide(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
            {t('allowSide')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={newAllowUpsideDown} onChange={(e) => setNewAllowUpsideDown(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
            {t('allowFlip')}
          </label>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          <Plus size={16} /> {t('addItemBtn')}
        </button>
      </form>

      {/* Cargo List Display */}
      <div className="panel-section glass-panel" style={{ flex: 1, minHeight: '200px', overflowY: 'auto' }}>
        <h3 className="panel-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
          <span>{t('cargoListTitle')} ({items.length} {t('cargoTypes')})</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600' }}>
            {t('cargoTotal')}: {items.reduce((sum, item) => sum + parseInt(item.qty || 0), 0)} {t('cargoPcs')}
          </span>
        </h3>

        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted)', padding: '24px 0', gap: '8px' }}>
            <Database size={24} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '0.8rem' }}>{t('emptyCargo')}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {items.map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '8px', 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: 'var(--radius-sm)',
                  position: 'relative'
                }}
              >
                {/* Left colored tag */}
                <div style={{ width: '4px', height: '80%', background: item.color, position: 'absolute', left: 0, borderRadius: '2px' }} />
                
                <div style={{ paddingLeft: '8px', flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                    {lang === 'en' ? (item.skuEn || item.sku) : item.sku}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                    {item.l}×{item.w}×{item.h} mm | {item.weight}kg | {item.qty}{t('cargoPcs')}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span className={`badge-grade ${getStackingClass(item.stackingGrade)}`}>
                      {getStackingLabel(item.stackingGrade)}
                    </span>
                    {!item.allowSide && <span style={{ fontSize: '0.65rem', color: '#fda4af', padding: '1px 4px', background: 'rgba(225,29,72,0.1)', borderRadius: '3px', border: '1px solid rgba(225,29,72,0.2)' }}>{t('noSide')}</span>}
                    {!item.allowUpsideDown && <span style={{ fontSize: '0.65rem', color: '#fde047', padding: '1px 4px', background: 'rgba(234,88,12,0.1)', borderRadius: '3px', border: '1px solid rgba(234,88,12,0.2)' }}>{t('noFlip')}</span>}
                  </div>
                </div>

                <button 
                  onClick={() => deleteItem(item.id)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: '4px' }}
                  title="Delete"
                >
                  <Trash2 size={14} className="hover-red" style={{ transition: 'color var(--transition-fast)' }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
