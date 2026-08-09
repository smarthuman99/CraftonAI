const clean = (value) =>
  String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\b(limited|ltd|company|co|inc|llc|factory|furniture|manufacturing)\b/g, " ")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
    .trim();

const compact = (value) => clean(value).replace(/\s+/g, "");
const tokens = (value) =>
  new Set(
    clean(value)
      .split(/\s+/)
      .filter((token) => token.length > 1)
  );

const itemName = (item, index) =>
  item.nameEn ||
  item.typeEn ||
  item.item_type_en ||
  item.nameCn ||
  item.typeCn ||
  item.item_type_cn ||
  `Item ${index + 1}`;

export function quoteLinesForBatch(batch, project) {
  const documentItems = batch?.payload?.document?.items;
  const source = Array.isArray(documentItems) && documentItems.length ? documentItems : project?.items || [];
  return source.map((item, index) => ({
    item_id: item.id || item.itemId || item.itemNo || item.sku || `ITEM-${index + 1}`,
    item_no: item.itemNo || item.sku || item.id || `ITEM-${String(index + 1).padStart(2, "0")}`,
    item_name: itemName(item, index),
    item_name_cn: item.nameCn || item.typeCn || item.item_type_cn || "",
    quantity: Number(item.quantity || item.qty || 0),
    unit: item.unit || "pcs",
    unit_price: ""
  }));
}

function nameScore(left, right) {
  const leftCompact = compact(left);
  const rightCompact = compact(right);
  if (!leftCompact || !rightCompact) return 0;
  if (leftCompact === rightCompact) return 1;
  if (leftCompact.includes(rightCompact) || rightCompact.includes(leftCompact)) return 0.92;
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union ? overlap / union : 0;
}

export function mergeImportedQuoteLines(baseLines, importedItems = []) {
  const byNumber = new Map();
  importedItems.forEach((item, index) => {
    const key = compact(item.itemNo || item.item_id || item.sku);
    if (key) byNumber.set(key, { item, index });
  });
  const used = new Set();
  const lines = baseLines.map((line, lineIndex) => {
    let match = byNumber.get(compact(line.item_no));
    if (!match) {
      const ranked = importedItems
        .map((item, index) => ({ item, index, score: nameScore(line.item_name, item.itemName || item.name) }))
        .filter((candidate) => !used.has(candidate.index))
        .sort((a, b) => b.score - a.score);
      if (ranked[0]?.score >= 0.55) match = ranked[0];
    }
    if (!match && importedItems.length === baseLines.length && !used.has(lineIndex)) {
      match = { item: importedItems[lineIndex], index: lineIndex };
    }
    if (!match) return line;
    used.add(match.index);
    const returned = match.item;
    return {
      ...line,
      source_item_no: returned.itemNo || "",
      source_item_name: returned.itemName || returned.name || "",
      unit_price: Number(returned.unitPrice || 0) > 0 ? String(Number(returned.unitPrice)) : "",
      returned_line_total: Number(returned.lineTotal || 0),
      line_moq: Number(returned.moq || 0),
      lead_time_days: Number(returned.leadTimeDays || 0),
      material_confirmation: returned.materialConfirmation || "",
      deviation: returned.deviation || "",
      supplier_notes: returned.supplierNotes || ""
    };
  });
  const matchedCount = lines.filter((line) => Number(line.unit_price || 0) > 0).length;
  return { lines, matchedCount, missingCount: Math.max(0, lines.length - matchedCount) };
}

export function matchSupplierReturn({ imported = {}, suppliers = [], batch = null, fileName = "" }) {
  const invited =
    Array.isArray(batch?.supplier_ids) && batch.supplier_ids.length
      ? suppliers.filter((supplier) => batch.supplier_ids.includes(supplier.id))
      : suppliers;
  const company = imported.supplierCompany || "";
  const email = clean(imported.contactEmail);
  const file = clean(fileName);
  const ranked = invited
    .map((supplier) => {
      const aliases = [supplier.name, supplier.company_name, supplier.code].filter(Boolean);
      const companyScore = Math.max(0, ...aliases.map((alias) => nameScore(company, alias)));
      const fileScore = Math.max(0, ...aliases.map((alias) => nameScore(file, alias)));
      const supplierEmail = clean(supplier.email || supplier.contact_email);
      const emailScore = email && supplierEmail && email === supplierEmail ? 1 : 0;
      return { supplier, score: Math.max(companyScore, fileScore * 0.9, emailScore) };
    })
    .sort((a, b) => b.score - a.score);
  if (!ranked[0] || ranked[0].score < 0.5) return null;
  if (ranked[1] && ranked[0].score < 0.8 && ranked[0].score - ranked[1].score < 0.12) return null;
  return ranked[0];
}

export function quoteTotalsFromLines(lines = []) {
  const quantity = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const total = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_price || 0), 0);
  return { quantity, total, weightedUnitPrice: quantity ? total / quantity : 0 };
}
