import React, { useEffect, useMemo, useState } from "react";
import { callWorkflowAi, sha256Payload } from "./workflowAiClient";

const money = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));

const displayedRisks = (quote, zh) => {
  if (zh && quote.risksCn?.length) return quote.risksCn;
  if (zh && quote.aiSummaryCn) return [quote.aiSummaryCn];
  if (!zh && quote.risksEn?.length) return quote.risksEn;
  return quote.risks || [];
};

export default function AiQuoteComparison({
  lang,
  project,
  supabaseClient,
  batches = [],
  quotes = [],
  projectFiles = [],
  onChanged
}) {
  const zh = lang === "Cn";
  const t = (en, cn) => (zh ? cn : en);
  const firstBatchWithQuotes = batches.find((batch) => quotes.some((quote) => quote.rfq_batch_id === batch.id));
  const defaultBatchId = firstBatchWithQuotes?.id || batches[0]?.id || "";
  const [batchId, setBatchId] = useState(defaultBatchId);
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const batchQuotes = useMemo(() => quotes.filter((quote) => quote.rfq_batch_id === batchId), [batchId, quotes]);
  const savedAnalysis = useMemo(
    () =>
      projectFiles.find(
        (file) => file.file_group === "quote_analysis" && (!batchId || file.payload?.analysis?.rfqBatchId === batchId)
      )?.payload?.analysis || null,
    [batchId, projectFiles]
  );
  const result = analysis || savedAnalysis;

  useEffect(() => {
    setAnalysis(null);
  }, [batchId]);

  useEffect(() => {
    setBatchId(defaultBatchId);
    setAnalysis(null);
  }, [defaultBatchId, project.id]);

  async function analyze() {
    if (!batchId) return setMessage(t("Select an RFQ first.", "请先选择一份询价单。"));
    if (batchQuotes.length < 2) {
      return setMessage(
        t("At least two quotations are required for comparison.", "至少需要两份供应商报价才能进行比价。")
      );
    }
    setBusy(true);
    setMessage("");
    try {
      const next = await callWorkflowAi(supabaseClient, {
        action: "analyze_quotes",
        projectId: project.id,
        rfqBatchId: batchId
      });
      const hash = await sha256Payload(next);
      const generatedAt = next.generation?.generatedAt || new Date().toISOString();
      const { error: fileError } = await supabaseClient.from("project_files").insert({
        project_id: project.id,
        stage_id: "S07",
        file_group: "quote_analysis",
        file_name: `${next.rfqCode || "RFQ"}-quote-analysis-${generatedAt.slice(0, 10)}.json`,
        sha256: hash,
        audit_hash: hash,
        payload: { analysis: next, version: 1 }
      });
      if (fileError) throw fileError;

      const recommendedId = next.recommendation?.quoteId;
      const updates = next.quotes.map((row) => {
        const source = batchQuotes.find((quote) => quote.id === row.id);
        return supabaseClient
          .from("supplier_quotes")
          .update({
            ai_verdict: row.id === recommendedId ? "recommended_lowest_executable_price" : `rank_${row.rank}`,
            recommendation: row.id === recommendedId ? next.recommendation?.reasonCn : row.aiSummaryCn || "",
            payload: {
              ...(source?.payload || {}),
              ai_analysis: {
                analysisHash: hash,
                generatedAt,
                rank: row.rank,
                totalScore: row.totalScore,
                priceDeltaPercent: row.priceDeltaPercent,
                risks: row.risks,
                recommended: row.id === recommendedId
              }
            }
          })
          .eq("id", row.id);
      });
      const updateResults = await Promise.all(updates);
      const updateError = updateResults.find((entry) => entry.error)?.error;
      if (updateError) throw updateError;
      const { error: eventError } = await supabaseClient.from("workflow_events").insert({
        project_id: project.id,
        stage_id: "S07",
        event_type: "ai_quote_analysis_generated",
        actor: "Crafton AI",
        message_cn: `已比较 ${next.quotes.length} 份报价，最低可执行价为 ${next.recommendation?.supplierName || "待确认"}。`,
        message_en: `Compared ${next.quotes.length} quotations; lowest executable price is ${next.recommendation?.supplierName || "pending"}.`,
        payload: { analysis_hash: hash, rfq_batch_id: batchId, recommended_quote_id: recommendedId }
      });
      if (eventError) throw eventError;
      setAnalysis(next);
      setMessage(
        t("AI comparison saved to Supabase with an audit hash.", "AI 比价结果已连同审计哈希保存到 Supabase。")
      );
      onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-quote-workspace">
      <div className="ai-workflow-commandbar">
        <label>
          <span>{t("RFQ batch", "询价批次")}</span>
          <select value={batchId} onChange={(event) => setBatchId(event.target.value)}>
            <option value="">{t("Select RFQ", "选择询价单")}</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.rfq_code || batch.title} ({quotes.filter((quote) => quote.rfq_batch_id === batch.id).length})
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="ai-data-source">SUPABASE + AI</span>
          <button type="button" className="btn-premium" disabled={busy || batchQuotes.length < 2} onClick={analyze}>
            {busy ? t("Analyzing...", "正在分析...") : t("Analyze quotations with AI", "用 AI 分析供应商报价")}
          </button>
        </div>
      </div>
      {message && <div className="admin-ops-notice">{message}</div>}
      {!result && (
        <div className="ai-workflow-empty">
          <strong>{t(`${batchQuotes.length} quotation(s) ready`, `已有 ${batchQuotes.length} 份报价`)}</strong>
          <p>
            {t(
              "Run AI comparison after supplier responses have been recorded.",
              "供应商回填后运行 AI 比价，系统会保留每次分析版本。"
            )}
          </p>
        </div>
      )}
      {result?.recommendation && (
        <>
          <section className="ai-recommendation-banner">
            <div>
              <span>{t("LOWEST EXECUTABLE PRICE", "最低可执行价格")}</span>
              <h4>{result.recommendation.supplierName}</h4>
              <p>{zh ? result.recommendation.reasonCn : result.recommendation.reasonEn}</p>
            </div>
            <div className="ai-recommendation-metrics">
              <strong>
                {money(result.recommendation.unitPrice, result.recommendation.currency)} / {t("unit", "件")}
              </strong>
              <small>
                {t("Comparable total", "可比总价")}{" "}
                {money(result.recommendation.normalizedTotal, result.recommendation.currency)}
              </small>
              <small>
                {t("Saving vs highest", "较最高报价节省")}{" "}
                {money(result.recommendation.savingsVsHighest, result.recommendation.currency)}
              </small>
            </div>
          </section>
          {result.warnings?.map((warning) => (
            <div key={warning} className="admin-ops-notice error">
              {warning}
            </div>
          ))}
          <div className="admin-table-wrap">
            <table className="admin-mini-table ai-comparison-table">
              <thead>
                <tr>
                  <th>{t("Overall rank", "综合排名")}</th>
                  <th>{t("Supplier", "供应商")}</th>
                  <th>{t("Price", "价格")}</th>
                  <th>{t("MOQ / lead", "起订量 / 交期")}</th>
                  <th>{t("Score evidence", "评分依据")}</th>
                  <th>{t("Risks", "风险")}</th>
                </tr>
              </thead>
              <tbody>
                {result.quotes.map((quote) => (
                  <tr key={quote.id} className={quote.id === result.recommendation.quoteId ? "recommended" : ""}>
                    <td>
                      <strong>#{quote.rank}</strong>
                      <br />
                      <small>{quote.totalScore}/100</small>
                    </td>
                    <td>
                      <strong>{quote.supplierName}</strong>
                      <br />
                      <small>{quote.quoteCode}</small>
                    </td>
                    <td>
                      <strong>{money(quote.unitPrice, quote.currency)}</strong>
                      <br />
                      <small>
                        {money(quote.normalizedTotal, quote.currency)} ·{" "}
                        {quote.priceDeltaPercent > 0 ? `+${quote.priceDeltaPercent}%` : t("lowest", "最低")}
                      </small>
                    </td>
                    <td>
                      MOQ {quote.moq || "-"}
                      <br />
                      <small>
                        {quote.leadTimeDays || "-"} {t("days", "天")}
                      </small>
                    </td>
                    <td>
                      <small>
                        {t("Price", "价格")} {quote.scoreBreakdown.price} · {t("Lead", "交期")}{" "}
                        {quote.scoreBreakdown.leadTime}
                      </small>
                      <br />
                      <small>
                        {t("Quality", "质量")} {quote.qualityScore} · {t("Reliability", "可靠性")}{" "}
                        {quote.reliabilityScore}
                      </small>
                    </td>
                    <td>
                      {displayedRisks(quote, zh).length ? (
                        displayedRisks(quote, zh).map((risk) => (
                          <small key={risk} className="ai-risk-line">
                            {risk}
                          </small>
                        ))
                      ) : (
                        <small className="ai-ok">{t("No material commercial risk", "未发现重大商业风险")}</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ai-human-gate">{zh ? result.decisionNoteCn : result.decisionNoteEn}</p>
        </>
      )}
    </div>
  );
}
