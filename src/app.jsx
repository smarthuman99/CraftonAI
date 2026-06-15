/**
 * Crafton AI - Premium Interactive React Prototype Engine
 * Dual-Facing: (1) Client Website & Portal (2) Internal Backoffice & OpenClaw Console
 */

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import mockData from './mockData';

// Modularized components
import ChairSVG from './components/ChairSVG';
import MaterialStudio from './components/MaterialStudio';
import CVQASimulator from './components/CVQASimulator';
import ClientPortalTeaser from './components/ClientPortalTeaser';
import ErrorBoundary from './components/ErrorBoundary';

const IMAGES = {
  heroChair: "/hero_chair.jpg", // 侘寂奢華皮質單椅 (取代 image1)
  workflowPhases: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop", // 手作工坊布樣與尺規 (取代 image2)
  masterShowwall: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop", // 意式奢華客廳實景 (取代 image3)
  wabiTextures: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop", // 暖沙天然洞石幾何特寫 (取代 image4)
  blueprintIntake: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop", // 設計手繪手稿與墨線圖 (取代 image5)
  caseGeneva: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop", // Westlake Penthouse 瑞士日內瓦豪宅 (案例 1)
  caseMayfair: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop", // Portal Hedge Fund 倫敦對沖基金辦公室 (案例 2)
  caseBermondsey: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop", // Bermondsey Lofts 工業風公寓 (案例 3)
  caseBathHotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop", // The Stow Boutique Hotel 精品客房 (案例 4)
  caseCamden: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=600&auto=format&fit=crop", // Camden Creative Studios 創意共享空間 (案例 5)
  setMilano: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop", // Milano Elegance
  setToscana: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800&auto=format&fit=crop", // Toscana Warmth
  setVenezia: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800&auto=format&fit=crop" // Venezia Contemporary
};

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
    "技术规格书與BOM審核通過，簽名發布。": "Tech specifications and BOM approved, signed off.",
    "技術規格書與BOM審核通過，簽名發布。": "Tech specifications and BOM approved, signed off.",
    "現場反饋：因客戶硬裝現場變動，取消2把扶手椅與1張茶几。啟動劃線財務自動重算，餘款已核銷更新。": "Site feedback: Cancelled 2 Armchairs & 1 Table due to fitout changes. Auto strike-through recalculation initiated.",
    "CRIB 5 燃燒檢測失敗：純絲綢緞阻燃塗層收縮率/變色率超差（CRIB 5 BLOCKED）": "CRIB 5 Flammability Test Failed: Pure Silk Satin fire-retardant coating shrinkage and discoloration rate out of tolerance (CRIB 5 BLOCKED)",
    "CRIB 5 燃燒檢測合格：火焰暴露10秒內物理自熄（CRIB 5 PASSED）": "CRIB 5 Flammability Test Passed: Flame self-extinguished physically within 10 seconds of exposure (CRIB 5 PASSED)",
    "四大出口單證校驗成功：IPPC熏蒸證明、海關申報單、裝箱單序列號一致（100% MATCH）": "Four export compliance documents verified successfully: IPPC fumigation certificate, Customs declaration, Packing lists match perfectly (100% MATCH)",
    "項目資料哈希打包完畢：SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51": "Project archive hashed and packaged: SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51",
    "檢測到絲綢硬性不合規，一鍵替換面料為：L-4410 (海軍藍亞麻)": "Detected critical non-compliance on Silk. Swapped fabric to: L-4410 (Navy Classic Linen) with one click.",
    "生成PDF規格書，全自動調用 SMTP 郵件群發至 3 家意向工廠。": "Generated PDF specification sheet, automatically calling SMTP to dispatch RFQs to 3 target factories."
  };
  
  if (exactTranslations[cnText]) {
    return exactTranslations[cnText];
  }
  
  // 3. Dynamic templates (Crib 5 Override and supplier selections)
  if (cnText.includes("修改物料合规：替换面料为")) {
    const matchFabric = cnText.match(/替换面料为\s*(\S+)/);
    const code = matchFabric ? matchFabric[1] : "FAB-02";
    return `Bypassed Crib 5: Changed fabric to ${code} (Navy Classic Linen), successfully overriding gate.`;
  }
  
  if (cnText.includes("比价完成。最终选定代工厂:")) {
    const matchSupplier = cnText.match(/最终选定代工厂:\s*([^，]+)/);
    const matchPrice = cnText.match(/单价核定为\s*\$?([0-9.]+)/);
    const sName = matchSupplier ? matchSupplier[1] : "selected supplier";
    const sPrice = matchPrice ? matchPrice[1] : "195";
    return `Supplier bidding finalized. Factory selected: ${sName}. Lobby Armchair set to $${sPrice}/pc.`;
  }
  
  return cnText; // Fallback
};

function App() {
  const [currentView, setCurrentStageView] = useState("Marketing"); // Views: "Marketing", "Backoffice", "ClientPortal"
  const [lang, setLang] = useState("Cn"); // Language: "Cn" or "En"
  const [marketingTab, setMarketingTab] = useState("Overview"); // "Overview", "CaseStudies", "OurStory", "Contact"
  const [clientPortalTab, setClientPortalTab] = useState("Tracker"); // "Tracker", "Intake"
  const [openFaq, setOpenFaq] = useState(null); // Accordion FAQ toggle
  const [isIntakeUploading, setIsIntakeUploading] = useState(false); // For upload animation
  const [parsingLogs, setParsingLogs] = useState([]); // Real-time parsing logs

  // Premium Auth Gate States
  const [user, setUser] = useState(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "signup"
  
  // Custom Registration Input States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCompany, setSignupCompany] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupMessenger, setSignupCompanyMessenger] = useState("WeChat");
  const [signupMessengerId, setSignupMessengerId] = useState("");

  // B2B Client Intake Form States
  const [intakeProjectName, setIntakeProjectName] = useState("St Albans Boutique Hotel Lobby");
  const [intakeDestination, setIntakeDestination] = useState("London, UK");
  const [intakeQuantity, setIntakeQuantity] = useState("40 Lobby Armchairs, 20 Club Chairs");

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

  // WOW effect state variables for homepage V1.2 enhancements
  const [activeSwatch, setActiveSwatch] = useState("nubuck"); // nubuck, linen, gold, walnut
  const [blueprintSliderPos, setBlueprintSliderPos] = useState(50);
  const [demoMilestone, setDemoMilestone] = useState("frame");

  // V1.2/1.3 Intake Modal States
  const [activeIntakeModal, setActiveIntakeModal] = useState(null); // 'pdf', 'excel', 'words', 'item', or null
  const [modalProjectName, setModalProjectName] = useState("");
  const [modalDestination, setModalDestination] = useState("");
  const [modalQuantity, setModalQuantity] = useState("40");
  const [modalTextBrief, setModalTextBrief] = useState("");
  const [modalFilePreloaded, setModalFilePreloaded] = useState(false);
  const [modalFilePreloadedName, setModalFilePreloadedName] = useState("");

  // V1.3 Marketing Bespoke Simulation States (Now modularly encapsulated in CVQASimulator and ClientPortalTeaser)


  // =====================================================================
  // THE CRAFTON - SESSION & AUTHENTICATION HANDLERS
  // =====================================================================
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!signupEmail) {
      alert(lang === "Cn" ? "請輸入電子郵件！" : "Please enter your email!");
      return;
    }
    const nameFromEmail = signupEmail.split('@')[0];
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    setUser({
      name: formattedName,
      email: signupEmail,
      company: "Contract Design Ltd",
      messenger: "WhatsApp",
      messengerId: "+44 7700 900077"
    });
    setShowAuthGate(false);
  };

  const handleSignUp = (e) => {
    if (e) e.preventDefault();
    if (!signupEmail || !signupName) {
      alert(lang === "Cn" ? "請填寫電子郵件與姓名！" : "Please fill in email and name!");
      return;
    }
    setUser({
      name: signupName,
      email: signupEmail,
      company: signupCompany || "Independent Designer",
      messenger: signupMessenger,
      messengerId: signupMessengerId || "N/A"
    });
    setShowAuthGate(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentStageView("Marketing");
    setMarketingTab("Overview");
  };

  const loginAsDemo = (role) => {
    if (role === 'client') {
      setUser({
        name: "Sarah Jenkins",
        email: "sarah@jenkins-design.co.uk",
        company: "Jenkins Contract Interior Studio",
        messenger: "WhatsApp",
        messengerId: "+44 7700 900077"
      });
    } else if (role === 'cho') {
      setUser({
        name: "Cho (Manager)",
        email: "cho@crafton.com",
        company: "The Crafton Ltd",
        messenger: "WeChat",
        messengerId: "cho_crafton"
      });
    }
    setShowAuthGate(false);
  };

  const handleIntakeSubmit = (e) => {
    if (e) e.preventDefault();
    setIsIntakeUploading(true);
    setParsingLogs([]);
    
    // Simulate real-time parsing logs
    const simulatedLogs = [
      { delay: 400, cn: "🔄 [OpenClaw Daemon] 成功連線至智能體管道解析端口...", en: "🔄 [OpenClaw Daemon] Connected to agent parsing pipe..." },
      { delay: 1000, cn: "🔍 [Intake Agent] 正在讀取上傳設計草圖幾何線條...", en: "🔍 [Intake Agent] Analysing uploaded sketch geometry..." },
      { delay: 1600, cn: "📐 [Spec Agent] 自動推導扶手椅與休閒椅比例及公差限制 (W:65cm, D:60cm, H:85cm)...", en: "📐 [Spec Agent] Extrapolating chair dimensions and tolerances (W:65cm, D:60cm, H:85cm)..." },
      { delay: 2200, cn: "🔥 [Compliance Agent] 比對英國 BS 5852 Crib 5 消防安全性：面料耐燃性相符...", en: "🔥 [Compliance Agent] Auditing British BS 5852 Crib 5 compliance: Swatch flammability compatible..." },
      { delay: 2800, cn: "📝 [BOM Agent] 自動生成雙語技術 BOM 清單與圖紙歸檔...", en: "📝 [BOM Agent] Compiling bilingual technical BOM spreadsheet & blueprint archives..." },
      { delay: 3400, cn: "✅ [OpenClaw Engine] 項目主數據成功導入數據庫！自動解鎖 Tracker 進度面板。", en: "✅ [OpenClaw Engine] Project successfully synchronized! Unlocking active Tracker dashboard." }
    ];

    simulatedLogs.forEach(log => {
      setTimeout(() => {
        setParsingLogs(prev => [...prev, log]);
      }, log.delay);
    });

    setTimeout(() => {
      // Create bespoke items based on user inputs
      const qty1 = parseInt(intakeQuantity) || 40;
      const newItems = [
        { id: "ITEM-01", typeCn: "大堂定製扶手椅", typeEn: "Custom Lobby Armchair", qty: qty1, materialCn: "海軍藍亞麻 (FAB-02)", materialEn: "Navy Classic Linen (FAB-02)", originalUnitPrice: 210, unitPrice: 210, status: "Active" },
        { id: "ITEM-02", typeCn: "貴賓單人休閒沙發", typeEn: "VIP Club Chair", qty: 20, materialCn: "皇家藍絲絨 (FAB-01)", materialEn: "Royal Velvet (FAB-01)", originalUnitPrice: 280, unitPrice: 280, status: "Active" }
      ];
      
      setOrder({
        orderId: "CRAFT-" + new Date().getFullYear() + ("0" + (new Date().getMonth() + 1)).slice(-2) + "-BESPOKE",
        clientName: user ? user.company : "Bespoke Partner",
        projectLocation: intakeDestination,
        createdDate: new Date().toISOString().split('T')[0],
        currentStageId: "S03",
        items: newItems,
        payments: [
          { milestone: "50% Deposit (50% 首期定金)", amount: ((210 * qty1) + 280 * 20) * 0.5, date: new Date().toISOString().split('T')[0], status: "Paid" },
          { milestone: "40% Shipping Release (40% 出货中款)", amount: ((210 * qty1) + 280 * 20) * 0.4, date: "Pending", status: "Pending" },
          { milestone: "10% Handover Balance (10% 交付尾款)", amount: ((210 * qty1) + 280 * 20) * 0.1, date: "Pending", status: "Pending" }
        ]
      });

      setCurrentStageIndex(2); // S03
      setIsIntakeUploading(false);
      setClientPortalTab("Tracker");
    }, 4000);
  };

  // =====================================================================
  // CRAFTON AI - LOW SATURATION VECTOR RENDERS & STAGE PLAYGROUNDS
  // =====================================================================

  const renderChairSVG = (fabricId, legId, animateStyle = {}) => {
    return <ChairSVG fabricId={fabricId} legId={legId} animateStyle={animateStyle} />;
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



  const handleStartCrib5Test = () => {
    setCrib5TestStatus("running");
    setCrib5Progress(0);
    const interval = setInterval(() => {
      setCrib5Progress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          if (selectedFabric === "FAB-03") {
            setCrib5TestStatus("failed");
            addLog("System", "CRIB 5 燃燒檢測失敗：純絲綢緞阻燃塗層收縮率/變色率超差（CRIB 5 BLOCKED）", "CRIB 5 Flammability Test Failed: Pure Silk Satin fire-retardant coating shrinkage and discoloration rate out of tolerance (CRIB 5 BLOCKED)");
          } else {
            setCrib5TestStatus("passed");
            addLog("System", "CRIB 5 燃燒檢測合格：火焰暴露10秒內物理自熄（CRIB 5 PASSED）", "CRIB 5 Flammability Test Passed: Flame self-extinguished physically within 10 seconds of exposure (CRIB 5 PASSED)");
          }
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleDocumentAudit = () => {
    setDocAudited(true);
    addLog("System", "四大出口單證校驗成功：IPPC熏蒸證明、海關申報單、裝箱單序列號一致（100% MATCH）", "Four export compliance documents verified successfully: IPPC fumigation certificate, Customs declaration, Packing lists match perfectly (100% MATCH)");
  };

  const handleCryptographicArchive = () => {
    setArchiveHashed(true);
    addLog("System", "項目資料哈希打包完畢：SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51", "Project archive hashed and packaged: SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51");
  };

  const handleIntakeFlowSubmit = (projectName, destination, quantity, fileType, textBrief) => {
    setIntakeProjectName(projectName || "St Albans Boutique Hotel Lobby");
    setIntakeDestination(destination || "London, UK");
    setIntakeQuantity(quantity || "40");
    setClientPortalTab("Intake");
    setCurrentView("ClientPortal");
    setActiveIntakeModal(null);
    setTimeout(() => {
      handleIntakeSubmit();
    }, 100);
  };

  const renderIntakeModal = () => {
    if (!activeIntakeModal) return null;

    const titleCn = activeIntakeModal === 'pdf' ? "No. 01 — 上傳招標 PDF 規格書" 
                  : activeIntakeModal === 'excel' ? "No. 02 — 導入 Excel 家具清單"
                  : activeIntakeModal === 'item' ? "獲取精選配套定制報價"
                  : "No. 03 — 貼入文字需求描述";
    const titleEn = activeIntakeModal === 'pdf' ? "No. 01 — Upload Tender PDF Specs"
                  : activeIntakeModal === 'excel' ? "No. 02 — Import Excel Furniture List"
                  : activeIntakeModal === 'item' ? "Request Curated Package Quote"
                  : "No. 03 — Paste Text Requirements";

    const descCn = activeIntakeModal === 'pdf' ? "請拖曳上傳您的 PDF 招標文件或技術規格書。系統將調用 OpenClaw 智能體，實時提取幾何參數與合規性分析。"
                 : activeIntakeModal === 'excel' ? "請上傳包含家具品名、尺寸、面料與數量的 Excel 電子表格。系統將自動解析為 B2B 門戶中的物料清單。"
                 : activeIntakeModal === 'item' ? "確認配套定制信息，一鍵為您的項目生成專屬報價單，並在控制台中實時跟蹤。"
                 : "直接粘貼郵件對話記錄或手打需求，我們的 AI 智能體將實時精確理解並拆解為可生產的技術條目。";
    const descEn = activeIntakeModal === 'pdf' ? "Drag and drop your PDF spec sheet or tender documents. OpenClaw agents will extract dimensions, geometry parameters, and perform compliance audit in real time."
                 : activeIntakeModal === 'excel' ? "Upload your spreadsheet containing item schedules, sizes, and swatches. The system will automatically convert it to a structured BOM list."
                 : activeIntakeModal === 'item' ? "Confirm the details of your package. The system will automatically generate a tailored commercial bid and load it to your portal."
                 : "Paste email threads or type out your requirements. Our multi-agent system will parse text into ready-to-manufacture line items.";

    return (
      <div className="volumetric-modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
        <div className="volumetric-modal-card" style={{ maxWidth: '650px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="volumetric-modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: 'var(--font-tech)', fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--accent-primary)', flexShrink: 0 }}>
                {activeIntakeModal === 'pdf' ? "No. 01" : activeIntakeModal === 'excel' ? "No. 02" : activeIntakeModal === 'item' ? "⭐" : "No. 03"}
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-tech)', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {lang === "Cn" ? titleCn : titleEn}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {lang === "Cn" ? descCn : descEn}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveIntakeModal(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(28,27,24,0.06)'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.8rem 2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Project Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                {lang === "Cn" ? "項目名稱 / PROJECT NAME" : "PROJECT NAME"}
              </label>
              <input 
                type="text" 
                className="chat-input"
                value={modalProjectName} 
                onChange={(e) => setModalProjectName(e.target.value)}
                placeholder={lang === "Cn" ? "請輸入項目名稱..." : "Enter project name..."}
                style={{ width: '100%', background: '#FFFFFF', padding: '0.7rem', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '2px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}
                required
              />
            </div>

            {/* Destination & Quantity Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                  {lang === "Cn" ? "交付目的地 / DESTINATION" : "DELIVERY DESTINATION"}
                </label>
                <input 
                  type="text" 
                  className="chat-input"
                  value={modalDestination} 
                  onChange={(e) => setModalDestination(e.target.value)}
                  placeholder={lang === "Cn" ? "例如：英國倫敦" : "e.g. London, UK"}
                  style={{ width: '100%', background: '#FFFFFF', padding: '0.7rem', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '2px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                  {lang === "Cn" ? "預估數量 / EST. QUANTITY" : "ESTIMATED QUANTITY"}
                </label>
                <input 
                  type="text" 
                  className="chat-input"
                  value={modalQuantity} 
                  onChange={(e) => setModalQuantity(e.target.value)}
                  placeholder="40"
                  style={{ width: '100%', background: '#FFFFFF', padding: '0.7rem', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '2px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}
                  required
                />
              </div>
            </div>

            {/* Interactive File Section or Textarea */}
            {activeIntakeModal === 'item' ? (
              <div style={{ background: '#FAF7F2', padding: '1.2rem', border: '1px solid rgba(124, 114, 103, 0.15)', borderRadius: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '0.4rem' }}>
                  {lang === "Cn" ? "⚡ 精選設計配套已加載" : "⚡ CURATED DESIGN PACKAGE PRE-LOADED"}
                </span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {modalProjectName}
                </span>
              </div>
            ) : activeIntakeModal === 'words' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                  {lang === "Cn" ? "手寫文字需求描述 / WORDS BRIEF" : "TEXT REQUIREMENTS BRIEF"}
                </label>
                <textarea 
                  className="chat-input"
                  value={modalTextBrief}
                  onChange={(e) => setModalTextBrief(e.target.value)}
                  placeholder={lang === "Cn" ? "在此處輸入或粘貼您的家具定製要求、材質防火指標、交期限制等..." : "Paste or type your furniture specs, fabric options, Crib 5 requirements here..."}
                  style={{ width: '100%', minHeight: '120px', background: '#FFFFFF', padding: '0.7rem', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '2px', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', lineHeight: '1.6', resize: 'vertical' }}
                  required
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                  {activeIntakeModal === 'pdf' ? (lang === "Cn" ? "招標 PDF 規格書 / TENDER PDF" : "TENDER PDF ATTACHMENT") : (lang === "Cn" ? "Excel 家具清單表格 / EXCEL SHEET" : "EXCEL SHEET ATTACHMENT")}
                </label>
                <div style={{
                  border: '1px dashed var(--accent-primary)',
                  borderRadius: '2px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  background: 'rgba(176, 91, 67, 0.02)',
                  position: 'relative'
                }}>
                  <svg style={{ width: '32px', height: '32px', display: 'block', margin: '0 auto 0.6rem auto', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  {modalFilePreloaded ? (
                    <div>
                      <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-tech)', color: 'var(--text-primary)', display: 'block', fontWeight: '500' }}>
                        📎 {modalFilePreloadedName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-muted)', display: 'block', marginTop: '4px' }}>
                        {lang === "Cn" ? "⚡ 系統預加載文件已就緒！" : "⚡ System preloaded file is active!"}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                        {lang === "Cn" ? "拖曳文件到此處，或點擊瀏覽本地" : "Drag & drop files here, or click to browse"}
                      </span>
                    </div>
                  )}
                  <input type="file" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setModalFilePreloadedName(e.target.files[0].name);
                      setModalFilePreloaded(true);
                    }
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="volumetric-modal-footer" style={{ padding: '1.2rem 2rem', background: 'rgba(124, 114, 103, 0.02)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              className="btn-secondary" 
              style={{ padding: '0.5rem 1.5rem', fontSize: '0.82rem' }}
              onClick={() => setActiveIntakeModal(null)}
            >
              {lang === "Cn" ? "取消 / CANCEL" : "CANCEL"}
            </button>
            <button 
              className="btn-premium" 
              style={{ padding: '0.5rem 2rem', fontSize: '0.82rem' }}
              onClick={() => {
                const fileTypeLabel = activeIntakeModal === 'pdf' ? "TENDER_PDF" : activeIntakeModal === 'excel' ? "EXCEL_BOM" : activeIntakeModal === 'item' ? "CURATED_PACKAGE" : "TEXT_BRIEF";
                handleIntakeFlowSubmit(modalProjectName, modalDestination, modalQuantity, fileTypeLabel, modalTextBrief);
              }}
            >
              {lang === "Cn" ? "啟動 AI 解析" : "ANALYZE WITH AI →"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInteractivePlayground = () => {
    const stageId = currentStage.id;

    // 1. S01, S02, S03, S04: CAD Drafting and Approvals
    if (stageId === "S01" || stageId === "S02" || stageId === "S03" || stageId === "S04") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>
            <div className="panel-title">
              <svg style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 22L2 2v20h20z" />
                <path d="M18 18L6 6v12h12z" />
              </svg>
              {lang === "Cn" ? "中英雙語 CAD 技術藍圖規格書" : "Bilingual CAD Technical Specs"}
            </div>
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
              <div style={{ position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: 'var(--text-secondary)', background: '#FAF9F6', padding: '0 4px', fontFamily: 'monospace' }}>W: 650mm ±5mm</div>

              <div style={{ position: 'absolute', top: '60px', right: '25px', bottom: '66px', width: '1px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', top: '60px', right: '20px', height: '1px', width: '10px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', bottom: '66px', right: '20px', height: '1px', width: '10px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: '0.65rem', color: 'var(--text-secondary)', background: '#FAF9F6', padding: '0 4px', fontFamily: 'monospace' }}>H: 850mm</div>

              {renderChairSVG(selectedFabric, selectedLeg)}

              {/* Glowing Hotspots */}
              <div className="hotspot-marker" style={{ top: '110px', left: '100px' }}>
                <div className="hotspot-tooltip">
                  <strong>{lang === "Cn" ? "座包填充規格" : "Cushion Padding"}</strong><br/>
                  {lang === "Cn" ? "35kg/m³高回彈聚氨酯海綿，包裹防火無纺布，經受10萬次受壓疲勞測試。" : "35kg/m³ high-resilience PU foam wrapped in fire barrier, passes 100k cycles durability."}
                </div>
              </div>

              <div className="hotspot-marker" style={{ top: '165px', left: '50px' }}>
                <div className="hotspot-tooltip">
                  <strong>{lang === "Cn" ? "椅腿工藝" : "Leg Structure"}</strong><br/>
                  {lang === "Cn" ? "2.5mm壁厚冷軋重碳鋼，表面 basalt 磨砂黑防指紋靜電噴塗。" : "2.5mm heavy-gauge cold steel frame, matte Basalt Black fingerprint-proof electrostatic coating."}
                </div>
              </div>

              <div className="hotspot-marker" style={{ top: '70px', left: '135px' }}>
                <div className="hotspot-tooltip">
                  <strong>{lang === "Cn" ? "靠背傾角與公差" : "Back Angle"}</strong><br/>
                  {lang === "Cn" ? "105°人體工學黃金微傾角。框架結構製造公差嚴格控制在 ±2mm 內。" : "105° ergonomic golden tilt. Frame structural welding tolerance is strictly under ±2mm."}
                </div>
              </div>

              {/* Approved Ink Signature (S04) */}
              {(signatureApproved || stageId !== "S04") && (
                <div className="signature-box">
                  <div className="signature-label">{lang === "Cn" ? "審批簽名 / Approved by" : "Review Sign-Off"}</div>
                  <span className={`signature-font ${signatureApproved || stageId !== "S04" ? "signed" : ""}`}>Cho Chen</span>
                </div>
              )}
              
              <span className="blueprint-scale-tag">SCALE 1:12 | UNIT: MM | TOLERANCE: ±2mm</span>
            </div>

            {stageId === "S04" && !signatureApproved && (
              <button className="btn-premium" style={{ width: '100%', marginTop: '0.8rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setSignatureApproved(true); handleChoApproval(); }}>
                <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>{lang === "Cn" ? "我已確認規格無誤，签字放行" : "Review Specs & Sign-Off Block"}</span>
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
            <div className="panel-title">
              <svg style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', color: 'var(--accent-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.657 16.657c2.12-2.121 2.29-5.467.51-7.78L13 13l-4-4-2.28 4.28c-1.78 2.313-1.61 5.659.51 7.78a8 8 0 1010.417 0z" />
              </svg>
              {lang === "Cn" ? "英國 Crib 5 消防燃燒阻燃測試艙" : "UK Crib 5 Fire Ignition Testing Rig"}
            </div>
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
                  {lang === "Cn" ? "待測面料: " : "Target Swatch: "}<strong>{selectedFabObj.name}</strong><br/>
                  <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{lang === "Cn" ? "點擊下方按鈕啟動 10 秒模擬火焰燃燒測試" : "Click below to initiate 10s flame test"}</span>
                </div>
              )}
            </div>

            <div className="fire-gauge-card">
              <div className="fire-gauge-row">
                <span>{lang === "Cn" ? "燃燒測試進度" : "Flame Test Exposure"}</span>
                <span style={{ fontFamily: 'monospace' }}>{crib5Progress}%</span>
              </div>
              <div className="fire-progress-bar">
                <div className="fire-progress-fill" style={{ width: `${crib5Progress}%`, background: crib5TestStatus === "failed" ? 'var(--accent-red)' : 'var(--accent-green)' }}></div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>
                <button 
                  className="btn-premium" 
                  style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }} 
                  onClick={handleStartCrib5Test}
                  disabled={crib5TestStatus === "running"}
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M20 4a2 2 0 00-2.83 0L10 11.17l-1.41-1.41a1 1 0 00-1.42 0L3.5 13.5a1 1 0 000 1.42l4.24 4.24a1 1 0 001.42 0L12.92 15l1.41 1.41a1 1 0 001.42-1.42l7.17-7.17A2 2 0 0020 4z" />
                  </svg>
                  <span>{lang === "Cn" ? "執行物理燃燒校驗" : "Trigger Crib 5 Burn"}</span>
                </button>
                {crib5TestStatus === "failed" && (
                  <button 
                    className="btn-secondary" 
                    style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setSelectedFabric("FAB-02"); // auto replace with safe Linen
                      setCrib5TestStatus("idle");
                      setCrib5Progress(0);
                      addLog("Cho", "檢測到絲綢硬性不合規，一鍵替換面料為：L-4410 (海軍藍亞麻)", "Detected critical non-compliance on Silk. Swapped fabric to: L-4410 (Navy Classic Linen) with one click.");
                    }}
                  >
                    <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                    </svg>
                    <span>{lang === "Cn" ? "一鍵降級替換" : "Bypass with Linen"}</span>
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
            <div className="panel-title">
              <svg style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', color: 'var(--accent-orange)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {lang === "Cn" ? "自動化 RFQ 郵件詢價發送中心" : "Automated RFQ Mailer Daemon"}
            </div>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ padding: '1rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  <span>{lang === "Cn" ? "PDF 詢價規格書已就緒" : "Specs Package Compiled"}</span>
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem' }}>SIZE: 2.4 MB</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {lang === "Cn" ? "附件：CRAFT-202605-01-RFQ_Specification.pdf (帶雙語規格、包裝容積要求)" : "Attachment: CRAFT-202605-01-RFQ_Specification.pdf (Includes bilingual CAD & volume limits)"}
                </div>
                
                {rfqDispatched && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    ✓ {lang === "Cn" ? "郵件已全數抄送：佛山金陽、東莞皇家橡樹、順德經典舒適" : "RFQs Dispatched to 3 Partner Mills via SMTP"}
                  </div>
                )}
              </div>

              {!rfqDispatched ? (
                <button className="btn-premium" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setRfqDispatched(true); addLog("OpenClaw QuotationAgent", "生成PDF規格書，全自動調用 SMTP 郵件群發至 3 家意向工廠。", "Generated PDF specification sheet, automatically calling SMTP to dispatch RFQs to 3 target factories."); }}>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                  </svg>
                  <span>{lang === "Cn" ? "自動群發詢價郵件" : "Compile & Dispatch RFQs"}</span>
                </button>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.8rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{lang === "Cn" ? "工廠反饋監聽器狀態：" : "Factory Mail Feed Daemon:"}</strong><br/>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px', color: 'var(--accent-green)' }}>
                    <span className="stage-badge-dot dot-completed"></span>
                    {lang === "Cn" ? "佛山金陽家具廠 (已回填報價：W: $195)" : "Foshan Gold-Sun (Returned Quote: W: $195)"}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px', color: 'var(--accent-green)' }}>
                    <span className="stage-badge-dot dot-completed"></span>
                    {lang === "Cn" ? "東莞皇家橡樹家具 (已回填報價：W: $185)" : "Dongguan Royal Oak (Returned Quote: W: $185)"}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px', color: 'var(--accent-green)' }}>
                    <span className="stage-badge-dot dot-completed"></span>
                    {lang === "Cn" ? "順德經典舒適家居 (已回填報價：W: $230)" : "Shunde Classic Comfort (Returned Quote: W: $230)"}
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
            <div className="panel-title" style={{ color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="5" y1="5" x2="19" y2="5" />
                <path d="M12 22a4 4 0 008-4H4a4 4 0 008 0z" />
                <path d="M19 5l-3 9H8l-3-9" />
              </svg>
              <span>{lang === "Cn" ? "三家合作代工廠智能比價分析" : "Supplier Bid Matrix & AI Analysis"}</span>
            </div>
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
                  <span>{lang === "Cn" ? `工期: ${bid.deliveryDays} 天` : `Lead Time: ${bid.deliveryDays} Days`}</span>
                  <span>{lang === "Cn" ? `合格率: ${bid.qualityScore}` : `QC Score: ${bid.qualityScore}`}</span>
                  <span>{lang === "Cn" ? `信譽: ${bid.reliability}` : `Reliability: ${bid.reliability}`}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.4rem' }}>
                  AI 建議: {bid.note}
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
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg style={{ width: '16px', height: '16px', flexShrink: 0, color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 22V4a2 2 0 00-2-2H4a2 2 0 00-2 2v18M20 22V8a2 2 0 00-2-2h-4" />
                <path d="M6 12h4M6 16h4M17 12h2" />
              </svg>
              <span>{lang === "Cn" ? "車間現場物料掃碼與生產實時跟進" : "Factory QR Flow & Realtime Progress"}</span>
            </div>
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
                  {lang === "Cn" ? "工廠工人用平板掃描此碼，直接調取 Supabase 對應 3D 結構工程圖，杜絕車間看錯圖紙做錯貨。" : "Workers scan this tag to fetch design drawings dynamically from Supabase. Minimizes layout errors."}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', fontSize: '0.75rem' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
                </svg>
                <span>{lang === "Cn" ? "交期剩餘 15 天 - 黃色風險警告" : "Delivery Warning: 15 Days Remaining"}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                {lang === "Cn" ? "AI 每日計算發現金陽工廠未按時上傳本週進度，系統將自動啟動 WhatsApp 催詢鏈路。" : "AI model detected delays on Nansha dock scheduling. Automated WhatsApp inquiry is triggered."}
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
            <div className="panel-title" style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{lang === "Cn" ? "AI CV 智能圖紙與實物重合比對" : "AI CV Photo-to-CAD Overlap Inspection"}</span>
            </div>
            <span className="logo-badge" style={{ color: 'var(--accent-green)' }}>PASS 98.2%</span>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div className="cv-container">
              <div className="cv-photo" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80')" }}></div>
              <div className="cv-overlay-text">LIVE PHOTO: FOSHAN GOLD-SUN ST-01</div>
              <div className="cv-grid-line"></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.8rem' }}>
              <span>{lang === "Cn" ? "幾何輪廓重合度 (CAD Overlay): " : "Feature Match: "}<strong style={{ color: 'var(--accent-green)' }}>98.2%</strong></span>
              <span>{lang === "Cn" ? "椅腿顏色核檢: " : "Color Swatch Match: "}<strong style={{ color: 'var(--accent-green)' }}>Matte Black OK</strong></span>
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
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg style={{ width: '16px', height: '16px', flexShrink: 0, color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
              </svg>
              <span>{lang === "Cn" ? "集裝箱體積排櫃優化算法" : "3D Volumetric Container Packing Optimizer"}</span>
            </div>
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
              <span>{lang === "Cn" ? "裝載箱型: " : "Container Type: "}<strong style={{ color: 'var(--accent-cyan)' }}>40GP Container</strong></span>
              <span>{lang === "Cn" ? "容積利用率: " : "Space Efficiency: "}<strong style={{ color: 'var(--accent-cyan)' }}>68.6%</strong></span>
            </div>
            <button 
              className="btn-premium" 
              style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }} 
              onClick={() => setShowVolumetricSimulation(true)}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
              <span>{lang === "Cn" ? "啟動 3D 排櫃三維立體仿真" : "Launch Interactive 3D Packing Simulation"}</span>
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
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg style={{ width: '16px', height: '16px', flexShrink: 0, color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>
              <span>{lang === "Cn" ? "出港四大合規單證自動核驗" : "Customs Credentials Ledger Verification"}</span>
            </div>
            <span className="logo-badge" style={{ color: 'var(--accent-orange)' }}>COMPLIANCE</span>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }}>
              <div style={{ padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem' }}>1. {lang === "Cn" ? "實木大茶几 IPPC 熏蒸證明" : "IPPC Solid Wood Fumigation"}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: docAudited ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                  {docAudited ? "✓ VERIFIED" : "PENDING"}
                </span>
              </div>
              <div style={{ padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem' }}>2. {lang === "Cn" ? "提單、裝箱單序列號一致性" : "Bill of Lading Consistency Check"}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: docAudited ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                  {docAudited ? "✓ VERIFIED" : "PENDING"}
                </span>
              </div>
              <div style={{ padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem' }}>3. {lang === "Cn" ? "海關出境報關登記核銷" : "Customs Declaration Matching"}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: docAudited ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                  {docAudited ? "✓ VERIFIED" : "PENDING"}
                </span>
              </div>

              {docAudited && (
                <div className="wax-stamp-overlay stamped stamp-pass" style={{ top: '30px', left: '100px', zIndex: 100 }}>
                  Docs Passed
                </div>
              )}

              {!docAudited && (
                <button className="btn-premium" style={{ width: '100%', marginTop: '0.4rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleDocumentAudit}>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 11l2 2 4-4" />
                  </svg>
                  <span>{lang === "Cn" ? "執行四大單證自動審計" : "Audit Export Documents"}</span>
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
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg style={{ width: '16px', height: '16px', flexShrink: 0, color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                <path d="M2 12h20" />
              </svg>
              <span>{lang === "Cn" ? "貨船在途軌跡 (馬士基實時 API)" : "Maersk Maritime API Tracking"}</span>
            </div>
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
              <span>{lang === "Cn" ? "当前航行位置: 蘇伊士運河" : "Position: Suez Canal Transit"}</span>
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
            <div className="panel-title" style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                <line x1="12" y1="11" x2="12" y2="13" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{lang === "Cn" ? "財務自動對賬與分批到貨核銷" : "Strike-through Accounting Audit"}</span>
            </div>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {lang === "Cn" ? "客戶硬裝現場臨時變更，取消 2 把扶手椅及 1 張大茶几。會計系統將對取消項目進行劃線銷賬，實時減免退款並重算尾款。" : "The site reported layout modifications. 2 Armchairs and 1 Table are canceled. recasting accounts under the strike-through policy."}
              </div>

              {!splitDeliveryActive ? (
                <button className="btn-premium" style={{ background: 'var(--accent-red)', color: 'white', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={triggerSplitDelivery}>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>{lang === "Cn" ? "執行分批到貨劃線銷賬" : "Execute Split strike recalculation"}</span>
                </button>
              ) : (
                <div style={{ padding: '0.8rem', background: 'rgba(125, 143, 123, 0.08)', border: '1px solid var(--accent-green)', borderRadius: '2px', fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: '600' }}>
                  ✓ {lang === "Cn" ? "劃線重算成功！合同總額減少 $870，尾款已自動核銷修正。" : "Recalculation Applied: Invoice reduced by $870. Balanced updated."}
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
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg style={{ width: '16px', height: '16px', flexShrink: 0, color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>{lang === "Cn" ? "安全歸檔與密碼學審計" : "Secure Handover & Archive Lock"}</span>
            </div>
          </div>
          <div className="panel-body" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ padding: '0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', fontSize: '0.72rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{lang === "Cn" ? "項目證書文件包：" : "Project Dossier Compile:"}</strong><br/>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {lang === "Cn" ? "包含中英雙語規格書、Change Logs 審計日誌、AI 視覺質精合格證、燃燒及熏蒸單證、現場驗收簽認。" : "Includes CAD Specs, Change logs, AI QC reports, IPPC certificates, and signed client receipts."}
                </span>
              </div>

              {archiveHashed ? (
                <div style={{ padding: '0.8rem', background: 'rgba(125,143,123,0.08)', border: '1px solid var(--accent-green)', borderRadius: '2px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>✓ {lang === "Cn" ? "項目已完整密封存檔" : "Dossier Encrypted & Archived"}</div>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-all' }}>
                    SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51
                  </div>
                </div>
              ) : (
                <button 
                  className="btn-premium" 
                  style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }} 
                  onClick={handleCryptographicArchive}
                  disabled={stageId !== "S17"}
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span>{lang === "Cn" ? "密封存檔並生成加密哈希" : "Archive & Lock Ledger dossier"}</span>
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
                item_type_cn: "大堂扶手椅",
                item_type_en: "Lobby Armchair",
                quantity: 40,
                material_cn: "海军蓝亚麻 (L-4410)",
                material_en: "Navy Classic Linen (L-4410)",
                original_unit_price: 210,
                unit_price: 210,
                notes_cn: "",
                notes_en: ""
              },
              {
                project_id: insertedProj.id,
                item_type_cn: "贵宾单人椅",
                item_type_en: "VIP Club Chair",
                quantity: 20,
                material_cn: "皇家蓝丝绒 (V-9082)",
                material_en: "Royal Velvet (V-9082)",
                original_unit_price: 280,
                unit_price: 280,
                notes_cn: "",
                notes_en: ""
              },
              {
                project_id: insertedProj.id,
                item_type_cn: "定制实木大茶几",
                item_type_en: "Custom Oak Coffee Table",
                quantity: 5,
                material_cn: "天然白橡木",
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
                milestone_cn: "50% 首期定金 (已付)",
                milestone_en: "50% Deposit (Paid)",
                amount: 10450,
                status: "Paid",
                payment_date: "2026-05-25"
              },
              {
                project_id: insertedProj.id,
                milestone_cn: "40% 出货中款 (未核销)",
                milestone_en: "40% Shipping Release (Pending)",
                amount: 8360,
                status: "Pending",
                payment_date: "Pending"
              },
              {
                project_id: insertedProj.id,
                milestone_cn: "10% 交付尾款 (未核销)",
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
                action_desc_cn: "解析會員中心內置對話框需求及手稿，自動生成主訂單草稿",
                action_desc_en: "Parsed member portal message and sketch, auto-generated project master draft."
              },
              {
                project_id: insertedProj.id,
                operator: "OpenClaw",
                action_desc_cn: "自動通過內置消息通道向客户追問補充椅子的金屬腿部塗裝工藝和公差",
                action_desc_en: "Automatically followed up via member portal to query metal legs coating and tolerance."
              },
              {
                project_id: insertedProj.id,
                operator: "OpenClaw",
                action_desc_cn: "一鍵生成中英文對照規格書，尺寸標準定義：W: 650mm, D: 600mm, H: 850mm",
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
        replyText = "【OpenClaw 智能助理】: 收到！我正在调取 Supabase 数据库匹配您的需求。";
      } else {
        replyText = "[OpenClaw AI Assistant]: Received! I am pulling data from Supabase to match your design request.";
      }

      if (inputText.toLowerCase().includes("silk") || inputText.toLowerCase().includes("丝绸")) {
        // Trigger blocking scenario!
        setFabricCompatibilityTest("blocked");
        setIsCrib5Blocked(true);
        if (lang === "Cn") {
          replyText = "⚠️【合规警报 / BANNED】: 检测到您选选用“纯丝绸缎”。英国 (Crib 5) 防火阻燃规定禁止将丝绸进行化学防火图层处理（会导致严重缩水与变色）。订单已自动拦截锁定。请更换为亚麻 (Linen) 或皮质 (Leather)！";
        } else {
          replyText = "⚠️ [COMPLIANCE ALERT / BANNED]: You selected Pure Silk Satin. UK Crib 5 fire codes prohibit flame coating on delicate silks (causes extreme shrinkage & discoloration). Order has been BLOCKED. Please select Linen or Leather!";
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
     addLog("Cho", "技术规格书與BOM審核通過，簽名發布。", "Technical specifications and BOM approved, signature released.");

    if (dbConnected && order.id) {
      try {
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));
        const nextStageId = stages[nextIndex].id;
        const nextStageInt = parseInt(nextStageId.substring(1), 10);
        await client.from("projects").update({ current_stage: nextStageInt }).eq("id", order.id);
        await client.from("agent_logs").insert({
          project_id: order.id,
          operator: "Cho",
          action_desc_cn: "技术规格书與BOM審核通過，簽名發布。",
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
    addLog("Cho", `修改物料合规：替换面料为 ${fabricCode} (海军蓝亚麻)，成功通过 Crib 5 安全拦截门禁。`, `Modified material compliance: Swapped fabric to ${fabricCode} (Navy Classic Linen), successfully passing the Crib 5 safety compliance gate.`);

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
          action_desc_cn: `修改物料合规：替换面料为 ${fabricCode} (海军蓝亚麻)，成功通过 Crib 5 安全拦截门禁。`,
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
    addLog("Cho", `比价完成。最终选定代工厂: ${supplier.name}，大堂扶手椅单价核定为 $${supplier.pricePerChair}/把。`, `Bidding completed. Selected final supplier: ${supplier.name}. Lobby armchair unit price approved at $${supplier.pricePerChair}/pc.`);
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
          action_desc_cn: `比价完成。最终选定代工厂: ${supplier.name}，大堂扶手椅单价核定为 $${supplier.pricePerChair}/把。`,
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
        return { ...item, qty: 38, note: "已出港: 38 把 / ⚠️ 取消: 2 把 (现场划线核销)" };
      }
      if (item.typeEn === "Custom Oak Coffee Table") {
        return { ...item, qty: 4, note: "已到港: 4 张 / ⚠️ 取消: 1 张 (财务已退款)" };
      }
      return item;
    });

    const updatedPayments = [
      { milestone: "50% Deposit (已付)", amount: 10450, date: "2026-05-25", status: "Paid" },
      { milestone: "40% Shipping Release (出货中款)", amount: 7860, date: "2026-05-25", status: "Paid" },
      { milestone: "10% Recalculated Balance (尾款划线重算)", amount: 470, date: "Pending", status: "Pending" }
    ];

    setOrder(prev => ({ ...prev, items: updatedItems, payments: updatedPayments }));
    addLog("Client", "現場反饋：因客戶硬裝現場變動，取消2把扶手椅與1張茶几。啟動劃線財務自動重算，餘款已核銷更新。", "On-site feedback: Due to site changes, 2 armchairs and 1 coffee table were canceled. Initiated automatic strike-through financial recalculation; remaining balance updated.");

    if (dbConnected && order.id) {
      try {
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));
        await client.from("projects").update({ split_delivery_active: true }).eq("id", order.id);
        
        // Update specifications quantities and notes in database
        await client.from("specifications")
          .update({ 
            quantity: 38, 
            notes_cn: "已出港: 38 把 / ⚠️ 取消: 2 把 (现场划线核销)",
            notes_en: "Shipped: 38 pcs / ⚠️ Cancelled: 2 pcs (site strike-through)"
          })
          .eq("project_id", order.id)
          .eq("item_type_en", "Lobby Armchair");
          
        await client.from("specifications")
          .update({ 
            quantity: 4, 
            notes_cn: "已到港: 4 张 / ⚠️ 取消: 1 张 (财务已退款)",
            notes_en: "Arrived: 4 pcs / ⚠️ Cancelled: 1 pc (refunded)"
          })
          .eq("project_id", order.id)
          .eq("item_type_en", "Custom Oak Coffee Table");

        // Recalculate payments directly in the database
        await client.from("payments").update({ amount: 10450, status: "Paid", payment_date: "2026-05-25" }).eq("project_id", order.id).ilike("milestone_en", "%50% Deposit%");
        await client.from("payments").update({ amount: 7860, status: "Paid", payment_date: "2026-05-25" }).eq("project_id", order.id).ilike("milestone_en", "%40% Shipping%");
        await client.from("payments").update({ 
          milestone_cn: "10% 尾款划线重算 (未核销)",
          milestone_en: "10% Recalculated Balance (Pending)",
          amount: 470,
          status: "Pending"
        }).eq("project_id", order.id).ilike("milestone_en", "%10% Handover%");

        await client.from("agent_logs").insert({
          project_id: order.id,
          operator: "Client",
          action_desc_cn: "現場反饋：因客戶硬裝現場變動，取消2把扶手椅與1張茶几。啟動劃線財務自動重算，餘款已核銷更新。",
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

  // =====================================================================
  // THE CRAFTON - PREMIUM EDITORIAL MODULES
  // =====================================================================
  const renderAuthGate = () => {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(28, 27, 24, 0.65)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }} className="animate-fade-in">
        <div style={{
          width: '100%',
          maxWidth: '900px',
          background: '#FAF9F6',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'row',
          border: '1px solid rgba(124, 114, 103, 0.15)',
          minHeight: '550px'
        }}>
          {/* Left Column: Premium Editorial Visuals */}
          <div style={{
            flex: '1',
            background: '#F3F1ED',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid rgba(124, 114, 103, 0.1)',
            position: 'relative'
          }} className="hidden-mobile">
            <div>
              <div style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1C1B18',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                fontFamily: "'Outfit', 'Inter', sans-serif"
              }}>
                THE CRAFTON
              </div>
              <div style={{
                fontSize: '12px',
                color: '#7C7267',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '40px'
              }}>
                {lang === "Cn" ? "倫敦工作室 × 智能製造" : "London Studio × Intelligent Manufacture"}
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              {renderChairSVG("FAB-02", "matte-black")}
            </div>

            <div>
              <p style={{
                fontStyle: 'italic',
                fontSize: '15px',
                color: '#7C7267',
                lineHeight: '1.6',
                fontFamily: "'Georgia', serif",
                marginBottom: '0'
              }}>
                {lang === "Cn" 
                  ? "「您提需求，剩下的交給我們。圖紙為每件作品自動生成。」" 
                  : "“You bring the requirements, we handle the rest. Blueprints auto-generate for every piece we build.”"}
              </p>
              <div style={{
                fontSize: '11px',
                color: '#9C9287',
                marginTop: '12px',
                letterSpacing: '0.05em'
              }}>
                THE CRAFTON B2B PORTAL
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Form */}
          <div style={{
            flex: '1.2',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setShowAuthGate(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#7C7267',
                cursor: 'pointer',
                padding: '5px',
                lineHeight: '1'
              }}
              aria-label="Close"
            >
              ×
            </button>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1C1B18',
                marginBottom: '8px',
                letterSpacing: '0.02em',
                fontFamily: "'Outfit', 'Inter', sans-serif"
              }}>
                {authMode === "login" 
                  ? (lang === "Cn" ? "尊貴會員登入" : "Partner Sign In") 
                  : (lang === "Cn" ? "註冊尊貴會員" : "Partner Registration")}
              </h3>
              <p style={{ fontSize: '13px', color: '#7C7267', margin: 0, lineHeight: '1.4' }}>
                {lang === "Cn" 
                  ? "由於定制圖紙、BOM及工廠報價涉及商業機密，項目中心需帳戶驗證保護。" 
                  : "As drawings, BOMs & factory bids involve B2B trade secrets, access is gated to registered clients."}
              </p>
            </div>

            <form onSubmit={authMode === "login" ? handleLogin : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {authMode === "signup" && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#7C7267', marginBottom: '4px', fontWeight: '500' }}>
                      {lang === "Cn" ? "姓名" : "Your Name"}
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(124, 114, 103, 0.2)',
                        background: '#FAF9F6',
                        fontSize: '14px',
                        color: '#1C1B18'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#7C7267', marginBottom: '4px', fontWeight: '500' }}>
                      {lang === "Cn" ? "公司名稱" : "Company Name"}
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Jenkins Contract Interior Studio"
                      value={signupCompany}
                      onChange={(e) => setSignupCompany(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(124, 114, 103, 0.2)',
                        background: '#FAF9F6',
                        fontSize: '14px',
                        color: '#1C1B18'
                      }}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#7C7267', marginBottom: '4px', fontWeight: '500' }}>
                  {lang === "Cn" ? "電子郵件" : "Email Address"}
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. client@designstudio.co.uk"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(124, 114, 103, 0.2)',
                    background: '#FAF9F6',
                    fontSize: '14px',
                    color: '#1C1B18'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#7C7267', marginBottom: '4px', fontWeight: '500' }}>
                  {lang === "Cn" ? "密碼" : "Password"}
                </label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(124, 114, 103, 0.2)',
                    background: '#FAF9F6',
                    fontSize: '14px',
                    color: '#1C1B18'
                  }}
                />
              </div>

              {authMode === "signup" && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: '1' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#7C7267', marginBottom: '4px', fontWeight: '500' }}>
                      {lang === "Cn" ? "首選即時通訊" : "Preferred Messenger"}
                    </label>
                    <select
                      value={signupMessenger}
                      onChange={(e) => setSignupCompanyMessenger(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(124, 114, 103, 0.2)',
                        background: '#FAF9F6',
                        fontSize: '14px',
                        color: '#1C1B18'
                      }}
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="WeChat">WeChat (微信)</option>
                    </select>
                  </div>
                  <div style={{ flex: '1.5' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#7C7267', marginBottom: '4px', fontWeight: '500' }}>
                      {lang === "Cn" ? "通訊ID / 手機號" : "Messenger ID / Number"}
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder={signupMessenger === "WhatsApp" ? "e.g. +44 7700 900077" : "e.g. wechat_id"}
                      value={signupMessengerId}
                      onChange={(e) => setSignupMessengerId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(124, 114, 103, 0.2)',
                        background: '#FAF9F6',
                        fontSize: '14px',
                        color: '#1C1B18'
                      }}
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#7C7267',
                  color: '#FAF9F6',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'background 0.3s',
                  marginTop: '10px'
                }}
                onMouseOver={(e) => e.target.style.background = '#63594F'}
                onMouseOut={(e) => e.target.style.background = '#7C7267'}
              >
                {authMode === "login" 
                  ? (lang === "Cn" ? "安全登入" : "Authenticate Session") 
                  : (lang === "Cn" ? "完成註冊並開通" : "Register Partner Account")}
              </button>
            </form>

            {/* Quick Demo Access Header */}
            <div style={{
              margin: '24px 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <div style={{ flex: '1', height: '1px', background: 'rgba(124, 114, 103, 0.15)' }}></div>
              <span style={{ fontSize: '11px', color: '#9C9287', letterSpacing: '0.05em' }}>
                {lang === "Cn" ? "快捷免密通道 (Demo)" : "QUICK DEMO LOGINS"}
              </span>
              <div style={{ flex: '1', height: '1px', background: 'rgba(124, 114, 103, 0.15)' }}></div>
            </div>

            {/* Quick Demo Login Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => loginAsDemo('client')}
                style={{
                  flex: '1',
                  padding: '10px',
                  background: 'rgba(124, 114, 103, 0.08)',
                  border: '1px solid rgba(124, 114, 103, 0.15)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#7C7267',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(124, 114, 103, 0.12)';
                  e.target.style.borderColor = 'rgba(124, 114, 103, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(124, 114, 103, 0.08)';
                  e.target.style.borderColor = 'rgba(124, 114, 103, 0.15)';
                }}
              >
                📱 {lang === "Cn" ? "Sarah Jenkins (客戶)" : "Sarah (Client View)"}
              </button>
              <button
                onClick={() => loginAsDemo('cho')}
                style={{
                  flex: '1',
                  padding: '10px',
                  background: 'rgba(124, 114, 103, 0.08)',
                  border: '1px solid rgba(124, 114, 103, 0.15)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#7C7267',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(124, 114, 103, 0.12)';
                  e.target.style.borderColor = 'rgba(124, 114, 103, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(124, 114, 103, 0.08)';
                  e.target.style.borderColor = 'rgba(124, 114, 103, 0.15)';
                }}
              >
                🛠️ {lang === "Cn" ? "Cho (設計師/經理)" : "Cho (Manager View)"}
              </button>
            </div>

            {/* Toggle Mode */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: '#9C9287' }}>
                {authMode === "login" 
                  ? (lang === "Cn" ? "還沒有帳戶？ " : "New to the platform? ") 
                  : (lang === "Cn" ? "已有註冊帳戶？ " : "Already have an account? ")}
              </span>
              <button
                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  color: '#7C7267',
                  fontWeight: '600',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {authMode === "login" 
                  ? (lang === "Cn" ? "申請加入" : "Register Partner") 
                  : (lang === "Cn" ? "登入帳戶" : "Sign In")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHowItWorksBlock = () => {
    const steps = [
      {
        num: "01",
        titleCn: "Brief · 項目對接與手稿導入",
        titleEn: "Project Intake & AI Parser",
        descCn: "客戶於會員中心上傳設計手稿、幾何尺寸或文字需求。後台 OpenClaw 自動解析、識別比例、導入主數據。",
        descEn: "Clients upload sketch drafts, dimensions, or text briefs. The background OpenClaw engine extracts files and initializes order entries."
      },
      {
        num: "02",
        titleCn: "Quote · 多廠實時比價與透明招標",
        titleEn: "B2B Bid Comparison & Sourcing",
        descCn: "AI 全自動翻譯並生成 RFQ 技術文件，分發至 3 家頂級合約代工廠，聚合單價與工期進行最優推薦。",
        descEn: "AI auto-generates RFQ packages and emails 3 premier contract mills. Price, lead-time, and mill rating are aggregated."
      },
      {
        num: "03",
        titleCn: "Spec · 技術圖紙與BOM自動生成",
        titleEn: "Automated CAD specs & BOMs",
        descCn: "根據確定的物料，算法自動生成幾何三視圖、公差邊界與完整的雙語 BOM 列表，提供給客戶及 Cho 審批簽發。",
        descEn: "Based on confirmed specifications, custom CAD elevations and bilingual BOM lists are auto-generated for sign-off."
      },
      {
        num: "04",
        titleCn: "Production · 掃碼動態監測與進度追蹤",
        titleEn: "QR Progress Scan & Tracking",
        descCn: "物料到廠粘貼唯一二維碼，工匠車間掃碼隨時查看 3D 三視圖，每日進度同步更新至客戶平台與 WhatsApp。",
        descEn: "Mill materials are labeled with QR codes. Craftsmen scan to view 3D assemblies, logging daily progress live."
      },
      {
        num: "05",
        titleCn: "Compliance · 英國 Crib 5 消防與CV驗證",
        titleEn: "Crib 5 Gate & CV Verification",
        descCn: "硬性防火及環保攔截門檻。配備 AI 視覺比對算法，自動驗證大貨相片與設計 CAD，確保零色差與零公差失誤。",
        descEn: "Inherently gated for UK Crib 5 fire resistance. AI CV algorithm compares physical photos against CAD contours."
      },
      {
        num: "06",
        titleCn: "Delivery · 集裝箱排櫃優化與在途追踪",
        titleEn: "3D Cargo Stacking & Shipping",
        descCn: "根據大貨尺寸自動運算 3D 箱體容積最大化排櫃圖。實時追蹤馬士基船運 ETA 進度，直至倫敦或 St Albans 交付簽字。",
        descEn: "Calculates optimal 3D container stacking plans. MAERSK marine APIs track shipping positions until final site handover."
      }
    ];

    return (
      <div id="how-it-works" style={{ padding: '80px 0', borderTop: '1px solid rgba(124, 114, 103, 0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ fontSize: '12px', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {lang === "Cn" ? "製造生命週期" : "MANUFACTURING LIFE-CYCLE"}
          </span>
          <h2 style={{
            fontSize: '32px',
            color: '#1C1B18',
            fontWeight: '600',
            marginTop: '10px',
            letterSpacing: '0.05em',
            fontFamily: "'Outfit', 'Inter', sans-serif"
          }}>
            {lang === "Cn" ? "六大核心交付階段" : "Six Pillars of Seamless B2B Delivery"}
          </h2>
          <div style={{ width: '40px', height: '2px', background: '#7C7267', margin: '20px auto 0 auto' }}></div>
        </div>

        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          {steps.map((st, idx) => (
            <div 
              key={idx}
              className="case-study-card"
              style={{
                background: '#FAF9F6',
                border: '1px solid rgba(124, 114, 103, 0.1)',
                borderRadius: '12px',
                padding: '30px',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '15px',
                fontSize: '80px',
                fontWeight: '900',
                color: 'rgba(124, 114, 103, 0.05)',
                userSelect: 'none',
                fontFamily: "'Outfit', sans-serif"
              }}>
                {st.num}
              </div>
              
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#7C7267',
                color: '#FAF9F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '20px'
              }}>
                {st.num}
              </div>

              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1C1B18',
                marginBottom: '10px',
                fontFamily: "'Outfit', sans-serif"
              }}>
                {lang === "Cn" ? st.titleCn : st.titleEn}
              </h4>
              
              <p style={{
                fontSize: '13.5px',
                color: '#7C7267',
                lineHeight: '1.6',
                margin: 0
              }}>
                {lang === "Cn" ? st.descCn : st.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOurStoryBlock = () => {
    return (
      <div style={{ padding: '60px 0' }} className="animate-fade-in">
        {/* Banner Section */}
        <div style={{
          background: '#F3F1ED',
          borderRadius: '16px',
          padding: '60px 40px',
          marginBottom: '60px',
          textAlign: 'center',
          border: '1px solid rgba(124, 114, 103, 0.1)'
        }}>
          <span style={{ fontSize: '12px', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {lang === "Cn" ? "我們的傳承" : "OUR HERITAGE"}
          </span>
          <h2 style={{
            fontSize: '36px',
            color: '#1C1B18',
            fontWeight: '600',
            marginTop: '12px',
            marginBottom: '20px',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            letterSpacing: '0.05em'
          }}>
            {lang === "Cn" ? "倫敦思維與極致工藝的全球協同" : "London Design Synergized with Chinese Craftsmanship"}
          </h2>
          <p style={{
            maxWidth: '700px',
            margin: '0 auto',
            fontSize: '15px',
            color: '#7C7267',
            lineHeight: '1.7',
            fontFamily: "'Georgia', serif",
            fontStyle: 'italic'
          }}>
            {lang === "Cn"
              ? "「我們在倫敦定義美學、融匯法規；我們在中國精工落地、精確量產。這不是簡單的代工，而是將高端設計與多智能體圖紙解析技術結合的未來之路。」"
              : "“We define premium aesthetics and ensure UK/EU compliance in London; we execute custom engineering and scale production seamlessly in China. A flawless union of classic craft and multi-agent automations.”"}
          </p>
        </div>

        {/* Dual Column Synergy Details - Interlaced with Images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginBottom: '60px' }}>
          {/* Row 1: London (Text Left, Image Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
            <div style={{ background: '#FAF9F6', borderRadius: '12px', padding: '40px', border: '1px solid rgba(124, 114, 103, 0.1)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '11px', color: '#7C7267', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>LONDON HEADQUARTERS</span>
              </div>
              <h3 style={{ fontSize: '22px', color: '#1C1B18', fontWeight: '600', marginBottom: '15px', fontFamily: "'Cormorant Garamond', serif" }}>
                {lang === "Cn" ? "倫敦設計工作室與體驗廳" : "London Design & Client Hub"}
              </h3>
              <p style={{ fontSize: '14px', color: '#7C7267', lineHeight: '1.6', marginBottom: '20px' }}>
                {lang === "Cn"
                  ? "座落於倫敦核心設計街區，負責全球合約傢俱 (Contract Furniture) 的前期概念策劃、物料板定案及歐洲嚴苛的消防法規（如 BS 5852 Crib 5）對接。我們是客戶與智能工廠之間的靈魂紐帶。"
                  : "Located in London's premier design district, coordinates custom material selection, FF&E consulting, and stringent European fire code compliance (BS 5852 Crib 5). The creative and compliance soul linking clients with engineering."}
              </p>
              <div style={{ fontSize: '12px', color: '#7C7267', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>56 Clerkenwell Road, London, EC1M 5PX</span>
              </div>
            </div>
            <div className="hero-image-container glass-card" style={{ height: '380px', overflow: 'hidden', borderRadius: '12px' }}>
              <img 
                src={IMAGES.blueprintIntake} 
                alt="London Design Sketch" 
                className="hero-image-zoom" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Row 2: China (Image Left, Text Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
            <div className="hero-image-container glass-card" style={{ height: '380px', overflow: 'hidden', borderRadius: '12px', order: window.innerWidth < 768 ? 2 : 0 }}>
              <img 
                src={IMAGES.workflowPhases} 
                alt="High Precision Manufacturing" 
                className="hero-image-zoom" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ background: '#FAF9F6', borderRadius: '12px', padding: '40px', border: '1px solid rgba(124, 114, 103, 0.1)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '11px', color: '#7C7267', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>INTELLIGENT MANUFACTURING</span>
              </div>
              <h3 style={{ fontSize: '22px', color: '#1C1B18', fontWeight: '600', marginBottom: '15px', fontFamily: "'Cormorant Garamond', serif" }}>
                {lang === "Cn" ? "中國高精尖製造合作基地" : "High-Precision Manufacturing base"}
              </h3>
              <p style={{ fontSize: '14px', color: '#7C7267', lineHeight: '1.6', marginBottom: '20px' }}>
                {lang === "Cn"
                  ? "分佈於廣東佛山與東莞的頂級合約家具製造基地，配備先進的多智能體圖紙解析技術（OpenClaw）。老師傅們的卓越手工與高精密 CNC 二維碼定位技術結合，讓每件成品與 CAD 圖紙精確吻合。"
                  : "Base in Foshan and Dongguan, equipped with advanced OpenClaw agents. Elite craftsmen synergize with CNC automation and QR precision labeling, ensuring every piece matches its CAD blueprint down to ±1mm tolerance."}
              </p>
              <div style={{ fontSize: '12px', color: '#7C7267', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Longjiang Furniture Hub, Shunde, Guangdong, China</span>
              </div>
            </div>
          </div>
        </div>

        {/* Values and Global Logistics Network */}
        <div style={{ background: '#FAF9F6', borderRadius: '12px', padding: '40px', border: '1px solid rgba(124, 114, 103, 0.1)' }}>
          <h3 style={{ fontSize: '24px', color: '#1C1B18', fontWeight: '600', marginBottom: '20px', textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '1px' }}>
            {lang === "Cn" ? "我們的核心承諾" : "Our B2B Commitments"}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', marginTop: '30px' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg style={{ width: '32px', height: '32px', color: 'var(--accent-primary)', marginBottom: '15px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1C1B18', marginBottom: '8px' }}>
                {lang === "Cn" ? "商業機密安全" : "IP & Commercial Security"}
              </h4>
              <p style={{ fontSize: '13px', color: '#7C7267', margin: 0, lineHeight: '1.5' }}>
                {lang === "Cn" ? "所有定製藍圖、BOM表與詢價細節受帳號 hard-gated 門檻保護，嚴防設計外洩。" : "All drawings, BOMs and bids are hard-gated to prevent commercial leaks."}
              </p>
            </div>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg style={{ width: '32px', height: '32px', color: 'var(--accent-primary)', marginBottom: '15px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.01 11c0 1.11-.277 3.06-1.552 4.121z" />
              </svg>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1C1B18', marginBottom: '8px' }}>
                {lang === "Cn" ? "100% 英國 Crib 5 合規" : "100% Crib 5 Fire Compliance"}
              </h4>
              <p style={{ fontSize: '13px', color: '#7C7267', margin: 0, lineHeight: '1.5' }}>
                {lang === "Cn" ? "智能識別材料消防資質，全自動卡點硬阻攔不合規物料，護航商業交付。" : "Automated material compliance checks prevent non-compliant materials from being shipped."}
              </p>
            </div>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg style={{ width: '32px', height: '32px', color: 'var(--accent-primary)', marginBottom: '15px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1C1B18', marginBottom: '8px' }}>
                {lang === "Cn" ? "自動生成圖紙" : "Auto Blueprint Generation"}
              </h4>
              <p style={{ fontSize: '13px', color: '#7C7267', margin: 0, lineHeight: '1.5' }}>
                {lang === "Cn" ? "深度解析草圖，平面/立面/剖面圖紙為每一件產品自動精確生成與歸檔。" : "Sketches are auto-parsed into geometric CAD specs and archived."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContactBlock = () => {
    const faqs = [
      {
        qCn: "為什麼 The Crafton 平台的項目中心需要註冊登入才能查看？",
        qEn: "Why is the Client Portal gated with account registration?",
        aCn: "作為高端 B2B 合約家具製造商，我們經手的項目圖紙、CAD 三視圖、英國 Crib 5 阻燃檢測報告以及多個工廠的比價定製 BOM，均涉及極度敏感的商業機密與專利設計。為了保障設計師和業主（Hotels & Developers）的利益，我們採取了硬性安全門檻（Hard Gate）。",
        aEn: "As a premium contract furniture specialist, the custom drawings, CAD models, Crib 5 certificates, and competitive mill BOM sheets represent sensitive B2B trade secrets. Gating protects design copyright and pricing confidentiality."
      },
      {
        qCn: "我們的家具如何滿足英國 Crib 5（Source 5）消防阻燃標準？",
        qEn: "How does The Crafton ensure compliance with British Crib 5 fire codes?",
        aCn: "所有大貨面料在選型阶段即通過系統的 Compliance Gate 自動比對資料庫。如 Royal Velvet 或 Navy Linen，出廠前均進行阻燃塗層處理；對於絲綢等天然不合規物料，系統將強行攔截並提供替代建議，成品均出具第三方物理燃燒合格報告。",
        aEn: "All fabrics undergo automated compliance database screening. Approved fabrics (like Royal Velvet) receive fire-retardant coating treatments. Unsuited fabrics (like silk) are auto-blocked, ensuring the final output gets authorized certificates."
      },
      {
        qCn: "如果項目現場發生變更，支持分批送貨和預算劃線重新計算嗎？",
        qEn: "Do you support split delivery and total recalculation on site changes?",
        aCn: "支持。在 Phase VI (S15 階段)，如果因現場裝修變動需要取消部分單品，系統的財務模組（Split Delivery Auditor）將會對已取消項目進行劃線（Strike-through）標註，自動從總帳單中扣除，並重新分配尾款，支持分批靈活交付。",
        aEn: "Yes. During Stage 15, if site changes require item cancellation, the accounting module automatically triggers strike-throughs on canceled pieces, recalculates remaining balances instantly, and schedules split logistics."
      },
      {
        qCn: "我沒有自己的 CAD 圖紙，只有手繪草圖或照片，系統可以工作嗎？",
        qEn: "Can the system work with hand-drawn sketches or simple photos?",
        aCn: "完全可以。您只需在 Start the Project 的 Intake 表單中上傳手繪草圖或實景照片，後台 OpenClaw 多模態 AI 智能體將自動識別線條、拉伸尺寸公差，為您精確生成可用於工廠生產的平面、立面和剖面圖紙。",
        aEn: "Absolutely. Simply upload hand-drawn sketches or reference photos to our Intake Form. The background OpenClaw multimodal engine automatically traces contours and generates factory-ready 3D/2D blueprints."
      }
    ];

    return (
      <div style={{ padding: '60px 0' }} className="animate-fade-in">
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', marginBottom: '60px' }}>
          {/* Left Column: Hubs and Form */}
          <div style={{ flex: '1.2', minWidth: '320px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1C1B18', marginBottom: '20px', fontFamily: "'Outfit', sans-serif" }}>
              {lang === "Cn" ? "聯絡全球工作室" : "Contact Global Hubs"}
            </h3>
            
            <p style={{ fontSize: '14.5px', color: '#7C7267', lineHeight: '1.6', marginBottom: '30px' }}>
              {lang === "Cn"
                ? "不論您是需要諮詢高端合約家具設計、送審 Crib 5 阻燃資質、或是導入新的 B2B 量產項目，我們的倫敦和中國團隊隨時為您提供支持。"
                : "Whether consult on contract furniture designs, verify Crib 5 flammability certifications, or initialize high-volume B2B manufacturing, our global team is ready to assist."}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
              <div style={{ background: '#FAF9F6', padding: '20px', borderRadius: '8px', border: '1px solid rgba(124, 114, 103, 0.1)' }}>
                <div style={{ fontSize: '11px', color: '#9C9287', letterSpacing: '0.1em', fontWeight: 'bold' }}>🇬🇧 UNITED KINGDOM</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1C1B18', margin: '6px 0' }}>London Studio</div>
                <div style={{ fontSize: '12px', color: '#7C7267', lineHeight: '1.4' }}>
                  +44 20 7946 0192<br />
                  london@crafton.com
                </div>
              </div>
              <div style={{ background: '#FAF9F6', padding: '20px', borderRadius: '8px', border: '1px solid rgba(124, 114, 103, 0.1)' }}>
                <div style={{ fontSize: '11px', color: '#9C9287', letterSpacing: '0.1em', fontWeight: 'bold' }}>🇨🇳 CHINA</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1C1B18', margin: '6px 0' }}>Manufacturing HQ</div>
                <div style={{ fontSize: '12px', color: '#7C7267', lineHeight: '1.4' }}>
                  +86 757 2388 9988<br />
                  factory@crafton.com
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <div style={{ background: '#FAF9F6', padding: '30px', borderRadius: '12px', border: '1px solid rgba(124, 114, 103, 0.1)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1C1B18', marginBottom: '15px' }}>
                {lang === "Cn" ? "快速提交諮詢" : "Submit a Quick Inquiry"}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <input type="text" placeholder={lang === "Cn" ? "姓名" : "Name"} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid rgba(124, 114, 103, 0.15)', background: '#FAF9F6' }} />
                  <input type="email" placeholder={lang === "Cn" ? "郵箱" : "Email"} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid rgba(124, 114, 103, 0.15)', background: '#FAF9F6' }} />
                </div>
                <textarea rows="3" placeholder={lang === "Cn" ? "描述您的項目需求..." : "Describe your project requirements..."} style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(124, 114, 103, 0.15)', background: '#FAF9F6', resize: 'none' }}></textarea>
                <button 
                  onClick={() => alert(lang === "Cn" ? "諮詢已提交，我們將通過郵件與 WhatsApp 儘速聯繫您！" : "Inquiry submitted! We will reach out via email/WhatsApp shortly.")}
                  style={{ padding: '10px', background: '#7C7267', color: '#FAF9F6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', letterSpacing: '0.05em' }}
                >
                  {lang === "Cn" ? "發送訊息" : "Send Message"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: FAQ Accordion */}
          <div style={{ flex: '1', minWidth: '320px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1C1B18', marginBottom: '25px', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.5px' }}>
              {lang === "Cn" ? "常見問題 (FAQ)" : "Frequently Asked Questions"}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      background: '#FAF9F6', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(124, 114, 103, 0.1)',
                      overflow: 'hidden',
                      transition: 'border-color 0.3s'
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14.5px',
                        color: '#1C1B18'
                      }}
                    >
                      <span>{lang === "Cn" ? faq.qCn : faq.qEn}</span>
                      <svg 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)', 
                          transform: isOpen ? 'rotate(180deg)' : 'none', 
                          color: '#7C7267' 
                        }} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="1.8"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div style={{
                      maxHeight: isOpen ? '500px' : '0px',
                      opacity: isOpen ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 450ms cubic-bezier(0.16, 1, 0.3, 1)',
                      borderTop: isOpen ? '1px solid rgba(124, 114, 103, 0.05)' : '1px solid transparent'
                    }}>
                      <div style={{ 
                        padding: '16px 20px 20px 20px', 
                        fontSize: '13.5px', 
                        color: '#7C7267', 
                        lineHeight: '1.6' 
                      }}>
                        {lang === "Cn" ? faq.aCn : faq.aEn}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    return (
      <footer style={{
        backgroundColor: '#1A1918',
        borderTop: '1px solid rgba(250, 247, 242, 0.08)',
        padding: '5rem 2rem 3rem 2rem',
        marginTop: '6rem',
        color: '#FAF7F2',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.85rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '4rem',
          textAlign: 'left'
        }} className="footer-columns">
          {/* Col 1: Brand & Philosophy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <span style={{
              fontFamily: 'var(--font-tech)',
              fontSize: '1.6rem',
              fontWeight: '500',
              letterSpacing: '3px',
              color: '#FAF7F2',
              textTransform: 'uppercase'
            }}>
              THE CRAFTON
            </span>
            <p style={{
              color: '#9E958B',
              lineHeight: '1.7',
              fontWeight: '300',
              fontSize: '0.85rem',
              maxWidth: '300px'
            }}>
              {lang === "Cn"
                ? "義式極簡合約傢俱設計與精工製造。為全球頂奢酒店、高端住宅及设计事務所提供毫米級工程交付。"
                : "Italian Minimalist contract furniture design and engineering. Delivering millimeter-precision custom products for luxury hotels, residences, and design ateliers globally."}
            </p>
          </div>

          {/* Col 2: Sitemap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <span style={{
              fontFamily: 'var(--font-tech)',
              fontSize: '1rem',
              fontWeight: '600',
              letterSpacing: '1px',
              color: 'var(--accent-secondary)',
              textTransform: 'uppercase'
            }}>
              {lang === "Cn" ? "網站導航" : "SITEMAP"}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontWeight: '300' }}>
              {[
                { id: "Overview", cn: "首頁", en: "Home" },
                { id: "HowItWorks", cn: "合作流程", en: "How It Works" },
                { id: "CaseStudies", cn: "經典案例", en: "Case Studies" },
                { id: "BespokeFurniture", cn: "高端定製", en: "Bespoke Furniture" },
                { id: "SetFurniture", cn: "標準套配", en: "Set Furniture" },
                { id: "Contact", cn: "聯絡我們", en: "Contact Us" }
              ].map((link) => (
                <span
                  key={link.id}
                  onClick={() => {
                    setCurrentStageView("Marketing");
                    setMarketingTab(link.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    color: '#9E958B',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#FAF7F2'}
                  onMouseLeave={(e) => e.target.style.color = '#9E958B'}
                >
                  {lang === "Cn" ? link.cn : link.en}
                </span>
              ))}
            </div>
          </div>

          {/* Col 3: Compliance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <span style={{
              fontFamily: 'var(--font-tech)',
              fontSize: '1rem',
              fontWeight: '600',
              letterSpacing: '1px',
              color: 'var(--accent-secondary)',
              textTransform: 'uppercase'
            }}>
              {lang === "Cn" ? "技術合規" : "COMPLIANCE"}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#9E958B', fontWeight: '300' }}>
              <span>{lang === "Cn" ? "英國 BS 5852 Crib 5 消防阻燃" : "BS 5852 Crib 5 Fire Rated"}</span>
              <span>{lang === "Cn" ? "FSC® 綠色可持續硬木" : "FSC® Certified Hardwoods"}</span>
              <span>{lang === "Cn" ? "8%-12% H₂O 真空窯幹防裂" : "8%-12% H₂O Kiln Dried"}</span>
              <span>{lang === "Cn" ? "ISO 9001 質量認證工廠" : "ISO 9001 Quality Assured"}</span>
            </div>
          </div>

          {/* Col 4: Contact & Locations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <span style={{
              fontFamily: 'var(--font-tech)',
              fontSize: '1rem',
              fontWeight: '600',
              letterSpacing: '1px',
              color: 'var(--accent-secondary)',
              textTransform: 'uppercase'
            }}>
              {lang === "Cn" ? "全球聯絡" : "OFFICES"}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', color: '#9E958B', fontWeight: '300', fontSize: '0.8rem' }}>
              <div>
                <strong style={{ color: '#FAF7F2', display: 'block', marginBottom: '2px', fontSize: '0.85rem' }}>🇬🇧 LONDON STUDIO</strong>
                <span>+44 20 7946 0192</span><br />
                <span>london@crafton.com</span>
              </div>
              <div>
                <strong style={{ color: '#FAF7F2', display: 'block', marginBottom: '2px', fontSize: '0.85rem' }}>🇨🇳 GUANGDONG MILL HQ</strong>
                <span>+86 757 2388 9988</span><br />
                <span>factory@crafton.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div style={{
          maxWidth: '1200px',
          margin: '4rem auto 0 auto',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(250, 247, 242, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          color: '#9E958B',
          fontSize: '0.75rem',
          fontWeight: '300'
        }}>
          <span>
            © 2026 THE CRAFTON. {lang === "Cn" ? "保留所有權利。" : "All rights reserved."}
          </span>
          <span style={{ fontFamily: 'var(--font-tech)', fontStyle: 'italic', letterSpacing: '0.5px' }}>
            {lang === "Cn" ? "意式極簡 · 匠心製造" : "Fine Contract Furniture of Italian Minimalist Craftsmanship."}
          </span>
        </div>
      </footer>
    );
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
                🔌 Supabase 實時數據庫連接 (Live Database Sync)
              </h3>
              <button 
                onClick={() => setShowDbConfig(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
              {lang === "Cn" 
                ? "連接到您的 Supabase 實時雲數據庫。系統將直接從 projects, specifications 和 agent_logs 數據表中讀取和實時寫入數據。如果斷開，將優雅降級到本地模擬數據。"
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
                  ⚠️ ERROR: {dbError}
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
                      {dbLoading ? (lang === "Cn" ? "處理中..." : "Processing...") : (lang === "Cn" ? "⚡️ 強制重新播種數據" : "⚡️ Force Re-Seed Database")}
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
        <div className="logo-container" onClick={() => {
          setCurrentStageView("Marketing");
          setMarketingTab("Overview");
        }} style={{ cursor: 'pointer' }}>
          <span className="logo-logo" style={{ letterSpacing: '0.15em', fontWeight: '700' }}>THE CRAFTON</span>
        </div>

        <div className="nav-links">
          <span 
            className={`nav-link ${currentView === "Marketing" && marketingTab === "Overview" ? "active" : ""}`} 
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("Overview");
            }}
          >
            {lang === "Cn" ? "首頁" : "HOME"}
          </span>
          <span 
            className={`nav-link ${currentView === "Marketing" && marketingTab === "HowItWorks" ? "active" : ""}`} 
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("HowItWorks");
            }}
          >
            {lang === "Cn" ? "合作流程" : "HOW IT WORKS"}
          </span>
          <span 
            className={`nav-link ${currentView === "Marketing" && marketingTab === "CaseStudies" ? "active" : ""}`} 
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("CaseStudies");
            }}
          >
            {lang === "Cn" ? "經典案例" : "CASE STUDY"}
          </span>
          <span 
            className={`nav-link ${currentView === "Marketing" && marketingTab === "BespokeFurniture" ? "active" : ""}`} 
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("BespokeFurniture");
            }}
          >
            {lang === "Cn" ? "高端定製" : "BESPOKE FURNITURE"}
          </span>
          <span 
            className={`nav-link ${currentView === "Marketing" && marketingTab === "SetFurniture" ? "active" : ""}`} 
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("SetFurniture");
            }}
          >
            {lang === "Cn" ? "標準套配" : "SET FURNITURE"}
          </span>
          <span 
            className={`nav-link ${currentView === "Marketing" && marketingTab === "Contact" ? "active" : ""}`} 
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("Contact");
            }}
          >
            {lang === "Cn" ? "聯絡我們" : "CONTACT"}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={handleLangToggle} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              <path d="M2 12h20" />
            </svg>
            <span>{lang === "Cn" ? "English" : "繁體中文"}</span>
          </button>

          {user ? (
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {lang === "Cn" ? `歡迎，${user.name}` : `Welcome, ${user.name}`}
              </span>
              <span 
                className={`nav-link ${currentView === "ClientPortal" ? "active" : ""}`} 
                onClick={() => setCurrentStageView("ClientPortal")}
                style={{ fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {lang === "Cn" ? "客戶中心" : "Client Portal"}
              </span>
              {user.email === 'cho@crafton.com' && (
                <span 
                  className={`nav-link ${currentView === "Backoffice" ? "active" : ""}`} 
                  onClick={() => setCurrentStageView("Backoffice")}
                  style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {lang === "Cn" ? "管理控制台" : "Backoffice"}
                </span>
              )}
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.85rem',
                  color: 'var(--accent-red)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                {lang === "Cn" ? "登出" : "Sign Out"}
              </button>
            </div>
          ) : (
            <>
              <button 
                className="nav-link" 
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthGate(true);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {lang === "Cn" ? "登入" : "Sign In"}
              </button>
              <button 
                className="btn-premium animate-pulse" 
                onClick={() => {
                  if (user) {
                    setCurrentStageView("ClientPortal");
                    setClientPortalTab("Intake");
                  } else {
                    setAuthMode("signup");
                    setShowAuthGate(true);
                  }
                }}
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', fontWeight: '600' }}
              >
                {lang === "Cn" ? "啟動項目" : "Start the Project"}
              </button>
            </>
          )}
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
            ⚠️ <strong>{lang === "Cn" ? "Supabase 同步 / 播種錯誤 (Seeding Error):" : "Supabase Sync / Seeding Error:"}</strong> {dbError}
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
            {lang === "Cn" ? "點擊排查配置 / Troubleshoot" : "Troubleshoot Config"}
          </button>
        </div>
      )}

      {/* VIEW 1: Web Marketing Portal */}
      {currentView === "Marketing" && (
        <div className="animate-fade-in" style={{ paddingBottom: "4rem" }}>
          {marketingTab === "Overview" && (
            <>
              {/* Asymmetrical Editorial Split-Screen Magazine Hero */}
              <div className="animate-editorial-slide-up" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1.2fr 1fr', 
                gap: '4rem', 
                alignItems: 'center', 
                maxWidth: '1200px', 
                margin: '0 auto', 
                padding: '6rem 2rem 4rem 2rem' 
              }}>
                {/* Left: Typography Editorial Block */}
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    letterSpacing: '2px', 
                    color: 'var(--accent-muted)', 
                    textTransform: 'uppercase', 
                    marginBottom: '1rem', 
                    fontFamily: 'var(--font-sans)' 
                  }}>
                    EST. 2021 | BESPOKE B2B CONTRACT ATELIER
                  </div>
                  
                  {lang === "Cn" ? (
                    <h1 style={{ 
                      fontFamily: 'var(--font-tech)', 
                      fontSize: '3.2rem', 
                      fontWeight: '300', 
                      lineHeight: '1.15', 
                      color: 'var(--text-primary)', 
                      marginBottom: '1.8rem',
                      letterSpacing: '-0.5px'
                    }}>
                      THE CRAFTON <br />
                      <span style={{ fontSize: '1.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', fontFamily: 'var(--font-tech)' }}>
                        意式極簡 · 專屬高端合約家具與軟裝製造
                      </span>
                    </h1>
                  ) : (
                    <h1 style={{ 
                      fontFamily: 'var(--font-tech)', 
                      fontSize: '3.4rem', 
                      fontWeight: '300', 
                      lineHeight: '1.15', 
                      color: 'var(--text-primary)', 
                      marginBottom: '1.8rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '-1px' 
                    }}>
                      THE CRAFTON <br />
                      <span style={{ fontSize: '2rem', textTransform: 'none', color: 'var(--text-secondary)', fontStyle: 'italic', fontFamily: 'var(--font-tech)' }}>
                        Makers of High-End Contract Furniture
                      </span>
                    </h1>
                  )}

                  <p style={{ 
                    fontSize: '1.02rem', 
                    color: 'var(--text-secondary)', 
                    marginBottom: '2.5rem', 
                    lineHeight: '1.8', 
                    fontWeight: '300', 
                    fontFamily: 'var(--font-sans)' 
                  }}>
                    {lang === "Cn" 
                      ? "我們為全球高端商業項目與頂奢豪宅量身定製、設計並製造 B2B 合約家具。精準圖紙與自動化工程規格書在您的專屬雲端工作坊（Client Portal）中實時同步，以匠人匠心與阻尼動效致敬意式極簡美學。" 
                      : "We engineer, refine and manufacture bespoke contract furniture to your exact specifications. Autogenous engineering blueprints, real-time bid evaluations, and strict Crib 5 fire compliances sync dynamically in your digital Client Portal."}
                  </p>

                  <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'flex-start' }}>
                    <button className="btn-premium" style={{ padding: '0.8rem 2rem', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }} onClick={() => {
                      if (user) {
                        setCurrentStageView("ClientPortal");
                        setClientPortalTab("Intake");
                      } else {
                        setAuthMode("signup");
                        setShowAuthGate(true);
                      }
                    }}>
                      {lang === "Cn" ? "啟動項目 ＋ AI規格解析" : "Start Project & Parse"}
                    </button>
                  </div>
                </div>

                {/* Right: Asymmetric Showroom Image Card backed by a Travertine panel */}
                <div className="hero-image-container" style={{ position: 'relative', paddingRight: '15px', paddingBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                  {/* Travertine-stone offset background panel */}
                  <div style={{
                    position: 'absolute',
                    right: '0',
                    bottom: '0',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'var(--bg-tertiary)',
                    zIndex: 1,
                    borderRadius: '6px',
                    transform: 'translate(10px, 10px)'
                  }}></div>
                  {/* Actual image container with border and zoom */}
                  <div className="glass-card" style={{
                    position: 'relative',
                    zIndex: 2,
                    overflow: 'hidden',
                    borderRadius: '6px',
                    aspectRatio: '1/1.1',
                    width: '100%',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--glass-shadow)',
                    transform: 'translateY(0px)'
                  }}>
                    <img 
                      className="hero-image-zoom"
                      src={IMAGES.heroChair} 
                      alt="The Crafton Luxury Contract Armchair" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Editorial Model Tag */}
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      background: 'rgba(250, 247, 242, 0.9)',
                      backdropFilter: 'blur(10px)',
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: 'var(--accent-primary)',
                      borderRadius: '2px',
                      border: '1px solid var(--glass-border)'
                    }}>
                      MODEL: L-CR04
                    </div>
                    {/* Subtext info overlay at bottom of image */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      background: 'linear-gradient(to top, rgba(26,25,24,0.85) 0%, rgba(26,25,24,0) 100%)',
                      padding: '2.5rem 1.5rem 1.5rem 1.5rem',
                      color: '#ffffff',
                      textAlign: 'left'
                    }}>
                      <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.35rem', fontWeight: '400', letterSpacing: '0.5px' }}>
                        Tuscan Minimalist Lounge Armchair
                      </div>
                      <div style={{ fontSize: '0.65rem', opacity: '0.8', marginTop: '5px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                        Specs: W: 650mm / D: 600mm / H: 850mm
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Tell Us What You Need */}
              <div className="animate-editorial-slide-up" style={{
                maxWidth: '1200px',
                margin: '8rem auto 4rem auto',
                padding: '0 2rem',
                textAlign: 'center'
              }}>
                <h2 style={{
                  fontSize: '3rem',
                  fontFamily: 'var(--font-tech)',
                  color: 'var(--text-primary)',
                  fontWeight: '300',
                  letterSpacing: '0.01em',
                  marginBottom: '1.2rem'
                }}>
                  {lang === "Cn" ? <>告訴我們您的<strong>需求。</strong></> : <>Tell us <em>what you need.</em></>}
                </h2>
                <p style={{
                  fontSize: '0.98rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '300',
                  lineHeight: '1.8',
                  maxWidth: '850px',
                  margin: '0 auto 4rem auto'
                }}>
                  {lang === "Cn"
                    ? "無論是以何種檔案格式存在於您的系統中 ── 我們都能為您完美接手。Crafton AI 能自動讀取並智慧生成結構化的項目規格書。"
                    : "However it lives in your filing system — we'll take it from there. Crafton AI reads your input and structures the brief automatically."}
                </p>

                {/* 4 Cards Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  
                  {/* Card 1 */}
                  <div className="glass-card" style={{
                    border: '1px dashed rgba(124, 114, 103, 0.3)',
                    padding: '2.5rem 1.5rem',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }} onClick={() => {
                    if (user) {
                      setCurrentStageView("ClientPortal");
                      setClientPortalTab("Intake");
                    } else {
                      setAuthMode("signup");
                      setShowAuthGate(true);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(124, 114, 103, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-muted)', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '1.2rem' }}>No. 01</span>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(124, 114, 103, 0.05)',
                        border: '1px solid rgba(124, 114, 103, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                      }}>
                        <svg style={{ width: '22px', height: '24px', stroke: 'var(--accent-primary)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.2rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                        {lang === "Cn" ? <>上傳 <em>PDF 文件</em></> : <>Upload a <em>PDF</em></>}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', minHeight: '40px' }}>
                        {lang === "Cn"
                          ? "設計規格書、招標書或單頁簡報，拖拽直接導入。"
                          : "A spec sheet, a tender pack, a single-page brief. Drop it in."}
                      </p>
                    </div>

                    <div>
                      {/* Interactive Mock Form */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid rgba(124,114,103,0.12)',
                        borderRadius: '4px',
                        padding: '1rem',
                        marginTop: '1.5rem',
                        boxShadow: '0 4px 12px rgba(26,25,24,0.02)',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ height: '6px', width: '35%', background: 'rgba(124,114,103,0.3)', borderRadius: '2px' }}></div>
                          <div style={{ height: '6px', width: '75%', background: 'rgba(124,114,103,0.15)', borderRadius: '2px' }}></div>
                          <div style={{ border: '1px solid rgba(124,114,103,0.1)', borderRadius: '3px', height: '22px', display: 'flex', alignItems: 'center', padding: '0 0.4rem', background: '#FAF7F2' }}>
                            <div style={{ height: '5px', width: '45%', background: 'rgba(124,114,103,0.2)', borderRadius: '1px' }}></div>
                          </div>
                          <div style={{ border: '1px dashed var(--accent-primary)', borderRadius: '3px', height: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(124,114,103,0.02)' }}>
                            <svg style={{ width: '12px', height: '12px', stroke: 'var(--accent-primary)', fill: 'none', marginBottom: '2px' }} viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>Drop PDF Here</span>
                          </div>
                        </div>
                      </div>

                      <span className="card-link" style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        color: 'var(--accent-primary)',
                        borderBottom: '1.5px solid rgba(124, 114, 103, 0.2)',
                        paddingBottom: '4px',
                        display: 'inline-block',
                        marginTop: '1.5rem',
                        transition: 'all 0.3s ease'
                      }}>{lang === "Cn" ? "選擇檔案 →" : "CHOOSE FILE →"}</span>
                    </div>
                  </div>

                  {/* Card 2 (Highlighted Dark Card) */}
                  <div style={{
                    backgroundColor: '#1C1B1A',
                    color: '#FAF7F2',
                    padding: '2.5rem 1.5rem',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 15px 35px rgba(26, 25, 24, 0.15)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }} onClick={() => {
                    if (user) {
                      setCurrentStageView("ClientPortal");
                      setClientPortalTab("Intake");
                    } else {
                      setAuthMode("signup");
                      setShowAuthGate(true);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(26, 25, 24, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(26, 25, 24, 0.15)';
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#C5B4A5', opacity: '0.7', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '1.2rem' }}>No. 02</span>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                      }}>
                        <svg style={{ width: '22px', height: '22px', stroke: '#ffffff', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="9" y1="3" x2="9" y2="21" />
                          <line x1="15" y1="3" x2="15" y2="21" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                          <line x1="3" y1="15" x2="21" y2="15" />
                        </svg>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.2rem', fontWeight: '300', color: '#ffffff', marginBottom: '0.8rem' }}>
                        {lang === "Cn" ? <>Excel <em>彙總表</em></> : <>Excel <em>summary</em></>}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#C5B4A5', opacity: '0.85', lineHeight: '1.6', fontWeight: '300', minHeight: '40px' }}>
                        {lang === "Cn"
                          ? "包含產品清單、數量及規格尺寸的電子表格。"
                          : "A schedule of items, quantities and dimensions in a spreadsheet."}
                      </p>
                    </div>

                    <div>
                      {/* Interactive Dark Mock Form */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        padding: '1rem',
                        marginTop: '1.5rem',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ height: '6px', width: '40%', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '2px' }}></div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ flex: 1, height: '18px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', border: '1px solid rgba(255, 255, 255, 0.05)' }}></div>
                            <div style={{ flex: 1, height: '18px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', border: '1px solid rgba(255, 255, 255, 0.05)' }}></div>
                            <div style={{ flex: 1, height: '18px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', border: '1px solid rgba(255, 255, 255, 0.05)' }}></div>
                          </div>
                          <div style={{ height: '18px', background: 'var(--accent-primary)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ height: '5px', width: '35%', background: '#ffffff', opacity: 0.9, borderRadius: '1px' }}></div>
                          </div>
                        </div>
                      </div>

                      <span className="card-link" style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        color: 'var(--accent-secondary)',
                        borderBottom: '1.5px solid rgba(197, 180, 165, 0.4)',
                        paddingBottom: '4px',
                        display: 'inline-block',
                        marginTop: '1.5rem',
                        transition: 'all 0.3s ease'
                      }}>{lang === "Cn" ? "上傳表格 →" : "UPLOAD SHEET →"}</span>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="glass-card" style={{
                    border: '1px dashed rgba(124, 114, 103, 0.3)',
                    padding: '2.5rem 1.5rem',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }} onClick={() => {
                    if (user) {
                      setCurrentStageView("ClientPortal");
                      setClientPortalTab("Intake");
                    } else {
                      setAuthMode("signup");
                      setShowAuthGate(true);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(124, 114, 103, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-muted)', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '1.2rem' }}>No. 03</span>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(124, 114, 103, 0.05)',
                        border: '1px solid rgba(124, 114, 103, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                      }}>
                        <svg style={{ width: '22px', height: '22px', stroke: 'var(--accent-primary)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.2rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                        {lang === "Cn" ? <>文字<em>自由描述</em></> : <>Describe in <em>words</em></>}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', minHeight: '40px' }}>
                        {lang === "Cn"
                          ? "貼上電子郵件往來，直接輸入，或與我們語音交談。"
                          : "Paste an email thread, type it out, or talk us through it."}
                      </p>
                    </div>

                    <div>
                      {/* Interactive Mock Form */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid rgba(124,114,103,0.12)',
                        borderRadius: '4px',
                        padding: '1rem',
                        marginTop: '1.5rem',
                        boxShadow: '0 4px 12px rgba(26,25,24,0.02)',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ height: '6px', width: '45%', background: 'rgba(124,114,103,0.3)', borderRadius: '2px' }}></div>
                          <div style={{ border: '1px solid rgba(124,114,103,0.1)', borderRadius: '3px', padding: '0.4rem', background: '#FAF7F2' }}>
                            <div style={{ height: '5px', width: '90%', background: 'rgba(124,114,103,0.15)', borderRadius: '1px', marginBottom: '4px' }}></div>
                            <div style={{ height: '5px', width: '75%', background: 'rgba(124,114,103,0.15)', borderRadius: '1px', marginBottom: '4px' }}></div>
                            <div style={{ height: '5px', width: '50%', background: 'rgba(124,114,103,0.15)', borderRadius: '1px' }}></div>
                          </div>
                          <div style={{ height: '18px', background: 'var(--accent-primary)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ height: '5px', width: '35%', background: '#ffffff', opacity: 0.8, borderRadius: '1px' }}></div>
                          </div>
                        </div>
                      </div>

                      <span className="card-link" style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        color: 'var(--accent-primary)',
                        borderBottom: '1.5px solid rgba(124, 114, 103, 0.2)',
                        paddingBottom: '4px',
                        display: 'inline-block',
                        marginTop: '1.5rem',
                        transition: 'all 0.3s ease'
                      }}>{lang === "Cn" ? "打開編輯器 →" : "OPEN EDITOR →"}</span>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="glass-card" style={{
                    border: '1px dashed rgba(124, 114, 103, 0.3)',
                    padding: '2.5rem 1.5rem',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }} onClick={() => {
                    if (user) {
                      setCurrentStageView("ClientPortal");
                      setClientPortalTab("Intake");
                    } else {
                      setAuthMode("signup");
                      setShowAuthGate(true);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(124, 114, 103, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-muted)', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '1.2rem' }}>No. 04</span>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(124, 114, 103, 0.05)',
                        border: '1px solid rgba(124, 114, 103, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                      }}>
                        <svg style={{ width: '22px', height: '22px', stroke: 'var(--accent-primary)', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.2rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                        {lang === "Cn" ? <>逐項<em>手動添加</em></> : <>Add <em>item by item</em></>}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', minHeight: '40px' }}>
                        {lang === "Cn"
                          ? "使用直觀的引導表單，一次建立一個產品的需求規格。"
                          : "Build the brief one product at a time using our guided form."}
                      </p>
                    </div>

                    <div>
                      {/* Interactive Mock Form */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid rgba(124,114,103,0.12)',
                        borderRadius: '4px',
                        padding: '1rem',
                        marginTop: '1.5rem',
                        boxShadow: '0 4px 12px rgba(26,25,24,0.02)',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ height: '6px', width: '30%', background: 'rgba(124,114,103,0.3)', borderRadius: '2px' }}></div>
                            <div style={{ height: '10px', width: '10px', borderRadius: '50%', background: 'var(--accent-green)' }}></div>
                          </div>
                          <div style={{ height: '5px', width: '85%', background: 'rgba(124,114,103,0.15)', borderRadius: '2px' }}></div>
                          <div style={{ border: '1px solid rgba(124,114,103,0.1)', borderRadius: '3px', height: '18px', background: '#FAF7F2' }}></div>
                          <div style={{ border: '1px solid rgba(124,114,103,0.1)', borderRadius: '3px', height: '18px', background: '#FAF7F2' }}></div>
                        </div>
                      </div>

                      <span className="card-link" style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        color: 'var(--accent-primary)',
                        borderBottom: '1.5px solid rgba(124, 114, 103, 0.2)',
                        paddingBottom: '4px',
                        display: 'inline-block',
                        marginTop: '1.5rem',
                        transition: 'all 0.3s ease'
                      }}>{lang === "Cn" ? "開始填寫 →" : "START FORM →"}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Integration: Material Studio Configurator */}
              <div style={{ maxWidth: '1200px', margin: '0 auto 4rem auto', padding: '0 2rem' }}>
                <MaterialStudio 
                  lang={lang} 
                  selectedFabric={selectedFabric} 
                  selectedLeg={selectedLeg} 
                  configuratorCrib5Blocked={configuratorCrib5Blocked} 
                  handleFabricSelect={handleFabricSelect} 
                  handleLegSelect={handleLegSelect} 
                />
              </div>

              {/* SECTION 1: 意式高定材质微观画廊 (The Digital Swatches Studio) */}
              <div className="animate-editorial-slide-up" style={{ 
                maxWidth: '1200px', 
                margin: '6rem auto 6rem auto', 
                padding: '0 2rem',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '0.72rem', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '0.6rem' }}>
                  {lang === "Cn" ? "意式高定材質微觀畫廊" : "EXQUISITE MATERIAL ATELIER"}
                </span>
                <h2 style={{
                  fontSize: '2.4rem',
                  fontFamily: 'var(--font-tech)',
                  color: 'var(--text-primary)',
                  fontWeight: '300',
                  marginBottom: '1rem',
                  letterSpacing: '0.02em'
                }}>
                  {lang === "Cn" ? "觸摸微觀細節，感知意式匠心。" : "Touch the details. Feel the craft."}
                </h2>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '300',
                  lineHeight: '1.7',
                  maxWidth: '750px',
                  marginBottom: '3rem'
                }}>
                  {lang === "Cn"
                    ? "高端合約採購本質上是對材質細節與安全性的考量。我們甄選符合最高標準的可持續硬木、拉絲金屬以及 BS 5852 Crib 5 消防阻燃面料，在您的專属雲端展廳中微觀呈現。"
                    : "Contract sourcing is defined by the integrity of materials. Explore our curated library of FSC sustainable hardwoods, sand-polished metals, and Crib 5 certified textiles in high-fidelity digital macro."}
                </p>

                {/* Swatches Grid Split-screen */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(280px, 1fr) 1.5fr',
                  gap: '3rem',
                  alignItems: 'start'
                }}>
                  {/* Left Selector List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      {
                        id: "nubuck",
                        nameCn: "意大利磨砂 Nubuck 皮革",
                        nameEn: "Tuscan Nubuck Leather",
                        color: "#B05B43",
                        subCn: "頂奢皮藝 · 消防合規",
                        subEn: "CRIB 5 FLAMMABILITY SECURED"
                      },
                      {
                        id: "linen",
                        nameCn: "比利時頂級雨露麻",
                        nameEn: "Belgian Dew-Retted Linen",
                        color: "#E5DEC9",
                        subCn: "環保面料 · 粗克重防霉",
                        subEn: "100% ORGANIC CERTIFIED"
                      },
                      {
                        id: "gold",
                        nameCn: "陽極氧化手磨香檳拉絲金",
                        nameEn: "Anodized Champagne Bronze",
                        color: "#C5B4A5",
                        subCn: "陽極氧化 · 無縫手磨拋光",
                        subEn: "FINGERPRINT-RESISTANT SUS304"
                      },
                      {
                        id: "walnut",
                        nameCn: "北美特級實心黑胡桃木",
                        nameEn: "FAS American Black Walnut",
                        color: "#5C4B40",
                        subCn: "FSC可持續硬木 · 真空窑干",
                        subEn: "8% MOISTURE WATER SECURED"
                      }
                    ].map((sw) => {
                      const isActive = activeSwatch === sw.id;
                      return (
                        <div 
                          key={sw.id}
                          onClick={() => setActiveSwatch(sw.id)}
                          style={{
                            padding: '1.2rem 1.5rem',
                            background: isActive ? 'var(--bg-secondary)' : 'transparent',
                            border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.2rem',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            transform: isActive ? 'translateX(10px)' : 'translateX(0)',
                            boxShadow: isActive ? 'var(--glass-shadow)' : 'none'
                          }}
                          className="swatch-item-selector"
                        >
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: sw.color,
                            border: '1px solid rgba(26,25,24,0.1)',
                            flexShrink: 0,
                            display: 'block'
                          }} />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ 
                              fontFamily: 'var(--font-tech)', 
                              fontSize: '1.05rem', 
                              fontWeight: isActive ? '500' : '400',
                              color: 'var(--text-primary)'
                            }}>
                              {lang === "Cn" ? sw.nameCn : sw.nameEn}
                            </div>
                            <div style={{ 
                              fontSize: '0.68rem', 
                              letterSpacing: '1px', 
                              textTransform: 'uppercase', 
                              color: 'var(--accent-muted)',
                              marginTop: '3px',
                              fontFamily: 'var(--font-sans)'
                            }}>
                              {lang === "Cn" ? sw.subCn : sw.subEn}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Detail Showcase Card */}
                  <div className="glass-card" style={{
                    padding: '2.5rem',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--glass-shadow)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.2fr',
                    gap: '2rem',
                    alignItems: 'center',
                    minHeight: '380px'
                  }}>
                    {/* Left: Swatch Image */}
                    <div style={{ position: 'relative', width: '100%', height: '100%', aspectRatio: '1/1', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                      <img 
                        src={
                          activeSwatch === 'nubuck' ? "https://images.unsplash.com/photo-1581428982868-e410dd047a90?q=80&w=600&auto=format&fit=crop"
                          : activeSwatch === 'linen' ? "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=600&auto=format&fit=crop"
                          : activeSwatch === 'gold' ? "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=600&auto=format&fit=crop"
                          : "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop"
                        } 
                        alt="Macro Swatch Material" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(26,25,24,0.75)',
                        backdropFilter: 'blur(6px)',
                        padding: '3px 8px',
                        fontSize: '0.62rem',
                        color: '#ffffff',
                        borderRadius: '2px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-sans)'
                      }}>
                        MACRO RENDERING
                      </div>
                    </div>

                    {/* Right: Technical Spec Text */}
                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: '600', 
                          letterSpacing: '1.5px', 
                          color: 'var(--accent-primary)', 
                          fontFamily: 'var(--font-sans)',
                          textTransform: 'uppercase'
                        }}>
                          {
                            activeSwatch === 'nubuck' ? (lang === "Cn" ? "頂奢合約皮藝飾面" : "ANILINE LEATHER FINISH")
                            : activeSwatch === 'linen' ? (lang === "Cn" ? "生態可持續亞麻紡織" : "ECOLOGICAL COMPATIBLE TEXTILE")
                            : activeSwatch === 'gold' ? (lang === "Cn" ? "工匠手工拉絲五金" : "HAND-SHIELDED METAL ARTISTRY")
                            : (lang === "Cn" ? "FSC認證工藝硬實木" : "FSC CRAFTSMAN HARDWOOD")
                          }
                        </span>
                        <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.5rem', fontWeight: '400', margin: '6px 0 0 0', color: 'var(--text-primary)' }}>
                          {
                            activeSwatch === 'nubuck' ? (lang === "Cn" ? "意大利特級 Nubuck 磨砂皮革" : "Tuscan Nubuck Leather")
                            : activeSwatch === 'linen' ? (lang === "Cn" ? "比利時天然雨露退膠亞麻" : "Belgian Dew-Washed Linen")
                            : activeSwatch === 'gold' ? (lang === "Cn" ? "不留紋拉絲陽極氧化香檳金" : "Anodized Champagne Gold Steel")
                            : (lang === "Cn" ? "北美阿巴拉契亞 FAS 黑胡桃木" : "FAS American Black Walnut Wood")
                          }
                        </h3>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300', margin: 0 }}>
                        {
                          activeSwatch === 'nubuck' ? (lang === "Cn" ? "精選北歐公牛皮，經意大利托斯卡納植鞣工藝精心硝製。表面經過極細砂纸磨砂拋光，保留真皮呼吸氣孔的同時，呈現如同天鵝絨般的極致磨砂微絨觸感。手感綿密，厚實耐磨。" : "Full-grain northern European bull hides, vegetable-tanned in Tuscany. Lightly sanded to create a micro-velvet nubuck texture that retains genuine breathability, forming an elegant organic patina with age.")
                          : activeSwatch === 'linen' ? (lang === "Cn" ? "來自西法蘭德斯大麻產區的天然有機原麻。採用傳統雨露退膠工藝，編織出粗克重天然肌理。防霉防蟎，克重高達 450g/㎡，防縮水且具備極佳的骨架挺拔度。" : "Harvested in Belgium's famous flax valleys. Retains the authentic organic linen slub fibers. Features high tensile strength, resistance to mold, weighing 450g/sqm to guarantee elegant contract tailoring.")
                          : activeSwatch === 'gold' ? (lang === "Cn" ? "選用加厚 SUS304 高精不銹鋼板。表面由十年經驗工匠在拉絲轉盤上物理手工打磨。在無氧車間進行精密陽極着色，多重氟碳防油膜保護，耐酸鹼、不留指紋痕跡，金属光澤在自然光下極具厚重感。" : "Thickened SUS304 stainless base, hand-brushed on polishing turns. Coated in chemical anodized chambrays and topped with Monocoat protection against fingerprints and scratch, presenting a rich architectural sheen.")
                          : (lang === "Cn" ? "嚴選阿巴拉契亞可持續硬木森林 FAS 特等木心。採用長達 65 天的漸進式真空蒸汽窯干處理，含水率在出廠時牢牢鎖定在 8% - 12% 之間，徹底隔絕在極乾氣候（如倫敦冬日暖氣）或潮濕環境下變形、爆裂的風險。" : "FAS Appalachian timber hearts, vacuum kiln-dried for 65 days. The internal moisture is calibrated to exactly 8%-12% to lock structural volume and prevent bowing, cracking, or joint fatigue when deployed in dry climates.")
                        }
                      </p>

                      <div style={{ 
                        borderTop: '1px solid rgba(124, 114, 103, 0.15)', 
                        paddingTop: '0.8rem', 
                        fontSize: '0.72rem', 
                        fontFamily: 'var(--font-sans)', 
                        color: 'var(--accent-primary)',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'block' }} />
                        {
                          activeSwatch === 'nubuck' ? (lang === "Cn" ? "等級：A級全粒面 · 消防安全：英國 BS 5852 Crib 5 阻燃合規" : "GRADE: FAS FULL GRAIN · SAFETY: BRITISH BS 5852 CRIB 5 COMPLIANT")
                          : activeSwatch === 'linen' ? (lang === "Cn" ? "成分：100% 亞麻 · 耐磨：Martindale 35,000次 · 阻燃：支持CRIB 5" : "COMPOS: 100% NATURAL · MARTINDALE: 35,000 rubs · CRIB 5 COMPATIBLE")
                          : activeSwatch === 'gold' ? (lang === "Cn" ? "工藝：手工拋光 ＋ 陽極氧化 · 耐腐蝕：鹽霧測試 480 小時無變色" : "PROCESS: HAND POLISHED + ANODIZED · RESISTANCE: 480H CORROSION BARRIER")
                          : (lang === "Cn" ? "等級：USDA-FAS 特級 · 可持續：FSC 綠色認證 · 飾面：0-VOC 天然木蠟" : "GRADE: FAS SPECIAL · SUSTAINABLE: FSC CERTIFIED · COATING: 0-VOC MONOCOAT")
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* SECTION 2: 手稿 ➔ CAD 智能双子对比滑块 (Digital Twin Blueprint Slider) */}
              <div className="animate-editorial-slide-up" style={{ 
                maxWidth: '1200px', 
                margin: '6rem auto 6rem auto', 
                padding: '0 2rem',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '0.72rem', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '0.6rem' }}>
                  {lang === "Cn" ? "靈感手稿與毫米級精密 CAD 雙子比對" : "DESIGN TWIN: SKETCH TO MILLIMETER CAD"}
                </span>
                <h2 style={{
                  fontSize: '2.4rem',
                  fontFamily: 'var(--font-tech)',
                  color: 'var(--text-primary)',
                  fontWeight: '300',
                  marginBottom: '1rem',
                  letterSpacing: '0.02em'
                }}>
                  {lang === "Cn" ? "從粗糙靈感，到精密工程規格的平滑演變。" : "From raw sketch to millimeter-precision specs."}
                </h2>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '300',
                  lineHeight: '1.7',
                  maxWidth: '750px',
                  marginBottom: '2.5rem'
                }}>
                  {lang === "Cn"
                    ? "拉動或滑動金合對比條。左側為客戶粗略尺寸手稿；拖拽向右，即可實時看清由 OpenClaw 技術算法自動生成的三視標註 CAD 工程圖，精確捕捉每一處公差。"
                    : "Drag or slide the center bronze control. On the left is the client's pencil sketch or email brief. Slide right to witness its translation into a multi-elevation manufacturing blueprint."}
                </p>

                {/* Sliding Curtain Container */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '460px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid var(--glass-border)',
                  boxShadow: 'var(--glass-shadow)',
                  background: '#1A1918',
                  userSelect: 'none'
                }}>
                  {/* Underlay layer: SKETCH (Full width) */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: '#FAF7F2', // Limestone warm paper background
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2rem'
                  }}>
                    {/* Pencil hand-drawn chair drawing using responsive custom SVG */}
                    <div style={{ width: '100%', height: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <svg viewBox="0 0 400 400" style={{ width: '100%', height: '320px', stroke: '#7C7267', fill: 'none', strokeWidth: '1.2', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                        {/* Hand-drawn sketchy paths */}
                        <path d="M 120 280 C 130 285, 140 285, 280 280" strokeDasharray="3 3" /> {/* Floor line */}
                        <path d="M 150 280 L 158 180" /> {/* Back leg left */}
                        <path d="M 250 278 L 242 195" /> {/* Front leg right */}
                        <path d="M 175 280 L 175 190" /> {/* Front leg left */}
                        <path d="M 225 278 L 225 190" /> {/* Back leg right */}
                        
                        {/* Seat box */}
                        <path d="M 145 190 C 145 190, 180 180, 255 190 C 255 190, 240 215, 150 210 Z" />
                        <path d="M 150 210 L 250 210" />

                        {/* Backrest cushion */}
                        <path d="M 148 190 C 142 140, 155 100, 160 85 C 165 78, 205 76, 235 85 C 240 100, 242 140, 242 190 Z" />
                        <path d="M 170 100 C 180 110, 210 110, 220 100" /> {/* stitch lines */}
                        <path d="M 175 130 C 185 140, 205 140, 215 130" />

                        {/* Dimensions and handwritten notes */}
                        <text x="140" y="55" fontFamily="'Cormorant Garamond', serif" fontSize="14" fontStyle="italic" fill="#B05B43">Make Back comfy & thick?</text>
                        <text x="270" y="195" fontFamily="'Cormorant Garamond', serif" fontSize="14" fontStyle="italic" fill="#7C7267">H ~ 45cm</text>
                        <text x="180" y="325" fontFamily="'Cormorant Garamond', serif" fontSize="14" fontStyle="italic" fill="#7C7267">W: 65cm approx.</text>
                        
                        {/* Annotation pointers */}
                        <path d="M 190 312 L 195 295" stroke="#7C7267" strokeWidth="0.8" />
                        <path d="M 285 205 L 255 200" stroke="#7C7267" strokeWidth="0.8" />
                      </svg>
                      
                      {/* Watermark Label */}
                      <div style={{ position: 'absolute', bottom: '25px', left: '25px', color: 'var(--accent-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '600', letterSpacing: '1px' }}>
                        {lang === "Cn" ? "■ 客戶原始幾何手稿" : "■ ORIGINAL CLIENT BRIEF SKETCH"}
                      </div>
                    </div>
                  </div>

                  {/* Sliding overlay layer: HIGH-TECH CAD BLUEPRINT */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: `${100 - blueprintSliderPos}%`,
                    height: '100%',
                    background: '#151413', // Deep CAD background slate
                    overflow: 'hidden',
                    borderLeft: '2px solid var(--accent-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {/* Blueprint grid offset matching layout */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '1000px', // Large fixed width to prevent text from squeezing during slide
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundImage: 'radial-gradient(rgba(176, 91, 67, 0.12) 1px, transparent 1px), linear-gradient(rgba(124, 114, 103, 0.05) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                      padding: '2rem'
                    }}>
                      <div style={{ width: '100%', height: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                        <svg viewBox="0 0 400 400" style={{ width: '100%', height: '320px', stroke: 'var(--accent-primary)', fill: 'none', strokeWidth: '1.2', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                          {/* Precise engineering guidelines and crosshairs */}
                          <line x1="30" y1="200" x2="370" y2="200" stroke="#7C7267" strokeWidth="0.5" strokeDasharray="5 5" />
                          <line x1="200" y1="30" x2="200" y2="370" stroke="#7C7267" strokeWidth="0.5" strokeDasharray="5 5" />
                          
                          {/* Coordinate circles */}
                          <circle cx="200" cy="200" r="140" stroke="rgba(124,114,103,0.15)" strokeWidth="0.8" />
                          
                          {/* Solid legs with thickness */}
                          <line x1="150" y1="280" x2="158" y2="180" stroke="var(--accent-primary)" strokeWidth="2" />
                          <line x1="250" y1="278" x2="242" y2="195" stroke="var(--accent-primary)" strokeWidth="2" />
                          <line x1="175" y1="280" x2="175" y2="190" stroke="var(--accent-primary)" strokeWidth="2" />
                          <line x1="225" y1="278" x2="225" y2="190" stroke="var(--accent-primary)" strokeWidth="2" />
                          
                          {/* Precise engineered seat pan */}
                          <path d="M 145 190 L 255 190 L 245 210 L 155 210 Z" stroke="var(--accent-primary)" strokeWidth="1.5" />
                          
                          {/* Backrest profile with spline anchors */}
                          <path d="M 148 190 Q 140 140, 160 85 Q 200 76, 235 85 Q 245 140, 242 190 Z" stroke="var(--accent-primary)" strokeWidth="1.5" />
                          
                          {/* Vector spline control vertices indicators */}
                          <rect x="158" y="83" width="4" height="4" fill="none" stroke="#FAF7F2" strokeWidth="0.8" />
                          <rect x="233" y="83" width="4" height="4" fill="none" stroke="#FAF7F2" strokeWidth="0.8" />
                          <rect x="146" y="188" width="4" height="4" fill="none" stroke="#FAF7F2" strokeWidth="0.8" />
                          <rect x="240" y="188" width="4" height="4" fill="none" stroke="#FAF7F2" strokeWidth="0.8" />

                          {/* Technical drawing dimension rules and arrows */}
                          {/* Width dimension */}
                          <path d="M 145 310 L 255 310" stroke="#FAF7F2" strokeWidth="0.8" />
                          <path d="M 145 307 L 145 313" stroke="#FAF7F2" strokeWidth="0.8" />
                          <path d="M 255 307 L 255 313" stroke="#FAF7F2" strokeWidth="0.8" />
                          
                          {/* Height dimension */}
                          <path d="M 290 85 L 290 280" stroke="#FAF7F2" strokeWidth="0.8" />
                          <path d="M 287 85 L 293 85" stroke="#FAF7F2" strokeWidth="0.8" />
                          <path d="M 287 280 L 293 280" stroke="#FAF7F2" strokeWidth="0.8" />
                          
                          {/* CAD vector labels */}
                          <text x="168" y="325" fontFamily="var(--font-tech)" fontSize="10" fill="#FAF7F2" letterSpacing="0.5">W: 650.00 mm</text>
                          <text x="300" y="185" fontFamily="var(--font-tech)" fontSize="10" fill="#FAF7F2" letterSpacing="0.5">H: 850.00 mm</text>
                          <text x="180" y="235" fontFamily="var(--font-tech)" fontSize="9" fill="rgba(124,114,103,0.6)" letterSpacing="0.5">GRID INTERVAL: 10mm</text>
                        </svg>

                        {/* Live technical info block */}
                        <div style={{
                          position: 'absolute',
                          top: '25px',
                          right: '25px',
                          border: '1px solid rgba(176,91,67,0.3)',
                          padding: '6px 12px',
                          background: 'rgba(26,25,24,0.85)',
                          borderRadius: '2px',
                          textAlign: 'left'
                        }}>
                          <div style={{ fontFamily: 'var(--font-tech)', fontSize: '0.62rem', color: 'var(--accent-primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>VECTOR ENGINE ACTIVE</div>
                          <div style={{ fontFamily: 'var(--font-tech)', fontSize: '0.68rem', color: '#FAF7F2', marginTop: '2px' }}>TOLERANCE: &lt; 0.15mm</div>
                        </div>

                        {/* Bottom alignment caption */}
                        <div style={{ position: 'absolute', bottom: '25px', right: '25px', color: 'var(--accent-primary)', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '600', letterSpacing: '1px' }}>
                          {lang === "Cn" ? "■ AUTOMATIC CAD BLUEPRINT / 自動化製造圖紙" : "■ AUTOMATIC MANUFACTURABLE CAD BLUEPRINT"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal range input overlay handling drags smoothly */}
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={blueprintSliderPos}
                    onChange={(e) => setBlueprintSliderPos(Number(e.target.value))}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'ew-resize',
                      zIndex: 20
                    }}
                  />

                  {/* Visual slider controller handle */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: `${blueprintSliderPos}%`,
                    width: '2px',
                    height: '100%',
                    background: 'var(--accent-primary)',
                    pointerEvents: 'none',
                    zIndex: 15,
                    boxShadow: '0 0 10px rgba(176, 91, 67, 0.5)'
                  }}>
                    {/* Circular Handle Grab */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--accent-primary)',
                      border: '2px solid #FAF7F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      color: '#FAF7F2',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      letterSpacing: '1px'
                    }}>
                      ⇆
                    </div>
                  </div>
                </div>
              </div>


              {/* SECTION 3: 极简艺术字信誉看板 (Atelier Credibility Ribbon) */}
              <div style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                borderTop: '1px solid rgba(124, 114, 103, 0.12)',
                borderBottom: '1px solid rgba(124, 114, 103, 0.12)',
                padding: '4rem 2rem',
                margin: '6rem 0 6rem 0'
              }}>
                <div style={{
                  maxWidth: '1200px',
                  margin: '0 auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '3rem',
                  textAlign: 'left'
                }}>
                  {/* Metric 1 */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-tech)', fontSize: '3rem', fontWeight: '300', color: 'var(--accent-primary)', lineHeight: '1' }}>
                      3 <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>MILLS</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.1rem', color: 'var(--text-primary)', margin: '10px 0 6px 0', fontWeight: '400' }}>
                      {lang === "Cn" ? "三家嚴選代工廠" : "Vetted Contract Mills"}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, fontWeight: '300' }}>
                      {lang === "Cn" 
                        ? "精選佛山、惠州三大頂級合約加工廠，產線與技術完全打通，提供極致性價比與產能保障。" 
                        : "Fully integrated production arrays across 3 elite Chinese manufacturing plants, ensuring quality and price."}
                    </p>
                  </div>

                  {/* Metric 2 */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-tech)', fontSize: '3rem', fontWeight: '300', color: 'var(--accent-primary)', lineHeight: '1' }}>
                      100% <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>CRIB 5</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.1rem', color: 'var(--text-primary)', margin: '10px 0 6px 0', fontWeight: '400' }}>
                      {lang === "Cn" ? "消防安全自動攔截" : "Fire Compliance Gate"}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, fontWeight: '300' }}>
                      {lang === "Cn" 
                        ? "所有合約家具、皮革與海綿默認符合英國 BS 5852 消防高標準，系統預審檢索，拒絕不合格品。" 
                        : "All fillings and fabrics meet UK BS 5852 fire standards by default. Non-compliant elements are blocked upfront."}
                    </p>
                  </div>

                  {/* Metric 3 */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-tech)', fontSize: '3rem', fontWeight: '300', color: 'var(--accent-primary)', lineHeight: '1' }}>
                      8%-12% <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>H₂O</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.1rem', color: 'var(--text-primary)', margin: '10px 0 6px 0', fontWeight: '400' }}>
                      {lang === "Cn" ? "精控實木含水率" : "Vacuum Wood Kiln-Dry"}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, fontWeight: '300' }}>
                      {lang === "Cn" 
                        ? "實木含水率穩鎖 8%-12%，徹底消除高端家具在倫敦冬季暖氣下翹曲、開裂的宿命隱患。" 
                        : "Wood components are lock-dried to 8%-12% moisture. Eliminating cracking and warping under extreme indoor heat."}
                    </p>
                  </div>

                  {/* Metric 4 */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-tech)', fontSize: '3rem', fontWeight: '300', color: 'var(--accent-primary)', lineHeight: '1' }}>
                      1.5k+ <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>ITEMS</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.1rem', color: 'var(--text-primary)', margin: '10px 0 6px 0', fontWeight: '400' }}>
                      {lang === "Cn" ? "全球合約家具交付" : "B2B Items Delivered"}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, fontWeight: '300' }}>
                      {lang === "Cn" 
                        ? "在倫敦、赫特福德郡、聖奧爾本斯精品工裝項目均有交付案例，深受頂奢室內設計事務所信賴。" 
                        : "Highly trusted by premium interior design ateliers, supplying boutique hotel and high-end residential sites."}
                    </p>
                  </div>
                </div>
              </div>


              {/* SECTION 4: 实时车间追踪微演示 (Interactive Milestone Live Demo) */}
              <div className="animate-editorial-slide-up" style={{ 
                maxWidth: '1200px', 
                margin: '6rem auto 6rem auto', 
                padding: '0 2rem',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '0.72rem', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '0.6rem' }}>
                  {lang === "Cn" ? "實時車間製造節點追蹤演示" : "CLIENT PORTAL PREVIEW: MILL PROGRESS SNEAK"}
                </span>
                <h2 style={{
                  fontSize: '2.4rem',
                  fontFamily: 'var(--font-tech)',
                  color: 'var(--text-primary)',
                  fontWeight: '300',
                  marginBottom: '1rem',
                  letterSpacing: '0.02em'
                }}>
                  {lang === "Cn" ? "足不出戶，車間現場動態一覽無遺。" : "Watch the workshop, from anywhere in the world."}
                </h2>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '300',
                  lineHeight: '1.7',
                  maxWidth: '750px',
                  marginBottom: '3rem'
                }}>
                  {lang === "Cn"
                    ? "我們為您的每個項目創建專屬的數字工作坊門戶。代工廠物料均貼有唯一二維碼，工匠在完成開料、軟包、飾面、包裝時掃碼登記。實拍大貨照即時上傳，Cho 與您共享掌控感。"
                    : "Every contract order is provisioned with a private tracking workshop. Craft mills log milestones by scanning item QR codes. Real-time site photographs and specifications sync to your dashboard."}
                </p>

                {/* Tracker Simulator Container */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(260px, 1fr) 1.5fr',
                  gap: '3rem',
                  alignItems: 'start'
                }}>
                  {/* Left workflow list selectors */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {[
                      { id: "frame", num: "STAGE 01", nameCn: "Frame Woodwork · 木架工序", nameEn: "FSC Wood Framing", leadCn: "已完成 · 22 小時前", leadEn: "Completed · 22h ago" },
                      { id: "upholstery", num: "STAGE 02", nameCn: "Upholstery Sew · 軟包工藝", nameEn: "Stitching & Foam-Flipping", leadCn: "進行中 · 正在覆蓋面料", leadEn: "Active · Stitching classic swatches" },
                      { id: "finishing", num: "STAGE 03", nameCn: "Artisan Finishing · 表面拋光/噴漆", nameEn: "Polishing & Anodizing", leadCn: "預計 · 2 天內啟動", leadEn: "Scheduled · Starts in 2 days" },
                      { id: "packaging", num: "STAGE 04", nameCn: "Protective Packaging · 木托安全打包", nameEn: "Fitted Corner Protection", leadCn: "預計 · 5 天內啟动", leadEn: "Scheduled · Starts in 5 days" }
                    ].map((ms) => {
                      const isActive = demoMilestone === ms.id;
                      return (
                        <div
                          key={ms.id}
                          onClick={() => setDemoMilestone(ms.id)}
                          style={{
                            padding: '1.2rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: isActive ? 'rgba(176, 91, 67, 0.05)' : 'var(--bg-secondary)',
                            border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                            textAlign: 'left',
                            transition: 'all 0.25s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-tech)', fontSize: '0.65rem', letterSpacing: '1px', color: isActive ? 'var(--accent-primary)' : 'var(--accent-muted)' }}>
                              {ms.num}
                            </span>
                            <span style={{ 
                              fontSize: '0.65rem', 
                              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              fontWeight: isActive ? '600' : '400',
                              fontFamily: 'var(--font-sans)'
                            }}>
                              {lang === "Cn" ? ms.leadCn : ms.leadEn}
                            </span>
                          </div>
                          <div style={{ 
                            fontFamily: 'var(--font-tech)', 
                            fontSize: '1.1rem', 
                            color: 'var(--text-primary)', 
                            marginTop: '6px',
                            fontWeight: isActive ? '500' : '400'
                          }}>
                            {lang === "Cn" ? ms.nameCn : ms.nameEn}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right live feed simulator glass card */}
                  <div className="glass-card" style={{
                    padding: '2rem',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--glass-shadow)',
                    textAlign: 'left',
                    minHeight: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    {/* Header line status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(124, 114, 103, 0.12)', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#5B9F4E', // Breathing green light
                          display: 'block',
                          boxShadow: '0 0 8px #5B9F4E',
                          animation: 'pulse 1.5s infinite'
                        }} />
                        <span style={{ fontFamily: 'var(--font-tech)', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '1.5px' }}>
                          LIVE FEED FROM MILLS
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-tech)', fontSize: '0.7rem', color: 'var(--accent-muted)' }}>
                        SYNC: 12S AGO | MILL-ID: #3_FOSHAN
                      </span>
                    </div>

                    {/* Middle grid image + spec audit */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr',
                      gap: '2rem',
                      alignItems: 'center',
                      flex: 1
                    }}>
                      {/* Left side workshop image */}
                      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '220px', aspectRatio: '1.4/1', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <img 
                          src={
                            demoMilestone === 'frame' ? "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop"
                            : demoMilestone === 'upholstery' ? "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop"
                            : demoMilestone === 'finishing' ? "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=600&auto=format&fit=crop"
                            : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop"
                          } 
                          alt="Live mill process tracking view" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '10px',
                          background: 'rgba(26,25,24,0.8)',
                          padding: '3px 8px',
                          fontSize: '0.6rem',
                          color: '#FAF7F2',
                          borderRadius: '2px',
                          fontFamily: 'var(--font-tech)'
                        }}>
                          QC PHOTO SIGNED BY MASTER CHO
                        </div>
                      </div>

                      {/* Right side spec logs */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div>
                          <div style={{ fontSize: '0.62rem', letterSpacing: '1px', color: 'var(--accent-primary)', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>
                            {lang === "Cn" ? "工藝核對與質檢報告" : "PROCESS AUDIT SPEC"}
                          </div>
                          <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.15rem', color: 'var(--text-primary)', margin: '4px 0 0 0', fontWeight: '400' }}>
                            {
                              demoMilestone === 'frame' ? (lang === "Cn" ? "白橡木榫卯框架精密度校準" : "Appalachian Oak Framing")
                              : demoMilestone === 'upholstery' ? (lang === "Cn" ? "阻燃回彈高密度海綿覆布" : "High-Density Foam Wrap")
                              : demoMilestone === 'finishing' ? (lang === "Cn" ? "啞光防刮氟碳漆噴塗" : "Matte Fluorocarbon Spray")
                              : (lang === "Cn" ? "特厚實木托盤與防護泡沫封裝" : "Solid Wooden Pallet Wrapping")
                            }
                          </h4>
                        </div>

                        {/* Audit log text list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontWeight: '300' }}>
                          {
                            demoMilestone === 'frame' ? (
                              <>
                                <div>- {lang === "Cn" ? "FSC認證可持續木心檢查：通過" : "FSC certified core check: Passed"}</div>
                                <div>- {lang === "Cn" ? "物理含水率傳感儀測試：9.2%" : "Digital moisture sensor test: 9.2%"}</div>
                                <div>- {lang === "Cn" ? "榫卯咬合公差度校準：< 0.1mm" : "Mortise fit tolerance test: < 0.1mm"}</div>
                              </>
                            ) : demoMilestone === 'upholstery' ? (
                              <>
                                <div>- {lang === "Cn" ? "英國 Crib 5 阻燃底襯檢查：通過" : "British BS 5852 Crib 5 barrier: Passed"}</div>
                                <div>- {lang === "Cn" ? "面料拼接對位度 CV 驗證：100% 重合" : "Textile contour alignment CV: 100% Match"}</div>
                                <div>- {lang === "Cn" ? "高回彈多層冷發泡海綿：35kg/m³ 達標" : "High resilience cold-cure foam: 35kg/m³ Ok"}</div>
                              </>
                            ) : demoMilestone === 'finishing' ? (
                              <>
                                <div>- {lang === "Cn" ? "香檳暗金拉絲紋理比對：合格" : "Brushed champagne grain contrast: Passed"}</div>
                                <div>- {lang === "Cn" ? "零 VOC 天然漆硬度測試：2H 通過" : "Zero-VOC monocoat hardness test: 2H Passed"}</div>
                                <div>- {lang === "Cn" ? "高溫恆濕烘烤固化時間：48小時" : "Oven humidity baking period: 48 hours"}</div>
                              </>
                            ) : (
                              <>
                                <div>- {lang === "Cn" ? "雙重防撞實木護角加固：裝配" : "Double-thick custom solid wood corner pads: Done"}</div>
                                <div>- {lang === "Cn" ? "3D 排櫃算法最大容積圖：生成" : "3D cargo stacking plan bitmap: Auto-gen"}</div>
                                <div>- {lang === "Cn" ? "倫敦項目在途標籤綁定：OK" : "London site transit tag matched: Ready"}</div>
                              </>
                            )
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Append renderHowItWorksBlock() to the bottom of the overview tab content */}
              <div style={{ maxWidth: '1200px', margin: '4rem auto 0 auto', padding: '0 2rem' }} id="how-it-works">
                {renderHowItWorksBlock()}
              </div>
            </>
          )}

          {marketingTab === "CaseStudies" && (
            <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
              {/* Full-bleed Header Banner */}
              <div style={{
                position: 'relative',
                height: '350px',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '3rem',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 15px 30px rgba(0,0,0,0.08)'
              }}>
                <img 
                  src={IMAGES.masterShowwall} 
                  alt="THE CRAFTON Luxury Showwall" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(to right, rgba(26,25,24,0.95) 0%, rgba(26,25,24,0.3) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '3rem'
                }}>
                  <span style={{ 
                    fontFamily: 'var(--font-tech)', 
                    fontSize: '0.85rem', 
                    letterSpacing: '3px', 
                    textTransform: 'uppercase', 
                    color: 'var(--accent-primary)',
                    marginBottom: '0.8rem',
                    display: 'block'
                  }}>
                    {lang === "Cn" ? "全球高奢經典案卷" : "GLOBAL BESPOKE CASE ARCHIVES"}
                  </span>
                  <h2 style={{ fontSize: '2.2rem', color: '#FAF7F2', marginBottom: '1rem', fontWeight: '300', textAlign: 'left' }}>
                    {lang === "Cn" ? "將極致設計轉譯為不凡實景" : "Translating Extraordinary Visions into Living Realities"}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '600px', fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'left' }}>
                    {lang === "Cn" 
                      ? "從倫敦梅費爾的對沖基金頂層沙發，到日內瓦落地窗前的極簡休閒椅。每一個經典項目均通過 THE CRAFTON 的全鏈路智能追溯，在物理阻燃、幾何精度與材料美學上達到極致融合。" 
                      : "From Geneva's full-bleed glass facades to Mayfair's executive lounges. Every signature case study is fully tracked and optimized by THE CRAFTON's workflows, guaranteeing structural safety and timeless styling."}
                  </p>
                </div>
              </div>

              {/* Case Studies Grid - Asymmetrical Editorial Layout */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '2.5rem',
                marginBottom: '4rem'
              }}>
                {[
                  {
                    id: "CASE-01",
                    titleCn: "Westlake Penthouse",
                    titleEn: "Westlake Penthouse",
                    locationCn: "瑞士 日內瓦",
                    locationEn: "Geneva, Switzerland",
                    descCn: "為日內瓦湖畔私人豪宅定製奢華休閒椅。高定純亞麻面料配合深木色椅腿，完美融合意式極簡與寂靜之美。",
                    descEn: "Bespoke lounge seating for a lakeside penthouse. Premium organic linen and dark oak finishes combining Italian minimalism with wabi-sabi stillness.",
                    img: IMAGES.caseGeneva,
                    tagCn: "私人住宅",
                    tagEn: "Private Residence",
                    initials: "WP",
                    specsCn: "規格: Crib 5 合規 / 面料: 450 TC 頂級亞麻 / 產地: 廣東佛山工坊",
                    specsEn: "Specs: Crib 5 Compliant / Fabric: 450 TC Premium Linen / Origin: Foshan Atelier"
                  },
                  {
                    id: "CASE-02",
                    titleCn: "Portal Hedge Fund",
                    titleEn: "Portal Hedge Fund",
                    locationCn: "英國 倫敦梅費爾",
                    locationEn: "Mayfair, London",
                    descCn: "對沖基金高定行政套房。40把高定皮質大堂椅及沙發區，兼顧高端辦公的商務質感與Crib 5阻燃標準的極致合規。",
                    descEn: "Executive office lounges for a premier hedge fund. 40 leather lobby armchairs and custom sofas achieving perfect UK Crib 5 compliance.",
                    img: IMAGES.caseMayfair,
                    tagCn: "商務辦公",
                    tagEn: "Commercial Office",
                    initials: "PH",
                    specsCn: "規格: Crib 5 合規 / 面料: 全粒面高定真皮 / 產地: 廣東東莞精工廠",
                    specsEn: "Specs: Crib 5 Compliant / Fabric: Full-Grain Leather / Origin: Dongguan Mill"
                  },
                  {
                    id: "CASE-03",
                    titleCn: "Bermondsey Lofts",
                    titleEn: "Bermondsey Lofts",
                    locationCn: "英國 倫敦",
                    locationEn: "Bermondsey, London",
                    descCn: "工業風Loft公寓。將裸磚牆面與胡桃木餐椅無縫契合，營造出具有豐富觸感和悠久歲月質感的空間體驗。",
                    descEn: "Industrial loft apartments. Seamlessly pairing exposed red brick with tactile walnut wood dining chairs, creating a textured historic patina.",
                    img: IMAGES.caseBermondsey,
                    tagCn: "高尚公寓",
                    tagEn: "High-end Apartments",
                    initials: "BL",
                    specsCn: "規格: Crib 5 合規 / 面料: 500 TC 絲光精梳棉 / 產地: 廣東佛山工坊",
                    specsEn: "Specs: Crib 5 Compliant / Fabric: 500 TC Mercerized Cotton / Origin: Foshan Atelier"
                  },
                  {
                    id: "CASE-04",
                    titleCn: "The Stow Boutique Hotel",
                    titleEn: "The Stow Boutique Hotel",
                    locationCn: "英國 巴斯",
                    locationEn: "Bath, UK",
                    descCn: "古典精品酒店客房。為20間精品客房量身定製休閒椅與床榻套裝，暖沙色天然洞石材質與意式低調奢華相得益彰。",
                    descEn: "Historic boutique hotel suites. Tailor-making relaxing chairs and solid oak frames for 20 luxury rooms, emphasizing warm travertine stones.",
                    img: IMAGES.caseBathHotel,
                    tagCn: "奢華酒店",
                    tagEn: "Luxury Hospitality",
                    initials: "TS",
                    specsCn: "規格: Crib 5 合規 / 面料: 皇家高密阻燃絲絨 / 產地: 廣東順德製造基地",
                    specsEn: "Specs: Crib 5 Compliant / Fabric: Royal Fire-Retardant Velvet / Origin: Shunde Mill"
                  },
                  {
                    id: "CASE-05",
                    titleCn: "Camden Creative Studios",
                    titleEn: "Camden Creative Studios",
                    locationCn: "英國 倫敦卡姆登",
                    locationEn: "Camden, London",
                    descCn: "極簡創意共享空間。定制彩色現代休閒單椅，為前衛創意人提供高靈敏度的微型微交互物理辦公藝術品。",
                    descEn: "Avant-garde creative co-working spaces. Custom colorful geometric lounge chairs acting as mini physical sculptures for designer pods.",
                    img: IMAGES.caseCamden,
                    tagCn: "創意空間",
                    tagEn: "Creative Hub",
                    initials: "CC",
                    specsCn: "規格: Crib 5 合規 / 面料: Waves of Silk 浪漫蠶絲 / 產地: 廣東佛山設計工坊",
                    specsEn: "Specs: Crib 5 Compliant / Fabric: Waves of Silk Premium / Origin: Foshan Atelier"
                  }
                ].map((c, idx) => (
                  <div 
                    key={c.id} 
                    className="case-study-card glass-card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      gridColumn: (idx === 0 || idx === 3) ? 'span 2' : 'span 1'
                    }}
                  >
                    <div style={{ height: (idx === 0 || idx === 3) ? '320px' : '220px', overflow: 'hidden', position: 'relative' }}>
                      <img 
                        src={c.img} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover'
                        }} 
                        alt={c.titleEn} 
                      />
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(26,25,24,0.6) 100%)',
                        zIndex: 1
                      }}></div>
                      <span style={{ 
                        position: 'absolute', 
                        left: '1.2rem', 
                        bottom: '1rem', 
                        zIndex: 2, 
                        fontFamily: 'var(--font-tech)', 
                        color: '#FAF7F2', 
                        fontSize: '1.4rem', 
                        fontWeight: '300',
                        letterSpacing: '1px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.4)'
                      }}>{c.initials}</span>
                      <span style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(26, 25, 24, 0.75)',
                        color: 'var(--accent-primary)',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.7rem',
                        borderRadius: '3px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 2,
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-tech)'
                      }}>{lang === "Cn" ? c.tagCn : c.tagEn}</span>
                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '500', fontFamily: "var(--font-tech)" }}>
                            {lang === "Cn" ? c.titleCn : c.titleEn}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>
                            {lang === "Cn" ? c.locationCn : c.locationEn}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', textAlign: 'left' }}>
                          {lang === "Cn" ? c.descCn : c.descEn}
                        </p>
                      </div>
                      <div style={{
                        marginTop: '1.2rem',
                        paddingTop: '0.8rem',
                        borderTop: '1px dashed var(--glass-border)',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-sans)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>
                        {lang === "Cn" ? c.specsCn : c.specsEn}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {marketingTab === "HowItWorks" && (
            <div className="animate-editorial-slide-up" style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '0.8rem' }}>
                  {lang === "Cn" ? "合作流程" : "OUR WORKFLOW"}
                </span>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontFamily: 'var(--font-tech)',
                  color: 'var(--text-primary)',
                  fontWeight: '300',
                  letterSpacing: '0.02em',
                  marginBottom: '1rem'
                }}>
                  {lang === "Cn" ? "四大交付階段 ── 合作流程。" : "Four phases of seamless delivery."}
                </h2>
                <div style={{ width: '40px', height: '1.5px', background: 'var(--accent-primary)', margin: '1.5rem auto 0 auto' }}></div>
              </div>

              {/* 4 columns layout connected by line */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '2.2rem',
                position: 'relative'
              }}>
                {/* Phase I */}
                <div className="glass-card" style={{
                  padding: '2.5rem 2rem',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '340px'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--accent-muted)' }}>PHASE I</span>
                      <svg style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12h4.5m-1.5-1.5h1.5m-7.5-3h7.5M6 21.75h12a3 3 0 003-3V12a3 3 0 00-3-3H6a3 3 0 00-3 3v6.75a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {lang === "Cn" ? "項目對接與報價" : "Brief & Quote"}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontWeight: '300' }}>
                      {lang === "Cn"
                        ? "上傳 PDF 招標文件、粘貼 Excel 或是描述您的需求。我們將規格發送至三家受審代工廠進行比價，並並列展示供您挑選。"
                        : "Upload a PDF, paste an Excel, or describe what you need. We send to three vetted factories and lay the prices side by side. You pick."}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(124, 114, 103, 0.15)', paddingTop: '1rem', marginTop: '1.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', color: 'var(--accent-muted)' }}>
                    {lang === "Cn" ? "第 1-2 週" : "WEEKS 1-2"}
                  </div>
                </div>

                {/* Phase II */}
                <div className="glass-card" style={{
                  padding: '2.5rem 2rem',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '340px'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--accent-muted)' }}>PHASE II</span>
                      <svg style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {lang === "Cn" ? "規格定案與樣品" : "Spec & Samples"}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontWeight: '300' }}>
                      {lang === "Cn"
                        ? "系統自動生成幾何三視圖、立面與材料方案。實物樣品將快遞寄送至您的府上，一鍵審批即可正式投產。"
                        : "Drawings auto-generated from your brief — plan, elevation, section, materials. Physical samples shipped to your door. You approve in a tap."}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(124, 114, 103, 0.15)', paddingTop: '1rem', marginTop: '1.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', color: 'var(--accent-muted)' }}>
                    {lang === "Cn" ? "第 3-5 週" : "WEEKS 3-5"}
                  </div>
                </div>

                {/* Phase III (Burnt Terracotta Highlight) */}
                <div className="glass-card" style={{
                  padding: '2.5rem 2rem',
                  borderRadius: '6px',
                  background: '#B05B43', // Burnt Terracotta
                  border: '1px solid #B05B43',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '340px',
                  color: '#FAF7F2',
                  boxShadow: '0 15px 35px rgba(176, 91, 67, 0.25)',
                  transform: 'scale(1.03)',
                  zIndex: '5'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: '#EBE5DF' }}>PHASE III</span>
                      <svg style={{ width: '18px', height: '18px', color: '#FAF7F2' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: '#FAF7F2', marginBottom: '1rem' }}>
                      {lang === "Cn" ? "車間生產與追蹤" : "Production & Tracking"}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: '#FAF7F2', opacity: '0.9', lineHeight: '1.7', fontWeight: '300' }}>
                      {lang === "Cn"
                        ? "生產節點實時更新，並配備高清車間質檢相片。覆蓋木架、軟包、油漆與包裝。工廠生產，您線上實時監看。"
                        : "Live milestone updates with photos at every stage. Frame · upholstery · finishing · packaging. The factory works. You watch."}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(250, 247, 242, 0.3)', paddingTop: '1rem', marginTop: '1.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', color: '#FAF7F2' }}>
                    {lang === "Cn" ? "第 6-14 週" : "WEEKS 6-14"}
                  </div>
                </div>

                {/* Phase IV */}
                <div className="glass-card" style={{
                  padding: '2.5rem 2rem',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '340px'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--accent-muted)' }}>PHASE IV</span>
                      <svg style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.959 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {lang === "Cn" ? "消防合規與交付" : "Compliance & Delivery"}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontWeight: '300' }}>
                      {lang === "Cn"
                        ? "出廠前須通過四重合規質檢關卡。單證與清關手續全託管。安全、百分百準時送達您的指定項目現場。"
                        : "Four compliance gates passed before anything ships. Documents cross-checked. Customs handled. Delivered to your site, on time."}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(124, 114, 103, 0.15)', paddingTop: '1rem', marginTop: '1.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', color: 'var(--accent-muted)' }}>
                    {lang === "Cn" ? "第 15-22 週" : "WEEKS 15-22"}
                  </div>
                </div>

              </div>
            </div>
          )}

          {marketingTab === "BespokeFurniture" && (
            <ErrorBoundary lang={lang}>
              <div className="animate-editorial-slide-up" style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
                
                {/* Block 1: Your order, automated. Backed by quiet, tireless AI. */}
                <div style={{ marginBottom: '5rem' }}>
                  <ClientPortalTeaser 
                    lang={lang} 
                    selectedFabric={selectedFabric} 
                    selectedLeg={selectedLeg} 
                    setActiveIntakeModal={setActiveIntakeModal} 
                  />
                </div>

              {/* Block 2: AI Computer Vision QA Diagnostics */}
              <div style={{ borderTop: '1px solid rgba(124, 114, 103, 0.15)', paddingTop: '5rem', marginBottom: '5rem' }}>
                <CVQASimulator 
                  lang={lang} 
                  selectedFabric={selectedFabric} 
                  selectedLeg={selectedLeg} 
                />
              </div>

              {/* Block 3: Bespoke contract furniture engineered to endure. */}
              <div style={{ borderTop: '1px solid rgba(124, 114, 103, 0.15)', paddingTop: '5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '0.8rem' }}>
                    {lang === "Cn" ? "高端定製" : "BESPOKE MANUFACTURING"}
                  </span>
                  <h2 style={{
                    fontSize: '2.5rem',
                    fontFamily: 'var(--font-tech)',
                    color: 'var(--text-primary)',
                    fontWeight: '300',
                    letterSpacing: '0.02em',
                    marginBottom: '1rem'
                  }}>
                    {lang === "Cn" ? "精雕細琢 ── 專屬合約定制系列。" : "Bespoke contract furniture engineered to endure."}
                  </h2>
                  <div style={{ width: '40px', height: '1.5px', background: 'var(--accent-primary)', margin: '1.5rem auto 0 auto' }}></div>
                </div>

                {/* Craftsmanship Narratives Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '2.5rem',
                  marginBottom: '1rem'
                }}>
                  {/* Story 1 */}
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.25rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                      {lang === "Cn" ? "🌳 甄選可持續實木硬木" : "🌳 Premium Hardwood Selection"}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontWeight: '300' }}>
                      {lang === "Cn"
                        ? "所有框架均採用經 FSC 認證的美國黑胡桃木、白橡木與歐洲山毛櫸。木材含水率嚴格烘乾至 8% - 12%，確保在高濕或極乾氣候下均不起翹不開裂。"
                        : "We source FSC-certified American walnut, white oak, and European beech wood. Kiln-dried to 8%-12% moisture content to prevent wrapping, cracking or joint separation."}
                    </p>
                  </div>
                  {/* Story 2 */}
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.25rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                      {lang === "Cn" ? "✨ 意式砂光金屬與表面處理" : "✨ Artisan Sand-Polished Metal Finishes"}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontWeight: '300' }}>
                      {lang === "Cn"
                        ? "配備香檳金拉絲、黑鈦拉丝與高精砂光不銹鋼。所有焊接均由十年以上匠人手工打磨、拋光，保證在自然光下展現無接縫、無瑕疵的完美過渡。"
                        : "Brushed champagne bronze, matte gunmetal, and micro-sanded stainless steel. Every joint is hand-shielded and polished by seasoned artisans to eliminate visible seams."}
                    </p>
                  </div>
                  {/* Story 3 */}
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.25rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                      {lang === "Cn" ? "🔥 英國 BS 5852 Crib 5 消防標準" : "🔥 Strict UK BS 5852 Crib 5 Compliance"}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontWeight: '300' }}>
                      {lang === "Cn"
                        ? "專為高奢酒店、會所和公共場所設計。所有海綿和麵料均默認提供 BS 5852 阻燃測試證書，出廠前進行明火噴槍考驗，確保萬無一失。"
                        : "Engineered specifically for boutique hospitality and public spaces. All foam cores, interliners, and fabrics come fully certified to British BS 5852 fire safety requirements."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ErrorBoundary>
          )}

          {marketingTab === "SetFurniture" && (
            <div className="animate-editorial-slide-up" style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#7C7267', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '0.8rem' }}>
                  {lang === "Cn" ? "標準套配" : "CURATED SET COLLECTIONS"}
                </span>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontFamily: 'var(--font-tech)',
                  color: 'var(--text-primary)',
                  fontWeight: '300',
                  letterSpacing: '0.02em',
                  marginBottom: '1rem'
                }}>
                  {lang === "Cn" ? "標準套配系列 ── B2B 整合採購方案。" : "Curated contract furniture packages."}
                </h2>
                <div style={{ width: '40px', height: '1.5px', background: 'var(--accent-primary)', margin: '1.5rem auto 0 auto' }}></div>
              </div>

              {/* Curated sets grid */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5rem'
              }}>
                {/* Suite 1: Milano Elegance */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '3.5rem',
                  alignItems: 'center'
                }} className="hidden-mobile-grid">
                  <div className="glass-card" style={{ borderRadius: '6px', overflow: 'hidden', aspectRatio: '4/3' }}>
                    <img src={IMAGES.setMilano} alt="Milano Elegance Lobby Package" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.68rem', color: '#B05B43', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      {lang === "Cn" ? "大堂奢華系列" : "LOBBY & LOUNGE"}
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '2rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {lang === "Cn" ? "「米蘭雅緻」大堂配套 (Milano Elegance)" : "Milano Elegance Lobby Package"}
                    </h3>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.8', fontWeight: '300', marginBottom: '1.8rem' }}>
                      {lang === "Cn"
                        ? "專為高端精品酒店及豪宅大堂設計。低矮流線的休閒沙發、天然洞石茶几與實木胡桃木邊櫃完美交融，營造優雅、內斂的意大利極簡尊貴質感。"
                        : "Low-profile lounge suites in travertine and sand-washed linen. Curated for luxury hotel receptions and elite apartment lobbies, blending rich walnut credenzas and custom sculptural brass armchairs."}
                    </p>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: '4px', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        <strong>{lang === "Cn" ? "套配清單：" : "Package Includes:"}</strong><br />
                        {lang === "Cn"
                          ? "2x 大堂定制休閒沙發, 4x 洞石不規則邊几, 1x 實木胡桃木定制邊櫃, 2x 藝術雕塑單椅。"
                          : "2x Lounge Sofas, 4x Travertine Side Tables, 1x Solid Walnut Credenza, 2x Sculptural Accent Chairs."}
                      </div>
                      <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', borderTop: '1px solid rgba(124,114,103,0.1)', paddingTop: '0.8rem' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{lang === "Cn" ? "估算體積" : "EST. VOLUME"}</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>14.5 m³</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{lang === "Cn" ? "定制工期" : "PRODUCTION LEAD"}</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>8 {lang === "Cn" ? "週" : "Weeks"}</strong>
                        </div>
                      </div>
                    </div>
                    <button className="btn-premium" style={{ padding: '0.6rem 1.6rem' }} onClick={() => {
                      setModalProjectName("Milano Elegance Lobby Curated Package");
                      setModalDestination("London, UK");
                      setModalQuantity("15 sets");
                      setActiveIntakeModal("item");
                    }}>
                      {lang === "Cn" ? "索取本套配最優報價 →" : "Request Curated Quote →"}
                    </button>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(124, 114, 103, 0.15)' }} />

                {/* Suite 2: Toscana Warmth */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '3.5rem',
                  alignItems: 'center'
                }} className="hidden-mobile-grid">
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.68rem', color: '#B05B43', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      {lang === "Cn" ? "精品客房系列" : "SUITE & BEDROOM"}
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '2rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {lang === "Cn" ? "「托斯卡納溫馨」客房配套 (Toscana Warmth)" : "Toscana Warmth Bedroom Suite"}
                    </h3>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.8', fontWeight: '300', marginBottom: '1.8rem' }}>
                      {lang === "Cn"
                        ? "溫暖的實木胡桃木床架、手工縫製的真皮床頭背板與暗青銅金屬配件完美匹配。為酒店住客提供沉浸式的托斯卡納莊園暖意與極致安寧體驗。"
                        : "Warm walnut bedframes, hand-stitched leather panels, and bronze fixtures. Curated to wrap guests in Tuscan serenity, creating an inviting, residential-grade feel with contract-grade durability."}
                    </p>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: '4px', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        <strong>{lang === "Cn" ? "套配清單：" : "Package Includes:"}</strong><br />
                        {lang === "Cn"
                          ? "1x 奢華大床架 (真皮靠背), 2x 特製床頭櫃, 1x 全實木書桌椅, 1x 精奢客房單人沙發, 1x 一體化衣櫃。"
                          : "1x King Bedframe, 2x Integrated Nightstands, 1x Writing Desk, 1x Lounge Armchair, 1x Wardrobe."}
                      </div>
                      <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', borderTop: '1px solid rgba(124,114,103,0.1)', paddingTop: '0.8rem' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{lang === "Cn" ? "估算體積" : "EST. VOLUME"}</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>11.2 m³</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{lang === "Cn" ? "定制工期" : "PRODUCTION LEAD"}</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>10 {lang === "Cn" ? "週" : "Weeks"}</strong>
                        </div>
                      </div>
                    </div>
                    <button className="btn-premium" style={{ padding: '0.6rem 1.6rem' }} onClick={() => {
                      setModalProjectName("Toscana Curated Guestrooms Suite");
                      setModalDestination("Florence, Italy");
                      setModalQuantity("40 sets");
                      setActiveIntakeModal("item");
                    }}>
                      {lang === "Cn" ? "索取本套配最優報價 →" : "Request Curated Quote →"}
                    </button>
                  </div>
                  <div className="glass-card" style={{ borderRadius: '6px', overflow: 'hidden', aspectRatio: '4/3' }}>
                    <img src={IMAGES.setToscana} alt="Toscana Curated Bed Suite" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(124, 114, 103, 0.15)' }} />

                {/* Suite 3: Venezia Contemporary */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '3.5rem',
                  alignItems: 'center'
                }} className="hidden-mobile-grid">
                  <div className="glass-card" style={{ borderRadius: '6px', overflow: 'hidden', aspectRatio: '4/3' }}>
                    <img src={IMAGES.setVenezia} alt="Venezia Dining Set" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.68rem', color: '#B05B43', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      {lang === "Cn" ? "精緻餐廚系列" : "FINE DINING RESTAURANT"}
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '2rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {lang === "Cn" ? "「威尼斯現代」餐廚系列 (Venezia Contemporary)" : "Venezia Contemporary Dining Set"}
                    </h3>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.8', fontWeight: '300', marginBottom: '1.8rem' }}>
                      {lang === "Cn"
                        ? "雕塑般的白橡木長餐几、圓潤低背皮質餐椅與奢華大理石餐邊櫃交錯，展現極具張力的幾何美感與威尼斯運河畔的現代風韻。"
                        : "Sculptural oak dining tables and low-back dining chairs. Crafted for high-end boutique restaurants and VIP dining rooms, with brushed travertine sidings and premium contract grain leather."}
                    </p>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: '4px', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        <strong>{lang === "Cn" ? "套配清單：" : "Package Includes:"}</strong><br />
                        {lang === "Cn"
                          ? "1x 雕塑白橡木長餐几 (10人座), 10x 精製低背牛皮餐椅, 1x 奢華大理石定制餐邊櫃。"
                          : "1x 10-Seater Oak Table, 10x Tailored Leather Dining Chairs, 1x Marble Sideboard."}
                      </div>
                      <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', borderTop: '1px solid rgba(124,114,103,0.1)', paddingTop: '0.8rem' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{lang === "Cn" ? "估算體積" : "EST. VOLUME"}</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>8.8 m³</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{lang === "Cn" ? "定制工期" : "PRODUCTION LEAD"}</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>7 {lang === "Cn" ? "週" : "Weeks"}</strong>
                        </div>
                      </div>
                    </div>
                    <button className="btn-premium" style={{ padding: '0.6rem 1.6rem' }} onClick={() => {
                      setModalProjectName("Venezia Restaurant Sourcing Package");
                      setModalDestination("Venice, Italy");
                      setModalQuantity("10 sets");
                      setActiveIntakeModal("item");
                    }}>
                      {lang === "Cn" ? "索取本套配最優報價 →" : "Request Curated Quote →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {marketingTab === "Contact" && (
            <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
              {renderContactBlock()}
            </div>
          )}

          {renderFooter()}
        </div>
      )}

      {/* VIEW 2: Client Portal (Member Center) */}
      {currentView === "ClientPortal" && (
        <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
          {!user ? (
            /* Premium Hard Gated Information Screen if not logged in */
            <div className="glass-card" style={{
              maxWidth: '800px',
              margin: '4rem auto',
              padding: '4rem 3rem',
              textAlign: 'center',
              background: '#FAF9F6',
              border: '1px solid rgba(124, 114, 103, 0.15)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(28, 27, 24, 0.05)'
            }}>
              <span className="logo-badge" style={{ marginBottom: '1.5rem', background: 'rgba(124, 114, 103, 0.08)', color: 'var(--accent-primary)' }}>
                {lang === "Cn" ? "商業機密安全防護門檻" : "COMMERCIAL INTELLECTUAL PROPERTY SECURITY"}
              </span>
              <h2 style={{
                fontFamily: "'Outfit', 'Inter', sans-serif",
                fontWeight: '600',
                fontSize: '2.5rem',
                letterSpacing: '-0.02em',
                color: '#1C1B18',
                marginBottom: '1.5rem',
                lineHeight: '1.2'
              }}>
                {lang === "Cn" ? "高端合約製造圖紙與規格保護" : "Secure Gate: Drawings & Specifications"}
              </h2>
              <p style={{
                fontFamily: "'Georgia', serif",
                fontSize: '1.15rem',
                fontStyle: 'italic',
                color: '#7C7267',
                lineHeight: '1.8',
                maxWidth: '600px',
                margin: '0 auto 2.5rem auto'
              }}>
                {lang === "Cn" 
                  ? "「為確保定製合約家具圖紙、BOM 材料清單及工廠競標數據等商業機密，我們對該客戶專區實施 RLS 加密。請登入或註冊您的 B2B 設計師帳戶以查看或導入新項目。」"
                  : "“To protect proprietary contract drawings, manufacturing BOM specifications, and competitive factory bids, this dashboard is guarded by secure RLS. Please sign in or register to access the premium project tracker or submit new briefs.”"}
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                <button className="btn-premium" style={{ padding: '0.8rem 2.5rem', fontSize: '1rem' }} onClick={() => { setAuthMode("login"); setShowAuthGate(true); }}>
                  {lang === "Cn" ? "登入帳戶" : "Sign In"}
                </button>
                <button className="btn-secondary" style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', borderColor: 'rgba(124, 114, 103, 0.3)' }} onClick={() => { setAuthMode("signup"); setShowAuthGate(true); }}>
                  {lang === "Cn" ? "註冊新帳戶" : "Create Account"}
                </button>
              </div>
            </div>
          ) : (
            /* Authenticated Client View with Dual Tab */
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-tech)", color: "var(--accent-cyan)", marginBottom: '0.3rem' }}>
                    {lang === "Cn" ? "THE CRAFTON - 客戶專屬控制台" : "THE CRAFTON - CLIENT CONSOLE"}
                  </h2>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <span 
                      onClick={() => setClientPortalTab("Intake")}
                      style={{
                        fontSize: '1rem',
                        fontFamily: 'var(--font-tech)',
                        fontWeight: '600',
                        color: clientPortalTab === "Intake" ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        borderBottom: clientPortalTab === "Intake" ? '2px solid var(--accent-primary)' : 'none',
                        paddingBottom: '0.4rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <svg style={{ width: '16px', height: '16px', marginRight: '6px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                      </svg>
                      <span>{lang === "Cn" ? "需求詳情錄入 (Project Intake)" : "Project Intake (New Sketch)"}</span>
                    </span>
                    <span 
                      onClick={() => setClientPortalTab("Tracker")}
                      style={{
                        fontSize: '1rem',
                        fontFamily: 'var(--font-tech)',
                        fontWeight: '600',
                        color: clientPortalTab === "Tracker" ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        borderBottom: clientPortalTab === "Tracker" ? '2px solid var(--accent-primary)' : 'none',
                        paddingBottom: '0.4rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      <svg style={{ width: '16px', height: '16px', marginRight: '6px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 20V10M12 20V4M6 20v-6" />
                      </svg>
                      <span>{lang === "Cn" ? "進度跟蹤看板 (Interactive Tracker)" : "Interactive Tracker & Specs"}</span>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                  <div style={{ background: "rgba(124, 114, 103, 0.08)", padding: '0.4rem 1rem', borderRadius: '2px', border: "1px solid var(--glass-border)", fontSize: '0.85rem' }}>
                    {lang === "Cn" ? "在途訂單狀態: " : "Order Tracking: "}
                    <strong style={{ color: "var(--accent-primary)", fontFamily: "var(--font-tech)", fontWeight: "bold" }}>{currentStage.id} - {lang === "Cn" ? currentStage.nameCn : currentStage.nameEn}</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lang === "Cn" ? `設計師: ${user.name} | 公司: ${user.company}` : `Designer: ${user.name} | Co: ${user.company}`}
                  </span>
                </div>
              </div>

              {clientPortalTab === "Intake" && (
                <div className="dashboard-panels animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                  {/* Left Form: B2B Project Intake Form */}
                  <div className="glass-card" style={{ padding: '2rem' }}>
                    <div className="panel-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(124, 114, 103, 0.1)' }}>
                      <div className="panel-title" style={{ fontFamily: 'var(--font-tech)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>{lang === "Cn" ? "項目設計與製造詳情" : "Bespoke Project Briefing Specifications"}</span>
                      </div>
                    </div>
                    <form onSubmit={handleIntakeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                          {lang === "Cn" ? "項目名稱" : "PROJECT NAME"}
                        </label>
                        <input 
                          type="text" 
                          className="chat-input" 
                          value={intakeProjectName} 
                          onChange={(e) => setIntakeProjectName(e.target.value)}
                          placeholder={lang === "Cn" ? "例如：St Albans 精品酒店大堂" : "e.g. St Albans Boutique Hotel Lobby"}
                          style={{ width: '100%', background: '#FFFFFF', padding: '0.6rem', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '2px' }}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                          {lang === "Cn" ? "交付目的地" : "DELIVERY DESTINATION"}
                        </label>
                        <input 
                          type="text" 
                          className="chat-input" 
                          value={intakeDestination} 
                          onChange={(e) => setIntakeDestination(e.target.value)}
                          placeholder={lang === "Cn" ? "例如：英國倫敦" : "e.g. London, UK"}
                          style={{ width: '100%', background: '#FFFFFF', padding: '0.6rem', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '2px' }}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                          {lang === "Cn" ? "預估定製數量 (及款式)" : "ESTIMATED BESPOKE QUANTITIES"}
                        </label>
                        <input 
                          type="text" 
                          className="chat-input" 
                          value={intakeQuantity} 
                          onChange={(e) => setIntakeQuantity(e.target.value)}
                          placeholder={lang === "Cn" ? "例如：40 把大堂單人椅, 20 把休閒沙發" : "e.g. 40 Lobby Armchairs, 20 VIP Club Chairs"}
                          style={{ width: '100%', background: '#FFFFFF', padding: '0.6rem', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '2px' }}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                          {lang === "Cn" ? "設計草圖 / 藍圖上傳" : "DESIGN SKETCH / BLUEPRINT UPLOAD"}
                        </label>
                        <div style={{
                          border: '2px dashed rgba(124, 114, 103, 0.3)',
                          borderRadius: '4px',
                          padding: '2.5rem 1.5rem',
                          textAlign: 'center',
                          background: 'rgba(124, 114, 103, 0.02)',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onClick={() => document.getElementById('intake-file-upload').click()}
                        >
                          <input id="intake-file-upload" type="file" style={{ display: 'none' }} onChange={() => alert(lang === "Cn" ? "檔案已成功預加載！點擊下方按鈕開始 AI 解析。" : "File successfully preloaded! Click submit below to start parsing.")} />
                          <svg style={{ width: '40px', height: '40px', display: 'block', margin: '0 auto 0.5rem auto', color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 22L2 2v20h20z" />
                            <path d="M18 18L6 6v12h12z" />
                          </svg>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>
                            {lang === "Cn" ? "拖曳或點選上傳手繪草圖 / CAD 設計圖 (PDF, DXG, PNG)" : "Drag & drop hand sketch or CAD blueprint here, or click to browse (PDF, DXG, PNG)"}
                          </span>
                        </div>
                      </div>

                      <button type="submit" className="btn-premium" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={isIntakeUploading}>
                        {isIntakeUploading ? (
                          <>
                            <svg style={{ width: '16px', height: '16px' }} className="animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                            </svg>
                            <span>{lang === "Cn" ? "OpenClaw 智能體解析中..." : "Analyzing Spec with OpenClaw..."}</span>
                          </>
                        ) : (
                          <>
                            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M20 4a2 2 0 00-2.83 0L10 11.17l-1.41-1.41a1 1 0 00-1.42 0L3.5 13.5a1 1 0 000 1.42l4.24 4.24a1 1 0 001.42 0L12.92 15l1.41 1.41a1 1 0 001.42-1.42l7.17-7.17A2 2 0 0020 4z" />
                            </svg>
                            <span>{lang === "Cn" ? "提交項目詳情並使用 AI 解析圖紙" : "Submit Brief & Let AI Analyze Specs"}</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right: Premium Preview or Live Log terminal console */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(124, 114, 103, 0.01)' }}>
                      {!isIntakeUploading ? (
                        <>
                          <div style={{ width: '120px', margin: '0 auto 1.5rem auto' }}>
                            {renderChairSVG("FAB-02", "matte-black", { opacity: 0.5 })}
                          </div>
                          <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {lang === "Cn" ? "實時 CAD & 消防合規預審" : "Real-time CAD & Flammability Pre-Audit"}
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '350px', lineHeight: '1.6' }}>
                            {lang === "Cn" 
                              ? "當您提交草圖後，我們的多智能體 OpenClaw 管道將自動比對英國 Crib 5 阻燃法規，核對幾何公差，並生成三視圖。解析完成後即可在進度看板中查看項目圖紙。" 
                              : "Once submitted, our multi-agent OpenClaw pipeline will automatically audit the sketch against Crib 5 regulations, test tolerances, and auto-generate orthogonal CAD blueprints."}
                          </p>
                        </>
                      ) : (
                        <div style={{ width: '100%', textAlign: 'left', background: '#1C1B18', color: '#E8E5E0', fontFamily: 'var(--font-tech)', padding: '1.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="stage-badge-dot dot-ai animate-pulse" style={{ background: 'var(--accent-cyan)' }}></span>
                              <strong style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>
                                OPENCLAW SPEC PARSER TERMINAL v2.4
                              </strong>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#BAC2B9' }}>RUNNING</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, overflowY: 'auto' }}>
                            {parsingLogs.map((log, lidx) => (
                              <div key={lidx} style={{ fontSize: '0.8rem', lineHeight: '1.5', color: '#FAF9F6' }}>
                                <span style={{ color: 'var(--accent-green)' }}>[OpenClaw]</span> {lang === "Cn" ? log.cn : log.en}
                              </div>
                            ))}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#BAC2B9', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                              <span className="animate-pulse">⏳</span>
                              <span>{lang === "Cn" ? "AI 智能體正在協同運算中..." : "AI agents collaborating..."}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {clientPortalTab === "Tracker" && (
                <div className="dashboard-panels animate-fade-in">
                  {/* Left Column: Member Order Dashboard */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <MaterialStudio 
                      lang={lang} 
                      selectedFabric={selectedFabric} 
                      selectedLeg={selectedLeg} 
                      configuratorCrib5Blocked={configuratorCrib5Blocked} 
                      handleFabricSelect={handleFabricSelect} 
                      handleLegSelect={handleLegSelect} 
                    />
                    <div className="glass-card">
                      <div className="panel-header">
                        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg style={{ width: '16px', height: '16px', flexShrink: 0, color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                            <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
                          </svg>
                          <span>{lang === "Cn" ? "在单定制规格与进度" : "Bespoke Items & Specs"}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: "var(--accent-green)", fontFamily: "var(--font-tech)" }}>
                          Total: ${getOrderTotal().toLocaleString()}
                        </span>
                      </div>
                      <div className="panel-body">
                        <table className="order-table">
                          <thead>
                            <tr>
                              <th>{lang === "Cn" ? "项目类型" : "Item"}</th>
                              <th>{lang === "Cn" ? "数量" : "Qty"}</th>
                              <th>{lang === "Cn" ? "预选材质" : "Material Specs"}</th>
                              <th>{lang === "Cn" ? "单价" : "Price"}</th>
                              <th>{lang === "Cn" ? "小计" : "Subtotal"}</th>
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
                      <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{lang === "Cn" ? "製造與合規進度追蹤" : "Production & Compliance Progress Tracker"}</span>
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
                        <span>{lang === "Cn" ? "項目登錄" : "Intake Specs"}</span>
                        <span>{lang === "Cn" ? "Crib 5 消防驗證" : "Crib 5 Gate"}</span>
                        <span>{lang === "Cn" ? "AI 視覺質檢" : "AI CV Inspection"}</span>
                        <span>{lang === "Cn" ? "交付完成" : "Delivery Complete"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: OpenClaw Web chat for member to talk directly to AI Agent */}
                  <div className="glass-card">
                    <div className="panel-header" style={{ background: "rgba(124, 114, 103, 0.04)" }}>
                      <div className="panel-title">
                        <span className="stage-badge-dot dot-ai" style={{ background: "var(--accent-primary)" }}></span>
                        {lang === "Cn" ? "与 Crafton AI 选品助手对话" : "Design & Swatch Agent (OpenClaw)"}
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
                          {lang === "Cn" ? "快捷选品面料测试（点击发送模拟检测）：" : "Fabric swatches shortcut (click to simulate):"}
                        </span>
                        <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => { setInputText("I want to check FAB-01 Royal Velvet (皇家蓝丝绒) compatibility"); setTimeout(handleSendMessage, 100); }}>
                          Royal Velvet (Crib 5 Ok)
                        </button>
                        <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderColor: 'var(--accent-red)' }} onClick={() => { setInputText("I select FAB-03 Pure Silk Satin (纯丝绸缎)"); setTimeout(handleSendMessage, 100); }}>
                          Pure Silk Satin (⚠️ WILL BLOCK)
                        </button>
                      </div>

                      <div className="chat-input-area">
                        <input type="text" className="chat-input" placeholder={lang === "Cn" ? "向 AI 询问或变更面料..." : "Ask AI Swatch or check codes..."} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                        <button className="btn-premium" onClick={handleSendMessage}>Send</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* VIEW 3: Internal Backoffice (Cho / Client View) */}
      {currentView === "Backoffice" && (
        <div className="dashboard-grid animate-fade-in">
          {/* Sidebar Left: 17 Stages Controller */}
          <div className="sidebar">
            <h3 className="sidebar-title">
              {lang === "Cn" ? "17阶段全景时间轴" : "17-Stage Control Center"}
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
                  <button className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleChoApproval}>
                    <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span>{lang === "Cn" ? "批准规格书与BOM (Human H1)" : "Approve Tech BOM (Human H1)"}</span>
                  </button>
                )}

                {currentStage.id === "S05" && isCrib5Blocked && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
                      </svg>
                      <span>CRIB 5 BLOCK INTERCEPTED (Crib 5 强制拦截中)</span>
                    </span>
                    <button className="btn-premium" style={{ background: 'var(--accent-orange)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleBypassCrib5("Navy Classic Linen")}>
                      <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                      </svg>
                      <span>{lang === "Cn" ? "强制降级为符合Crib 5面料" : "Bypass block: Change to Navy Linen"}</span>
                    </button>
                  </div>
                )}

                {currentStage.id === "S08" && (
                  <span style={{ color: 'var(--accent-orange)', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12,19 5,12 12,5" />
                    </svg>
                    <span>{lang === "Cn" ? "请在右侧选择供应商下单" : "Select supplier on the right column"}</span>
                  </span>
                )}

                {currentStage.id === "S15" && !splitDeliveryActive && (
                  <button className="btn-premium" style={{ background: 'var(--accent-red)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={triggerSplitDelivery}>
                    <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>{lang === "Cn" ? "客户提出更改：执行分批交付财务划线核销" : "Execute Split Delivery Strike-through"}</span>
                  </button>
                )}

                {currentStage.id !== "S04" && currentStage.id !== "S08" && (!isCrib5Blocked) && (
                  <button className="btn-secondary" onClick={() => handleStageChange(Math.min(currentStageIndex + 1, 16))}>
                    {lang === "Cn" ? "下一步 (模拟流转)" : "Next Simulation Stage ➔"}
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
                    <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg style={{ width: '16px', height: '16px', flexShrink: 0, color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        <path d="M9 14l2 2 4-4" />
                      </svg>
                      <span>Supabase 共享主数据库 (Master Sheet)</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {order.orderId}</span>
                  </div>
                  <div className="panel-body" style={{ padding: '1.5rem 0' }}>
                    <div className="table-container" style={{ padding: '0 1.5rem' }}>
                      <table className="order-table" style={{ minWidth: '650px' }}>
                        <thead>
                          <tr>
                            <th>{lang === "Cn" ? "项目类型" : "Item"}</th>
                            <th>{lang === "Cn" ? "数量" : "Qty"}</th>
                            <th>{lang === "Cn" ? "材质规格 (双语)" : "Bilingual Material"}</th>
                            <th>{lang === "Cn" ? "合同单价" : "Unit Price"}</th>
                            <th>{lang === "Cn" ? "小计" : "Subtotal"}</th>
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
                                  <span><span style={{ textDecoration: 'line-through', color: 'var(--accent-red)' }}>40</span> ➔ <strong style={{ color: 'var(--accent-green)' }}>38</strong></span>
                                ) : splitDeliveryActive && item.id === "ITEM-03" ? (
                                  <span><span style={{ textDecoration: 'line-through', color: 'var(--accent-red)' }}>5</span> ➔ <strong style={{ color: 'var(--accent-green)' }}>4</strong></span>
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
                            ${p.amount.toLocaleString()} ({p.status === "Paid" ? (lang === "Cn" ? "已付" : "Paid") : (lang === "Cn" ? "未核销" : "Pending")})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Change Tracker Log Panel */}
                <div className="glass-card">
                  <div className="panel-header">
                    <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg style={{ width: '16px', height: '16px', flexShrink: 0, color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M9 11l2 2 4-4" />
                      </svg>
                      <span>{lang === "Cn" ? "变更审计日志 (Change Tracker Log)" : "Change Tracker Log"}</span>
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
                      {lang === "Cn" ? "OpenClaw 智能体思考轨迹控制台 (Thought-Process Terminal)" : "OpenClaw Thought-Process Terminal"}
                    </div>
                  </div>
                  <div className="panel-body">
                    <div className="terminal-console">
                      {mockData.agentThoughtLogs[currentStage.id] ? (
                        mockData.agentThoughtLogs[currentStage.id].map((tlog, tidx) => {
                          const roleLabel = lang === "Cn"
                            ? (tlog.role === "thought" ? "【AI THOUGHT】" : tlog.role === "action" ? "【ACTION CALL】" : tlog.role === "observation" ? "【OBSERVATION】" : "【SYSTEM】")
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
                            ? "【SYSTEM】OpenClaw Daemon v2.1 挂机待命。当前阶段未绑定主动自动化任务。正在监听 Supabase Webhook 触发。" 
                            : "[SYSTEM] OpenClaw Daemon v2.1 Standby. No active automated task is bound to the current stage. Listening for Supabase Webhook triggers."}
                        </div>
                      )}
                      <div ref={terminalEndRef}></div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.5rem' }}>
                      {lang === "Cn" ? "基于 OpenClaw / Supabase 事件联动架构" : "Powered by OpenClaw & Supabase Event Architecture"}
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
                <svg style={{ width: '22px', height: '22px', color: 'var(--accent-primary)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
                </svg>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-tech)', color: 'var(--text-primary)', fontWeight: '600', letterSpacing: '0.5px' }}>
                    {lang === "Cn" ? "3D 集裝箱排櫃優化仿真模型 (Live Volumetric Packing Simulation)" : "3D Volumetric Container Packing Simulation Console"}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {lang === "Cn" ? "正在運行於 Bluehost VPS 服务器：129.121.98.185 | 實時三維渲染與堆疊算法" : "Live executing on Bluehost VPS: 129.121.98.185 | Realtime WebGL Render & Heuristics"}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Open in New Tab Button */}
                <button 
                  onClick={() => window.open(`/loading-ai/index.html?lang=${lang === "Cn" ? "cn" : "en"}`, '_blank')}
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
                  <span style={{ fontSize: '0.85rem' }}>↗</span> {lang === "Cn" ? "在新分頁中全屏運行" : "Open Fullscreen in New Tab"}
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
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body / Iframe Container (Perfect 100% Height Fill) */}
            <div className="volumetric-modal-body">
              <iframe 
                src={`/loading-ai/index.html?lang=${lang === "Cn" ? "cn" : "en"}`} 
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
                {lang === "Cn" ? "💡 提示：滑鼠滾輪可縮放視角，按住左鍵可旋轉貨櫃，按右鍵拖曳可平移視角。" : "💡 Controls: Scroll wheel to zoom, left click & drag to rotate, right click to pan."}
              </span>
              <button 
                className="btn-premium" 
                style={{ padding: '0.5rem 1.5rem' }}
                onClick={() => setShowVolumetricSimulation(false)}
              >
                {lang === "Cn" ? "關閉主控台" : "Close Simulation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Auth Gate Overlay */}
      {showAuthGate && renderAuthGate()}
    </div>
  );
}

export default App;
