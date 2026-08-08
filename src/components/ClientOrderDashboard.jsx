import React, { useEffect, useMemo, useState } from "react";

const copy = (lang, cn, en) => (lang === "Cn" ? cn : en);

const formatDate = (value, lang, fallback) => {
  if (!value) return fallback || copy(lang, "日期待确认", "Date pending");
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

const getJobQuantity = (job) => {
  const itemTotal = (job.items || []).reduce((total, item) => total + getItemQuantity(item), 0);
  return itemTotal || parseQuantity(job.quantityText);
};

const uniqueRows = (rows = []) => {
  const seen = new Set();
  return rows.filter((row, index) => {
    const key = String(row?.id || row?.file_url || row?.file_path || `${row?.created_at || "row"}-${index}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getProgressRows = (project, key) =>
  uniqueRows((project.jobs || []).flatMap((job) => job.clientProgress?.[key] || []));

const getOrderStage = (job) => {
  const status = String(job.status || "").toLowerCase();
  const reviewStatus = String(job.reviewStatus || "").toLowerCase();
  const rfqStatus = String(job.rfqStatus || "").toLowerCase();
  const currentStage = Number(job.currentStage || 0);
  const progress = job.clientProgress || {};

  if (status === "delivered" || currentStage >= 14 || (progress.shipments || []).length) return 4;
  if (status === "quality_check" || currentStage >= 11 || (progress.inspections || []).length) return 3;
  if (
    ["in_production", "production", "manufacturing", "packing"].includes(status) ||
    currentStage >= 9 ||
    (progress.productionUpdates || []).length
  ) {
    return 2;
  }
  if (
    currentStage >= 3 ||
    ["ready", "sent", "priced"].includes(rfqStatus) ||
    ["approved", "rfq_ready", "revision_requested", "pending"].includes(reviewStatus) ||
    status === "needs_review"
  ) {
    return 1;
  }
  return 0;
};

const getOrderStatus = (job, lang) => {
  const status = String(job.status || "").toLowerCase();
  const stage = getOrderStage(job);

  if (status === "delivered" || Number(job.currentStage || 0) >= 16) {
    return { label: copy(lang, "已交付", "Delivered"), tone: "complete" };
  }
  if (stage === 4) return { label: copy(lang, "运输与交付", "Shipping & delivery"), tone: "progress" };
  if (stage === 3) return { label: copy(lang, "质检与合规", "Inspection & compliance"), tone: "progress" };
  if (stage === 2) return { label: copy(lang, "制造中", "In production"), tone: "progress" };
  if (job.reviewStatus === "revision_requested") {
    return { label: copy(lang, "需要您补充资料", "Your input needed"), tone: "action" };
  }
  if (job.reviewStatus === "approved" || job.reviewStatus === "rfq_ready") {
    return { label: copy(lang, "规格已确认", "Specifications confirmed"), tone: "complete" };
  }
  if (stage === 1) return { label: copy(lang, "规格审核中", "Specification review"), tone: "progress" };
  return { label: copy(lang, "已接收", "Brief received"), tone: "neutral" };
};

const getStageDetail = (job, lang) => {
  const details = [
    copy(lang, "您的需求与附件已安全接收。", "Your brief and attachments have been received."),
    copy(
      lang,
      "Crafton 正在确认尺寸、材质、预算与合规要求。",
      "Crafton is confirming dimensions, materials, budget and compliance."
    ),
    copy(lang, "已进入制造排期或生产阶段。", "The order has entered production planning or manufacturing."),
    copy(lang, "产品正在进行质检、合规检查或包装确认。", "The furniture is in quality, compliance or packing checks."),
    copy(lang, "项目已进入运输、到岸或现场交付阶段。", "The project is in shipping, landing or site delivery.")
  ];
  return details[getOrderStage(job)];
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

const getProjectItems = (project) =>
  project.jobs.flatMap((job) => {
    const fallbackItem = {
      id: `${job.id}-pending-item`,
      typeCn: "家具规格整理中",
      typeEn: "Furniture specification pending",
      qtyDisplay: job.quantityText,
      imageUrl: job.previewUrl
    };
    return (job.items.length ? job.items : [fallbackItem]).map((item) => ({ job, item }));
  });

const getProjectDeliveryDate = (project) => {
  const shipmentDates = getProgressRows(project, "shipments")
    .map((row) => row.eta)
    .filter(Boolean);
  const requestedDates = project.jobs.map((job) => job.desiredDeliveryDate).filter(Boolean);
  return [...shipmentDates, ...requestedDates].sort()[0] || "";
};

function ProductImage({ src, alt, className = "" }) {
  if (src) return <img className={className} src={src} alt={alt} loading="lazy" />;
  return (
    <span className={`cho-client-image-placeholder ${className}`}>{copy("En", "图片待上传", "Reference pending")}</span>
  );
}

function ProjectConfirmations({
  lang,
  project,
  answerDrafts,
  answerStates,
  onAnswerChange,
  onAnswerInput,
  onSubmitAnswers
}) {
  const actionableJobs = project.jobs.filter((job) => isActionNeeded(job));
  if (!actionableJobs.length) return null;

  return (
    <section className="cho-project-card cho-project-confirmation-form" id="cho-project-confirmations">
      <div className="cho-project-card-label">{copy(lang, "项目确认事项", "PROJECT CONFIRMATIONS")}</div>
      {actionableJobs.map((job, orderIndex) => {
        const questions =
          job.reviewStatus === "revision_requested" && !job.questions.length
            ? [
                job.reviewNotes ||
                  copy(lang, "请补充缺少的规格资料。", "Please provide the missing specification details.")
              ]
            : job.questions;
        const answers = answerDrafts[job.id] || job.clientAnswers || {};
        const submitState = answerStates[job.id] || {};
        const isSubmitting = submitState.status === "submitting";

        return (
          <article className="cho-project-confirmation-order" key={job.id}>
            <div className="cho-project-confirmation-heading">
              <div>
                <span className="cho-client-kicker">
                  {copy(lang, `订单 ${orderIndex + 1}`, `ORDER ${orderIndex + 1}`)} · #{String(job.id).slice(0, 8)}
                </span>
                <h2>{copy(lang, "请确认以下资料", "Please confirm these details")}</h2>
              </div>
              <span className="cho-project-action-badge">{copy(lang, "等待回复", "Reply needed")}</span>
            </div>
            <div className="cho-project-confirmation-fields">
              {questions.map((question, questionIndex) => (
                <label key={`${job.id}-question-${questionIndex}`}>
                  <span>
                    {String(questionIndex + 1).padStart(2, "0")} · {question}
                  </span>
                  <textarea
                    value={answers[questionIndex] || ""}
                    onChange={(event) => onAnswerChange(job.id, questionIndex, event.target.value, job.clientAnswers)}
                    onInput={() => onAnswerInput(job.id)}
                    placeholder={copy(lang, "输入您的答案…", "Type your answer…")}
                    disabled={isSubmitting}
                  />
                </label>
              ))}
            </div>
            <div className="cho-project-confirmation-actions">
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
          </article>
        );
      })}
    </section>
  );
}

function ClientProjectDetail({
  lang,
  clientName,
  project,
  answerDrafts,
  answerStates,
  onAnswerChange,
  onAnswerInput,
  onSubmitAnswers,
  onBack,
  onBrowseFurniture,
  onMessageProject
}) {
  const projectItems = useMemo(() => getProjectItems(project), [project]);
  const projectStage = getProjectStage(project);
  const status = getProjectStatus(project, lang);
  const totalPieces = project.jobs.reduce((total, job) => total + getJobQuantity(job), 0);
  const actionCount = project.jobs.filter(isActionNeeded).length;
  const deliveryDate = getProjectDeliveryDate(project);
  const productionUpdates = getProgressRows(project, "productionUpdates");
  const inspections = getProgressRows(project, "inspections");
  const shipments = getProgressRows(project, "shipments");
  const handovers = getProgressRows(project, "handovers");
  const projectFiles = getProgressRows(project, "projectFiles");
  const shipmentDocuments = getProgressRows(project, "shipmentDocuments");
  const progressSteps =
    lang === "Cn" ? ["需求", "规格", "制造", "质检", "交付"] : ["Brief", "Specify", "Make", "Inspect", "Deliver"];

  const documents = uniqueRows([
    ...project.jobs
      .filter((job) => job.fileName)
      .map((job) => ({
        id: `client-${job.id}`,
        type: "CLIENT",
        name: job.fileName,
        url: job.previewUrl,
        detail: copy(lang, "客户提交附件", "Client submission")
      })),
    ...projectFiles.map((file) => ({
      id: file.id,
      type: String(file.file_group || file.stage_id || "FILE").slice(0, 8),
      name: file.file_name || copy(lang, "项目文件", "Project file"),
      url: file.file_url || "",
      detail: [file.stage_id, file.file_group].filter(Boolean).join(" · ") || copy(lang, "已共享", "Shared")
    })),
    ...shipmentDocuments.map((file) => ({
      id: file.id,
      type: String(file.document_type || "DOC").slice(0, 8),
      name: file.document_name || file.document_type || copy(lang, "交付文件", "Delivery document"),
      url: file.file_url || "",
      detail: [file.status, file.version].filter(Boolean).join(" · ") || copy(lang, "已登记", "Recorded")
    }))
  ]);

  const firstCreatedAt = [...project.jobs]
    .map((job) => job.createdAt)
    .filter(Boolean)
    .sort()[0];
  const latestProduction = productionUpdates[0];
  const latestInspection = inspections[0];
  const latestShipment = shipments[0];
  const latestHandover = handovers[0];
  const timeline = [
    {
      title: copy(lang, "需求已接收", "Brief received"),
      detail: formatDate(firstCreatedAt, lang),
      stage: 0
    },
    {
      title: copy(lang, "规格与报价确认", "Specification confirmation"),
      detail:
        projectStage >= 1
          ? copy(lang, "已进入审核流程", "Review workflow active")
          : copy(lang, "尚未开始", "Not started"),
      stage: 1
    },
    {
      title: latestProduction?.process_name || copy(lang, "制造排期", "Production"),
      detail: latestProduction
        ? `${latestProduction.status || copy(lang, "已更新", "Updated")} · ${Number(latestProduction.progress_percent || 0)}%`
        : projectStage >= 2
          ? copy(lang, "制造记录已开启", "Production record opened")
          : copy(lang, "等待规格确认", "Awaiting specification confirmation"),
      stage: 2
    },
    {
      title: latestInspection?.work_package || copy(lang, "质检与合规", "Inspection & compliance"),
      detail: latestInspection
        ? `${latestInspection.status || copy(lang, "已登记", "Recorded")} · ${formatDate(latestInspection.inspected_at || latestInspection.created_at, lang)}`
        : copy(lang, "等待制造完成", "Awaiting production completion"),
      stage: 3
    },
    {
      title: latestHandover ? copy(lang, "现场交付", "Site handover") : copy(lang, "运输与交付", "Shipping & delivery"),
      detail: latestHandover
        ? `${latestHandover.status || copy(lang, "已登记", "Recorded")} · ${formatDate(latestHandover.signed_at || latestHandover.created_at, lang)}`
        : latestShipment
          ? `${latestShipment.status || copy(lang, "运输中", "In transit")} · ${formatDate(latestShipment.eta, lang)}`
          : deliveryDate
            ? `${copy(lang, "目标", "Target")} ${formatDate(deliveryDate, lang)}`
            : copy(lang, "日期待确认", "Date pending"),
      stage: 4
    }
  ];

  const scrollToConfirmations = () =>
    document.getElementById("cho-project-confirmations")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="cho-project-page" aria-labelledby="cho-project-title">
      <div className="cho-client-wrap">
        <nav className="cho-project-breadcrumb" aria-label={copy(lang, "面包屑导航", "Breadcrumb")}>
          <button type="button" onClick={onBack}>
            {copy(lang, "项目工作室", "Studio")}
          </button>
          <span>/</span>
          <button type="button" onClick={onBack}>
            {copy(lang, "项目", "Projects")}
          </button>
          <span>/</span>
          <strong>{project.projectName}</strong>
        </nav>

        <header className="cho-project-hero">
          <i className="fa-solid fa-plus cho-project-corner left" aria-hidden="true"></i>
          <i className="fa-solid fa-plus cho-project-corner right" aria-hidden="true"></i>
          <div className="cho-project-title-row">
            <div>
              <h1 id="cho-project-title">{project.projectName}</h1>
              <p>
                {[
                  project.destination || copy(lang, "交付地点待确认", "Destination pending"),
                  `${project.jobs.length} ${copy(lang, "个订单", project.jobs.length === 1 ? "order" : "orders")}`,
                  clientName || copy(lang, "Crafton 客户", "Crafton client"),
                  project.projectId ? `#${String(project.projectId).slice(0, 8).toUpperCase()}` : ""
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <span className={`cho-project-status-pill tone-${status.tone}`}>{status.label}</span>
          </div>
          <section className="cho-project-kpis" aria-label={copy(lang, "项目指标", "Project metrics")}>
            {[
              [totalPieces, copy(lang, "家具件数", "Pieces")],
              [project.jobs.length, copy(lang, "订单", "Orders")],
              [projectItems.length, copy(lang, "家具明细", "Furniture lines")],
              [actionCount, copy(lang, "待您确认", "Action needed")],
              [
                deliveryDate ? formatDate(deliveryDate, lang) : copy(lang, "待确认", "Pending"),
                copy(lang, "目标交付", "Target delivery")
              ]
            ].map(([value, label]) => (
              <article className="cho-project-kpi" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </section>
        </header>

        <section className="cho-project-card cho-project-stage-card">
          <div className="cho-project-card-label">{copy(lang, "项目阶段", "PROJECT STAGE")}</div>
          <div className="cho-project-stage-bars" aria-label={`${status.label}: ${projectStage + 1} / 5`}>
            {progressSteps.map((step, index) => (
              <div className={index < projectStage ? "complete" : index === projectStage ? "current" : ""} key={step}>
                <span></span>
                <strong>{step}</strong>
                <small>{timeline[index].detail}</small>
              </div>
            ))}
          </div>
        </section>

        <div className="cho-project-primary-grid">
          <section className="cho-project-card cho-project-line-items">
            <div className="cho-project-card-label">
              {copy(lang, `家具明细 · ${projectItems.length} 项`, `LINE ITEMS · ${projectItems.length}`)}
            </div>
            <div className="cho-project-table" role="table">
              <div className="cho-project-table-head" role="row">
                <span role="columnheader">{copy(lang, "产品", "Item")}</span>
                <span role="columnheader">{copy(lang, "数量", "Qty")}</span>
                <span role="columnheader">{copy(lang, "阶段", "Stage")}</span>
                <span role="columnheader">{copy(lang, "目标日期", "ETA")}</span>
                <span role="columnheader">{copy(lang, "规格", "Specification")}</span>
                <span role="columnheader">{copy(lang, "状态", "Status")}</span>
              </div>
              {projectItems.map(({ job, item }) => {
                const itemName = lang === "Cn" ? item.typeCn : item.typeEn;
                const itemStatus = getOrderStatus(job, lang);
                const material = lang === "Cn" ? item.materialCn : item.materialEn;
                return (
                  <div className="cho-project-table-row" role="row" key={`${job.id}-${item.id}`}>
                    <div className="cho-project-item" role="cell" data-label={copy(lang, "产品", "Item")}>
                      <ProductImage src={item.imageUrl || job.previewUrl} alt={itemName} />
                      <span>
                        <strong>{itemName}</strong>
                        <small>
                          {[item.fabricCode, item.color, item.finish].filter(Boolean).join(" · ") ||
                            copy(lang, "规格整理中", "Specification in review")}
                        </small>
                      </span>
                    </div>
                    <span className="cho-project-mono" role="cell" data-label={copy(lang, "数量", "Qty")}>
                      {item.qtyDisplay || item.qty || job.quantityText || "-"}
                    </span>
                    <span role="cell" data-label={copy(lang, "阶段", "Stage")}>
                      <span className={`cho-project-stage-tag stage-${getOrderStage(job)}`}>
                        {progressSteps[getOrderStage(job)]}
                      </span>
                    </span>
                    <span className="cho-project-mono" role="cell" data-label={copy(lang, "目标日期", "ETA")}>
                      {job.desiredDeliveryDate
                        ? formatDate(job.desiredDeliveryDate, lang)
                        : copy(lang, "待确认", "Pending")}
                    </span>
                    <span role="cell" data-label={copy(lang, "规格", "Specification")}>
                      <strong>{material || copy(lang, "待确认", "To confirm")}</strong>
                      <small>
                        {item.dimensionsText || job.dimensions || copy(lang, "尺寸待确认", "Dimensions pending")}
                      </small>
                    </span>
                    <span role="cell" data-label={copy(lang, "状态", "Status")}>
                      <span className={`cho-project-row-status tone-${itemStatus.tone}`}>{itemStatus.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="cho-project-side-stack">
            <section className="cho-project-card cho-project-approval-card">
              <div className="cho-project-card-label">{copy(lang, "需要您的确认", "NEEDS YOUR APPROVAL")}</div>
              {actionCount ? (
                project.jobs.filter(isActionNeeded).map((job) => (
                  <article key={job.id}>
                    <div>
                      <strong>{job.projectName}</strong>
                      <p>
                        {job.questions[0] ||
                          job.reviewNotes ||
                          copy(lang, "请补充项目规格资料。", "Please confirm the requested project details.")}
                      </p>
                      <small>#{String(job.id).slice(0, 8).toUpperCase()}</small>
                    </div>
                    <button type="button" onClick={scrollToConfirmations}>
                      {copy(lang, "查看", "Review")}
                    </button>
                  </article>
                ))
              ) : (
                <p className="cho-project-empty-note">
                  {copy(lang, "目前没有等待您确认的事项。", "Nothing is waiting for your approval.")}
                </p>
              )}
            </section>

            <section className="cho-project-card cho-project-documents">
              <div className="cho-project-card-label">{copy(lang, "项目文件", "DOCUMENTS")}</div>
              {documents.length ? (
                documents.map((document) => {
                  const content = (
                    <>
                      <span className="cho-project-document-type">{document.type}</span>
                      <span>
                        <strong>{document.name}</strong>
                        <small>{document.detail}</small>
                      </span>
                    </>
                  );
                  return document.url ? (
                    <a href={document.url} target="_blank" rel="noreferrer" key={document.id}>
                      {content}
                    </a>
                  ) : (
                    <div key={document.id}>{content}</div>
                  );
                })
              ) : (
                <p className="cho-project-empty-note">
                  {copy(lang, "尚未共享项目文件。", "No project documents have been shared yet.")}
                </p>
              )}
            </section>
          </aside>
        </div>

        <div className="cho-project-secondary-grid">
          <section className="cho-project-card cho-project-timeline">
            <div className="cho-project-card-label">
              {copy(lang, "生产与交付时间线", "PRODUCTION & LANDING TIMELINE")}
            </div>
            {timeline.map((entry) => (
              <article
                className={
                  entry.stage < projectStage ? "complete" : entry.stage === projectStage ? "current" : "upcoming"
                }
                key={entry.title}
              >
                <span aria-hidden="true"></span>
                <div>
                  <strong>{entry.title}</strong>
                  <small>{entry.detail}</small>
                </div>
              </article>
            ))}
          </section>

          <aside className="cho-project-card cho-project-manager">
            <div className="cho-project-card-label">{copy(lang, "您的项目联系人", "YOUR PROJECT CONTACT")}</div>
            <div className="cho-project-manager-person">
              <span>CP</span>
              <div>
                <strong>{copy(lang, "Crafton 项目团队", "Crafton Project Team")}</strong>
                <small>{copy(lang, "深圳 · 客户项目服务", "Shenzhen · Client projects")}</small>
              </div>
            </div>
            <p>
              {copy(
                lang,
                "交期、样品、合规或运输方面的问题，将由同一项目团队持续跟进。",
                "Questions about lead time, samples, compliance or shipping stay with one project team from brief to delivery."
              )}
            </p>
            <button type="button" className="cho-client-button secondary" onClick={onMessageProject}>
              {copy(lang, "联系项目团队", "Message project team")}
            </button>
          </aside>
        </div>

        <ProjectConfirmations
          lang={lang}
          project={project}
          answerDrafts={answerDrafts}
          answerStates={answerStates}
          onAnswerChange={onAnswerChange}
          onAnswerInput={onAnswerInput}
          onSubmitAnswers={onSubmitAnswers}
        />

        <div className="cho-project-page-actions">
          <button type="button" className="cho-client-button primary" onClick={onBrowseFurniture}>
            {copy(lang, "添加更多家具", "Add more pieces")}
          </button>
          <button type="button" className="cho-client-button secondary" onClick={onBack}>
            {copy(lang, "返回项目工作室", "Back to Studio")}
          </button>
        </div>
      </div>
    </main>
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
  onBrowseFurniture,
  onMessageProject
}) {
  const [projectPageKey, setProjectPageKey] = useState("");

  useEffect(() => {
    if (projectPageKey && !projectGroups.some((project) => String(project.key) === String(projectPageKey))) {
      setProjectPageKey("");
    }
  }, [projectGroups, projectPageKey]);

  const dashboardData = useMemo(() => {
    const jobs = projectGroups.flatMap((project) => project.jobs);
    const totalOrders = jobs.length;
    const totalPieces = jobs.reduce((total, job) => total + getJobQuantity(job), 0);
    const productionPieces = jobs.reduce(
      (total, job) => total + ([2, 3].includes(getOrderStage(job)) ? getJobQuantity(job) : 0),
      0
    );
    const actionCount = jobs.filter(isActionNeeded).length;
    const furnitureRows = projectGroups.flatMap((project) =>
      getProjectItems(project).map(({ job, item }) => ({ project, job, item }))
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

  const projectPage = projectGroups.find((project) => String(project.key) === String(projectPageKey));
  const firstName = String(clientName || "")
    .trim()
    .split(/\s+/)[0];
  const greetingName = firstName || copy(lang, "客户", "there");
  const progressSteps =
    lang === "Cn" ? ["需求", "规格", "制造", "质检", "交付"] : ["Brief", "Specify", "Make", "Inspect", "Deliver"];

  const openProjectPage = (projectKey) => {
    setProjectPageKey(projectKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (projectPage) {
    return (
      <ClientProjectDetail
        lang={lang}
        clientName={clientName}
        project={projectPage}
        answerDrafts={answerDrafts}
        answerStates={answerStates}
        onAnswerChange={onAnswerChange}
        onAnswerInput={onAnswerInput}
        onSubmitAnswers={onSubmitAnswers}
        onBack={() => {
          setProjectPageKey("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onBrowseFurniture={onBrowseFurniture}
        onMessageProject={onMessageProject || onNewOrder}
      />
    );
  }

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
                "在一个清晰的工作台中查看项目、待确认事项与真实制造进度。",
                "Projects, decisions and verified production updates in one considered workspace."
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
            [
              projectGroups.length,
              copy(lang, "进行中的项目", "Active projects"),
              copy(lang, "按项目归类", "Grouped by project")
            ],
            [
              dashboardData.totalOrders,
              copy(lang, "订单", "Orders"),
              copy(lang, "全部订单记录", "All recorded orders")
            ],
            [
              dashboardData.productionPieces,
              copy(lang, "制造中的家具", "Pieces in production"),
              copy(lang, `共 ${dashboardData.totalPieces} 件已登记`, `${dashboardData.totalPieces} pieces recorded`)
            ],
            [
              dashboardData.actionCount,
              copy(lang, "需要您处理", "Action needed"),
              dashboardData.actionCount
                ? copy(lang, "请查看待确认事项", "Review requested details")
                : copy(lang, "目前无需操作", "Nothing pending")
            ]
          ].map(([value, label, note], index) => (
            <article className={`cho-client-kpi ${index === 3 && value > 0 ? "needs-action" : ""}`} key={label}>
              <span className="cho-client-kpi-index">0{index + 1}</span>
              <strong>{loading ? "–" : value}</strong>
              <h2>{label}</h2>
              <p>{loading ? copy(lang, "正在读取项目…", "Loading projects…") : note}</p>
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
                  "这个看板目前没有演示订单。您可以从 Set Furniture 选择成熟款式，或提交图纸、图片和需求资料开始定制项目。提交后，项目与真实进度会自动出现在这里。",
                  "This workspace contains no demonstration orders. Choose a proven Set Furniture piece or submit drawings, images and a brief. Your project and verified progress will then appear here."
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
                <p>
                  {copy(
                    lang,
                    "选择项目打开完整订单与制造进度",
                    "Open a project for its complete order and production detail"
                  )}
                </p>
              </div>
              <div className="cho-client-project-grid">
                {projectGroups.map((project, projectIndex) => {
                  const image = getProjectImage(project);
                  const itemCount = getProjectItems(project).length;
                  const pieceCount = project.jobs.reduce((total, job) => total + getJobQuantity(job), 0);
                  const projectStatus = getProjectStatus(project, lang);
                  const stage = getProjectStage(project);
                  return (
                    <button
                      type="button"
                      className="cho-client-project-card"
                      onClick={() => openProjectPage(project.key)}
                      aria-label={`${copy(lang, "打开项目", "Open project")} ${project.projectName}`}
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
                          <span className={`cho-client-status tone-${projectStatus.tone}`}>{projectStatus.label}</span>
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
                        <span className="cho-client-project-open">
                          {copy(lang, "查看项目", "View project")}{" "}
                          <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

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
                    const itemStatus = getOrderStatus(job, lang);
                    return (
                      <button
                        type="button"
                        className="cho-client-tracker-row"
                        role="row"
                        onClick={() => openProjectPage(project.key)}
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
                          <strong>{itemStatus.label}</strong>
                          <small>{getStageDetail(job, lang)}</small>
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
                  {dashboardData.updates.map((update) => {
                    const project = projectGroups.find((entry) =>
                      entry.jobs.some((job) => String(job.id) === String(update.job.id))
                    );
                    return (
                      <button
                        type="button"
                        className={update.action ? "needs-action" : ""}
                        onClick={() => project && openProjectPage(project.key)}
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
                    );
                  })}
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
