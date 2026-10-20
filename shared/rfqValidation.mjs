export const isUnconfirmed = (value) =>
  !String(value ?? "").trim() || /^(?:[-—]|tbc|tbd|to confirm|待确认|待定)(?:\b|$|[ /])/i.test(String(value).trim());

// Recompute field checks after edits so a saved "zero warnings" cannot hide missing data.
export function validateRfqDocument(document = {}) {
  const warnings = [];
  const add = (field, severity, messageCn, messageEn) =>
    warnings.push({ field, severity, messageCn, messageEn, source: "field_validation" });
  const items = document.items || [];
  for (const [index, item] of items.entries()) {
    const name = item.itemNo || item.nameEn || `${index + 1}`;
    for (const [key, cn, en] of [
      ["dimensions", "尺寸", "dimensions"],
      ["material", "材质", "material"]
    ]) {
      const pending =
        key === "material"
          ? isUnconfirmed(item.materialCn) && isUnconfirmed(item.materialEn)
          : isUnconfirmed(item[key]);
      if (pending)
        add(`items.${index}.${key}`, "high", `${name}：${cn}待确认。`, `${name}: ${en} requires confirmation.`);
    }
    if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)
      add(`items.${index}.quantity`, "high", `${name}：请确认有效数量。`, `${name}: confirm a valid quantity.`);
    if (/copy.paste|type per spec|conflict|contradict|矛盾|复制|冲突/i.test(item.supplierNotes || ""))
      add(
        `items.${index}.sourceConflict`,
        "high",
        `${name}：来源备注包含规格矛盾，请结合客户澄清复核名称、尺寸及材质。`,
        `${name}: source notes contain a specification conflict; reconcile name, dimensions and material against client clarification.`
      );
  }
  for (const [key, cn, en] of [
    ["tolerance", "尺寸公差", "Dimensional tolerance"],
    ["finishColor", "饰面／颜色", "Finish / colour"],
    ["hardware", "五金要求", "Hardware requirements"],
    ["compliance", "适用合规标准", "Applicable compliance standards"]
  ]) {
    const pending = items.filter((item) => isUnconfirmed(item[key])).map((item) => item.itemNo);
    if (pending.length)
      add(
        `items.${key}`,
        "medium",
        `${cn}待确认：${pending.join("、")}。`,
        `${en} requires confirmation: ${pending.join(", ")}.`
      );
  }
  for (const row of document.commercialRequirements || []) {
    const label = row.labelEn || row.labelCn || "";
    if (/Delivery destination|交货目的地/i.test(label) && isUnconfirmed(row.value))
      add("project.destination", "high", "交货目的地待确认。", "Delivery destination requires confirmation.");
    if (
      /Target delivery|目标交货期/i.test(label) &&
      (isUnconfirmed(row.value) || !/\b(?:19|20)\d{2}\b/.test(row.value))
    )
      add(
        "project.deliveryDate",
        "medium",
        "目标交货期缺少完整日期／年份，请确认。",
        "Confirm the complete target delivery date, including year."
      );
    if (/Packing requirement|包装要求/i.test(label) && /confirm|待确认/i.test(row.value || ""))
      add("project.packaging", "medium", "包装细节待确认。", "Packing details require confirmation.");
  }
  if (!(document.attachments || []).length)
    add("attachments", "high", "未找到客户图纸或照片。", "No customer drawings or photos are linked.");
  for (const [index, question] of (document.sourceQuestions || []).entries()) {
    if (/unit pric|单价/i.test(question)) continue; // This is what the supplier is being asked to quote.
    add(
      `source.questions.${index}`,
      "medium",
      `来源资料仍有待确认事项：${question}`,
      `Open source clarification: ${question}`
    );
  }
  return warnings;
}

export function rfqReviewWarnings(document = {}) {
  const current = validateRfqDocument(document);
  const fields = new Set(current.map((warning) => warning.field));
  return [
    ...current,
    ...(document.missingInformation || []).filter(
      (warning) => warning.source !== "field_validation" && !fields.has(warning.field)
    )
  ];
}
