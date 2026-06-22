const fs = require('fs');
const path = require('path');

const baseFilePath = "e:\\CraftonAI\\src\\app_baseline_commit.jsx"; // We can read from our known baseline commit backup, or just app.jsx since git is clean.
const appJsPath = "e:\\CraftonAI\\src\\app.jsx";

let content = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');
console.log(`Loaded app.jsx: ${content.length} chars, ${content.split('\n').length} lines.`);

let successCount = 0;
let failCount = 0;

function applyReplace(name, target, replacement) {
  target = target.replace(/\r\n/g, '\n');
  replacement = replacement.replace(/\r\n/g, '\n');
  
  const occurrences = content.split(target).length - 1;
  if (occurrences === 0) {
    console.log(`  [FAIL] ${name}: Target not found!`);
    failCount++;
    return false;
  } else if (occurrences > 1) {
    console.log(`  [FAIL] ${name}: Multiple occurrences found (${occurrences})!`);
    failCount++;
    return false;
  } else {
    content = content.split(target).join(replacement);
    console.log(`  [SUCCESS] ${name} applied.`);
    successCount++;
    return true;
  }
}

// 1. Replay step 6027: Replace global nav links
console.log("\n--- Applying Step 6027 (Navigation Links) ---");
const step6027Args = JSON.parse(fs.readFileSync("scratch/step_6027_tc_0_args.json", "utf8"));
applyReplace("Step 6027", step6027Args.TargetContent, step6027Args.ReplacementContent);

// 2. Replay step 6051: Replace OurStory tab block with triple-tab block
console.log("\n--- Applying Step 6051 (How It Works, Bespoke Furniture, Set Furniture Tabs) ---");
const step6051Args = JSON.parse(fs.readFileSync("scratch/step_6051_tc_0_args.json", "utf8"));
applyReplace("Step 6051", step6051Args.TargetContent, step6051Args.ReplacementContent);

// 3. Replay step 86:
console.log("\n--- Applying Step 86 (CV-QA and Client Teaser Simulator) ---");
const step86Args = JSON.parse(fs.readFileSync("scratch/extracted_step_86.json", "utf8")).tool_calls[0].args;
let step86Chunks = step86Args.ReplacementChunks;
if (typeof step86Chunks === 'string') {
  step86Chunks = JSON.parse(step86Chunks);
}

// Chunk 0: State variables. Let's do a smart replacement instead of literal match
const chunk0Target = `  const [showVolumetricSimulation, setShowVolumetricSimulation] = useState(false);`;
const chunk0Replacement = `  const [showVolumetricSimulation, setShowVolumetricSimulation] = useState(false);

  // WOW effect state variables for homepage V1.2 enhancements
  const [activeSwatch, setActiveSwatch] = useState("nubuck"); // nubuck, linen, gold, walnut
  const [blueprintSliderPos, setBlueprintSliderPos] = useState(50);
  const [demoMilestone, setDemoMilestone] = useState("S01");

  // V1.3 Marketing Bespoke Simulation States
  const [marketingCvQaStatus, setMarketingCvQaStatus] = useState("idle"); // 'idle', 'scanning', 'passed', 'failed'
  const [marketingCvProgress, setMarketingCvProgress] = useState(0);
  const [marketingTeaserTab, setMarketingTeaserTab] = useState("order"); // 'order', 'packing', 'shipping'
  const [marketingPackingProgress, setMarketingPackingProgress] = useState(0);
  const [marketingPackingBoxes, setMarketingPackingBoxes] = useState([]);
  const [marketingPackingRunning, setMarketingPackingRunning] = useState(false);`;

applyReplace("Step 86 Chunk 0 (States)", chunk0Target, chunk0Replacement);

// Chunk 1: CV-QA Scan, Packing simulation, and render methods
const chunk1Target = `  const handleStartCrib5Test = () => {`;
const chunk1Replacement = `  const handleMarketingCvScan = () => {
    if (marketingCvQaStatus === "scanning") return;
    setMarketingCvQaStatus("scanning");
    setMarketingCvProgress(0);
    const interval = setInterval(() => {
      setMarketingCvProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setMarketingCvQaStatus("passed");
          return 100;
        }
        return prev + 4;
      });
    }, 100);
  };

  const handleMarketingPackingSim = () => {
    if (marketingPackingRunning) return;
    setMarketingPackingRunning(true);
    setMarketingPackingProgress(0);
    setMarketingPackingBoxes([]);
    
    const mockBoxes = [
      { id: 1, name: lang === "Cn" ? "大理石餐桌 (重) [x:5 y:5 z:5]" : "Marble Table (Heavy) [x:5 y:5 z:5]", color: "#8B5A51", w: 75, h: 25, d: 35, x: 5, y: 5, z: 5 },
      { id: 2, name: lang === "Cn" ? "真皮三人沙发 [x:80 y:5 z:5]" : "Leather Sofa [x:80 y:5 z:5]", color: "#422F25", w: 60, h: 32, d: 30, x: 80, y: 5, z: 5 },
      { id: 3, name: lang === "Cn" ? "大堂扶手椅 C-01 [x:5 y:5 z:45]" : "Lobby Chair C-01 [x:5 y:5 z:45]", color: "#7A8775", w: 25, h: 25, d: 25, x: 5, y: 5, z: 45 },
      { id: 4, name: lang === "Cn" ? "大堂扶手椅 C-02 [x:35 y:5 z:45]" : "Lobby Chair C-02 [x:35 y:5 z:45]", color: "#7A8775", w: 25, h: 25, d: 25, x: 35, y: 5, z: 45 },
      { id: 5, name: lang === "Cn" ? "定制实木大茶几 [x:5 y:35 z:5]" : "Oak Coffee Table [x:5 y:35 z:5]", color: "#C5B4A5", w: 65, h: 22, d: 40, x: 5, y: 35, z: 5 },
      { id: 6, name: lang === "Cn" ? "高档电视矮柜 [x:75 y:35 z:5]" : "Lounge TV Console [x:75 y:35 z:5]", color: "#A97C73", w: 50, h: 26, d: 22, x: 75, y: 35, z: 5 },
      { id: 7, name: lang === "Cn" ? "餐椅成套包装 [x:5 y:5 z:75]" : "Dining Chairs Pack [x:5 y:5 z:75]", color: "#A8988C", w: 70, h: 25, d: 35, x: 5, y: 5, z: 75 }
    ];

    let currentBoxIndex = 0;
    const interval = setInterval(() => {
      if (currentBoxIndex < mockBoxes.length) {
        setMarketingPackingBoxes(prev => [...prev, mockBoxes[currentBoxIndex]]);
        currentBoxIndex++;
        setMarketingPackingProgress(Math.floor((currentBoxIndex / mockBoxes.length) * 100));
      } else {
        clearInterval(interval);
        setMarketingPackingRunning(false);
      }
    }, 600);
  };

  const renderCVQASimulator = () => {
    return (
      <div className="cv-qa-simulator-container" style={{
        marginTop: '6rem',
        borderTop: '1px solid rgba(124, 114, 103, 0.15)',
        paddingTop: '5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '0.8rem' }}>
            {lang === "Cn" ? "AI 視覺診斷" : "AUTONOMOUS QA"}
          </span>
          <h3 style={{
            fontSize: '2rem',
            fontFamily: 'var(--font-tech)',
            color: 'var(--text-primary)',
            fontWeight: '300',
            letterSpacing: '0.02em',
            marginBottom: '1rem'
          }}>
            {lang === "Cn" ? "AI Computer Vision QA 視覺質檢診斷" : "AI Computer Vision QA Diagnostics HUD"}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '300', maxWidth: '640px', margin: '0 auto' }}>
            {lang === "Cn"
              ? "利用高分辨率相機與邊緣 AI 智能體，在出廠前對家具進行 3D 物理尺寸比對與縫線完整度掃描，自動識別小於 0.5mm 的裝配公差與瑕疵。"
              : "Utilizing high-definition localized optical scanners coupled with edge AI, the platform runs automatic physical-to-blueprint alignment checks, flagging structural deviations under 0.5mm."}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'center'
        }}>
          {/* Left Panel: The Scanner HUD View */}
          <div style={{
            background: '#0D0D0B',
            borderRadius: '4px',
            border: '1px solid #1C1C19',
            padding: '1.5rem',
            fontFamily: 'monospace',
            color: '#A09C94',
            fontSize: '0.75rem',
            position: 'relative',
            minHeight: '340px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
          }}>
            {/* Hologram/Scanner background */}
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              color: marketingCvQaStatus === 'passed' ? 'var(--accent-green)' : marketingCvQaStatus === 'scanning' ? 'var(--accent-orange)' : '#7C7267',
              fontSize: '0.62rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span className={marketingCvQaStatus === 'scanning' ? 'animate-pulse' : ''}>●</span>
              <span>{marketingCvQaStatus.toUpperCase()}</span>
            </div>

            <div style={{ color: 'rgba(160,156,148,0.4)', fontSize: '0.62rem', marginBottom: '1rem' }}>
              SYS.LOC // OPTICAL_QA_GATE_04 // V1.3
            </div>

            <div style={{
              height: '200px',
              border: '1px solid rgba(160,156,148,0.15)',
              background: '#050504',
              borderRadius: '2px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              {/* Scan grid effect */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(rgba(160,156,148,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(160,156,148,0.03) 1px, transparent 1px)',
                backgroundSize: '12px 12px'
              }} />

              {/* Wireframe static or scanning */}
               <div className="blueprint-chair-wrapper" style={{
                width: '80%',
                height: '80%',
                opacity: marketingCvQaStatus === 'scanning' ? 0.7 : 0.9,
                filter: marketingCvQaStatus === 'scanning' ? 'brightness(0.9) saturate(1.2)' : 'none',
                transition: 'var(--transition-smooth)'
              }}>
                {renderChairSVG(selectedFabric, selectedLeg)}
              </div>

              <div className={`cad-wireframe-overlay ${marketingCvQaStatus === 'passed' ? 'snapped' : 'wobbling'}`} style={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {renderChairSVG(selectedFabric, selectedLeg, {
                  stroke: '#A8988C',
                  strokeWidth: '1.5',
                  fill: 'none',
                  opacity: marketingCvQaStatus === 'passed' ? 0.9 : 0.4,
                  strokeDasharray: marketingCvQaStatus === 'passed' ? 'none' : '3,3',
                  filter: 'drop-shadow(0 0 2px rgba(168,152,140,0.3))'
                })}
              </div>

              {/* Scan sweep line */}
              {marketingCvQaStatus === 'scanning' && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  width: '100%',
                  height: '2px',
                  background: 'var(--accent-secondary)',
                  boxShadow: '0 0 8px var(--accent-secondary)',
                  top: `${marketingCvProgress}%`,
                  zIndex: 2,
                  animation: 'none'
                }} />
              )}

              {/* Target locking indicator */}
              {marketingCvQaStatus === 'passed' && (
                <div style={{
                  position: 'absolute',
                  border: '1px solid var(--accent-green)',
                  width: '40px',
                  height: '40px',
                  top: '40%',
                  left: '42%',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ width: '4px', height: '4px', background: 'var(--accent-green)' }}></div>
                </div>
              )}
            </div>

            {/* Diagnostic Logs terminal */}
            <div style={{ color: '#88857E', fontSize: '0.68rem', lineHeight: '1.5', height: '60px', overflowY: 'hidden' }}>
              {marketingCvQaStatus === 'idle' && (
                <div>&gt; STANDBY: Waiting for scan trigger...</div>
              )}
              {marketingCvQaStatus === 'scanning' && (
                <>
                  <div>&gt; SCANNING: Point cloud mapping running ({marketingCvProgress}%)</div>
                  <div>&gt; ANALYZING: Comparing 3D surface mesh to design CAD...</div>
                </>
              )}
              {marketingCvQaStatus === 'passed' && (
                <>
                  <div style={{ color: 'var(--accent-green)' }}>&gt; PASS: Dev. &lt; 0.35mm [Tuscan Armchair FAB-02]</div>
                  <div>&gt; DIAGNOSTICS: Seams: 100% | Joint Tensile: NOMINAL</div>
                  <div style={{ color: 'var(--accent-green)' }}>&gt; STATUS: Certificate generated & cryptographic block signed.</div>
                </>
              )}
            </div>
          </div>

          {/* Right Panel: Interactive controls and explanations */}
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
              REAL-TIME PHYSICAL AUDIT
            </span>
            <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              {lang === "Cn" ? "毫秒级三维公差审计，拒绝出厂瑕疵" : "Sub-millimeter assembly tolerance check."}
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', marginBottom: '1.5rem' }}>
              {lang === "Cn"
                ? "传统的质检全凭人工肉眼，极易漏检暗裂、缝线不齐和轻微公差扭曲。我们的 CV-QA 系统在出厂前对每个成品进行无接触式光学扫描。只有通过 3D 点云对齐测试（误差小于 0.5 毫米）的家具，才能获得独一无二的合格证哈希并打包发货。"
                : "Manual quality inspection often misses minor symmetry deviations, stitch slips, or internal alignment issues. Our localized edge AI cameras perform contact-free mesh scanning of every single item, ensuring perfect congruence with original blueprints before packaging approvals."}
            </p>

            <button 
              className="btn-premium" 
              onClick={handleMarketingCvScan}
              disabled={marketingCvQaStatus === "scanning"}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {marketingCvQaStatus === "scanning" ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>{lang === "Cn" ? `正在扫描中 ${marketingCvProgress}%` : `Scanning ${marketingCvProgress}%`}</span>
                </>
              ) : marketingCvQaStatus === "passed" ? (
                <span>✓ {lang === "Cn" ? "扫描通过，证书已生成" : "QC Audit Passed"}</span>
              ) : (
                <span>⚡ {lang === "Cn" ? "立即启动 AI 视觉扫描" : "Trigger AI Optical Scan"}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderClientPortalTeaser = () => {
    return (
      <div className="portal-teaser-container" style={{
        marginTop: '6rem',
        borderTop: '1px solid rgba(124, 114, 103, 0.15)',
        paddingTop: '5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '0.8rem' }}>
            {lang === "Cn" ? "客戶訂單門戶預覽" : "CLIENT PORTAL EXPERIENCE"}
          </span>
          <h3 style={{
            fontSize: '2rem',
            fontFamily: 'var(--font-tech)',
            color: 'var(--text-primary)',
            fontWeight: '300',
            letterSpacing: '0.02em',
            marginBottom: '1rem'
          }}>
            {lang === "Cn" ? "Your order, automated. Backed by quiet, tireless AI." : "Your order, automated. Backed by quiet, tireless AI."}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '300', maxWidth: '640px', margin: '0 auto' }}>
            {lang === "Cn"
              ? "每个 B2B 会员客户都拥有专属订单门户，能够透明跟踪从图纸审核、排产装箱到海上航行的实时状态，尽享完全放心的省心体验。"
              : "Every premium contract partner is backed by a custom private portal, providing full visibility from initial CAD file ingestions and volumetric stacking, up to live GPS marine freight coordinates."}
          </p>
        </div>

        {/* Portal dashboard tab container */}
        <div className="glass-card" style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '6px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.02)'
        }}>
          {/* Sub tabs in teaser */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            borderBottom: '1px solid rgba(124, 114, 103, 0.12)',
            paddingBottom: '1rem',
            marginBottom: '2rem',
            overflowX: 'auto'
          }}>
            <button 
              onClick={() => setMarketingTeaserTab("order")}
              style={{
                background: 'none',
                border: 'none',
                paddingBottom: '0.4rem',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-tech)',
                cursor: 'pointer',
                color: marketingTeaserTab === 'order' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: marketingTeaserTab === 'order' ? '1.5px solid var(--accent-primary)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              📋 {lang === "Cn" ? "1. 订单实时追踪" : "1. Order Blueprint Tracker"}
            </button>
            <button 
              onClick={() => {
                setMarketingTeaserTab("packing");
                if (marketingPackingBoxes.length === 0) handleMarketingPackingSim();
              }}
              style={{
                background: 'none',
                border: 'none',
                paddingBottom: '0.4rem',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-tech)',
                cursor: 'pointer',
                color: marketingTeaserTab === 'packing' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: marketingTeaserTab === 'packing' ? '1.5px solid var(--accent-primary)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              📦 {lang === "Cn" ? "2. 3D智能集装箱堆叠" : "2. 3D Container Stacking Simulator"}
            </button>
            <button 
              onClick={() => setMarketingTeaserTab("shipping")}
              style={{
                background: 'none',
                border: 'none',
                paddingBottom: '0.4rem',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-tech)',
                cursor: 'pointer',
                color: marketingTeaserTab === 'shipping' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: marketingTeaserTab === 'shipping' ? '1.5px solid var(--accent-primary)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              🚢 {lang === "Cn" ? "3. 海上GPS定位追踪" : "3. GPS Logistics Monitor"}
            </button>
          </div>

          {/* Teaser Tab Contents */}
          {marketingTeaserTab === "order" && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
              <div>
                <span className="logo-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>PORTAL PREVIEW — BLUEPRINT STATUS</span>
                <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                  {lang === "Cn" ? "📋 订单規格與審計狀態一目了然" : "📋 Real-time CAD parsing & change logs"}
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', marginBottom: '1.2rem' }}>
                  {lang === "Cn"
                    ? "通过将 CAD 蓝图直接上传至我们的平台，AI 智能体将自动解析家具的各项物理尺寸、面料安全合规（Crib 5 等）及出厂工艺，并生成实时的双语工艺包（Dossier），所有因现场要求产生的细节变更都会在 Change Logs 中形成不可篡改的加密历史，彻底告别传真、微信沟通错漏。"
                    : "Skip complex spreadsheets. When our engineers and agents refine dimensions or process material choices, the ledger logs every revision with cryptographic SHA-256 validation hashes, synchronizing updates to you instantly in standard English and Chinese dossiers."}
                </p>
                <div style={{ padding: '0.6rem 0.8rem', background: '#FAF7F2', borderRadius: '2px', borderLeft: '3px solid var(--accent-primary)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <strong>{lang === "Cn" ? "最新日志:" : "Latest Action:"}</strong> [S04: CAD Parsing Passed] {lang === "Cn" ? "面料 BS5852 Crib 5 合规认证通过" : "Material BS5852 flammability standard cleared."}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ border: '1px solid rgba(124,114,103,0.12)', padding: '1rem', borderRadius: '3px', background: '#FAF9F6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    <span>📦 ORDER_ID: CRAFTON-7049</span>
                    <span style={{ color: 'var(--accent-green)' }}>● IN PRODUCTION</span>
                  </div>
                  <div style={{ height: '4px', background: '#EAE6E1', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: '68%', height: '100%', background: 'var(--accent-primary)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                    <span>{lang === "Cn" ? "蓝图上传解析" : "CAD Ingest"}</span>
                    <span>{lang === "Cn" ? "物料合规审计" : "QC Audit"}</span>
                    <span>{lang === "Cn" ? "海上物流追踪" : "Vessel GPS"}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.68rem', fontFamily: 'monospace', color: '#7C7267' }}>
                  <div>&gt; [S01: CAD Upload] {lang === "Cn" ? "智能体开始多维提取..." : "Agent extraction started..."}</div>
                  <div>&gt; [S02: Compliance] {lang === "Cn" ? "Crib 5 阻燃审查: PASS" : "Crib 5 audit: PASS"}</div>
                  <div>&gt; [S03: Cost Audit] {lang === "Cn" ? "BOM 核算完成, 利润模型平衡" : "BOM calculation complete"}</div>
                </div>
              </div>
            </div>
          )}

          {marketingTeaserTab === "packing" && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
              <div>
                <span className="logo-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>PORTAL PREVIEW — 3D VOLUMETRIC</span>
                <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                  {lang === "Cn" ? "📦 3D 三维堆叠装箱模拟，拒绝货损与拼箱浪费" : "📦 3D Container Stacking Simulator"}
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', marginBottom: '1.2rem' }}>
                  {lang === "Cn"
                    ? "由于高档定制家具具有不同的奇形异状，传统人工装箱极易造成空间浪费，或者将重物堆在娇贵面料上造成挤压货损。我们的 3D 堆叠算法会在工厂装箱前，根据每件家具的 3D 外包尺寸及承重属性进行 10,000 次空间模拟，规划最完美的装载路径，空间利用率直达 92% 以上。"
                    : "Irregular bespoke chairs and stone tables cause severe loading puzzles. Instead of guessing, our multi-agent stacker runs 10,000 spatial permutations, placing heavy items at the base and cushioning fine leather above, maximizing container space utilization up to 92% and preventing cargo friction damage."}
                </p>
                <button 
                  className="btn-premium" 
                  onClick={handleMarketingPackingSim}
                  disabled={marketingPackingRunning}
                  style={{ fontSize: '0.72rem', padding: '0.4rem 1rem' }}
                >
                  {marketingPackingRunning ? (
                    <span>⏳ {lang === "Cn" ? `正在装箱中 ${marketingPackingProgress}%` : `Simulating Stacking ${marketingPackingProgress}%`}</span>
                  ) : (
                    <span>⚡ {lang === "Cn" ? "重新运行 3D 堆栈模拟" : "Run Stacking permuter"}</span>
                  )}
                </button>
              </div>
              <div style={{
                height: '240px',
                background: '#FAF7F2', 
                border: '1px solid rgba(124,114,103,0.1)', 
                borderRadius: '3px', 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <div className="isometric-container-stage" style={{
                  position: 'relative',
                  width: '180px',
                  height: '110px',
                  background: 'rgba(66, 47, 37, 0.05)',
                  border: '1.5px solid var(--accent-secondary)',
                  borderRadius: '2px',
                  boxShadow: 'inset 0 0 15px rgba(0,0,0,0.03)'
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'linear-gradient(rgba(124,114,103,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,114,103,0.08) 1px, transparent 1px)',
                    backgroundSize: '10px 10px'
                  }}></div>

                  {marketingPackingBoxes.map(box => (
                    <div 
                      key={box.id}
                      className="packed-cube-item"
                      style={{
                        position: 'absolute',
                        left: `${box.x}%`,
                        bottom: `${box.y}%`,
                        width: `${box.w}%`,
                        height: `${box.h}%`,
                        backgroundColor: box.color,
                        border: '1px solid #FAF9F6',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        opacity: 0.85,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.45rem',
                        color: 'white',
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        zIndex: box.z,
                        borderRadius: '1px',
                        transform: 'translateY(-2px)'
                      }}
                      title={box.name}
                    >
                      B-{box.id}
                    </div>
                  ))}

                  {marketingPackingBoxes.length === 0 && (
                    <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {lang === "Cn" ? "集装箱处于空载" : "Container Empty"}
                    </div>
                  )}

                  {marketingPackingBoxes.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'var(--accent-green)',
                      color: 'white',
                      padding: '1px 4px',
                      fontSize: '0.52rem',
                      borderRadius: '1px',
                      fontWeight: 'bold'
                    }}>
                      {lang === "Cn" ? `空间率: ${60 + marketingPackingBoxes.length * 5.4}%` : `UTIL: ${60 + marketingPackingBoxes.length * 5.4}%`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {marketingTeaserTab === "shipping" && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
              <div>
                <span className="logo-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>PORTAL PREVIEW — TRANSIT TRACKER</span>
                <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                  {lang === "Cn" ? "🚢 海运货运GPS监控与在途轨迹同步" : "🚢 Sea-Freight GPS Vessel Tracker"}
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', marginBottom: '1.2rem' }}>
                  {lang === "Cn"
                    ? "我们的后台订单系统无缝对接了全球海运跟踪 API。您的货物装箱离港后，会员后台的进度大条会自动激活 GPS 联动，向您推送承运货轮的最新航行轨迹、经纬度及预计抵港 ETA，无需您打电话去海运代理行索要，一切动态皆在掌中。"
                    : "Once your container is cleared at the customs gateway, our tracking platform directly interfaces with major marine transponders via shipping APIs. GPS coordinate maps update on your member portal dashboard, offering instant visual tracking of the vessel speed, coordinates, and predicted ETA, cutting traditional freight agent communication lag."}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  <div>🚢 {lang === "Cn" ? "承运货轮: TUSCAN BREEZE v12" : "Vessel: TUSCAN BREEZE v12"}</div>
                  <div>📍 {lang === "Cn" ? "当前海域: 英吉利海峡 (English Channel)" : "Location: English Channel"}</div>
                  <div>📅 {lang === "Cn" ? "预计抵达 ETA: 2026年7月2日" : "Estimated Arrival ETA: July 2, 2026"}</div>
                </div>
              </div>
              <div style={{ height: '240px', background: '#FAF7F2', border: '1px solid rgba(124,114,103,0.1)', borderRadius: '3px', position: 'relative', overflow: 'hidden', flex: 1 }}>
                <svg viewBox="0 0 200 120" width="100%" height="100%" style={{ stroke: '#C5B4A5', strokeWidth: '1.2', fill: 'none', strokeLinecap: 'round' }}>
                  <path d="M 10,20 Q 40,5 60,30 T 110,15 T 160,40 T 190,10" style={{ stroke: 'rgba(124,114,103,0.15)', strokeWidth: '3' }} />
                  <path d="M 20,90 Q 50,110 80,85 T 130,100 T 180,80" style={{ stroke: 'rgba(124,114,103,0.15)', strokeWidth: '3' }} />
                  <path d="M 20,40 Q 60,65 110,50 T 180,25" style={{ stroke: 'var(--accent-muted)', strokeWidth: '1', strokeDasharray: '3,3' }} />
                  
                  <circle cx="20" cy="40" r="3" style={{ fill: 'var(--accent-muted)' }} />
                  <text x="25" y="44" style={{ fill: 'var(--text-secondary)', fontSize: '5px', fontFamily: 'monospace', fontWeight: 'bold' }}>CN_SZN</text>
                  
                  <circle cx="180" cy="25" r="3" style={{ fill: 'var(--accent-muted)' }} />
                  <text x="155" y="22" style={{ fill: 'var(--text-secondary)', fontSize: '5px', fontFamily: 'monospace', fontWeight: 'bold' }}>UK_LGP</text>
                  
                  <circle cx="120" cy="45" r="5" style={{ fill: 'var(--accent-green)', stroke: '#FAF9F6', strokeWidth: '1.5' }} />
                  <circle cx="120" cy="45" r="9" style={{ fill: 'none', stroke: 'var(--accent-green)', strokeWidth: '0.8', opacity: 0.6 }} className="pulse-indicator" />
                  
                  <text x="110" y="60" style={{ fill: 'var(--accent-green)', fontSize: '5px', fontFamily: 'monospace', fontWeight: 'bold' }}>TUSCAN_BREEZE_v12</text>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleStartCrib5Test = () => {`;

applyReplace("Step 86 Chunk 1 (Helper functions & renderers)", chunk1Target, chunk1Replacement);

// Chunk 2: Integration of CV-QA Simulator and Client Teaser below renderMaterialStudio()
const chunk2Target = `              {/* Material Configurator Section */}
              <div style={{ borderTop: '1px solid rgba(124, 114, 103, 0.15)', paddingTop: '5rem' }}>
                <div style={{ textAlign: 'left', marginBottom: '3rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.8rem', fontWeight: '300', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {lang === "Cn" ? "面料與飾面定製工坊" : "Interactive Material Studio"}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '300' }}>
                    {lang === "Cn" ? "實時探索不同的面料組合、椅腿飾面，並即時查看 Crib 5 消防安全性預審結果。" : "Explore rich fabric selections, metal leg profiles, and run a live British Crib 5 flammability pre-audit."}
                  </p>
                </div>
                {renderMaterialStudio()}
              </div>`;

const chunk2Replacement = `              {/* Material Configurator Section */}
              <div style={{ borderTop: '1px solid rgba(124, 114, 103, 0.15)', paddingTop: '5rem' }}>
                <div style={{ textAlign: 'left', marginBottom: '3rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.8rem', fontWeight: '300', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {lang === "Cn" ? "面料與飾面定製工坊" : "Interactive Material Studio"}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '300' }}>
                    {lang === "Cn" ? "實時探索不同的面料組合、椅腿飾面，並即時查看 Crib 5 消防安全性預審結果。" : "Explore rich fabric selections, metal leg profiles, and run a live British Crib 5 flammability pre-audit."}
                  </p>
                </div>
                {renderMaterialStudio()}
                {renderCVQASimulator()}
                {renderClientPortalTeaser()}
              </div>`;

applyReplace("Step 86 Chunk 2 (Embedding simulators in BespokeFurniture)", chunk2Target, chunk2Replacement);

// 4. Replay step 158: Integration of furniture_scan.mp4 loop video
console.log("\n--- Applying Step 158 (MP4 Scanner Integration) ---");
const step158Args = JSON.parse(fs.readFileSync("scratch/extracted_step_158.json", "utf8")).tool_calls[0].args;
applyReplace("Step 158", step158Args.TargetContent, step158Args.ReplacementContent);

// 5. Replay step 188: Fix handleMarketingPackingSim closure bug
console.log("\n--- Applying Step 188 (Asynchronous Closure Safety Fix) ---");
const step188Args = JSON.parse(fs.readFileSync("scratch/extracted_step_188.json", "utf8")).tool_calls[0].args;
applyReplace("Step 188", step188Args.TargetContent, step188Args.ReplacementContent);

// 6. Replay step 226: Adjust renderClientPortalTeaser spacing for top alignment
console.log("\n--- Applying Step 226 (Spacing Teaser adjustment) ---");
const step226Args = JSON.parse(fs.readFileSync("scratch/extracted_step_226.json", "utf8")).tool_calls[0].args;
applyReplace("Step 226", step226Args.TargetContent, step226Args.ReplacementContent);

// 7. Replay step 230: Reorder blocks in BespokeFurniture and remove renderMaterialStudio() from there
console.log("\n--- Applying Step 230 (Tab Layout Reordering & Studio deletion) ---");
const step230Args = JSON.parse(fs.readFileSync("scratch/extracted_step_230.json", "utf8")).tool_calls[0].args;
applyReplace("Step 230", step230Args.TargetContent, step230Args.ReplacementContent);

console.log(`\n========================================`);
console.log(`Reconstruction complete: Successes: ${successCount}, Failures: ${failCount}`);

if (failCount === 0) {
  fs.writeFileSync(appJsPath, content.replace(/\n/g, '\r\n'));
  console.log(`\n[SUCCESS] Saved perfectly reconstructed app.jsx to ${appJsPath}`);
} else {
  console.log(`\n[FAIL] Did not save because some steps failed.`);
}
