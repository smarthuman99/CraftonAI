import React, { useState } from "react";

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const formatDate = (value, lang) => {
  if (!value) return lang === "Cn" ? "日期待確認" : "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(lang === "Cn" ? "zh-HK" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
};

const getOrderStage = (job) => {
  const status = String(job.status || "").toLowerCase();
  if (["delivered", "shipping", "in_production", "production", "manufacturing"].includes(status)) return 4;
  if (["ready", "sent"].includes(job.rfqStatus) || job.reviewStatus === "rfq_ready") return 3;
  if (["approved", "revision_requested"].includes(job.reviewStatus)) return 2;
  if (job.reviewStatus === "pending" || job.status === "needs_review") return 1;
  return 0;
};

const getOrderStatus = (job, lang) => {
  if (job.reviewStatus === "revision_requested") {
    return { label: lang === "Cn" ? "需要您補充資料" : "Your input needed", tone: "action" };
  }
  if (["ready", "sent"].includes(job.rfqStatus) || job.reviewStatus === "rfq_ready") {
    return { label: lang === "Cn" ? "正式報價準備中" : "Final quotation in progress", tone: "progress" };
  }
  if (job.reviewStatus === "approved") {
    return { label: lang === "Cn" ? "規格已確認" : "Specifications confirmed", tone: "complete" };
  }
  if (job.reviewStatus === "pending" || job.status === "needs_review") {
    return { label: lang === "Cn" ? "Crafton 審核中" : "Under Crafton review", tone: "progress" };
  }
  return { label: lang === "Cn" ? "已接收" : "Received", tone: "neutral" };
};

const isActionNeeded = (job) =>
  job.reviewStatus === "revision_requested" || (job.questions.length > 0 && job.reviewStatus !== "approved");

function ClientOrderDashboard({
  lang,
  projectGroups,
  answerDrafts,
  answerStates,
  onAnswerChange,
  onAnswerInput,
  onSubmitAnswers,
  onNewOrder
}) {
  const [expandedProjects, setExpandedProjects] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const totalOrders = projectGroups.reduce((total, project) => total + project.jobs.length, 0);
  const totalItems = projectGroups.reduce(
    (total, project) => total + project.jobs.reduce((sum, job) => sum + job.items.length, 0),
    0
  );
  const actionCount = projectGroups.reduce((total, project) => total + project.jobs.filter(isActionNeeded).length, 0);
  const progressSteps =
    lang === "Cn"
      ? ["已接收", "規格審核", "資料確認", "正式報價", "生產交付"]
      : ["Received", "Specification review", "Your confirmation", "Final quotation", "Production & delivery"];

  return (
    <section className="client-order-dashboard" aria-labelledby="client-order-dashboard-title">
      <div className="client-order-dashboard-heading">
        <div>
          <span className="client-dashboard-eyebrow">{lang === "Cn" ? "項目總覽" : "PROJECT OVERVIEW"}</span>
          <h3 id="client-order-dashboard-title">{lang === "Cn" ? "我的項目與訂單" : "My projects and orders"}</h3>
          <p>
            {lang === "Cn"
              ? "按項目查看所有訂單、家具規格、待補資料與最新進度。"
              : "Review every order, furniture specification, requested detail and progress update by project."}
          </p>
        </div>
        <button type="button" className="client-new-order-button" onClick={onNewOrder}>
          <span aria-hidden="true">+</span>
          {lang === "Cn" ? "新增訂單" : "New order"}
        </button>
      </div>

      <div className="client-dashboard-metrics" aria-label={lang === "Cn" ? "訂單摘要" : "Order summary"}>
        <div>
          <strong>{projectGroups.length}</strong>
          <span>{lang === "Cn" ? "項目" : "Projects"}</span>
        </div>
        <div>
          <strong>{totalOrders}</strong>
          <span>{lang === "Cn" ? "訂單" : "Orders"}</span>
        </div>
        <div>
          <strong>{totalItems}</strong>
          <span>{lang === "Cn" ? "家具明細" : "Furniture lines"}</span>
        </div>
        <div className={actionCount > 0 ? "needs-action" : ""}>
          <strong>{actionCount}</strong>
          <span>{lang === "Cn" ? "待您處理" : "Need your input"}</span>
        </div>
      </div>

      {projectGroups.length === 0 ? (
        <div className="client-dashboard-empty">
          <span aria-hidden="true">+</span>
          <strong>{lang === "Cn" ? "開始第一個項目" : "Start your first project"}</strong>
          <p>
            {lang === "Cn"
              ? "提交需求、圖片或規格文件後，項目和訂單進度會集中顯示在這裡。"
              : "Submit a brief, image or specification file and its order progress will appear here."}
          </p>
          <button type="button" className="btn-premium" onClick={onNewOrder}>
            {lang === "Cn" ? "錄入項目需求" : "Create project brief"}
          </button>
        </div>
      ) : (
        <div className="client-project-list">
          {projectGroups.map((project, projectIndex) => {
            const projectExpanded = hasOwn(expandedProjects, project.key)
              ? expandedProjects[project.key]
              : projectIndex === 0;
            const projectItemCount = project.jobs.reduce((total, job) => total + job.items.length, 0);
            const projectActionCount = project.jobs.filter(isActionNeeded).length;
            const latestJob = project.jobs[0];
            const projectStatus = getOrderStatus(project.jobs.find(isActionNeeded) || latestJob, lang);

            return (
              <article className={`client-project-accordion ${projectExpanded ? "is-open" : ""}`} key={project.key}>
                <button
                  type="button"
                  className="client-project-accordion-button"
                  aria-expanded={projectExpanded}
                  onClick={() => setExpandedProjects((previous) => ({ ...previous, [project.key]: !projectExpanded }))}
                >
                  <span className="client-project-index">{String(projectIndex + 1).padStart(2, "0")}</span>
                  <span className="client-project-heading-copy">
                    <strong>
                      {project.projectName || (lang === "Cn" ? "項目名稱待確認" : "Project name pending")}
                    </strong>
                    <span>
                      {project.destination || (lang === "Cn" ? "交付地待確認" : "Destination pending")} ·{" "}
                      {project.jobs.length} {lang === "Cn" ? "個訂單" : project.jobs.length === 1 ? "order" : "orders"}{" "}
                      · {projectItemCount}{" "}
                      {lang === "Cn" ? "項家具" : projectItemCount === 1 ? "furniture line" : "furniture lines"}
                    </span>
                  </span>
                  <span className={`client-order-status tone-${projectStatus.tone}`}>{projectStatus.label}</span>
                  {projectActionCount > 0 && (
                    <span className="client-project-action-count">
                      {projectActionCount} {lang === "Cn" ? "項待處理" : "to review"}
                    </span>
                  )}
                  <span className="client-accordion-chevron" aria-hidden="true"></span>
                </button>

                {projectExpanded && (
                  <div className="client-project-accordion-body">
                    <div className="client-project-facts">
                      <div>
                        <span>{lang === "Cn" ? "交付地" : "Destination"}</span>
                        <strong>{project.destination || (lang === "Cn" ? "待確認" : "To confirm")}</strong>
                      </div>
                      <div>
                        <span>{lang === "Cn" ? "最近更新" : "Latest update"}</span>
                        <strong>{formatDate(latestJob.createdAt, lang)}</strong>
                      </div>
                      <div>
                        <span>{lang === "Cn" ? "目前狀態" : "Current status"}</span>
                        <strong>{projectStatus.label}</strong>
                      </div>
                    </div>

                    <div className="client-order-list">
                      {project.jobs.map((job, orderIndex) => {
                        const orderKey = String(job.id);
                        const orderExpanded = hasOwn(expandedOrders, orderKey)
                          ? expandedOrders[orderKey]
                          : orderIndex === 0;
                        const orderStatus = getOrderStatus(job, lang);
                        const activeStage = getOrderStage(job);
                        const answers = answerDrafts[job.id] || job.clientAnswers || {};
                        const submitState = answerStates[job.id] || {};
                        const isSubmitting = submitState.status === "submitting";
                        const questions =
                          job.reviewStatus === "revision_requested" && job.questions.length === 0
                            ? [job.reviewNotes || "Please provide the missing specification details."]
                            : job.questions;

                        return (
                          <section
                            className={`client-order-accordion ${orderExpanded ? "is-open" : ""}`}
                            key={orderKey}
                          >
                            <button
                              type="button"
                              className="client-order-accordion-button"
                              aria-expanded={orderExpanded}
                              onClick={() =>
                                setExpandedOrders((previous) => ({ ...previous, [orderKey]: !orderExpanded }))
                              }
                            >
                              <span className="client-order-number">
                                <small>{lang === "Cn" ? `訂單 ${orderIndex + 1}` : `Order ${orderIndex + 1}`}</small>
                                <strong>#{orderKey.slice(0, 8).toUpperCase()}</strong>
                              </span>
                              <span className="client-order-date">
                                {formatDate(job.createdAt, lang)} · {job.items.length || 1}{" "}
                                {lang === "Cn"
                                  ? "項家具"
                                  : job.items.length === 1
                                    ? "furniture line"
                                    : "furniture lines"}
                              </span>
                              <span className={`client-order-status tone-${orderStatus.tone}`}>
                                {orderStatus.label}
                              </span>
                              <span className="client-accordion-chevron" aria-hidden="true"></span>
                            </button>

                            {orderExpanded && (
                              <div className="client-order-detail">
                                <div
                                  className="client-order-progress"
                                  aria-label={lang === "Cn" ? "訂單進度" : "Order progress"}
                                >
                                  {progressSteps.map((step, stepIndex) => (
                                    <div
                                      className={`client-order-progress-step ${stepIndex < activeStage ? "is-complete" : ""} ${
                                        stepIndex === activeStage ? "is-current" : ""
                                      }`}
                                      key={step}
                                    >
                                      <span>{stepIndex < activeStage ? "✓" : stepIndex + 1}</span>
                                      <small>{step}</small>
                                    </div>
                                  ))}
                                </div>

                                {job.summaryEn && <p className="client-order-summary">{job.summaryEn}</p>}

                                <div className="client-order-meta-grid">
                                  <div>
                                    <span>{lang === "Cn" ? "交付日期" : "Requested delivery"}</span>
                                    <strong>
                                      {job.desiredDeliveryDate || (lang === "Cn" ? "待確認" : "To confirm")}
                                    </strong>
                                  </div>
                                  <div>
                                    <span>{lang === "Cn" ? "消防／安全標準" : "Fire / safety standard"}</span>
                                    <strong>{job.fireStandard || (lang === "Cn" ? "待確認" : "To confirm")}</strong>
                                  </div>
                                  <div>
                                    <span>{lang === "Cn" ? "客戶附件" : "Client attachment"}</span>
                                    <strong>{job.fileName || (lang === "Cn" ? "尚未上傳" : "No file uploaded")}</strong>
                                  </div>
                                </div>

                                <div className="client-furniture-section">
                                  <div className="client-order-section-heading">
                                    <div>
                                      <span>{lang === "Cn" ? "家具明細" : "FURNITURE SCHEDULE"}</span>
                                      <strong>
                                        {job.items.length || 1}{" "}
                                        {lang === "Cn" ? "項產品" : job.items.length === 1 ? "item" : "items"}
                                      </strong>
                                    </div>
                                    <small>
                                      {lang === "Cn"
                                        ? "此訂單的產品與規格"
                                        : "Products and specifications in this order"}
                                    </small>
                                  </div>

                                  {job.items.length > 0 ? (
                                    <div className="client-furniture-table" role="table">
                                      <div className="client-furniture-table-head" role="row">
                                        <span role="columnheader">{lang === "Cn" ? "產品" : "Product"}</span>
                                        <span role="columnheader">{lang === "Cn" ? "數量" : "Qty"}</span>
                                        <span role="columnheader">{lang === "Cn" ? "尺寸" : "Dimensions"}</span>
                                        <span role="columnheader">
                                          {lang === "Cn" ? "材質與飾面" : "Material & finish"}
                                        </span>
                                        <span role="columnheader">
                                          {lang === "Cn" ? "用途／標準" : "Use / standard"}
                                        </span>
                                      </div>
                                      {job.items.map((item) => {
                                        const itemName = lang === "Cn" ? item.typeCn : item.typeEn;
                                        const previewUrl = item.imageUrl || job.previewUrl;

                                        return (
                                          <div className="client-furniture-row" role="row" key={item.id}>
                                            <div
                                              className="client-furniture-product-cell"
                                              role="cell"
                                              data-label={lang === "Cn" ? "產品" : "Product"}
                                            >
                                              {previewUrl ? (
                                                <img src={previewUrl} alt={itemName} loading="lazy" />
                                              ) : (
                                                <span className="client-furniture-image-placeholder" aria-hidden="true">
                                                  {String(itemName || "F")
                                                    .slice(0, 1)
                                                    .toUpperCase()}
                                                </span>
                                              )}
                                              <span className="client-furniture-product-copy">
                                                <strong>{itemName}</strong>
                                                {item.fabricCode && <small>{item.fabricCode}</small>}
                                              </span>
                                            </div>
                                            <div role="cell" data-label={lang === "Cn" ? "數量" : "Qty"}>
                                              {item.qtyDisplay || item.qty || "-"}
                                            </div>
                                            <div role="cell" data-label={lang === "Cn" ? "尺寸" : "Dimensions"}>
                                              {item.dimensionsText ||
                                                job.dimensions ||
                                                (lang === "Cn" ? "待確認" : "To confirm")}
                                            </div>
                                            <div
                                              role="cell"
                                              data-label={lang === "Cn" ? "材質與飾面" : "Material & finish"}
                                            >
                                              <strong>{lang === "Cn" ? item.materialCn : item.materialEn}</strong>
                                              <small>
                                                {[item.finish, item.color, item.hardware].filter(Boolean).join(" · ") ||
                                                  "-"}
                                              </small>
                                            </div>
                                            <div
                                              role="cell"
                                              data-label={lang === "Cn" ? "用途／標準" : "Use / standard"}
                                            >
                                              <strong>{item.usageLocation || "-"}</strong>
                                              <small>
                                                {item.fireStandard ||
                                                  job.fireStandard ||
                                                  (lang === "Cn" ? "待確認" : "To confirm")}
                                              </small>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="client-order-line-placeholder">
                                      {job.quantityText ||
                                        (lang === "Cn"
                                          ? "產品明細正在整理中"
                                          : "Furniture details are being organized")}
                                    </div>
                                  )}
                                </div>

                                {questions.length > 0 && job.reviewStatus !== "approved" && (
                                  <div className="client-clarification-panel">
                                    <div className="client-clarification-heading">
                                      <div>
                                        <span>{lang === "Cn" ? "需要您確認" : "YOUR INPUT IS NEEDED"}</span>
                                        <strong>
                                          {lang === "Cn"
                                            ? `請補充以下 ${questions.length} 項資料`
                                            : `Please confirm ${questions.length} detail${questions.length === 1 ? "" : "s"}`}
                                        </strong>
                                      </div>
                                      <small>
                                        {lang === "Cn" ? "回答會直接提交給 Cho" : "Your answers go directly to Cho"}
                                      </small>
                                    </div>
                                    <div className="client-clarification-fields">
                                      {questions.map((question, questionIndex) => (
                                        <label
                                          key={`${job.id}-question-${questionIndex}`}
                                          className="prequote-answer-field"
                                        >
                                          <span>
                                            {String(questionIndex + 1).padStart(2, "0")} · {question}
                                          </span>
                                          <textarea
                                            value={answers[questionIndex] || ""}
                                            onChange={(event) =>
                                              onAnswerChange(
                                                job.id,
                                                questionIndex,
                                                event.target.value,
                                                job.clientAnswers
                                              )
                                            }
                                            onInput={() => onAnswerInput(job.id)}
                                            placeholder={lang === "Cn" ? "輸入您的答案..." : "Type your answer..."}
                                            disabled={isSubmitting}
                                          />
                                        </label>
                                      ))}
                                    </div>
                                    <div className="client-clarification-actions">
                                      {submitState.message && (
                                        <div
                                          role="status"
                                          aria-live="polite"
                                          className={`client-answer-status status-${submitState.status}`}
                                        >
                                          {submitState.message}
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        className="btn-premium"
                                        onClick={() => onSubmitAnswers(job.id)}
                                        disabled={isSubmitting}
                                      >
                                        {isSubmitting
                                          ? lang === "Cn"
                                            ? "提交中..."
                                            : "Submitting..."
                                          : submitState.status === "success"
                                            ? lang === "Cn"
                                              ? "已提交給 Cho"
                                              : "Submitted to Cho"
                                            : lang === "Cn"
                                              ? "提交補充資料"
                                              : "Submit details"}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div className="client-commercial-status">
                                  <span aria-hidden="true">i</span>
                                  <p>
                                    <strong>
                                      {lang === "Cn" ? "報價與商務資料" : "Quotation and commercial documents"}
                                    </strong>
                                    {job.reviewStatus === "approved" || job.reviewStatus === "rfq_ready"
                                      ? lang === "Cn"
                                        ? "Crafton 正在準備正式客戶報價；經 Cho 批准後會在此發布。"
                                        : "Crafton is preparing your formal customer quotation. It will appear here after Cho approval."
                                      : lang === "Cn"
                                        ? "完成規格確認後，正式客戶報價會在此發布。"
                                        : "Your formal customer quotation will appear here after the specifications are confirmed."}
                                  </p>
                                </div>
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ClientOrderDashboard;
