const encoder = new TextEncoder();
function safePart(value, byteLimit) {
  const clean = String(value || "")
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  let part = "",
    bytes = 0;
  for (const char of clean) {
    bytes += encoder.encode(char).length;
    if (bytes > byteLimit) break;
    part += char;
  }
  return part.replace(/[. ]+$/u, "");
}

export function archiveName(project, lang) {
  return (
    ["Crafton", safePart(project.projectName, 55), lang === "Cn" ? "項目圖紙 - 中文" : "Project drawings - EN"]
      .filter(Boolean)
      .join(" - ") + ".zip"
  );
}

const text = (value) => String(value ?? "").trim();
function field(value, lang) {
  if (!text(value) || /^(to confirm|待确认|待確認|TBC)$/i.test(text(value)))
    return lang === "Cn" ? "待確認" : "To confirm";
  return text(value);
}

function measure(value, lang) {
  const source = field(value, lang);
  if (lang === "Cn")
    return source
      .replace(/(\d+)\s+sections?\b/gi, "$1 段")
      .replace(/(\d+)\s+(?:pieces?|pcs)\b(?:\s+of\b)?/gi, "$1 件")
      .replace(/\btop section\b/gi, "上部")
      .replace(/\boptional\b/gi, "可選")
      .replace(/\brequired\b/gi, "必需");
  return source
    .replace(/(\d+)\s*件/gu, "$1 pcs")
    .replace(/(\d+)\s*段/gu, "$1 sections")
    .replace(/上部/gu, "top section")
    .replace(/可[選选]/gu, "optional")
    .replace(/必需/gu, "required")
    .replace(/毫米/gu, "mm")
    .replace(/[寬宽]/gu, "W ")
    .replace(/深/gu, "D ")
    .replace(/高/gu, "H ");
}

export function drawingExportPlan({ project, lines, supplierFiles, lang }) {
  const zh = lang === "Cn";
  const entries = [],
    pending = [];
  const paths = new Set(supplierFiles.flatMap((f) => [f.file_path, f.file_url]).filter(Boolean));
  const matchesCode = (line, code) =>
    !!text(code) &&
    [line.sku, line.item.id, line.item.itemRef].some((value) => text(value).toLowerCase() === text(code).toLowerCase());
  const suffix = zh ? "中文" : "EN";
  const add = (entry, title, extension) => {
    const prefix = String(entries.length + 1).padStart(3, "0");
    const name = [
      prefix,
      safePart(project.projectName, 44),
      safePart(entry.name, 66),
      safePart(entry.sku, 40),
      safePart(title, 55),
      entry.kind === "original" ? (zh ? "原件" : "Original") : suffix
    ]
      .filter(Boolean)
      .join(" - ");
    entries.push({ ...entry, filename: name + "." + extension });
  };

  for (const line of lines) {
    const { item, sku, trackingUrl, trackingId } = line;
    const d = item.technicalDrawing || {};
    const formal =
      ["formal", "approved_for_manufacture"].includes(d.status) || d.lifecycleStage === "approved_for_manufacture";
    const name = field(zh ? item.typeCn : item.typeEn, lang);
    const material = text(zh ? item.materialCn : item.materialEn);
    const finish = text(zh ? item.finishCn : item.finishEn);
    const specification =
      finish && !material.toLowerCase().includes(finish.toLowerCase())
        ? [material, finish].filter(Boolean).join(" · ")
        : material;
    const sheet = {
      name,
      sku,
      trackingUrl,
      trackingId,
      drawing: d,
      material: field(specification, lang),
      dimensions: measure(item.dimensionsText, lang),
      quantity: measure(item.qtyDisplay || item.qty, lang)
    };
    const hasDraft = d.draftUrl || d.draftStoragePath || (!formal && (d.url || d.storagePath));
    if (hasDraft) {
      const rev =
        d.revisions?.find((r) => r?.kind === "ai_concept")?.revision || (formal ? "R00" : d.currentRevision) || "R00";
      add(
        { ...sheet, kind: "concept", url: d.draftUrl || (!formal && d.url), revision: rev },
        (zh ? "概念三視圖 " : "Concept three-view ") + rev,
        "png"
      );
    }
    const original = formal && (d.formalStoragePath || d.storagePath || d.formalUrl || d.url);
    if (original && !paths.has(original)) {
      const ext = extensionOf(original, "");
      add(
        { ...sheet, kind: "original", url: d.formalUrl || d.url },
        (zh ? "已批准施工圖 " : "Approved shop drawing ") + (d.currentRevision || ""),
        ext
      );
    }
    if (!hasDraft && !original && !supplierFiles.some((f) => matchesCode(line, f.payload?.item_code)))
      pending.push(name + " · " + sku);
  }
  for (const file of supplierFiles) {
    const p = file.payload || {};
    const approved = p.review_status === "approved";
    const status = approved
      ? zh
        ? "已批准"
        : "Approved"
      : p.review_status === "changes_required"
        ? zh
          ? "需修訂"
          : "Changes required"
        : zh
          ? "待審核"
          : "Pending review";
    const line = lines.find((l) => matchesCode(l, p.item_code));
    const name = (line && (zh ? line.item.typeCn : line.item.typeEn)) || p.item_name || file.file_name;
    add(
      { kind: "original", url: file.file_url, name, sku: p.item_code },
      [zh ? "施工圖" : "Shop drawing", p.revision, status].filter(Boolean).join(" "),
      extensionOf(file.file_name || file.file_path, p.mime_type)
    );
  }
  return { entries, pending };
}

function extensionOf(name, mime) {
  const ext = String(name || "")
    .split(/[?#]/)[0]
    .match(/\.(pdf|png|webp|jpe?g|dwg|dxf)$/i)?.[1];
  return (
    ext?.toLowerCase() ||
    { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[mime] ||
    "bin"
  );
}
