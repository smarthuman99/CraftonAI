import { useState } from 'react';
import { X, Clipboard, RefreshCw, AlertCircle } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations.js';

const MAPPING_SCHEMA = {
  sku: 'SKU_Name',
  l: 'Length_MM',
  w: 'Width_MM',
  h: 'Height_MM',
  qty: 'Quantity',
  weight: 'Weight_KG',
  grade: 'Load_Bearing_Grade'
};

let importCounter = 0;

const getRandomColor = () => {
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#a855f7'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function LarkImporter({ lang, isOpen, onClose, onImport }) {
  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'lark'
  const [pasteData, setPasteData] = useState('');
  const [larkAppId, setLarkAppId] = useState('cli_a281ff928ef0100d');
  const [larkTableId, setLarkAppTableId] = useState('tbl_Mck3819Ejsa8d02d');
  const [isLarkLoading, setIsLarkLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Sample TSV data to show the user how to paste
  const tsvPlaceholder = lang === 'en'
    ? `SKU Name\tLength(mm)\tWidth(mm)\tHeight(mm)\tQuantity\tWeight(kg)\tStacking(3Heavy/2Medium/1Light)
Walnut Large Wardrobe\t2000\t600\t800\t4\t45\t3
Fabric Sofa 3-Seater\t1800\t900\t850\t2\t60\t1
European Bed Headboard\t1100\t1000\t150\t2\t18\t2
Mattress Moisture Pad\t2000\t1500\t50\t10\t5\t1`
    : `SKU 名称\t长度(mm)\t宽度(mm)\t高度(mm)\t数量\t重量(kg)\t承重(3重/2中/1轻)
胡桃木大衣柜\t2000\t600\t800\t4\t45\t3
布艺沙发三人座\t1800\t900\t850\t2\t60\t1
欧式床头架\t1100\t1000\t150\t2\t18\t2
床褥防潮垫\t2000\t1500\t50\t10\t5\t1`;

  // Parse TSV/Excel data
  const handleParseText = () => {
    try {
      if (!pasteData.trim()) {
        setErrorMessage(t('emptyError'));
        return;
      }

      const rows = pasteData.trim().split('\n');
      const parsedItems = [];

      // Check if first row is a header
      let startIdx = 0;
      const firstRow = rows[0].toLowerCase();
      if (firstRow.includes('sku') || firstRow.includes('名称') || firstRow.includes('长') || firstRow.includes('size')) {
        startIdx = 1;
      }

      for (let i = startIdx; i < rows.length; i++) {
        const cols = rows[i].split('\t');
        if (cols.length < 5) continue; // Must have SKU, L, W, H, Qty

        const sku = cols[0].trim();
        const l = parseInt(cols[1]);
        const w = parseInt(cols[2]);
        const h = parseInt(cols[3]);
        const qty = parseInt(cols[4]);
        const weight = cols[5] ? parseInt(cols[5]) : 20;
        const grade = cols[6] ? parseInt(cols[6]) : 2;

        if (sku && !isNaN(l) && !isNaN(w) && !isNaN(h) && !isNaN(qty)) {
          parsedItems.push({
            id: `tsv-${importCounter++}-${i}`,
            sku,
            skuEn: sku, // For pasted items, SKU En is the pasted name
            l,
            w,
            h,
            qty,
            weight,
            stackingGrade: [1, 2, 3].includes(grade) ? grade : 2,
            allowSide: true,
            allowUpsideDown: true,
            color: getRandomColor()
          });
        }
      }

      if (parsedItems.length === 0) {
        setErrorMessage(t('parseError'));
        return;
      }

      onImport(parsedItems);
      onClose();
    } catch (e) {
      setErrorMessage(lang === 'en' ? ('Parse failed: ' + e.message) : ('解析失败: ' + e.message));
    }
  };

  // Mock pulling data from Lark Base (飞书多维表格)
  const handleLarkFetch = () => {
    setIsLarkLoading(true);
    setErrorMessage('');
    
    // Simulate API fetch delay
    setTimeout(() => {
      setIsLarkLoading(false);
      
      // Mock Lark API response items (A high-quality furniture packing dataset)
      const mockLarkRecords = lang === 'en' ? [
        { id: 'lk-1', sku: 'Lark-Sintered Dining Table (1.6m)', skuEn: 'Lark-Sintered Dining Table (1.6m)', l: 1600, w: 800, h: 750, qty: 1, weight: 110, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#ef4444' },
        { id: 'lk-2', sku: 'Lark-Tech Leather Chair', skuEn: 'Lark-Tech Leather Chair', l: 580, w: 580, h: 900, qty: 6, weight: 10, stackingGrade: 2, allowSide: true, allowUpsideDown: false, color: '#8b5cf6' },
        { id: 'lk-3', sku: 'Lark-Sectional Sofa Box A', skuEn: 'Lark-Sectional Sofa Box A', l: 1500, w: 1000, h: 800, qty: 2, weight: 65, stackingGrade: 1, allowSide: false, allowUpsideDown: false, color: '#f59e0b' },
        { id: 'lk-4', sku: 'Lark-Sectional Sofa Box B', skuEn: 'Lark-Sectional Sofa Box B', l: 1000, w: 1000, h: 800, qty: 1, weight: 45, stackingGrade: 1, allowSide: false, allowUpsideDown: false, color: '#ec4899' },
        { id: 'lk-5', sku: 'Lark-Chinese Elm Bed Support Rails', skuEn: 'Lark-Chinese Elm Bed Support Rails', l: 2000, w: 300, h: 250, qty: 4, weight: 28, stackingGrade: 3, allowSide: true, allowUpsideDown: true, color: '#10b981' },
        { id: 'lk-6', sku: 'Lark-Bespoke Wardrobe Drawer Board', skuEn: 'Lark-Bespoke Wardrobe Drawer Board', l: 800, w: 550, h: 400, qty: 8, weight: 14, stackingGrade: 2, allowSide: true, allowUpsideDown: true, color: '#06b6d4' }
      ] : [
        { id: 'lk-1', sku: '飞书同步-岩板餐桌 (1.6m)', skuEn: 'Lark-Sintered Dining Table (1.6m)', l: 1600, w: 800, h: 750, qty: 1, weight: 110, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#ef4444' },
        { id: 'lk-2', sku: '飞书同步-科技皮椅', skuEn: 'Lark-Tech Leather Chair', l: 580, w: 580, h: 900, qty: 6, weight: 10, stackingGrade: 2, allowSide: true, allowUpsideDown: false, color: '#8b5cf6' },
        { id: 'lk-3', sku: '飞书同步-转角布艺沙发 (A箱)', skuEn: 'Lark-Sectional Sofa Box A', l: 1500, w: 1000, h: 800, qty: 2, weight: 65, stackingGrade: 1, allowSide: false, allowUpsideDown: false, color: '#f59e0b' },
        { id: 'lk-4', sku: '飞书同步-转角布艺沙发 (B箱)', skuEn: 'Lark-Sectional Sofa Box B', l: 1000, w: 1000, h: 800, qty: 1, weight: 45, stackingGrade: 1, allowSide: false, allowUpsideDown: false, color: '#ec4899' },
        { id: 'lk-5', sku: '飞书同步-中式榆木床底梁', skuEn: 'Lark-Chinese Elm Bed Support Rails', l: 2000, w: 300, h: 250, qty: 4, weight: 28, stackingGrade: 3, allowSide: true, allowUpsideDown: true, color: '#10b981' },
        { id: 'lk-6', sku: '飞书同步-定制衣柜拼装抽屉板', skuEn: 'Lark-Bespoke Wardrobe Drawer Board', l: 800, w: 550, h: 400, qty: 8, weight: 14, stackingGrade: 2, allowSide: true, allowUpsideDown: true, color: '#06b6d4' }
      ];

      onImport(mockLarkRecords);
      onClose();
    }, 1500);
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(0,0,0,0.6)', 
        backdropFilter: 'blur(10px)', 
        zIndex: 100, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <div 
        className="glass-panel" 
        style={{ 
          width: '92vw',
          maxWidth: '560px', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          borderColor: 'rgba(255,255,255,0.15)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>{t('importTitle')}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{t('importSubtitle')}</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={18} className="hover-red" />
          </button>
        </div>

        {/* Tab Selectors */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <button 
            onClick={() => setActiveTab('text')}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: 'var(--radius-sm)', 
              border: 'none', 
              background: activeTab === 'text' ? 'var(--color-primary)' : 'transparent',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)'
            }}
          >
            {t('tabExcel')}
          </button>
          <button 
            onClick={() => setActiveTab('lark')}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: 'var(--radius-sm)', 
              border: 'none', 
              background: activeTab === 'lark' ? 'var(--color-primary)' : 'transparent',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)'
            }}
          >
            {t('tabLark')}
          </button>
        </div>

        {/* Errors */}
        {errorMessage && (
          <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.8rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Text / TSV Excel paste */}
        {activeTab === 'text' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                {t('pasteLabel')}
              </label>
              <button 
                onClick={() => setPasteData(tsvPlaceholder)} 
                className="preset-tag" 
                style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                type="button"
              >
                <Clipboard size={10} /> {t('loadTemplate')}
              </button>
            </div>
            
            <textarea 
              style={{ 
                width: '100%', 
                height: '180px', 
                background: 'rgba(0,0,0,0.4)', 
                border: '1px solid var(--border-light)', 
                borderRadius: 'var(--radius-md)', 
                color: '#fff', 
                padding: '12px', 
                fontSize: '0.8rem', 
                fontFamily: 'var(--font-mono)',
                resize: 'none'
              }}
              placeholder={t('pastePlaceholder')}
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
            />
            
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--color-muted)', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <span>💡</span>
              <span>{t('importNote')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button className="btn-secondary" onClick={onClose} type="button">{t('cancel')}</button>
              <button className="btn-primary" onClick={handleParseText} type="button">
                {t('confirmImport')}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Lark Base API simulation */}
        {activeTab === 'lark' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              {t('larkNotice')}
            </p>

            <div className="form-group">
              <label>{t('appIdLabel')}</label>
              <input 
                type="text" 
                className="form-input" 
                value={larkAppId} 
                onChange={(e) => setLarkAppId(e.target.value)} 
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div className="form-group">
              <label>{t('tableIdLabel')}</label>
              <input 
                type="text" 
                className="form-input" 
                value={larkTableId} 
                onChange={(e) => setLarkAppTableId(e.target.value)} 
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
                📖 {t('schemaMapping')}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                {Object.entries(MAPPING_SCHEMA).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--color-muted)' }}>{key}:</span>
                    <span style={{ color: 'var(--color-secondary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button className="btn-secondary" onClick={onClose} disabled={isLarkLoading} type="button">{t('cancel')}</button>
              <button 
                className="btn-primary" 
                onClick={handleLarkFetch} 
                disabled={isLarkLoading}
                style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, #0891b2) 100%', minWidth: '150px' }}
                type="button"
              >
                {isLarkLoading ? (
                  <>
                    <RefreshCw size={14} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                    {t('larkFetchLoading')}
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    {t('larkFetchBtn')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Inline styles for spinner rotation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
