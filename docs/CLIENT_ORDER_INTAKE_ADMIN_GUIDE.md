# Client Order Intake 管理员使用说明

> 适用页面：Backoffice → Client Order Intake（S01–S05）
> 文档版本：2026-08-22
> 界面语言：按钮名称同时列出英文原文；切换中文后会显示对应中文翻译。

## 1. 先回答最关键的问题

目前系统已经采用“客户回复后由 AI 重新分析，再交给管理员审批”的闭环：

1. 系统从订单资料中找出缺失字段、待澄清问题和待确认图纸，并显示为 `Need action`。
2. 管理员检查问题后点击 `Request clarification`。
3. 问题会写入该客户的 Client Portal，订单状态改为“等待客户补充”。
4. 客户在 Client Portal 回答并保存后，服务器重新读取当前结构化项目、问题快照、客户答案，以及可用的来源文件文字。
5. AI 只生成有证据支持的字段补丁，更新项目草稿，并重新计算未解决问题。
6. 如果没有阻塞问题，草稿进入 `ready_for_approval`，等待管理员检查和批准；系统不会自动批准或自动创建 RFQ。
7. 如果仍有问题，只保留未解决或新发现的问题；本次 request 中尚未答完的问题会继续留在 Client Portal，新发现的问题则交给管理员决定是否发送。

换句话说：

```text
客户提交订单
  → 系统解析并发现 Need action
  → 管理员审核问题
  → Request clarification
  → 客户在 Client Portal 回答
  → AI 重新分析原资料 + 客户答案
  → 更新项目 / item 草稿并替换旧问题
  → 无阻塞：Ready for Cho approval
  → 仍有问题：返回管理员再次澄清
  → Approve checked package
  → Create RFQ package
  → 进入 S06 供应商询价
```

### “发送给客户”具体代表什么

当前按钮会把澄清问题保存到 Supabase，并显示在该客户的 Client Portal。它本身不等于发送电子邮件、LINE、WhatsApp 或短信；目前代码中没有发现这些外部通知动作。如果客户没有主动进入 Client Portal，还需要管理员用现有沟通渠道提醒客户。

- 项目顶部或 Approval 区的主 `Request clarification`：发送当前项目全部开放、且属于客户责任的问题。
- Project action 面板的发送按钮：只发送当前项目级问题。
- Item 面板的 `Request item clarification`：只发送当前 item 的问题。
- 三视图正式确认、系统内部审核和 `Internal review note` 不会作为客户问题发送。

### 客户回复后会发生什么

客户提交答案后，系统会先把该 intake job 改为 AI 分析中：

- `status = needs_review`
- `step = ai_clarification_reanalysis`
- `review_status = pending`

分析完成后会进入以下其中一种状态：

- `step = ai_reanalysis_ready_for_approval`：旧问题已解决、草稿已更新，等待 Cho 审批。
- `step = ai_reanalysis_clarification_required`：仍有未解决问题，等待 Cho 检查和再次澄清。
- `step = ai_reanalysis_failed`：答案已保存，但 AI 分析未完成，需要人工复核。

AI 会把已解决的问题从 `questions / open_questions` 移除，并保留问题、答案、变更摘要和分析结果的历史记录。正式项目资料仍需管理员点击 `Approve checked package` 后才生效。

## 2. `Need action` 代表什么

`Need action` 是当前项目需要有人作出决定或补充资料的事项总数，不是订单数量。它由三类事项组成：

1. **Project-level question**：影响整个项目，例如客户名称、送货地址、目标交付日期、全项目合规要求。
2. **Item-level question**：只属于某一个家具 item，例如 Outdoor Bar Stool 的木材品种、Outdoor Bistro Set 的数量定义。
3. **Drawing confirmation**：系统生成的三视图仍需管理员确认成为正式图纸。

系统会尝试根据问题中的 item 名称或 SKU，把问题放到对应 item。无法唯一匹配的问题会保留在项目层级。

示例：

- “Please confirm the delivery address” → Project-level action。
- “Please confirm the timber species for Outdoor Bar Stool” → Outdoor Bar Stool 的 item action。
- “System-generated drawing awaiting confirmation” → 对应 item 的 drawing action。

## 3. 页面从上到下说明

### 3.1 顶部全站导航

| 显示内容         | 作用                                         |
| ---------------- | -------------------------------------------- |
| The Crafton 标志 | 返回网站主入口。                             |
| 语言切换         | 切换中文或英文界面。                         |
| Client Portal    | 进入客户看到的项目页面，用于检查客户端体验。 |
| Backoffice       | 返回管理后台。                               |
| Sign Out         | 登出当前账户。                               |

### 3.2 左侧 Project Workflow

| 编号 | 阶段                                 | 说明                                                               |
| ---- | ------------------------------------ | ------------------------------------------------------------------ |
| 01   | Client Order Intake（S01–S05）       | 接收订单、补齐资料、生成 BOM / specification、图纸审核和项目批准。 |
| 02   | Supplier RFQ & Best Quote（S06–S08） | 发出询价、比较供应商报价、确定供应商。                             |
| 03   | Production Progress（S09–S11）       | 生产排程、生产跟踪和质检准备。                                     |
| 04   | Shipping & Handover（S12–S17）       | 出货、运输、交付和项目收尾。                                       |

点击左侧阶段会切换相应工作区。

### 3.3 项目工作区导航

| 显示或按钮                    | 作用                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Back to all client projects` | 返回 Order portfolio overview，重新选择客户项目。                                                                                |
| `Current project workspace`   | 显示当前正在操作的项目名称，防止在错误项目上操作。                                                                               |
| `S01`–`S05` 快捷按钮          | 选择 Intake 内部阶段。连接数据库时，这些按钮也可能同步项目的 `current_stage`，因此应按真实进度使用，不应只当作无影响的页面标签。 |

### 3.4 Active project 项目摘要

这里用于回答四个问题：现在处理哪个项目、项目有多大、资料是否齐全、下一步做什么。

| 指标             | 含义                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| `Pieces`         | 所有 line items 的数量总和。                                                            |
| `Line items`     | 合并后的家具款式 / 产品行数量，不等于总件数。                                           |
| `Brief complete` | 核心资料检查完成数 / 检查总数，例如客户、目的地、交期、item、尺寸材料、文件和开放问题。 |
| `Need action`    | 项目问题、item 问题和待确认图纸的合计数。                                               |

右上角主按钮会根据项目当前条件自动变化：

| 主按钮                     | 出现条件                                       | 作用                                                         |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `Request clarification`    | 仍有缺失资料或开放问题                         | 把当前项目的澄清问题发布到 Client Portal。                   |
| `Waiting for parsed items` | 系统尚未解析出 item                            | 暂时不可操作，等待订单解析结果。                             |
| `Generate BOM & spec`      | 没有阻塞问题、已有 item，但 BOM 尚未生成       | 把 item 资料保存为项目 BOM / bilingual specification draft。 |
| `Review N drawings`        | 客户问题已解决，但仍有系统生成图纸待确认       | 打开图纸审核区，逐项确认正式图纸。                           |
| `Approve checked package`  | BOM 已生成，或 AI 已更新草稿并确认没有阻塞问题 | 完成 Cho 对 BOM、规格和图纸资料包的审核。                    |
| `Create RFQ package`       | Intake 已批准                                  | 创建供应商 RFQ 草稿并进入 S06。                              |
| `Open RFQ workspace`       | RFQ 已存在                                     | 打开 Supplier RFQ & Best Quote 工作区。                      |

### 3.5 Project Stage（S01–S05）

| 阶段               | 页面含义                     | 完成标准                                   |
| ------------------ | ---------------------------- | ------------------------------------------ |
| S01 Order brief    | 已收到客户订单和来源文件     | 有可识别的项目 / 订单来源。                |
| S02 Gap review     | 检查资料缺口                 | 所有阻塞问题已解决。                       |
| S03 BOM & drawings | 生成 BOM、规格草稿并审核图纸 | BOM 已生成，关键图纸已确认。               |
| S04 Approval       | Cho 最终审核                 | 规格、尺寸、材料、图纸和备注已核对并批准。 |
| S05 RFQ            | 准备询价包                   | 已创建 RFQ package，可进入 S06。           |

深色 / 已完成线表示已通过的阶段；当前阶段会突出显示；浅色表示尚未开始。

### 3.6 Project information needs attention

这个提示只在存在项目级问题时显示，例如送货地址、交期或全项目合规标准。

- `Review project action`：打开右侧项目问题面板。
- 面板中的 `Send clarification request`：把澄清请求写入 Client Portal。
- `×` 或点击遮罩：关闭面板，不保存或发送任何内容。

项目级问题不会重复放在每一个 item 后面，目的是避免同一问题出现多次。

### 3.7 Line items

这是页面的主要工作区，每一行代表一个家具 item。

#### 筛选按钮

| 按钮          | 作用                                 |
| ------------- | ------------------------------------ |
| `All`         | 显示所有 items。                     |
| `Need action` | 只显示有问题或有待确认图纸的 items。 |
| `Ready`       | 只显示当前没有 action 的 items。     |

#### 每列含义

| 列            | 含义                                                                         |
| ------------- | ---------------------------------------------------------------------------- |
| Item          | 产品缩略图、名称和 SKU / item code。                                         |
| Qty           | 数量。                                                                       |
| Specification | 主要材料与尺寸；`To confirm` / `Pending` 表示仍未确定。                      |
| Drawing       | 三视图缩略图和状态。点击缩略图可在新页面打开。                               |
| Decision      | 显示 `Need action · N` 或 `View details`，点击后打开该 item 的右侧详情面板。 |

#### Drawing 状态

| 状态         | 含义                         |
| ------------ | ---------------------------- |
| `Formal`     | 已确认并发布为正式图纸。     |
| `Review`     | 系统已生成，等待管理员检查。 |
| `Generating` | 正在生成。                   |
| `Pending`    | 尚未生成或没有可用图纸。     |

### 3.8 Item 右侧详情面板

面板显示当前 item 的：

- 产品 / 图纸预览；
- 数量、尺寸、材料、finish / color；
- 只属于该 item 的澄清问题；
- 图纸状态。

按钮作用：

| 按钮                         | 作用                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `Request item clarification` | 只把当前 item 面板内的问题作为本次 request 快照发送给客户；项目的其他开放问题仍会保留在后台。       |
| `Confirm as formal drawing`  | 将该 item 的系统生成图纸确认并发布为正式图纸。只有图纸状态为 `Review / system_generated` 时才出现。 |
| `×`                          | 关闭详情面板。                                                                                      |

### 3.9 Secondary project information 折叠区

为了保持主页面精简，次要信息默认收起。

#### Source order & documents

显示客户、送货目的地、目标交付日期、提交日期和客户上传的 PDF / 图片 / 参考文件。用于回看订单依据，不负责修改数据。

#### BOM & drawing review

以卡片方式集中显示所有 item 的图纸和当前状态。点击卡片会打开同一个 item 详情面板。

#### Client answers & AI re-analysis

客户回复后显示，内容包括：

- AI 分析状态；
- 已回答、已解决和仍未解决的问题数量；
- 客户的逐条答案；
- AI 对项目和 item 草稿所做的字段变更摘要；
- 是否已经 `Ready for Cho approval`。

#### Approval & review note

显示 S04 审批记录、审核备注和最终审批按钮。

| 控件                      | 作用                                                                           |
| ------------------------- | ------------------------------------------------------------------------------ |
| `Internal review note`    | 填写只供内部审核使用的说明；它不再合并进发送给客户的 clarification questions。 |
| `Request clarification`   | 当仍有缺失资料时，把问题发布到 Client Portal。没有缺失问题时按钮禁用。         |
| `Approve checked package` | 批准已检查的 BOM / specs。存在开放问题、没有 BOM rows 或正在保存时按钮禁用。   |

### 3.10 页面状态提示

页面底部或相关按钮附近会显示操作结果，例如：

- clarification request 已发布；
- BOM 已生成或被问题阻塞；
- 图纸确认成功 / 失败；
- 审批保存成功 / 失败；
- RFQ package 已创建。

看到成功提示后再离开页面；如果出现 Supabase 错误，应先保留现场并检查网络或数据库记录。

## 4. 客户在 Client Portal 会看到什么

管理员发起 clarification 后：

1. 全项目问题显示在 `Project action`。
2. item 问题显示在对应产品行的 `Need action`。
3. 客户点击按钮后，右侧 action sheet 显示问题和回答框。
4. 客户填写答案并点击 `Save answer` / `Submit answers to Cho`。
5. 答案保存后，页面提示 AI 正在重新检查项目。
6. AI 更新草稿后，已解决的问题会关闭；尚未回答或回答不充分的原问题会继续显示，直到完成或转交 Cho 复核。

当前提交规则允许客户在“至少填写一个答案”后提交。因此管理员不能因为看到“客户已提交”就默认所有问题都有答案，必须逐条检查。

## 5. 建议管理员标准操作流程（SOP）

### A. 第一次打开项目

1. 核对项目名称、客户、目的地和订单数量。
2. 查看 `Brief complete` 和 `Need action`。
3. 先处理 `Project information needs attention`。
4. 使用 `Need action` 筛选，只检查有问题的 items。
5. 打开每个 item，核对规格、问题和系统生成图纸。

### B. 发起客户澄清

1. 检查每条问题是否是客户能直接回答的句子；一条问题最好只要求一个决定。当前页面没有逐条编辑问题的控件，需要修改时应回到问题的数据来源或问题配置处理。
2. 避免把内部判断、成本讨论或供应商信息写入 `Internal review note`。
3. 检查项目级问题和所有 item 问题，避免重复。
4. 点击一次 `Request clarification`。
5. 看到成功提示后，用现有沟通渠道提醒客户进入 Client Portal。

### C. 客户回复后

1. 打开 `Client answers & AI re-analysis`，检查客户逐条答案。
2. 查看 AI 的 change summary，并比对客户原文件、item 规格和图纸。
3. 如果状态为 `ready_for_approval`，检查更新后的 BOM / specs；如果主按钮显示 `Review N drawings`，先确认所有系统生成图纸，然后审批。
4. 如果状态为 `clarification_required`，检查剩余问题，再从项目或 item 位置发送下一次 clarification。
5. 如果状态为 `failed`，答案仍会保留，但必须由管理员人工复核。

### D. 进入下一阶段

1. 如果项目未经 AI 自动更新，点击 `Generate BOM & spec`；如果 AI 已标记 `ready_for_approval`，草稿会直接进入审批准备状态。
2. 检查 BOM rows、数量、尺寸、材料、finish、SKU 和三视图。
3. 对正确的系统图纸点击 `Confirm as formal drawing`。
4. 点击 `Approve checked package` 完成 S04。
5. 点击 `Create RFQ package`，进入 S06 供应商询价。

## 6. 当前版本的边界与注意事项

1. **AI 更新的是待审批草稿。** 正式 specifications 仍需 Cho 批准，AI 不会自动批准或进入 RFQ。
2. **客户可以逐条保存答案。** AI 会在每次保存后重新分析；未回答或回答不充分的原问题会继续留在 Client Portal，不会被错误标记为完成。
3. **AI 失败时采用安全降级。** 客户答案仍会保存，并进入人工审核，不会自动解除阻塞。
4. **超大来源文件采用结构化结果。** 默认超过 30 MB 的文件不会在客户提交时再次完整下载，而使用首次 intake 已提取的结构化资料重新分析。
5. **图片项目使用首次视觉分析结果。** 文字重分析会参考已有 `visual_analysis` 和结构化 item，不会把图片外观当作可证明的材料、尺寸或合规证据。
6. **没有外部消息通知。** clarification 只进入 Client Portal，不会自动发送邮件或即时通讯提醒。
7. **S01–S05 快捷按钮可能写入当前阶段。** 连接 Supabase 时应避免为了浏览而随意点击错误阶段。

## 7. 已实现闭环与后续优化方向

当前已实现：

```text
Open question
  → Sent to client
  → Client answered
  → AI re-analysing
  → Ready for Cho approval / Clarification required
  → Cho approved
```

后续仍可补充：

- 增加逐条 `Accept / Reopen`，让管理员能覆盖 AI 的问题判断。
- 允许管理员在发送前逐条勾选和编辑问题。
- 要求客户所有必答问题完成后才能提交。
- 可选增加邮件 / WhatsApp / LINE 通知，并记录送达时间。
- 在历史记录中加入更完整的管理员接受 / 重开审计事件。

## 8. 状态速查

| 系统状态             | 管理含义                        | 下一步                        |
| -------------------- | ------------------------------- | ----------------------------- |
| `pending`            | 等待 Cho 审核，或客户答案已交回 | 管理员检查资料 / 答案。       |
| `revision_requested` | 等待客户补充                    | 客户进入 Client Portal 回答。 |
| `approved`           | Intake 规格已批准               | 创建 RFQ package。            |
| `rejected`           | Intake 被拒绝                   | 修订或停止该 intake。         |
| `rfq_ready`          | RFQ 草稿已准备                  | 打开 S06 RFQ workspace。      |

AI clarification workflow 另外记录：

| AI 状态                  | 含义                                      |
| ------------------------ | ----------------------------------------- |
| `awaiting_client`        | 问题已发布到 Client Portal。              |
| `analyzing`              | 客户答案已收到，正在重新分析。            |
| `ready_for_approval`     | 草稿已更新且没有阻塞问题，等待 Cho 批准。 |
| `clarification_required` | 仍有未解决或新发现的问题。                |
| `failed`                 | 答案已保存，AI 分析需要人工接手。         |
| `manual_review_required` | 本地 / 演示环境没有执行服务器 AI 分析。   |

## 9. 技术来源

本说明按当前实现核对，主要逻辑位于：

- `src/app.jsx` → `handleAskClientForRevision`
- `src/app.jsx` → `handleSubmitClientAnswers`
- `server/lib/intakeClarificationReanalysis.mjs` → AI 重分析、字段补丁、问题替换与审计历史
- `server/ai-support-server.mjs` → `reanalyze_intake_clarifications` API action
- `src/app.jsx` → `handleGenerateBomDraft`
- `src/app.jsx` → `handleApproveIntakeReview`
- `src/app.jsx` → `handleCreateRfqDraft`
- `src/app.jsx` → `renderIntakeFlowWorkspace`
- `src/components/ClientOrderDashboard.jsx` → Client Portal action sheet

当上述工作流代码发生改变时，应同步更新本说明文档。
