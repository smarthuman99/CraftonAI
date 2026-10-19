const clean = (v) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();
const norm = (v) => clean(v).toLowerCase();
const numbers = (v) => (String(v).match(/\d+(?:\.\d+)?/g) || []).join(",");
const zero = { x_min: 0, y_min: 0, x_max: 0, y_max: 0 };
const rowCell = (row, role) => row.cells.find((cell) => cell.role === role && clean(cell.value));

export function nativeRowValues(row) {
  const description = rowCell(row, "description");
  const dimensions =
    rowCell(row, "dimensions") ||
    (description &&
    /^(width|depth|height|diameter|length|\b[wdhl]\b|宽|寬|深|高|直径|直徑)/i.test(clean(description.value)) &&
    /\d/.test(description.value)
      ? description
      : null);
  return {
    product: rowCell(row, "product"),
    quantity: rowCell(row, "quantity"),
    material: rowCell(row, "material"),
    dimensions
  };
}

function candidatesFor(item, manifest) {
  const rows = manifest.rows;
  // A model-proposed locator is accepted only when the product identity agrees.
  if (item.source_row_id) {
    const row = rows.find((r) => r.id === item.source_row_id);
    if (row && (norm(row.name) === norm(item.item_type_en) || (row.code && norm(row.code) === norm(item.item_ref))))
      return [row];
    return [];
  }
  const explicitCode = item.source_item_code || item.item_ref;
  if (explicitCode && rows.some((r) => r.code && norm(r.code) === norm(explicitCode))) {
    let matches = rows.filter((r) => norm(r.code) === norm(explicitCode));
    if (matches.length > 1 && item.source_sheet) matches = matches.filter((r) => r.sheet === item.source_sheet);
    return matches;
  }
  let matches = rows.filter((r) => norm(r.name) === norm(item.item_type_en));
  if (matches.length > 1 && item.source_sheet) matches = matches.filter((r) => r.sheet === item.source_sheet);
  if (matches.length > 1 && item.usage_location && matches.some((r) => norm(r.sheet) === norm(item.usage_location)))
    matches = matches.filter((r) => norm(r.sheet) === norm(item.usage_location));
  if (matches.length > 1 && matches.some((r) => r.quantity === item.quantity))
    matches = matches.filter((r) => r.quantity === item.quantity);
  if (matches.length > 1 && numbers(item.dimensions_text)) {
    const dimensional = matches.filter(
      (r) => numbers(nativeRowValues(r).dimensions?.value) === numbers(item.dimensions_text)
    );
    if (dimensional.length) matches = dimensional;
  }
  return matches;
}

function bindRow(item, row, recovered = false) {
  const fields = nativeRowValues(row),
    next = { ...item };
  const evidence = (item.field_evidence || []).filter((e) => !Object.keys(fields).includes(e.field));
  const corrections = [];
  for (const [field, cell] of Object.entries(fields)) {
    if (!cell || (field === "quantity" && row.quantity === null)) continue;
    const key = {
      product: "item_type_en",
      quantity: "quantity",
      dimensions: "dimensions_text",
      material: "material_en"
    }[field];
    const value = field === "quantity" ? row.quantity : clean(cell.value);
    if (clean(next[key]) !== clean(value))
      corrections.push({ field, previous: next[key] ?? "", value, cell: cell.ref });
    next[key] = value;
    evidence.push({
      field,
      value: String(value),
      quote: clean(cell.value),
      source_page: row.sheet_index,
      locator: `${row.sheet}!${cell.ref}`,
      source_kind: "text",
      bbox: zero,
      verification: "native_source_cell",
      source_row_id: row.id,
      source_cell: cell.ref
    });
  }
  // Keep the complete source text, including columns the model schema does not know.
  const notes = row.cells
    .filter(
      (c) => !["image", "product", "quantity", "code", "dimensions", "material"].includes(c.role) && clean(c.value)
    )
    .map((c) => `${c.header || c.ref}: ${clean(c.value)}`);
  return {
    ...next,
    item_type_cn: next.item_type_cn || row.name,
    source_row_id: row.id,
    source_item_code: row.code,
    source_sheet: row.sheet,
    source_row: row.row,
    source_page: row.sheet_index,
    source_pages: [row.sheet_index],
    image_ref: row.image_refs[0] || 0,
    source_fields: row.cells.map((c) => ({ ...c })),
    field_evidence: evidence,
    native_field_corrections: corrections,
    source_row_recovered: recovered,
    notes_en: [...new Set([clean(next.notes_en), ...notes].filter(Boolean))].join("\n")
  };
}

// Used only on a fresh intake draft, never to overwrite an existing client project.
export function reconcileSpreadsheetRows(result, manifest) {
  const used = new Set(),
    reserved = new Set(),
    issues = [],
    items = [];
  for (const [index, item] of (result.items || []).entries()) {
    const candidates = candidatesFor(item, manifest);
    for (const row of candidates) reserved.add(row.id);
    if (candidates.length !== 1 || used.has(candidates[0].id)) {
      issues.push({
        code:
          candidates.length > 1
            ? "ambiguous_product_row"
            : candidates.length
              ? "duplicate_output_row"
              : "unmatched_output_row",
        item_index: index
      });
      items.push(item);
      continue;
    }
    used.add(candidates[0].id);
    items.push(bindRow(item, candidates[0]));
  }
  const recovered = [];
  const ambiguousRows = new Set(
    manifest.issues.filter((issue) => issue.code === "merged_product_rows").flatMap((issue) => issue.row_ids)
  );
  for (const row of manifest.rows) {
    if (used.has(row.id) || reserved.has(row.id) || ambiguousRows.has(row.id)) continue;
    // Recover a wholly omitted row from explicit cells, without guessing missing values.
    const item = bindRow(
      {
        item_ref: row.code,
        item_type_cn: row.name,
        quantity: 0,
        dimensions_text: "To confirm",
        material_en: "To confirm",
        material_cn: "",
        original_unit_price: 0,
        unit_price: 0,
        requirement_status: "not_stated",
        notes_cn: ""
      },
      row,
      true
    );
    items.push(item);
    recovered.push(row.id);
  }
  return {
    ...result,
    items,
    source_manifest: manifest,
    source_reconciliation: { version: 1, recovered_rows: recovered, issues }
  };
}

export function nativeEvidenceSupported(evidence, expected, manifest) {
  if (!manifest || evidence.verification !== "native_source_cell") return false;
  const row = manifest.rows.find((r) => r.id === evidence.source_row_id);
  const cell = row?.cells.find((c) => c.ref === evidence.source_cell);
  if (!row || !cell || row.sheet_index !== evidence.source_page) return false;
  const mapped = nativeRowValues(row)[evidence.field];
  return (
    mapped?.ref === cell.ref &&
    norm(cell.value) === norm(evidence.quote) &&
    norm(evidence.value) === norm(expected) &&
    (evidence.field === "quantity"
      ? row.quantity !== null && row.quantity === Number(expected)
      : norm(cell.value) === norm(expected))
  );
}

export function nativeImageSupported(item, manifest) {
  const row = manifest?.rows.find((r) => r.id === item.source_row_id);
  const proof = item.image_source_evidence;
  const expected = manifest?.image_inventory.filter((i) => i.row_id === row?.id && i.status === "mapped") || [];
  return Boolean(
    row &&
    expected.length &&
    item.image_storage_path &&
    proof?.row_id === row.id &&
    proof.file_sha256 === manifest.file_sha256 &&
    proof.storage_verified &&
    item.image_storage_paths?.some(
      (r) =>
        r.storage_path === item.image_storage_path &&
        r.sha256 === item.image_sha256 &&
        expected.some((e) => e.sha256 === r.sha256)
    ) &&
    expected.every((image) => item.image_storage_paths?.some((r) => r.sha256 === image.sha256 && r.storage_verified))
  );
}

export function evaluateSpreadsheetCompleteness(result, manifest, { textTruncated = false } = {}) {
  const issues = [...manifest.issues, ...(result.source_reconciliation?.issues || [])];
  const items = result.items || [],
    mapped = new Map();
  for (const [index, item] of items.entries()) {
    if (!manifest.rows.some((r) => r.id === item.source_row_id)) {
      issues.push({ code: "unmatched_output_row", item_index: index });
      continue;
    }
    if (mapped.has(item.source_row_id))
      issues.push({ code: "duplicate_output_row", item_index: index, row_id: item.source_row_id });
    else mapped.set(item.source_row_id, { item, index });
  }
  if (!manifest.rows.length) issues.push({ code: "no_identified_source_rows" });
  if (textTruncated) issues.push({ code: "source_text_truncated" });
  let fields = 0,
    retained = 0,
    photoRows = 0,
    verifiedPhotos = 0;
  const sourceGaps = [];
  for (const row of manifest.rows) {
    const entry = mapped.get(row.id),
      item = entry?.item;
    if (!item) {
      issues.push({ code: "missing_source_row", row_id: row.id });
      continue;
    }
    for (const cell of row.cells.filter((c) => c.role !== "image" && clean(c.value))) {
      fields++;
      if (item.source_fields?.some((c) => c.ref === cell.ref && c.value === cell.value && c.formula === cell.formula))
        retained++;
      else issues.push({ code: "source_field_not_retained", row_id: row.id, cell: cell.ref, item_index: entry.index });
    }
    for (const [field, cell] of Object.entries(nativeRowValues(row))) {
      if (!cell || (field === "quantity" && row.quantity === null)) {
        sourceGaps.push({ row_id: row.id, field, status: "not_stated_or_unstructured" });
        continue;
      }
      const key = {
        product: "item_type_en",
        quantity: "quantity",
        dimensions: "dimensions_text",
        material: "material_en"
      }[field];
      const agrees = field === "quantity" ? item.quantity === row.quantity : norm(item[key]) === norm(cell.value);
      if (!agrees) issues.push({ code: "source_value_mismatch", row_id: row.id, field, item_index: entry.index });
    }
    if (row.image_refs.length) {
      photoRows++;
      if (nativeImageSupported(item, manifest)) verifiedPhotos++;
      else issues.push({ code: "source_photo_not_verified", row_id: row.id, item_index: entry.index });
    } else sourceGaps.push({ row_id: row.id, field: "image", status: "no_native_image_at_row" });
  }
  for (const total of manifest.totals) {
    if (total.stated_quantity === null) continue;
    const sourceRows = manifest.rows.filter((r) => r.sheet === total.sheet && r.row < total.row);
    if (sourceRows.length && sourceRows.every((r) => r.quantity !== null)) {
      const computed = sourceRows.reduce((n, r) => n + r.quantity, 0);
      if (computed !== total.stated_quantity)
        issues.push({
          code: "source_quantity_total_conflict",
          sheet: total.sheet,
          row: total.row,
          stated: total.stated_quantity,
          computed
        });
    }
  }
  issues.push(...(result.native_image_failures || []).map((f) => ({ ...f, code: "native_image_storage_failure" })));
  return {
    version: 1,
    status: issues.length ? "internal_review_required" : "passed",
    source_rows: manifest.rows.length,
    matched_rows: mapped.size,
    output_rows: items.length,
    source_quantity: manifest.rows.reduce((n, r) => n + (r.quantity || 0), 0),
    output_quantity: items.reduce((n, i) => n + (Number(i.quantity) || 0), 0),
    source_fields: fields,
    retained_fields: retained,
    source_photo_rows: photoRows,
    verified_photo_rows: verifiedPhotos,
    source_gaps: sourceGaps,
    issues
  };
}

export function applySpreadsheetCompleteness(result, manifest, metadata = {}) {
  const check = evaluateSpreadsheetCompleteness(result, manifest, metadata);
  const missing = (result.items || []).filter((i) => !i.image_storage_path && !i.image_url);
  const next = {
    ...result,
    source_manifest: manifest,
    completeness_review: check,
    image_extraction: {
      ...result.image_extraction,
      item_image_count: result.items.filter((i) => i.image_storage_path || i.image_url).length,
      saved_image_count: result.items.reduce(
        (n, i) => n + (i.image_storage_paths?.length || (i.image_storage_path ? 1 : 0)),
        0
      ),
      unresolved_item_refs: missing.map((i) => i.item_ref || i.item_type_en)
    }
  };
  if (check.status === "passed") return next;
  const question = "Crafton must review the file completeness checks before approval.";
  return {
    ...next,
    quality_gate: { ...next.quality_gate, status: "manual_review_required" },
    review_routing: { ...next.review_routing, route: "internal_review" },
    questions: [...new Set([...(next.questions || []), question])],
    open_questions: [...new Set([...(next.open_questions || []), question])]
  };
}
