import React, { useEffect, useMemo, useState } from "react";
import { callWorkflowAi, sha256Payload } from "./workflowAiClient";

const date = (value, zh) => (value ? new Date(value).toLocaleDateString(zh ? "zh-CN" : "en-GB") : "-");

export default function AiOperationsAutomation({
  scope,
  lang,
  project,
  supabaseClient,
  projectFiles = [],
  productionUpdates = [],
  shipmentDocuments = [],
  onChanged,
  onOpenLoadingAi
}) {
  const zh = lang === "Cn";
  const t = (en, cn) => (zh ? cn : en);
  const group = scope === "production" ? "production_ai_plan" : "delivery_ai_plan";
  const saved = useMemo(
    () => projectFiles.find((file) => file.file_group === group)?.payload?.plan || null,
    [group, projectFiles]
  );
  const [plan, setPlan] = useState(saved);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const current = plan || saved;

  useEffect(() => {
    setPlan(saved);
    setMessage("");
  }, [project.id, saved]);

  async function generate() {
    setBusy("generate");
    setMessage("");
    try {
      const next = await callWorkflowAi(supabaseClient, {
        action: "generate_operations_plan",
        projectId: project.id,
        scope
      });
      const hash = await sha256Payload(next);
      const generatedAt = next.generation?.generatedAt || new Date().toISOString();
      const { error } = await supabaseClient.from("project_files").insert({
        project_id: project.id,
        stage_id: scope === "production" ? "S09" : "S12",
        file_group: group,
        file_name: `${scope}-ai-plan-${generatedAt.slice(0, 19).replaceAll(":", "")}.json`,
        sha256: hash,
        audit_hash: hash,
        payload: { plan: next, version: 1 }
      });
      if (error) throw error;
      await supabaseClient.from("workflow_events").insert({
        project_id: project.id,
        stage_id: scope === "production" ? "S09" : "S12",
        event_type: `${scope}_ai_plan_generated`,
        actor: "Crafton AI",
        message_cn:
          scope === "production"
            ? "AI 已生成生产控制计划，等待 Cho 应用。"
            : "AI 已生成出货与交付控制计划，等待 Cho 应用。",
        message_en: `AI generated the ${scope} control plan for Cho review.`,
        payload: { plan_hash: hash }
      });
      setPlan(next);
      setMessage(t("AI plan generated and versioned in Supabase.", "AI 计划已生成并在 Supabase 留存版本。"));
      onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  async function applyPlan() {
    if (!current) return;
    setBusy("apply");
    setMessage("");
    try {
      if (scope === "production") await applyProduction(current);
      else await applyDelivery(current);
      setMessage(
        t(
          "Cho applied the AI control plan. Operational records are now active.",
          "Cho 已应用 AI 控制计划，营运记录现已生效。"
        )
      );
      onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  async function applyProduction(next) {
    if (!next.selectedSupplier)
      throw new Error(
        t(
          "Cho must approve a supplier in S08 before releasing production.",
          "Cho 必须先在 S08 审批供应商，才能下达生产计划。"
        )
      );
    const existing = new Set(productionUpdates.map((row) => row.process_name));
    const rows = next.production.workPackages
      .filter((item) => !existing.has(item.code))
      .map((item) => ({
        project_id: project.id,
        supplier_id: next.selectedSupplier.supplierId,
        stage_id: "S09",
        item_name: item.itemNames.join(", "),
        process_name: item.code,
        status: "not_started",
        progress_percent: 0,
        risk_level: item.riskLevel === "blocked" ? "high" : item.riskLevel,
        expected_at: item.expectedAt,
        notes: `${zh ? item.nameCn : item.nameEn}. ${item.evidenceRequired.join("; ")}`,
        evidence: [{ type: "ai_plan", required: item.evidenceRequired }]
      }));
    if (rows.length) {
      const { error } = await supabaseClient.from("production_updates").insert(rows);
      if (error) throw error;
    }
    const { error: eventError } = await supabaseClient.from("workflow_events").insert({
      project_id: project.id,
      stage_id: "S09",
      event_type: "production_plan_released",
      actor: "Cho",
      message_cn: `Cho 已下达 ${rows.length} 个 AI 生产工序。`,
      message_en: `Cho released ${rows.length} AI-planned production work packages.`,
      payload: { supplier_id: next.selectedSupplier.supplierId }
    });
    if (eventError) throw eventError;
  }

  async function applyDelivery(next) {
    const existing = new Set(shipmentDocuments.map((row) => row.document_type));
    const rows = next.delivery.documentControl.documents
      .filter((item) => !existing.has(item.type))
      .map((item) => ({
        project_id: project.id,
        stage_id: "S13",
        document_type: item.type,
        document_name: zh ? item.nameCn : item.nameEn,
        status: "pending_review",
        check_result: "AI checklist created; source document required.",
        notes: "Upload and verify before shipment release.",
        payload: { generated_by: "Crafton AI", required: true }
      }));
    if (rows.length) {
      const { error } = await supabaseClient.from("shipment_documents").insert(rows);
      if (error) throw error;
    }
    const { error: eventError } = await supabaseClient.from("workflow_events").insert({
      project_id: project.id,
      stage_id: "S12",
      event_type: "delivery_plan_released",
      actor: "Cho",
      message_cn: `Cho 已应用交付计划，并建立 ${rows.length} 项单证检查任务。`,
      message_en: `Cho applied the delivery plan and created ${rows.length} document-control tasks.`,
      payload: { document_tasks_created: rows.length }
    });
    if (eventError) throw eventError;
  }

  const production = current?.production;
  const delivery = current?.delivery;
  return (
    <div className="ai-operations-panel">
      <div className="ai-workflow-commandbar">
        <div>
          <span className="ai-data-source">CRAFTON AI CONTROL</span>
          <strong>
            {scope === "production"
              ? t("Production automation", "生产自动化")
              : t("Delivery automation", "出货与交付自动化")}
          </strong>
        </div>
        <div>
          <button type="button" disabled={Boolean(busy)} onClick={generate}>
            {busy === "generate"
              ? t("Generating...", "正在生成...")
              : t("Generate / refresh AI plan", "生成 / 刷新 AI 计划")}
          </button>
          <button type="button" className="btn-premium" disabled={Boolean(busy) || !current} onClick={applyPlan}>
            {busy === "apply" ? t("Applying...", "正在应用...") : t("Cho applies plan", "Cho 应用计划")}
          </button>
        </div>
      </div>
      {message && <div className="admin-ops-notice">{message}</div>}
      {!current && (
        <div className="ai-workflow-empty">
          <p>
            {t(
              "Generate an AI control plan from the live Supabase project.",
              "从 Supabase 当前项目资料生成 AI 控制计划。"
            )}
          </p>
        </div>
      )}
      {production && (
        <>
          <div className="ai-plan-summary">
            <div>
              <span>{t("Supplier", "供应商")}</span>
              <strong>{production.supplierName}</strong>
            </div>
            <div>
              <span>{t("Planned completion", "计划完工")}</span>
              <strong>{date(production.plannedCompletion, zh)}</strong>
            </div>
            <div>
              <span>{t("Schedule risk", "工期风险")}</span>
              <strong className={`risk-${production.scheduleRisk}`}>{production.scheduleRisk}</strong>
            </div>
          </div>
          {production.scheduleReasons.map((reason) => (
            <div className="admin-ops-notice error" key={reason}>
              {reason}
            </div>
          ))}
          <div className="ai-production-timeline">
            {production.workPackages.map((item) => (
              <article key={item.code}>
                <span>{String(item.sequence).padStart(2, "0")}</span>
                <div>
                  <strong>{zh ? item.nameCn : item.nameEn}</strong>
                  <small>
                    {date(item.startsAt, zh)} - {date(item.expectedAt, zh)}
                  </small>
                </div>
                <b className={`risk-${item.riskLevel}`}>{item.riskLevel}</b>
              </article>
            ))}
          </div>
          <div className="ai-human-gate">
            <strong>S11 · {t("Cho quality release", "Cho 质量放行")}</strong>
            <p>{production.qualityGate.checklist.join(" · ")}</p>
          </div>
        </>
      )}
      {delivery && (
        <>
          <div className="ai-plan-summary">
            <div>
              <span>{t("Packing", "装柜")}</span>
              <strong>{delivery.packing.status}</strong>
            </div>
            <div>
              <span>{t("Documents", "单证完成度")}</span>
              <strong>{delivery.documentControl.completionPercent}%</strong>
            </div>
            <div>
              <span>{t("Tracking", "物流状态")}</span>
              <strong>{delivery.tracking.status}</strong>
            </div>
          </div>
          <div className="ai-delivery-columns">
            <section>
              <h4>S12 · {t("Loading inputs", "装柜输入资料")}</h4>
              {delivery.packing.missingInputs.length ? (
                delivery.packing.missingInputs.map((item) => (
                  <small className="ai-risk-line" key={item}>
                    {item}
                  </small>
                ))
              ) : (
                <small className="ai-ok">{t("Ready for Loading AI", "可运行 Loading AI")}</small>
              )}
              <button type="button" onClick={() => onOpenLoadingAi?.({ project, projectId: project.id })}>
                {t("Open Loading AI", "打开 Loading AI")}
              </button>
            </section>
            <section>
              <h4>S13 · {t("Document control", "单证控制")}</h4>
              {delivery.documentControl.documents.map((item) => (
                <div className="ai-check-row" key={item.type}>
                  <span>{zh ? item.nameCn : item.nameEn}</span>
                  <b>{item.status}</b>
                </div>
              ))}
            </section>
            <section>
              <h4>S14-S16 · {t("Tracking and handover", "运输与交付")}</h4>
              <p>{delivery.tracking.alert}</p>
              <small>
                {t("Carrier", "承运人")}: {delivery.tracking.carrier || t("Awaiting real booking", "等待真实订舱")}
              </small>
              <small>
                {t("ETA", "预计到达")}: {date(delivery.tracking.eta, zh)}
              </small>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
