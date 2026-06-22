��/**
 * Crafton AI - Premium Interactive React Prototype Engine
 * Dual-Facing: (1) Client Website & Portal (2) Internal Backoffice & OpenClaw Console
 */

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import mockData from './mockData';

// Inject into window for backward compatibility with legacy prototype code
window.supabase = { createClient };

// Initialize Supabase from localStorage
const savedUrl = localStorage.getItem("supabase_url") || "";
const savedKey = localStorage.getItem("supabase_key") || "";
let supabaseClient = null;

if (savedUrl && savedKey && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(savedUrl, savedKey);
  } catch (err) {
    console.error("Supabase initialization error:", err);
  }
}

const getLogActionEn = (cnText) => {
  if (!cnText) return "";
  
  // 1. Check exact match in mockData.changeLogs
  const match = mockData.changeLogs.find(cl => cl.action === cnText);
  if (match && match.actionEn) return match.actionEn;
  
  // 2. Check other known exact matches
  const exactTranslations = {
    "��� ȓ�I�͓���Rx�
VOM5pB%sr��6l�N��\VeZ��]�j/u�Q� ?: "Tech specifications and BOM approved, signed off.",
    "��� t�d��͓|QImx�
VOM5pB%sr��6l�N��\VeZ��]�j/u�Q� ?: "Tech specifications and BOM approved, signed off.",
    "��`lrY��]���,lm9p!2�W�~�����`lr�tBZ�Z�}\G_Z?��CZ�X��+[*�x�?�[CO*\Q��r� �P�fU��f�Y�~3l�uU�k�VU��fxV�~Ki}i;j��[�Ssr���?m,�� ?: "Site feedback: Cancelled 2 Armchairs & 1 Table due to fitout changes. Auto strike-through recalculation initiated.",
    "CRIB 5 ��QV�Y!2/��o��}f�1l�x�~,��v�~�pj��Q�^p�0ye�~���]/�tEZ�X��V�y�[��}CRIB 5 BLOCKED�?: "CRIB 5 Flammability Test Failed: Pure Silk Satin fire-retardant coating shrinkage and discoloration rate out of tolerance (CRIB 5 BLOCKED)",
    "CRIB 5 ��QV�Y!2/�Z�Xxr�1lO�Hr�kǕ?0�~�c�S�C%�`w�F�2U�WRIB 5 PASSED�?: "CRIB 5 Flammability Test Passed: Flame self-extinguished physically within 10 seconds of exposure (CRIB 5 PASSED)",
    "e��mG0Q��T[_`����t͓���紓,a�Y�<kPPC��_@c�tY�i��yOcc�nuek�^S�g��}O���~^S�g4d�_�Wϔ�q�zw���}100% MATCH�?: "Four export compliance documents verified successfully: IPPC fumigation certificate, Customs declaration, Packing lists match perfectly (100% MATCH)",
    "˕oT0m�t�V�g]�X{���d�[9p�\�f�KkHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51": "Project archive hashed and packaged: SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51",
    "�Y!2/�R�nb!c"2 ��B	{Z�#X���|\�z���W[m���mpokdP�@k-4410 (4Z�u�|���]=|yi?": "Detected critical non-compliance on Silk. Swapped fabric to: L-4410 (Navy Classic Linen) with one click.",
    ""��q�WPDFUt�_xrǓi�}O�(1�VU��f�"�?SMTP ��xQ"k�0�jw�?3 9p5�pRZ�bO�[�r� ?: "Generated PDF specification sheet, automatically calling SMTP to dispatch RFQs to 3 target factories."
  };
  
  if (exactTranslations[cnText]) {
    return exactTranslations[cnText];
  }
  
  // 3. Dynamic templates (Crib 5 Override and supplier selections)
  if (cnText.includes("�m��|e�B%�gZ�#XI��-l[m��$2pok�")) {
    const matchFabric = cnText.match(/Ǔc2]ȕ!2�g�m�{s*(\S+)/);
    const code = matchFabric ? matchFabric[1] : "FAB-02";
    return `Bypassed Crib 5: Changed fabric to ${code} (Navy Classic Linen), successfully overriding gate.`;
  }
  
  if (cnText.includes("�Y�e�s9p~\�W���P6n%X� 
Y~u`mE�OX�?")) {
    const matchSupplier = cnText.match(/ȓ� %X� 
Y~u`mE�OX�?\s*([^��[+)/);
    const matchPrice = cnText.match(/W��f�s͓?z~u�m�{s*\$?([0-9.]+)/);
    const sName = matchSupplier ? matchSupplier[1] : "selected supplier";
    const sPrice = matchPrice ? matchPrice[1] : "195";
    return `Supplier bidding finalized. Factory selected: ${sName}. Lobby Armchair set to $${sPrice}/pc.`;
  }
  
  return cnText; // Fallback
};

function App() {
  const [currentView, setCurrentStageView] = useState("Marketing"); // Views: "Marketing", "Backoffice", "ClientPortal"
  const [lang, setLang] = useState("Cn"); // Language: "Cn" or "En"
  const [currentStageIndex, setCurrentStageIndex] = useState(0); // S01 to S17
  const [order, setOrder] = useState(JSON.parse(JSON.stringify(mockData.initialOrder)));
  const [logs, setLogs] = useState(JSON.parse(JSON.stringify(mockData.changeLogs)));
  const [chatMessages, setChatMessages] = useState([
    { sender: "client", text: "Hi, need 40 lobby armchairs and 20 club chairs for St Albans lobby. Blue style. Must pass UK fire safety." }
  ]);
  const [inputText, setInputText] = useState("");
  const [isBiddingDone, setIsBiddingDone] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [fabricCompatibilityTest, setFabricCompatibilityTest] = useState(null); // null, 'passed', 'blocked'
  const [splitDeliveryActive, setSplitDeliveryActive] = useState(false);
  const [isCrib5Blocked, setIsCrib5Blocked] = useState(false);
  const terminalEndRef = useRef(null);

  // Material Studio Swatch Configurator States
  const [selectedFabric, setSelectedFabric] = useState("FAB-02"); // default Navy Classic Linen
  const [selectedLeg, setSelectedLeg] = useState("matte-black"); // default Matte Black Steel
  const [configuratorCrib5Blocked, setConfiguratorCrib5Blocked] = useState(false);

  // Interactive Playgrounds State Variables
  const [signatureApproved, setSignatureApproved] = useState(false);
  const [crib5TestStatus, setCrib5TestStatus] = useState("idle"); // 'idle', 'running', 'passed', 'failed'
  const [crib5Progress, setCrib5Progress] = useState(0);
  const [rfqDispatched, setRfqDispatched] = useState(false);
  const [docAudited, setDocAudited] = useState(false);
  const [archiveHashed, setArchiveHashed] = useState(false);
  const [showVolumetricSimulation, setShowVolumetricSimulation] = useState(false);


  // =====================================================================
  // CRAFTON AI - LOW SATURATION VECTOR RENDERS & STAGE PLAYGROUNDS
  // =====================================================================

  const renderChairSVG = (fabricId, legId, animateStyle = {}) => {
    let cushionColor = '#BAC2B9'; // Linen default (FAB-02)
    if (fabricId === 'FAB-01') cushionColor = '#8C99A4'; // Velvet
    if (fabricId === 'FAB-03') cushionColor = '#DFDCD6'; // Silk
    if (fabricId === 'FAB-04') cushionColor = '#5C534C'; // Leather

    let legsColor = '#1C1B18'; // Black default
    if (legId === 'bronze') legsColor = '#A88F80';
    if (legId === 'white-oak') legsColor = '#D2C9B1';

    return (
      <svg viewBox="0 0 200 200" width="100%" height="220" style={{ stroke: '#5C534C', strokeWidth: '1.2', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', ...animateStyle }}>
        {/* Chair Backrest */}
        <path d="M 60,60 L 140,60 Q 148,60 148,68 L 148,110 L 52,110 L 52,68 Q 52,60 60,60 Z" style={{ fill: cushionColor, transition: 'fill 0.5s' }} />
        
        {/* Chair Cushion */}
        <rect x="46" y="110" width="108" height="24" rx="4" style={{ fill: cushionColor, strokeWidth: '1.4', transition: 'fill 0.5s' }} />
        
        {/* Chair Arms */}
        <path d="M 46,104 L 38,104 C 34,104 34,124 34,124 L 46,124 Z" style={{ fill: cushionColor, transition: 'fill 0.5s' }} />
        <path d="M 154,104 L 162,104 C 166,104 166,124 166,124 L 154,124 Z" style={{ fill: cushionColor, transition: 'fill 0.5s' }} />

        {/* Chair Legs */}
        <line x1="56" y1="134" x2="42" y2="176" style={{ stroke: legsColor, strokeWidth: '2.5', transition: 'stroke 0.5s' }} />
        <line x1="144" y1="134" x2="158" y2="176" style={{ stroke: legsColor, strokeWidth: '2.5', transition: 'stroke 0.5s' }} />
        <line x1="68" y1="134" x2="72" y2="170" style={{ stroke: legsColor, strokeWidth: '1.8', opacity: 0.7, transition: 'stroke 0.5s' }} />
        <line x1="132" y1="134" x2="128" y2="170" style={{ stroke: legsColor, strokeWidth: '1.8', opacity: 0.7, transition: 'stroke 0.5s' }} />

        {/* Structural crossbar */}
        <line x1="42" y1="165" x2="158" y2="165" style={{ stroke: legsColor, strokeWidth: '1.2', transition: 'stroke 0.5s' }} />
      </svg>
    );
  };

  const handleFabricSelect = async (fabId) => {
    setSelectedFabric(fabId);
    const isSilk = fabId === 'FAB-03';
    setConfiguratorCrib5Blocked(isSilk);
    
    if (dbConnected && order.id) {
      try {
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));
        await client.from("projects").update({ 
          selected_fabric: fabId,
          is_crib5_blocked: isSilk,
          fabric_compatibility_test: isSilk ? "blocked" : "passed"
        }).eq("id", order.id);
      } catch (err) {
        console.error("Supabase fabric sync error:", err);
      }
    }
  };

  const handleLegSelect = async (legId) => {
    setSelectedLeg(legId);
    if (dbConnected && order.id) {
      try {
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));
        await client.from("projects").update({ selected_leg: legId }).eq("id", order.id);
      } catch (err) {
        console.error("Supabase leg sync error:", err);
      }
    }
  };

  const renderMaterialStudio = () => {
    const selectedFabObj = mockData.fabrics.find(f => f.id === selectedFabric);
    return (
      <div className="material-studio-card animate-fade-in">
        <div className="material-studio-headline">
          ��6\ {lang === "Cn" ? "Crafton Bi<jl�ȕ!2�gx��V~V^p�O���o~uAtɅOg�? : "Crafton Premium Material & Finishes Configurator"}
        </div>
        
        <div className="swatch-configurator-box">
          {/* Left Column: Interactive Vector Blueprint */}
          <div className="blueprint-board" style={{ height: '240px', background: '#F8F6F2' }}>
            <span className="blueprint-title-tag">Bespoke Configurator V1.0</span>
            {renderChairSVG(selectedFabric, selectedLeg, configuratorCrib5Blocked ? { outline: '2px dashed #A68480', outlineOffset: '4px' } : {})}
            {configuratorCrib5Blocked && (
              <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(166, 132, 128, 0.95)', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.68rem', letterSpacing: '0.5px', border: '1px solid #FAF9F6', borderRadius: '2px', textTransform: 'uppercase' }}>
                ?��r{ CRIB 5 BANNED
              </div>
            )}
            <span className="blueprint-scale-tag">SCALE 1:10</span>
          </div>

          {/* Right Column: Choices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Fabric options */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {lang === "Cn" ? "1. �~C�Ocm�^�\�}\�[ȕ!2�g4d? : "1. Select Low-Saturation Fabric"}
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
                {lang === "Cn" ? "2. �YpTT\m�e~V / 5p=�jniC�po" : "2. Chair Leg Finish"}
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
            <div style={{ marginTop: '0.2rem', padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', fontSize: '0.72rem' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {lang === "Cn" ? `#����Xɓ/a1U: ${selectedFabObj.name}` : `Active Swatch: ${selectedFabObj.name}`}
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                {lang === "Cn" ? selectedFabObj.notesCn : selectedFabObj.notesEn}
              </div>
              
              {/* Compliance status banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontWeight: '600', color: selectedFabObj.crib5Compatible ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                <span className={`stage-badge-dot dot-${selectedFabObj.crib5Compatible ? 'completed' : 'add-log'}`} style={{ width: '6px', height: '6px' }}></span>
                {selectedFabObj.crib5Compatible 
                  ? (lang === "Cn" ? "A�?�~@��`{�^SEn Crib 5 Z%X�iÕd�gV	Z�f��" : "A�?UK Crib 5 Compliance Pass")
                  : (lang === "Cn" ? "A�?�t@��a�6lpok��^���}�m�]��Z�?Crib 5 	Z�f��" : "A�?BANNED: Fails Crib 5 Regulation")}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleStartCrib5Test = () => {
    setCrib5TestStatus("running");
    setCrib5Progress(0);
    const interval = setInterval(() => {
      setCrib5Progress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          if (selectedFabric === "FAB-03") {
            setCrib5TestStatus("failed");
            addLog("System", "CRIB 5 ��QV�Y!2/��o��}f�1l�x�~,��v�~�pj��Q�^p�0ye�~���]/�tEZ�X��V�y�[��}CRIB 5 BLOCKED�?, "CRIB 5 Flammability Test Failed: Pure Silk Satin fire-retardant coating shrinkage and discoloration rate out of tolerance (CRIB 5 BLOCKED)");
          } else {
            setCrib5TestStatus("passed");
            addLog("System", "CRIB 5 ��QV�Y!2/�Z�Xxr�1lO�Hr�kǕ?0�~�c�S�C%�`w�F�2U�WRIB 5 PASSED�?, "CRIB 5 Flammability Test Passed: Flame self-extinguished physically within 10 seconds of exposure (CRIB 5 PASSED)");
          }
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleDocumentAudit = () => {
    setDocAudited(true);
    addLog("System", "e��mG0Q��T[_`����t͓���紓,a�Y�<kPPC��_@c�tY�i��yOcc�nuek�^S�g��}O���~^S�g4d�_�Wϔ�q�zw���}100% MATCH�?, "Four export compliance documents verified successfully: IPPC fumigation certificate, Customs declaration, Packing lists match perfectly (100% MATCH)");
  };

  const handleCryptographicArchive = () => {
    setArchiveHashed(true);
    addLog("System", "˕oT0m�t�V�g]�X{���d�[9p�\�f�KkHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51", "Project archive hashed and packaged: SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51");
  };

  const renderInteractivePlayground = () => {
    const stageId = currentStage.id;

    // 1. S01, S02, S03, S04: CAD Drafting and Approvals
    if (stageId === "S01" || stageId === "S02" || stageId === "S03" || stageId === "S04") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>
            <div className="panel-title">��;d {lang === "Cn" ? "�ma��Zƕkns CAD ��� t�d�hf�,h��͓|QIm" : "Bilingual CAD Technical Specs"}</div>
            <span className="logo-badge" style={{ color: 'var(--accent-primary)' }}>AUTO-DRAFTED</span>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div className="blueprint-board">
              <span className="blueprint-title-tag">
                {stageId === "S01" ? "S01: Intake Draft" : stageId === "S02" ? "S02: Attributes Query" : stageId === "S03" ? "S03: Spec Ready" : "S04: Approved BOM"}
              </span>
              
              {/* Dimensions Layout */}
              <div style={{ position: 'absolute', top: '40px', left: '46px', right: '46px', height: '1px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', top: '35px', left: '46px', width: '1px', height: '10px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', top: '35px', right: '46px', width: '1px', height: '10px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: 'var(--text-secondary)', background: '#FAF9F6', padding: '0 4px', fontFamily: 'monospace' }}>W: 650mm dS5mm</div>

              <div style={{ position: 'absolute', top: '60px', right: '25px', bottom: '66px', width: '1px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', top: '60px', right: '20px', height: '1px', width: '10px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', bottom: '66px', right: '20px', height: '1px', width: '10px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: '0.65rem', color: 'var(--text-secondary)', background: '#FAF9F6', padding: '0 4px', fontFamily: 'monospace' }}>H: 850mm</div>

              {renderChairSVG(selectedFabric, selectedLeg)}

              {/* Glowing Hotspots */}
              <div className="hotspot-marker" style={{ top: '110px', left: '100px' }}>
                <div className="hotspot-tooltip">
                  <strong>{lang === "Cn" ? "4dC�[�o���SUt�_xr" : "Cushion Padding"}</strong><br/>
                  {lang === "Cn" ? "35kg/m��Bi:jm0�#X�N�Y)1�S4ZΘ�r�}\�[AtR_�i����R�~�T�z��\	zY�?0����Y�@i��$��c�ZZ�%��? : "35kg/m�� high-resilience PU foam wrapped in fire barrier, passes 100k cycles durability."}
                </div>
              </div>

              <div className="hotspot-marker" style={{ top: '165px', left: '50px' }}>
                <div className="hotspot-tooltip">
                  <strong>{lang === "Cn" ? "�YpTT�[�0�h" : "Leg Structure"}</strong><br/>
                  {lang === "Cn" ? "2.5mm�oxO$^P��u�|���]�$��wx}t)1po basalt �~'1r�i&b�i���V�xȕ�nUmc�Qg冒? : "2.5mm heavy-gauge cold steel frame, matte Basalt Black fingerprint-proof electrostatic coating."}
                </div>
              </div>

              <div className="hotspot-marker" style={{ top: '70px', left: '135px' }}>
                <div className="hotspot-tooltip">
                  <strong>{lang === "Cn" ? "ȕ�rQL�PcW�x��V�S�[? : "Back Angle"}</strong><br/>
                  {lang === "Cn" ? "105�c\m*m�s�[�01�i�Q~V�[��iPYt�c� �P�˓AR|y�Y-[����r�S�[���k͓|Q6^R���jn dS2mm O�A� ? : "105�c ergonomic golden tilt. Frame structural welding tolerance is strictly under dS2mm."}
                </div>
              </div>

              {/* Approved Ink Signature (S04) */}
              {(signatureApproved || stageId !== "S04") && (
                <div className="signature-box">
                  <div className="signature-label">{lang === "Cn" ? "5pB%�X�~Ʌ�` / Approved by" : "Review Sign-Off"}</div>
                  <span className={`signature-font ${signatureApproved || stageId !== "S04" ? "signed" : ""}`}>Cho Chen</span>
                </div>
              )}
              
              <span className="blueprint-scale-tag">SCALE 1:12 | UNIT: MM | TOLERANCE: dS2mm</span>
            </div>

            {stageId === "S04" && !signatureApproved && (
              <button className="btn-premium" style={{ width: '100%', marginTop: '0.8rem', justifyContent: 'center' }} onClick={() => { setSignatureApproved(true); handleChoApproval(); }}>
                A��]{ {lang === "Cn" ? "��b�Q�~?�ZsUt�_xr�����\7�pAi�et? : "Review Specs & Sign-Off Block"}
              </button>
            )}
          </div>
        </div>
      );
    }

    // 2. S05: Crib 5 Test chamber
    if (stageId === "S05") {
      const selectedFabObj = mockData.fabrics.find(f => f.id === selectedFabric);
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(166, 132, 128, 0.03)' }}>
            <div className="panel-title">��_e {lang === "Cn" ? "{�^SEn Crib 5 Z%X�i��QVÕd�gVZ�%y�? : "UK Crib 5 Fire Ignition Testing Rig"}</div>
            <span className="logo-badge" style={{ color: 'var(--accent-red)' }}>COMPLIANCE GATE</span>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div className="crib5-rig">
              {renderChairSVG(selectedFabric, selectedLeg, crib5TestStatus === "running" ? { filter: 'brightness(0.9) contrast(1.1)' } : {})}
              
              {/* Flame Effect Overlay */}
              <div className={`flame-effect-layer ${crib5TestStatus === "running" ? "active" : ""}`}>
                <div className="flame-particle"></div>
                <div className="flame-inner"></div>
              </div>

              {/* Distressed Wax Stamp */}
              {crib5TestStatus === "passed" && (
                <div className="wax-stamp-overlay stamped stamp-pass">
                  Crib 5 Passed
                </div>
              )}
              {crib5TestStatus === "failed" && (
                <div className="wax-stamp-overlay stamped stamp-fail">
                  Crib 5 Blocked
                </div>
              )}

              {crib5TestStatus === "idle" && (
                <div style={{ position: 'absolute', background: 'rgba(28,27,24,0.7)', color: 'white', padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '2px', textAlign: 'center' }}>
                  {lang === "Cn" ? "�[nT/�ȕ!2�g: " : "Target Swatch: "}<strong>{selectedFabObj.name}</strong><br/>
                  <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{lang === "Cn" ? "�i�p3d�m+[�g��Y�W_��q�Z 10 �~�c���O�nbgV��c/�mt? : "Click below to initiate 10s flame test"}</span>
                </div>
              )}
            </div>

            <div className="fire-gauge-card">
              <div className="fire-gauge-row">
                <span>{lang === "Cn" ? "��QVZ�%���c�[" : "Flame Test Exposure"}</span>
                <span style={{ fontFamily: 'monospace' }}>{crib5Progress}%</span>
              </div>
              <div className="fire-progress-bar">
                <div className="fire-progress-fill" style={{ width: `${crib5Progress}%`, background: crib5TestStatus === "failed" ? 'var(--accent-red)' : 'var(--accent-green)' }}></div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>
                <button 
                  className="btn-premium" 
                  style={{ flex: 1, justifyContent: 'center' }} 
                  onClick={handleStartCrib5Test}
                  disabled={crib5TestStatus === "running"}
                >
                  ���k {lang === "Cn" ? "i��u��C%�`��QV͓����" : "Trigger Crib 5 Burn"}
                </button>
                {crib5TestStatus === "failed" && (
                  <button 
                    className="btn-secondary" 
                    style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
                    onClick={() => {
                      setSelectedFabric("FAB-02"); // auto replace with safe Linen
                      setCrib5TestStatus("idle");
                      setCrib5Progress(0);
                      addLog("Cho", "�Y!2/�R�nb!c"2 ��B	{Z�#X���|\�z���W[m���mpokdP�@k-4410 (4Z�u�|���]=|yi?", "Detected critical non-compliance on Silk. Swapped fabric to: L-4410 (Navy Classic Linen) with one click.");
                    }}
                  >
                    ��'e {lang === "Cn" ? "�m� ��8u�j�~-l[m��? : "Bypass with Linen"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. S06, S07: RFQ Dispatched and Multi-Factory Comparisons
    if (stageId === "S06" || stageId === "S07") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(255,159,67,0.03)' }}>
            <div className="panel-title">A�Y{ {lang === "Cn" ? "w�D��ZV�?RFQ ��xQ"kmt 2PQ'�xY� wOQ�G�? : "Automated RFQ Mailer Daemon"}</div>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ padding: '1rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  <span>{lang === "Cn" ? "PDF mt 2PQUt�_xrǓ?z�QOp���z" : "Specs Package Compiled"}</span>
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem' }}>SIZE: 2.4 MB</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {lang === "Cn" ? "ĕ�R"k�3kRAFT-202605-01-RFQ_Specification.pdf (/uXm~t�p��͓:{� xO�[At�o���~�]���Y?" : "Attachment: CRAFT-202605-01-RFQ_Specification.pdf (Includes bilingual CAD & volume limits)"}
                </div>
                
                {rfqDispatched && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    A�?{lang === "Cn" ? "��xQ"k�[�c�S��JT�Y���O0}cm�mS��&b�j��yO�o~��p�k9p5���Y^� �O"r�[Θ	zO�Lk�W��? : "RFQs Dispatched to 3 Partner Mills via SMTP"}
                  </div>
                )}
              </div>

              {!rfqDispatched ? (
                <button className="btn-premium" style={{ justifyContent: 'center' }} onClick={() => { setRfqDispatched(true); addLog("OpenClaw QuotationAgent", ""��q�WPDFUt�_xrǓi�}O�(1�VU��f�"�?SMTP ��xQ"k�0�jw�?3 9p5�pRZ�bO�[�r� ?, "Generated PDF specification sheet, automatically calling SMTP to dispatch RFQs to 3 target factories."); }}>
                  ��[d {lang === "Cn" ? "w�D��Z�0�jmt 2PQ��xQ"k" : "Compile & Dispatch RFQs"}
                </button>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.8rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{lang === "Cn" ? "�[�0�|Y��]��)�H�#Oc�'1�Z��6[0}" : "Factory Mail Feed Daemon:"}</strong><br/>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px', color: 'var(--accent-green)' }}>
                    <span className="stage-badge-dot dot-completed"></span>
                    {lang === "Cn" ? "cm�mS��&b�j9p���S�[?(�[�cm�o��hrM�xv0}W: $195)" : "Foshan Gold-Sun (Returned Quote: W: $195)"}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px', color: 'var(--accent-green)' }}>
                    <span className="stage-badge-dot dot-completed"></span>
                    {lang === "Cn" ? "ɓ��*^(��V���Y!�9p���S (�[�cm�o��hrM�xv0}W: $185)" : "Dongguan Royal Oak (Returned Quote: W: $185)"}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px', color: 'var(--accent-green)' }}>
                    <span className="stage-badge-dot dot-completed"></span>
                    {lang === "Cn" ? "˕�U�u�dTx��c�N9p��3w (�[�cm�o��hrM�xv0}W: $230)" : "Shunde Classic Comfort (Returned Quote: W: $230)"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 4. S08: Cho Selection Supplier layout
    if (stageId === "S08") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(255,159,67,0.05)' }}>
            <div className="panel-title" style={{ color: 'var(--accent-orange)' }}>?�5h{ {lang === "Cn" ? "�m
Y��Z�X�}`mE�O�[�r�js���.vM�pt�W˓? : "Supplier Bid Matrix & AI Analysis"}</div>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {mockData.supplierBids.map((bid, bidx) => (
              <div 
                key={bidx} 
                style={{ 
                  padding: '1rem', 
                  borderRadius: '2px', 
                  border: selectedSupplier?.name === bid.name ? '1px solid var(--text-primary)' : '1px solid var(--glass-border)', 
                  background: selectedSupplier?.name === bid.name ? '#ffffff' : 'var(--bg-primary)', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s' 
                }} 
                onClick={() => handleSelectSupplier(bid)} 
                className="glass-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <span>{bid.name}</span>
                  <span style={{ color: 'var(--accent-primary)' }}>${bid.pricePerChair}/chair</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  <span>{lang === "Cn" ? `�[�0an: ${bid.deliveryDays} �o�0 : `Lead Time: ${bid.deliveryDays} Days`}</span>
                  <span>{lang === "Cn" ? `Z�Xxr�? ${bid.qualityScore}` : `QC Score: ${bid.qualityScore}`}</span>
                  <span>{lang === "Cn" ? `�m�6�: ${bid.reliability}` : `Reliability: ${bid.reliability}`}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.4rem' }}>
                  AI �[?�)�: {bid.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 5. S09, S10: Factory QR Link & WhatsApp Follow up
    if (stageId === "S09" || stageId === "S10") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>
            <div className="panel-title">��n_ {lang === "Cn" ? "LgGZ�g��`lr�B%�g���Q�$x��VSe"� 2��œ�P�z��? : "Factory QR Flow & Realtime Progress"}</div>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', padding: '0.4rem', borderRadius: '2px' }}>
                <svg viewBox="0 0 100 100" width="80" height="80">
                  <rect x="0" y="0" width="100" height="100" fill="#FAF9F6" />
                  <rect x="10" y="10" width="25" height="25" fill="#1C1B18" />
                  <rect x="15" y="15" width="15" height="15" fill="#FAF9F6" />
                  <rect x="18" y="18" width="9" height="9" fill="#1C1B18" />
                  
                  <rect x="65" y="10" width="25" height="25" fill="#1C1B18" />
                  <rect x="70" y="15" width="15" height="15" fill="#FAF9F6" />
                  <rect x="73" y="18" width="9" height="9" fill="#1C1B18" />

                  <rect x="10" y="65" width="25" height="25" fill="#1C1B18" />
                  <rect x="15" y="70" width="15" height="15" fill="#FAF9F6" />
                  <rect x="18" y="73" width="9" height="9" fill="#1C1B18" />

                  <rect x="45" y="45" width="10" height="10" fill="#1C1B18" />
                  <rect x="55" y="65" width="15" height="10" fill="#1C1B18" />
                  <rect x="75" y="75" width="15" height="15" fill="#1C1B18" />
                </svg>
              </div>
              <div style={{ flex: 1, fontSize: '0.75rem', lineHeight: '1.4' }}>
                <strong style={{ color: 'var(--text-primary)' }}>QR: CRAFT-2026-01-ITEM01</strong><br/>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {lang === "Cn" ? "�[�0�|�[�0Il"�%1��ɓc�]���_�~wx})�X[4^~t�WG_ Supabase Op�]sV 3D �~-aP�[�0�%f�5h}ɓ�n�yLgGZ�g*�.[\f�+hyK�6l\�t#1� ? : "Workers scan this tag to fetch design drawings dynamically from Supabase. Minimizes layout errors."}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', fontSize: '0.75rem' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>
                ���k {lang === "Cn" ? "\m�0anS�E%=� 15 �o?- �i�Q�X�h)1�k�t@��a" : "Delivery Warning: 15 Days Remaining"}
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                {lang === "Cn" ? "AI �Y�_�hwt"X{u'����_��&b�j�[�0�|ȓE��[œ�P{L�k�pn��M�� �c�[��\���~^S�vw�D��Z_��q�Z WhatsApp L���纕#X�w��? : "AI model detected delays on Nansha dock scheduling. Automated WhatsApp inquiry is triggered."}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 6. S11: AI CV Inspection
    if (stageId === "S11") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(125, 143, 123, 0.05)' }}>
            <div className="panel-title" style={{ color: 'var(--accent-green)' }}>���a�?{lang === "Cn" ? "AI CV œ?�XQf�+hyx��V���E%xVZ�X.vOp? : "AI CV Photo-to-CAD Overlap Inspection"}</div>
            <span className="logo-badge" style={{ color: 'var(--accent-green)' }}>PASS 98.2%</span>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div className="cv-container">
              <div className="cv-photo" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80')" }}></div>
              <div className="cv-overlay-text">LIVE PHOTO: FOSHAN GOLD-SUN ST-01</div>
              <div className="cv-grid-line"></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.8rem' }}>
              <span>{lang === "Cn" ? "���S�}SgD�|���]�`4d?(CAD Overlay): " : "Feature Match: "}<strong style={{ color: 'var(--accent-green)' }}>98.2%</strong></span>
              <span>{lang === "Cn" ? "�YpTT$i�_�X͓JT�: " : "Color Swatch Match: "}<strong style={{ color: 'var(--accent-green)' }}>Matte Black OK</strong></span>
            </div>
          </div>
        </div>
      );
    }

    // 7. S12: Volumetric Container packing (3D Cargo)
    if (stageId === "S12") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>
            <div className="panel-title">��]d {lang === "Cn" ? "ƕ�U���~M��s�~�]^Z�Q�RV�+h{u	Z? : "3D Volumetric Container Packing Optimizer"}</div>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div className="cube-container">
              <div className="shipping-box-stacked" style={{ width: '130px', height: '110px' }}>
                Armchairs (24 CBM)
              </div>
              <div className="shipping-box-stacked" style={{ width: '80px', height: '110px', marginLeft: '5px' }}>
                Club Chairs (16 CBM)
              </div>
              <div className="shipping-box-stacked" style={{ width: '40px', height: '70px', marginLeft: '5px', alignSelf: 'flex-end', background: 'rgba(168,143,128,0.2)', borderColor: 'var(--accent-orange)' }}>
                Tables (6 CBM)
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.8rem' }}>
              <span>{lang === "Cn" ? "At�o}�~^S7p: " : "Container Type: "}<strong style={{ color: 'var(--accent-cyan)' }}>40GP Container</strong></span>
              <span>{lang === "Cn" ? "9p-W��R�C%de�? " : "Space Efficiency: "}<strong style={{ color: 'var(--accent-cyan)' }}>68.6%</strong></span>
            </div>
            <button 
              className="btn-premium" 
              style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }} 
              onClick={() => setShowVolumetricSimulation(true)}
            >
              ��3d {lang === "Cn" ? "_��q�Z 3D ���c�s�mYc��~.[�s`m�an" : "Launch Interactive 3D Packing Simulation"}
            </button>
          </div>
        </div>
      );
    }

    // 8. S13: Customs Document stamp board
    if (stageId === "S13") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>
            <div className="panel-title">��5d {lang === "Cn" ? "Q��pP�e��mG0Z�#X��`����tw�D��Z͓d��" : "Customs Credentials Ledger Verification"}</div>
            <span className="logo-badge" style={{ color: 'var(--accent-orange)' }}>COMPLIANCE</span>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }}>
              <div style={{ padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem' }}>1. {lang === "Cn" ? "5p=�jn�oF*\Q�?IPPC ��_@c�tY�i" : "IPPC Solid Wood Fumigation"}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: docAudited ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                  {docAudited ? "A�?VERIFIED" : "PENDING"}
                </span>
              </div>
              <div style={{ padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem' }}>2. {lang === "Cn" ? "��,a�g��}O���~^S�g4d�_�Wϔ�q�zw�X[� ? : "Bill of Lading Consistency Check"}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: docAudited ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                  {docAudited ? "A�?VERIFIED" : "PENDING"}
                </span>
              </div>
              <div style={{ padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem' }}>3. {lang === "Cn" ? "4Z�p�hQ��Th�k�M��h'�f��͓d�Y" : "Customs Declaration Matching"}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: docAudited ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                  {docAudited ? "A�?VERIFIED" : "PENDING"}
                </span>
              </div>

              {docAudited && (
                <div className="wax-stamp-overlay stamped stamp-pass" style={{ top: '30px', left: '100px', zIndex: 100 }}>
                  Docs Passed
                </div>
              )}

              {!docAudited && (
                <button className="btn-premium" style={{ width: '100%', marginTop: '0.4rem', justifyContent: 'center' }} onClick={handleDocumentAudit}>
                  ��m�?{lang === "Cn" ? "i��u�e��mG0`����tw�D��Z5pD%�%" : "Audit Export Documents"}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 9. S14: Maritime Vessel Map
    if (stageId === "S14") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>
            <div className="panel-title">���[ {lang === "Cn" ? "�t(1�Wf�)1� �e�|�t?(�h��i��T��œ?API)" : "Maersk Maritime API Tracking"}</div>
          </div>
          <div className="panel-body" style={{ padding: '0.8rem' }}>
            <div className="maritime-map">
              <svg width="100%" height="100%" viewBox="0 0 400 250">
                <path d="M10,80 L80,60 L120,90 L90,140 L40,160 Z" fill="#D3CECA" opacity="0.4" />
                <path d="M160,50 L200,40 L280,30 L260,80 L290,120 L230,160 Z" fill="#D3CECA" opacity="0.4" />
                <path d="M110,210 L160,220 L150,240 Z" fill="#D3CECA" opacity="0.4" />

                <path d="M260,110 C210,130 180,180 150,160 C130,140 105,100 60,60" fill="none" className="ocean-vector-path" />

                <text x="265" y="114" fontSize="7" fill="var(--text-primary)" fontWeight="bold">Nansha Port</text>
                <circle cx="260" cy="110" r="3" fill="var(--accent-orange)" />

                <text x="45" y="55" fontSize="7" fill="var(--text-primary)" fontWeight="bold">Southampton</text>
                <circle cx="60" cy="60" r="3" fill="var(--accent-green)" />

                <g transform="translate(162, 160)">
                  <circle cx="0" cy="0" r="4" fill="var(--accent-primary)" />
                  <circle cx="0" cy="0" r="8" fill="none" stroke="var(--accent-primary)" strokeWidth="1">
                    <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                </g>
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              <span>{lang === "Cn" ? "0��d�Xx�G��cm�]�u: ǔ�V}�o��NZ? : "Position: Suez Canal Transit"}</span>
              <span>ETA: <strong style={{ color: 'var(--text-primary)' }}>2026-06-08</strong></span>
            </div>
          </div>
        </div>
      );
    }

    // 10. S15: Split delivery Accounting ledger
    if (stageId === "S15") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(166,132,128,0.03)' }}>
            <div className="panel-title" style={{ color: 'var(--accent-red)' }}>��@c {lang === "Cn" ? "�t3 �Zw�D��ZOp�]��x��V�W��pt�W�t&1sr��? : "Strike-through Accounting Audit"}</div>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {lang === "Cn" ? "9p!2�W�~�����`lrw�&1�j�tCZ?m�}\G_Z?2 ��CZ�X��+[*�Y�?1 �[[�G0|����V���P;nwt"X���~^S�vOp�]G_Z%X!r)��� 6��T��Q�z���u���}\��œ�P!{O��]� � Z�S+u���]{uOp�p����? : "The site reported layout modifications. 2 Armchairs and 1 Table are canceled. recasting accounts under the strike-through policy."}
              </div>

              {!splitDeliveryActive ? (
                <button className="btn-premium" style={{ background: 'var(--accent-red)', color: 'white', justifyContent: 'center' }} onClick={triggerSplitDelivery}>
                  ?�?{lang === "Cn" ? "i��u�R��U�XR��b�lT��Q�z���u��" : "Execute Split strike recalculation"}
                </button>
              ) : (
                <div style={{ padding: '0.8rem', background: 'rgba(125, 143, 123, 0.08)', border: '1px solid var(--accent-green)', borderRadius: '2px', fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: '600' }}>
                  A�?{lang === "Cn" ? "T��Q�z���]{u��,a�Y�xO�`Z��\D�$i�]!{Op?$870�}\�qZ�`�Qw�D��Z͓d�Y�m��ᆒ? : "Recalculation Applied: Invoice reduced by $870. Balanced updated."}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 11. S16, S17: Handover & Archive Hash
    if (stageId === "S16" || stageId === "S17") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>
            <div className="panel-title">��@e {lang === "Cn" ? "9p
Y�S�YJTbsx��Vv�~Nq1�5pD%�%" : "Secure Handover & Archive Lock"}</div>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ padding: '0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', fontSize: '0.72rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{lang === "Cn" ? "˕oT0m�tYIm�V"kV��T0}" : "Project Dossier Compile:"}</strong><br/>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {lang === "Cn" ? "V�mT�`�ma��ZƕknsUt�_xrǓd� Nhange Logs 5pD%�%Ó�0Ys��NI Ut,h��tF�?|Z�Xxr�tY� zOgV��c7_��_@c`����t��zO�_k��d����ARVe~t�]� ? : "Includes CAD Specs, Change logs, AI QC reports, IPPC certificates, and signed client receipts."}
                </span>
              </div>

              {archiveHashed ? (
                <div style={{ padding: '0.8rem', background: 'rgba(125,143,123,0.08)', border: '1px solid var(--accent-green)', borderRadius: '2px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>A�?{lang === "Cn" ? "˕oT0m�[�clu��QgvOpxO�t�Y? : "Dossier Encrypted & Archived"}</div>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-all' }}>
                    SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51
                  </div>
                </div>
              ) : (
                <button 
                  className="btn-premium" 
                  style={{ justifyContent: 'center' }} 
                  onClick={handleCryptographicArchive}
                  disabled={stageId !== "S17"}
                >
                  ��@e {lang === "Cn" ? "5p�U�vp;jbs�m>�Se��,a�Y5p�U1d/u? : "Archive & Lock Ledger dossier"}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Supabase connection configuration states
  const [dbUrl, setDbUrl] = useState(savedUrl);
  const [dbKey, setDbKey] = useState(savedKey);
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [dbConnected, setDbConnected] = useState(!!supabaseClient);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  const stages = mockData.stages;
  const currentStage = stages[currentStageIndex];

  // Auto scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStageIndex, chatMessages]);

  // Fetch real-time data from Supabase if connected
  const fetchSupabaseData = async (shouldThrow = false) => {
    if (!window.supabase || !localStorage.getItem("supabase_url") || !localStorage.getItem("supabase_key")) {
      setDbConnected(false);
      return;
    }
    
    setDbLoading(true);
    setDbError("");
    
    try {
      const url = localStorage.getItem("supabase_url");
      const key = localStorage.getItem("supabase_key");
      const client = window.supabase.createClient(url, key);
      
      // 1. Fetch live Project named 'CRAFT-202605-01'
      const { data: projectsData, error: projectErr } = await client
        .from("projects")
        .select("*")
        .eq("name", "CRAFT-202605-01")
        .limit(1);
        
      if (projectErr) throw projectErr;
      
      let dbProject = null;
      let needToSeed = false;
      
      if (!projectsData || projectsData.length === 0) {
        needToSeed = true;
      } else {
        dbProject = projectsData[0];
        
        // Robustness integrity check: Ensure all child tables are actually populated
        const { data: specsCheck, error: specsErr } = await client
          .from("specifications")
          .select("id")
          .eq("project_id", dbProject.id)
          .limit(1);
          
        const { data: paymentsCheck, error: paymentsErr } = await client
          .from("payments")
          .select("id")
          .eq("project_id", dbProject.id)
          .limit(1);
          
        if (specsErr || paymentsErr || !specsCheck || specsCheck.length === 0 || !paymentsCheck || paymentsCheck.length === 0) {
          console.log("Project CRAFT-202605-01 exists, but specifications or payments are empty. Deleting existing project to trigger cascade and clean re-seed...");
          await client.from("projects").delete().eq("id", dbProject.id);
          needToSeed = true;
          dbProject = null;
        }
      }
      
      if (needToSeed) {
        console.log("Running client-side auto-seeding...");
        
        // 1. Insert default project
        const { data: newProjData, error: seedProjErr } = await client
          .from("projects")
          .insert({
            name: "CRAFT-202605-01",
            client_name: "Client Design Studio (UK)",
            client_contact: "St Albans, UK",
            current_stage: 1,
            selected_fabric: "FAB-02",
            selected_leg: "matte-black",
            fabric_compatibility_test: null,
            is_crib5_blocked: false,
            selected_supplier: null,
            split_delivery_active: false
          })
          .select();
          
        if (seedProjErr) throw new Error("Auto-seeding Projects failed: " + seedProjErr.message);
        
        let insertedProj = (newProjData && newProjData.length > 0) ? newProjData[0] : null;
        
        // Robust fallback: if insert-select returns empty (common with some RLS/triggers/SDK issues), select explicitly by name
        if (!insertedProj) {
          console.warn("Insert select returned empty, attempting fallback select by name...");
          const { data: fallbackData, error: fallbackErr } = await client
            .from("projects")
            .select("*")
            .eq("name", "CRAFT-202605-01")
            .limit(1);
            
          if (fallbackErr) {
            throw new Error("Fallback project retrieval failed: " + fallbackErr.message);
          }
          if (fallbackData && fallbackData.length > 0) {
            insertedProj = fallbackData[0];
          }
        }
        
        if (insertedProj) {
          
          // 2. Insert standard specifications linked to the project
          const { error: seedSpecsErr } = await client
            .from("specifications")
            .insert([
              {
                project_id: insertedProj.id,
                item_type_cn: "�oCr��5��X�Y?,
                item_type_en: "Lobby Armchair",
                quantity: 40,
                material_cn: "4Z�\WU���o9|yi?(L-4410)",
                material_en: "Navy Classic Linen (L-4410)",
                original_unit_price: 210,
                unit_price: 210,
                notes_cn: "",
                notes_en: ""
              },
              {
                project_id: insertedProj.id,
                item_type_cn: "�t[���W��fIl�Y?,
                item_type_en: "VIP Club Chair",
                quantity: 20,
                material_cn: "(��V�ე�o#{?(V-9082)",
                material_en: "Royal Velvet (V-9082)",
                original_unit_price: 280,
                unit_price: 280,
                notes_cn: "",
                notes_en: ""
              },
              {
                project_id: insertedProj.id,
                item_type_cn: "9p,l�W9p�pjn�oF*\Q�?,
                item_type_en: "Custom Oak Coffee Table",
                quantity: 5,
                material_cn: "�oC%�R'�����ȓ?,
                material_en: "Natural Solid White Oak",
                original_unit_price: 450,
                unit_price: 450,
                notes_cn: "",
                notes_en: ""
              }
            ]);
            
          if (seedSpecsErr) throw new Error("Auto-seeding Specifications failed: " + seedSpecsErr.message);
          
          // 3. Insert standard payment milestones
          const { error: seedPaymentsErr } = await client
            .from("payments")
            .insert([
              {
                project_id: insertedProj.id,
                milestone_cn: "50% �h(han9p6l~V (�[m��|)",
                milestone_en: "50% Deposit (Paid)",
                amount: 10450,
                status: "Paid",
                payment_date: "2026-05-25"
              },
              {
                project_id: insertedProj.id,
                milestone_cn: "40% Q�?��c�m_��� (ȓE�sr��� )",
                milestone_en: "40% Shipping Release (Pending)",
                amount: 8360,
                status: "Pending",
                payment_date: "Pending"
              },
              {
                project_id: insertedProj.id,
                milestone_cn: "10% \m�0�|Op�p�� (ȓE�sr��� )",
                milestone_en: "10% Handover Balance (Pending)",
                amount: 2090,
                status: "Pending",
                payment_date: "Pending"
              }
            ]);
          if (seedPaymentsErr) throw new Error("Auto-seeding Payments failed: " + seedPaymentsErr.message);

          // 4. Insert initial human-AI audit logs
          const { error: seedLogsErr } = await client
            .from("agent_logs")
            .insert([
              {
                project_id: insertedProj.id,
                operator: "OpenClaw",
                action_desc_cn: "YtF�=pȓ�QWd�m^�>~O�E�uOp�]%�Y�U6n�Y�P7_��,[����\�VU��fSe��*a�[wt�P�g}�Y��",
                action_desc_en: "Parsed member portal message and sketch, auto-generated project master draft."
              },
              {
                project_id: insertedProj.id,
                operator: "OpenClaw",
                action_desc_cn: "w�D��Z��6l�NO�E�uZXO��6l�NZ�byᴓ�u�b_��_��O�nT*�p.a�k��bru�WW4Q�oDi��[�0�h\�}\�S�[?,
                action_desc_en: "Automatically followed up via member portal to query metal legs coating and tolerance."
              },
              {
                project_id: insertedProj.id,
                operator: "OpenClaw",
                action_desc_cn: "�m� ��5uSe��*aQ�{����gOp�]�SUt�_xrǓi�}Op�T��Yk4|9p1l�N�Pk: 650mm, D: 600mm, H: 850mm",
                action_desc_en: "Bilingual specifications generated. Dimensions defined: W: 650mm, D: 600mm, H: 850mm."
              }
            ]);
            
          if (seedLogsErr) throw new Error("Auto-seeding Agent Logs failed: " + seedLogsErr.message);
          
          // 5. Insert detailed technical agent thought trace logs (for all 17 stages)
          const seedThoughtRows = [];
          Object.entries(mockData.agentThoughtLogs).forEach(([stageId, logList]) => {
            logList.forEach(line => {
              seedThoughtRows.push({
                project_id: insertedProj.id,
                stage_id: stageId,
                role: line.role,
                log_text_cn: line.text,
                log_text_en: line.textEn || line.text
              });
            });
          });
          if (seedThoughtRows.length > 0) {
            const { error: seedThoughtsErr } = await client
              .from("agent_thought_logs")
              .insert(seedThoughtRows);
            if (seedThoughtsErr) throw new Error("Auto-seeding Agent Thought Logs failed: " + seedThoughtsErr.message);
          }

          dbProject = insertedProj;
        } else {
          throw new Error("Failed to retrieve auto-seeded project.");
        }
      } else {
        dbProject = projectsData[0];
      }
      
      // Load specs, payments, logs and thought logs
      if (dbProject) {
        // 2. Fetch live Specifications
        const { data: itemsData, error: itemsErr } = await client
          .from("specifications")
          .select("*")
          .eq("project_id", dbProject.id);
          
        if (itemsErr) throw itemsErr;
        
        // 3. Fetch live Payments Schedule
        const { data: paymentsData, error: paymentsErr } = await client
          .from("payments")
          .select("*")
          .eq("project_id", dbProject.id)
          .order("created_at", { ascending: true });
          
        if (paymentsErr) throw paymentsErr;

        // 4. Fetch live Agent Logs
        const { data: logsData } = await client
          .from("agent_logs")
          .select("*")
          .eq("project_id", dbProject.id)
          .order("created_at", { ascending: false });

        // 5. Fetch live Agent Thought Logs
        const { data: dbThoughtLogs, error: thoughtsErr } = await client
          .from("agent_thought_logs")
          .select("*")
          .eq("project_id", dbProject.id);

        if (thoughtsErr) throw thoughtsErr;

        // Apply dbThoughtLogs to in-memory mockData.agentThoughtLogs with English healing
        if (dbThoughtLogs && dbThoughtLogs.length > 0) {
          const newThoughtLogs = {};
          
          // Sort or group by stage_id, and preserve insertion order
          const sortedDbThoughtLogs = [...dbThoughtLogs].sort((a, b) => {
            if (a.stage_id !== b.stage_id) return a.stage_id.localeCompare(b.stage_id);
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);
          });

          sortedDbThoughtLogs.forEach(row => {
            if (!newThoughtLogs[row.stage_id]) {
              newThoughtLogs[row.stage_id] = [];
            }
            
            const currentIdx = newThoughtLogs[row.stage_id].length;
            const localLines = mockData.agentThoughtLogs[row.stage_id];
            const localLine = localLines ? localLines[currentIdx] : null;
            
            let textEn = row.log_text_en || row.log_text_cn;
            // If DB English text is missing or contains Chinese, but we have a clean local English text, use local
            if (localLine && localLine.textEn && (!row.log_text_en || row.log_text_en === row.log_text_cn || /[\u4e00-\u9fa5]/.test(row.log_text_en))) {
              textEn = localLine.textEn;
            }

            newThoughtLogs[row.stage_id].push({
              role: row.role,
              text: row.log_text_cn || row.log_text_en,
              textEn: textEn
            });
          });
          
          Object.assign(mockData.agentThoughtLogs, newThoughtLogs);
        }

        const stageNum = dbProject.current_stage || 1;
        const currentStageId = "S" + String(stageNum).padStart(2, "0");

        // Sync state variables from the database to React state
        if (dbProject.selected_fabric) setSelectedFabric(dbProject.selected_fabric);
        if (dbProject.selected_leg) setSelectedLeg(dbProject.selected_leg);
        if (dbProject.fabric_compatibility_test !== undefined) setFabricCompatibilityTest(dbProject.fabric_compatibility_test);
        if (dbProject.is_crib5_blocked !== undefined) {
          setIsCrib5Blocked(dbProject.is_crib5_blocked);
          setConfiguratorCrib5Blocked(dbProject.is_crib5_blocked && dbProject.selected_fabric === "FAB-03");
        }
        if (dbProject.selected_supplier) setSelectedSupplier(dbProject.selected_supplier);
        if (dbProject.split_delivery_active !== undefined) setSplitDeliveryActive(dbProject.split_delivery_active);

        // Map project shape dynamically
        const mappedOrder = {
          id: dbProject.id,
          orderId: dbProject.name || "CRAFT-202605-01",
          clientName: dbProject.client_name || "Client Design Studio (UK)",
          projectLocation: dbProject.client_contact || "St Albans, UK",
          createdDate: dbProject.created_at ? dbProject.created_at.split("T")[0] : "2026-05-25",
          currentStageId: currentStageId,
          items: (itemsData && itemsData.length > 0) ? itemsData.map(item => ({
            id: item.id,
            typeCn: item.item_type_cn,
            typeEn: item.item_type_en,
            qty: item.quantity,
            materialCn: item.material_cn,
            materialEn: item.material_en,
            originalUnitPrice: Number(item.original_unit_price || 0),
            unitPrice: Number(item.unit_price || 0),
            status: "Active",
            note: item.notes_cn || item.notes_en || ""
          })) : JSON.parse(JSON.stringify(mockData.initialOrder.items)),
          payments: (paymentsData && paymentsData.length > 0) ? paymentsData.map(p => ({
            id: p.id,
            milestone: lang === "Cn" ? p.milestone_cn : p.milestone_en,
            amount: Number(p.amount || 0),
            date: p.payment_date,
            status: p.status
          })) : JSON.parse(JSON.stringify(mockData.initialOrder.payments))
        };
        
        setOrder(mappedOrder);
        setDbConnected(true);
        
        // Update local stage view to match Supabase's status
        const stageIdx = stages.findIndex(s => s.id === currentStageId);
        if (stageIdx !== -1) {
          setCurrentStageIndex(stageIdx);
        }
        
        if (logsData && logsData.length > 0) {
          setLogs(logsData.map(log => {
            const actionCn = log.action_desc_cn || log.action_desc_en;
            let actionEn = log.action_desc_en || log.action_desc_cn;
            if (!actionEn || actionEn === actionCn || /[\u4e00-\u9fa5]/.test(actionEn)) {
              actionEn = getLogActionEn(actionCn) || actionEn;
            }
            return {
              time: log.created_at ? new Date(log.created_at).toLocaleString() : "2026-05-25 10:15:20",
              user: log.operator || "OpenClaw",
              action: actionCn,
              actionEn: actionEn
            };
          }));
        }
      }
    } catch (err) {
      console.error("Supabase load error:", err);
      setDbError(err.message || "Failed to query. Please verify connection credentials.");
      setDbConnected(false);
      if (shouldThrow) throw err;
    } finally {
      setDbLoading(false);
    }
  };

  // Listen to postMessage from child loading-ai
  useEffect(() => {
    const handleChildMessage = (e) => {
      if (e.data && e.data.type === 'CRAFTON_CHILD_LANG_CHANGE') {
        setLang(e.data.lang); // "Cn" or "En"
      }
    };
    window.addEventListener('message', handleChildMessage);
    return () => window.removeEventListener('message', handleChildMessage);
  }, []);

  // Re-fetch when connection variables or language change
  useEffect(() => {
    fetchSupabaseData();
  }, [lang]);

  // Subscribe to real-time changes on Supabase when connected
  useEffect(() => {
    if (!dbConnected) return;

    let channel = null;
    try {
      const url = localStorage.getItem("supabase_url");
      const key = localStorage.getItem("supabase_key");
      if (url && key && window.supabase) {
        const client = window.supabase.createClient(url, key);
        
        channel = client
          .channel("schema-db-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "projects"
            },
            (payload) => {
              console.log("Realtime Change detected on 'projects':", payload);
              fetchSupabaseData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "specifications"
            },
            (payload) => {
              console.log("Realtime Change detected on 'specifications':", payload);
              fetchSupabaseData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "payments"
            },
            (payload) => {
              console.log("Realtime Change detected on 'payments':", payload);
              fetchSupabaseData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "agent_logs"
            },
            (payload) => {
              console.log("Realtime Change detected on 'agent_logs':", payload);
              fetchSupabaseData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "agent_thought_logs"
            },
            (payload) => {
              console.log("Realtime Change detected on 'agent_thought_logs':", payload);
              fetchSupabaseData();
            }
          )
          .subscribe((status) => {
            console.log("Supabase Realtime subscription status:", status);
          });
      }
    } catch (err) {
      console.error("Realtime subscription setup failed:", err);
    }

    return () => {
      if (channel && window.supabase) {
        try {
          const url = localStorage.getItem("supabase_url");
          const key = localStorage.getItem("supabase_key");
          const client = window.supabase.createClient(url, key);
          client.removeChannel(channel);
          console.log("Supabase Realtime subscription unsubscribed successfully.");
        } catch (err) {
          console.error("Failed to clean up realtime channel:", err);
        }
      }
    };
  }, [dbConnected]);

  // Handle saving and testing Supabase configuration
  const handleSaveDbConfig = async (e) => {
    e.preventDefault();
    if (!dbUrl.trim() || !dbKey.trim()) {
      localStorage.removeItem("supabase_url");
      localStorage.removeItem("supabase_key");
      setDbConnected(false);
      setShowDbConfig(false);
      return;
    }

    setDbLoading(true);
    setDbError("");

    try {
      // Test the client connection
      const testClient = window.supabase.createClient(dbUrl.trim(), dbKey.trim());
      const { error } = await testClient.from("projects").select("id").limit(1);
      
      if (error) throw error;

      // Persist to localStorage
      localStorage.setItem("supabase_url", dbUrl.trim());
      localStorage.setItem("supabase_key", dbKey.trim());
      
      // Load actual data and execute the auto-seeder, letting errors propagate
      await fetchSupabaseData(true);
      
      // Only set success status and close the drawer on complete success!
      setDbConnected(true);
      setShowDbConfig(false);
    } catch (err) {
      console.error("Connection and seeding failed:", err);
      setDbError(err.message || "Connection failed. Please check URL / Anon Key and database tables.");
      setDbConnected(false);
    } finally {
      setDbLoading(false);
    }
  };

  const handleForceSeed = async () => {
    if (!window.supabase) {
      setDbError("Supabase client is not loaded in window.");
      return;
    }
    const url = localStorage.getItem("supabase_url");
    const key = localStorage.getItem("supabase_key");
    if (!url || !key) {
      setDbError("Please save a valid database connection first before seeding.");
      return;
    }

    setDbLoading(true);
    setDbError("");

    try {
      const client = window.supabase.createClient(url, key);
      console.log("Force Re-seed: Clearing projects named 'CRAFT-202605-01'...");
      
      const { error: deleteErr } = await client
        .from("projects")
        .delete()
        .eq("name", "CRAFT-202605-01");
        
      if (deleteErr) {
        console.warn("Delete of projects failed or returned error:", deleteErr);
      }
      
      console.log("Running cascading auto-seeding...");
      await fetchSupabaseData(true);
      setDbConnected(true);
      console.log("Force Re-seed completed successfully.");
    } catch (err) {
      console.error("Force Re-seed failed:", err);
      setDbError("Force Re-seed failed: " + (err.message || err));
    } finally {
      setDbLoading(false);
    }
  };

  const handleStageChange = async (index) => {
    setCurrentStageIndex(index);
    // Special trigger logic based on stage clicks to make prototype feel alive
    if (index === 4) { // Stage 5: Crib 5 Check
      setFabricCompatibilityTest("passed");
      setIsCrib5Blocked(false);
    } else if (index === 7) { // Stage 8: Cho Decision
      setIsBiddingDone(true);
    } else if (index === 14) { // Stage 15: Split Delivery and Strike out
      triggerSplitDelivery();
    }

    // Sync to Supabase if connected
    if (dbConnected && order.id) {
      try {
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));
        const stageId = stages[index].id;
        const currentStageInt = parseInt(stageId.substring(1), 10);
        await client.from("projects").update({ current_stage: currentStageInt }).eq("id", order.id);
      } catch (err) {
        console.error("Supabase stage sync error:", err);
      }
    }
  };

  const handleLangToggle = () => {
    setLang(lang === "Cn" ? "En" : "Cn");
  };

  // Simulating user typing in chat window
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const newMsg = { sender: "client", text: inputText };
    setChatMessages([...chatMessages, newMsg]);
    setInputText("");

    // AI automated reply simulate
    setTimeout(async () => {
      let replyText = "";
      if (lang === "Cn") {
        replyText = "��,`penClaw œ?�XQT�C%�`��? �����W�yO�W�YE�jn�t�QG_ Supabase ��HrA]4d�d.\���]MP(��R6n�Y�P� ?;
      } else {
        replyText = "[OpenClaw AI Assistant]: Received! I am pulling data from Supabase to match your design request.";
      }

      if (inputText.toLowerCase().includes("silk") || inputText.toLowerCase().includes("�m�oSh")) {
        // Trigger blocking scenario!
        setFabricCompatibilityTest("blocked");
        setIsCrib5Blocked(true);
        if (lang === "Cn") {
          replyText = "?��r{��,a�`Yt�Rᶓ?/ BANNED��? �Y� 4Z*[�W��)1� Y� Yde%��n�Q�m�oSh�^� �o� �P�Ze�?(Crib 5) Õ,�OÕd�gVYt�R~u�~yO�Op�U#{LkX~t}\�[pB��i���Xm^p�P)���U}|m,l��w��_���]	�Y�{Y�?j�X�Y� �Py�W��f�Qw�D��Y��=��W��xO~u���P��ǓX[2]�mp�9|yi?(Linen) ��+h�k�t?(Leather)�?;
        } else {
          replyText = "?��r{ [COMPLIANCE ALERT / BANNED]: You selected Pure Silk Satin. UK Crib 5 fire codes prohibit flame coating on delicate silks (causes extreme shrinkage & discoloration). Order has been BLOCKED. Please select Linen or Leather!";
        }
        // Force process stage to S05 for demonstration
        setCurrentStageIndex(4); 
        
        if (dbConnected && order.id) {
          try {
            const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));
            await client.from("projects").update({ 
              current_stage: 5,
              selected_fabric: "FAB-03",
              is_crib5_blocked: true,
              fabric_compatibility_test: "blocked"
            }).eq("id", order.id);
          } catch (err) {
            console.error("Supabase silk block update error:", err);
          }
        }
      }

      setChatMessages(prev => [...prev, { sender: "agent", text: replyText }]);
    }, 1200);
  };

  // Simulate Cho's review check-off in S04
  const handleChoApproval = async () => {
    const nextIndex = currentStageIndex + 1;
    setCurrentStageIndex(nextIndex);
     addLog("Cho", "��� ȓ�I�͓���Rx�
VOM5pB%sr��6l�N��\VeZ��]�j/u�Q� ?, "Technical specifications and BOM approved, signature released.");

    if (dbConnected && order.id) {
      try {
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));
        const nextStageId = stages[nextIndex].id;
        const nextStageInt = parseInt(nextStageId.substring(1), 10);
        await client.from("projects").update({ current_stage: nextStageInt }).eq("id", order.id);
        await client.from("agent_logs").insert({
          project_id: order.id,
          operator: "Cho",
          action_desc_cn: "��� ȓ�I�͓���Rx�
VOM5pB%sr��6l�N��\VeZ��]�j/u�Q� ?,
          action_desc_en: "Tech specifications and BOM approved, signed off."
        });
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }
  };

  // Simulate Crib 5 Override to bypass block
  const handleBypassCrib5 = async (fabricCode) => {
    setFabricCompatibilityTest("passed");
    setIsCrib5Blocked(false);
    setCurrentStageIndex(5); // Move to next stage S06
    addLog("Cho", `�m��|e�B%�gZ�#XI��-l[m��$2pok� ${fabricCode} (4Z�\WU���o9|yi?�~\�WT��q� 3lC~ Crib 5 9p
Y�S��=��W'1�憒�O, `Modified material compliance: Swapped fabric to ${fabricCode} (Navy Classic Linen), successfully passing the Crib 5 safety compliance gate.`);

    if (dbConnected && order.id) {
      try {
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));
        await client.from("projects").update({ 
          current_stage: 6,
          selected_fabric: "FAB-02",
          is_crib5_blocked: false,
          fabric_compatibility_test: "passed"
        }).eq("id", order.id);
        await client.from("agent_logs").insert({
          project_id: order.id,
          operator: "Cho",
          action_desc_cn: `�m��|e�B%�gZ�#XI��-l[m��$2pok� ${fabricCode} (4Z�\WU���o9|yi?�~\�WT��q� 3lC~ Crib 5 9p
Y�S��=��W'1�憒�O,
          action_desc_en: `Bypassed Crib 5: Changed fabric to ${fabricCode} (Navy Classic Linen), successfully overriding gate.`
        });
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }
  };

  // Simulate Cho picking Foshan Gold-Sun in S08
  const handleSelectSupplier = async (supplier) => {
    setSelectedSupplier(supplier);
    setIsBiddingDone(true);
    
    // Update Master order values
    const updatedItems = order.items.map(item => {
      if (item.typeEn === "Lobby Armchair" || item.typeEn === "VIP Club Chair") {
        return { ...item, unitPrice: supplier.pricePerChair };
      }
      return item;
    });

    const updatedPayments = order.payments.map(payment => {
      if (payment.milestone.includes("50%")) {
        return { ...payment, amount: 9350 }; // Simulated price recalculation
      }
      return payment;
    });

    setOrder(prev => ({ ...prev, items: updatedItems, payments: updatedPayments }));
    addLog("Cho", `�Y�e�s9p~\�W���P6n%X� 
Y~u`mE�OX�? ${supplier.name}�}\G0k��P�X��+[*�W��f�s͓?z~u�m?$${supplier.pricePerChair}/��?Z� �O, `Bidding completed. Selected final supplier: ${supplier.name}. Lobby armchair unit price approved at $${supplier.pricePerChair}/pc.`);
    setCurrentStageIndex(8); // Move to production stage S09

    if (dbConnected && order.id) {
      try {
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));
        await client.from("projects").update({ 
          current_stage: 9,
          selected_supplier: supplier
        }).eq("id", order.id);
        
        // Update specifications in database
        await client.from("specifications")
          .update({ unit_price: supplier.pricePerChair })
          .eq("project_id", order.id)
          .in("item_type_en", ["Lobby Armchair", "VIP Club Chair"]);

        // Update relational payments schedule in database
        await client.from("payments").update({ amount: 9350 }).eq("project_id", order.id).ilike("milestone_en", "%50% Deposit%");
        await client.from("payments").update({ amount: 7480 }).eq("project_id", order.id).ilike("milestone_en", "%40% Shipping%");
        await client.from("payments").update({ amount: 1870 }).eq("project_id", order.id).ilike("milestone_en", "%10% Handover%");

        await client.from("agent_logs").insert({
          project_id: order.id,
          operator: "Cho",
          action_desc_cn: `�Y�e�s9p~\�W���P6n%X� 
Y~u`mE�OX�? ${supplier.name}�}\G0k��P�X��+[*�W��f�s͓?z~u�m?$${supplier.pricePerChair}/��?Z� �O,
          action_desc_en: `Supplier bidding finalized. Factory selected: ${supplier.name}. Lobby Armchair set to $${supplier.pricePerChair}/pc.`
        });
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }
  };

  // Simulate Client Split Delivery and Strike out (S15)
  const triggerSplitDelivery = async () => {
    setSplitDeliveryActive(true);
    const updatedItems = order.items.map(item => {
      if (item.typeEn === "Lobby Armchair") {
        return { ...item, qty: 38, note: "�[�c�VZ? 38 ��?/ ?��r{ Y�(h�y: 2 ��?(�g�nR��c�V͓d"e)" };
      }
      if (item.typeEn === "Custom Oak Coffee Table") {
        return { ...item, qty: 4, note: "�[�c�WZ? 4 �[?/ ?��r{ Y�(h�y: 1 �[?(�t 2�Y�[�g� � Z?" };
      }
      return item;
    });

    const updatedPayments = [
      { milestone: "50% Deposit (�[m��|)", amount: 10450, date: "2026-05-25", status: "Paid" },
      { milestone: "40% Shipping Release (Q�?��c�m_���)", amount: 7860, date: "2026-05-25", status: "Paid" },
      { milestone: "10% Recalculated Balance (Op�p��R��c�V���]{u)", amount: 470, date: "Pending", status: "Pending" }
    ];

    setOrder(prev => ({ ...prev, items: updatedItems, payments: updatedPayments }));
    addLog("Client", "��`lrY��]���,lm9p!2�W�~�����`lr�tBZ�Z�}\G_Z?��CZ�X��+[*�x�?�[CO*\Q��r� �P�fU��f�Y�~3l�uU�k�VU��fxV�~Ki}i;j��[�Ssr���?m,�� ?, "On-site feedback: Due to site changes, 2 armchairs and 1 coffee table were canceled. Initiated automatic strike-through financial recalculation; remaining balance updated.");

    if (dbConnected && order.id) {
      try {
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));
        await client.from("projects").update({ split_delivery_active: true }).eq("id", order.id);
        
        // Update specifications quantities and notes in database
        await client.from("specifications")
          .update({ 
            quantity: 38, 
            notes_cn: "�[�c�VZ? 38 ��?/ ?��r{ Y�(h�y: 2 ��?(�g�nR��c�V͓d"e)",
            notes_en: "Shipped: 38 pcs / ?��r{ Cancelled: 2 pcs (site strike-through)"
          })
          .eq("project_id", order.id)
          .eq("item_type_en", "Lobby Armchair");
          
        await client.from("specifications")
          .update({ 
            quantity: 4, 
            notes_cn: "�[�c�WZ? 4 �[?/ ?��r{ Y�(h�y: 1 �[?(�t 2�Y�[�g� � Z?",
            notes_en: "Arrived: 4 pcs / ?��r{ Cancelled: 1 pc (refunded)"
          })
          .eq("project_id", order.id)
          .eq("item_type_en", "Custom Oak Coffee Table");

        // Recalculate payments directly in the database
        await client.from("payments").update({ amount: 10450, status: "Paid", payment_date: "2026-05-25" }).eq("project_id", order.id).ilike("milestone_en", "%50% Deposit%");
        await client.from("payments").update({ amount: 7860, status: "Paid", payment_date: "2026-05-25" }).eq("project_id", order.id).ilike("milestone_en", "%40% Shipping%");
        await client.from("payments").update({ 
          milestone_cn: "10% Op�p��R��c�V���]{u (ȓE�sr��� )",
          milestone_en: "10% Recalculated Balance (Pending)",
          amount: 470,
          status: "Pending"
        }).eq("project_id", order.id).ilike("milestone_en", "%10% Handover%");

        await client.from("agent_logs").insert({
          project_id: order.id,
          operator: "Client",
          action_desc_cn: "��`lrY��]���,lm9p!2�W�~�����`lr�tBZ�Z�}\G_Z?��CZ�X��+[*�x�?�[CO*\Q��r� �P�fU��f�Y�~3l�uU�k�VU��fxV�~Ki}i;j��[�Ssr���?m,�� ?,
          action_desc_en: "Site feedback: Cancelled 2 Armchairs & 1 Table due to fitout changes. Auto strike-through recalculation initiated."
        });
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }
  };

  const addLog = (user, actionCn, actionEn) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ 
      time: `2026-05-25 ${time}`, 
      user, 
      action: actionCn, 
      actionEn: actionEn || actionCn 
    }, ...prev]);
  };

  // Calculate order total
  const getOrderTotal = () => {
    return order.items.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
  };

  return (
    <div>
      {/* Supabase Connection Drawer */}
      {showDbConfig && (
        <div className="animate-fade-in" style={{
          background: "#FFFFFF",
          borderBottom: "1px solid var(--glass-border)",
          padding: "2.5rem 2rem",
          position: "relative",
          zIndex: 1000,
          boxShadow: "0 10px 30px rgba(28,27,24,0.05)"
        }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-tech)", color: "var(--text-primary)", margin: 0 }}>
                ��2e Supabase 5p=��j��JTNd4d�� F�4^ (Live Database Sync)
              </h3>
              <button 
                onClick={() => setShowDbConfig(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                A�?              </button>
            </div>
            
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
              {lang === "Cn" 
                ? "��F�4^R�HrMP(�?Supabase 5p=��jƕ�S�f��,l闆��P���~^S�v)�X[4^�[?projects, specifications \�?agent_logs ��JTNdt$1Q��t� Y�'h�b5p=��j5p���S��JTNd���P��˓�n�g��6[}Op�V�RƕtT�j�~,l�Wȓ�tn�Y!dd��JTNd��?
                : "Connect to your live Supabase cloud database. The prototype will dynamically read and write records to your projects, specifications, and agent_logs tables. Falls back to local mockup data if disconnected."}
            </p>

            <form onSubmit={handleSaveDbConfig} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontFamily: "var(--font-tech)", letterSpacing: "1px" }}>SUPABASE PROJECT URL</label>
                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder="https://your-project-id.supabase.co" 
                  value={dbUrl} 
                  onChange={(e) => setDbUrl(e.target.value)}
                  style={{ width: "100%", background: "#FFFFFF", padding: "0.6rem", border: "1px solid var(--glass-border)", color: "var(--text-primary)", borderRadius: "2px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontFamily: "var(--font-tech)", letterSpacing: "1px" }}>SUPABASE ANON KEY</label>
                <input 
                  type="password" 
                  className="chat-input" 
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                  value={dbKey} 
                  onChange={(e) => setDbKey(e.target.value)}
                  style={{ width: "100%", background: "#FFFFFF", padding: "0.6rem", border: "1px solid var(--glass-border)", color: "var(--text-primary)", borderRadius: "2px" }}
                />
              </div>

              {dbError && (
                <div style={{ color: "var(--accent-red)", fontSize: "0.8rem", background: "rgba(255, 76, 76, 0.08)", padding: "0.8rem", borderRadius: "6px", border: "1px solid var(--accent-red)", fontFamily: "var(--font-tech)" }}>
                  ?��r{ ERROR: {dbError}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-premium" disabled={dbLoading} style={{ padding: "0.6rem 1.5rem" }}>
                  {dbLoading ? "Testing..." : "Save & Sync Live Database"}
                </button>
                {dbConnected && (
                  <>
                    <button 
                      type="button" 
                      className="btn-premium" 
                      style={{ 
                        background: "linear-gradient(135deg, var(--accent-orange) 0%, #B8836C 100%)", 
                        borderColor: "transparent",
                        color: "white", 
                        padding: "0.6rem 1.5rem" 
                      }}
                      onClick={handleForceSeed}
                      disabled={dbLoading}
                    >
                      {dbLoading ? (lang === "Cn" ? "ϔ�f�`�m?.." : "Processing...") : (lang === "Cn" ? "?�&{ �[�\�W���]�g��`����JTNd" : "?�&{ Force Re-Seed Database")}
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ borderColor: "var(--accent-red)", color: "var(--accent-red)", padding: "0.6rem 1.5rem" }}
                      onClick={() => {
                        setDbUrl("");
                        setDbKey("");
                        localStorage.removeItem("supabase_url");
                        localStorage.removeItem("supabase_key");
                        setDbConnected(false);
                        setOrder(JSON.parse(JSON.stringify(mockData.initialOrder)));
                        setLogs(JSON.parse(JSON.stringify(mockData.changeLogs)));
                        setCurrentStageIndex(0);
                      }}
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navbar Header */}
      <nav className="navbar">
        <div className="logo-container">
          <span className="logo-logo">CRAFTON AI</span>
        </div>

        <div className="nav-links">
          <span className={`nav-link ${currentView === "Marketing" ? "active" : ""}`} onClick={() => setCurrentStageView("Marketing")}>
            {lang === "Cn" ? "|mwO{9p<j�}" : "Homepage"}
          </span>
          <span className={`nav-link ${currentView === "ClientPortal" ? "active" : ""}`} onClick={() => setCurrentStageView("ClientPortal")}>
            {lang === "Cn" ? "9p!2�W|m,l�a�m^�>~" : "Client Portal"}
          </span>
          <span className={`nav-link ${currentView === "Backoffice" ? "active" : ""}`} onClick={() => setCurrentStageView("Backoffice")}>
            {lang === "Cn" ? "P�oT�}��C�WY�?(Cho/9p!2�W)" : "Backoffice (Cho/Client)"}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {/* Supabase Status Button */}
          <button 
            className="btn-secondary" 
            style={{ 
              borderColor: dbConnected ? "var(--accent-green)" : "rgba(255,255,255,0.1)", 
              color: dbConnected ? "var(--accent-green)" : "var(--text-secondary)",
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              padding: '0.4rem 0.8rem'
            }}
            onClick={() => setShowDbConfig(!showDbConfig)}
          >
            <span className={`stage-badge-dot dot-${dbConnected ? 'ai' : 'gate'}`} style={{ margin: 0, width: '8px', height: '8px', display: 'inline-block' }}></span>
            {dbConnected ? "Supabase Connected" : "Connect Supabase"}
          </button>

          <button className="btn-secondary" onClick={handleLangToggle}>
            ���[ {lang === "Cn" ? "English" : "�~�O�s�m_�g"}
          </button>
          <button className="btn-premium" onClick={() => setCurrentStageView("ClientPortal")}>
            {lang === "Cn" ? "'��} / 	Z%1=U" : "Sign In"}
          </button>
        </div>
      </nav>

      {dbError && !dbConnected && (
        <div className="animate-fade-in" style={{
          background: "rgba(166, 132, 128, 0.95)",
          color: "#ffffff",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.85rem",
          fontFamily: "var(--font-tech)",
          borderBottom: "1px solid #FAF9F6",
          gap: "1.5rem",
          zIndex: 999,
          position: "relative"
        }}>
          <div>
            ?��r{ <strong>{lang === "Cn" ? "Supabase Z�~\� / ��`������ (Seeding Error):" : "Supabase Sync / Seeding Error:"}</strong> {dbError}
          </div>
          <button 
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid #ffffff",
              color: "#ffffff",
              padding: "0.4rem 1rem",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}
            onClick={() => setShowDbConfig(true)}
          >
            {lang === "Cn" ? "�i�p3d���caq���]�u / Troubleshoot" : "Troubleshoot Config"}
          </button>
        </div>
      )}

      {/* VIEW 1: Web Marketing Portal */}
      {currentView === "Marketing" && (
        <div className="animate-fade-in" style={{ paddingBottom: "4rem" }}>
          <div className="portal-hero">
            <h1>
              {lang === "Cn" ? "Bi;j09p,l�W9p���S�I[I �o-l�js�b�}O�(1�VT�(1�z\mC��Y�? : "High-End Bespoke Furniture, Driven by Autonomous Multi-Agent Workflows."}
            </h1>
            <p>
              {lang === "Cn" 
                ? "Crafton AI 9p�\�}5pĉ4^{�^SWm Crib 5 Z%X�i͓�VoV���P�|��%1jn|m,l�a�m^�>~Hg�d�S(��R�z�~�e~uR�X6n�Y�P7_�tPcxᵓ,[���}\�Wȓ� X�S���Q}AI W��_�Y�tPcxᆒxO�Sw�D��Y�tm�s�Y�e�s��NVYt�UN�[���]�Y� ���]�`�Y�e����\� ,l�SÓ�r�T��? 
                : "Crafton AI bridges the gap between premium design and factory floor. Integrating UK Crib 5 flame codes, dual-language BOM generation, automatic pricing bids, and Computer Vision inspections."}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-premium" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }} onClick={() => setCurrentStageView("ClientPortal")}>
                {lang === "Cn" ? "	Z%1=U��*a�|m,l�a �?AI��
Y'd" : "Join Membership & Design with AI"}
              </button>
              <button className="btn-secondary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }} onClick={() => setCurrentStageView("Backoffice")}>
                {lang === "Cn" ? "ig�m�SP�tT4Q 17 Õ5���t�qܑ" : "Simulate 17-Stage Tracker"}
              </button>
            </div>
          </div>

          {/* Integration: Material Studio Configurator */}
          <div style={{ maxWidth: '1200px', margin: '0 auto 3rem auto', padding: '0 2rem' }}>
            {renderMaterialStudio()}
          </div>

          <div className="portal-features-grid">
            <div className="glass-card feature-box">
              <div className="feature-icon">��m�?/div>
              <div className="feature-title">{lang === "Cn" ? "Crib 5 w�D��YZ%X�i��=��W" : "Crib 5 Anti-Fire Hard Gate"}</div>
              <div className="feature-desc">
                {lang === "Cn" 
                  ? "�~d��|9p�pi�Y�e���Y�e�g��yOjn(���j��Q�`Yt�R�f����1|���P�V�m�]ne��zO�X��U�i����y^p�P�k�~gR�|ȕ!2�g�m� �[*[jn�tm�sS��]i[pAi�Z��N�}ɓ�n�|�ptG0�tFM~�~�r�`��? 
                  : "Automatic material check against British fire databases. Delicate fabrics (like silk) that shrink under flame coating are flagged and blocked before production."}
              </div>
            </div>

            <div className="glass-card feature-box">
              <div className="feature-icon">���a�?/div>
              <div className="feature-title">{lang === "Cn" ? "AI Yt�UN�t&1�岕�]�`�Y�e��" : "AI CV Inspection"}</div>
              <div className="feature-desc">
                {lang === "Cn" 
                  ? "R�C%de�t�{uȓ?�K�YtY}OpenCV�Y}w�D��YOp�UOX��P!vÓ�0�Z�B{X��qP� CAD �tPcx�e�gR
q���]�`�Y�e����\~V^p�p*�t�6l��y��c�N��k� xOf5pLk�y�[��}Q��T�]S��]�VT�&1�Z��E��Y�t:�� ? 
                  : "Utilizing Computer Vision to overlap worker site photographs with raw CAD drawings. Detecting color or angle discrepancies before cargo leaves the factory floor."}
              </div>
            </div>

            <div className="glass-card feature-box">
              <div className="feature-icon">��;�</div>
              <div className="feature-title">{lang === "Cn" ? "OpenClaw œ?�XQcm�d�VT�(1�zW�? : "OpenClaw Daemon Follow-up"}</div>
              <div className="feature-desc">
                {lang === "Cn" 
                  ? "Ó�r6nY��]2�\m�TO�~��{ᆒ?4 Op�_i���P�n AI w�D��YkOX��PB_��?WhatsApp �m_�gL��SP�m&}�t�qX~�t&1���M}�5�� xOF]Ó��mP�k}Cho ŕ�_i��~\6^O�%1,w��? 
                  : "No manual nagging. The OpenClaw Daemon queries production states from Supabase, automatically messaging factories in Chinese on WhatsApp to fetch updates."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Client Portal (Member Center) */}
      {currentView === "ClientPortal" && (
        <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-tech)", color: "var(--accent-cyan)" }}>
                {lang === "Cn" ? "9p!2�W�m�dXw|m,l�a��C�WZ��^t_" : "CLIENT MEMBER CENTER"}
              </h2>
              <p style={{ fontSize: '0.85rem', color: "var(--text-secondary)" }}>
                ID: {order.clientName} | {lang === "Cn" ? "9p
Y�S�~C�W�Kkupabase Auth �[�c�Y5p? : "Security: Supabase Auth RLS Guarded"}
              </p>
            </div>
            <div style={{ background: "rgba(124, 114, 103, 0.08)", padding: '0.5rem 1rem', borderRadius: '2px', border: "1px solid var(--glass-border)", fontSize: '0.85rem' }}>
              {lang === "Cn" ? "0��d�Xf�)1� �ey�W��f�Y��? " : "Order Tracking: "}
              <strong style={{ color: "var(--accent-primary)", fontFamily: "var(--font-tech)", fontWeight: "bold" }}>{currentStage.id} - {lang === "Cn" ? currentStage.nameCn : currentStage.nameEn}</strong>
            </div>
          </div>

          <div className="dashboard-panels">
            {/* Left Column: Member Order Dashboard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {renderMaterialStudio()}
              <div className="glass-card">
                <div className="panel-header">
                  <div className="panel-title">��]d {lang === "Cn" ? "f�%1]9p,l�WYt�Rxr�m�^X~4d? : "Bespoke Items & Specs"}</div>
                  <span style={{ fontSize: '0.8rem', color: "var(--accent-green)", fontFamily: "var(--font-tech)" }}>
                    Total: ${getOrderTotal().toLocaleString()}
                  </span>
                </div>
                <div className="panel-body">
                  <table className="order-table">
                    <thead>
                      <tr>
                        <th>{lang === "Cn" ? "$i-W0m�~�7p" : "Item"}</th>
                        <th>{lang === "Cn" ? "��4OzV" : "Qty"}</th>
                        <th>{lang === "Cn" ? "�h�R� YWo�t? : "Material Specs"}</th>
                        <th>{lang === "Cn" ? "W��f�s" : "Price"}</th>
                        <th>{lang === "Cn" ? "Op�_x�" : "Subtotal"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map(item => (
                        <tr key={item.id} className={splitDeliveryActive && (item.qty === 38 || item.qty === 4) ? "strike-row" : ""}>
                          <td style={{ fontWeight: '500' }}>
                            {lang === "Cn" ? item.typeCn : item.typeEn}
                          </td>
                          <td>
                            {splitDeliveryActive && item.id === "ITEM-01" ? (
                              <span><span style={{ textDecoration: 'line-through', color: 'var(--accent-red)' }}>40</span> <strong style={{ color: 'var(--accent-green)' }}>38</strong></span>
                            ) : splitDeliveryActive && item.id === "ITEM-03" ? (
                              <span><span style={{ textDecoration: 'line-through', color: 'var(--accent-red)' }}>5</span> <strong style={{ color: 'var(--accent-green)' }}>4</strong></span>
                            ) : (
                              item.qty
                            )}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {lang === "Cn" ? item.materialCn : item.materialEn}
                            {item.note && <div style={{ color: 'var(--accent-orange)', fontSize: '0.75rem', marginTop: '3px' }}>{item.note}</div>}
                          </td>
                          <td>${item.unitPrice}</td>
                          <td style={{ fontWeight: 'bold' }}>${(item.unitPrice * item.qty).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step bar inside member portal */}
              <div className="glass-card" style={{ padding: '1.2rem' }}>
                <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--accent-cyan)' }}>
                  ��7d {lang === "Cn" ? "17 Õ5���R�X� �r{Z�#XI�ig�m�[ɓ? : "17-Stage Production & Compliance Journey"}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(17, 1fr)', gap: '4px', height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden' }}>
                  {stages.map((st, sidx) => {
                    let bg = "var(--bg-tertiary)";
                    if (sidx < currentStageIndex) bg = "var(--accent-green)";
                    if (sidx === currentStageIndex) bg = "var(--accent-cyan)";
                    return (
                      <div key={st.id} title={`${st.id} - ${lang === "Cn" ? st.nameCn : st.nameEn}`} style={{ background: bg, transition: 'background 0.3s' }}></div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <span>S01 Intake</span>
                  <span>S05 Crib5 Gate</span>
                  <span>S11 AI CV Gate</span>
                  <span>S17 Complete</span>
                </div>
              </div>
            </div>

            {/* Right Column: OpenClaw Web chat for member to talk directly to AI Agent */}
            <div className="glass-card">
              <div className="panel-header" style={{ background: "rgba(124, 114, 103, 0.04)" }}>
                <div className="panel-title">
                  <span className="stage-badge-dot dot-ai" style={{ background: "var(--accent-primary)" }}></span>
                  {lang === "Cn" ? "�m?Crafton AI ��
Y'dT�B%�X5pEx=v" : "Design & Swatch Agent (OpenClaw)"}
                </div>
                <span className="logo-badge">Live Chat</span>
              </div>
              <div className="panel-body chat-window">
                <div className="chat-messages">
                  {chatMessages.map((msg, midx) => (
                    <div key={midx} className={`chat-bubble ${msg.sender === "client" ? "bubble-client" : "bubble-agent"}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
                
                {/* Simulated SWATCH selectors for easier demoing */}
                <div style={{ padding: '0.8rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '100%' }}>
                    {lang === "Cn" ? "G���N]��
Y'dȕ!2�g4Z-[/v�"XcPQ��B_��yO���q��4Z6[}�? : "Fabric swatches shortcut (click to simulate):"}
                  </span>
                  <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => { setInputText("I want to check FAB-01 Royal Velvet ((��V�ე�o#{? compatibility"); setTimeout(handleSendMessage, 100); }}>
                    Royal Velvet (Crib 5 Ok)
                  </button>
                  <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderColor: 'var(--accent-red)' }} onClick={() => { setInputText("I select FAB-03 Pure Silk Satin (�~�#{�T})"); setTimeout(handleSendMessage, 100); }}>
                    Pure Silk Satin (?��r{ WILL BLOCK)
                  </button>
                </div>

                <div className="chat-input-area">
                  <input type="text" className="chat-input" placeholder={lang === "Cn" ? "Z�?AI �t$2�h��'hI_Ǔ�dpo?.." : "Ask AI Swatch or check codes..."} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                  <button className="btn-premium" onClick={handleSendMessage}>Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Internal Backoffice (Cho / Client View) */}
      {currentView === "Backoffice" && (
        <div className="dashboard-grid animate-fade-in">
          {/* Sidebar Left: 17 Stages Controller */}
          <div className="sidebar">
            <h3 className="sidebar-title">
              {lang === "Cn" ? "17Õ5���O�&1�jÓX�h^g? : "17-Stage Control Center"}
            </h3>
            <div className="stage-timeline-vertical">
              {stages.map((st, idx) => {
                let statusClass = "";
                if (idx < currentStageIndex) statusClass = "completed";
                if (idx === currentStageIndex) statusClass = "active";

                return (
                  <div key={st.id} className={`stage-item ${statusClass}`} onClick={() => handleStageChange(idx)}>
                    <span className={`stage-badge-dot dot-${st.type.toLowerCase()}`}></span>
                    <div className="stage-info">
                      <div className="stage-id">STAGE {st.id} ({st.type})</div>
                      <div className="stage-name">{lang === "Cn" ? st.nameCn : st.nameEn}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Main Admin Area */}
          <div className="main-content">
            {/* Top Phase Header */}
            <div className="glass-card phase-progress-banner">
              <div>
                <span className="logo-badge" style={{ background: "rgba(124, 114, 103, 0.08)", color: "var(--accent-primary)" }}>
                  {currentStage.phase}
                </span>
                <h2 style={{ fontFamily: "var(--font-tech)", marginTop: "0.5rem" }}>
                  Stage {currentStage.id}: {lang === "Cn" ? currentStage.nameCn : currentStage.nameEn}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                  {lang === "Cn" ? currentStage.descCn : currentStage.descEn}
                </p>
              </div>

              {/* Render Simulation Interactivity depending on current active stage */}
              <div style={{ marginLeft: 'auto' }}>
                {currentStage.id === "S04" && (
                  <button className="btn-premium" onClick={handleChoApproval}>
                    A��]{ {lang === "Cn" ? "��ptoVYt�Rxr�m?�{BOM (Human H1)" : "Approve Tech BOM (Human H1)"}
                  </button>
                )}

                {currentStage.id === "S05" && isCrib5Blocked && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem', fontWeight: 'bold' }}>?��r{ CRIB 5 BLOCK INTERCEPTED (Crib 5 �[�T�W��=��W�m?</span>
                    <button className="btn-premium" style={{ background: 'var(--accent-orange)', color: 'white' }} onClick={() => handleBypassCrib5("Navy Classic Linen")}>
                      ��'e {lang === "Cn" ? "�[�T�Wĕ�]���my���Z�Wrib 5ȕ!2�g" : "Bypass block: Change to Navy Linen"}
                    </button>
                  </div>
                )}

                {currentStage.id === "S08" && (
                  <span style={{ color: 'var(--accent-orange)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    ���a {lang === "Cn" ? "�t�\jnY�EQvf��Y�Zn�m2|_��U{W�? : "Select supplier on the right column"}
                  </span>
                )}

                {currentStage.id === "S15" && !splitDeliveryActive && (
                  <button className="btn-premium" style={{ background: 'var(--accent-red)', color: 'white' }} onClick={triggerSplitDelivery}>
                    ?�?{lang === "Cn" ? "9p!2�W��,a�VǓX[|e�-l�Xt}\�W���&l`m?j�PT�3 �W�~csr��� " : "Execute Split Delivery Strike-through"}
                  </button>
                )}

                {currentStage.id !== "S04" && currentStage.id !== "S08" && (!isCrib5Blocked) && (
                  <button className="btn-secondary" onClick={() => handleStageChange(Math.min(currentStageIndex + 1, 16))}>
                    {lang === "Cn" ? "�m)[�z�Y?(�Y!�Z4Z}OFm)" : "Next Simulation Stage C�?}
                  </button>
                )}
              </div>
            </div>

            {/* Admin Center Split Panels */}
            <div className="dashboard-panels">
              {/* Left Column: Shared Master Sheet (Memory Base) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-card">
                  <div className="panel-header">
                    <div className="panel-title">��5d Supabase O��S闓m�~�f����1| (Master Sheet)</div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {order.orderId}</span>
                  </div>
                  <div className="panel-body" style={{ padding: '1.5rem 0' }}>
                    <div className="table-container" style={{ padding: '0 1.5rem' }}>
                      <table className="order-table" style={{ minWidth: '650px' }}>
                        <thead>
                          <tr>
                            <th>{lang === "Cn" ? "$i-W0m�~�7p" : "Item"}</th>
                            <th>{lang === "Cn" ? "��4OzV" : "Qty"}</th>
                            <th>{lang === "Cn" ? "ɓ/a�]Yt�Rxr (Y��\��)" : "Bilingual Material"}</th>
                            <th>{lang === "Cn" ? "Z�X�`W��f�s" : "Unit Price"}</th>
                            <th>{lang === "Cn" ? "Op�_x�" : "Subtotal"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map(item => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: '600' }}>
                                {lang === "Cn" ? item.typeCn : item.typeEn}
                              </td>
                              <td>
                                {splitDeliveryActive && item.id === "ITEM-01" ? (
                                  <span><span style={{ textDecoration: 'line-through', color: 'var(--accent-red)' }}>40</span> C�?<strong style={{ color: 'var(--accent-green)' }}>38</strong></span>
                                ) : splitDeliveryActive && item.id === "ITEM-03" ? (
                                  <span><span style={{ textDecoration: 'line-through', color: 'var(--accent-red)' }}>5</span> C�?<strong style={{ color: 'var(--accent-green)' }}>4</strong></span>
                                ) : (
                                  item.qty
                                )}
                              </td>
                              <td style={{ fontSize: '0.8rem' }}>
                                <div style={{ color: 'var(--accent-cyan)' }}>{item.materialEn}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>{item.materialCn}</div>
                                {item.note && <div style={{ color: 'var(--accent-orange)', fontSize: '0.75rem', marginTop: '3px' }}>{item.note}</div>}
                              </td>
                              <td>
                                {selectedSupplier ? (
                                  <span><span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.75rem' }}>${item.originalUnitPrice}</span> ${item.unitPrice}</span>
                                ) : (
                                  `$${item.unitPrice}`
                                )}
                              </td>
                              <td style={{ fontWeight: 'bold' }}>${(item.unitPrice * item.qty).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Recalculated Payments at bottom of Master Sheet */}
                    <div className="payments-grid" style={{ padding: '0 1.5rem' }}>
                      {order.payments.map((p, pidx) => (
                        <div key={pidx} style={{ background: 'var(--bg-secondary)', padding: '0.8rem 0.6rem', borderRadius: '2px', border: '1px solid var(--glass-border)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.milestone}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: p.status === "Paid" ? "var(--accent-green)" : "var(--accent-orange)", marginTop: '3px' }}>
                            ${p.amount.toLocaleString()} ({p.status === "Paid" ? (lang === "Cn" ? "�[m��|" : "Paid") : (lang === "Cn" ? "ȓE�sr��� " : "Pending")})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Change Tracker Log Panel */}
                <div className="glass-card">
                  <div className="panel-header">
                    <div className="panel-title">
                      {lang === "Cn" ? "��m�?Y�;j?m9p�x�Ó�0T~ (Change Tracker Log)" : "��m�?Change Tracker Log"}
                    </div>
                  </div>
                  <div className="panel-body" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {logs.map((log, lidx) => {
                      const displayAction = lang === "Cn" 
                        ? log.action 
                        : (log.actionEn && !/[\u4e00-\u9fa5]/.test(log.actionEn) 
                            ? log.actionEn 
                            : (getLogActionEn(log.action) || log.actionEn || log.action));
                      return (
                        <div key={lidx} className="log-item">
                          <span className="log-time">{log.time}</span>
                          <span className="log-user">{log.user}:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {displayAction}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: AI OpenClaw Core Thought Console */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Integration: 17-Stage Stateful Visual Playground */}
                {renderInteractivePlayground()}

                {/* Default OpenClaw Thinking Logs Terminal */}
                <div className="glass-card">
                  <div className="panel-header" style={{ background: "rgba(124, 114, 103, 0.03)" }}>
                    <div className="panel-title">
                      <span className="stage-badge-dot dot-ai" style={{ animation: "scanEffect 2s infinite alternate", background: "var(--accent-primary)" }}></span>
                      {lang === "Cn" ? "OpenClaw œ?�XQcm�d� �o� �Q�^igĉ6^R���t_ (Thought-Process Terminal)" : "OpenClaw Thought-Process Terminal"}
                    </div>
                  </div>
                  <div className="panel-body">
                    <div className="terminal-console">
                      {mockData.agentThoughtLogs[currentStage.id] ? (
                        mockData.agentThoughtLogs[currentStage.id].map((tlog, tidx) => {
                          const roleLabel = lang === "Cn"
                            ? (tlog.role === "thought" ? "��	`I THOUGHT��? : tlog.role === "action" ? "��	`CTION CALL��? : tlog.role === "observation" ? "��,`BSERVATION��? : "��1`YSTEM��?)
                            : (tlog.role === "thought" ? "[AI THOUGHT] " : tlog.role === "action" ? "[ACTION CALL] " : tlog.role === "observation" ? "[OBSERVATION] " : "[SYSTEM] ");
                          return (
                            <div key={tidx} className={`terminal-line line-${tlog.role}`}>
                              <span>&gt; {roleLabel}</span>
                              {lang === "Cn" ? tlog.text : (tlog.textEn || tlog.text)}
                            </div>
                          );
                        })
                      ) : (
                        <div className="terminal-line line-system">
                          &gt; {lang === "Cn" 
                            ? "��1`YSTEM��\apenClaw Daemon v2.1 ���P�n�[mT�a���P�}S��]jZ�Wmnb~u�m��Yw�D��YV�&hbcT��� �P�f�'1mZ�?Supabase Webhook Yt@�B_��? 
                            : "[SYSTEM] OpenClaw Daemon v2.1 Standby. No active automated task is bound to the current stage. Listening for Supabase Webhook triggers."}
                        </div>
                      )}
                      <div ref={terminalEndRef}></div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.5rem' }}>
                      {lang === "Cn" ? "i�p�,| OpenClaw / Supabase \m)["kq��e�Y˓5�/p" : "Powered by OpenClaw & Supabase Event Architecture"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-End Glassmorphism Volumetric 3D Packing Simulation Modal */}
      {showVolumetricSimulation && (
        <div className="volumetric-modal-overlay">
          <div className="volumetric-modal-card">
            {/* Modal Header */}
            <div className="volumetric-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>��]d</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-tech)', color: 'var(--text-primary)', fontWeight: '600', letterSpacing: '0.5px' }}>
                    {lang === "Cn" ? "3D ƕ�U���~��^Z�Q�RV�&hb�*��qh�?(Live Volumetric Packing Simulation)" : "3D Volumetric Container Packing Simulation Console"}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {lang === "Cn" ? "�YE�jn��-[�?Bluehost VPS ȓ�]�Yc���0}129.121.98.185 | 5p=��j�mYc�Z�SKqx��V"r$�DZ{u	Z? : "Live executing on Bluehost VPS: 129.121.98.185 | Realtime WebGL Render & Heuristics"}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Open in New Tab Button */}
                <button 
                  onClick={() => window.open(`/loading-ai/?lang=${lang === "Cn" ? "cn" : "en"}`, '_blank')}
                  style={{
                    background: 'none',
                    border: '1px solid var(--text-primary)',
                    color: 'var(--text-primary)',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-tech)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderRadius: '2px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--text-primary)'; e.target.style.color = '#ffffff'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--text-primary)'; }}
                >
                  <span style={{ fontSize: '0.85rem' }}>+�?/span> {lang === "Cn" ? "f�&1�gR��Ur�m^��S^p�_�Nt? : "Open Fullscreen in New Tab"}
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setShowVolumetricSimulation(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s',
                    lineHeight: '1'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(28,27,24,0.08)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  A�?                </button>
              </div>
            </div>

            {/* Modal Body / Iframe Container (Perfect 100% Height Fill) */}
            <div className="volumetric-modal-body">
              <iframe 
                src={`/loading-ai/?lang=${lang === "Cn" ? "cn" : "en"}`} 
                style={{
                  width: '100%',
                  height: '100%',
                  flex: 1,
                  border: '1px solid var(--glass-border)',
                  background: '#FFFFFF',
                  borderRadius: '2px',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
                  display: 'block'
                }}
                title="3D Loading AI Simulation"
              />
            </div>

            {/* Modal Footer */}
            <div className="volumetric-modal-footer">
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {lang === "Cn" ? "��c ��.aZ0�-l�|�i�r�uSgD�r_�~��eUt,hW��~\�[cm�_ON��[�r_Ó-[�}�t&1�s�~\�[Y��bI]��(h:mY�⩔�~f��Yt�c� ? : "��c Controls: Scroll wheel to zoom, left click & drag to rotate, right click to pan."}
              </span>
              <button 
                className="btn-premium" 
                style={{ padding: '0.5rem 1.5rem' }}
                onClick={() => setShowVolumetricSimulation(false)}
              >
                {lang === "Cn" ? "�n�g�m�~6^Y�? : "Close Simulation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
