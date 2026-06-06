export const TRANSLATIONS = {
  cn: {
    // Header
    title: "3D 家具智能装柜优化系统",
    subtitle: "Sandra Logistics & Sales Assistant Pro",
    engineTitle: "算法核心引擎:",
    fastMode: "极速估算模式 (Fast Mode)",
    maxMode: "极限装载模式 (Max Mode)",
    fastDesc: "极速装载：秒级出库量评估，适合前端销售报价",
    maxDesc: "极限装载：多维遗传启发式算法，榨干集装箱空间",
    recalculate: "重新计算 (Recalculate)",
    statusStable: "Stable & Certified",
    noLoadingResult: "请录入货物或选用预设套件一键计算 3D 载重图",

    // Sidebar Left - Panel 1
    panel1Header: "1. 货柜参数设置",
    containerSpecLabel: "货柜规格选项",
    customContainer: "自定义货柜...",
    length: "长 (Length, mm)",
    width: "宽 (Width, mm)",
    height: "高 (Height, mm)",
    payload: "最大承重 (Payload, kg)",

    // Sidebar Left - Panel 2
    panel2Header: "2. 预设套件一键加载",
    presetSub: "销售与物流主管快速演示装柜效果：",
    batchImport: "批量导入 / 飞书数据对接",

    // Sidebar Left - Panel 3
    panel3Header: "3. 手动录入/修改 SKU",
    skuName: "SKU 名称",
    skuPlaceholder: "例如: Solid Wood Chair",
    packingQty: "打包数量 (件)",
    unitWeight: "单箱重量 (kg)",
    stackingPriority: "承重等级",
    heavyBottom: "重底货 (3)",
    mediumMiddle: "中架货 (2)",
    lightTop: "轻顶货 (1)",
    skuColor: "SKU 标志色",
    allowSide: "允许侧放 (Side)",
    allowFlip: "允许倒置 (Flip)",
    addItemBtn: "添加此货物到清单",

    // Sidebar Left - Cargo List
    cargoListTitle: "清单列表",
    cargoTypes: "种",
    cargoTotal: "总计",
    cargoPcs: "件",
    emptyCargo: "清单为空，请点击预设一键加载",
    noSide: "防侧放",
    noFlip: "防倒置",
    heavy: "重底",
    medium: "中架",
    light: "轻顶",

    // Sidebar Right - Panel 4
    panel4Header: "4. 货柜选用方案",
    totalContainers: "共 {count} 个柜",
    tabContainer: "柜 {idx}",
    rolloverNotice: "自动分拨：货物超过单柜上限，已依次分拨至后续货柜中。",

    // Sidebar Right - Optimizing Status
    optimizingHeader: "引擎深度求解中...",
    calculating: "正在计算",
    bestUtilization: "最佳利用率",
    elapsedTime: "用时",

    // Sidebar Right - Metrics
    utilizationTitle: "空间利用率",
    loadedVol: "已装载体积",
    totalVol: "货柜总体积",

    // Sidebar Right - Panel 5
    panel5Header: "5. 载重及配载安全",
    cargoWeightLabel: "货物载重重量",
    overweightWarning: "警告：已超重！请考虑增加集装箱。",

    // Sidebar Right - Panel 6
    panel6Header: "6. 货柜重心分布",
    seaBalanceIndex: "海运平衡指数 (重心偏离中心点百分比)：",
    xAxisShift: "长轴偏离 (X Shift)",
    yAxisShift: "横轴偏离 (Y Shift)",
    cogExcellent: "极度平衡 (Excellent)",
    cogSafe: "适度偏离 (Safe)",
    cogDanger: "严重倾斜 (Unbalanced)",
    noResult: "无可用装载结果",

    // Sidebar Right - Unpacked Remainder
    unpackedHeader: "待处理未装箱件",
    unpackedWarning: "检测到有 {count} 件货物因重量或极端尺寸超出当前任何集装箱空间限制，无法成功装入。",
    unpackedAdvice: "建议：切换为容量更大的 40HQ 柜型，或者调配第二个柜子。",

    // Importer Modal
    importTitle: "批量货物导入系统",
    importSubtitle: "唯一事实源 (SSOT) 一键同步接入",
    tabExcel: "Excel / 文本剪贴板",
    tabLark: "飞书多维表格 (Lark Base)",
    pasteLabel: "请将 Feishu/Excel 的行数据直接复制并粘贴在下方：",
    loadTemplate: "载入样例模版",
    pastePlaceholder: "格式示例：\nSKU_名称\\t长(mm)\\t宽(mm)\\t高(mm)\\t数量\\t重量(kg)\\n胡桃木柜\\t2000\\t600\\t800\\t4\\t45",
    importNote: "数据列必须用 Tab (即在 Excel 中复制一行的默认分隔符) 分隔，列顺序：SKU名称、长、宽、高、数量、重量、承重。",
    cancel: "取消",
    confirmImport: "确认解析导入",
    larkNotice: "直接对接 Sandra 老师的企业级飞书多维表格数据库。以下接口参数已通过沙箱验证：",
    appIdLabel: "飞书应用凭证 (App ID)",
    tableIdLabel: "多维数据表 (Table ID)",
    schemaMapping: "Feishu 字段映射架构 (Schema Mapping):",
    larkFetchLoading: "同步拉取中...",
    larkFetchBtn: "一键拉取 Lark 事实源",
    emptyError: "请先在文本框中粘贴数据",
    parseError: "未识别到有效格式数据。请检查每列是否以 Tab (制表符) 分隔，并包含长、宽、高、数量。",

    // ThreeViewer
    containerBack: "← 柜尾 (CONTAINER BACK)",
    containerDoor: "柜门 (DOOR FRONT) →",
    sopSeq: "排装次序",
    dimensions: "尺寸 (L×W×H)",
    position: "摆放位置",
    unitWeightLabel: "单箱重量",
    stackingGradeLabel: "承重等级",
    heavyBottomLabel: "重型底货 (Heavy)",
    mediumMiddleLabel: "中型架货 (Medium)",
    lightTopLabel: "轻型顶货 (Light)",
    resetBtn: "返回初始",
    prevBtn: "上一步",
    pauseBtn: "暂停",
    autoLoadBtn: "自动演示 SOP",
    nextBtn: "下一步",
    showAllBtn: "显示全部",
    loadStep: "装载步骤",
    loadSpeed: "装载速度"
  },
  en: {
    // Header
    title: "3D Volumetric Furniture Packing Optimizer",
    subtitle: "Sandra Logistics & Sales Assistant Pro",
    engineTitle: "Core Solver Engine:",
    fastMode: "Fast Est. Mode",
    maxMode: "GA Max Mode",
    fastDesc: "Fast packing: second-level evaluation, ideal for sales quotation",
    maxDesc: "Max packing: multi-dimensional genetic heuristics, squeeze every inch of container space",
    recalculate: "Recalculate",
    statusStable: "Stable & Certified",
    noLoadingResult: "Please enter items or choose a preset template to calculate 3D loading map",

    // Sidebar Left - Panel 1
    panel1Header: "1. Container Parameters",
    containerSpecLabel: "Container Spec Options",
    customContainer: "Custom Container...",
    length: "Length (mm)",
    width: "Width (mm)",
    height: "Height (mm)",
    payload: "Payload Capacity (kg)",

    // Sidebar Left - Panel 2
    panel2Header: "2. Preset Furniture Templates",
    presetSub: "Logistics and Sales quick loading visualizer demo:",
    batchImport: "Batch Import / Lark Integration",

    // Sidebar Left - Panel 3
    panel3Header: "3. Manual Entry / Edit SKU",
    skuName: "SKU Name",
    skuPlaceholder: "e.g., Solid Wood Chair",
    packingQty: "Quantity (pcs)",
    unitWeight: "Unit Weight (kg)",
    stackingPriority: "Stacking Priority",
    heavyBottom: "Heavy Bottom (3)",
    mediumMiddle: "Medium Middle (2)",
    lightTop: "Light Top (1)",
    skuColor: "SKU Indicator Color",
    allowSide: "Allow Side Laying",
    allowFlip: "Allow Upside Down",
    addItemBtn: "Add Item to List",

    // Sidebar Left - Cargo List
    cargoListTitle: "Cargo List",
    cargoTypes: "SKUs",
    cargoTotal: "Total",
    cargoPcs: "pcs",
    emptyCargo: "Cargo list is empty. Load a preset to begin!",
    noSide: "No Side",
    noFlip: "No Flip",
    heavy: "Heavy",
    medium: "Medium",
    light: "Light",

    // Sidebar Right - Panel 4
    panel4Header: "4. Multi-Container Scheme",
    totalContainers: "Total {count} container(s)",
    tabContainer: "Container {idx}",
    rolloverNotice: "Auto Roll-over: total cargo exceeds single container limits. Rolled over to subsequent containers sequentially.",

    // Sidebar Right - Optimizing Status
    optimizingHeader: "GA Solver Deep Solving...",
    calculating: "Analyzing",
    bestUtilization: "Best Util.",
    elapsedTime: "Time",

    // Sidebar Right - Metrics
    utilizationTitle: "Space Utilization",
    loadedVol: "Packed Volume",
    totalVol: "Total Volume",

    // Sidebar Right - Panel 5
    panel5Header: "5. Load & Weight Distribution",
    cargoWeightLabel: "Cargo Load Weight",
    overweightWarning: "WARNING: Container overweight! Consider adding a second container.",

    // Sidebar Right - Panel 6
    panel6Header: "6. Gravity Center Distribution",
    seaBalanceIndex: "Maritime Balance Index (Shift % from Center Point):",
    xAxisShift: "X-Axis Shift (Length)",
    yAxisShift: "Y-Axis Shift (Width)",
    cogExcellent: "Excellent Balance",
    cogSafe: "Safe / Moderate Shift",
    cogDanger: "Unbalanced / Dangerous",
    noResult: "No loading result available",

    // Sidebar Right - Unpacked Remainder
    unpackedHeader: "Unpacked Remainder",
    unpackedWarning: "Detected {count} item(s) that could not fit into any container due to excessive weight or extreme dimension constraints.",
    unpackedAdvice: "Advice: Change to a larger container (e.g. 40HQ) or add an extra container to the plan.",

    // Importer Modal
    importTitle: "Batch Cargo Import Console",
    importSubtitle: "Single Source of Truth (SSOT) Sync Portal",
    tabExcel: "Excel / Text Clipboard",
    tabLark: "Lark Base (Feishu Sheet)",
    pasteLabel: "Copy and paste spreadsheet rows directly below:",
    loadTemplate: "Load Example Template",
    pastePlaceholder: "Format Example:\nSKU_Name\\tLength_MM\\tWidth_MM\\tHeight_MM\\tQuantity\\tWeight_KG\\nWalnut Wardrobe\\t2000\\t600\\t800\\t4\\t45",
    importNote: "Columns must be Tab-separated (standard Excel copy format) in order: SKU Name, Length, Width, Height, Quantity, Weight, Stacking Priority.",
    cancel: "Cancel",
    confirmImport: "Parse & Import Data",
    larkNotice: "Connect directly to Sandra's enterprise Lark Base database. The following credentials are sandbox verified:",
    appIdLabel: "Lark App ID Credentials",
    tableIdLabel: "Multidimensional Table ID",
    schemaMapping: "Lark Base Schema Field Mapping:",
    larkFetchLoading: "Syncing Lark Base...",
    larkFetchBtn: "Fetch Lark Live Source",
    emptyError: "Please paste data into the textbox first",
    parseError: "Could not identify valid data format. Verify columns are Tab-separated and include length, width, height, and quantity.",

    // ThreeViewer
    containerBack: "← CONTAINER BACK",
    containerDoor: "DOOR FRONT →",
    sopSeq: "SOP Sequence",
    dimensions: "Dimensions (L×W×H)",
    position: "Position",
    unitWeightLabel: "Unit Weight",
    stackingGradeLabel: "Stacking Grade",
    heavyBottomLabel: "Heavy Stacking (3)",
    mediumMiddleLabel: "Medium Stacking (2)",
    lightTopLabel: "Light Stacking (1)",
    resetBtn: "Reset",
    prevBtn: "Previous",
    pauseBtn: "Pause",
    autoLoadBtn: "Auto Play SOP",
    nextBtn: "Next",
    showAllBtn: "Show All",
    loadStep: "Load Step",
    loadSpeed: "Load Speed"
  }
};
