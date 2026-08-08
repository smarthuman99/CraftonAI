import React, { useEffect, useMemo, useState } from "react";

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const copy = (lang, cn, en) => (lang === "Cn" ? cn : en);

const formatDate = (value, lang) => {
  if (!value) return copy(lang, "日期待确认", "Date pending");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(lang === "Cn" ? "zh-HK" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
};

const parseQuantity = (value) => {
  const match = String(value || "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const getItemQuantity = (item) => Number(item?.qty || 0) || parseQuantity(item?.qtyDisplay);

const formatMoney = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const getJobQuantity = (job) => {
  const itemTotal = (job.items || []).reduce((total, item) => total + getItemQuantity(item), 0);
  return itemTotal || parseQuantity(job.quantityText);
};

const getOrderStage = (job) => {
  const status = String(job.status || "").toLowerCase();
  const reviewStatus = String(job.reviewStatus || "").toLowerCase();
  const rfqStatus = String(job.rfqStatus || "").toLowerCase();

  if (["delivered", "shipping", "shipped", "dispatch"].includes(status)) return 4;
  if (["in_production", "production", "manufacturing", "quality_check", "packing"].includes(status)) return 3;
  if (["ready", "sent", "priced"].includes(rfqStatus) || ["approved", "rfq_ready"].includes(reviewStatus)) return 2;
  if (reviewStatus === "revision_requested" || reviewStatus === "pending" || status === "needs_review") return 1;
  return 0;
};

const getOrderStatus = (job, lang) => {
  const status = String(job.status || "").toLowerCase();

  if (["delivered"].includes(status)) {
    return { label: copy(lang, "已交付", "Delivered"), tone: "complete" };
  }
  if (["shipping", "shipped", "dispatch"].includes(status)) {
    return { label: copy(lang, "运输中", "In transit"), tone: "progress" };
  }
  if (["in_production", "production", "manufacturing", "quality_check", "packing"].includes(status)) {
    return { label: copy(lang, "制造中", "In production"), tone: "progress" };
  }
  if (job.reviewStatus === "revision_requested") {
    return { label: copy(lang, "需要您补充资料", "Your input needed"), tone: "action" };
  }
  if (["ready", "sent", "priced"].includes(job.rfqStatus) || job.reviewStatus === "rfq_ready") {
    return { label: copy(lang, "正式报价准备中", "Quotation in progress"), tone: "progress" };
  }
  if (job.reviewStatus === "approved") {
    return { label: copy(lang, "规格已确认", "Specifications confirmed"), tone: "complete" };
  }
  if (job.reviewStatus === "pending" || job.status === "needs_review") {
    return { label: copy(lang, "规格审核中", "Specification review"), tone: "progress" };
  }
  return { label: copy(lang, "已接收", "Brief received"), tone: "neutral" };
};

const getStageDetail = (job, lang) => {
  const stage = getOrderStage(job);
  const details = [
    copy(lang, "需求与附件已安全接收。", "Your brief and attachments have been received."),
    copy(lang, "Crafton 正在整理尺寸、材质及合规要求。", "Crafton is reviewing dimensions, materials and compliance."),
    copy(lang, "规格已确认，客户报价正在准备。", "Specifications are confirmed and your quotation is being prepared."),
    copy(lang, "订单已进入制造、质检或包装阶段。", "Your order is in manufacturing, quality control or packing."),
    copy(lang, "订单已进入运输或完成交付。", "Your order is in transit or has been delivered.")
  ];
  return details[stage];
};

const isActionNeeded = (job) =>
  job.reviewStatus === "revision_requested" || ((job.questions || []).length > 0 && job.reviewStatus !== "approved");

const getProjectImage = (project) => {
  for (const job of project.jobs || []) {
    const itemImage = (job.items || []).find((item) => item.imageUrl)?.imageUrl;
    if (itemImage) return itemImage;
    if (job.previewUrl) return job.previewUrl;
  }
  return "";
};

const getProjectStage = (project) => Math.max(...project.jobs.map(getOrderStage), 0);

const getProjectStatus = (project, lang) => {
  const actionJob = project.jobs.find(isActionNeeded);
  if (actionJob) return getOrderStatus(actionJob, lang);
  const latestStageJob = [...project.jobs].sort((a, b) => getOrderStage(b) - getOrderStage(a))[0];
  return getOrderStatus(latestStageJob || project.jobs[0], lang);
};

function ProductImage({ src, alt, className = "" }) {
  if (src) return <img className={className} src={src} alt={alt} loading="lazy" />;
  return (
    <span className={`cho-client-image-placeholder ${className}`} aria-hidden="true">
      {String(alt || "F")
        .slice(0, 1)
        .toUpperCase()}
    </span>
  );
}

function ClientOrderDashboard({
  lang,
  clientName,
  projectGroups,
  answerDrafts,
  answerStates,
  loading = false,
  onAnswerChange,
  onAnswerInput,
  onSubmitAnswers,
  onNewOrder,
  onBrowseFurniture
}) {
  const [selectedProjectKey, setSelectedProjectKey] = useState("");
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    if (!projectGroups.length) {
      setSelectedProjectKey("");
      return;
    }
    if (!projectGroups.some((project) => String(project.key) === String(selectedProjectKey))) {
      setSelectedProjectKey(projectGroups[0].key);
    }
  }, [projectGroups, selectedProjectKey]);

  const dashboardData = useMemo(() => {
    const jobs = projectGroups.flatMap((project) => project.jobs);
    const totalOrders = jobs.length;
    const totalPieces = jobs.reduce((total, job) => total + getJobQuantity(job), 0);
    const productionPieces = jobs.reduce(
      (total, job) => total + (getOrderStage(job) === 3 ? getJobQuantity(job) : 0),
      0
    );
    const actionCount = jobs.filter(isActionNeeded).length;
    const furnitureRows = projectGroups.flatMap((project) =>
      project.jobs.flatMap((job) => {
        const fallbackItem = {
          id: `${job.id}-pending-item`,
          typeCn: "家具规格整理中",
          typeEn: "Furniture specification pending",
          qtyDisplay: job.quantityText,
          imageUrl: job.previewUrl
        };
        return (job.items.length ? job.items : [fallbackItem]).map((item) => ({ project, job, item }));
      })
    );
    const updates = jobs
      .flatMap((job) => {
        const status = getOrderStatus(job, lang);
        const questions = isActionNeeded(job)
          ? (job.questions.length
              ? job.questions
              : [
                  job.reviewNotes ||
                    copy(lang, "请补充缺少的规格资料。", "Please provide the missing specification details.")
                ]
            ).map((question, index) => ({
              id: `${job.id}-question-${index}`,
              job,
              title: question,
              detail: copy(lang, "需要您的回复", "Reply requested"),
              action: true
            }))
          : [];
        return [
          ...questions,
          {
            id: `${job.id}-status`,
            job,
            title: `${job.projectName}: ${status.label}`,
            detail: `${formatDate(job.createdAt, lang)} · ${getStageDetail(job, lang)}`,
            action: false
          }
        ];
      })
      .slice(0, 8);

    return { totalOrders, totalPieces, productionPieces, actionCount, furnitureRows, updates };
  }, [lang, projectGroups]);

  const selectedProject =
    projectGroups.find((project) => String(project.key) === String(selectedProjectKey)) || projectGroups[0] || null;
  const firstName = String(clientName || "")
    .trim()
    .split(/\s+/)[0];
  const greetingName = firstName || copy(lang, "客户", "there");
  const progressSteps =
    lang === "Cn"
      ? ["需求接收", "规格确认", "报价确认", "制造质检", "运输交付"]
      : ["Brief", "Specify", "Confirm", "Make", "Deliver"];

  const openOrder = (jobId) => {
    setExpandedOrders((previous) => ({ ...previous, [jobId]: true }));
    window.setTimeout(
      () => document.getElementById(`cho-order-${jobId}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0
    );
  };

  const selectProject = (projectKey) => {
    setSelectedProjectKey(projectKey);
    window.setTimeout(
      () =>
        document.getElementById("cho-client-project-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0
    );
  };

  return (
    <main className="cho-client-studio" aria-labelledby="cho-client-dashboard-title">
      <div className="cho-client-wrap">
        <header className="cho-client-hero">
          <div>
            <span className="cho-client-kicker">{copy(lang, "客户项目工作室", "CLIENT PROJECT STUDIO")}</span>
            <h1 id="cho-client-dashboard-title">
              {lang === "Cn" ? (
                <>
                  {greetingName}，<em>欢迎回来。</em>
                </>
              ) : (
                <>
                  Welcome back, <em>{greetingName}.</em>
                </>
              )}
            </h1>
            <p>
              {copy(
                lang,
                "在一个清晰的工作台中查看项目、家具规格、待确认事项与真实制造进度。",
                "Projects, furniture specifications, decisions and verified production updates in one considered workspace."
              )}
            </p>
          </div>
          <div className="cho-client-hero-actions">
            <button type="button" className="cho-client-button secondary" onClick={onBrowseFurniture}>
              {copy(lang, "浏览 Set Furniture", "Browse Set Furniture")}
            </button>
            <button type="button" className="cho-client-button primary" onClick={onNewOrder}>
              <span aria-hidden="true">+</span>
              {copy(lang, "新建项目", "New project")}
            </button>
          </div>
        </header>

        <section className="cho-client-kpis" aria-label={copy(lang, "项目概览", "Project overview")}>
          {[
            {
              value: projectGroups.length,
              label: copy(lang, "进行中的项目", "Active projects"),
              note: copy(lang, "按项目归类", "Grouped by project")
            },
            {
              value: dashboardData.totalOrders,
              label: copy(lang, "订单", "Orders"),
              note: copy(lang, "全部订单记录", "All recorded orders")
            },
            {
              value: dashboardData.productionPieces,
              label: copy(lang, "制造中的家具", "Pieces in production"),
              note: copy(
                lang,
                `共 ${dashboardData.totalPieces} 件已登记`,
                `${dashboardData.totalPieces} pieces recorded`
              )
            },
            {
              value: dashboardData.actionCount,
              label: copy(lang, "需要您处理", "Action needed"),
              note: dashboardData.actionCount
                ? copy(lang, "请查看待确认事项", "Review requested details")
                : copy(lang, "目前无需操作", "Nothing pending")
            }
          ].map((metric, index) => (
            <article
              className={`cho-client-kpi ${index === 3 && metric.value > 0 ? "needs-action" : ""}`}
              key={metric.label}
            >
              <span className="cho-client-kpi-index">0{index + 1}</span>
              <strong>{loading ? "–" : metric.value}</strong>
              <h2>{metric.label}</h2>
              <p>{loading ? copy(lang, "正在读取项目…", "Loading projects…") : metric.note}</p>
            </article>
          ))}
        </section>

        {loading ? (
          <section className="cho-client-loading" role="status" aria-live="polite">
            <span className="cho-client-kicker">{copy(lang, "安全同步中", "SECURE SYNC")}</span>
            <h2>{copy(lang, "正在读取您的项目记录", "Loading your project workspace")}</h2>
            <p>
              {copy(
                lang,
                "项目与附件会在验证账号权限后显示。",
                "Projects and attachments appear after account access is verified."
              )}
            </p>
          </section>
        ) : projectGroups.length === 0 ? (
          <section className="cho-client-empty" aria-labelledby="cho-client-empty-title">
            <div className="cho-client-empty-copy">
              <span className="cho-client-kicker">{copy(lang, "从这里开始", "BEGIN HERE")}</span>
              <h2 id="cho-client-empty-title">{copy(lang, "您的第一个 Crafton 项目", "Your first Crafton project")}</h2>
              <p>
                {copy(
                  lang,
                  "这个看板目前没有演示订单。您可以从 Set Furniture 选择成熟款式，或提交图纸、图片和需求资料开始定制项目。提交后，项目、家具明细与进度会自动出现在这里。",
                  "This workspace contains no demonstration orders. Choose a proven Set Furniture piece or submit drawings, images and a brief. Your project, furniture schedule and verified progress will then appear here."
                )}
              </p>
              <div className="cho-client-empty-actions">
                <button type="button" className="cho-client-button primary" onClick={onBrowseFurniture}>
                  {copy(lang, "选择 Set Furniture", "Choose Set Furniture")}
                </button>
                <button type="button" className="cho-client-button secondary" onClick={onNewOrder}>
                  {copy(lang, "提交定制需求", "Submit a custom brief")}
                </button>
              </div>
            </div>
            <div
              className="cho-client-empty-images"
              aria-label={copy(lang, "家具系列预览", "Furniture collection preview")}
            >
              <img src="/set-furniture/armchair.jpg" alt={copy(lang, "Crafton 扶手椅", "Crafton armchair")} />
              <img src="/set-furniture/dining-table.jpg" alt={copy(lang, "Crafton 餐桌", "Crafton dining table")} />
              <img src="/set-furniture/sofa.jpg" alt={copy(lang, "Crafton 沙发", "Crafton sofa")} />
            </div>
            <div className="cho-client-empty-steps">
              {[
                [
                  "01",
                  copy(lang, "选择或上传", "Choose or upload"),
                  copy(
                    lang,
                    "选择系列家具，或提交您的图纸与需求。",
                    "Select a collection piece or submit your own brief."
                  )
                ],
                [
                  "02",
                  copy(lang, "确认规格", "Confirm specifications"),
                  copy(
                    lang,
                    "与 Crafton 顾问确认材质、尺寸及合规要求。",
                    "Confirm material, dimensions and compliance with Crafton."
                  )
                ],
                [
                  "03",
                  copy(lang, "跟踪交付", "Track delivery"),
                  copy(
                    lang,
                    "从制造到交付，只显示已验证的真实进度。",
                    "Follow verified progress from manufacturing to delivery."
                  )
                ]
              ].map(([number, title, detail]) => (
                <article key={number}>
                  <span>{number}</span>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="cho-client-projects" aria-labelledby="cho-client-projects-title">
              <div className="cho-client-section-heading">
                <div>
                  <span className="cho-client-kicker">{copy(lang, "项目总览", "PROJECT OVERVIEW")}</span>
                  <h2 id="cho-client-projects-title">{copy(lang, "进行中的项目", "Active projects")}</h2>
                </div>
                <p>{copy(lang, "选择项目查看订单和家具明细", "Select a project to view orders and furniture")}</p>
              </div>
              <div className="cho-client-project-grid">
                {projectGroups.map((project, projectIndex) => {
                  const image = getProjectImage(project);
                  const itemCount = project.jobs.reduce((total, job) => total + Math.max(job.items.length, 1), 0);
                  const pieceCount = project.jobs.reduce((total, job) => total + getJobQuantity(job), 0);
                  const status = getProjectStatus(project, lang);
                  const stage = getProjectStage(project);
                  const isSelected = String(project.key) === String(selectedProject?.key);
                  return (
                    <button
                      type="button"
                      className={`cho-client-project-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => selectProject(project.key)}
                      aria-pressed={isSelected}
                      key={project.key}
                    >
                      <ProductImage src={image} alt={project.projectName} className="cho-client-project-image" />
                      <span className="cho-client-project-number">{String(projectIndex + 1).padStart(2, "0")}</span>
                      <div className="cho-client-project-copy">
                        <div className="cho-client-project-title-row">
                          <div>
                            <h3>{project.projectName || copy(lang, "项目名称待确认", "Project name pending")}</h3>
                            <p>{project.destination || copy(lang, "交付地点待确认", "Destination pending")}</p>
                          </div>
                          <span className={`cho-client-status tone-${status.tone}`}>{status.label}</span>
                        </div>
                        <div className="cho-client-project-meta">
                          <span>
                            {project.jobs.length} {copy(lang, "个订单", project.jobs.length === 1 ? "order" : "orders")}
                          </span>
                          <span>
                            {itemCount} {copy(lang, "项家具", itemCount === 1 ? "furniture line" : "furniture lines")}
                          </span>
                          <span>
                            {pieceCount} {copy(lang, "件", pieceCount === 1 ? "piece" : "pieces")}
                          </span>
                        </div>
                        <div
                          className="cho-client-project-progress"
                          aria-label={copy(lang, "项目进度", "Project progress")}
                        >
                          {progressSteps.map((step, stepIndex) => (
                            <span
                              className={stepIndex < stage ? "complete" : stepIndex === stage ? "current" : ""}
                              key={step}
                            >
                              <i></i>
                              <small>{step}</small>
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {selectedProject && (
              <section
                className="cho-client-project-detail"
                id="cho-client-project-detail"
                aria-labelledby="cho-client-project-detail-title"
              >
                <div className="cho-client-section-heading">
                  <div>
                    <span className="cho-client-kicker">{copy(lang, "订单与家具明细", "ORDERS & FURNITURE")}</span>
                    <h2 id="cho-client-project-detail-title">{selectedProject.projectName}</h2>
                  </div>
                  <p>{selectedProject.destination || copy(lang, "交付地点待确认", "Destination pending")}</p>
                </div>
                <div className="cho-client-order-list">
                  {selectedProject.jobs.map((job, orderIndex) => {
                    const orderKey = String(job.id);
                    const isExpanded = hasOwn(expandedOrders, orderKey) ? expandedOrders[orderKey] : orderIndex === 0;
                    const status = getOrderStatus(job, lang);
                    const stage = getOrderStage(job);
                    const answers = answerDrafts[job.id] || job.clientAnswers || {};
                    const submitState = answerStates[job.id] || {};
                    const isSubmitting = submitState.status === "submitting";
                    const questions =
                      job.reviewStatus === "revision_requested" && !job.questions.length
                        ? [
                            job.reviewNotes ||
                              copy(lang, "请补充缺少的规格资料。", "Please provide the missing specification details.")
                          ]
                        : job.questions;
                    return (
                      <article
                        className={`cho-client-order ${isExpanded ? "is-open" : ""}`}
                        id={`cho-order-${job.id}`}
                        key={orderKey}
                      >
                        <button
                          type="button"
                          className="cho-client-order-toggle"
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedOrders((previous) => ({ ...previous, [orderKey]: !isExpanded }))}
                        >
                          <span className="cho-client-order-id">
                            <small>{copy(lang, `订单 ${orderIndex + 1}`, `Order ${orderIndex + 1}`)}</small>
                            <strong>#{orderKey.slice(0, 8).toUpperCase()}</strong>
                          </span>
                          <span className="cho-client-order-summary-line">
                            {formatDate(job.createdAt, lang)} · {getJobQuantity(job)} {copy(lang, "件", "pieces")}
                          </span>
                          <span className={`cho-client-status tone-${status.tone}`}>{status.label}</span>
                          <span className="cho-client-chevron" aria-hidden="true"></span>
                        </button>
                        {isExpanded && (
                          <div className="cho-client-order-body">
                            <div className="cho-client-order-progress">
                              {progressSteps.map((step, stepIndex) => (
                                <div
                                  className={stepIndex < stage ? "complete" : stepIndex === stage ? "current" : ""}
                                  key={step}
                                >
                                  <span>{stepIndex < stage ? "✓" : stepIndex + 1}</span>
                                  <small>{step}</small>
                                </div>
                              ))}
                            </div>
                            <p className="cho-client-stage-note">{getStageDetail(job, lang)}</p>
                            {job.summaryEn && <p className="cho-client-order-description">{job.summaryEn}</p>}
                            <dl className="cho-client-order-facts">
                              <div>
                                <dt>{copy(lang, "期望交期", "Requested delivery")}</dt>
                                <dd>{job.desiredDeliveryDate || copy(lang, "待确认", "To confirm")}</dd>
                              </div>
                              <div>
                                <dt>{copy(lang, "消防 / 安全标准", "Fire / safety standard")}</dt>
                                <dd>{job.fireStandard || copy(lang, "待确认", "To confirm")}</dd>
                              </div>
                              <div>
                                <dt>{copy(lang, "客户附件", "Client attachment")}</dt>
                                <dd>{job.fileName || copy(lang, "未上传", "No file uploaded")}</dd>
                              </div>
                            </dl>

                            <div className="cho-client-furniture">
                              <div className="cho-client-furniture-heading">
                                <div>
                                  <span className="cho-client-kicker">
                                    {copy(lang, "家具明细", "FURNITURE SCHEDULE")}
                                  </span>
                                  <h3>
                                    {job.items.length || 1}{" "}
                                    {copy(lang, "项产品", job.items.length === 1 ? "product" : "products")}
                                  </h3>
                                </div>
                                <p>
                                  {copy(
                                    lang,
                                    "产品照片、数量与已确认规格",
                                    "Product image, quantity and confirmed specifications"
                                  )}
                                </p>
                              </div>
                              <div className="cho-client-furniture-table" role="table">
                                <div className="cho-client-furniture-head" role="row">
                                  <span role="columnheader">{copy(lang, "产品", "Product")}</span>
                                  <span role="columnheader">{copy(lang, "数量", "Qty")}</span>
                                  <span role="columnheader">{copy(lang, "尺寸", "Dimensions")}</span>
                                  <span role="columnheader">{copy(lang, "材质与饰面", "Material & finish")}</span>
                                  <span role="columnheader">{copy(lang, "用途 / 标准", "Use / standard")}</span>
                                </div>
                                {(job.items.length
                                  ? job.items
                                  : [
                                      {
                                        id: `${job.id}-pending`,
                                        typeCn: "家具规格整理中",
                                        typeEn: "Furniture specification pending",
                                        qtyDisplay: job.quantityText
                                      }
                                    ]
                                ).map((item) => {
                                  const itemName = lang === "Cn" ? item.typeCn : item.typeEn;
                                  return (
                                    <div className="cho-client-furniture-row" role="row" key={item.id}>
                                      <div
                                        className="cho-client-furniture-product"
                                        role="cell"
                                        data-label={copy(lang, "产品", "Product")}
                                      >
                                        <ProductImage src={item.imageUrl || job.previewUrl} alt={itemName} />
                                        <span>
                                          <strong>{itemName}</strong>
                                          {(item.id || item.fabricCode || item.unitPrice > 0) && (
                                            <small>
                                              {[
                                                item.id,
                                                item.fabricCode,
                                                item.unitPrice > 0
                                                  ? `${formatMoney(item.unitPrice, item.currency)} / ${copy(lang, "件", "unit")}`
                                                  : ""
                                              ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                            </small>
                                          )}
                                        </span>
                                      </div>
                                      <div role="cell" data-label={copy(lang, "数量", "Qty")}>
                                        {item.qtyDisplay || item.qty || job.quantityText || "-"}
                                      </div>
                                      <div role="cell" data-label={copy(lang, "尺寸", "Dimensions")}>
                                        {item.dimensionsText || job.dimensions || copy(lang, "待确认", "To confirm")}
                                      </div>
                                      <div role="cell" data-label={copy(lang, "材质与饰面", "Material & finish")}>
                                        <strong>{lang === "Cn" ? item.materialCn : item.materialEn}</strong>
                                        <small>
                                          {[item.finish, item.color, item.hardware].filter(Boolean).join(" · ") || "-"}
                                        </small>
                                      </div>
                                      <div role="cell" data-label={copy(lang, "用途 / 标准", "Use / standard")}>
                                        <strong>{item.usageLocation || "-"}</strong>
                                        <small>
                                          {item.fireStandard || job.fireStandard || copy(lang, "待确认", "To confirm")}
                                        </small>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {questions.length > 0 && job.reviewStatus !== "approved" && (
                              <div className="cho-client-clarification">
                                <div className="cho-client-clarification-heading">
                                  <div>
                                    <span className="cho-client-kicker">
                                      {copy(lang, "需要您的确认", "YOUR INPUT IS NEEDED")}
                                    </span>
                                    <h3>
                                      {copy(
                                        lang,
                                        `请补充以下 ${questions.length} 项资料`,
                                        `Please confirm ${questions.length} detail${questions.length === 1 ? "" : "s"}`
                                      )}
                                    </h3>
                                  </div>
                                  <p>{copy(lang, "您的回答会直接提交给 Cho。", "Your answers go directly to Cho.")}</p>
                                </div>
                                <div className="cho-client-clarification-fields">
                                  {questions.map((question, questionIndex) => (
                                    <label key={`${job.id}-question-${questionIndex}`}>
                                      <span>
                                        {String(questionIndex + 1).padStart(2, "0")} · {question}
                                      </span>
                                      <textarea
                                        value={answers[questionIndex] || ""}
                                        onChange={(event) =>
                                          onAnswerChange(job.id, questionIndex, event.target.value, job.clientAnswers)
                                        }
                                        onInput={() => onAnswerInput(job.id)}
                                        placeholder={copy(lang, "输入您的答案…", "Type your answer…")}
                                        disabled={isSubmitting}
                                      />
                                    </label>
                                  ))}
                                </div>
                                <div className="cho-client-clarification-actions">
                                  {submitState.message && (
                                    <div
                                      className={`cho-client-answer-status status-${submitState.status}`}
                                      role="status"
                                      aria-live="polite"
                                    >
                                      {submitState.message}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    className="cho-client-button primary"
                                    onClick={() => onSubmitAnswers(job.id)}
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting
                                      ? copy(lang, "提交中…", "Submitting…")
                                      : submitState.status === "success"
                                        ? copy(lang, "已提交给 Cho", "Submitted to Cho")
                                        : copy(lang, "提交补充资料", "Submit details")}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="cho-client-operations">
              <div className="cho-client-tracker">
                <div className="cho-client-section-heading compact">
                  <div>
                    <span className="cho-client-kicker">{copy(lang, "制造与交付", "PRODUCTION & DELIVERY")}</span>
                    <h2>{copy(lang, "家具进度", "Furniture tracker")}</h2>
                  </div>
                  <p>{copy(lang, "仅显示已记录的真实状态", "Verified status only")}</p>
                </div>
                <div className="cho-client-tracker-table" role="table">
                  <div className="cho-client-tracker-head" role="row">
                    <span role="columnheader">{copy(lang, "家具", "Furniture")}</span>
                    <span role="columnheader">{copy(lang, "项目", "Project")}</span>
                    <span role="columnheader">{copy(lang, "数量", "Qty")}</span>
                    <span role="columnheader">{copy(lang, "当前阶段", "Current stage")}</span>
                  </div>
                  {dashboardData.furnitureRows.map(({ project, job, item }) => {
                    const itemName = lang === "Cn" ? item.typeCn : item.typeEn;
                    const status = getOrderStatus(job, lang);
                    return (
                      <button
                        type="button"
                        className="cho-client-tracker-row"
                        role="row"
                        onClick={() => {
                          setSelectedProjectKey(project.key);
                          openOrder(job.id);
                        }}
                        key={`${job.id}-${item.id}`}
                      >
                        <span className="cho-client-tracker-product" role="cell">
                          <ProductImage src={item.imageUrl || job.previewUrl} alt={itemName} />
                          <strong>{itemName}</strong>
                        </span>
                        <span role="cell" data-label={copy(lang, "项目", "Project")}>
                          {project.projectName}
                        </span>
                        <span role="cell" data-label={copy(lang, "数量", "Qty")}>
                          {item.qtyDisplay || item.qty || job.quantityText || "-"}
                        </span>
                        <span role="cell" data-label={copy(lang, "当前阶段", "Current stage")}>
                          <strong>{status.label}</strong>
                          <small>
                            {getOrderStage(job) < 3
                              ? copy(lang, "制造尚未排期", "Manufacturing not scheduled")
                              : getStageDetail(job, lang)}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <aside className="cho-client-updates" aria-labelledby="cho-client-updates-title">
                <div className="cho-client-section-heading compact">
                  <div>
                    <span className="cho-client-kicker">{copy(lang, "消息中心", "PROJECT NOTES")}</span>
                    <h2 id="cho-client-updates-title">{copy(lang, "问题与更新", "Questions & updates")}</h2>
                  </div>
                </div>
                <div className="cho-client-update-list">
                  {dashboardData.updates.map((update) => (
                    <button
                      type="button"
                      className={update.action ? "needs-action" : ""}
                      onClick={() => {
                        const project = projectGroups.find((entry) =>
                          entry.jobs.some((job) => String(job.id) === String(update.job.id))
                        );
                        if (project) setSelectedProjectKey(project.key);
                        openOrder(update.job.id);
                      }}
                      key={update.id}
                    >
                      <span className="cho-client-update-mark" aria-hidden="true">
                        {update.action ? "!" : "·"}
                      </span>
                      <span>
                        <strong>{update.title}</strong>
                        <small>{update.detail}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </aside>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default ClientOrderDashboard;
