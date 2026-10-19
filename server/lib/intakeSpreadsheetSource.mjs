import path from "node:path";
import { createHash } from "node:crypto";
import JSZip from "jszip";
import { SaxesParser } from "saxes";

const children = (node, name) => (node?.children || []).filter((n) => n.name === name);
const child = (node, name) => children(node, name)[0];
const descendants = (node, name) =>
  (node?.children || []).flatMap((n) => [...(n.name === name ? [n] : []), ...descendants(n, name)]);
const attr = (node, key) => node?.attrs?.[key];
const clean = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
export const sourceHash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const columnNumber = (ref) => [...ref.match(/^[A-Z]+/)[0]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);

function parseXml(xml) {
  let root;
  const stack = [],
    parser = new SaxesParser({ xmlns: true });
  parser.on("doctype", () => {
    throw new Error("XML document types are not supported.");
  });
  parser.on("opentag", (tag) => {
    const node = {
      name: tag.local,
      attrs: Object.fromEntries(
        Object.values(tag.attributes).map((a) => [
          a.uri === "http://schemas.openxmlformats.org/officeDocument/2006/relationships" ? `r:${a.local}` : a.name,
          a.value
        ])
      ),
      children: [],
      text: ""
    };
    if (stack.length) stack.at(-1).children.push(node);
    else root = node;
    stack.push(node);
  });
  parser.on("text", (text) => {
    if (stack.length) stack.at(-1).text += text;
  });
  parser.on("closetag", () => stack.pop());
  parser.write(xml).close();
  return root;
}

// ExcelJS exposes drawing anchors, but not the newer richData in-cell images.
// Follow the actual workbook/metadata relationships, including reused image values.
export async function readSpreadsheetCellImages(buffer) {
  const zip = await JSZip.loadAsync(buffer),
    images = [],
    issues = [];
  const xml = async (name, optional = false) => {
    const entry = zip.file(name);
    if (!entry && optional) return null;
    if (!entry) throw new Error(`Missing workbook part: ${name}`);
    if (entry._data?.uncompressedSize > 32 * 1024 * 1024) throw new Error(`Oversized workbook XML: ${name}`);
    return parseXml(await entry.async("string"));
  };
  const target = (base, relationship) => {
    if (!relationship || attr(relationship, "TargetMode") === "External")
      throw new Error("External or missing image relationship");
    const value = attr(relationship, "Target") || "";
    const resolved = path.posix.normalize(
      value.startsWith("/") ? value.slice(1) : path.posix.join(path.posix.dirname(base), value)
    );
    if (!resolved.startsWith("xl/") || resolved.includes("\\")) throw new Error("Invalid workbook relationship");
    return resolved;
  };
  const rels = async (part) => {
    const file = path.posix.join(path.posix.dirname(part), "_rels", `${path.posix.basename(part)}.rels`);
    return new Map(children(await xml(file, true), "Relationship").map((r) => [attr(r, "Id"), r]));
  };
  const workbook = await xml("xl/workbook.xml"),
    workbookRels = await rels("xl/workbook.xml");
  const metadata = await xml("xl/metadata.xml", true);
  const types = children(child(metadata, "metadataTypes"), "metadataType");
  const valueMetadata = children(child(metadata, "valueMetadata"), "bk");
  const richValues = children(await xml("xl/richData/rdrichvalue.xml", true), "rv");
  const structures = children(await xml("xl/richData/rdrichvaluestructure.xml", true), "s");
  const richRelPart = "xl/richData/richValueRel.xml";
  const richRefs = children(await xml(richRelPart, true), "rel"),
    richRels = await rels(richRelPart);
  const cache = new Map();
  for (const sheet of children(child(workbook, "sheets"), "sheet")) {
    const worksheet = attr(sheet, "name"),
      sheetPath = target("xl/workbook.xml", workbookRels.get(attr(sheet, "r:id")));
    const sheetXml = await xml(sheetPath);
    for (const cell of descendants(sheetXml, "c")) {
      const sourceCell = attr(cell, "r"),
        formula = child(cell, "f")?.text || "";
      if (/\b(?:DISPIMG|IMAGE)\s*\(/i.test(formula)) {
        issues.push({ code: "unsupported_image_formula", sheet: worksheet, cell: sourceCell });
      }
      if (!attr(cell, "vm")) continue;
      try {
        const records = children(valueMetadata[Number(attr(cell, "vm")) - 1], "rc");
        const record = records.find((r) => attr(types[Number(attr(r, "t")) - 1], "name") === "XLRICHVALUE");
        if (!record) throw new Error("unsupported_cell_metadata");
        const future = children(metadata, "futureMetadata").find((n) => attr(n, "name") === "XLRICHVALUE");
        const rvb = descendants(children(future, "bk")[Number(attr(record, "v"))], "rvb")[0];
        if (!rvb) throw new Error("missing_cell_image_metadata");
        const rich = richValues[Number(attr(rvb, "i"))],
          structure = structures[Number(attr(rich, "s"))];
        if (attr(structure, "t") !== "_localImage") throw new Error("unsupported_rich_value_type");
        const imageIndex = children(structure, "k").findIndex((k) => attr(k, "n") === "_rvRel:LocalImageIdentifier");
        if (imageIndex < 0) throw new Error("missing_cell_image_identifier");
        const identifier = children(rich, "v")[imageIndex]?.text;
        if (!/^\d+$/.test(identifier || "")) throw new Error("invalid_cell_image_identifier");
        const rel = richRefs[Number(identifier)],
          mediaPath = target(richRelPart, richRels.get(attr(rel, "r:id")));
        if (!cache.has(mediaPath)) {
          const entry = zip.file(mediaPath);
          if (!entry) throw new Error("missing_cell_image_bytes");
          if (entry._data?.uncompressedSize > 32 * 1024 * 1024) throw new Error("oversized_cell_image");
          cache.set(mediaPath, await entry.async("nodebuffer"));
        }
        const extension = path.posix.extname(mediaPath).toLowerCase();
        const mimeType =
          {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".gif": "image/gif"
          }[extension] || "application/octet-stream";
        images.push({
          worksheet,
          sourceCell,
          sourceRow: Number(sourceCell.match(/\d+$/)[0]),
          sourceColumn: columnNumber(sourceCell),
          data: cache.get(mediaPath),
          mimeType,
          nativeKind: "in_cell",
          mediaPath
        });
      } catch (error) {
        issues.push({ code: "cell_image_unreadable", sheet: worksheet, cell: sourceCell, reason: error.message });
      }
    }
  }
  return { images, issues };
}

export function spreadsheetColumnRole(header) {
  const label = clean(header)
    .toLowerCase()
    .replace(/[.:：]/g, "");
  if (/^(code|item code|product code|item ref|reference|ref|sku|编号|編號|產品編號|产品编号)$/.test(label))
    return "code";
  if (/^(item|item name|product|product name|name|furniture|家具|产品名称|產品名稱|名称|名稱)$/.test(label))
    return "product";
  if (/^(qty|quantity|quantities|数量|數量)$/.test(label)) return "quantity";
  if (/^(photo|photos|image|images|picture|pictures|照片|图片|圖片)$/.test(label)) return "image";
  if (/^(material|materials|upholstery|upholstery\s*\/\s*finish|materials?\s*\/\s*finish|材质|材質|材料)$/.test(label))
    return "material";
  if (/^(finish|finishes|表面处理|表面處理)$/.test(label)) return "finish";
  if (/^(dimension|dimensions|size|sizes|尺寸)$/.test(label)) return "dimensions";
  if (/^(description|specification|specifications|details|描述|规格|規格)$/.test(label)) return "description";
  if (/^(note|notes|remark|remarks|备注|備註)$/.test(label)) return "notes";
  return "other";
}

export function buildSpreadsheetManifest({ sheets, images, issues = [], fileHash }) {
  const rows = [],
    unclassified = [],
    totals = [],
    diagnostics = [...issues];
  for (const [sheetIndex, sheet] of sheets.entries()) {
    let headers = null,
      foundTable = false;
    for (const source of sheet.rows) {
      const classified = source.cells.map((c) => ({ ...c, role: spreadsheetColumnRole(c.value) }));
      if (
        classified.some((c) => c.role === "product") &&
        classified.some((c) => c.role === "quantity" || c.role === "code")
      ) {
        headers = new Map(classified.map((c) => [c.column, { header: c.value, role: c.role }]));
        foundTable = true;
        continue;
      }
      if (!headers) continue;
      const cells = source.cells.map((c) => ({ ...c, ...(headers.get(c.column) || { header: "", role: "other" }) }));
      const value = (role) => clean(cells.find((c) => c.role === role)?.value);
      const name = value("product"),
        code = value("code"),
        qty = value("quantity");
      const totalLabel = /^(?:grand\s+)?total\b|^subtotal\b|^合计|^總計|^总计/i;
      const totalName =
        /^(?:(?:grand\s+)?total|subtotal)(?:\s+(?:items|pieces|quantity))?[:：]?$|^(合计|總計|总计)[:：]?$/i;
      if (!code && (!name || totalName.test(name)) && cells.some((c) => totalLabel.test(clean(c.value)))) {
        totals.push({
          sheet: sheet.name,
          row: source.row,
          stated_quantity: /^\d+(\.\d+)?$/.test(qty) ? Number(qty) : null,
          cells
        });
        continue;
      }
      if (!name) {
        if (cells.some((c) => clean(c.value))) unclassified.push({ sheet: sheet.name, row: source.row, cells });
        continue;
      }
      rows.push({
        id: `${fileHash.slice(0, 16)}:${sheetIndex + 1}:${source.row}`,
        sheet: sheet.name,
        sheet_index: sheetIndex + 1,
        row: source.row,
        code,
        name,
        quantity: /^\d+(\.\d+)?$/.test(qty) ? Number(qty) : null,
        cells,
        image_refs: [],
        hidden: source.hidden || sheet.hidden || false
      });
    }
    if (!foundTable && sheet.rows.length) diagnostics.push({ code: "unstructured_worksheet", sheet: sheet.name });
    for (const range of sheet.merges || []) {
      const bounds = range.match(/^[A-Z]+(\d+):[A-Z]+(\d+)$/);
      if (!bounds || bounds[1] === bounds[2]) continue;
      const affected = rows.filter(
        (r) => r.sheet === sheet.name && r.row >= Number(bounds[1]) && r.row <= Number(bounds[2])
      );
      if (affected.length > 1)
        diagnostics.push({ code: "merged_product_rows", sheet: sheet.name, range, row_ids: affected.map((r) => r.id) });
    }
  }
  const imageInventory = [];
  for (const image of images) {
    let candidates = rows.filter(
      (r) => r.sheet === image.worksheet && r.row >= image.sourceRow && r.row <= (image.sourceEndRow || image.sourceRow)
    );
    if (candidates.length > 1 && image.rowCoverage?.length) {
      const total = image.rowCoverage.reduce((n, r) => n + r.points, 0);
      const dominant = candidates.filter(
        (r) => (image.rowCoverage.find((c) => c.row === r.row)?.points || 0) >= total * 0.8
      );
      if (total > 0 && dominant.length === 1) candidates = dominant;
    }
    if (candidates.length === 1) {
      candidates[0].image_refs.push(image.page);
      imageInventory.push({ image_ref: image.page, status: "mapped", row_id: candidates[0].id, sha256: image.sha256 });
    } else {
      imageInventory.push({
        image_ref: image.page,
        status: candidates.length ? "ambiguous" : "outside_product_rows",
        sha256: image.sha256
      });
      if (candidates.length)
        diagnostics.push({
          code: "image_spans_product_rows",
          image_ref: image.page,
          row_ids: candidates.map((r) => r.id)
        });
      else
        diagnostics.push({
          code: "unassigned_source_image",
          image_ref: image.page,
          sheet: image.worksheet,
          row: image.sourceRow
        });
    }
  }
  if (unclassified.length) diagnostics.push({ code: "unclassified_table_rows", count: unclassified.length });
  return {
    version: 1,
    file_sha256: fileHash,
    rows,
    totals,
    unclassified_rows: unclassified,
    image_inventory: imageInventory,
    issues: diagnostics
  };
}
