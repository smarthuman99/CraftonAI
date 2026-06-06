/**
 * Crafton AI - 模拟业务数据与智能体思考日志
 * 包含：17阶段定义、模拟订单数据、面料库、供应商数据、以及智能体思考追踪
 */

const mockData = {
  // 17阶段全景工作流步骤定义
  stages: [
    // Phase I: Intake & Design (订单接入与规格定义)
    { id: "S01", phase: "Phase I", type: "AI", nameCn: "订单需求接入", nameEn: "Intake Agent", descCn: "AI 读取客户会员中心内置对话框消息并提取家具类型和数量 (带客户身份识别码)", descEn: "AI parses client message/sketch from built-in Member Portal with secure Client ID" },
    { id: "S02", phase: "Phase I", type: "AI", nameCn: "双语补齐规格", nameEn: "Comm Agent", descCn: "AI 自动比对规格，通过会员中心追问缺失的颜色、材质或尺寸", descEn: "AI detects missing attributes and follows up via Member Portal built-in inbox" },
    { id: "S03", phase: "Phase I", type: "AI", nameCn: "生成技术BOM", nameEn: "Spec Agent v2", descCn: "AI 智能翻译并输出中英对照的技术规格BOM表及缩略图", descEn: "AI auto-generates bilingual BOM sheet and material attachments" },
    { id: "S04", phase: "Phase I", type: "Human", nameCn: "Cho技术审批", nameEn: "Cho Approval (H1)", descCn: "Cho 在后台确认技术规格、公差和物料无误，签字放行", descEn: "Cho reviews tolerances, drawings & materials, then signs off" },
    
    // Phase II: Compliance Gate (合规卡点门禁)
    { id: "S05", phase: "Phase II", type: "Gate", nameCn: "Crib 5 消防拦截", nameEn: "Compliance Gate", descCn: "硬性合规：检测面料是否可通过 Crib 5 防火阻燃及 CITES 环保资质", descEn: "Compliance check for UK Crib 5 fire regulations & wood CITES" },
    
    // Phase III: Bidding & Quotation (多厂询价与比价)
    { id: "S06", phase: "Phase III", type: "AI", nameCn: "供应商智能询价", nameEn: "Quotation Agent", descCn: "AI 自动生成 PDF 询价单发送至 3 家意向工厂邮箱", descEn: "AI auto-generates RFQ PDF and dispatches to 3 target factories" },
    { id: "S07", phase: "Phase III", type: "AI", nameCn: "多厂报价比对", nameEn: "Comparison Agent", descCn: "AI 收集报价，横向对比价格、工期和往期质检合格率", descEn: "AI parses bids, comparing price, timeline, and history score" },
    { id: "S08", phase: "Phase III", type: "Human", nameCn: "Cho比价决策", nameEn: "Cho Decides (H2)", descCn: "Cho 参考 AI 比价分析，一键选定生产工厂，更新总单价", descEn: "Cho reviews AI recommendation and finalizes supplier selection" },
    
    // Phase IV: Production Tracking (生产与视觉质检)
    { id: "S09", phase: "Phase IV", type: "AI", nameCn: "生产状态扫码联动", nameEn: "QR Production Link", descCn: "物料到厂贴二维码。车间扫码即显 3D 图纸，反馈每日进度", descEn: "BOM items labeled with QR codes. Workers scan to view 3D drawings" },
    { id: "S10", phase: "Phase IV", type: "AI", nameCn: "延期风险自动跟进", nameEn: "FollowUp Agent", descCn: "AI 每日计算，发现交期告急自动 WhatsApp 催促工厂汇报", descEn: "AI calculates timeline risks, auto-prompting factory on WhatsApp" },
    { id: "S11", phase: "Phase IV", type: "Gate", nameCn: "AI 视觉实物对比", nameEn: "AI CV Inspection", descCn: "硬性质检：比对工厂上传的实物照片与 CAD 图纸，防止做错色/形", descEn: "AI CV compares site photo against CAD to detect geometric/color errors" },
    
    // Phase V: Shipping & Container Loading (装箱与物流合规)
    { id: "S12", phase: "Phase V", type: "AI", nameCn: "集装箱3D排柜算法", nameEn: "Volumetric Agent", descCn: "根据包装尺寸，AI 自动生成 20GP/40GP 货柜最佳 3D 堆叠装箱率", descEn: "AI calculates 3D container cargo stacking diagram for max volume" },
    { id: "S13", phase: "Phase V", type: "Gate", nameCn: "出货四大合规检查", nameEn: "Logistics Gate", descCn: "硬性检查：核验木质熏蒸证书、单证一致性、海关报关单", descEn: "Check IPPC fumigation, packing lists consistency & export docs" },
    
    // Phase VI: Delivery & Financial Audit (送货、划线核销与归档)
    { id: "S14", phase: "Phase VI", type: "AI", nameCn: "物流货运在途追踪", nameEn: "Shipping Tracker", descCn: "对接海运 API，向会员后台和 WhatsApp 推送货船航行状态", descEn: "Pushes real-time vessel tracker info to client portal & WhatsApp" },
    { id: "S15", phase: "Phase VI", type: "AI", nameCn: "分批到货划线核销", nameEn: "Split Delivery Auditor", descCn: "财务自动核销：支持分批到货与取消商品的 strike-through 划线财务重算", descEn: "Auto accounting recalculation and strike-through of canceled items" },
    { id: "S16", phase: "Phase VI", type: "Human", nameCn: "客户交付验收", nameEn: "Client Handover (H3)", descCn: "客户现场入户，确认五金、皮面完好无损，签字交接", descEn: "Client conducts onsite handover, checks hardware, and signs off" },
    { id: "S17", phase: "Phase VI", type: "AI", nameCn: "项目完整审计封存", nameEn: "Archive Agent", descCn: "封存项目的所有图纸、变更记录、质检报告和付款凭证供永久审计", descEn: "Archives blueprints, Change Logs, inspection PDFs for audits" },
  ],

  // 模拟面料库 (包含 Crib 5 消防状态)
  fabrics: [
    { id: "FAB-01", name: "Royal Velvet (皇家蓝丝绒)", code: "V-9082", crib5Compatible: true, treatmentRequired: true, notesCn: "支持 Crib 5 阻燃处理，处理后手感微硬", notesEn: "Crib 5 compliant. Hand-feel hardens slightly after flame coating" },
    { id: "FAB-02", name: "Navy Classic Linen (海军蓝亚麻)", code: "L-4410", crib5Compatible: true, treatmentRequired: true, notesCn: "经典英伦防火面料，缩水率低于 2%", notesEn: "Classic British fireproof linen. Shrinkage rate under 2%" },
    { id: "FAB-03", name: "Pure Silk Satin (纯丝绸缎)", code: "S-1002", crib5Compatible: false, treatmentRequired: false, notesCn: "⚠️ 警告：精细丝绸防火处理后会严重缩水与变色，禁止用于 Crib 5 项目！", notesEn: "⚠️ WARNING: Fine silk shrinks & discolors under flame coating. BANNED for Crib 5!" },
    { id: "FAB-04", name: "A-Class Cow Leather (A级牛皮)", code: "CL-55", crib5Compatible: true, treatmentRequired: false, notesCn: "真皮本身耐磨，可通过物理 Crib 5 检测", notesEn: "Genuine leather. Inherently passes Crib 5 flame testing" }
  ],

  // 模拟主数据订单
  initialOrder: {
    orderId: "CRAFT-202605-01",
    clientName: "Client Design Studio (UK)",
    projectLocation: "St Albans, UK",
    createdDate: "2026-05-25",
    currentStageId: "S01", // 初始在 S01 阶段
    items: [
      { id: "ITEM-01", typeCn: "大堂扶手椅", typeEn: "Lobby Armchair", qty: 40, materialCn: "海军蓝亚麻 (L-4410)", materialEn: "Navy Classic Linen (L-4410)", originalUnitPrice: 210, unitPrice: 210, status: "Active" },
      { id: "ITEM-02", typeCn: "贵宾单人椅", typeEn: "VIP Club Chair", qty: 20, materialCn: "皇家蓝丝绒 (V-9082)", materialEn: "Royal Velvet (V-9082)", originalUnitPrice: 280, unitPrice: 280, status: "Active" },
      { id: "ITEM-03", typeCn: "定制实木大茶几", typeEn: "Custom Oak Coffee Table", qty: 5, materialCn: "天然白橡木", materialEn: "Natural Solid White Oak", originalUnitPrice: 450, unitPrice: 450, status: "Active" }
    ],
    payments: [
      { milestone: "50% Deposit (50% 首期定金)", amount: 10450, date: "2026-05-25", status: "Paid" },
      { milestone: "40% Shipping Release (40% 出货中款)", amount: 8360, date: "Pending", status: "Pending" },
      { milestone: "10% Handover Balance (10% 交付尾款)", amount: 2090, date: "Pending", status: "Pending" }
    ]
  },

  // 模拟供应商比价数据
  supplierBids: [
    { name: "Foshan Gold-Sun Furniture (佛山金阳家具厂)", pricePerChair: 195, deliveryDays: 25, qualityScore: "98.5%", reliability: "★★★★★", note: "推荐：工期最稳，五金焊接工艺好" },
    { name: "Dongguan Royal Oak Co. (东莞皇家橡树家具)", pricePerChair: 185, deliveryDays: 32, qualityScore: "94.2%", reliability: "★★★★☆", note: "价格最低，但交期在旺季有一定延误记录" },
    { name: "Shunde Classic Comfort (顺德经典舒适家居)", pricePerChair: 230, deliveryDays: 20, qualityScore: "99.1%", reliability: "★★★★★", note: "高档面料处理经验足，但报价偏高" }
  ],

  // 模拟 Change Tracker 审计日志
  changeLogs: [
    { 
      time: "2026-05-25 10:15:20", 
      user: "OpenClaw IntakeAgent", 
      action: "解析會員中心內置對話框需求及手稿，自動生成主訂單草稿",
      actionEn: "Parsed member center built-in dialog requirements and hand-drawn sketches; automatically generated main order draft."
    },
    { 
      time: "2026-05-25 10:16:02", 
      user: "OpenClaw CommAgent", 
      action: "自動通過內置消息通道向客户追問補充椅子的金屬腿部塗裝工藝和公差",
      actionEn: "Automatically inquired customer via portal message for supplementary chair metal leg painting finish and tolerance."
    },
    { 
      time: "2026-05-25 10:16:45", 
      user: "OpenClaw SpecAgent v2", 
      action: "一鍵生成中英文對照規格書，尺寸標準定義：W: 650mm, D: 600mm, H: 850mm",
      actionEn: "One-click generated bilingual specification sheet; standard dimensions defined: W: 650mm, D: 600mm, H: 850mm."
    }
  ],

  // 模拟 OpenClaw 与 Supabase 的交互事件与智能体思考链路 (Thought-Process)
  agentThoughtLogs: {
    "S01": [
      { role: "system", text: "OpenClaw Daemon v2.1 啟動，正在監聽 Supabase Webhook 觸發信號...", textEn: "OpenClaw Daemon v2.1 initialized. Listening to Supabase Webhook triggers..." },
      { role: "thought", text: "監聽到新 Webhook 信號：Supabase 表 `portal_chats` 有新數據插入。綁定安全識別：Client_ID: CLIENT-UK, Project_Location: St Albans", textEn: "Detected new Webhook signal: new row inserted in Supabase table 'portal_chats'. Bounded safety ID: Client_ID: CLIENT-UK, Project_Location: St Albans" },
      { role: "thought", text: "正在調用大模型 API (Gemini 1.5 Flash) 分析該多模态對話... 客戶登錄後上傳了 1 張手繪椅子照片及需求語音：“Hi, need 40 lobby armchairs and 20 club chairs for St Albans lobby. Blue style. Must pass UK fire safety.”", textEn: "Calling multimodal LLM API (Gemini 1.5 Flash) to parse user inputs... Client uploaded 1 hand-drawn chair sketch & voice message after logging in: 'Hi, need 40 lobby armchairs and 20 club chairs for St Albans lobby. Blue style. Must pass UK fire safety.'" },
      { role: "action", text: "調用 `create_supabase_order` 工具。自動生成訂單草稿並綁定客户的賬號，解析提取項：Lobby Armchair: 40件, VIP Club Chair: 20件, 消防阻燃级别要求: Crib 5.", textEn: "Invoked tool 'create_supabase_order'. Generated order draft and mapped to client account. Extracted parameters: Lobby Armchair: 40 pcs, VIP Club Chair: 20 pcs, Fire retardant specification: Crib 5." },
      { role: "observation", text: "成功在 Supabase 表 `orders` 插入草稿記錄。當前狀態：Stage_01_Intake (已完成客戶身份安全校驗)。流程自動流轉至 S02。", textEn: "Successfully inserted draft record in Supabase 'orders' table. Current status: Stage_01_Intake (Client identity security check passed). Auto-progressing to S02." }
    ],
    "S02": [
      { role: "thought", text: "當前狀態: Stage_02_Comm. 正在比對新生成訂單規格與標準生產 BOM 模板的必填字段...", textEn: "Current status: Stage_02_Comm. Comparing newly generated order specs against standard production BOM template required fields..." },
      { role: "thought", text: "發現關鍵參數缺失：[1] Armchair 與 Club Chair 的金屬椅腿塗裝工藝未指定 [2] 客戶僅遷移“藍色”，未選定具體的面料色板編碼。", textEn: "Found missing parameters: [1] Metal leg finish for Armchair & Club Chair is unspecified [2] Client specified 'blue style' but selected no specific fabric swatch code." },
      { role: "action", text: "調用 `send_portal_notification` 工具。自動撰寫極具親和力的中英文對照催詢話術，實時推送至客户的會員控制台對話框。", textEn: "Invoked tool 'send_portal_notification'. Drafted friendly bilingual follow-up query, pushing to client's member portal inbox in real-time." },
      { role: "observation", text: "會員中心消息推送成功。對話內容：‘Hi, we received your inquiry! Could you please confirm the blue fabric swatch code (e.g. Linen or Velvet)? And would you prefer Electroplated Chrome Gold or Matte Black for the chair legs?’", textEn: "Member Portal notification pushed successfully. Content: 'Hi, we received your inquiry! Could you please confirm the blue fabric swatch code (e.g. Linen or Velvet)? And would you prefer Electroplated Chrome Gold or Matte Black for the chair legs?'" }
    ],
    "S03": [
      { role: "thought", text: "收到客户在會員控制台對話框的回覆：“Please use Navy Classic Linen for armchairs, Royal Blue Velvet for club chairs. Let's do Matte Black legs.”", textEn: "Received client response from portal inbox: 'Please use Navy Classic Linen for armchairs, Royal Blue Velvet for club chairs. Let's do Matte Black legs.'" },
      { role: "thought", text: "開始處理新數據。將布料材質與黑色金屬腳參數寫入 Supabase 中。接下來需要自動生成雙語 BOM。", textEn: "Processing new parameters. Writing fabric materials and black metal legs specs into Supabase. Next step: auto-generating bilingual BOM." },
      { role: "action", text: "調用 `generate_bilingual_bom_pdf` 工具。翻譯提取：Lobby Armchair -> 大堂扶手椅, Navy Classic Linen -> 海军蓝亚麻, VIP Club Chair -> 贵宾单人椅, Royal Blue Velvet -> 皇家蓝丝绒。自動排版技術规格與公差限制（±5mm）。", textEn: "Invoked tool 'generate_bilingual_bom_pdf'. Extracted translations: Lobby Armchair -> 大堂扶手椅, Navy Classic Linen -> 海军蓝亚麻, VIP Club Chair -> 贵宾单人椅, Royal Blue Velvet -> 皇家蓝丝绒. Auto-formatting specifications and tolerance limits (±5mm)." },
      { role: "observation", text: "雙語規格書 PDF 已自動生成並上傳至 Supabase Storage。Supabase 表 `orders` 當前狀態自動變更為: S04 (Pending_Cho_Approval)。", textEn: "Bilingual spec sheet PDF generated and uploaded to Supabase Storage. Supabase table 'orders' status updated to S04 (Pending_Cho_Approval)." }
    ],
    "S04": [
      { role: "system", text: "系統檢測到狀態更新為 S04。OpenClaw 暫停自主運行，進入狀態等待。", textEn: "System detected S04 status update. OpenClaw autonomous loop paused, awaiting action." },
      { role: "thought", text: "此步驟為人機交互點 1 (Human Check 1)。需要由 Cho 在控制台審核規格書 PDF 與 Swatches。若 Cho 點擊同意，將觸發 Webhook 開鎖下一步。", textEn: "Human-in-the-loop Gate 1 (Human Check 1). Cho reviews spec sheet PDF and fabric swatches in the backoffice. Cho's approval triggers Webhook to unlock the next stage." }
    ],
    "S05": [
      { role: "thought", text: "Cho 技術審批已通過！狀態更新為 S05 (合規檢測)。", textEn: "Cho's technical approval granted! Status updated to S05 (Compliance check)." },
      { role: "thought", text: "正在調用合規分析技能 `skills/compliance_checker.js` 聯網核查。項目地：St Albans (英國)。英國消防法規要求：Crib 5 (Source 5)。", textEn: "Invoking compliance skill 'skills/compliance_checker.js' for web verification. Site: St Albans (UK). UK Fire Safety Regulations: Crib 5 (Source 5)." },
      { role: "action", text: "調用 `check_swatch_crib5_database` 檢索面料庫：\n1. Navy Classic Linen (L-4410): [兼容 Crib 5]。需做阻燃塗層。\n2. Royal Blue Velvet (V-9082): [兼容 Crib 5]。需做阻燃塗層。", textEn: "Invoking tool 'check_swatch_crib5_database' to query fabric repository:\n1. Navy Classic Linen (L-4410): [Crib 5 Compatible]. Needs flame-retardant coating.\n2. Royal Blue Velvet (V-9082): [Crib 5 Compatible]. Needs flame-retardant coating." },
      { role: "observation", text: "檢測結果：全體面料均兼容 Crib 5 法規。自動放行！流程解鎖並流轉至 Phase III 詢價階段。", textEn: "Verification result: All selected fabrics are Crib 5 compatible. Gate bypassed! Unlocking workflow and progressing to Phase III (Bidding/RFQ)." }
    ],
    "S06": [
      { role: "thought", text: "狀態更新為 S06 (供應商詢價)。OpenClaw 需代表 Crafton 向合作工廠索取報價。", textEn: "Status updated to S06 (Supplier bidding). OpenClaw drafts RFQs on behalf of Crafton." },
      { role: "action", text: "調用 `generate_rfq_pdf` 工具，生成三份帶有唯一跟踪編碼的工廠詢價 PDF，並調用 `send_factory_email` 發送至：\n1. 佛山金阳家具厂 (gold_sun_furn@fs.com)\n2. 东莞皇家橡树家具 (royal_oak@dg.com)\n3. 顺德经典舒适家居 (classic_comfort@sd.com)", textEn: "Invoking tool 'generate_rfq_pdf' to generate 3 customized factory RFQ PDFs with unique tracking IDs, calling 'send_factory_email' to send to:\n1. Foshan Gold-Sun Furniture (gold_sun_furn@fs.com)\n2. Dongguan Royal Oak Co. (royal_oak@dg.com)\n3. Shunde Classic Comfort (classic_comfort@sd.com)" },
      { role: "observation", text: "郵件與詢價 PDF 發送成功。在 Supabase 記錄發送日誌，並定時 48 小時無人回覆則自動催詢。", textEn: "RFQs and PDFs sent successfully. Dispatch logs registered in Supabase. Cron job scheduler set for 48h auto-reminder." }
    ],
    "S07": [
      { role: "thought", text: "檢測到 3 家工廠已全部通過 API/Email 填報了詢價單。OpenClaw 開始進行多維度比價分析。", textEn: "All 3 mills submitted bids via API/Email. OpenClaw begins multidimensional bidding analysis." },
      { role: "action", text: "調用 `skills/price_comparator.js`。讀取數據：\n- 金阳: Armchair $195, 工期 25天, 信用星級: ★★★★★\n- 皇家橡树: Armchair $185, 工期 32天, 信用星級: ★★★★☆\n- 经典舒适: Armchair $230, 工期 20天, 信用星級: ★★★★★\n正在撰寫 AI 推薦報告並插入 Supabase 表 `bid_comparison`。", textEn: "Invoking skill 'skills/price_comparator.js'. Reading bid metrics:\n- Gold-Sun: Armchair $195, Lead time: 25 days, Rating: ★★★★★\n- Royal Oak: Armchair $185, Lead time: 32 days, Rating: ★★★★☆\n- Classic Comfort: Armchair $230, Lead time: 20 days, Rating: ★★★★★\nCompiling AI recommendation report to Supabase table 'bid_comparison'." },
      { role: "observation", text: "比價分析報告編寫完成。已在內網控制台高亮推薦‘佛山金阳’。當前狀態自動切換為 S08 (等待 Cho 選定工廠)。", textEn: "Bidding comparison report complete. Highlighted 'Foshan Gold-Sun' on backoffice console. Current status changed to S08 (Awaiting Cho's factory selection)." }
    ],
    "S08": [
      { role: "system", text: "當前狀態: S08。OpenClaw 暫停，進入人機交互點 2 (Human Check 2)。", textEn: "Current status: S08. OpenClaw paused, awaiting Human-in-the-loop Gate 2 (Human Check 2)." },
      { role: "thought", text: "等待 Cho 一鍵選定最終代工廠。選定後，系統將解鎖生產條線並自動重算利潤率。", textEn: "Awaiting Cho to finalize the manufacturing partner. Selection triggers production line unlock and profit-margin auto-recalculation." }
    ],
    "S09": [
      { role: "thought", text: "Cho 選定了「佛山金阳家具厂」！金阳家具廠已接收訂單，生產物料 Navy Linen 與 Blue Velvet 到廠。", textEn: "Cho selected 'Foshan Gold-Sun Furniture'! The mill accepted the order, and Navy Linen and Blue Velvet raw materials have arrived." },
      { role: "action", text: "調用 `generate_item_qr_codes` 為每件家具物料生成唯一 QR Code：綁定 Supabase 圖紙。當工廠在平板上掃碼時，將直接調出 PDF 與 3D 結構圖。", textEn: "Invoking 'generate_item_qr_codes' to link each item to a unique QR code tied to Supabase drawings. Scanning triggers PDF specs & 3D structural drawings." },
      { role: "observation", text: "QR 碼已發送至金阳廠長。工廠已貼標，首批大堂扶手椅框架組装中。", textEn: "QR codes dispatched to Gold-Sun manager. Items labeled; initial Lobby Armchair frames are being assembled." }
    ],
    "S10": [
      { role: "thought", text: "當前狀態：S10 (生產自動跟進)。今天早上 9:00 定時任務觸發。", textEn: "Current status: S10 (Production tracking). Scheduled daily cron job triggered at 9:00 AM." },
      { role: "action", text: "查詢 Supabase 生產日誌，發現 `Lobby Armchair` 當前組裝进度 40%，未上傳本週實物進度照。交期剩餘 15 天，存在黃色延期風險。", textEn: "Queried Supabase logs: 'Lobby Armchair' assembly is at 40%, lacking this week's physical progress photos. 15 days remaining; flagged as a Yellow Delay Risk." },
      { role: "action", text: "調用 `send_whatsapp_message` 聯繫佛山金阳李廠長：“李厂长，关于 St Albans 的扶手椅订单，能否用手机拍张今天的白胚照片传上系统？我们需要做 AI 视觉质检，谢谢合作！”", textEn: "Invoking 'send_whatsapp_message' to contact Gold-Sun manager: 'Li, regarding the St Albans armchairs, could you snap a photo of today's raw chair frames and upload it? We need it for AI CV inspection, thanks!'" },
      { role: "observation", text: "催貨消息發送成功。金阳李廠長已通過微信上傳了一張實物照片。", textEn: "Reminder sent. Gold-Sun manager responded by uploading a physical photo." }
    ],
    "S11": [
      { role: "thought", text: "收到工廠上傳的實物照片。開始執行硬性 AI 視覺質检 (AI CV Inspection)。", textEn: "Received physical photo from mill. Initiating mandatory AI Computer Vision Inspection (AI CV Inspection)." },
      { role: "action", text: "調用 Python OpenCV 技能 `skills/cv_comparator.py`。將白胚照片與原始 CAD 圖紙進行特徵點重合對比、角度公差測量和椅腳金屬配色提取。", textEn: "Invoked Python OpenCV skill 'skills/cv_comparator.py' to compare the physical photo against the original CAD drawing for contour matches, angle tolerances, and leg finish color." },
      { role: "observation", text: "對比分析完成：重合度 98.2%，檢測到椅腳顏色為 Matte Black（與圖紙 100% 吻合）。\n自動輸出 AI 質檢合格報告（PDF）並上傳至 Supabase Storage，狀態自動放行解鎖！", textEn: "CV analysis complete: 98.2% match rate, leg finish color detected as Matte Black (100% match with CAD specs).\nAuto-compiled CV pass certificate PDF and uploaded to Supabase Storage. Gate passed!" }
    ],
    "S12": [
      { role: "thought", text: "大貨生產完畢，進入 Phase V 装箱打包。需要優化貨櫃體積利用率。", textEn: "Production completed, progressing to Phase V packing. Stacking volume optimization initiated." },
      { role: "action", text: "調用 `skills/volumetric_calculator.js` 獲取產品包裝尺寸：\n- 扶手椅 (0.6cbm/箱) * 40 = 24 cbm\n- 单人椅 (0.8cbm/箱) * 20 = 16 cbm\n- 茶几 (1.2cbm/箱) * 5 = 6 cbm\n總體積：46 cbm。模擬裝載入 40GP 貨櫃（總容積 67 cbm）。", textEn: "Invoking skill 'skills/volumetric_calculator.js' to calculate packing dimensions:\n- Armchairs (0.6cbm/box) * 40 = 24 cbm\n- Club chairs (0.8cbm/box) * 20 = 16 cbm\n- Coffee tables (1.2cbm/box) * 5 = 6 cbm\nTotal: 46 cbm. Simulated loading into 40GP cargo container (67 cbm capacity)." },
      { role: "observation", text: "裝箱堆疊算法運行完畢：裝載率 68.6%，AI 已生成 3D 裝車排櫃效果圖。已同步在會員後台對客户開放下載。", textEn: "3D packing algorithm run completed: loading rate at 68.6%, 3D stacking schematic generated. Pushed to Client Portal for download." }
    ],
    "S13": [
      { role: "thought", text: "貨物運抵南沙港，出貨前進行四大合規單證硬性審查。", textEn: "Cargo arrived at Nansha Port. Initiating mandatory four export compliance document checks." },
      { role: "action", text: "調用 RAG 技能審查上傳的單據 PDF：\n1. 木質茶几 IPPC 熏蒸證明：[合格，已核銷]\n2. 海關報關單：[合格，與實物申報一致]\n3. 提單、裝箱單、商業發票序列號一致性對比：[100% 吻合，無錯別字]", textEn: "Invoked RAG skill to verify uploaded PDF documents:\n1. Wooden tables IPPC Fumigation: [Passed & verified]\n2. Customs Export Declaration: [Passed, matches cargo items]\n3. Bill of Lading, Packing List & Commercial Invoice match rate: [100% Match, 0 typos]" },
      { role: "observation", text: "四大合規校驗全部綠燈通過！自動生成物流放行指令，貨船正式離港啟航。", textEn: "All four compliance checkpoints cleared successfully! Generated release order, container ship has officially departed Nansha Port." }
    ],
    "S14": [
      { role: "thought", text: "貨船在途.定時訂閱馬士基海運實時航行 API。", textEn: "Vessel in transit. Actively subscribing to Maersk real-time shipping tracking APIs." },
      { role: "action", text: "獲取船舶位置：當前位於蘇伊士運河，預計 12 天後抵達英國南安普敦港。", textEn: "Acquired current vessel coordinates: currently crossing Suez Canal. Estimated arrival at Port of Southampton (UK) in 12 days." },
      { role: "observation", text: "實時位置與預計到港時間（ETA: 2026-06-08）已推送至客户的網頁 Dashboard 和 WhatsApp。", textEn: "Real-time vessel coordinates & ETA (2026-06-08) pushed successfully to Client Portal Dashboard & WhatsApp." }
    ],
    "S15": [
      { role: "thought", text: "大貨抵達英國，客戶臨時通知：‘Due to site change, cancel 2 Lobby Armchairs and 1 Oak Coffee Table. We will do split delivery.’ (場地變更，取消2把扶手椅和1張茶几，分批送貨)", textEn: "Cargo arrived in UK. Client sent urgent change request: 'Due to site change, cancel 2 Lobby Armchairs and 1 Oak Coffee Table. We will do split delivery.'" },
      { role: "action", text: "啟動財務分批核銷與劃線重算。在 Supabase 中將 ITEM-01 的 2 件商品、ITEM-03 的 1 件商品狀態改為 `Canceled`。原始總價 $19650。", textEn: "Initiating split accounting strike-through and total recalculation. Setting 2 armchairs (ITEM-01) and 1 table (ITEM-03) status as 'Canceled' in Supabase. Original Total: $19,650." },
      { role: "action", text: "自動重新計算：\n- Canceled 金額: (Armchair $210 * 2) + (Coffee Table $450 * 1) = $870\n- 新訂单總金額: $18780\n- 首期已付 50% 定金: $10450\n- 重新分攤後續 40% 中款與 10% 尾款。", textEn: "Auto recalculation results:\n- Canceled amount: (Armchair $210 * 2) + (Coffee Table $450 * 1) = $870\n- Recalculated total amount: $18,780\n- First payment (50% Deposit): $10,450 paid\n- Recalculated remaining 40% intermediate payment and 10% final balance." },
      { role: "observation", text: "財務核銷與重算完成！已自動將取消的商品顯示 strike-through 劃線，會員 Dashboard 表單自動重繪，對賬單實時更新。", textEn: "Financial strike-through recalculation complete! Cancelled items rendered with strike-through on dashboard invoice automatically; ledger synced in real-time." }
    ],
    "S16": [
      { role: "system", text: "货运卡车抵達 St Albans。客户與現場團隊现场验收。", textEn: "Delivery truck arrived in St Albans. Awaiting on-site handover inspection by client & installation crew." },
      { role: "thought", text: "此步驟為人機交互點 3。等待客户或現場團隊在平板會員後台點击“驗收合格並簽字”。", textEn: "Human-in-the-loop Gate 3. Awaiting client or field lead to click 'Accept Handover & Sign' on mobile tablet." }
    ],
    "S17": [
      { role: "thought", text: "客户現場簽字，交付圓滿驗收！", textEn: "Handover signed by client successfully. Delivery accomplished!" },
      { role: "action", text: "調用 RAG 歸檔技能。將本項目的中英雙語規格書、Change Log、三方詢價比價表、AI CV 質檢合格證、熏蒸證明和最終付款劃線賬單全部打包，生成一個 256 位加密的安全審計 Hash 值寫入 Supabase。", textEn: "Invoked RAG archiving skill. Packaged bilingual spec sheets, Change Tracker Logs, supplier comparisons, AI CV certificates, IPPC certificates, and recalculated final invoices. Generated a secure 256-bit audit hash in Supabase." },
      { role: "observation", text: "項目歸檔完畢。Crafton AI 17 階段完美閉环，感謝 Cho 與客户的合作！", textEn: "Project archiving finalized. Crafton AI 17-stage lifecycle complete. Special thanks to Cho and our clients!" }
    ]
  }
};

export default mockData;
