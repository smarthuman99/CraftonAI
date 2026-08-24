import React, { useCallback, useEffect, useMemo, useState } from "react";
import { callWorkflowAi } from "./workflowAiClient";
import SupplierProductionPlanForm from "./SupplierProductionPlanForm";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_FILES = ".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls,.csv,.docx";
const SHOP_DRAWING_FILES = ".pdf,.png,.jpg,.jpeg,.webp,.dwg,.dxf";
const MAX_SHOP_DRAWING_SIZE = 30 * 1024 * 1024;

const dateTime = (value, zh) =>
  value ? new Date(value).toLocaleString(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "-";

const statusLabel = (value, zh) => {
  const labels = {
    not_started: ["Not started", "未开始"],
    in_progress: ["In progress", "生产中"],
    pending_review: ["Ready for Cho review", "等待 Cho 审核"],
    completed: ["Completion approved", "完工已批准"],
    evidence_changes_required: ["Evidence changes required", "完工证据需要修改"],
    awaiting_supplier_evidence: ["Evidence required", "等待上传证据"],
    intervention_required: ["Intervention required", "需要立即处理"],
    attention_required: ["Attention required", "需要关注"],
    monitoring: ["AI monitoring", "AI 监控中"],
    awaiting_framework: ["Awaiting work packages", "等待工序框架"],
    awaiting_supplier_plan: ["Factory schedule required", "等待工厂排产"],
    changes_required: ["Schedule changes required", "排产需要修改"],
    ai_review: ["AI schedule validation", "AI 排产校验中"],
    awaiting_cho_approval: ["Schedule awaiting Cho", "排产等待 Cho 批准"],
    revision_pending_cho: ["Revision awaiting Cho", "改期等待 Cho 批准"],
    plan_revision_required: ["Schedule changes required", "排产需要修改"],
    plan_revision_pending_cho: ["Revision awaiting Cho", "改期等待 Cho 批准"],
    awaiting_cho_plan_approval: ["Schedule awaiting Cho", "排产等待 Cho 批准"],
    plan_approved: ["Approved baseline", "已批准正式基准"],
    awaiting_production_plan: ["Awaiting production plan", "等待生产计划"],
    ready_for_cho_review: ["Ready for Cho review", "等待 Cho 审核"]
  };
  return labels[value]?.[zh ? 1 : 0] || String(value || "-").replaceAll("_", " ");
};

function Metric({ label, value, tone = "" }) {
  return (
    <article className={`supplier-portal-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function SupplierProductionPortal({ lang = "Cn", user, supabaseClient }) {
  const zh = lang === "Cn";
  const t = (en, cn) => (zh ? cn : en);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTaskId, setActiveTaskId] = useState("");
  const [requirement, setRequirement] = useState("");
  const [progress, setProgress] = useState("20");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [drawingForm, setDrawingForm] = useState(null);
  const [drawingFile, setDrawingFile] = useState(null);
  const [drawingNote, setDrawingNote] = useState("");
  const [drawingUploading, setDrawingUploading] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const loadWorkspace = useCallback(async () => {
    if (!supabaseClient) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await callWorkflowAi(supabaseClient, { action: "supplier_production_workspace" });
      setWorkspace(result);
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setLoading(false);
    }
  }, [supabaseClient]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const allTasks = useMemo(() => (workspace?.projects || []).flatMap((project) => project.tasks || []), [workspace]);
  const activeTask = allTasks.find((task) => task.id === activeTaskId) || null;

  function openEvidenceForm(task) {
    const missing = task.analysis?.missingEvidence || [];
    setActiveTaskId(task.id);
    setRequirement(missing[0] || task.analysis?.requiredEvidence?.[0] || "Production evidence");
    setProgress(String(Math.max(0, Number(task.progress_percent || 0))));
    setNote("");
    setFile(null);
    setMessage("");
  }

  async function submitEvidence(event) {
    event.preventDefault();
    if (!activeTask || !file) {
      setMessage(t("Choose an evidence file before submitting.", "请先选择需要上传的生产证据文件。"));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage(t("Each evidence file must be 15 MB or smaller.", "每个证据文件不能超过 15 MB。"));
      return;
    }
    setUploading(true);
    setMessage("");
    let storagePath = "";
    try {
      const project = workspace.projects.find((entry) => entry.tasks.some((task) => task.id === activeTask.id));
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      storagePath = `${user.id}/supplier-production/${project.id}/${activeTask.id}/${Date.now()}-${cleanName}`;
      const sha256 = await hashFile(file);
      const { error: uploadError } = await supabaseClient.storage.from("intake-files").upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });
      if (uploadError) throw uploadError;
      const result = await callWorkflowAi(supabaseClient, {
        action: "submit_supplier_production_evidence",
        productionUpdateId: activeTask.id,
        requirement,
        progressPercent: Number(progress || 0),
        note,
        file: {
          bucket: "intake-files",
          path: storagePath,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          sha256
        }
      });
      setMessage(
        t(
          `Evidence accepted. AI controller: ${result.message}.`,
          `证据已接收。AI 生产控制器判定：${analysisText(result.analysis, true)}。`
        )
      );
      setActiveTaskId("");
      await loadWorkspace();
    } catch (error) {
      if (storagePath)
        await supabaseClient.storage
          .from("intake-files")
          .remove([storagePath])
          .catch(() => null);
      setMessage(error.message || String(error));
    } finally {
      setUploading(false);
    }
  }

  function openDrawingForm(project, item) {
    setDrawingForm({
      projectId: project.id,
      itemCode: item.code,
      itemName: item.nameCn && zh ? item.nameCn : item.name
    });
    setDrawingFile(null);
    setDrawingNote("");
    setMessage("");
  }

  async function submitShopDrawing(event) {
    event.preventDefault();
    if (!drawingForm || !drawingFile) return;
    if (drawingFile.size > MAX_SHOP_DRAWING_SIZE) {
      setMessage(t("Shop-drawing files must be 30 MB or smaller.", "施工图文件不能超过 30 MB。"));
      return;
    }
    setDrawingUploading(true);
    setMessage("");
    let storagePath = "";
    try {
      const cleanName = drawingFile.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const cleanCode = drawingForm.itemCode.replace(/[^a-zA-Z0-9._-]+/g, "_");
      storagePath = `${user.id}/supplier-shop-drawings/${drawingForm.projectId}/${cleanCode}/${Date.now()}-${cleanName}`;
      const sha256 = await hashFile(drawingFile);
      const { error: uploadError } = await supabaseClient.storage
        .from("intake-files")
        .upload(storagePath, drawingFile, {
          contentType: drawingFile.type || "application/octet-stream",
          upsert: false
        });
      if (uploadError) throw uploadError;
      const result = await callWorkflowAi(supabaseClient, {
        action: "submit_supplier_shop_drawing",
        projectId: drawingForm.projectId,
        itemCode: drawingForm.itemCode,
        note: drawingNote,
        file: {
          bucket: "intake-files",
          path: storagePath,
          name: drawingFile.name,
          mimeType: drawingFile.type || "application/octet-stream",
          size: drawingFile.size,
          sha256
        }
      });
      setMessage(
        t(
          `${drawingForm.itemName} ${result.drawing?.payload?.revision || "revision"} submitted for technical review.`,
          `${drawingForm.itemName} ${result.drawing?.payload?.revision || "新版本"} 已提交技术审核。`
        )
      );
      setDrawingForm(null);
      await loadWorkspace();
    } catch (error) {
      if (storagePath)
        await supabaseClient.storage
          .from("intake-files")
          .remove([storagePath])
          .catch(() => null);
      setMessage(error.message || String(error));
    } finally {
      setDrawingUploading(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (newPassword.length < 10) {
      setMessage(t("Use a password with at least 10 characters.", "新密码至少需要 10 个字符。"));
      return;
    }
    setPasswordBusy(true);
    setMessage("");
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    setPasswordBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setNewPassword("");
    setPasswordOpen(false);
    setMessage(t("Password updated.", "登录密码已更新。"));
  }

  if (loading && !workspace) {
    return (
      <main className="supplier-portal-shell supplier-portal-loading">
        {t("Loading factory orders...", "正在加载工厂订单……")}
      </main>
    );
  }

  return (
    <main className="supplier-portal-shell">
      <section className="supplier-portal-hero">
        <div>
          <span>THE CRAFTON · SUPPLIER PRODUCTION PORTAL</span>
          <h1>{t("Factory production workspace", "供应商生产工作台")}</h1>
          <p>
            {t(
              "Report each work package here. Crafton AI checks deadlines and evidence completeness, then routes exceptions to Cho.",
              "请在这里上报每个生产工序。Crafton AI 会检查截止日期和证据完整性，并只把异常事项交给 Cho 处理。"
            )}
          </p>
        </div>
        <div className="supplier-portal-identity">
          <span>{t("Signed in factory", "当前登录工厂")}</span>
          <strong>{workspace?.supplier?.name || user?.company || user?.email}</strong>
          <small>{user?.email}</small>
          <button type="button" onClick={() => setPasswordOpen((value) => !value)}>
            {t("Change password", "修改密码")}
          </button>
        </div>
      </section>

      {passwordOpen && (
        <form className="supplier-password-form" onSubmit={changePassword}>
          <label>
            <span>{t("New password", "新密码")}</span>
            <input
              type="password"
              minLength="10"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder={t("At least 10 characters", "至少 10 个字符")}
            />
          </label>
          <button disabled={passwordBusy}>
            {passwordBusy ? t("Updating...", "正在更新……") : t("Update", "确认更新")}
          </button>
        </form>
      )}

      {message && <div className="supplier-portal-message">{message}</div>}

      <section className="supplier-portal-metrics">
        <Metric label={t("Assigned orders", "已分配订单")} value={workspace?.projects?.length || 0} />
        <Metric
          label={t("Reported progress", "供应商上报进度")}
          value={`${workspace?.summary?.reportedProgressPercent || 0}%`}
        />
        <Metric
          label={t("Evidence coverage", "证据完整度")}
          value={`${workspace?.summary?.evidenceCoveragePercent || 0}%`}
        />
        <Metric
          label={t("AI controller", "AI 生产控制器")}
          value={statusLabel(workspace?.summary?.controllerStatus, zh)}
          tone={
            workspace?.summary?.highRiskCount ? "danger" : workspace?.summary?.mediumRiskCount ? "warning" : "success"
          }
        />
      </section>

      {!workspace?.projects?.length ? (
        <section className="supplier-portal-empty">
          <strong>{t("No production orders are assigned yet.", "目前还没有分配给贵工厂的生产订单。")}</strong>
          <p>
            {t(
              "Only orders approved by Cho in S08 will appear here.",
              "只有 Cho 在 S08 批准给贵工厂的订单才会显示在这里。"
            )}
          </p>
        </section>
      ) : (
        workspace.projects.map((project) => (
          <section className="supplier-order-card" key={project.id}>
            <header>
              <div>
                <span>{project.orderCode}</span>
                <h2>{project.name}</h2>
              </div>
              <div>
                <span>{t("Evidence coverage", "证据完整度")}</span>
                <strong>{project.summary.evidenceCoveragePercent}%</strong>
              </div>
            </header>

            {project.specification?.items?.length > 0 && (
              <details className="supplier-order-specs">
                <summary>{t("View approved order items and specifications", "查看已批准的订单产品及规格")}</summary>
                <div className="supplier-spec-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("Item", "产品")}</th>
                        <th>{t("Qty", "数量")}</th>
                        <th>{t("Dimensions", "尺寸")}</th>
                        <th>{t("Material / finish", "材料 / 饰面")}</th>
                        <th>{t("Control points", "控制要求")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.specification.items.map((item) => (
                        <tr key={item.code}>
                          <td>
                            <strong>{item.code}</strong>
                            <br />
                            {item.nameCn && zh ? item.nameCn : item.name}
                          </td>
                          <td>
                            {item.quantity} {item.unit}
                          </td>
                          <td>{formatValue(item.dimensions)}</td>
                          <td>{[item.material, item.finish, item.color].filter(Boolean).join(" · ") || "-"}</td>
                          <td>{[item.tolerance, item.fireStandard, item.notes].filter(Boolean).join(" · ") || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}

            {project.specification?.items?.length > 0 && (
              <section className="supplier-shop-drawing-gate">
                <header>
                  <div>
                    <span>{t("SHOP-DRAWING GATE", "供应商施工图闸口")}</span>
                    <h3>{t("Upload professional CAD / shop drawings", "逐项上传专业 CAD／施工图")}</h3>
                    <p>
                      {t(
                        "The AI concept is a visual reference only. Upload a PDF preview, image, DWG or DXF revision for every item. Production release stays locked until Cho approves the latest revision.",
                        "AI 概念图只用于外观沟通。请为每个 item 上传 PDF 预览、图片、DWG 或 DXF；最新版本全部通过 Cho 技术审核后才会放行生产。"
                      )}
                    </p>
                  </div>
                  <strong>
                    {project.shopDrawings?.approvedCount || 0}/{project.specification.items.length}{" "}
                    {t("approved", "已批准")}
                  </strong>
                </header>
                <div className="supplier-shop-drawing-list">
                  {project.specification.items.map((item) => {
                    const latest = (project.shopDrawings?.latest || []).find(
                      (drawing) => String(drawing.itemCode).toLowerCase() === String(item.code).toLowerCase()
                    );
                    return (
                      <article className={`status-${latest?.status || "missing"}`} key={`shop-${item.code}`}>
                        <div>
                          <code>{item.code}</code>
                          <strong>{item.nameCn && zh ? item.nameCn : item.name}</strong>
                          <small>
                            {latest
                              ? `${latest.revision} · ${latest.fileName}`
                              : t("No supplier revision uploaded", "尚未上传供应商版本")}
                          </small>
                          {latest?.reviewNote && <p>{latest.reviewNote}</p>}
                        </div>
                        <span>{shopDrawingStatus(latest?.status, zh)}</span>
                        <div className="supplier-shop-drawing-actions">
                          {latest?.downloadUrl && (
                            <a href={latest.downloadUrl} target="_blank" rel="noreferrer">
                              {t("Open", "查看")}
                            </a>
                          )}
                          <button type="button" onClick={() => openDrawingForm(project, item)}>
                            {latest ? t("Upload new revision", "上传新版本") : t("Upload drawing", "上传施工图")}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {project.tasks.length > 0 && (
              <SupplierProductionPlanForm
                project={project}
                lang={lang}
                supabaseClient={supabaseClient}
                onSubmitted={loadWorkspace}
              />
            )}

            {!project.tasks.length ? (
              <div className="supplier-portal-empty compact">
                {t("Crafton is preparing the production work packages.", "Crafton 正在准备生产工序任务。")}
              </div>
            ) : (
              <div className="supplier-task-list">
                {project.tasks.map((task, index) => (
                  <article className={`supplier-task-card risk-${task.analysis?.riskLevel || "low"}`} key={task.id}>
                    <div className="supplier-task-sequence">{String(index + 1).padStart(2, "0")}</div>
                    <div className="supplier-task-main">
                      <div className="supplier-task-heading">
                        <div>
                          <span>{task.item_name || t("Order work package", "订单生产工序")}</span>
                          <h3>{task.process_name}</h3>
                        </div>
                        <b>{statusLabel(task.analysis?.controllerStatus || task.status, zh)}</b>
                      </div>
                      <div className="supplier-task-progress">
                        <div>
                          <span style={{ width: `${task.progress_percent || 0}%` }} />
                        </div>
                        <strong>{task.progress_percent || 0}%</strong>
                      </div>
                      <div className="supplier-task-meta">
                        <span>
                          {task.analysis?.productionPlan?.hasApprovedBaseline
                            ? t("Approved due", "已批准截止时间")
                            : t("Proposed due", "工厂建议完成时间")}
                          :{" "}
                          <strong>
                            {dateTime(
                              task.analysis?.productionPlan?.hasApprovedBaseline
                                ? task.expected_at
                                : task.analysis?.productionPlan?.latest?.expected_at,
                              zh
                            )}
                          </strong>
                        </span>
                        <span>
                          {t("Evidence", "证据")}: <strong>{task.analysis?.evidenceCoveragePercent || 0}%</strong>
                        </span>
                        <span>
                          {t("Last report", "最近上报")}:{" "}
                          <strong>{dateTime(task.analysis?.latestSupplierReportAt, zh)}</strong>
                        </span>
                      </div>
                      <div className="supplier-evidence-checklist">
                        {(task.analysis?.requiredEvidence || []).map((item) => {
                          const submitted = (task.analysis?.submittedRequirements || []).some(
                            (value) => value.toLowerCase() === item.toLowerCase()
                          );
                          return (
                            <span className={submitted ? "done" : ""} key={item}>
                              {submitted ? "✓" : "○"} {item}
                            </span>
                          );
                        })}
                      </div>
                      {task.analysis?.reasons?.length > 0 && (
                        <div className="supplier-task-alert">{task.analysis.reasons.join(" ")}</div>
                      )}
                      {task.analysis?.completionReview?.status === "changes_required" && (
                        <div className="supplier-task-alert completion-review">
                          <strong>{t("Cho returned this evidence", "Cho 已退回本工序证据")}</strong>
                          <span>
                            {task.analysis.completionReview.latestReview?.note ||
                              t("Upload corrected evidence for another review.", "请上传修正后的证据并重新提交审核。")}
                          </span>
                        </div>
                      )}
                      {task.analysis?.completionReview?.status === "approved" && (
                        <div className="supplier-task-approved">
                          {t(
                            "Cho approved this work package. Further uploads are locked.",
                            "Cho 已批准本工序完工，系统已锁定后续上传。"
                          )}
                        </div>
                      )}
                      {!task.analysis?.productionPlan?.hasApprovedBaseline && (
                        <div className="supplier-task-plan-note">
                          {t(
                            "You can upload progress photos now. Until Cho approves the factory schedule, these reports are saved without overdue judgement.",
                            "现在可以先上传生产进度照片。Cho 批准工厂排产之前，系统会保存照片和进度，但不会按建议日期判断逾期。"
                          )}
                        </div>
                      )}
                      <div className="supplier-evidence-history">
                        {(task.evidence || [])
                          .filter((entry) => entry.type === "supplier_upload")
                          .map((entry, evidenceIndex) => (
                            <a
                              key={`${entry.sha256}-${evidenceIndex}`}
                              href={entry.downloadUrl || undefined}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {entry.file_name} · {dateTime(entry.uploaded_at, zh)}
                            </a>
                          ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="supplier-task-upload"
                      disabled={
                        task.analysis?.completionReview?.status === "approved" || !supplierDrawingsApproved(project)
                      }
                      onClick={() => openEvidenceForm(task)}
                      title={
                        !supplierDrawingsApproved(project)
                          ? t(
                              "Production reporting opens after every shop drawing is approved.",
                              "全部施工图批准后才开放生产上报。"
                            )
                          : ""
                      }
                    >
                      {!supplierDrawingsApproved(project)
                        ? t("Awaiting drawing approval", "等待施工图批准")
                        : task.analysis?.completionReview?.status === "approved"
                          ? t("Completion approved", "完工已批准")
                          : task.analysis?.completionReview?.status === "changes_required"
                            ? t("Upload corrected evidence", "上传修正证据")
                            : t("Upload photos / report progress", "上传进度照片 / 上报进度")}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))
      )}

      {activeTask && (
        <div
          className="supplier-evidence-modal"
          role="presentation"
          onMouseDown={() => !uploading && setActiveTaskId("")}
        >
          <form
            role="dialog"
            aria-modal="true"
            onSubmit={submitEvidence}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>{t("SUPPLIER EVIDENCE REPORT", "供应商生产证据上报")}</span>
                <h2>{activeTask.process_name}</h2>
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => setActiveTaskId("")}
                aria-label={t("Close", "关闭")}
              >
                ×
              </button>
            </header>
            <label>
              <span>{t("Evidence requirement", "本次上报对应的证据要求")}</span>
              <select value={requirement} onChange={(event) => setRequirement(event.target.value)} required>
                {(activeTask.analysis?.requiredEvidence?.length
                  ? activeTask.analysis.requiredEvidence
                  : ["Production evidence"]
                ).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>
                {t("Current production progress", "当前生产进度")}: {progress}%
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(event) => setProgress(event.target.value)}
              />
            </label>
            <label>
              <span>{t("Evidence file", "证据文件")}</span>
              <input
                type="file"
                accept={ACCEPTED_FILES}
                required
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <small>
                {t("Photos, PDF, Word or Excel; maximum 15 MB.", "支持照片、PDF、Word 或 Excel；每个文件最大 15 MB。")}
              </small>
            </label>
            <label>
              <span>{t("Factory note", "工厂说明")}</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t(
                  "What was completed? Any deviation or blocker?",
                  "已经完成了什么？有没有偏差、返工或阻塞？"
                )}
              />
            </label>
            <div className="supplier-evidence-actions">
              <button type="button" disabled={uploading} onClick={() => setActiveTaskId("")}>
                {t("Cancel", "取消")}
              </button>
              <button className="primary" disabled={uploading}>
                {uploading
                  ? t("Uploading and checking...", "正在上传并由 AI 检查……")
                  : t("Submit to Crafton AI", "提交给 Crafton AI")}
              </button>
            </div>
          </form>
        </div>
      )}

      {drawingForm && (
        <div
          className="supplier-evidence-modal"
          role="presentation"
          onMouseDown={() => !drawingUploading && setDrawingForm(null)}
        >
          <form
            role="dialog"
            aria-modal="true"
            onSubmit={submitShopDrawing}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>{t("SUPPLIER SHOP-DRAWING REVISION", "供应商施工图版本")}</span>
                <h2>{drawingForm.itemName}</h2>
              </div>
              <button type="button" disabled={drawingUploading} onClick={() => setDrawingForm(null)}>
                ×
              </button>
            </header>
            <div className="supplier-shop-drawing-warning">
              <strong>{t("Manufacturing responsibility", "生产责任说明")}</strong>
              <p>
                {t(
                  "This revision must contain production-accurate geometry, dimensions, construction and tolerances. It supersedes the AI concept only after Cho approval.",
                  "本版本必须包含可生产的准确几何、尺寸、结构与公差；只有 Cho 批准后才会取代 AI 概念参考。"
                )}
              </p>
            </div>
            <label>
              <span>{t("PDF preview / image / DWG / DXF", "PDF 预览／图片／DWG／DXF")}</span>
              <input
                type="file"
                accept={SHOP_DRAWING_FILES}
                required
                onChange={(event) => setDrawingFile(event.target.files?.[0] || null)}
              />
              <small>
                {t(
                  "Maximum 30 MB. Uploading creates a new immutable revision.",
                  "最大 30 MB；每次上传都会建立一个不可覆盖的新版本。"
                )}
              </small>
            </label>
            <label>
              <span>{t("Revision note", "版本说明")}</span>
              <textarea
                value={drawingNote}
                onChange={(event) => setDrawingNote(event.target.value)}
                placeholder={t("What changed in this revision?", "本版本修改了什么？")}
              />
            </label>
            <div className="supplier-evidence-actions">
              <button type="button" disabled={drawingUploading} onClick={() => setDrawingForm(null)}>
                {t("Cancel", "取消")}
              </button>
              <button className="primary" disabled={drawingUploading || !drawingFile}>
                {drawingUploading
                  ? t("Uploading revision...", "正在上传版本……")
                  : t("Submit for Cho review", "提交 Cho 审核")}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

async function hashFile(file) {
  const digest = await window.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function formatValue(value) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(" × ");
  return Object.values(value).filter(Boolean).join(" × ");
}

function analysisText(analysis, zh) {
  if (!analysis) return zh ? "已接收并继续监控" : "accepted and monitoring";
  if (analysis.readyForReview) return zh ? "证据齐全，等待 Cho 审核" : "evidence complete; ready for Cho review";
  if (analysis.riskLevel === "high")
    return zh ? "发现高风险，需要人工处理" : "high risk detected; intervention required";
  if (analysis.missingEvidence?.length) {
    return zh
      ? `仍缺少 ${analysis.missingEvidence.length} 项证据`
      : `${analysis.missingEvidence.length} evidence item(s) remain`;
  }
  return zh ? "证据已接收并继续监控" : "evidence accepted and monitoring";
}

function shopDrawingStatus(status, zh) {
  const labels = {
    missing: ["Missing", "待上传"],
    pending_review: ["Cho review", "等待 Cho 审核"],
    changes_required: ["Revision required", "需要修订"],
    approved: ["Approved for manufacture", "已批准生产"]
  };
  return labels[status || "missing"]?.[zh ? 1 : 0] || status || "-";
}

function supplierDrawingsApproved(project) {
  const itemCount = project?.specification?.items?.length || 0;
  return itemCount > 0 && Number(project?.shopDrawings?.approvedCount || 0) === itemCount;
}
