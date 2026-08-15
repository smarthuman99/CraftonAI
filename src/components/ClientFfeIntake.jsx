import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  FileSearch,
  FileSpreadsheet,
  LoaderCircle,
  UploadCloud
} from "lucide-react";

const t = (lang, cn, en) => (lang === "Cn" ? cn : en);

const formatFileSize = (bytes = 0) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`;
};

const isCompleteDraft = (job) =>
  Boolean(job && ["needs_review", "completed"].includes(job.status) && (job.items?.length || job.summaryEn));

function ExtractedDraft({ lang, job, onConfirm, confirming }) {
  if (!job) return null;

  const items = job.items || [];
  const questions = job.questions || [];

  return (
    <section className="ffe-review-card" aria-labelledby="ffe-review-title">
      <header className="ffe-review-header">
        <div>
          <span className="ffe-kicker">{t(lang, "提取结果", "EXTRACTED PROJECT DRAFT")}</span>
          <h2 id="ffe-review-title">{t(lang, "请确认文件中的项目资料", "Review the information we found")}</h2>
          <p>
            {t(
              lang,
              "这些资料将作为项目订单的起点，缺失内容可以稍后补充。",
              "This will become the starting point for your project order. Missing details can be added later."
            )}
          </p>
        </div>
        <span className="ffe-status-badge is-ready">
          <CheckCircle2 size={15} aria-hidden="true" />
          {t(lang, "待确认", "READY TO REVIEW")}
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
          <span>{t(lang, "目标交付", "Target delivery")}</span>
          <strong>{job.desiredDeliveryDate || t(lang, "待确认", "To confirm")}</strong>
        </div>
      </div>

      {job.summaryEn && <p className="ffe-extracted-summary">{job.summaryEn}</p>}

      <div className="ffe-items-heading">
        <div>
          <span className="ffe-kicker">{t(lang, "家具明细", "FURNITURE SCHEDULE")}</span>
          <h3>{t(lang, `已识别 ${items.length} 项家具`, `${items.length} furniture lines found`)}</h3>
        </div>
        <span>{t(lang, "请核对数量、尺寸及材质", "Check quantities, dimensions and finishes")}</span>
      </div>

      <div
        className="ffe-item-list"
        role="table"
        aria-label={t(lang, "提取的家具清单", "Extracted furniture schedule")}
      >
        <div className="ffe-item-row ffe-item-head" role="row">
          <span role="columnheader">{t(lang, "家具", "Item")}</span>
          <span role="columnheader">{t(lang, "数量", "Qty")}</span>
          <span role="columnheader">{t(lang, "尺寸", "Dimensions")}</span>
          <span role="columnheader">{t(lang, "材质与饰面", "Material & finish")}</span>
        </div>
        {items.map((item, index) => (
          <div className="ffe-item-row" role="row" key={item.id || `${item.typeEn}-${index}`}>
            <span className="ffe-item-name" role="cell" data-label={t(lang, "家具", "Item")}>
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
            <span role="cell" data-label={t(lang, "数量", "Qty")}>
              <strong>{item.qtyDisplay || item.qty || "-"}</strong>
            </span>
            <span role="cell" data-label={t(lang, "尺寸", "Dimensions")}>
              {item.dimensionsText || t(lang, "待确认", "To confirm")}
            </span>
            <span role="cell" data-label={t(lang, "材质与饰面", "Material & finish")}>
              <strong>{lang === "Cn" ? item.materialCn || item.materialEn : item.materialEn || item.materialCn}</strong>
              <small>{[item.finish, item.color, item.fabricCode].filter(Boolean).join(" / ")}</small>
            </span>
          </div>
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

      {questions.length > 0 && (
        <div className="ffe-missing-details">
          <AlertCircle size={18} aria-hidden="true" />
          <div>
            <strong>{t(lang, "仍需确认的资料", "Details still to confirm")}</strong>
            <ul>
              {questions.map((question, index) => (
                <li key={`${question}-${index}`}>{question}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <footer className="ffe-review-actions">
        <p>
          {t(
            lang,
            "确认后，项目会进入 Crafton 团队的规格审核流程。",
            "After confirmation, the project moves to Crafton's specification review."
          )}
        </p>
        <button type="button" className="ffe-primary-button" onClick={onConfirm} disabled={confirming}>
          {confirming ? (
            <LoaderCircle className="ffe-spin" size={18} aria-hidden="true" />
          ) : (
            <Check size={18} aria-hidden="true" />
          )}
          {confirming
            ? t(lang, "正在确认...", "Confirming...")
            : t(lang, "确认并建立项目", "Confirm and create project")}
        </button>
      </footer>
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
  warning,
  uploading,
  analyzing,
  confirming,
  rawJob,
  extractedJob,
  projectName,
  destination,
  notes,
  fileInputRef,
  onFileSelect,
  onProjectNameChange,
  onDestinationChange,
  onNotesChange,
  onAnalyze,
  onConfirm,
  onBack,
  concierge
}) {
  const analysisReady = isCompleteDraft(extractedJob);
  const analysisFailed = rawJob?.status === "failed";
  const isProcessing = Boolean(rawJob && !analysisReady && !analysisFailed);
  const currentStep = analysisReady ? 2 : rawJob ? 1 : fileName ? 1 : 0;
  const steps = [
    t(lang, "上传文件", "Upload"),
    t(lang, "提取资料", "Extract"),
    t(lang, "客户确认", "Review"),
    t(lang, "建立项目", "Create")
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
                "上传现有的家具清单、规格书或图纸。系统会提取项目、地址、家具照片、尺寸及数量，再由您确认。",
                "Upload your furniture schedule, specification pack or drawings. We will extract the project, address, images, dimensions and quantities for you to review."
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
            <li key={step} className={index < currentStep ? "is-done" : index === currentStep ? "is-current" : ""}>
              <span>
                {index < currentStep ? <Check size={14} aria-hidden="true" /> : String(index + 1).padStart(2, "0")}
              </span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>

        <div className="ffe-intake-layout">
          <div className="ffe-intake-main">
            <section className="ffe-upload-card">
              <div className="ffe-section-heading">
                <span className="ffe-section-number">01</span>
                <div>
                  <span className="ffe-kicker">{t(lang, "主要资料", "PRIMARY SOURCE")}</span>
                  <h2>{t(lang, "上传 FF&E 文件", "Upload your FF&E file")}</h2>
                  <p>{t(lang, "一份文件通常已经足够开始。", "One good source file is usually enough to begin.")}</p>
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
                />
                <span className="ffe-upload-icon">
                  {uploading ? <LoaderCircle className="ffe-spin" size={30} /> : <UploadCloud size={30} />}
                </span>
                <strong>
                  {uploading
                    ? t(lang, "正在安全上传...", "Uploading securely...")
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
                <div className="ffe-file-row">
                  <FileSpreadsheet size={22} aria-hidden="true" />
                  <div>
                    <strong>{fileName}</strong>
                    <span>{[formatFileSize(file?.size), uploadStatus].filter(Boolean).join(" · ")}</span>
                  </div>
                  <CheckCircle2 size={19} aria-label={t(lang, "文件已选择", "File selected")} />
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
                  <span>{warning}</span>
                </div>
              )}

              <button
                type="button"
                className="ffe-primary-button ffe-analyze-button"
                onClick={onAnalyze}
                disabled={!fileName || uploading || analyzing || isProcessing}
              >
                {analyzing || isProcessing ? (
                  <LoaderCircle className="ffe-spin" size={18} aria-hidden="true" />
                ) : (
                  <FileSearch size={18} aria-hidden="true" />
                )}
                {analyzing || isProcessing
                  ? t(lang, "正在读取并整理文件...", "Reading and structuring the file...")
                  : t(lang, "提取项目与家具资料", "Extract project and furniture details")}
              </button>

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
                <div className="ffe-inline-alert is-error" role="alert">
                  <AlertCircle size={17} aria-hidden="true" />
                  <span>
                    {t(
                      lang,
                      "文件未能自动解析。请重试，Crafton 团队仍可人工查看已上传文件。",
                      "The file could not be parsed automatically. Please retry; the Crafton team can still review the uploaded file manually."
                    )}
                  </span>
                </div>
              )}
            </section>

            {analysisReady && (
              <ExtractedDraft lang={lang} job={extractedJob} onConfirm={onConfirm} confirming={confirming} />
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
