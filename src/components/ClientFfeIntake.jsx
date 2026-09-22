import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  FileSpreadsheet,
  LoaderCircle,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import { customerServiceError, customerServiceText } from "../customerServiceCopy.js";

const t = (lang, cn, en) => (lang === "Cn" ? cn : en);

const formatFileSize = (bytes = 0) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`;
};

const isCompleteDraft = (job) =>
  Boolean(job && ["needs_review", "completed"].includes(job.status) && (job.items?.length || job.summaryEn));

const normalizedQuestionText = (value) =>
  String(value || "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const getQuestionItem = (question, job) => {
  const items = job.items || [];
  if (
    question.item_index !== null &&
    question.item_index !== "" &&
    Number.isInteger(Number(question.item_index)) &&
    items[Number(question.item_index)]
  ) {
    return items[Number(question.item_index)];
  }
  if (question.item_id) {
    const idMatch = items.find((item) => String(item.id) === String(question.item_id));
    if (idMatch) return idMatch;
  }
  const text = normalizedQuestionText(question.question);
  return items.find((item) =>
    [item.typeEn, item.typeCn]
      .map(normalizedQuestionText)
      .filter((name) => name.length > 1)
      .some((name) => text.includes(name))
  );
};

const getClientCompletionQuestions = (job) => {
  const clarificationRequest = job?.clarificationRequest;
  const requestedItems = Array.isArray(clarificationRequest?.items) ? clarificationRequest.items : [];
  if (requestedItems.length) {
    return requestedItems.map((item, questionIndex) => ({
      ...item,
      question: item.question || item.text || "",
      questionIndex
    }));
  }
  const requestedQuestions = Array.isArray(clarificationRequest?.questions) ? clarificationRequest.questions : [];
  if (requestedQuestions.length) {
    return requestedQuestions.map((question, questionIndex) => ({
      id: `${job?.id || "completion"}-Q${questionIndex + 1}`,
      question,
      questionIndex,
      scope: "project",
      item_id: "",
      item_index: null
    }));
  }
  if (
    clarificationRequest ||
    ["manual_review_required", "ready_for_approval"].includes(job?.clarificationWorkflow?.status)
  ) {
    return [];
  }
  const fallbackQuestions = job?.activeQuestions?.length ? job.activeQuestions : job?.questions || [];
  return fallbackQuestions.map((question, questionIndex) => ({
    id: `${job?.id || "completion"}-Q${questionIndex + 1}`,
    question,
    questionIndex,
    scope: "project",
    item_id: "",
    item_index: null
  }));
};

function ClientCompletion({
  lang,
  job,
  rawJob,
  answers,
  answerState,
  onAnswerChange,
  onAnswerInput,
  onSubmitAnswers,
  onOpenProject
}) {
  if (!job) return null;

  const items = job.items || [];
  const questions = getClientCompletionQuestions(job).filter((question) => question.question);
  const workflowStatus = job.clarificationWorkflow?.status || "";
  const adminExceptions = Array.isArray(rawJob?.result_json?.admin_exceptions)
    ? rawJob.result_json.admin_exceptions
    : [];
  const manualReviewRequired =
    workflowStatus === "manual_review_required" || (adminExceptions.length > 0 && questions.length === 0);
  const readyForApproval =
    workflowStatus === "ready_for_approval" ||
    (questions.length === 0 && items.length > 0 && adminExceptions.length === 0);
  const answerValues = answers || {};
  const answeredCount = questions.filter((question) =>
    String(answerValues[question.questionIndex] || answerValues[question.id] || "").trim()
  ).length;
  const isSubmitting = answerState?.status === "submitting";

  return (
    <section className="ffe-review-card ffe-client-completion" aria-labelledby="ffe-review-title">
      <header className="ffe-review-header">
        <div>
          <span className="ffe-kicker">{t(lang, "客户资料补全", "CLIENT COMPLETION")}</span>
          <h2 id="ffe-review-title">
            {readyForApproval
              ? t(lang, "资料已准备好等待批准", "Your project draft is ready for approval")
              : manualReviewRequired
                ? t(lang, "文件正在由 Crafton 复核", "Crafton is reviewing the source file")
                : t(lang, "以下资料需要您确认", "A few details need your confirmation")}
          </h2>
          <p>
            {readyForApproval
              ? t(
                  lang,
                  "您的文件和答案已整理成项目草稿，等待 Crafton 审核并批准。",
                  "Your files and answers have been organised into a project draft for Crafton to review and approve."
                )
              : manualReviewRequired
                ? t(
                    lang,
                    "您的文件中有部分内容需要进一步核对。文件已安全保存，您暂时无需补充资料。",
                    "We need to check a few details in your file. It has been safely saved, and no further information is needed from you at this stage."
                  )
                : t(
                    lang,
                    "请补充以下需要确认的资料。提交后，我们会更新并检查您的项目草稿。",
                    "Please confirm the details below. Once you submit your answers, we’ll update and check your project draft."
                  )}
          </p>
        </div>
        <span className={`ffe-status-badge ${readyForApproval ? "is-ready" : "is-action"}`}>
          {readyForApproval ? (
            <ShieldCheck size={15} aria-hidden="true" />
          ) : (
            <AlertCircle size={15} aria-hidden="true" />
          )}
          {readyForApproval
            ? t(lang, "等待管理员批准", "AWAITING APPROVAL")
            : manualReviewRequired
              ? t(lang, "CRAFTON 复核", "CRAFTON REVIEW")
              : t(lang, `${questions.length} 项待补充`, `${questions.length} TO COMPLETE`)}
        </span>
      </header>

      <div className="ffe-project-summary">
        <div>
          <span>{t(lang, "项目名称", "Project")}</span>
          <strong>{job.projectName || t(lang, "待确认", "To confirm")}</strong>
        </div>
        <div>
          <span>{t(lang, "交付地点", "Destination")}</span>
          <strong>{job.destination || t(lang, "待确认", "To confirm")}</strong>
        </div>
        <div>
          <span>{t(lang, "家具款式", "Furniture lines")}</span>
          <strong>{items.length || t(lang, "待确认", "Pending")}</strong>
        </div>
        <div>
          <span>{t(lang, "资料检查结果", "File check")}</span>
          <strong>
            {readyForApproval
              ? t(lang, "可批准", "Ready")
              : manualReviewRequired
                ? t(lang, "内部复核", "Crafton review")
                : t(lang, `${questions.length} 项需确认`, `${questions.length} details needed`)}
          </strong>
        </div>
      </div>

      {(lang === "Cn" ? job.summaryCn || job.summaryEn : job.summaryEn) && (
        <p className="ffe-extracted-summary">
          {customerServiceText(lang === "Cn" ? job.summaryCn || job.summaryEn : job.summaryEn)}
        </p>
      )}

      {readyForApproval ? (
        <div className="ffe-ready-for-approval" role="status">
          <span>
            <FileCheck2 size={24} aria-hidden="true" />
          </span>
          <div>
            <strong>{t(lang, "客户补全已完成", "Client Completion complete")}</strong>
            <p>
              {t(
                lang,
                "您不需要再等待管理员转发问题。项目现在已直接进入管理员批准队列。",
                "There is no clarification hand-off to wait for. The project is now in Crafton's approval queue."
              )}
            </p>
          </div>
          <button type="button" className="ffe-primary-button" onClick={onOpenProject}>
            {t(lang, "打开项目", "Open project")}
          </button>
        </div>
      ) : manualReviewRequired ? (
        <div className="ffe-ready-for-approval ffe-manual-review" role="status">
          <span>
            <FileSearch size={24} aria-hidden="true" />
          </span>
          <div>
            <strong>{t(lang, "我们正在进一步核对您的文件", "We’re taking a closer look at your file")}</strong>
            <p>
              {t(
                lang,
                "您的原文件已安全保存。我们会核对文件内容，并在检查完成后更新项目。",
                "Your original file is safely saved. We’ll check its contents and update your project when the review is complete."
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="ffe-completion-workspace">
          <div className="ffe-completion-heading">
            <div>
              <span className="ffe-kicker">{t(lang, "需要您的资料", "DETAILS TO COMPLETE")}</span>
              <h3>{t(lang, "逐项填写，我们会整理您的项目资料", "Add your answers and we’ll update your project")}</h3>
            </div>
            <span>
              {answeredCount} / {questions.length} {t(lang, "已填写", "answered")}
            </span>
          </div>
          <div className="ffe-question-list">
            {questions.map((question, index) => {
              const item = getQuestionItem(question, job);
              const answer = answerValues[question.questionIndex] || answerValues[question.id] || "";
              return (
                <label className="ffe-question-card" key={question.id || `${question.question}-${index}`}>
                  <span className="ffe-question-meta">
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <em>
                      {item
                        ? `${t(lang, "家具明细", "LINE ITEM")} · ${lang === "Cn" ? item.typeCn || item.typeEn : item.typeEn || item.typeCn}`
                        : t(lang, "项目资料", "PROJECT DETAIL")}
                    </em>
                  </span>
                  <strong>{question.question}</strong>
                  <textarea
                    value={answer}
                    onChange={(event) => onAnswerChange(question.questionIndex, event.target.value, job.clientAnswers)}
                    onInput={onAnswerInput}
                    placeholder={t(
                      lang,
                      "输入答案，或说明由 Crafton 报价／稍后决定…",
                      "Enter your answer, or say “Crafton to quote” / “To be decided”…"
                    )}
                    disabled={isSubmitting}
                  />
                </label>
              );
            })}
          </div>
          <div className="ffe-completion-actions">
            <div>
              <strong>{t(lang, "提交后会发生什么？", "What happens next?")}</strong>
              <span>
                {t(
                  lang,
                  "更新项目资料 → 核对内容 → 资料齐全后提交审核",
                  "Update draft → check details → send for approval once complete"
                )}
              </span>
              {answerState?.message && (
                <small className={`ffe-answer-state is-${answerState.status}`} role="status" aria-live="polite">
                  {answerState.status === "error"
                    ? customerServiceError(answerState.message, lang)
                    : customerServiceText(answerState.message)}
                </small>
              )}
            </div>
            <button
              type="button"
              className="ffe-primary-button"
              onClick={onSubmitAnswers}
              disabled={isSubmitting || answeredCount === 0}
            >
              {isSubmitting ? (
                <LoaderCircle className="ffe-spin" size={18} aria-hidden="true" />
              ) : (
                <FileSearch size={18} aria-hidden="true" />
              )}
              {isSubmitting
                ? t(lang, "正在更新项目…", "We are updating the project…")
                : t(lang, "保存答案并检查资料", "Save answers and check details")}
            </button>
          </div>
        </div>
      )}

      <div className="ffe-items-heading">
        <div>
          <span className="ffe-kicker">{t(lang, "已整理的家具清单", "YOUR FURNITURE SCHEDULE")}</span>
          <h3>{t(lang, `已识别 ${items.length} 项家具`, `${items.length} furniture lines found`)}</h3>
        </div>
        <span>{t(lang, "点击家具查看提取资料", "Open a line to inspect extracted details")}</span>
      </div>

      <div className="ffe-completion-items" aria-label={t(lang, "提取的家具清单", "Extracted furniture schedule")}>
        {items.map((item, index) => (
          <details className="ffe-completion-item" key={item.id || `${item.typeEn}-${index}`}>
            <summary>
              <span className="ffe-item-name">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" />
                ) : (
                  <span className="ffe-item-index">{String(index + 1).padStart(2, "0")}</span>
                )}
                <span>
                  <strong>{lang === "Cn" ? item.typeCn || item.typeEn : item.typeEn || item.typeCn}</strong>
                  <small>{item.usageLocation || t(lang, "使用位置待确认", "Use location pending")}</small>
                </span>
              </span>
              <span className="ffe-item-qty">
                {t(lang, "数量", "QTY")} <strong>{item.qtyDisplay || item.qty || "-"}</strong>
              </span>
              <span className="ffe-item-disclosure">{t(lang, "查看资料", "View details")}</span>
            </summary>
            <dl>
              <div>
                <dt>{t(lang, "尺寸", "Dimensions")}</dt>
                <dd>{item.dimensionsText || t(lang, "待确认", "To confirm")}</dd>
              </div>
              <div>
                <dt>{t(lang, "材质", "Material")}</dt>
                <dd>{lang === "Cn" ? item.materialCn || item.materialEn : item.materialEn || item.materialCn}</dd>
              </div>
              <div>
                <dt>{t(lang, "饰面与颜色", "Finish & colour")}</dt>
                <dd>
                  {[item.finish, item.color, item.fabricCode].filter(Boolean).join(" / ") ||
                    t(lang, "待确认", "To confirm")}
                </dd>
              </div>
            </dl>
          </details>
        ))}
        {!items.length && (
          <div className="ffe-no-items">
            {t(
              lang,
              "文件中尚未识别到家具行项目，Crafton 团队会人工复核。",
              "No furniture lines were extracted. The Crafton team will review the file manually."
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ClientFfeIntake({
  lang,
  user,
  file,
  fileName,
  uploadStatus,
  uploadProgress,
  uploaded = false,
  warning,
  uploading,
  analyzing,
  rawJob,
  extractedJob,
  answers,
  answerState,
  projectName,
  destination,
  notes,
  fileInputRef,
  onFileSelect,
  onRetryUpload,
  onProjectNameChange,
  onDestinationChange,
  onNotesChange,
  onAnalyze,
  onAnswerChange,
  onAnswerInput,
  onSubmitAnswers,
  onOpenProject,
  onBack,
  concierge
}) {
  const analysisReady = isCompleteDraft(extractedJob);
  const analysisFailed = rawJob?.status === "failed";
  const isProcessing = Boolean(rawJob && !analysisReady && !analysisFailed);
  const completionQuestions = analysisReady ? getClientCompletionQuestions(extractedJob) : [];
  const isReadyForApproval =
    extractedJob?.clarificationWorkflow?.status === "ready_for_approval" ||
    (analysisReady && completionQuestions.length === 0 && (extractedJob?.items || []).length > 0);
  const fileUploaded = Boolean(uploaded || rawJob);
  const uploadFailed = Boolean(fileName && warning && !fileUploaded && !uploading);
  const currentStep = isReadyForApproval ? 3 : analysisReady ? 2 : fileUploaded ? 1 : 0;
  const fileStatusLabel = uploadFailed
    ? t(lang, "上传未成功，请重试", "Upload unsuccessful — please try again")
    : uploading
      ? t(lang, "正在上传", "Uploading")
      : fileUploaded
        ? t(lang, "文件已成功上传", "File uploaded successfully")
        : t(lang, "已选择，尚未上传", "Selected, not yet uploaded");
  const steps = [
    uploadFailed ? t(lang, "上传失败", "Upload failed") : t(lang, "上传文件", "Upload"),
    t(lang, "检查", "File check"),
    t(lang, "客户补全", "Complete"),
    t(lang, "等待批准", "Approval")
  ];

  return (
    <main className="ffe-intake-page">
      <div className="ffe-intake-shell">
        <button type="button" className="ffe-back-button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t(lang, "返回项目工作室", "Back to project studio")}
        </button>

        <header className="ffe-intake-hero">
          <div>
            <span className="ffe-kicker">{t(lang, "新项目录入", "NEW PROJECT INTAKE")}</span>
            <h1>{t(lang, "从您的 FF&E 文件开始。", "Start with your FF&E schedule.")}</h1>
            <p>
              {t(
                lang,
                "上传家具清单、规格书或图纸后，我们会整理您的项目资料，并引导您确认需要补充的内容。",
                "Upload your furniture schedule, specification pack or drawings. We’ll organise your project details and guide you through anything that needs confirmation."
              )}
            </p>
          </div>
          <div className="ffe-client-meta">
            <span>{t(lang, "客户", "Client")}</span>
            <strong>{user?.company || user?.name || "Crafton Client"}</strong>
            <small>{user?.name || ""}</small>
          </div>
        </header>

        <ol className="ffe-intake-steps" aria-label={t(lang, "项目录入步骤", "Project intake steps")}>
          {steps.map((step, index) => (
            <li
              key={step}
              className={`${index < currentStep ? "is-done" : index === currentStep ? "is-current" : ""}${index === 0 && uploadFailed ? " is-error" : ""}`}
              aria-current={index === currentStep ? "step" : undefined}
            >
              <span>
                {index === 0 && uploadFailed ? (
                  <AlertCircle size={16} aria-hidden="true" />
                ) : index < currentStep ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>

        <div className="ffe-intake-layout">
          <div className="ffe-intake-main">
            {!analysisReady && (
              <section className="ffe-upload-card">
                <div className="ffe-section-heading">
                  <span className="ffe-section-number">01</span>
                  <div>
                    <span className="ffe-kicker">{t(lang, "主要资料", "PRIMARY SOURCE")}</span>
                    <h2>{t(lang, "上传 FF&E 文件", "Upload your FF&E file")}</h2>
                    <p>
                      {t(
                        lang,
                        "选择文件即可，上传完成后我们会开始检查。",
                        "Choose your file and we’ll start checking it as soon as the upload is complete."
                      )}
                    </p>
                  </div>
                </div>

                <div className="ffe-auto-route" aria-label={t(lang, "自动处理流程", "Automatic intake route")}>
                  <FileSearch size={20} aria-hidden="true" />
                  <div>
                    <strong>{t(lang, "上传后自动进入 Client Completion", "Automatic Client Completion")}</strong>
                    <span>
                      {t(
                        lang,
                        "我们会整理文件内容，您只需确认仍缺少的项目资料。",
                        "We’ll organise the file contents and ask you to confirm any missing project details."
                      )}
                    </span>
                  </div>
                </div>

                <label className={`ffe-dropzone ${fileName ? "has-file" : ""}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg,.webp"
                    onClick={(event) => {
                      event.currentTarget.value = "";
                    }}
                    onChange={onFileSelect}
                    disabled={uploading || analyzing || isProcessing}
                  />
                  <span className="ffe-upload-icon">
                    {uploading || analyzing || isProcessing ? (
                      <LoaderCircle className="ffe-spin" size={30} />
                    ) : (
                      <UploadCloud size={30} />
                    )}
                  </span>
                  <strong>
                    {uploading
                      ? t(lang, "正在安全上传...", "Uploading securely...")
                      : analyzing || isProcessing
                        ? t(lang, "我们正在检查您的文件…", "We’re checking your files…")
                        : fileName
                          ? t(lang, "更换 FF&E 文件", "Replace FF&E file")
                          : t(lang, "选择或拖放 FF&E 文件", "Choose or drop an FF&E file")}
                  </strong>
                  <span>
                    {t(lang, "支持 PDF、Excel、CSV、Word 及参考图片", "PDF, Excel, CSV, Word and reference images")}
                  </span>
                  <small>{t(lang, "PDF 最大 250MB；支持断点续传", "PDF up to 250MB with resumable upload")}</small>
                </label>

                {uploading && (
                  <div className="ffe-upload-progress" role="status" aria-live="polite">
                    <div>
                      <span>{t(lang, "文件上传进度", "File upload progress")}</span>
                      <strong>{Math.max(0, Math.min(100, Number(uploadProgress || 0)))}%</strong>
                    </div>
                    <progress max="100" value={Math.max(0, Math.min(100, Number(uploadProgress || 0)))} />
                    <small>
                      {t(
                        lang,
                        "网络中断后可继续上传，无需拆分文件。",
                        "An interrupted upload can resume without splitting the file."
                      )}
                    </small>
                  </div>
                )}

                {fileName && (
                  <div className={`ffe-file-row${uploadFailed ? " is-error" : ""}`} role="status" aria-live="polite">
                    <FileSpreadsheet size={22} aria-hidden="true" />
                    <div>
                      <strong>{fileName}</strong>
                      <span>
                        {[formatFileSize(file?.size), fileStatusLabel, !uploadFailed && uploadStatus]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                    {uploadFailed ? (
                      <AlertCircle size={19} aria-label={t(lang, "上传失败", "Upload failed")} />
                    ) : uploading ? (
                      <LoaderCircle className="ffe-spin" size={19} aria-label={t(lang, "正在上传", "Uploading")} />
                    ) : fileUploaded ? (
                      <CheckCircle2 size={19} aria-label={t(lang, "上传成功", "Upload complete")} />
                    ) : null}
                  </div>
                )}

                <details className="ffe-optional-context">
                  <summary>{t(lang, "添加可选提示", "Add optional context")}</summary>
                  <p>
                    {t(
                      lang,
                      "如果文件命名不清楚，可先告诉我们项目名或交付城市。",
                      "If the file is ambiguous, add a project name or delivery city to guide the extraction."
                    )}
                  </p>
                  <div className="ffe-context-grid">
                    <label>
                      <span>{t(lang, "项目名称（可选）", "Project name (optional)")}</span>
                      <input
                        value={projectName}
                        onChange={(event) => onProjectNameChange(event.target.value)}
                        placeholder="e.g. Luna Hotel"
                      />
                    </label>
                    <label>
                      <span>{t(lang, "交付地点（可选）", "Destination (optional)")}</span>
                      <input
                        value={destination}
                        onChange={(event) => onDestinationChange(event.target.value)}
                        placeholder="e.g. London, UK"
                      />
                    </label>
                    <label className="is-wide">
                      <span>{t(lang, "补充说明（可选）", "Additional note (optional)")}</span>
                      <textarea
                        value={notes}
                        onChange={(event) => onNotesChange(event.target.value)}
                        placeholder={t(
                          lang,
                          "例如：请重点核对大堂及餐厅区域。",
                          "For example: prioritise the lobby and restaurant schedules."
                        )}
                      />
                    </label>
                  </div>
                </details>

                {warning && (
                  <div className="ffe-inline-alert is-error" role="alert">
                    <AlertCircle size={17} aria-hidden="true" />
                    <span>{customerServiceError(warning, lang)}</span>
                  </div>
                )}

                {uploadFailed && file && onRetryUpload && (
                  <button type="button" className="ffe-primary-button ffe-retry-upload" onClick={onRetryUpload}>
                    <UploadCloud size={18} aria-hidden="true" />
                    {t(lang, "重新上传此文件", "Retry this upload")}
                  </button>
                )}

                {isProcessing && (
                  <div className="ffe-processing-status" role="status" aria-live="polite">
                    <span className="ffe-processing-mark">
                      <LoaderCircle className="ffe-spin" size={22} />
                    </span>
                    <div>
                      <strong>{t(lang, "正在分析 FF&E 文件", "Analysing your FF&E schedule")}</strong>
                      <p>
                        {t(
                          lang,
                          "我们正在识别工作表、家具行项目、图片、尺寸、数量和项目地址。此页面会自动更新。",
                          "We are reading worksheets, furniture rows, images, dimensions, quantities and project addresses. This page will update automatically."
                        )}
                      </p>
                      <small>{rawJob?.id ? `JOB #${String(rawJob.id).slice(0, 8).toUpperCase()}` : ""}</small>
                    </div>
                  </div>
                )}

                {analysisFailed && (
                  <div className="ffe-analysis-failed">
                    <div className="ffe-inline-alert is-error" role="alert">
                      <AlertCircle size={17} aria-hidden="true" />
                      <span>
                        {t(
                          lang,
                          "文件未能自动解析。您可以重新尝试；若仍失败，系统会把它标记为管理员例外审核。",
                          "The file could not be parsed automatically. Retry once; if it still fails, it will be routed as an admin exception."
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="ffe-primary-button ffe-analyze-button"
                      onClick={() => onAnalyze()}
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <LoaderCircle className="ffe-spin" size={18} aria-hidden="true" />
                      ) : (
                        <FileSearch size={18} aria-hidden="true" />
                      )}
                      {t(lang, "重新运行检查", "Retry check")}
                    </button>
                  </div>
                )}
              </section>
            )}

            {analysisReady && (
              <ClientCompletion
                lang={lang}
                job={extractedJob}
                rawJob={rawJob}
                answers={answers}
                answerState={answerState}
                onAnswerChange={onAnswerChange}
                onAnswerInput={onAnswerInput}
                onSubmitAnswers={onSubmitAnswers}
                onOpenProject={onOpenProject}
              />
            )}
          </div>

          <aside className="ffe-concierge-column">
            <div className="ffe-concierge-intro">
              <span className="ffe-kicker">{t(lang, "需要帮助？", "NEED HELP?")}</span>
              <h2>{t(lang, "也可以直接告诉 Crafton 客服。", "Or talk it through with Crafton Concierge.")}</h2>
              <p>
                {t(
                  lang,
                  "客服会结合您上传的文件理解项目，并协助补充背景或回答进度问题。",
                  "Concierge keeps the uploaded file in context and can help add background or answer project questions."
                )}
              </p>
            </div>
            {concierge}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default ClientFfeIntake;
