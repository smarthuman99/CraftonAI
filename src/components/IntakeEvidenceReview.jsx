export default function IntakeEvidenceReview({ result, lang }) {
  const gate = result?.evidence_gate?.final;
  if (!gate) return null;
  const cn = lang === "Cn";
  const label = (zh, en) => (cn ? zh : en);
  const route = result.review_routing?.route;
  const fields = {
    product: label("产品", "Product"),
    quantity: label("数量", "Quantity"),
    dimensions: label("尺寸", "Dimensions"),
    material: label("材质", "Material"),
    image: label("图片", "Image"),
    optional: label("可选属性", "Options")
  };
  const statuses = {
    supported: label("有来源证据", "Evidence found"),
    not_marked_in_source: label("原文未标注可选", "No option marker"),
    missing: label("待查找", "Missing"),
    unverified: label("待核实", "Unverified"),
    partial: label("信息不完整", "Partial"),
    source_partial: label("原文仅有部分资料", "Partial in source"),
    source_missing: label("已复核，原文未提供", "Confirmed source gap")
  };
  const review = result.risk_review || {};
  return (
    <section className="intake-next-stage-card" aria-label={label("来源证据复核", "Source evidence review")}>
      <div className="intake-next-section-title">
        <div>
          <span className="intake-next-kicker">{label("资料检查", "Document checks")}</span>
          <h3>{label("来源证据复核", "Source evidence review")}</h3>
        </div>
        <strong>
          {route === "internal_review"
            ? label("待内部审核", "Internal review required")
            : route === "client_clarification"
              ? label("待客户补充", "Client details needed")
              : label("可提交审批", "Ready for approval")}
        </strong>
      </div>
      <p>
        {label("证据覆盖率", "Evidence coverage")}: {gate.evidence_coverage_percent}% ·{" "}
        {review.status === "not_required"
          ? label("程序校验通过，无需第二次复核", "Program checks passed; no second review needed")
          : review.status === "failed"
            ? label("复核未完成", "Review incomplete")
            : label("已执行定向复核", "Targeted review performed")}
      </p>
      <p>
        {label(
          "覆盖率表示字段能否追溯到来源，不代表识别准确率或人工确认。",
          "Coverage measures source traceability, not extraction accuracy or human approval."
        )}
      </p>
      {(gate.items || []).map((row) => (
        <details key={row.item_index} style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer" }}>
            {row.item_ref} · {row.coverage_percent}%
          </summary>
          <dl>
            {row.fields.map((field) => (
              <div key={field.field} style={{ margin: "12px 0", overflowWrap: "anywhere" }}>
                <dt>
                  <strong>
                    {fields[field.field]} · {statuses[field.status] || field.status}
                  </strong>
                </dt>
                <dd style={{ margin: "4px 0" }}>
                  {field.value || "—"}
                  {field.evidence?.source_page
                    ? ` · ${label("来源页/单元", "Source page/unit")} ${field.evidence.source_page}`
                    : ""}{" "}
                  {field.evidence?.locator || ""}
                  {field.evidence?.quote && <blockquote style={{ margin: "6px 0" }}>{field.evidence.quote}</blockquote>}
                </dd>
              </div>
            ))}
          </dl>
          {(result.items?.[row.item_index]?.review_conflicts || []).map((issue, i) => (
            <p key={i}>{issue}</p>
          ))}
        </details>
      ))}
      {!!review.issues?.length && (
        <details style={{ marginTop: 12 }}>
          <summary>
            {label("复核发现的问题", "Review findings")} ({review.issues.length})
          </summary>
          <ul>
            {review.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </details>
      )}
      {!!review.failures?.length && (
        <p>
          {label(
            "部分来源未能完成复核，请在内部审核中处理。",
            "Some sources could not be reviewed. Internal review is required."
          )}
        </p>
      )}
      {!!result.review_routing?.proposed_client_questions?.length && (
        <details style={{ marginTop: 12 }}>
          <summary>{label("首次识别提出的问题（供内部核对）", "First-pass questions for internal review")}</summary>
          <ul>
            {result.review_routing.proposed_client_questions.map((question, i) => (
              <li key={i}>{question}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
