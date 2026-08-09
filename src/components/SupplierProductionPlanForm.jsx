import React, { useEffect, useMemo, useState } from "react";
import { callWorkflowAi } from "./workflowAiClient";

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const toIsoDate = (value) => (value ? new Date(value).toISOString() : null);

const latestEntry = (task, type) =>
  (Array.isArray(task?.evidence) ? task.evidence : [])
    .filter((entry) => entry?.type === type)
    .sort((a, b) => Number(b.version || 0) - Number(a.version || 0))[0] || null;

const stateLabel = (value, zh) => {
  const labels = {
    awaiting_supplier_plan: ["Factory schedule required", "等待工厂提交排产"],
    changes_required: ["AI requires changes", "AI 要求修改排产"],
    ai_review: ["AI validation", "AI 校验中"],
    awaiting_cho_approval: ["Awaiting Cho approval", "等待 Cho 批准"],
    revision_pending_cho: ["Revision awaiting Cho", "改期版本等待 Cho 批准"],
    approved: ["Approved production baseline", "已批准正式生产基准"]
  };
  return labels[value]?.[zh ? 1 : 0] || String(value || "-").replaceAll("_", " ");
};

function buildRows(tasks) {
  return tasks.map((task) => {
    const latest = latestEntry(task, "supplier_plan");
    return {
      productionUpdateId: task.id,
      processName: task.process_name,
      startsAt: toInputDate(latest?.starts_at),
      expectedAt: toInputDate(latest?.expected_at),
      materialReadyAt: toInputDate(latest?.material_ready_at),
      capacitySlot: latest?.capacity_slot || "",
      dependencies: latest?.dependencies || "",
      updateFrequency: latest?.update_frequency || "twice_weekly",
      constraints: latest?.constraints || "",
      forecastStartsAt: latestEntry(task, "ai_plan")?.forecast_starts_at || null,
      forecastExpectedAt: latestEntry(task, "ai_plan")?.forecast_expected_at || null
    };
  });
}

export default function SupplierProductionPlanForm({ project, lang, supabaseClient, onSubmitted }) {
  const zh = lang === "Cn";
  const t = (en, cn) => (zh ? cn : en);
  const tasks = useMemo(() => project.tasks || [], [project.tasks]);
  const planState = project.summary?.planStatus || "awaiting_supplier_plan";
  const currentVersion = Number(project.summary?.planVersion || 0);
  const [open, setOpen] = useState(planState !== "approved");
  const [rows, setRows] = useState(() => buildRows(tasks));
  const [changeReason, setChangeReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setRows(buildRows(tasks));
    setOpen(planState !== "approved");
  }, [project.id, currentVersion, planState, tasks]);

  function updateRow(id, field, value) {
    setRows((current) => current.map((row) => (row.productionUpdateId === id ? { ...row, [field]: value } : row)));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setResult(null);
    try {
      const response = await callWorkflowAi(supabaseClient, {
        action: "submit_supplier_production_plan",
        projectId: project.id,
        changeReason,
        planTasks: rows.map((row) => ({
          productionUpdateId: row.productionUpdateId,
          startsAt: toIsoDate(row.startsAt),
          expectedAt: toIsoDate(row.expectedAt),
          materialReadyAt: toIsoDate(row.materialReadyAt),
          capacitySlot: row.capacitySlot,
          dependencies: row.dependencies,
          updateFrequency: row.updateFrequency,
          constraints: row.constraints
        }))
      });
      setResult(response.review);
      setChangeReason("");
      setMessage(
        response.review.status === "changes_required"
          ? t(
              `Schedule v${response.version} was saved, but AI found issues that must be corrected before Cho approval.`,
              `第 ${response.version} 版排产已保存，但 AI 发现必须修正的问题，暂不能提交 Cho 批准。`
            )
          : t(
              `Schedule v${response.version} passed AI validation and is waiting for Cho approval.`,
              `第 ${response.version} 版排产已通过 AI 校验，正在等待 Cho 批准。`
            )
      );
      await onSubmitted?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy(false);
    }
  }

  const storedIssues = tasks
    .flatMap((task) => latestEntry(task, "ai_plan_review")?.issues || [])
    .filter(
      (issue, index, list) =>
        list.findIndex((entry) => entry.code === issue.code && entry.taskId === issue.taskId) === index
    );
  const issues = result?.issues || storedIssues;

  return (
    <section className={`supplier-production-plan plan-${planState}`}>
      <header>
        <div>
          <span>{t("FACTORY SCHEDULE COMMITMENT", "工厂真实排产承诺")}</span>
          <h3>{stateLabel(planState, zh)}</h3>
          <p>
            {t(
              "Crafton AI defines the work packages only. Your factory sets the real dates and capacity; AI checks feasibility, then Cho approves the production baseline.",
              "Crafton AI 只定义工序和证据要求。真实日期与产能由贵工厂填写，AI 校验可行性后，再由 Cho 批准为正式生产基准。"
            )}
          </p>
        </div>
        <div className="supplier-plan-version">
          <span>{t("Latest version", "最新版本")}</span>
          <strong>V{currentVersion || "—"}</strong>
          <button type="button" onClick={() => setOpen((value) => !value)}>
            {open
              ? t("Hide schedule", "收起排产")
              : planState === "approved"
                ? t("Propose a revision", "提出改期版本")
                : t("Open schedule", "填写排产")}
          </button>
        </div>
      </header>

      {issues.length > 0 && (
        <div className="supplier-plan-issues">
          {issues.map((issue, index) => (
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

      {message && <div className="supplier-plan-message">{message}</div>}

      {open && (
        <form onSubmit={submit}>
          {currentVersion > 0 && (
            <label className="supplier-plan-reason">
              <span>{t("Reason for this revised schedule", "本次改期原因")}</span>
              <textarea
                value={changeReason}
                onChange={(event) => setChangeReason(event.target.value)}
                required
                placeholder={t(
                  "Explain capacity, material, staffing or other changes. The previous approved baseline remains active until Cho approves this revision.",
                  "请说明产能、物料、人员或其他变化。Cho 批准本版本之前，原已批准基准仍然有效。"
                )}
              />
            </label>
          )}
          <div className="supplier-plan-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Work package", "生产工序")}</th>
                  <th>{t("Factory start", "工厂开始时间")}</th>
                  <th>{t("Factory completion", "工厂完成时间")}</th>
                  <th>{t("Materials ready", "物料到齐时间")}</th>
                  <th>{t("Capacity slot / line", "产能档期 / 产线")}</th>
                  <th>{t("Update frequency", "上报频率")}</th>
                  <th>{t("Dependencies / constraints", "依赖 / 限制")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.productionUpdateId}>
                    <td>
                      <strong>{row.processName}</strong>
                      {row.forecastStartsAt && (
                        <small>
                          {t("AI forecast only", "仅供参考的 AI 预测")}:{" "}
                          {new Date(row.forecastStartsAt).toLocaleDateString()} –{" "}
                          {new Date(row.forecastExpectedAt).toLocaleDateString()}
                        </small>
                      )}
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        value={row.startsAt}
                        onChange={(event) => updateRow(row.productionUpdateId, "startsAt", event.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        value={row.expectedAt}
                        onChange={(event) => updateRow(row.productionUpdateId, "expectedAt", event.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        value={row.materialReadyAt}
                        onChange={(event) => updateRow(row.productionUpdateId, "materialReadyAt", event.target.value)}
                        required={row.processName === "material_procurement"}
                      />
                    </td>
                    <td>
                      <input
                        value={row.capacitySlot}
                        onChange={(event) => updateRow(row.productionUpdateId, "capacitySlot", event.target.value)}
                        placeholder={t("Line A · confirmed", "A 线 · 已确认")}
                        required
                      />
                    </td>
                    <td>
                      <select
                        value={row.updateFrequency}
                        onChange={(event) => updateRow(row.productionUpdateId, "updateFrequency", event.target.value)}
                        required
                      >
                        <option value="daily">{t("Daily", "每日")}</option>
                        <option value="every_2_days">{t("Every 2 days", "每两日")}</option>
                        <option value="twice_weekly">{t("Twice weekly", "每周两次")}</option>
                        <option value="weekly">{t("Weekly", "每周一次")}</option>
                      </select>
                    </td>
                    <td>
                      <input
                        value={row.dependencies}
                        onChange={(event) => updateRow(row.productionUpdateId, "dependencies", event.target.value)}
                        placeholder={t("Dependencies", "前置依赖")}
                      />
                      <input
                        value={row.constraints}
                        onChange={(event) => updateRow(row.productionUpdateId, "constraints", event.target.value)}
                        placeholder={t("Known constraints / risks", "已知限制 / 风险")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer>
            <p>
              {t(
                "Submitting creates a versioned factory commitment. Dates do not become the active baseline until Cho approves them.",
                "提交后会形成可追溯的工厂排产版本；日期在 Cho 批准前不会成为正式跟单基准。"
              )}
            </p>
            <button className="primary" disabled={busy}>
              {busy
                ? t("AI is validating...", "AI 正在校验……")
                : t("Submit schedule for AI validation", "提交排产给 AI 校验")}
            </button>
          </footer>
        </form>
      )}
    </section>
  );
}
