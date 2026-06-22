# Crafton AI V1.1 Design System - Wabi-Sabi Luxury Editorial

本設計系統基於 **UI/UX Pro Max** 設計智能與您指定的全局色系進行了全新升級，將原有的奢華意式簡約風格（Italian Minimalist）與東方「侘寂（Wabi-Sabi）」美學相結合，展現出極致、安靜、高雅的高定家具事務所美學。

---

## 🎨 核心色彩標記 (Color Tokens)

本系統完全圍繞您指定的四大核心色彩進行構建：

| 色彩名稱 | 精確十六進制 | 用途定位 | 視覺聯想 |
| :--- | :--- | :--- | :--- |
| **雅白色 (Alabaster White)** | `#FAF7F2` | 全局背景、卡片高光、首頁底色 | 純淨大理石、天然細麻、未染色石膏 |
| **暖沙色 (Warm Sand)** | `#C5B4A5` | 次級背景、輔助邊框、低飽和裝飾色 | 托斯卡納沙灰、卡拉拉Travertine石材、天然亞麻織物 |
| **深木色 (Walnut Wood)** | `#422F25` | 主品牌色、高奢按鈕、強交互激活態 | 北美黑胡桃木、手工打磨柚木、奢華銅雕啞光 |
| **炭黑色 (Charcoal Black)** | `#1A1918` | 主體文本、高對比板塊、深色控制面板 | 玄武岩、碳化木（Shou Sugi Ban）、火山灰岩 |

### 🛠️ 擴展輔助色彩 (Functional Neutrals)
*   **次級雅白 (Soft Alabaster)**: `#F4F0EA` (卡片背景、灰色按鈕 hover)
*   **深沙色 (Muted Dune)**: `#A8988C` (次要文本、禁用狀態、細節線條)
*   **暖炭黑 (Warm Charcoal)**: `#2A2826` (副文字、輸入框對焦、黑底卡片背景)
*   **柔和青綠 (Low-sat Olive)**: `#7A8775` (成功、BOM 就緒、支付完成)
*   **柔和鐵紅 (Dusty Terracotta)**: `#A97C73` (警告、待付款、取消狀態)

---

## ✍️ 字體排版系統 (Typography)

字體採用 **Luxury Editorial (奢華社論/雜誌風)** 經典雙語配對，展現高級定製排布感。

*   **英文字體 (Serif Heading)**: `'Cormorant Garamond', Georgia, serif`
    *   *特性*：極致細長的襯線、高貴優雅的線條比例，完美契合高端家居和建築設計感。
*   **中文字體 (Sans Body)**: `'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif`
    *   *特性*：現代 Swiss 瑞士無襯線風格，清晰易讀、字重均勻，適合高密度業務看板和清單。

```css
/* Typography Scale Sample */
--fs-hero-title: 3.5rem;   /* 大字體標題 */
--fs-h1: 2.2rem;           /* 板塊大標題 */
--fs-h2: 1.5rem;           /* 卡片標題 */
--fs-body: 0.95rem;        /* 舒適閱讀正文 */
--fs-small: 0.8rem;        /* 細微日誌、BOM註解 */
```

---

## ✨ 交互與動態細節 (Micro-interactions & UX Guidelines)

依據 **UI/UX Pro Max** 專業規範，細節決定了 UI 的高級感，我們將強制執行以下交互約束：

### 1. 拒絕「即時切換」── 全局採用高奢阻尼動畫
*   禁止粗糙、無過渡的 UI 切換。
*   全局 hover、展開、漸變等效果必須使用以下 **Ease-Out Deceleration** 曲線（模仿高檔阻尼抽屜滑軌的順滑感）：
    ```css
    transition: all 300ms cubic-bezier(0.25, 1, 0.5, 1);
    ```

### 2. 拒絕表情符號 (No Emojis) ── 100% 採用純向量 SVG
*   首頁、導航欄、進度條、彈窗等所有地方一律禁止使用 🚀、⚙️、🎨、📁 等 Emoji 字符作為圖標。
*   統一採用精細的、寬度為 `1.5px` 的細線 **Lucide / SVG 向量圖標**。

### 3. 滑鼠反饋 (Interactive Cursor)
*   所有可點擊元件（按鈕、FAQ摺疊欄、材質配製器卡片、文件拖拽區）必須顯式配置 `cursor: pointer !important;`。
*   所有懸停態卡片不可使用劇烈的 `scale(1.1)` 導致網格抖動，而是採用 **微量平滑上移 (3px) + 柔和陰影擴散 (Soft Shadow Spread)**。

### 4. 圓角與間距控制 (Architectural Geometry)
*   遵循意式極簡建築的幾何學線條，圓角不宜過大（避免軟萌玩具感），卡片主體採用 `12px`，按鈕與標籤採用 `4px` 或 `8px`。
*   間距採用寬鬆的呼吸感留白，以 `1.5rem` (24px) 和 `3rem` (48px) 作為主要排版模矩。

---

## 🛠️ 技術實施對照表 (Code Alignment Checklist)

- [ ] 將 `:root` 變量替換為最新的雅白色、暖沙色、深木色、炭黑色。
- [ ] 全局按鈕、首頁 Banner、各組件邊框配色 100% 與 Design System 對齊。
- [ ] 檢查並替換現有 CSS 中粗糙的過渡效果為高阻尼過渡。
- [ ] 優化 FAQ 折疊面板，使用雅白底、暖沙邊框、深木對焦，箭頭平滑旋轉。
- [ ] 優化 Page 10 註冊登入頁，使用深木色按鈕、暖沙色邊框，烘托尊貴質感。
- [ ] 優化 OpenClaw 綠字控制台，在外框加上深木色雕琢紋路與柔和陰影，使其完美融入暖色基調。
