# The Crafton Craft Design System

版本：1.0  
状态：网站 UI 改造基线  
视觉来源：`public/thecrafton_draft_site/` 中 Cho 提供的首页、Set Furniture、Stand Collection 与 Client Studio 页面

## 1. 设计定位

The Crafton 的视觉不应只是“高端家具网站”，而应让人同时感受到三件事：

1. 家具有材料温度与手工痕迹；
2. 制造过程精确、可控、可追踪；
3. 品牌像一个可靠的 maker of record，而不是一个装饰性的生活方式品牌。

因此整体方向定义为：

> Warm workshop editorial — 温暖的纸张与木材、编辑式排版，以及来自工程图纸的秩序感。

关键词：Craft、Measured、Honest、Editorial、Accountable、Warm Precision。

## 2. 视觉原则

### 2.1 让结构可见

- 页面底层使用 46px 工程网格，表达测量、绘图和制造过程。
- 分区依靠细线、留白和背景切换，而不是大量阴影与悬浮卡片。
- 编号、规格和状态必须成为视觉层级的一部分。

### 2.2 让材料成为主角

- 家具与空间图片承担主要视觉重量。
- 图片保持真实材质、自然光和低饱和度，不叠加强烈滤镜。
- UI 不使用装饰性渐变、霓虹、高光玻璃或科技蓝。

### 2.3 区分“叙事”与“规格”

- 品牌故事、页面标题、家具名称使用编辑感衬线字体。
- 正文、说明与表单使用清晰的无衬线字体。
- 阶段、编号、价格、尺寸、标签与状态使用等宽字体。

### 2.4 克制，而不是空白

- 每一个装饰元素都必须回应 craft：纸张、网格、定位、编号、材料或工序。
- 卡片默认不依赖厚重阴影；只有可点击的重点对象在 hover 时轻微上移。
- 圆角保持小而建筑化，避免通用 SaaS 的大圆角卡片感。

## 3. 颜色系统

### 3.1 品牌色

| Token | 值 | 用途 |
| --- | --- | --- |
| `--craft-paper` | `#EFE7D6` | 页面主底色、工程网格画布 |
| `--craft-cream` | `#FBF6EC` | 内容区、表单、卡片与高亮纸张 |
| `--craft-walnut` | `#4A3525` | 主按钮、导航、深色分区、品牌强调 |
| `--craft-walnut-dark` | `#33251A` | Footer、深色控制台与高对比区域 |
| `--craft-ink` | `#232220` | 主文字、标题与图标 |
| `--craft-stone` | `#786C5D` | 次级文字、规格说明与禁用状态 |
| `--craft-line` | `rgba(35,34,32,.14)` | 分隔线、卡片边框与表格线 |
| `--craft-grid` | `rgba(35,34,32,.075)` | 亮色工程网格 |
| `--craft-success` | `#4A6B4F` | 已完成、通过、正常状态 |
| `--craft-warning` | `#9A5D3D` | 待确认、人工检查与提醒 |
| `--craft-danger` | `#8B5148` | 阻断、失败与风险状态 |

### 3.2 使用比例

- 60%：Paper / Cream
- 25%：图片和真实材料色
- 10%：Ink / Stone
- 5%：Walnut 与语义状态色

Walnut 是控制色，不应大面积覆盖所有内容。大面积深色只用于 CTA、Footer、重要流程节点和 Backoffice 的高风险控制面。

### 3.3 对比度

- 正文优先使用 Ink 或不低于 `#5B5446` 的深色。
- Stone 仅用于 12px 以上的辅助文字；更小的 Mono 标签必须使用 Walnut 或 Ink。
- 深色底上的正文使用 Cream；辅助文字使用 `#E8DCC8`。

## 4. 字体系统

### 4.1 字体角色

| 角色 | 字体 | 用途 |
| --- | --- | --- |
| Display | Fraunces / Noto Serif SC / Songti SC | Hero、H1、H2、家具名称、重点数字 |
| Body | Inter / Noto Sans SC / PingFang SC | 正文、表单、说明、按钮 |
| Specification | JetBrains Mono / SFMono-Regular | 编号、状态、规格、价格、筛选与元数据 |

### 4.2 排版尺度

| 层级 | Desktop | Mobile | 建议 |
| --- | --- | --- | --- |
| Hero Display | 64–72px | 42–50px | Fraunces Italic，行高 0.98–1.05 |
| H1 | 52–64px | 38–46px | 页面级标题 |
| H2 | 40–52px | 30–38px | 分区标题 |
| H3 | 24–32px | 22–28px | 卡片与产品标题 |
| Body Large | 17–18px | 16–17px | 关键说明 |
| Body | 15–16px | 15–16px | 正文 |
| Mono Label | 11–12px | 11–12px | 全大写，字距 0.12–0.18em |

### 4.3 中英文规则

- 英文 Display 可使用 Italic；中文标题使用宋体/思源宋体常规字形，不强制伪斜体。
- 中文正文不增加过大的 tracking。
- 英文 Mono 标签全大写；中文标签保持正常字形，可保留较小字距。
- 不允许 10px 以下的可读信息。

## 5. 背景与空间

### 5.1 工程网格

- 基准尺寸：46px × 46px。
- 线宽：1px。
- 亮色画布透明度：7.5%。
- 深色画布透明度：6%。
- 网格用于页面画布、Hero、空状态和重要 CTA，不进入正文卡片内部。

### 5.2 容器

- Marketing 最大宽度：1200px。
- Portal / Catalog 最大宽度：1360–1600px。
- Desktop 横向边距：46–64px。
- Tablet 横向边距：28–32px。
- Mobile 横向边距：18–20px。

### 5.3 间距节奏

- 基础单位：4px。
- 常用组件间距：8 / 12 / 16 / 24 / 32px。
- 分区间距：64 / 80 / 96px。
- 营销页面应有较大的垂直呼吸；Portal 与 Backoffice 使用更紧凑的 16 / 24 / 32px 节奏。

## 6. 形状与表面

### 6.1 圆角

- 图片与普通内容卡片：3–6px。
- Portal 信息卡：6–10px。
- 输入框：4–6px。
- Pill、筛选和主按钮：999px，仅用于操作控件。
- 禁止把所有容器统一成 16px 以上大圆角。

### 6.2 边框与阴影

- 默认边框：`1px solid var(--craft-line)`。
- 默认卡片无阴影。
- Hover：上移 2–3px，配合柔和木色阴影。
- Modal：允许使用更深的环境阴影以建立层级。

## 7. 核心组件

### 7.1 导航

- 92px 桌面高度，Sticky，Paper 半透明背景与轻微 blur。
- Logo 使用 Cho 提供的锤子字标；小空间可退化为文字字标。
- 导航项使用 Mono，12px，大写，1.2–1.5px 字距。
- 当前项用 Walnut 下划线或 2px 底边标识。
- 主动作使用 Walnut Pill；次动作使用透明细边框。

### 7.2 按钮

- Primary：Walnut 背景、Cream 字色、Pill 形态。
- Secondary：透明背景、Walnut 边框与文字。
- Tertiary：无容器，仅使用 Mono 标签与下划线。
- Hover 只做颜色、边框、阴影和 1–2px 位移，不做明显缩放。
- Focus 必须有可见的 2px Walnut 外框。

### 7.3 卡片

- Marketing 卡片优先使用图片＋标题＋Mono 元数据，不套白色大卡框。
- Portal 卡片使用 Cream 表面、细边框和 6–10px 圆角。
- Backoffice 卡片保持高密度，以分隔线和分组标题组织，不依赖阴影。

### 7.4 表单

- 标签使用 Mono，11–12px。
- 输入框为 Cream 或白色，最小高度 44px。
- Focus 使用 Walnut 边框与轻微外环。
- 错误信息必须包含文字，不只依赖颜色。

### 7.5 状态与进度

- 阶段编号和状态名称使用 Mono。
- 完成使用 Olive；人工处理使用 Terracotta；阻断使用 Dusty Red。
- 进度线保持细、平、可扫描，避免发光效果。

### 7.6 数据表格

- 表头使用 Mono，11px，全大写。
- 行高不低于 48px。
- 通过 Paper / Cream 的微弱层级区分表头与正文。
- Hover 仅改变背景，不改变布局。

## 8. 图片规范

- 优先使用真实家具、材料与空间摄影。
- 产品目录使用一致的 1:1 或 4:5 比例。
- 案例展示可使用 3:2、16:10 或编辑式混合网格。
- 图片裁切必须保留家具轮廓和材料细节，不拉伸、不截掉核心主体。
- 图片文字叠层只允许出现在下方渐隐区域，且必须保证可读性。
- Logo、产品和案例图片使用源文件，不以 CSS 图形或占位块代替。

## 9. 页面分层应用

### 9.1 Marketing

- 完整使用工程网格、品牌 Logo、Fraunces Display 和大幅家具图片。
- 区段以编号串联：Our Work、What We Make、How We Work、Global、CTA。
- 允许更大的空白和图片编排。

### 9.2 Set Furniture / Catalog

- 产品图优先，四列桌面网格，三列 Tablet，两列 Mobile。
- 筛选使用 Mono Pill。
- 产品名使用 Fraunces，规格和价格使用 Mono。

### 9.3 Client Portal

- 网格只放在页面画布，不进入表格和表单。
- Welcome、KPI 和项目名称可使用 Display；业务数据坚持 Body / Mono。
- 卡片更紧凑，重点保持可读性与任务完成效率。

### 9.4 Backoffice

- 继承颜色、字体角色、边框与状态系统。
- 不复制 Marketing 的大标题和大面积图片。
- Sidebar、表格、审核面板以技术工作台为主要感受。

## 10. 动效

- 标准过渡：`300ms cubic-bezier(.25,1,.5,1)`。
- 页面入场：轻微向上 12–18px，透明度 0→1。
- 图片 Hover：最大缩放 1.03–1.045。
- 卡片 Hover：上移 2–3px。
- 支持 `prefers-reduced-motion: reduce`，关闭非必要位移和缩放。

## 11. 可访问性

- 正文对比度达到 WCAG AA。
- 正文最小 15px；Mono 信息最小 11px。
- 所有可点击目标至少 44×44px。
- 键盘焦点始终可见。
- 图片必须提供有意义的 alt；纯装饰图片使用空 alt。
- 状态不能只依赖颜色，必须同时有文字或图形标签。
- 390px 宽度不得出现横向滚动、裁切标题或不可达主操作。

## 12. 禁止项

- 大面积纯白 SaaS Dashboard。
- 玻璃拟态、霓虹描边、科技蓝和高饱和渐变。
- 所有卡片统一大圆角＋大阴影。
- 用 emoji 作为功能图标。
- 在正文中滥用 Mono 或 Italic。
- 网格铺入每一张卡片，造成噪声。
- 为了“高级感”把可读文字缩得过小。

## 13. 实现映射

现有代码的 Token 对应关系：

| Existing | Cho Craft |
| --- | --- |
| `--bg-primary` | `--craft-paper` |
| `--bg-secondary` | `--craft-cream` |
| `--bg-tertiary` | `#E8DCC8` |
| `--accent-primary` | `--craft-walnut` |
| `--text-primary` | `--craft-ink` |
| `--text-secondary` | `#5B5446` |
| `--text-muted` | `--craft-stone` |
| `--font-tech` | Display / Fraunces |
| `--font-sans` | Body / Inter |
| 新增 `--font-mono` | Specification / JetBrains Mono |

落地顺序：

1. 全局 Token、字体和背景；
2. Navbar、按钮、输入框、卡片和状态；
3. Marketing Hero 与内容区；
4. Product / Material 页面；
5. Client Portal；
6. Backoffice；
7. 多视口与无障碍校验。
