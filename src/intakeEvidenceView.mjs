const list = (value) => (Array.isArray(value) ? value : []);
const supportedStatuses = new Set(["supported", "not_marked_in_source"]);

// Read-only projection: never recalculate or approve a saved gate in the UI.
export function buildIntakeEvidenceView(result = {}) {
  const gate = result?.evidence_gate?.final;
  if (!gate) return null;
  const review = result.risk_review || {};
  const routing = result.review_routing || {};
  const completeness = result.completeness_review || {};
  const risks = [
    ...list(gate.unresolved_risks),
    ...list(completeness.issues).filter(
      (issue) =>
        !list(gate.unresolved_risks).some(
          (risk) => risk.code === `spreadsheet_${issue.code}` && risk.item_index === issue.item_index
        )
    )
  ];
  const rows = list(gate.items).map((row) => {
    const item = Number.isInteger(row.item_index) ? result.items?.[row.item_index] || {} : {};
    const fields = list(row.fields);
    const pendingFields = fields.filter((field) => !supportedStatuses.has(field.status));
    const conflicts = list(item.review_conflicts);
    const rowRisks = risks.filter((risk) => Number.isInteger(risk.item_index) && risk.item_index === row.item_index);
    return {
      ...row,
      item,
      fields,
      pendingFields,
      conflicts,
      risks: rowRisks,
      pending: pendingFields.length > 0 || conflicts.length > 0 || rowRisks.length > 0
    };
  });
  // A file-level failure must remain visible even when all furniture fields are supported.
  const projectRisks = risks.filter(
    (risk) => !Number.isInteger(risk.item_index) || !rows.some((row) => row.item_index === risk.item_index)
  );
  const findings = list(review.issues);
  const failures = list(review.failures);
  const questions = list(routing.proposed_client_questions);
  const pendingRows = rows.filter((row) => row.pending);
  const needsReview =
    gate.status !== "passed" ||
    ["internal_review", "client_clarification"].includes(routing.route) ||
    (completeness.status && completeness.status !== "passed") ||
    review.status === "failed" ||
    pendingRows.length > 0 ||
    projectRisks.length > 0 ||
    findings.length > 0 ||
    failures.length > 0 ||
    questions.length > 0;
  return {
    gate,
    review,
    routing,
    rows,
    pendingRows,
    projectRisks,
    findings,
    failures,
    questions,
    needsReview: Boolean(needsReview)
  };
}

export function evidenceItemLabel(row, lang) {
  const item = row.item || {};
  const name = lang === "Cn" ? item.item_type_cn || item.item_type_en : item.item_type_en || item.item_type_cn;
  const code = [item.item_ref, item.sku, item.sku_code, row.item_ref].find(
    (value) => value && !/^REVIEW-ITEM-\d+$/i.test(value)
  );
  return (
    [code, name].filter((value, index, parts) => value && parts.indexOf(value) === index).join(" · ") ||
    (Number.isInteger(row.item_index)
      ? `${lang === "Cn" ? "家具" : "Furniture item"} ${row.item_index + 1}`
      : lang === "Cn"
        ? "未匹配的家具"
        : "Unmatched furniture item")
  );
}
