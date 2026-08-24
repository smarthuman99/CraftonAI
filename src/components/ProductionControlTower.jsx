import React, { useEffect, useMemo, useState } from "react";
import { callWorkflowAi } from "./workflowAiClient";

const formatDate = (value, zh) =>
  value ? new Date(value).toLocaleString(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "-";

const PRODUCTION_PROCESSES = [
  "material_procurement",
  "frame_production",
  "upholstery",
  "finishing",
  "assembly",
  "pre_shipment_qc"
];

const label = (value, zh) => {
  const labels = {
    low: ["Monitoring", "正常监控"],
    medium: ["Attention", "需要关注"],
    high: ["Intervention", "需要介入"],
    not_started: ["Not started", "未开始"],
    in_progress: ["In progress", "生产中"],
    pending_review: ["Cho review", "等待 Cho 审核"],
    completed: ["Cho approved", "Cho 已批准"],
    evidence_changes_required: ["Evidence changes required", "完工证据需要修改"],
    awaiting_framework: ["Awaiting framework", "等待工序框架"],
    awaiting_supplier_plan: ["Awaiting factory schedule", "等待工厂排产"],
    changes_required: ["AI requires changes", "AI 要求修改"],
    ai_review: ["AI validation", "AI 校验中"],
    awaiting_cho_approval: ["Awaiting Cho approval", "等待 Cho 批准"],
    revision_pending_cho: ["Revision awaiting Cho", "改期版本等待 Cho"],
    approved: ["Approved baseline", "正式基准已批准"]
  };
  return labels[value]?.[zh ? 1 : 0] || String(value || "-").replaceAll("_", " ");
};

function taskEvidence(task) {
  const entries = Array.isArray(task.evidence) ? task.evidence : [];
  const required = [
    ...new Set(entries.filter((entry) => entry?.type === "ai_plan").flatMap((entry) => entry.required || []))
  ];
  const uploads = entries.filter((entry) => entry?.type === "supplier_upload");
  const submitted = new Set(uploads.map((entry) => String(entry.requirement || "").toLowerCase()));
  const complete = required.filter((item) => submitted.has(String(item).toLowerCase()));
  return {
    required,
    uploads,
    missing: required.filter((item) => !submitted.has(String(item).toLowerCase())),
    coverage: required.length ? Math.round((complete.length / required.length) * 100) : uploads.length ? 100 : 0
  };
}

function latestEntry(task, type) {
  return (
    (Array.isArray(task?.evidence) ? task.evidence : [])
      .filter((entry) => entry?.type === type)
      .sort((a, b) => Number(b.version || 0) - Number(a.version || 0))[0] || null
  );
}

function evidenceTimestamp(entry = {}) {
  const timestamp = Date.parse(
    entry.reviewed_at || entry.uploaded_at || entry.created_at || entry.submitted_at || entry.approved_at || ""
  );
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function completionReview(task) {
  const evidence = Array.isArray(task?.evidence) ? task.evidence : [];
  const uploads = evidence.filter((entry) => entry?.type === "supplier_upload");
  const review = evidence
    .filter((entry) => entry?.type === "cho_evidence_review")
    .sort((a, b) => evidenceTimestamp(b) - evidenceTimestamp(a))[0];
  const latestUploadAt = uploads.reduce((latest, entry) => Math.max(latest, evidenceTimestamp(entry)), 0);
  const current = review && evidenceTimestamp(review) >= latestUploadAt ? review : null;
  return {
    status: current?.decision === "approved" || current?.decision === "changes_required" ? current.decision : "pending",
    review: current,
    uploads
  };
}

function scheduleDashboard(tasks) {
  const frameworkTasks = tasks.filter((task) => {
    const entries = Array.isArray(task?.evidence) ? task.evidence : [];
    return (
      entries.some((entry) => ["ai_plan", "supplier_plan"].includes(entry?.type)) ||
      PRODUCTION_PROCESSES.includes(task?.process_name)
    );
  });
  if (!frameworkTasks.length) {
    return { status: "awaiting_framework", version: 0, approvedVersion: 0, issues: [], canApprove: false };
  }
  const plans = frameworkTasks.map((task) => latestEntry(task, "supplier_plan"));
  if (plans.some((entry) => !entry)) {
    return { status: "awaiting_supplier_plan", version: 0, approvedVersion: 0, issues: [], canApprove: false };
  }
  const version = Math.max(...plans.map((entry) => Number(entry.version || 0)));
  const reviews = frameworkTasks.map((task) => latestEntry(task, "ai_plan_review"));
  const approvals = frameworkTasks.map((task) => latestEntry(task, "cho_plan_approval"));
  const approvedVersion = Math.min(...approvals.map((entry) => Number(entry?.version || 0)));
  const issues = reviews
    .filter((entry) => Number(entry?.version || 0) === version)
    .flatMap((entry) => entry.issues || [])
    .filter(
      (issue, index, list) =>
        list.findIndex((entry) => entry.code === issue.code && entry.taskId === issue.taskId) === index
    );
  const changesRequired = reviews.some(
    (entry) => Number(entry?.version || 0) === version && entry.status === "changes_required"
  );
  const approved = approvals.every((entry) => Number(entry?.version || 0) === version);
  const ready = reviews.every(
    (entry) => Number(entry?.version || 0) === version && entry.status === "ready_for_cho_review"
  );
  const status = changesRequired
    ? "changes_required"
    : approved
      ? "approved"
      : ready && approvedVersion > 0
        ? "revision_pending_cho"
        : ready
          ? "awaiting_cho_approval"
          : "ai_review";
  const proposedCompletion = plans
    .map((entry) => entry.expected_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];
  const approvedCompletion = frameworkTasks
    .map((task) => task.expected_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];
  return {
    status,
    version,
    approvedVersion,
    issues,
    proposedCompletion,
    approvedCompletion,
    canApprove: ["awaiting_cho_approval", "revision_pending_cho"].includes(status)
  };
}

function copyText(value) {
  if (window.navigator.clipboard?.writeText) return window.navigator.clipboard.writeText(value);
  return Promise.reject(new Error("Clipboard is unavailable."));
}

function productionDrawingStatus(status, zh) {
  const labels = {
    missing: ["Missing", "待上传"],
    pending_review: ["Technical review", "等待技术审核"],
    changes_required: ["Supplier revision required", "等待供应商修订"],
    approved: ["Approved for manufacture", "已批准生产"]
  };
  return labels[status || "missing"]?.[zh ? 1 : 0] || status || "-";
}

export default function ProductionControlTower({
  lang = "En",
  project,
  supabaseClient,
  suppliers = [],
  quotes = [],
  rfqBatches = [],
  projectFiles = [],
  productionUpdates = [],
  onChanged
}) {
  const zh = lang === "Cn";
  const t = (en, cn) => (zh ? cn : en);
  const selectedQuote = quotes.find((quote) => quote.status === "selected") || null;
  const selectedSupplier = suppliers.find((supplier) => supplier.id === selectedQuote?.supplier_id) || null;
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [credentials, setCredentials] = useState(null);
  const [reviewTaskId, setReviewTaskId] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewRiskAcknowledged, setReviewRiskAcknowledged] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState({});
  const [drawingReviewId, setDrawingReviewId] = useState("");
  const [drawingReviewNote, setDrawingReviewNote] = useState("");
  const [drawingUrls, setDrawingUrls] = useState({});

  const drawingGate = useMemo(() => {
    const latestRfq = [...rfqBatches].sort((left, right) =>
      String(right.created_at || "").localeCompare(String(left.created_at || ""))
    )[0];
    const document = latestRfq?.payload?.document || latestRfq?.payload || {};
    const items = Array.isArray(document.items) ? document.items : [];
    const revisions = projectFiles
      .filter(
        (file) =>
          file.file_group === "supplier_shop_drawing" &&
          (!selectedSupplier || String(file.payload?.supplier_id) === String(selectedSupplier.id))
      )
      .sort((left, right) => {
        const revisionDelta = Number(right.payload?.revision_number || 0) - Number(left.payload?.revision_number || 0);
        return revisionDelta || String(right.created_at || "").localeCompare(String(left.created_at || ""));
      });
    const latestByCode = new Map();
    revisions.forEach((file) => {
      const key = String(file.payload?.item_code || "").toLowerCase();
      if (key && !latestByCode.has(key)) latestByCode.set(key, file);
    });
    const rows = items.map((item, index) => {
      const code = item.code || item.itemCode || item.item_code || `ITEM-${String(index + 1).padStart(2, "0")}`;
      const name = item.nameEn || item.nameCn || item.name || item.item || code;
      const file = latestByCode.get(String(code).toLowerCase()) || null;
      return { code, name, file, status: file?.payload?.review_status || "missing" };
    });
    return {
      rows,
      revisions,
      approved: rows.length > 0 && rows.every((row) => row.status === "approved"),
      approvedCount: rows.filter((row) => row.status === "approved").length
    };
  }, [projectFiles, rfqBatches, selectedSupplier]);

  const dashboard = useMemo(() => {
    const selectedTasks = productionUpdates.filter(
      (task) => !selectedSupplier || task.supplier_id === selectedSupplier.id
    );
    const hashCounts = new Map();
    selectedTasks.forEach((task) => {
      taskEvidence(task).uploads.forEach((entry) => {
        if (entry.sha256) hashCounts.set(entry.sha256, (hashCounts.get(entry.sha256) || 0) + 1);
      });
    });
    const tasks = selectedTasks.map((task) => {
      const hasApprovedBaseline = Boolean(latestEntry(task, "cho_plan_approval"));
      const evidenceSummary = taskEvidence(task);
      return {
        ...task,
        evidenceSummary,
        completionReview: completionReview(task),
        duplicateEvidence: evidenceSummary.uploads.some(
          (entry) => entry.sha256 && Number(hashCounts.get(entry.sha256) || 0) > 1
        ),
        hasApprovedBaseline,
        activeRiskLevel: hasApprovedBaseline ? task.risk_level || "low" : "low"
      };
    });
    const schedule = scheduleDashboard(tasks);
    const progress = tasks.length
      ? Math.round(tasks.reduce((sum, task) => sum + Number(task.progress_percent || 0), 0) / tasks.length)
      : 0;
    const evidenceCoverage = tasks.length
      ? Math.round(tasks.reduce((sum, task) => sum + task.evidenceSummary.coverage, 0) / tasks.length)
      : 0;
    const latestReport = tasks
      .map((task) => task.evidenceSummary.uploads.map((entry) => entry.uploaded_at).filter(Boolean))
      .flat()
      .sort()
      .reverse()[0];
    return {
      tasks,
      progress,
      evidenceCoverage,
      latestReport,
      highRisks: tasks.filter((task) => task.activeRiskLevel === "high").length,
      mediumRisks: tasks.filter((task) => task.activeRiskLevel === "medium").length,
      readyForReview: tasks.filter(
        (task) => Number(task.progress_percent || 0) >= 100 && task.evidenceSummary.missing.length === 0
      ).length,
      approvedCompletion: tasks.filter((task) => task.completionReview.status === "approved").length,
      changesRequired: tasks.filter((task) => task.completionReview.status === "changes_required").length,
      allCompletionApproved: tasks.length > 0 && tasks.every((task) => task.completionReview.status === "approved"),
      schedule
    };
  }, [productionUpdates, selectedSupplier]);

  const reviewTask = dashboard.tasks.find((task) => task.id === reviewTaskId) || null;
  const reviewEvidenceReady = Boolean(
    reviewTask &&
    reviewTask.completionReview.status === "pending" &&
    Number(reviewTask.progress_percent || 0) >= 100 &&
    reviewTask.evidenceSummary.missing.length === 0
  );
  const reviewRequiresRiskAcknowledgement = Boolean(
    reviewTask && (reviewTask.duplicateEvidence || String(reviewTask.risk_level || "low") !== "low")
  );
  const canApproveReviewTask = Boolean(
    reviewEvidenceReady &&
    (!reviewRequiresRiskAcknowledgement || (reviewRiskAcknowledged && reviewNote.trim().length > 0))
  );

  useEffect(() => {
    let active = true;
    const files = dashboard.tasks.flatMap((task) =>
      task.completionReview.uploads
        .filter((entry) => entry?.bucket && entry?.path)
        .map((entry) => ({ key: `${entry.bucket}:${entry.path}`, ...entry }))
    );
    if (!files.length) {
      setEvidenceUrls({});
      return () => {
        active = false;
      };
    }
    Promise.all(
      files.map(async (entry) => {
        const { data } = await supabaseClient.storage.from(entry.bucket).createSignedUrl(entry.path, 60 * 60);
        return [entry.key, data?.signedUrl || ""];
      })
    )
      .then((entries) => {
        if (active) setEvidenceUrls(Object.fromEntries(entries));
      })
      .catch(() => {
        if (active) setEvidenceUrls({});
      });
    return () => {
      active = false;
    };
  }, [dashboard.tasks, supabaseClient]);

  useEffect(() => {
    let active = true;
    const files = drawingGate.revisions.filter((file) => file.file_path);
    Promise.all(
      files.map(async (file) => {
        const bucket = file.payload?.storage_bucket || "intake-files";
        const { data } = await supabaseClient.storage.from(bucket).createSignedUrl(file.file_path, 60 * 60);
        return [file.id, data?.signedUrl || ""];
      })
    )
      .then((entries) => active && setDrawingUrls(Object.fromEntries(entries)))
      .catch(() => active && setDrawingUrls({}));
    return () => {
      active = false;
    };
  }, [drawingGate.revisions, supabaseClient]);

  async function createAccess() {
    if (!selectedSupplier) return;
    setBusy("account");
    setMessage("");
    setCredentials(null);
    try {
      const result = await callWorkflowAi(supabaseClient, {
        action: "create_supplier_portal_account",
        projectId: project.id,
        supplierId: selectedSupplier.id
      });
      setCredentials(result.account);
      setMessage(
        result.created
          ? t(
              "Supplier account created. Share the credentials securely with the factory.",
              "供应商账号已创建，请通过安全方式把登录资料交给工厂。"
            )
          : t("Supplier access reset. The previous password no longer works.", "供应商登录资料已重置，旧密码已失效。")
      );
      onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  async function runController() {
    setBusy("analyze");
    setMessage("");
    try {
      const result = await callWorkflowAi(supabaseClient, {
        action: "analyze_production_progress",
        projectId: project.id
      });
      setMessage(
        t(
          `AI checked ${result.summary.taskCount} work packages: ${result.summary.highRiskCount} high risks, ${result.summary.mediumRiskCount} medium risks and ${result.summary.evidenceCoveragePercent}% evidence coverage.`,
          `AI 已检查 ${result.summary.taskCount} 个生产工序：${result.summary.highRiskCount} 个高风险、${result.summary.mediumRiskCount} 个中风险，证据完整度 ${result.summary.evidenceCoveragePercent}%。`
        )
      );
      onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  async function approveSchedule() {
    setBusy("schedule");
    setMessage("");
    try {
      const result = await callWorkflowAi(supabaseClient, {
        action: "approve_supplier_production_plan",
        projectId: project.id
      });
      setMessage(
        t(
          `Factory schedule v${result.summary.planVersion} approved. It is now the active production baseline.`,
          `供应商第 ${result.summary.planVersion} 版排产已批准，现已成为正式生产跟单基准。`
        )
      );
      onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  async function reviewShopDrawing(decision) {
    if (!drawingReviewId) return;
    if (decision === "changes_required" && !drawingReviewNote.trim()) {
      setMessage(t("Explain what the supplier must correct.", "请说明供应商需要修正的内容。"));
      return;
    }
    setBusy(`drawing-${drawingReviewId}`);
    setMessage("");
    try {
      await callWorkflowAi(supabaseClient, {
        action: "review_supplier_shop_drawing",
        projectFileId: drawingReviewId,
        decision,
        note: drawingReviewNote.trim()
      });
      setMessage(
        decision === "approved"
          ? t("Shop drawing approved for manufacture.", "施工图已批准用于生产。")
          : t("Revision returned to the supplier.", "该版本已退回供应商修订。")
      );
      setDrawingReviewId("");
      setDrawingReviewNote("");
      await onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  function openCompletionReview(task) {
    setReviewTaskId(task.id);
    setReviewNote(task.completionReview.review?.note || "");
    setReviewRiskAcknowledged(false);
    setMessage("");
  }

  async function submitCompletionReview(decision) {
    if (!reviewTask) return;
    if (decision === "changes_required" && !reviewNote.trim()) {
      setMessage(
        t("Explain what the supplier must correct or upload again.", "请说明供应商需要修正或重新上传的内容。")
      );
      return;
    }
    setBusy(`review-${reviewTask.id}`);
    setMessage("");
    try {
      const result = await callWorkflowAi(supabaseClient, {
        action: "review_production_evidence",
        projectId: project.id,
        productionUpdateId: reviewTask.id,
        decision,
        note: reviewNote.trim(),
        acknowledgeRisk: reviewRiskAcknowledged
      });
      setMessage(
        result.projectReleased
          ? t(
              "All production evidence is approved. The project has entered S11 visual quality inspection.",
              "全部生产工序的完工证据已批准，项目已进入 S11 视觉品质检验。"
            )
          : decision === "approved"
            ? t(
                "Completion evidence approved. Review the remaining work packages before S11 release.",
                "该工序完工证据已批准，请继续审核其余工序后再统一进入 S11。"
              )
            : t(
                "Evidence returned to the supplier. The exception is now tracked in S10.",
                "证据已退回供应商，相关异常现已进入 S10 跟进。"
              )
      );
      setReviewTaskId("");
      setReviewNote("");
      setReviewRiskAcknowledged(false);
      await onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="production-control-tower">
      <div className="production-controller-command">
        <div>
          <span>CRAFTON AI · PRODUCTION CONTROLLER</span>
          <h4>
            {t(
              "AI owns routine follow-up; Cho handles exceptions and release gates",
              "AI 负责日常跟单；Cho 只处理异常和放行审核"
            )}
          </h4>
          <p>
            {t(
              "The controller checks supplier evidence, missing proof, duplicate files, update gaps and overdue work packages.",
              "控制器持续检查供应商证据、缺失资料、重复文件、长期未上报和逾期工序。"
            )}
          </p>
        </div>
        <button type="button" disabled={Boolean(busy) || !dashboard.tasks.length} onClick={runController}>
          {busy === "analyze"
            ? t("AI is checking...", "AI 正在检查……")
            : t("Run AI controller now", "立即运行 AI 生产控制器")}
        </button>
      </div>

      {message && <div className="production-controller-message">{message}</div>}

      <div className="production-controller-metrics">
        <article>
          <span>{t("Supplier-reported progress", "供应商上报进度")}</span>
          <strong>{dashboard.progress}%</strong>
          <small>{t("Not a Crafton release approval", "不等于 Crafton 放行")}</small>
        </article>
        <article>
          <span>{t("Evidence coverage", "生产证据完整度")}</span>
          <strong>{dashboard.evidenceCoverage}%</strong>
          <small>
            {dashboard.readyForReview} {t("ready for Cho review", "项等待 Cho 审核")}
          </small>
        </article>
        <article className={dashboard.highRisks ? "danger" : dashboard.mediumRisks ? "warning" : "success"}>
          <span>{t("AI exception queue", "AI 异常队列")}</span>
          <strong>{dashboard.highRisks + dashboard.mediumRisks}</strong>
          <small>
            {dashboard.highRisks} {t("high", "高风险")} · {dashboard.mediumRisks} {t("medium", "中风险")}
          </small>
        </article>
        <article>
          <span>{t("Last factory evidence", "工厂最近上报")}</span>
          <strong className="date-value">{formatDate(dashboard.latestReport, zh)}</strong>
          <small>{t("Private, audit-hashed files", "私有文件并记录审计哈希")}</small>
        </article>
      </div>

      <section className="supplier-access-control">
        <div>
          <span>{t("SUPPLIER ACCESS", "供应商网站账号")}</span>
          <h4>{selectedSupplier?.name || t("No supplier approved in S08", "S08 尚未批准供应商")}</h4>
          <p>
            {selectedSupplier
              ? `${selectedSupplier.email || selectedSupplier.contact_email || t("Missing contact email", "缺少联系人邮箱")} · ${t(
                  "This account only receives this factory's approved orders and production tasks.",
                  "该账号只会收到属于这家工厂的已批准订单和生产任务。"
                )}`
              : t(
                  "Approve the winning supplier in menu 02 before releasing production access.",
                  "请先在菜单 02 批准中选供应商，之后才能开通生产工作台。"
                )}
          </p>
        </div>
        <button type="button" disabled={Boolean(busy) || !selectedSupplier} onClick={createAccess}>
          {busy === "account"
            ? t("Creating access...", "正在开通……")
            : t("Create / reset supplier login", "创建 / 重置供应商账号")}
        </button>
      </section>

      {credentials && (
        <div className="supplier-credentials-once">
          <div>
            <span>{t("SHOW ONCE — STORE SECURELY", "仅本次显示 — 请安全保存")}</span>
            <strong>{credentials.email}</strong>
            <code>{credentials.temporaryPassword}</code>
          </div>
          <button
            type="button"
            onClick={() =>
              copyText(`${credentials.email}\n${credentials.temporaryPassword}`)
                .then(() => setMessage(t("Credentials copied.", "登录资料已复制。")))
                .catch((error) => setMessage(error.message))
            }
          >
            {t("Copy login details", "复制登录资料")}
          </button>
        </div>
      )}

      <section className={`production-drawing-gate ${drawingGate.approved ? "approved" : "blocked"}`}>
        <header>
          <div>
            <span>{t("SUPPLIER SHOP-DRAWING GATE", "供应商施工图闸口")}</span>
            <h4>
              {drawingGate.approved
                ? t("All current revisions are approved for manufacture", "全部最新版本已批准用于生产")
                : t("Manufacturing release is locked", "生产放行仍被锁定")}
            </h4>
            <p>
              {t(
                "AI concept views are never approved as production geometry. Review the appointed supplier's latest CAD/shop-drawing revision for every item.",
                "AI 概念视图永远不会被批准为生产几何。请逐项审核中选供应商最新的 CAD／施工图版本。"
              )}
            </p>
          </div>
          <strong>
            {drawingGate.approvedCount}/{drawingGate.rows.length || "—"}
            <small>{t("items approved", "项已批准")}</small>
          </strong>
        </header>
        {!drawingGate.rows.length ? (
          <div className="production-drawing-empty">
            {t(
              "Create the RFQ item package before opening the drawing gate.",
              "请先建立 RFQ item 资料包，再开启施工图闸口。"
            )}
          </div>
        ) : (
          <div className="production-drawing-list">
            {drawingGate.rows.map((row) => (
              <article className={`status-${row.status}`} key={`admin-drawing-${row.code}`}>
                <div>
                  <code>{row.code}</code>
                  <strong>{row.name}</strong>
                  <small>
                    {row.file
                      ? `${row.file.payload?.revision || "R00"} · ${row.file.file_name}`
                      : t("Awaiting supplier upload", "等待供应商上传")}
                  </small>
                  {row.file?.payload?.review_note && <p>{row.file.payload.review_note}</p>}
                </div>
                <span>{productionDrawingStatus(row.status, zh)}</span>
                <div>
                  {row.file && drawingUrls[row.file.id] && (
                    <a href={drawingUrls[row.file.id]} target="_blank" rel="noreferrer">
                      {t("Open revision", "查看版本")}
                    </a>
                  )}
                  {row.file && row.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => {
                        setDrawingReviewId(row.file.id);
                        setDrawingReviewNote(row.file.payload?.review_note || "");
                        setMessage("");
                      }}
                    >
                      {t("Technical review", "技术审核")}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {drawingReviewId && (
          <div className="production-drawing-review">
            <label>
              <span>{t("Technical review note / correction instruction", "技术审核备注／修正指示")}</span>
              <textarea
                value={drawingReviewNote}
                onChange={(event) => setDrawingReviewNote(event.target.value)}
                placeholder={t(
                  "Check geometry, dimensions, construction, tolerances and revision scope.",
                  "检查几何、尺寸、结构、公差及本次版本范围。"
                )}
              />
            </label>
            <div>
              <button type="button" disabled={Boolean(busy)} onClick={() => reviewShopDrawing("changes_required")}>
                {t("Return for revision", "退回修订")}
              </button>
              <button
                className="approve"
                type="button"
                disabled={Boolean(busy)}
                onClick={() => reviewShopDrawing("approved")}
              >
                {busy === `drawing-${drawingReviewId}`
                  ? t("Saving review...", "正在保存审核……")
                  : t("Approve for manufacture", "批准用于生产")}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={`production-schedule-approval schedule-${dashboard.schedule.status}`}>
        <header>
          <div>
            <span>{t("FACTORY PRODUCTION SCHEDULE", "供应商真实生产排期")}</span>
            <h4>{label(dashboard.schedule.status, zh)}</h4>
            <p>
              {t(
                "AI validates the supplier's dates, capacity, process sequence, quoted lead time and shipping buffer. Only Cho approval activates a new baseline.",
                "AI 会校验供应商日期、产能、工序顺序、报价交期和运输缓冲期；只有 Cho 批准后，新版本才会成为正式基准。"
              )}
            </p>
          </div>
          <div className="production-schedule-version">
            <span>{t("Supplier version", "供应商版本")}</span>
            <strong>V{dashboard.schedule.version || "—"}</strong>
            <small>
              {t("Approved baseline", "已批准基准")} V{dashboard.schedule.approvedVersion || "—"}
            </small>
          </div>
        </header>
        <div className="production-schedule-dates">
          <div>
            <span>{t("Supplier proposed completion", "供应商建议完工")}</span>
            <strong>{formatDate(dashboard.schedule.proposedCompletion, zh)}</strong>
          </div>
          <div>
            <span>{t("Active approved completion", "当前批准完工")}</span>
            <strong>{formatDate(dashboard.schedule.approvedCompletion, zh)}</strong>
          </div>
        </div>
        {dashboard.schedule.issues.length > 0 && (
          <div className="production-schedule-issues">
            {dashboard.schedule.issues.map((issue, index) => (
              <div className={issue.severity === "high" ? "high" : "warning"} key={`${issue.code}-${index}`}>
                <strong>{issue.severity === "high" ? t("Must fix", "必须修正") : t("AI warning", "AI 提醒")}</strong>
                <span>
                  {issue.taskName ? `${issue.taskName}: ` : ""}
                  {zh ? issue.messageCn || issue.message : issue.message}
                </span>
              </div>
            ))}
          </div>
        )}
        <footer>
          <p>
            {dashboard.schedule.status === "revision_pending_cho"
              ? t(
                  "The previous approved schedule remains active until this revision is approved.",
                  "在本次改期获批之前，原已批准排产仍然是有效跟单基准。"
                )
              : t(
                  "Production overdue alerts stay disabled until the first supplier schedule is approved.",
                  "首版供应商排产获批之前，系统不会按 AI 预测日期产生逾期警报。"
                )}
          </p>
          <button
            type="button"
            disabled={Boolean(busy) || !dashboard.schedule.canApprove || !drawingGate.approved}
            onClick={approveSchedule}
            title={
              !drawingGate.approved ? t("Approve every supplier shop drawing first.", "请先批准全部供应商施工图。") : ""
            }
          >
            {busy === "schedule"
              ? t("Approving baseline...", "正在批准基准……")
              : t("Cho approves production baseline", "Cho 批准为正式生产基准")}
          </button>
        </footer>
      </section>

      {!dashboard.tasks.length ? (
        <div className="production-controller-empty">
          <strong>{t("No released production work packages yet.", "目前尚未下达生产工序。")}</strong>
          <p>
            {t(
              "Generate and release the AI work-package framework below after S08 supplier approval.",
              "请在 S08 批准供应商后，于下方生成并下达 AI 生产工序框架。"
            )}
          </p>
        </div>
      ) : (
        <>
          <section className={`production-completion-gate ${dashboard.allCompletionApproved ? "released" : ""}`}>
            <div>
              <span>{t("S09 COMPLETION REVIEW GATE", "S09 完工审核闸口")}</span>
              <h4>
                {dashboard.allCompletionApproved
                  ? t("Released to S11 visual quality inspection", "已放行进入 S11 视觉品质检验")
                  : t("Cho approval required for every work package", "每个生产工序都必须经过 Cho 审核")}
              </h4>
              <p>
                {t(
                  "Review the supplier's files below. The final approval automatically releases the project to S11; returned evidence is tracked in S10.",
                  "请逐项检查供应商上传的文件。最后一项批准后项目会自动进入 S11；被退回的证据会进入 S10 跟进。"
                )}
              </p>
            </div>
            <div className="production-completion-count">
              <strong>
                {dashboard.approvedCompletion}/{dashboard.tasks.length}
              </strong>
              <span>{t("work packages approved", "个工序已批准")}</span>
              {dashboard.changesRequired > 0 && (
                <small>
                  {dashboard.changesRequired} {t("returned", "项已退回")}
                </small>
              )}
            </div>
          </section>

          <div className="production-work-package-grid">
            {dashboard.tasks.map((task, index) => (
              <article className={`risk-${task.activeRiskLevel}`} key={task.id}>
                <header>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <small>{task.item_name || t("Production package", "生产工序")}</small>
                    <h5>{task.process_name}</h5>
                  </div>
                  <b>{label(task.activeRiskLevel, zh)}</b>
                </header>
                <div className="production-package-progress">
                  <div>
                    <span style={{ width: `${task.progress_percent || 0}%` }} />
                  </div>
                  <strong>{task.progress_percent || 0}%</strong>
                </div>
                <dl>
                  <div>
                    <dt>
                      {task.hasApprovedBaseline
                        ? t("Approved due", "已批准截止")
                        : t("Supplier proposed", "供应商建议")}
                    </dt>
                    <dd>
                      {formatDate(
                        task.hasApprovedBaseline ? task.expected_at : latestEntry(task, "supplier_plan")?.expected_at,
                        zh
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Evidence", "证据")}</dt>
                    <dd>
                      {task.evidenceSummary.coverage}% · {task.evidenceSummary.uploads.length} {t("files", "份文件")}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Cho gate", "Cho 审核")}</dt>
                    <dd>
                      {task.completionReview.status === "approved"
                        ? t("Approved", "已批准")
                        : task.completionReview.status === "changes_required"
                          ? t("Returned", "已退回")
                          : Number(task.progress_percent || 0) >= 100 && task.evidenceSummary.missing.length === 0
                            ? t("Ready", "可审核")
                            : t("Not ready", "未就绪")}
                    </dd>
                  </div>
                </dl>
                <div className="production-package-checks">
                  {task.evidenceSummary.required.map((item) => (
                    <span className={task.evidenceSummary.missing.includes(item) ? "missing" : "done"} key={item}>
                      {task.evidenceSummary.missing.includes(item) ? "○" : "✓"} {item}
                    </span>
                  ))}
                </div>
                {task.completionReview.review?.note && (
                  <p className={`completion-review-note ${task.completionReview.status}`}>
                    {task.completionReview.review.note}
                  </p>
                )}
                {task.notes && <p>{task.notes}</p>}
                <button
                  type="button"
                  className="production-package-review-button"
                  disabled={!task.completionReview.uploads.length}
                  onClick={() => openCompletionReview(task)}
                >
                  {task.completionReview.status === "approved"
                    ? t("View approved evidence", "查看已批准证据")
                    : t("Review supplier evidence", "审核供应商证据")}
                </button>
              </article>
            ))}
          </div>

          {reviewTask && (
            <section className="production-evidence-review-panel">
              <header>
                <div>
                  <span>{t("CHO COMPLETION REVIEW", "CHO 完工证据审核")}</span>
                  <h4>{reviewTask.process_name}</h4>
                  <p>
                    {reviewTask.item_name} · {reviewTask.progress_percent || 0}% · {reviewTask.evidenceSummary.coverage}
                    % {t("evidence coverage", "证据完整度")}
                  </p>
                </div>
                <button type="button" onClick={() => setReviewTaskId("")}>
                  {t("Close", "关闭")}
                </button>
              </header>

              <div className="production-evidence-files">
                {reviewTask.completionReview.uploads.map((entry, index) => {
                  const url = evidenceUrls[`${entry.bucket}:${entry.path}`];
                  const isImage = String(entry.mime_type || "").startsWith("image/");
                  return (
                    <a
                      href={url || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className={isImage ? "image" : "document"}
                      key={`${entry.sha256 || entry.path}-${index}`}
                    >
                      {isImage && url ? <img src={url} alt={entry.requirement || entry.file_name} /> : <b>FILE</b>}
                      <span>{entry.requirement || t("Production evidence", "生产证据")}</span>
                      <strong>{entry.file_name}</strong>
                      <small>{formatDate(entry.uploaded_at, zh)}</small>
                    </a>
                  );
                })}
              </div>

              {reviewTask.completionReview.status === "approved" ? (
                <div className="production-review-approved">
                  <strong>{t("Approved by Cho", "已由 Cho 批准")}</strong>
                  <span>{reviewTask.completionReview.review?.note}</span>
                </div>
              ) : (
                <>
                  {!reviewEvidenceReady && (
                    <div className="production-review-warning">
                      <strong>{t("Evidence is not ready for approval", "证据尚未达到批准条件")}</strong>
                      {Number(reviewTask.progress_percent || 0) < 100 && (
                        <span>{t("Supplier progress must reach 100%.", "供应商上报进度必须达到 100%。")}</span>
                      )}
                      {reviewTask.evidenceSummary.missing.length > 0 && (
                        <span>
                          {t("Missing required evidence:", "仍缺少指定证据：")}{" "}
                          {reviewTask.evidenceSummary.missing.join(", ")}
                        </span>
                      )}
                      {reviewTask.completionReview.status === "changes_required" && (
                        <span>
                          {t(
                            "The supplier must upload a corrected file after the latest return decision.",
                            "供应商必须在最近一次退回后上传修正文件。"
                          )}
                        </span>
                      )}
                    </div>
                  )}
                  {!reviewTask.hasApprovedBaseline && (
                    <div className="production-review-advisory">
                      <strong>{t("Production schedule is not an approved baseline", "供应商排产尚未获批")}</strong>
                      <span>
                        {t(
                          `Schedule v${dashboard.schedule.version || 1} is ${dashboard.schedule.status.replaceAll("_", " ")}. This no longer blocks evidence review, but the exception will be kept in the audit record.`,
                          `供应商第 ${dashboard.schedule.version || 1} 版排产目前为“${label(dashboard.schedule.status, true)}”。这不会再阻止完工证据审核，但系统会保留例外记录。`
                        )}
                      </span>
                    </div>
                  )}
                  {reviewRequiresRiskAcknowledgement && (
                    <div className="production-review-risk-acknowledgement">
                      <strong>{t("AI evidence risk requires Cho confirmation", "AI 证据风险需要 Cho 确认")}</strong>
                      <span>
                        {reviewTask.duplicateEvidence
                          ? t(
                              "At least one uploaded file is also used in another work package. Confirm that the reused evidence genuinely proves this stage.",
                              "至少一份上传文件同时用于其他生产工序。请确认该重复证据确实能够证明本工序已经完成。"
                            )
                          : t(
                              `The current stored risk level is ${reviewTask.risk_level}. Review the evidence before overriding it.`,
                              `当前记录的风险等级为 ${reviewTask.risk_level}，请核实证据后再决定是否覆盖。`
                            )}
                      </span>
                      <label>
                        <input
                          type="checkbox"
                          checked={reviewRiskAcknowledged}
                          onChange={(event) => setReviewRiskAcknowledged(event.target.checked)}
                        />
                        <b>
                          {t(
                            "I verified the evidence and accept responsibility for this risk override.",
                            "我已核实证据，并确认承担本次风险覆盖的审核责任。"
                          )}
                        </b>
                      </label>
                    </div>
                  )}
                  <label className="production-review-note-field">
                    <span>{t("Cho review note / correction instructions", "Cho 审核备注／返工指示")}</span>
                    <textarea
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      placeholder={t(
                        reviewRequiresRiskAcknowledgement
                          ? "Explain why the flagged evidence is acceptable. This note is required."
                          : "Approval note is optional. A correction reason is required when returning evidence.",
                        reviewRequiresRiskAcknowledgement
                          ? "请说明为何可以接受该风险证据；此审核说明为必填。"
                          : "批准备注可留空；退回证据时必须说明需要修正的内容。"
                      )}
                    />
                  </label>
                  <div className="production-review-actions">
                    <button
                      type="button"
                      className="return"
                      disabled={Boolean(busy)}
                      onClick={() => submitCompletionReview("changes_required")}
                    >
                      {t("Return for correction", "退回供应商修正")}
                    </button>
                    <button
                      type="button"
                      className="approve"
                      disabled={Boolean(busy) || !canApproveReviewTask}
                      onClick={() => submitCompletionReview("approved")}
                    >
                      {busy === `review-${reviewTask.id}`
                        ? t("Saving review...", "正在保存审核……")
                        : reviewRequiresRiskAcknowledgement
                          ? t("Acknowledge risk and approve", "确认风险并批准")
                          : t("Approve completion evidence", "批准完工证据")}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
