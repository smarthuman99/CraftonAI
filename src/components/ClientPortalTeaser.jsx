import React, { useState, useEffect, useRef } from 'react';

const ClientPortalTeaser = ({ lang, selectedFabric, selectedLeg, setActiveIntakeModal }) => {
  const [marketingTeaserTab, setMarketingTeaserTab] = useState("specs"); // 'specs', 'inspection', 'packing', 'shipping'
  const [marketingPackingProgress, setMarketingPackingProgress] = useState(0);
  const [marketingPackingBoxes, setMarketingPackingBoxes] = useState([]);
  const [marketingPackingRunning, setMarketingPackingRunning] = useState(false);
  const packingIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (packingIntervalRef.current) {
        clearInterval(packingIntervalRef.current);
      }
    };
  }, []);

  const handleMarketingPackingSim = () => {
    if (marketingPackingRunning) return;
    setMarketingPackingRunning(true);
    setMarketingPackingProgress(0);
    setMarketingPackingBoxes([]);

    if (packingIntervalRef.current) {
      clearInterval(packingIntervalRef.current);
    }
    
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
    packingIntervalRef.current = setInterval(() => {
      if (currentBoxIndex < mockBoxes.length) {
        const boxToPush = mockBoxes[currentBoxIndex];
        setMarketingPackingBoxes(prev => [...prev, boxToPush]);
        
        currentBoxIndex++;
        setMarketingPackingProgress(Math.floor((currentBoxIndex / mockBoxes.length) * 100));
      } else {
        clearInterval(packingIntervalRef.current);
        setMarketingPackingRunning(false);
      }
    }, 600);
  };

  return (
    <div className="portal-teaser-container" style={{
      marginTop: '0',
      paddingTop: '0'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '0.8rem' }}>
          {lang === "Cn" ? "AI 护航：订单跟进与客户控制台" : "AI DRIVEN: ORDER TRACKING & CLIENT CONSOLE"}
        </span>
        <h2 style={{
          fontSize: '2.2rem',
          fontFamily: 'var(--font-tech)',
          color: 'var(--text-primary)',
          fontWeight: '300',
          letterSpacing: '0.02em',
          marginBottom: '1rem'
        }}>
          {lang === "Cn" ? "登录专属会员中心，随时随地掌握全局" : "Your order, automated. Backed by quiet, tireless AI."}
        </h2>
        <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '300', lineHeight: '1.6' }}>
          {lang === "Cn"
            ? "定制家具最让人焦虑的是交期与品质。在 Crafton，我们摒弃传统的催货电话。客户在会员中心可实时享用受 AI 护航的高级订单状态监控，让生产、合规、海运全部透明化。"
            : "Bespoke contract manufacturing shouldn't be a black box. Our AI systems continuously monitor tolerances, compliance checkpoints, container loading rate, and sea transit coordinates, updating your dashboard in real-time."}
        </p>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '1rem', 
        maxWidth: '1000px', 
        margin: '0 auto 3rem auto',
        background: '#FAF7F2',
        border: '1px solid rgba(124, 114, 103, 0.12)',
        padding: '0.6rem',
        borderRadius: '4px'
      }}>
        {[
          { id: 'specs', icon: '📁', cn: 'AI 需求转规格', en: '1. Intake Specs' },
          { id: 'inspection', icon: '🔍', cn: 'AI 视觉对齐质检', en: '2. AI CV-QA Check' },
          { id: 'packing', icon: '📦', cn: 'AI 3D 排柜优化', en: '3. 3D Packing' },
          { id: 'shipping', icon: '🚢', cn: '海运物流追踪', en: '4. Transit Tracker' }
        ].map(step => (
          <button
            key={step.id}
            onClick={() => setMarketingTeaserTab(step.id)}
            style={{
              flex: '1',
              minWidth: '180px',
              padding: '0.8rem 1rem',
              border: 'none',
              background: marketingTeaserTab === step.id ? 'var(--accent-primary)' : 'transparent',
              color: marketingTeaserTab === step.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.78rem',
              fontWeight: '600',
              letterSpacing: '0.5px',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <span>{step.icon}</span>
            <span>{lang === "Cn" ? step.cn : step.en}</span>
          </button>
        ))}
      </div>

      <div className="glass-card animate-fade-in" style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: '4px',
        padding: '2.5rem',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        textAlign: 'left'
      }}>
        {marketingTeaserTab === "specs" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <span className="logo-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>PORTAL PREVIEW — INTAKE</span>
              <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                {lang === "Cn" ? "📁 多格式需求智能提取与抗篡改哈希" : "📁 Loose Technical Intake & Compliance Audit"}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', marginBottom: '1.2rem' }}>
                {lang === "Cn"
                  ? "当您将手绘草图、技术 PDF、或包含面料明细的 Excel 表格拖入会员中心时，AI 智能体将在数秒内提取尺寸参数与材质清单，生成中英对照的技术 BOM。所有的初始规格、物料确认等一经确定，均会计算抗篡改 SHA-256 文件指纹进行云归档，绝无口头推诿空间。"
                  : "No matter if you throw sketchy CAD designs, messy Excel schedule worksheets, or plain text emails, our systems automatically organize them into a clean, bilingual Bill of Materials (BOM). The final specification receives a secure SHA-256 hash stamp, serving as an unalterable manufacturing master file."}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', background: '#F4F2EE', padding: '0.3rem 0.6rem', color: 'var(--accent-primary)', fontWeight: '600', borderRadius: '2px' }}>✓ IPPC Fumigation PDF</span>
                <span style={{ fontSize: '0.72rem', background: '#F4F2EE', padding: '0.3rem 0.6rem', color: 'var(--accent-primary)', fontWeight: '600', borderRadius: '2px' }}>✓ Crib 5 Cert</span>
                <span style={{ fontSize: '0.72rem', background: '#F4F2EE', padding: '0.3rem 0.6rem', color: 'var(--accent-primary)', fontWeight: '600', borderRadius: '2px' }}>✓ Custom Declaration</span>
              </div>
            </div>
            <div style={{ background: '#FAF7F2', border: '1px solid rgba(124,114,103,0.1)', borderRadius: '3px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflow: 'hidden' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--accent-muted)', borderBottom: '1px solid rgba(124,114,103,0.1)', paddingBottom: '0.4rem', fontWeight: 'bold' }}>
                INTAKE AGENT AUDIT LOGS [SECURE HASH]
              </div>
              {[
                { time: "09:42:01", msg: "Scanning uploaded 'Drawing_04_VIP_LobbyChair.pdf'...", en: "Scanning uploaded 'Drawing_04_VIP_LobbyChair.pdf'..." },
                { time: "09:42:03", msg: "Extracted W:650mm, H:850mm, D:600mm. Matching with Crib 5...", en: "Extracted W:650mm, H:850mm, D:600mm. Matching with Crib 5..." },
                { time: "09:42:04", msg: "Specification finalized. Secure signature generated.", en: "Specification finalized. Secure signature generated." }
              ].map((log, idx) => (
                <div key={idx} style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <span style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>[{log.time}]</span>
                  {lang === "Cn" ? log.msg : log.en}
                </div>
              ))}
              <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', fontFamily: 'monospace', background: 'rgba(124,114,103,0.06)', padding: '0.4rem', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-secondary)' }}>
                HASH: 8f5c90b6a7d18721c4b2e70e17631bd4
              </div>
            </div>
          </div>
        )}

        {marketingTeaserTab === "inspection" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <span className="logo-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>PORTAL PREVIEW — INSPECTION</span>
              <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                {lang === "Cn" ? "🔍 物理公差点云比对与全息质检卡点" : "🔍 Computer Vision Point-Cloud Match Audit"}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', marginBottom: '1.2rem' }}>
                {lang === "Cn"
                  ? "当您的订单在车间落料组装完毕后，AI 视觉质检系统会自动开启云端照片比对。我们在上方为您专门提供了一个实机交互体验。点击上方的“开启 AI 视觉对准质检”按钮，您可以切身感受我们的 AI 是如何通过特征点提取、点云重叠来判断实物偏差的。质检结果将作为您订单的核心出厂证明，在线随时可查。"
                  : "Once assembly is completed at our partner factories, high-resolution capturing cams snap photos and query our cloud-based CV networks. To see this in action, scroll up and click the '⚡ Run AI CV Diagnosis' button to run a live simulation. Every report is stored as a cryptographically signed QA sheet, eliminating manual tolerance oversight entirely."}
              </p>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
                {lang === "Cn" ? "点云检测极差限值: 0.15mm 以内" : "Maximum alignment tolerance threshold: < 0.15mm"}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed var(--accent-secondary)', borderRadius: '4px', background: '#F8F6F2', flex: 1 }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>🔍</span>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {lang === "Cn" ? "物理 CV-QA 交互模拟器处于就绪" : "Interactive CV-QA Simulator Ready"}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>
                {lang === "Cn" ? "请滚动至上方，在定制工坊面料选项旁，一键体验 AI 实机边缘对齐质检！" : "Scroll to the interactive playground above to run the live scan diagnostics!"}
              </div>
            </div>
          </div>
        )}

        {marketingTeaserTab === "packing" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <span className="logo-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>PORTAL PREVIEW — OPTIMIZED PACKING</span>
              <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                {lang === "Cn" ? "📦 3D 货柜物理体积堆叠排柜优化" : "📦 3D Container Stacking & Cargo Protection Optimization"}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', marginBottom: '1.2rem' }}>
                {lang === "Cn"
                  ? "由于合约家具订单一般具有大理石台面、异形真皮沙发等笨重或怕挤压件，人工排柜极易导致装载率低或运输破损。我们的 AI 自动根据所有成品包装箱的长宽高，进行 3D 刚体堆叠算法排布（重货在底，轻货在顶，严格防倒置），使装箱空间效率提升至 98.2% 以上。点击左侧的按钮，即可体验 AI 极速装货柜的震撼过程。"
                  : "For hospitality contract shipments containing heavy marble tables and delicate custom-wrapped velvet sofas, unoptimized container packing results in high shipping costs or freight damage. Our AI calculates a precise 3D rigid-body stack (heavy units at the bottom, lightweight cushions on top, zero rotation conflicts) maximizing utilization rate up to 98.2%. Run the live simulation on the right to witness the stacking algorithm."}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  className="btn-premium" 
                  onClick={handleMarketingPackingSim}
                  disabled={marketingPackingRunning}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.72rem', background: marketingPackingRunning ? 'var(--accent-muted)' : 'var(--accent-primary)' }}
                >
                  {marketingPackingRunning 
                    ? (lang === "Cn" ? `装货中 ${marketingPackingProgress}%` : `Packing ${marketingPackingProgress}%`)
                    : (lang === "Cn" ? "▶ 运行 3D 堆叠算法" : "▶ Start 3D Stacking Sim")}
                </button>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {lang === "Cn" ? `已装载箱数: ${marketingPackingBoxes.length} / 7` : `Items Stacked: ${marketingPackingBoxes.length} / 7`}
                </span>
              </div>
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

export default ClientPortalTeaser;
