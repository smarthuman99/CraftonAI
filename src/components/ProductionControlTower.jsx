import React, { useMemo, useState } from "react";
import { callWorkflowAi } from "./workflowAiClient";

const formatDate = (value, zh) =>
  value ? new Date(value).toLocaleString(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "-";

const label = (value, zh) => {
  const labels = {
    low: ["Monitoring", "正常监控"],
    medium: ["Attention", "需要关注"],
    high: ["Intervention", "需要介入"],
    not_started: ["Not started", "未开始"],
    in_progress: ["In progress", "生产中"],
    pending_review: ["Cho review", "等待 Cho 审核"]
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

function copyText(value) {
  if (window.navigator.clipboard?.writeText) return window.navigator.clipboard.writeText(value);
  return Promise.reject(new Error("Clipboard is unavailable."));
}

export default function ProductionControlTower({
  lang = "En",
  project,
  supabaseClient,
  suppliers = [],
  quotes = [],
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

  const dashboard = useMemo(() => {
    const tasks = productionUpdates.map((task) => ({ ...task, evidenceSummary: taskEvidence(task) }));
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
      highRisks: tasks.filter((task) => task.risk_level === "high").length,
      mediumRisks: tasks.filter((task) => task.risk_level === "medium").length,
      readyForReview: tasks.filter(
        (task) => Number(task.progress_percent || 0) >= 100 && task.evidenceSummary.missing.length === 0
      ).length
    };
  }, [productionUpdates]);

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
              ? `${selectedSupplier.contact_email || t("Missing contact email", "缺少联系人邮箱")} · ${t(
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

      {!dashboard.tasks.length ? (
        <div className="production-controller-empty">
          <strong>{t("No released production work packages yet.", "目前尚未下达生产工序。")}</strong>
          <p>
            {t(
              "Generate and apply the AI production plan below after S08 supplier approval.",
              "请在 S08 批准供应商后，于下方生成并应用 AI 生产计划。"
            )}
          </p>
        </div>
      ) : (
        <div className="production-work-package-grid">
          {dashboard.tasks.map((task, index) => (
            <article className={`risk-${task.risk_level || "low"}`} key={task.id}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <small>{task.item_name || t("Production package", "生产工序")}</small>
                  <h5>{task.process_name}</h5>
                </div>
                <b>{label(task.risk_level, zh)}</b>
              </header>
              <div className="production-package-progress">
                <div>
                  <span style={{ width: `${task.progress_percent || 0}%` }} />
                </div>
                <strong>{task.progress_percent || 0}%</strong>
              </div>
              <dl>
                <div>
                  <dt>{t("Due", "截止")}</dt>
                  <dd>{formatDate(task.expected_at, zh)}</dd>
                </div>
                <div>
                  <dt>{t("Evidence", "证据")}</dt>
                  <dd>
                    {task.evidenceSummary.coverage}% · {task.evidenceSummary.uploads.length} {t("files", "份文件")}
                  </dd>
                </div>
                <div>
                  <dt>{t("State", "状态")}</dt>
                  <dd>{label(task.status, zh)}</dd>
                </div>
              </dl>
              <div className="production-package-checks">
                {task.evidenceSummary.required.map((item) => (
                  <span className={task.evidenceSummary.missing.includes(item) ? "missing" : "done"} key={item}>
                    {task.evidenceSummary.missing.includes(item) ? "○" : "✓"} {item}
                  </span>
                ))}
              </div>
              {task.notes && <p>{task.notes}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
