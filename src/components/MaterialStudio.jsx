import React from 'react';
import mockData from '../mockData';
import ChairSVG from './ChairSVG';

const MaterialStudio = ({
  lang,
  selectedFabric,
  selectedLeg,
  configuratorCrib5Blocked,
  handleFabricSelect,
  handleLegSelect
}) => {
  const selectedFabObj = mockData.fabrics.find(f => f.id === selectedFabric);

  return (
    <div className="material-studio-card animate-fade-in">
      <div className="material-studio-headline">
        🌿 {lang === "Cn" ? "Crafton 高端面料與金屬工藝定製工坊" : "Crafton Premium Material & Finishes Configurator"}
      </div>
      
      <div className="swatch-configurator-box">
        {/* Left Column: Interactive Vector Blueprint */}
        <div className="blueprint-board" style={{ height: '240px', background: '#F8F6F2', position: 'relative' }}>
          <span className="blueprint-title-tag">Bespoke Configurator V1.0</span>
          <ChairSVG 
            fabricId={selectedFabric} 
            legId={selectedLeg} 
            animateStyle={configuratorCrib5Blocked ? { outline: '2px dashed #A68480', outlineOffset: '4px' } : {}} 
          />
          {configuratorCrib5Blocked && (
            <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(166, 132, 128, 0.95)', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.68rem', letterSpacing: '0.5px', border: '1px solid #FAF9F6', borderRadius: '2px', textTransform: 'uppercase' }}>
              ⚠️ CRIB 5 BANNED
            </div>
          )}
          <span className="blueprint-scale-tag">SCALE 1:10</span>
        </div>

        {/* Right Column: Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Fabric options */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {lang === "Cn" ? "1. 精選低飽和度面料庫" : "1. Select Low-Saturation Fabric"}
            </label>
            <div className="fabric-swatches-grid" style={{ marginTop: '0.4rem' }}>
              {mockData.fabrics.map(fab => {
                let textureClass = "texture-linen";
                if (fab.id === "FAB-01") textureClass = "texture-velvet";
                if (fab.id === "FAB-03") textureClass = "texture-silk";
                if (fab.id === "FAB-04") textureClass = "texture-leather";

                return (
                  <div 
                    key={fab.id} 
                    className={`fabric-card-option ${selectedFabric === fab.id ? 'selected' : ''}`}
                    onClick={() => handleFabricSelect(fab.id)}
                    title={lang === "Cn" ? fab.notesCn : fab.notesEn}
                  >
                    <div className={`swatch-preview-circle ${textureClass}`}></div>
                    <div style={{ fontSize: '0.62rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lang === "Cn" ? fab.name.split(' (')[0] : fab.name.split(' (')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leg finish options */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {lang === "Cn" ? "2. 椅腿五金 / 實木飾面" : "2. Chair Leg Finish"}
            </label>
            <div className="finishes-row">
              <button 
                className={`finish-circle-btn ${selectedLeg === 'matte-black' ? 'selected' : ''}`}
                style={{ background: '#1C1B18' }} 
                onClick={() => handleLegSelect('matte-black')}
                title="Matte Basalt Black Steel"
              ></button>
              <button 
                className={`finish-circle-btn ${selectedLeg === 'bronze' ? 'selected' : ''}`}
                style={{ background: '#A88F80' }} 
                onClick={() => handleLegSelect('bronze')}
                title="Brushed Walnut Bronze"
              ></button>
              <button 
                className={`finish-circle-btn ${selectedLeg === 'white-oak' ? 'selected' : ''}`}
                style={{ background: '#D2C9B1' }} 
                onClick={() => handleLegSelect('white-oak')}
                title="Natural White Oak Wood"
              ></button>
            </div>
          </div>

          {/* Selected feedback and CRIB 5 validation alert */}
          {selectedFabObj && (
            <div style={{ marginTop: '0.2rem', padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', fontSize: '0.72rem' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {lang === "Cn" ? `當前材質: ${selectedFabObj.name}` : `Active Swatch: ${selectedFabObj.name}`}
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                {lang === "Cn" ? selectedFabObj.notesCn : selectedFabObj.notesEn}
              </div>
              
              {/* Compliance status banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontWeight: '600', color: selectedFabObj.crib5Compatible ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                <span className={`stage-badge-dot dot-${selectedFabObj.crib5Compatible ? 'completed' : 'add-log'}`} style={{ width: '6px', height: '6px' }}></span>
                {selectedFabObj.crib5Compatible 
                  ? (lang === "Cn" ? "✓ 符合英國 Crib 5 消防阻燃法规" : "✓ UK Crib 5 Compliance Pass")
                  : (lang === "Cn" ? "✗ 警告：面料禁售！不符合 Crib 5 法规" : "✗ BANNED: Fails Crib 5 Regulation")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialStudio;
