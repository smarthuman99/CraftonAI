import React, { useEffect, useMemo, useRef, useState } from "react";
import { callWorkflowAi, sha256Payload } from "./workflowAiClient";

const money = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));

const timestamp = (row) => new Date(row?.updated_at || row?.received_at || row?.created_at || 0).getTime();

const latestPerSupplier = (quotes) => {
  const latest = new Map();
  quotes.forEach((quote) => {
    const key = quote.supplier_id || quote.supplier_name || quote.id;
    const previous = latest.get(key);
    if (!previous || timestamp(quote) >= timestamp(previous)) latest.set(key, quote);
  });
  return [...latest.values()];
};

const displayedRisks = (quote, zh) => {
  if (zh && quote.risksCn?.length) return quote.risksCn;
  if (!zh && quote.risksEn?.length) return quote.risksEn;
  return quote.risks || [];
};

const displayedAdvantages = (quote, zh) => (zh ? quote.advantagesCn || [] : quote.advantagesEn || []);

export default function AiQuoteComparison({
  lang,
  project,
  supabaseClient,
  batches = [],
  quotes = [],
  projectFiles = [],
  autoAnalyzeToken = "",
  onChanged,
  displayMode = "standard"
}) {
  const zh = lang === "Cn";
  const t = (en, cn) => (zh ? cn : en);
  const hierarchical = displayMode === "hierarchical";
  const firstBatchWithQuotes = batches.find((batch) => quotes.some((quote) => quote.rfq_batch_id === batch.id));
  const defaultBatchId = firstBatchWithQuotes?.id || batches[0]?.id || "";
  const [batchId, setBatchId] = useState(defaultBatchId);
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lastAutoAnalyzeRef = useRef("");

  const batchQuotes = useMemo(
    () => latestPerSupplier(quotes.filter((quote) => quote.rfq_batch_id === batchId)),
    [batchId, quotes]
  );
  const activeBatch = batches.find((batch) => batch.id === batchId);
  const invitedSupplierCount = activeBatch?.supplier_ids?.length || 0;
  const minimumQuoteCount = 2;
  const comparisonTargetCount = Math.max(minimumQuoteCount, invitedSupplierCount);
  const minimumMissingCount = Math.max(0, minimumQuoteCount - batchQuotes.length);
  const invitedMissingCount = Math.max(0, invitedSupplierCount - batchQuotes.length);
  const savedAnalysisFile = useMemo(
    () =>
      projectFiles.find(
        (file) => file.file_group === "quote_analysis" && (!batchId || file.payload?.analysis?.rfqBatchId === batchId)
      ) || null,
    [batchId, projectFiles]
  );
  const savedAnalysisIsFresh = Boolean(
    savedAnalysisFile &&
    batchQuotes.length >= minimumQuoteCount &&
    batchQuotes.every((quote) => quote.payload?.ai_analysis?.analysisHash === savedAnalysisFile.sha256)
  );
  const savedAnalysis = savedAnalysisIsFresh ? savedAnalysisFile?.payload?.analysis || null : null;
  const staleAnalysis = Boolean(savedAnalysisFile && !savedAnalysisIsFresh && !analysis);
  const result = analysis || savedAnalysis;

  useEffect(() => {
    setAnalysis(null);
    setMessage("");
  }, [batchId]);

  useEffect(() => {
    setBatchId(defaultBatchId);
    setAnalysis(null);
  }, [defaultBatchId, project.id]);

  useEffect(() => {
    const requestedBatchId = String(autoAnalyzeToken || "").split(":")[0];
    if (requestedBatchId && requestedBatchId !== batchId) {
      setBatchId(requestedBatchId);
      return;
    }
    if (
      !autoAnalyzeToken ||
      lastAutoAnalyzeRef.current === autoAnalyzeToken ||
      !autoAnalyzeToken.startsWith(`${batchId}:`) ||
      batchQuotes.length < minimumQuoteCount ||
      busy
    ) {
      return;
    }
    lastAutoAnalyzeRef.current = autoAnalyzeToken;
    analyze();
  }, [autoAnalyzeToken, batchId, batchQuotes.length]);

  async function analyze() {
    if (!batchId) return setMessage(t("Select an RFQ first.", "请先选择一份询价单。"));
    if (batchQuotes.length < minimumQuoteCount) {
      return setMessage(
        t(
          `Record ${minimumMissingCount} more supplier quotation(s) before comparison.`,
          `还需要录入 ${minimumMissingCount} 份供应商报价，才能进行比价。`
        )
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
      const version =
        Math.max(
          0,
          ...projectFiles
            .filter((file) => file.file_group === "quote_analysis" && file.payload?.analysis?.rfqBatchId === batchId)
            .map((file) => Number(file.payload?.version || 0))
        ) + 1;
      const safeTimestamp = generatedAt.replace(/[:.]/g, "-");
      const { error: fileError } = await supabaseClient.from("project_files").insert({
        project_id: project.id,
        stage_id: "S07",
        file_group: "quote_analysis",
        file_name: `${next.rfqCode || "RFQ"}-quote-analysis-v${version}-${safeTimestamp}.json`,
        sha256: hash,
        audit_hash: hash,
        payload: {
          analysis: next,
          version,
          source_quote_ids: batchQuotes.map((quote) => quote.id),
          source_supplier_ids: batchQuotes.map((quote) => quote.supplier_id).filter(Boolean)
        }
      });
      if (fileError) throw fileError;

      const recommendedId = next.recommendation?.quoteId;
      const updates = next.quotes.map((row) => {
        const source = batchQuotes.find((quote) => quote.id === row.id);
        return supabaseClient
          .from("supplier_quotes")
          .update({
            ai_verdict: row.id === recommendedId ? "recommended_best_weighted_value" : `rank_${row.rank}`,
            recommendation: row.id === recommendedId ? next.recommendation?.reasonCn : row.aiSummaryCn || "",
            payload: {
              ...(source?.payload || {}),
              ai_analysis: {
                analysisHash: hash,
                generatedAt,
                promptVersion: next.generation?.promptVersion,
                method: next.generation?.method,
                rank: row.rank,
                totalScore: row.totalScore,
                scoreBreakdown: row.scoreBreakdown,
                priceDeltaPercent: row.priceDeltaPercent,
                lineItemCoverage: row.lineItemCoverage,
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
        message_cn: `已比较 ${next.quotes.length} 份报价，综合最优建议为 ${next.recommendation?.supplierName || "暂不推荐"}。`,
        message_en: `Compared ${next.quotes.length} quotations; the best overall value is ${next.recommendation?.supplierName || "not yet recommendable"}.`,
        payload: {
          analysis_hash: hash,
          analysis_version: version,
          rfq_batch_id: batchId,
          recommended_quote_id: recommendedId || null
        }
      });
      if (eventError) throw eventError;
      setAnalysis(next);
      setMessage(
        t(
          "AI comparison saved to Supabase with scores, risks and an audit hash.",
          "AI 比价的评分、风险与审计哈希已保存到 Supabase。"
        )
      );
      await onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy(false);
    }
  }

  const resultWarnings = zh ? result?.warningsCn || result?.warnings || [] : result?.warnings || [];
  const analysisMethod = result?.generation?.method;

  return (
    <div className={`ai-quote-workspace ${hierarchical ? "is-hierarchical" : ""}`.trim()}>
      <div className="ai-workflow-commandbar">
        <label>
          <span>{t("RFQ batch", "询价批次")}</span>
          <select value={batchId} onChange={(event) => setBatchId(event.target.value)}>
            <option value="">{t("Select RFQ", "选择询价单")}</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.rfq_code || batch.title} (
                {latestPerSupplier(quotes.filter((quote) => quote.rfq_batch_id === batch.id)).length})
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="ai-data-source">SUPABASE + CRAFTON AI</span>
          <button
            type="button"
            className="btn-premium"
            disabled={busy || batchQuotes.length < minimumQuoteCount}
            onClick={analyze}
            title={
              batchQuotes.length < minimumQuoteCount
                ? t("At least two saved supplier returns are required.", "至少需要两份已保存的供应商回传。")
                : t(
                    "Normalize, score and recommend the best executable quotation.",
                    "标准化、评分并推荐综合最优的可执行报价。"
                  )
            }
          >
            {busy
              ? t("AI is analyzing...", "AI 正在分析...")
              : result
                ? t("Re-run AI comparison", "重新运行 AI 比价")
                : t("Analyze quotations with AI", "用 AI 分析供应商报价")}
          </button>
        </div>
      </div>

      {message && (
        <div className={`admin-ops-notice ${/saved|已保存/.test(message) ? "success" : "error"}`}>{message}</div>
      )}
      {staleAnalysis && (
        <div className="admin-ops-notice error">
          {t(
            "A supplier quotation changed after the previous analysis. Re-run AI comparison before S08 approval.",
            "上次分析后有供应商报价发生变化，请重新运行 AI 比价后再进入 S08 审批。"
          )}
        </div>
      )}

      {!result && (
        <div className="ai-workflow-empty">
          <strong>
            {t(
              `${batchQuotes.length}/${comparisonTargetCount} supplier quotations recorded`,
              `已录入 ${batchQuotes.length}/${comparisonTargetCount} 份供应商报价`
            )}
          </strong>
          <p>
            {t(
              minimumMissingCount
                ? `Import and save ${minimumMissingCount} more supplier return(s). The AI button unlocks after two suppliers are ready.`
                : invitedMissingCount
                  ? `${invitedMissingCount} invited supplier response(s) are still missing. You can run a preliminary AI comparison now and re-run it later.`
                  : "All selected supplier returns are ready. Run AI comparison to normalize price, lead time, quality, reliability and commercial risk.",
              minimumMissingCount
                ? `还需导入并保存 ${minimumMissingCount} 份回传；至少两家供应商齐备后，AI 比价按钮会启用。`
                : invitedMissingCount
                  ? `仍缺少 ${invitedMissingCount} 家受邀供应商回传；现在可以先运行阶段性 AI 比价，收到其余报价后再重新分析。`
                  : "所有已选供应商报价均已齐备，可以用 AI 统一比较价格、交期、质量、可靠性和商务风险。"
            )}
          </p>
        </div>
      )}

      {result && (
        <>
          <div className="ai-analysis-provenance" data-method={analysisMethod || "unknown"}>
            <strong>
              {analysisMethod === "ai"
                ? t("AI narrative + verified scoring", "AI 分析说明 + 可核验评分")
                : t("Verified scoring fallback", "可核验规则评分")}
            </strong>
            <span>
              {analysisMethod === "ai"
                ? `${result.generation.model} · ${result.generation.promptVersion}`
                : t(
                    "The model narrative was unavailable; deterministic scoring and risk checks still completed.",
                    "模型分析说明暂不可用，但确定性评分和风险检查已正常完成。"
                  )}
            </span>
          </div>

          {resultWarnings.map((warning) => (
            <div key={warning} className="admin-ops-notice error">
              {warning}
            </div>
          ))}

          {result.recommendation ? (
            <section className="ai-recommendation-banner">
              <div>
                <span>{t("AI RECOMMENDED BEST VALUE", "AI 推荐综合最优报价")}</span>
                <h4>{result.recommendation.supplierName}</h4>
                <p>{zh ? result.recommendation.reasonCn : result.recommendation.reasonEn}</p>
              </div>
              <div className="ai-recommendation-metrics">
                <strong>{result.recommendation.totalScore}/100</strong>
                <small>
                  {t("Comparable total", "可比总价")}{" "}
                  {money(result.recommendation.normalizedTotal, result.recommendation.currency)}
                </small>
                <small>
                  {result.recommendation.isLowestPrice
                    ? t("Also the lowest executable price", "同时也是最低可执行报价")
                    : t(
                        `Premium vs lowest: ${money(result.recommendation.pricePremiumVsLowest, result.recommendation.currency)}`,
                        `较最低价高：${money(result.recommendation.pricePremiumVsLowest, result.recommendation.currency)}`
                      )}
                </small>
              </div>
            </section>
          ) : (
            <div className="admin-ops-notice error">
              {t(
                "AI completed the risk review but cannot recommend a supplier until currencies and blocking commercial issues are normalized.",
                "AI 已完成风险检查，但在币种及阻塞性商务问题统一前，暂不建议选择供应商。"
              )}
            </div>
          )}

          <details className="ai-comparison-details" open={!hierarchical ? true : undefined}>
            {hierarchical && (
              <summary>
                <span>
                  <strong>{t("Compare every quotation", "查看全部报价对比")}</strong>
                  <small>
                    {t(
                      `${result.quotes.length} normalized offers with score evidence`,
                      `${result.quotes.length} 份已标准化报价与评分依据`
                    )}
                  </small>
                </span>
                <b aria-hidden="true">›</b>
              </summary>
            )}
            <div className="admin-table-wrap">
              <table className="admin-mini-table ai-comparison-table">
                <thead>
                  <tr>
                    <th>{t("Overall rank", "综合排名")}</th>
                    <th>{t("Supplier", "供应商")}</th>
                    <th>{t("Price", "价格")}</th>
                    <th>{t("MOQ / lead", "起订量 / 交期")}</th>
                    <th>{t("Score evidence", "评分依据")}</th>
                    <th>{t("AI assessment", "AI 分析")}</th>
                    <th>{t("Risks", "风险")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.quotes.map((quote) => (
                    <tr key={quote.id} className={quote.id === result.recommendation?.quoteId ? "recommended" : ""}>
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
                        <strong>{money(quote.normalizedTotal, quote.currency)}</strong>
                        <br />
                        <small>
                          {quote.priceDeltaPercent == null
                            ? t("currency not normalized", "币种未统一")
                            : quote.priceDeltaPercent > 0
                              ? `+${quote.priceDeltaPercent}%`
                              : t("lowest", "最低")}
                        </small>
                      </td>
                      <td>
                        MOQ {quote.moq || "-"}
                        <br />
                        <small>
                          {quote.leadTimeDays || "-"} {t("days", "天")} · {quote.lineItemCoverage}% BOM
                        </small>
                      </td>
                      <td>
                        <small>
                          {t("Price", "价格")} {quote.scoreBreakdown.price} · {t("Lead", "交期")}{" "}
                          {quote.scoreBreakdown.leadTime}
                        </small>
                        <br />
                        <small>
                          {t("Quality", "质量")} {quote.scoreBreakdown.quality} · {t("Reliability", "可靠性")}{" "}
                          {quote.scoreBreakdown.reliability}
                        </small>
                        <br />
                        <small>
                          {t("Commercial", "商务")} {quote.scoreBreakdown.commercialCompleteness} ·{" "}
                          {t("Material", "材质")} {quote.scoreBreakdown.materialCompliance}
                        </small>
                      </td>
                      <td>
                        {(zh ? quote.aiSummaryCn : quote.aiSummaryEn) && (
                          <small className="ai-summary-line">{zh ? quote.aiSummaryCn : quote.aiSummaryEn}</small>
                        )}
                        {displayedAdvantages(quote, zh).map((advantage) => (
                          <small key={advantage} className="ai-ok">
                            + {advantage}
                          </small>
                        ))}
                        {!(zh ? quote.aiSummaryCn : quote.aiSummaryEn) && !displayedAdvantages(quote, zh).length && (
                          <small>{t("Verified score only", "仅显示可核验评分")}</small>
                        )}
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
          </details>
          <p className="ai-human-gate">{zh ? result.decisionNoteCn : result.decisionNoteEn}</p>
        </>
      )}
    </div>
  );
}
