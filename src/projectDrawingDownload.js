/* global document, URL, Image, Blob, setTimeout, fetch */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import { archiveName } from "./drawingExportPlan.mjs";

function canvasOf(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function readImage(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function wrap(ctx, value, maxWidth) {
  const lines = [];
  let current = "";
  for (const word of String(value)
    .split(/(\s+|(?<=[\u3000-\u9fff]))/u)
    .filter(Boolean)) {
    if (current && ctx.measureText(current + word).width > maxWidth) {
      lines.push(current.trimEnd());
      current = "";
    }
    for (const char of word.trimStart() || " ") {
      if (current && ctx.measureText(current + char).width > maxWidth) {
        lines.push(current.trimEnd());
        current = "";
      }
      current += char;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

async function renderConcept(blob, entry, project, lang, reader) {
  const zh = lang === "Cn",
    label = (cn, en) => (zh ? cn : en);
  const image = await readImage(blob);
  const framed =
    entry.drawing.promptVersion === "three-view-v1" && Math.abs(image.width / image.height - 2000 / 1300) < 0.01;
  const artwork = canvasOf(1320, 820);
  const art = artwork.getContext("2d");
  art.fillStyle = "#fff";
  art.fillRect(0, 0, 1320, 820);
  const sx = image.width / 2000,
    sy = image.height / 1300;
  if (framed) {
    art.drawImage(image, 80 * sx, 160 * sy, 1320 * sx, 820 * sy, 0, 0, 1320, 820);
  } else {
    const scale = Math.min(1320 / image.width, 820 / image.height);
    art.drawImage(
      image,
      (1320 - image.width * scale) / 2,
      (820 - image.height * scale) / 2,
      image.width * scale,
      image.height * scale
    );
  }
  if (reader) await reader.translate(artwork);

  const cols = [60, 520, 980, 1450, 1940];
  const fields = [
    [
      [label("項目", "PROJECT"), project.projectName],
      [label("家具", "ITEM"), entry.name],
      [label("尺寸", "DIMENSIONS"), entry.dimensions],
      [label("數量", "QUANTITY"), entry.quantity]
    ],
    [
      [
        label("項目編號", "PROJECT CODE"),
        project.projectId ? "#" + String(project.projectId).slice(0, 8).toUpperCase() : "—"
      ],
      [label("材質與飾面", "MATERIAL / FINISH"), entry.material],
      [label("圖紙依據", "DRAWING BASIS"), label("客戶 FF&E · 概念圖", "Client FF&E · Concept")],
      [label("出圖日期", "ISSUED"), entry.drawing.generatedAt?.slice(0, 10) || "—"]
    ]
  ];
  art.font = "500 23px sans-serif";
  const rows = fields.map((row) =>
    row.map(([title, value], i) => ({ title, lines: wrap(art, value, cols[i + 1] - cols[i] - 44) }))
  );
  const heights = rows.map((row) => Math.max(...row.map((cell) => cell.lines.length), 1) * 31 + 72);
  const sheet = canvasOf(2000, 1050 + heights[0] + heights[1] + 36);
  const ctx = sheet.getContext("2d");
  const box = (x, y, w, h, fill = "#fff") => {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#d8d2c8";
    ctx.strokeRect(x, y, w, h);
  };
  const write = (text, x, y, size, weight = 500, color = "#211f1b") => {
    ctx.fillStyle = color;
    ctx.font = weight + " " + size + "px sans-serif";
    ctx.fillText(text, x, y);
  };
  box(0, 0, sheet.width, sheet.height);
  ctx.strokeRect(24, 24, 1952, sheet.height - 48);
  write("THE CRAFTON", 60, 76, 32, 700);
  write(label("合約家具技術規格", "CONTRACT FURNITURE TECHNICAL SPECIFICATION"), 60, 111, 18);
  box(1450, 48, 490, 76);
  write(label("概念三視圖", "CONCEPT THREE-VIEW") + " · " + entry.revision, 1470, 79, 23, 700, "#894b30");
  write(label("僅供參考，不可用作生產", "REFERENCE ONLY · NOT FOR MANUFACTURE"), 1470, 107, 16);
  box(60, 140, 1360, 860);
  ctx.drawImage(artwork, 80, 160);

  // Three-view v1 reference panels can contain up to three photographs. Crop only
  // the photographs, since each original panel already has a printed caption.
  const count = framed ? Math.min(3, Math.max(0, Number(entry.drawing.sourceCount) || 0)) : 0;
  const panelHeight = Math.floor((590 - 24 * (count - 1)) / Math.max(1, count));
  for (let i = 0; i < count; i++) {
    const top = 140 + i * (panelHeight + 24);
    box(1470, top, 470, panelHeight, "#f7f5f0");
    ctx.drawImage(
      image,
      1480 * sx,
      (top + 10) * sy,
      450 * sx,
      (panelHeight - 34) * sy,
      1480,
      top + 10,
      450,
      panelHeight - 34
    );
    write(label("參考照片 ", "REFERENCE ") + String(i + 1).padStart(2, "0"), 1490, top + panelHeight - 9, 16);
  }
  box(1470, 754, 470, 226, "#f7f5f0");
  write(label("家具追蹤", "ITEM TRACEABILITY"), 1492, 799, 19, 700);
  ctx.font = "600 19px sans-serif";
  ctx.fillStyle = "#211f1b";
  ctx.fillText(entry.sku, 1492, 844, 245);
  write(label("掃碼查看最新記錄", "SCAN FOR LIVE RECORD"), 1492, 880, 16);
  ctx.fillText(entry.trackingId, 1492, 914, 245);
  write(label("需有項目查看權限", "ACCESS CONTROLLED"), 1492, 954, 15);
  const qr = renderToStaticMarkup(
    createElement(QRCodeSVG, {
      xmlns: "http://www.w3.org/2000/svg",
      value: entry.trackingUrl,
      size: 180,
      marginSize: 4,
      level: "M"
    })
  );
  ctx.drawImage(await readImage(new Blob([qr], { type: "image/svg+xml" })), 1748, 777, 180, 180);
  let top = 1030;
  rows.forEach((row, r) => {
    row.forEach(({ title, lines }, i) => {
      box(cols[i], top, cols[i + 1] - cols[i], heights[r]);
      write(title, cols[i] + 20, top + 30, 16, 700, "#73695f");
      lines.forEach((line, k) => write(line, cols[i] + 20, top + 66 + k * 31, 23));
    });
    top += heights[r];
  });
  return new Promise((resolve, reject) =>
    sheet.toBlob((data) => (data ? resolve(data) : reject(new Error("PNG export failed"))), "image/png")
  );
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function downloadProjectDrawings({ project, plan, lang, signal, onProgress, single = false }) {
  const zh = lang === "Cn";
  const zip = single ? null : new (await import("jszip")).default();
  let reader;
  try {
    for (const [index, entry] of plan.entries.entries()) {
      signal.throwIfAborted();
      onProgress?.(index + 1, plan.entries.length);
      try {
        if (!entry.url) throw new Error("Missing drawing URL");
        const response = await fetch(entry.url, { signal });
        if (!response.ok) throw new Error("Drawing fetch failed");
        let blob = await response.blob();
        if (!blob.size || /text\/html|application\/json/i.test(blob.type)) throw new Error("Invalid drawing");
        if (entry.kind === "concept") {
          if (zh && !reader) reader = await (await import("./drawingViewCaptions.js")).createCaptionReader(signal);
          blob = await renderConcept(blob, entry, project, lang, reader);
        }
        signal.throwIfAborted();
        if (single) download(blob, entry.filename);
        else zip.file(entry.filename, await blob.arrayBuffer());
      } catch (error) {
        if (signal.aborted) throw error;
        throw new Error(
          zh
            ? "無法匯出「" + entry.name + "」的圖紙，請重新整理後再試。"
            : "Could not export the drawing for " + entry.name + ". Refresh the project and try again.",
          { cause: error }
        );
      }
    }
    if (zip) {
      if (plan.pending.length) zip.file(zh ? "待出圖.txt" : "Drawings pending.txt", plan.pending.join("\r\n"));
      const archive = await zip.generateAsync({ type: "blob", compression: "STORE" });
      signal.throwIfAborted();
      download(archive, archiveName(project, lang));
    }
  } finally {
    if (reader) await reader.close();
  }
}
