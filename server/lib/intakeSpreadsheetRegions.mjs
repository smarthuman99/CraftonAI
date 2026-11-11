import { createCanvas, loadImage } from "@napi-rs/canvas";
import sharp from "sharp";
import { spreadsheetColumnRole, isWorksheetNote } from "./intakeSpreadsheetSource.mjs";

const rowHeight = (ws, r) =>
  ws.getRow(r).hidden ? 0 : ((ws.getRow(r).height || ws.properties.defaultRowHeight || 15) * 4) / 3;
const colWidth = (ws, c) =>
  ws.getColumn(c).hidden ? 0 : (ws.getColumn(c).width || ws.properties.defaultColWidth || 9) * 7 + 5;
const noteText = (note) => (typeof note === "string" ? note : (note?.texts || []).map((t) => t.text).join(""));
const coord = (ws, ref) => {
  const cell = ws.getCell(ref);
  return { r: cell.row, c: cell.col };
};

function findRegions(ws, sheet, manifest, images) {
  const ranges = [];
  const productRows = manifest.rows.filter((r) => r.sheet === ws.name).map((r) => r.row);
  const columnCount = sheet.rows.reduce((n, row) => Math.max(n, row.cells.at(-1)?.column || 1), 1);
  const add = (reason, top, bottom, left, right) => {
    const region = {
      top: Math.max(1, top - 2),
      bottom: Math.min(ws.rowCount, bottom + 2),
      left: Math.max(1, Math.min(left, right - 5) - 2),
      right: Math.min(16384, Math.max(Math.min(columnCount, 10), right + 2)),
      reasons: [reason]
    };
    // Tile large regions so the text remains legible in each image.
    for (let r = region.top; r <= region.bottom; r += 10)
      for (let c = region.left; c <= region.right; c += 12) {
        const tile = {
          ...region,
          top: r,
          bottom: Math.min(region.bottom, r + 9),
          left: c,
          right: Math.min(region.right, c + 11)
        };
        const prev = ranges.find(
          (p) =>
            p.left === tile.left &&
            p.right === tile.right &&
            tile.top <= p.bottom + 1 &&
            tile.bottom >= p.top - 1 &&
            Math.max(p.bottom, tile.bottom) - Math.min(p.top, tile.top) < 10
        );
        if (prev) {
          prev.top = Math.min(prev.top, tile.top);
          prev.bottom = Math.max(prev.bottom, tile.bottom);
          if (!prev.reasons.includes(reason)) prev.reasons.push(reason);
        } else ranges.push(tile);
        if (ranges.length > 16) return;
      }
  };
  const headers = sheet.rows
    .filter((r) => r.cells.some((c) => ["product", "quantity", "code"].includes(spreadsheetColumnRole(c.value))))
    .map((r) => r.row);
  for (const ref of sheet.merges) {
    if (ranges.length > 16) break;
    const [a, b] = ref.split(":").map((r) => coord(ws, r));
    if (headers.some((r) => r >= a.r - 1 && r <= b.r + 2) || (a.r < b.r && productRows.includes(a.r)))
      add("merged cells", a.r, b.r, a.c, b.c);
  }
  for (const img of images) {
    if (ranges.length > 16) break;
    const bottom = img.sourceEndRow || img.sourceRow;
    if (bottom > img.sourceRow && productRows.some((r) => r >= img.sourceRow && r <= bottom))
      add("image crossing rows", img.sourceRow, bottom, img.sourceColumn, img.anchor?.endColumn || img.sourceColumn);
  }
  const unclassified = new Set(manifest.unclassified_rows.filter((r) => r.sheet === ws.name).map((r) => r.row));
  for (const row of sheet.rows) {
    if (ranges.length > 16) break;
    for (const c of row.cells) {
      if (
        isWorksheetNote(c.value) ||
        ws.getCell(c.ref).note ||
        (unclassified.has(row.row) &&
          /\p{L}/u.test(c.value) &&
          !/^(?:total|subtotal|budget|delivery|fa fee|remaining budget)\b/i.test(String(c.value).trim()))
      )
        add("footnote or unassigned note", row.row, row.row, c.column, c.column);
    }
  }
  return ranges;
}

function wrapped(ctx, text, x, y, w, h, lineHeight) {
  let line = "",
    baseline = y + lineHeight;
  for (const fragment of String(text).split(/(\s+|(?=[\u3000-\u9fff]))/u)) {
    if (line && (fragment.includes("\n") || ctx.measureText(line + fragment).width > w)) {
      ctx.fillText(line, x, baseline);
      baseline += lineHeight;
      line = "";
      if (baseline > y + h) return;
    }
    line += fragment.replace(/\n/g, " ");
  }
  if (line && baseline <= y + h) ctx.fillText(line, x, baseline);
}

async function drawRegion(ws, region, images, formatCell) {
  const { top, bottom, left, right } = region,
    x = [45],
    y = [25];
  for (let c = left; c <= right; c++) x.push(x.at(-1) + colWidth(ws, c));
  for (let r = top; r <= bottom; r++) y.push(y.at(-1) + rowHeight(ws, r));
  const comments = [];
  for (let r = top; r <= bottom; r++)
    for (let c = left; c <= right; c++) {
      const cell = ws.getCell(r, c);
      if (cell.note) comments.push(cell.address + " · " + noteText(cell.note));
    }
  const w = x.at(-1),
    h = y.at(-1) + comments.length * 42 + 2;
  const scale = Math.min(2, 2400 / w, 1800 / h);
  if (scale < 0.65) throw new Error("worksheet_region_too_large");
  const canvas = createCanvas(Math.ceil(w * scale), Math.ceil(h * scale)),
    ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, w, h);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#46535b";
  for (let c = left; c <= right; c++) if (colWidth(ws, c)) ctx.fillText(ws.getColumn(c).letter, x[c - left] + 4, 17);
  for (let r = top; r <= bottom; r++) if (rowHeight(ws, r)) ctx.fillText(String(r), 4, y[r - top] + 15);
  const done = new Set();
  for (let r = top; r <= bottom; r++)
    for (let c = left; c <= right; c++) {
      if (!rowHeight(ws, r) || !colWidth(ws, c)) continue;
      const cell = ws.getCell(r, c),
        master = cell.master;
      if (done.has(master.address)) continue;
      done.add(master.address);
      let r2 = r,
        c2 = c;
      if (cell.isMerged) {
        while (r2 < bottom && ws.getCell(r2 + 1, c).master.address === master.address) r2++;
        while (c2 < right && ws.getCell(r, c2 + 1).master.address === master.address) c2++;
      }
      const px = x[c - left],
        py = y[r - top],
        cw = x[c2 - left + 1] - px,
        ch = y[r2 - top + 1] - py;
      const fill = master.fill?.fgColor?.argb?.slice(-6);
      ctx.fillStyle = fill ? "#" + fill : "white";
      ctx.fillRect(px, py, cw, ch);
      ctx.strokeStyle = "#c6c9c9";
      ctx.strokeRect(px, py, cw, ch);
      ctx.save();
      ctx.beginPath();
      ctx.rect(px + 1, py + 1, Math.max(0, cw - 2), Math.max(0, ch - 2));
      ctx.clip();
      const size = Math.min(24, Math.max(10, ((master.font?.size || 10) * 4) / 3));
      ctx.font = (master.font?.bold ? "bold " : "") + size + "px sans-serif";
      ctx.fillStyle = "#" + (master.font?.color?.argb?.slice(-6) || "1c2124");
      wrapped(ctx, formatCell(master.value), px + 3, py, cw - 6, ch, size + 1);
      ctx.restore();
    }
  for (const image of images) {
    const a = image.anchor || {},
      c = image.sourceColumn,
      r = image.sourceRow;
    if (c < left || c > right || r > bottom || r < top || !colWidth(ws, c) || !rowHeight(ws, r)) continue;
    const px = x[c - left] + (a.left || 0),
      py = y[r - top] + (a.top || 0);
    const endX = a.endColumn
      ? x[Math.min(right + 1, a.endColumn) - left] + (a.endColumn <= right ? a.endLeft : 0)
      : null;
    const endY = a.endRow ? y[Math.min(bottom + 1, a.endRow) - top] + (a.endRow <= bottom ? a.endTop : 0) : null;
    const iw = Math.max(1, endX == null ? a.width || colWidth(ws, c) : endX - px);
    const ih = Math.max(1, endY == null ? a.height || rowHeight(ws, r) : endY - py);
    const data = await sharp(image.data)
      .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    ctx.save();
    ctx.beginPath();
    ctx.rect(45, 25, w - 45, y.at(-1) - 25);
    ctx.clip();
    ctx.drawImage(await loadImage(data), px, py, iw, ih);
    ctx.restore();
  }
  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#252525";
  comments.forEach((note, i) => wrapped(ctx, note, 45, y.at(-1) + i * 42, w - 50, 42, 15));
  const data = await canvas.encode("jpeg", 87);
  const range = ws.getCell(top, left).address + ":" + ws.getCell(bottom, right).address;
  return {
    range,
    sheet: ws.name,
    top,
    bottom,
    mimeType: "image/jpeg",
    byteLength: data.length,
    dataBase64: data.toString("base64"),
    sourceLabel:
      "EXCEL WORKSHEET REGION " +
      ws.name +
      "!" +
      range +
      " (" +
      region.reasons.join(", ") +
      "). Context only; row and column labels are original coordinates."
  };
}

export async function renderSpreadsheetRegions(workbook, sheets, manifest, images, formatCell) {
  const pages = [],
    issues = [];
  let bytes = 0;
  for (const [index, sheet] of sheets.entries()) {
    const ws = workbook.getWorksheet(sheet.name),
      photos = images.filter((i) => i.worksheet === sheet.name);
    const markIncomplete = (from, to) =>
      issues.push({
        code: "worksheet_visual_context_incomplete",
        sheet: sheet.name,
        row: from,
        row_ids: manifest.rows
          .filter((row) => row.sheet === sheet.name && row.row >= from && row.row <= to)
          .map((row) => row.id)
      });
    for (const region of findRegions(ws, sheet, manifest, photos)) {
      if (pages.length >= 16 || bytes >= 10 * 1024 * 1024) {
        markIncomplete(1, ws.rowCount);
        break;
      }
      try {
        const page = await drawRegion(ws, region, photos, formatCell);
        if (bytes + page.byteLength > 10 * 1024 * 1024) {
          markIncomplete(1, ws.rowCount);
          break;
        }
        bytes += page.byteLength;
        pages.push({ ...page, pageNumber: index + 1 });
      } catch {
        markIncomplete(region.top, region.bottom);
      }
    }
  }
  return { pages, issues };
}
