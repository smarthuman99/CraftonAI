import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { deriveProjectLifecycle } from "../projectLifecycle.js";

const copy = (lang, cn, en) => (lang === "Cn" ? cn : en);

const formatDate = (value, lang, fallback) => {
  if (!value) return fallback || copy(lang, "日期待确认", "Date pending");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(lang === "Cn" ? "zh-HK" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
};

const parseQuantity = (value) => {
  const match = String(value || "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const getItemQuantity = (item) => Number(item?.qty || 0) || parseQuantity(item?.qtyDisplay);

const getJobQuantity = (job) => {
  const itemTotal = (job.items || []).reduce((total, item) => total + getItemQuantity(item), 0);
  return itemTotal || parseQuantity(job.quantityText);
};

const uniqueRows = (rows = []) => {
  const seen = new Set();
  return rows.filter((row, index) => {
    const key = String(row?.id || row?.file_url || row?.file_path || `${row?.created_at || "row"}-${index}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getProgressRows = (project, key) =>
  uniqueRows((project.jobs || []).flatMap((job) => job.clientProgress?.[key] || []));

const getOrderStage = (job) => deriveProjectLifecycle(job).customerStep;

const getOrderStatus = (job, lang) => {
  const lifecycle = deriveProjectLifecycle(job);
  const stage = lifecycle.customerStep;

  if (lifecycle.stageNumber >= 16) {
    return { label: copy(lang, "已交付", "Delivered"), tone: "complete" };
  }
  if (stage === 4) return { label: copy(lang, "运输与交付", "Shipping & delivery"), tone: "progress" };
  if (stage === 3) return { label: copy(lang, "质检与合规", "Inspection & compliance"), tone: "progress" };
  if (stage === 2) return { label: copy(lang, "制造中", "In production"), tone: "progress" };
  if (job.reviewStatus === "revision_requested") {
    return { label: copy(lang, "需要您补充资料", "Your input needed"), tone: "action" };
  }
  if (job.reviewStatus === "approved" || job.reviewStatus === "rfq_ready") {
    return { label: copy(lang, "规格已确认", "Specifications confirmed"), tone: "complete" };
  }
  if (stage === 1) return { label: copy(lang, "规格审核中", "Specification review"), tone: "progress" };
  return { label: copy(lang, "已接收", "Brief received"), tone: "neutral" };
};

const getStageDetail = (job, lang) => {
  const details = [
    copy(lang, "您的需求与附件已安全接收。", "Your brief and attachments have been received."),
    copy(
      lang,
      "Crafton 正在确认尺寸、材质、预算与合规要求。",
      "Crafton is confirming dimensions, materials, budget and compliance."
    ),
    copy(lang, "已进入制造排期或生产阶段。", "The order has entered production planning or manufacturing."),
    copy(lang, "产品正在进行质检、合规检查或包装确认。", "The furniture is in quality, compliance or packing checks."),
    copy(lang, "项目已进入运输、到岸或现场交付阶段。", "The project is in shipping, landing or site delivery.")
  ];
  return details[getOrderStage(job)];
};

const isActionNeeded = (job) => job.reviewStatus === "revision_requested";

const getActionQuestions = (job, lang) => {
  if ((job.activeQuestions || []).length) return job.activeQuestions;
  if ((job.questions || []).length) return job.questions;
  if (job.reviewStatus === "revision_requested") {
    return [
      job.reviewNotes || copy(lang, "请补充缺少的规格资料。", "Please provide the missing specification details.")
    ];
  }
  return [];
};

const normalizeQuestionText = (value) =>
  String(value || "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const QUESTION_MATCH_STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "of",
  "to",
  "please",
  "confirm",
  "clarify",
  "item",
  "items",
  "furniture"
]);

const getQuestionItemMatchScore = (question, item) => {
  const normalizedQuestion = normalizeQuestionText(question);
  const names = [item.typeCn, item.typeEn].map(normalizeQuestionText).filter(Boolean);

  if (names.some((name) => name.length > 1 && normalizedQuestion.includes(name))) return 100;

  return names.reduce((bestScore, name) => {
    const nameTokens = name.split(" ").filter((token) => token.length > 1 && !QUESTION_MATCH_STOP_WORDS.has(token));
    const questionTokens = new Set(
      normalizedQuestion.split(" ").filter((token) => token.length > 1 && !QUESTION_MATCH_STOP_WORDS.has(token))
    );
    const sharedTokens = nameTokens.filter((token) => questionTokens.has(token));
    const minimumSharedTokens = nameTokens.length === 1 ? 1 : 2;
    if (sharedTokens.length < minimumSharedTokens) return bestScore;
    return Math.max(bestScore, sharedTokens.length / nameTokens.length);
  }, 0);
};

const getProjectImage = (project) => {
  for (const job of project.jobs || []) {
    const itemImage = (job.items || []).find((item) => item.imageUrl)?.imageUrl;
    if (itemImage) return itemImage;
    if (job.previewUrl) return job.previewUrl;
  }
  return "";
};

const getProjectStage = (project) => Math.max(...project.jobs.map(getOrderStage), 0);

const getProjectStatus = (project, lang) => {
  const actionJob = project.jobs.find(isActionNeeded);
  if (actionJob) return getOrderStatus(actionJob, lang);
  const latestStageJob = [...project.jobs].sort((a, b) => getOrderStage(b) - getOrderStage(a))[0];
  return getOrderStatus(latestStageJob || project.jobs[0], lang);
};

const getProjectItems = (project) =>
  project.jobs.flatMap((job) => {
    const fallbackItem = {
      id: `${job.id}-pending-item`,
      typeCn: "家具规格整理中",
      typeEn: "Furniture specification pending",
      qtyDisplay: job.quantityText,
      imageUrl: job.previewUrl
    };
    return (job.items.length ? job.items : [fallbackItem]).map((item) => ({ job, item }));
  });

const getProjectDeliveryDate = (project) => {
  const shipmentDates = getProgressRows(project, "shipments")
    .map((row) => row.eta)
    .filter(Boolean);
  const requestedDates = project.jobs.map((job) => job.desiredDeliveryDate).filter(Boolean);
  return [...shipmentDates, ...requestedDates].sort()[0] || "";
};

const stableIdentityToken = (value, length = 8) => {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(length, "0").slice(-length);
};

const getItemIdentityKey = (project, job, item) =>
  [project.projectId || project.key || project.projectName, job.id, item.id].filter(Boolean).join("|");

const getItemSku = (project, job, item) => {
  const savedSku = item.sku || item.skuCode || item.itemNo || item.item_code || item.technicalDrawing?.sku;
  if (savedSku) return String(savedSku).trim().toUpperCase();

  const projectInitials = String(project.projectName || "Project")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3);
  const identity = getItemIdentityKey(project, job, item);
  return `CRF-${projectInitials || "PRJ"}-${stableIdentityToken(`${identity}|sku`, 5)}-R01`;
};

const getItemTrackingId = (project, job, item) => {
  const savedTrackingId =
    item.trackingId ||
    item.tracking_id ||
    item.qrTrackingId ||
    item.qr_tracking_id ||
    item.technicalDrawing?.trackingId;
  if (savedTrackingId) return String(savedTrackingId).trim().toUpperCase();
  const identity = getItemIdentityKey(project, job, item);
  return `TRK-${stableIdentityToken(`${identity}|tracking`, 7)}${stableIdentityToken(`tracking|${identity}`, 5)}`;
};

const getItemTrackingUrl = (trackingId) => {
  if (typeof window === "undefined") return `?view=item-tracking&tracking=${encodeURIComponent(trackingId)}`;
  const publicOrigin =
    window.location.hostname === "129.121.98.185" ? "https://129.121.98.185:8443" : window.location.origin;
  const url = new URL(publicOrigin + window.location.pathname);
  url.searchParams.set("view", "item-tracking");
  url.searchParams.set("tracking", trackingId);
  return url.toString();
};

const getItemDrawingUrl = (item) => {
  const drawing = item.technicalDrawing || {};
  return ["formal", "approved_for_manufacture"].includes(drawing.status)
    ? drawing.formalUrl || drawing.url
    : drawing.draftUrl || drawing.url;
};

const isManufacturingDrawing = (drawing = {}) =>
  drawing.lifecycleStage === "approved_for_manufacture" ||
  ["formal", "approved_for_manufacture"].includes(drawing.status);

const drawingIdentity = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\p{L}]+/gu, " ")
    .trim();

const getSupplierDrawingRevisions = (project, job, item) => {
  const sku = getItemSku(project, job, item);
  const codes = [sku, item.id, item.itemCode, item.item_code].map(drawingIdentity).filter(Boolean);
  const names = [item.typeEn, item.typeCn].map(drawingIdentity).filter(Boolean);
  return getProgressRows(project, "projectFiles")
    .filter((file) => file.file_group === "supplier_shop_drawing")
    .filter((file) => {
      const payloadCode = drawingIdentity(file.payload?.item_code);
      const payloadName = drawingIdentity(file.payload?.item_name);
      return codes.includes(payloadCode) || names.includes(payloadName);
    })
    .sort(
      (left, right) =>
        Number(right.payload?.revision_number || 0) - Number(left.payload?.revision_number || 0) ||
        String(right.created_at || "").localeCompare(String(left.created_at || ""))
    );
};

const isDrawingPreviewImage = (file) => String(file?.payload?.mime_type || "").startsWith("image/");

const getDrawingQrElementId = (trackingId) =>
  `cho-drawing-qr-${String(trackingId || "item").replace(/[^A-Za-z0-9_-]/g, "-")}`;

const safeDownloadName = (value, fallback = "Crafton-three-view") =>
  String(value || fallback)
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || fallback;

const loadBrowserImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The drawing image could not be prepared for download."));
    image.src = src;
  });

const triggerBlobDownload = (blob, filename) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

const drawTrackingPanel = (context, { x, y, width, height, qrImage, sku, trackingId, legacy = false }) => {
  const scale = legacy ? width / 2000 : width / 470;
  const inset = (legacy ? 80 : 26) * scale;
  const qrSize = 168 * scale;
  const qrX = x + width - (legacy ? 70 : 15) * scale - qrSize;
  const qrY = y + Math.max((height - qrSize) / 2, 5 * scale);
  const textX = x + inset;

  context.save();
  context.fillStyle = "#f7f5f0";
  context.fillRect(x, y, width, height);
  context.strokeStyle = "#d8d2c8";
  context.lineWidth = Math.max(1, scale);
  context.strokeRect(x, y, width, height);
  context.fillStyle = "#73695f";
  context.font = `700 ${14 * scale}px Arial, sans-serif`;
  context.fillText("ITEM TRACEABILITY", textX, y + 40 * scale);
  context.fillStyle = "#211f1b";
  context.font = `700 ${18 * scale}px Arial, sans-serif`;
  context.fillText(sku, textX, y + 80 * scale);
  context.fillStyle = "#82786e";
  context.font = `600 ${12 * scale}px Arial, sans-serif`;
  context.fillText("SCAN FOR LIVE RECORD", textX, y + 119 * scale);
  context.fillStyle = "#4a3525";
  context.font = `600 ${14 * scale}px Arial, sans-serif`;
  context.fillText(trackingId, textX, y + 153 * scale);
  context.fillStyle = "#82786e";
  context.font = `600 ${12 * scale}px Arial, sans-serif`;
  context.fillText("QR ID · ACCESS CONTROLLED", textX, y + 196 * scale);
  context.fillStyle = "#ffffff";
  context.fillRect(qrX - 5 * scale, qrY - 5 * scale, qrSize + 10 * scale, qrSize + 10 * scale);
  context.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
  context.restore();
};

function DrawingTrackingPanel({ lang, preview, legacy = false }) {
  return (
    <div
      className={`cho-drawing-tracking-panel${legacy ? " is-legacy" : ""}`}
      aria-label={copy(lang, "家具追踪二维码", "Item tracking QR code")}
    >
      <div>
        <span>{copy(lang, "单项追踪", "ITEM TRACEABILITY")}</span>
        <strong>{preview.sku}</strong>
        <small>{copy(lang, "扫描查看最新记录", "SCAN FOR LIVE RECORD")}</small>
        <code>{preview.trackingId}</code>
      </div>
      <QRCodeSVG
        id={getDrawingQrElementId(preview.trackingId)}
        value={preview.trackingUrl}
        size={168}
        level="H"
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#211f1b"
        title={`${preview.sku} ${copy(lang, "追踪二维码", "tracking QR code")}`}
      />
    </div>
  );
}

function ProductImage({ src, alt, className = "" }) {
  if (src) return <img className={className} src={src} alt={alt} loading="lazy" />;
  return (
    <span className={`cho-client-image-placeholder ${className}`}>{copy("En", "图片待上传", "Reference pending")}</span>
  );
}

function ItemReferenceImageControl({ lang, src, alt, state = {}, disabled = false, onChoose, onCandidate }) {
  const statusLabel =
    state.status === "uploading"
      ? copy(lang, "上传中", "Uploading")
      : state.status === "queued"
        ? copy(lang, "已排队", "Queued")
        : state.status === "error"
          ? copy(lang, "重试", "Retry")
          : src
            ? copy(lang, "更换", "Replace")
            : copy(lang, "补录照片", "Add photo");
  const actionLabel = src
    ? copy(lang, `更换 ${alt} 的参考照片`, `Replace the reference photo for ${alt}`)
    : copy(lang, `为 ${alt} 补录参考照片`, `Add a reference photo for ${alt}`);

  const acceptCandidate = (file) => {
    if (!disabled && file) onCandidate(file);
  };

  return (
    <button
      type="button"
      className={`cho-item-reference-control${src ? " has-image" : " is-empty"} status-${state.status || "idle"}`}
      onClick={onChoose}
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        event.preventDefault();
        acceptCandidate(event.dataTransfer.files?.[0]);
      }}
      onPaste={(event) => acceptCandidate(event.clipboardData.files?.[0])}
      disabled={disabled || state.status === "uploading"}
      aria-label={actionLabel}
      title={state.message || actionLabel}
    >
      {src ? <img src={src} alt={alt} loading="lazy" /> : <i className="fa-regular fa-image" aria-hidden="true"></i>}
      <span>{statusLabel}</span>
    </button>
  );
}

function ReferenceImageUploadSheet({ lang, candidate, state, onChooseAnother, onConfirm, onClose }) {
  const itemName = lang === "Cn" ? candidate.item.typeCn : candidate.item.typeEn;
  const uploading = state.status === "uploading";

  return (
    <div
      className="cho-project-action-sheet-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !uploading) onClose();
      }}
    >
      <section
        className="cho-project-action-sheet cho-reference-upload-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cho-reference-upload-title"
      >
        <header className="cho-project-action-sheet-header">
          <span className="cho-client-kicker">{copy(lang, "补录产品照片", "ITEM REFERENCE")}</span>
          <button
            type="button"
            className="cho-project-action-sheet-close"
            onClick={onClose}
            disabled={uploading}
            aria-label={copy(lang, "关闭照片补录", "Close reference image upload")}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </header>

        <div className="cho-reference-upload-heading">
          <span>{candidate.item.itemRef || candidate.sku}</span>
          <h2 id="cho-reference-upload-title">{itemName}</h2>
          <p>
            {copy(
              lang,
              "这张照片只会补充当前家具项目，并为它单独生成 AI 概念三视图。",
              "This photo updates only this furniture line and queues its AI concept drawing."
            )}
          </p>
        </div>

        <div className="cho-reference-upload-preview">
          <img src={candidate.previewUrl} alt={copy(lang, `${itemName} 待上传预览`, `${itemName} upload preview`)} />
          <span>{copy(lang, "待确认", "READY TO ADD")}</span>
        </div>

        <dl className="cho-reference-upload-facts">
          <div>
            <dt>{copy(lang, "文件", "FILE")}</dt>
            <dd>{candidate.file.name}</dd>
          </div>
          <div>
            <dt>{copy(lang, "影响范围", "SCOPE")}</dt>
            <dd>{copy(lang, "仅此 item", "This item only")}</dd>
          </div>
        </dl>

        <div className="cho-reference-upload-note">
          <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
          <span>
            {copy(
              lang,
              "不会重新分析 FF&E，也不会更改数量、规格、项目阶段、SKU 或二维码。",
              "The FF&E file, quantity, specification, project stage, SKU and QR tracking remain unchanged."
            )}
          </span>
        </div>

        <footer className="cho-project-action-sheet-footer">
          {state.message && (
            <div className={`cho-client-answer-status status-${state.status}`} role="status" aria-live="polite">
              {state.message}
            </div>
          )}
          <button type="button" className="cho-client-button primary" onClick={onConfirm} disabled={uploading}>
            <i
              className={`fa-solid ${uploading ? "fa-spinner fa-spin" : "fa-arrow-up-from-bracket"}`}
              aria-hidden="true"
            ></i>
            {uploading ? copy(lang, "正在保存…", "Saving…") : copy(lang, "使用此照片", "Use this photo")}
          </button>
          <button type="button" className="cho-client-button secondary" onClick={onChooseAnother} disabled={uploading}>
            {copy(lang, "选择另一张", "Choose another")}
          </button>
        </footer>
      </section>
    </div>
  );
}

function ItemTrackingSheet({ lang, project, job, item, onOpenDrawing, onClose }) {
  const [copyState, setCopyState] = useState("");
  const sku = getItemSku(project, job, item);
  const trackingId = getItemTrackingId(project, job, item);
  const trackingUrl = getItemTrackingUrl(trackingId, item);
  const itemName = lang === "Cn" ? item.typeCn : item.typeEn;
  const material = lang === "Cn" ? item.materialCn : item.materialEn;
  const drawing = item.technicalDrawing || {};
  const conceptDrawingUrl = getItemDrawingUrl(item);
  const supplierDrawingRevisions = getSupplierDrawingRevisions(project, job, item);
  const latestApprovedSupplierDrawing = supplierDrawingRevisions.find(
    (file) => file.payload?.review_status === "approved"
  );
  const drawingUrl = latestApprovedSupplierDrawing?.file_url || conceptDrawingUrl;
  const drawingIsFormal = Boolean(latestApprovedSupplierDrawing) || isManufacturingDrawing(drawing);
  const stage = getOrderStage(job);
  const status = getOrderStatus(job, lang);
  const qrElementId = `cho-item-qr-${trackingId.replace(/[^A-Za-z0-9_-]/g, "-")}`;
  const stages =
    lang === "Cn"
      ? ["下单", "规格", "生产", "质检", "交付"]
      : ["Order", "Specify", "Production", "Inspect", "Delivery"];

  const handleCopy = async () => {
    try {
      await window.navigator.clipboard.writeText(trackingUrl);
      setCopyState(copy(lang, "追踪链接已复制", "Tracking link copied"));
    } catch {
      setCopyState(copy(lang, "无法自动复制，请手动扫描二维码", "Copy unavailable — scan the QR code instead"));
    }
  };

  const handleDownload = () => {
    const qrElement = document.getElementById(qrElementId);
    if (!qrElement) return;
    const source = new window.XMLSerializer().serializeToString(qrElement);
    const blobUrl = URL.createObjectURL(new window.Blob([source], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${sku}-QR.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div
      className="cho-project-action-sheet-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="cho-project-action-sheet cho-item-tracking-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cho-item-tracking-title"
      >
        <header className="cho-project-action-sheet-header">
          <span className="cho-client-kicker">{copy(lang, "单项数字档案", "ITEM PASSPORT")}</span>
          <button
            type="button"
            className="cho-project-action-sheet-close"
            onClick={onClose}
            aria-label={copy(lang, "关闭追踪资料", "Close tracking details")}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </header>

        <div className="cho-project-action-sheet-identity cho-item-tracking-identity">
          <ProductImage src={item.imageUrl || job.previewUrl} alt={itemName} />
          <div>
            <h2 id="cho-item-tracking-title">{itemName}</h2>
            <p>{sku}</p>
          </div>
        </div>

        <section className="cho-item-passport-drawing" aria-label={copy(lang, "最新图纸", "Latest drawing")}>
          <div className="cho-item-passport-drawing-heading">
            <div>
              <span>{copy(lang, "最新图纸", "LATEST DRAWING")}</span>
              <strong>
                {drawingIsFormal
                  ? copy(lang, "Crafton 已批准", "Crafton approved")
                  : copy(lang, "AI 概念参考 · 不可用于生产", "AI concept reference · Not for manufacture")}
              </strong>
            </div>
            <span className={`cho-item-passport-drawing-status ${drawingIsFormal ? "is-formal" : "is-draft"}`}>
              {drawingIsFormal ? copy(lang, "生产批准", "MFG APPROVED") : copy(lang, "概念", "CONCEPT")}
            </span>
          </div>
          {drawingUrl && latestApprovedSupplierDrawing ? (
            <a
              className={`cho-item-passport-drawing-preview${isDrawingPreviewImage(latestApprovedSupplierDrawing) ? "" : " is-document"}`}
              href={drawingUrl}
              target="_blank"
              rel="noreferrer"
            >
              {isDrawingPreviewImage(latestApprovedSupplierDrawing) ? (
                <img src={drawingUrl} alt={`${itemName} ${copy(lang, "供应商施工图", "supplier shop drawing")}`} />
              ) : (
                <i className="fa-regular fa-file-lines" aria-hidden="true"></i>
              )}
              <span>
                <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                {copy(lang, "打开已批准的供应商版本", "Open approved supplier revision")}
              </span>
            </a>
          ) : drawingUrl ? (
            <button
              type="button"
              className="cho-item-passport-drawing-preview"
              onClick={() =>
                onOpenDrawing?.({
                  url: drawingUrl,
                  itemName,
                  drawing,
                  sku,
                  trackingId,
                  trackingUrl
                })
              }
            >
              <img src={drawingUrl} alt={`${itemName} ${copy(lang, "三视图", "three-view drawing")}`} />
              <span>
                <i className="fa-solid fa-expand" aria-hidden="true"></i>
                {copy(lang, "查看及下载完整图纸", "View and download full drawing")}
              </span>
            </button>
          ) : (
            <div className="cho-item-passport-drawing-pending">
              <i className="fa-regular fa-image" aria-hidden="true"></i>
              <span>{copy(lang, "图纸仍在生成中", "Drawing generation is still pending")}</span>
            </div>
          )}
        </section>

        {supplierDrawingRevisions.length > 0 && (
          <section
            className="cho-item-passport-revisions"
            aria-label={copy(lang, "图纸版本记录", "Drawing revision history")}
          >
            <div>
              <span>{copy(lang, "图纸版本记录", "DRAWING REVISION HISTORY")}</span>
              <strong>{supplierDrawingRevisions.length + 1}</strong>
            </div>
            <article>
              <code>R00</code>
              <span>
                <strong>{copy(lang, "AI 概念参考", "AI concept reference")}</strong>
                <small>{copy(lang, "仅供沟通 · 不可生产", "Reference only · Not for manufacture")}</small>
              </span>
            </article>
            {supplierDrawingRevisions.map((file) => (
              <a href={file.file_url || undefined} target="_blank" rel="noreferrer" key={file.id}>
                <code>{file.payload?.revision || "R--"}</code>
                <span>
                  <strong>{file.file_name}</strong>
                  <small>
                    {file.payload?.review_status === "approved"
                      ? copy(lang, "已批准用于生产", "Approved for manufacture")
                      : file.payload?.review_status === "changes_required"
                        ? copy(lang, "已退回修订", "Returned for revision")
                        : copy(lang, "等待技术审核", "Pending technical review")}
                  </small>
                </span>
              </a>
            ))}
          </section>
        )}

        <div className="cho-item-tracking-qr-card">
          <QRCodeSVG
            id={qrElementId}
            value={trackingUrl}
            size={176}
            level="H"
            marginSize={2}
            bgColor="#fbf6ec"
            fgColor="#232220"
            title={`${sku} ${copy(lang, "追踪二维码", "tracking QR code")}`}
          />
          <div>
            <span>{copy(lang, "扫描查看最新记录", "SCAN FOR LIVE RECORD")}</span>
            <strong>{trackingId}</strong>
            <p>
              {copy(
                lang,
                "二维码只保存追踪编号；项目资料仍受账号权限保护。",
                "The QR stores only the tracking identity. Project details remain access-controlled."
              )}
            </p>
          </div>
        </div>

        <dl className="cho-item-tracking-facts">
          <div>
            <dt>{copy(lang, "项目", "Project")}</dt>
            <dd>{project.projectName}</dd>
          </div>
          <div>
            <dt>{copy(lang, "数量", "Quantity")}</dt>
            <dd>{item.qtyDisplay || item.qty || job.quantityText || "-"}</dd>
          </div>
          <div>
            <dt>{copy(lang, "当前状态", "Current status")}</dt>
            <dd>{status.label}</dd>
          </div>
          <div>
            <dt>{copy(lang, "尺寸", "Dimensions")}</dt>
            <dd>{item.dimensionsText || job.dimensions || copy(lang, "待确认", "To confirm")}</dd>
          </div>
          <div>
            <dt>{copy(lang, "材质 / 饰面", "Material / finish")}</dt>
            <dd>{[material, item.finish].filter(Boolean).join(" · ") || copy(lang, "待确认", "To confirm")}</dd>
          </div>
          <div>
            <dt>{copy(lang, "图纸版本", "Drawing version")}</dt>
            <dd>
              {latestApprovedSupplierDrawing
                ? `${latestApprovedSupplierDrawing.payload?.revision || "R--"} · ${copy(lang, "供应商施工图已批准", "Supplier shop drawing approved")}`
                : drawingIsFormal
                  ? copy(lang, "供应商施工图 · 已批准生产", "Supplier shop drawing · Approved for manufacture")
                  : copy(lang, "AI 概念 R00 · 仅供参考", "AI concept R00 · Reference only")}
            </dd>
          </div>
        </dl>

        <div className="cho-item-tracking-timeline" aria-label={copy(lang, "追踪阶段", "Tracking stages")}>
          {stages.map((label, index) => (
            <div className={index < stage ? "complete" : index === stage ? "current" : "upcoming"} key={label}>
              <span aria-hidden="true">{index < stage ? <i className="fa-solid fa-check"></i> : index + 1}</span>
              <div>
                <strong>{label}</strong>
                <small>
                  {index < stage
                    ? copy(lang, "已验证", "Verified")
                    : index === stage
                      ? getStageDetail(job, lang)
                      : copy(lang, "等待前序阶段", "Awaiting prior stage")}
                </small>
              </div>
            </div>
          ))}
        </div>

        <div className="cho-item-tracking-note">
          <i className="fa-solid fa-boxes-stacked" aria-hidden="true"></i>
          <p>
            {copy(
              lang,
              "SKU 定义这一款规格；正式生产后，可在同一 SKU 下继续加入批次号或单件序列号。",
              "The SKU identifies this specification. Batch or unit serial numbers can be added beneath it once production begins."
            )}
          </p>
        </div>

        <footer className="cho-project-action-sheet-footer cho-item-tracking-actions">
          {copyState && <p role="status">{copyState}</p>}
          <button type="button" className="cho-client-button primary" onClick={handleDownload}>
            <i className="fa-solid fa-download" aria-hidden="true"></i>
            {copy(lang, "下载二维码标签", "Download QR label")}
          </button>
          <button type="button" className="cho-client-button secondary" onClick={handleCopy}>
            <i className="fa-solid fa-link" aria-hidden="true"></i>
            {copy(lang, "复制追踪链接", "Copy tracking link")}
          </button>
        </footer>
      </section>
    </div>
  );
}

function ProjectActionSheet({
  lang,
  project,
  sheet,
  questionCursor,
  answerDrafts,
  answerStates,
  onQuestionCursorChange,
  onAnswerChange,
  onAnswerInput,
  onSubmitAnswers,
  onClose
}) {
  if (!sheet?.entries?.length) return null;

  const action = sheet.entries[Math.min(questionCursor, sheet.entries.length - 1)];
  const answers = answerDrafts[action.job.id] || action.job.clientAnswers || {};
  const submitState = answerStates[action.job.id] || {};
  const isSubmitting = submitState.status === "submitting";
  const itemName = sheet.item ? (lang === "Cn" ? sheet.item.typeCn : sheet.item.typeEn) : project.projectName;
  const itemImage = sheet.item ? sheet.item.imageUrl || action.job.previewUrl : getProjectImage(project);
  const itemSku = sheet.item ? getItemSku(project, action.job, sheet.item) : "";

  return (
    <div
      className="cho-project-action-sheet-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="cho-project-action-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cho-project-action-sheet-title"
      >
        <header className="cho-project-action-sheet-header">
          <span className="cho-client-kicker">
            {sheet.scope === "item"
              ? copy(lang, "家具确认事项", "LINE ITEM ACTION")
              : copy(lang, "项目确认事项", "PROJECT ACTION")}
          </span>
          <button
            type="button"
            className="cho-project-action-sheet-close"
            onClick={onClose}
            aria-label={copy(lang, "关闭", "Close")}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </header>

        <div className="cho-project-action-sheet-identity">
          {itemImage && <ProductImage src={itemImage} alt={itemName} />}
          <div>
            <h2 id="cho-project-action-sheet-title">{itemName}</h2>
            <p>
              {sheet.scope === "item" && sheet.item
                ? [
                    itemSku,
                    `${copy(lang, "数量", "Qty")} ${sheet.item.qtyDisplay || sheet.item.qty || action.job.quantityText || "-"}`
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : `${copy(lang, "项目", "Project")} · #${String(project.projectId || action.job.id)
                    .slice(0, 8)
                    .toUpperCase()}`}
            </p>
          </div>
        </div>

        <div className="cho-project-action-sheet-progress">
          <span>
            {copy(lang, "问题", "Question")} {questionCursor + 1} / {sheet.entries.length}
          </span>
          {sheet.entries.length > 1 && (
            <div>
              <button
                type="button"
                onClick={() => onQuestionCursorChange(Math.max(questionCursor - 1, 0))}
                disabled={questionCursor === 0}
              >
                <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                <span className="sr-only">{copy(lang, "上一条", "Previous question")}</span>
              </button>
              <button
                type="button"
                onClick={() => onQuestionCursorChange(Math.min(questionCursor + 1, sheet.entries.length - 1))}
                disabled={questionCursor === sheet.entries.length - 1}
              >
                <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                <span className="sr-only">{copy(lang, "下一条", "Next question")}</span>
              </button>
            </div>
          )}
        </div>

        <label className="cho-project-action-sheet-question">
          <span>{copy(lang, "需要您的确认", "QUESTION")}</span>
          <strong>{action.question}</strong>
          <textarea
            value={answers[action.questionIndex] || ""}
            onChange={(event) =>
              onAnswerChange(action.job.id, action.questionIndex, event.target.value, action.job.clientAnswers)
            }
            onInput={() => onAnswerInput(action.job.id)}
            placeholder={copy(lang, "输入或选择您的答案…", "Select or type your answer…")}
            disabled={isSubmitting}
            autoFocus
          />
        </label>

        <footer className="cho-project-action-sheet-footer">
          {submitState.message && (
            <div className={`cho-client-answer-status status-${submitState.status}`} role="status" aria-live="polite">
              {submitState.message}
            </div>
          )}
          <button
            type="button"
            className="cho-client-button primary"
            onClick={async () => {
              await onSubmitAnswers(action.job.id);
              onClose();
            }}
            disabled={isSubmitting || !String(answers[action.questionIndex] || "").trim()}
          >
            {isSubmitting
              ? copy(lang, "保存中…", "Saving…")
              : submitState.status === "success"
                ? copy(lang, "已保存", "Answer saved")
                : copy(lang, "保存答案", "Save answer")}
          </button>
          <button type="button" className="cho-client-button secondary" onClick={onClose}>
            {copy(lang, "取消", "Cancel")}
          </button>
        </footer>
      </section>
    </div>
  );
}

function ClientProjectDetail({
  lang,
  clientName,
  project,
  answerDrafts,
  answerStates,
  onAnswerChange,
  onAnswerInput,
  onSubmitAnswers,
  onBack,
  onBrowseFurniture,
  onMessageProject,
  initialTrackingId,
  onTrackingDeepLinkHandled,
  onReferenceImageUpload
}) {
  const [drawingPreview, setDrawingPreview] = useState(null);
  const [drawingDownloadState, setDrawingDownloadState] = useState({ status: "", message: "" });
  const [actionSheet, setActionSheet] = useState(null);
  const [trackingSheet, setTrackingSheet] = useState(null);
  const [actionQuestionCursor, setActionQuestionCursor] = useState(0);
  const [secondaryPanel, setSecondaryPanel] = useState("");
  const [referenceCandidate, setReferenceCandidate] = useState(null);
  const [referenceUploadStates, setReferenceUploadStates] = useState({});
  const referenceFileInputRef = useRef(null);
  const referenceTargetRef = useRef(null);
  const projectItems = useMemo(() => getProjectItems(project), [project]);
  const projectStage = getProjectStage(project);
  const status = getProjectStatus(project, lang);
  const totalPieces = project.jobs.reduce((total, job) => total + getJobQuantity(job), 0);
  const actionMap = useMemo(() => {
    const projectEntries = [];
    const itemEntries = new Map();

    project.jobs.filter(isActionNeeded).forEach((job) => {
      const jobItems = projectItems.filter(({ job: itemJob }) => String(itemJob.id) === String(job.id));
      getActionQuestions(job, lang).forEach((question, questionIndex) => {
        const scoredMatches = jobItems
          .map((candidate) => ({ candidate, score: getQuestionItemMatchScore(question, candidate.item) }))
          .filter(({ score }) => score > 0)
          .sort((left, right) => right.score - left.score);
        const matches =
          scoredMatches.length > 0 && (scoredMatches.length === 1 || scoredMatches[0].score > scoredMatches[1].score)
            ? [scoredMatches[0].candidate]
            : [];
        const entry = { job, question, questionIndex };

        if (matches.length === 1) {
          const key = `${job.id}-${matches[0].item.id}`;
          itemEntries.set(key, [...(itemEntries.get(key) || []), entry]);
        } else {
          projectEntries.push(entry);
        }
      });
    });

    return {
      projectEntries,
      itemEntries,
      total: projectEntries.length + [...itemEntries.values()].reduce((sum, entries) => sum + entries.length, 0)
    };
  }, [lang, project.jobs, projectItems]);
  const actionCount = actionMap.total;
  const deliveryDate = getProjectDeliveryDate(project);
  const productionUpdates = getProgressRows(project, "productionUpdates");
  const inspections = getProgressRows(project, "inspections");
  const shipments = getProgressRows(project, "shipments");
  const handovers = getProgressRows(project, "handovers");
  const projectFiles = getProgressRows(project, "projectFiles");
  const shipmentDocuments = getProgressRows(project, "shipmentDocuments");
  const progressSteps =
    lang === "Cn" ? ["需求", "规格", "制造", "质检", "交付"] : ["Brief", "Specify", "Make", "Inspect", "Deliver"];

  const documents = uniqueRows([
    ...project.jobs
      .filter((job) => job.fileName)
      .map((job) => ({
        id: `client-${job.id}`,
        type: "CLIENT",
        name: job.fileName,
        url: job.previewUrl,
        detail: copy(lang, "客户提交附件", "Client submission")
      })),
    ...projectFiles.map((file) => ({
      id: file.id,
      type: String(file.file_group || file.stage_id || "FILE").slice(0, 8),
      name: file.file_name || copy(lang, "项目文件", "Project file"),
      url: file.file_url || "",
      detail: [file.stage_id, file.file_group].filter(Boolean).join(" · ") || copy(lang, "已共享", "Shared")
    })),
    ...shipmentDocuments.map((file) => ({
      id: file.id,
      type: String(file.document_type || "DOC").slice(0, 8),
      name: file.document_name || file.document_type || copy(lang, "交付文件", "Delivery document"),
      url: file.file_url || "",
      detail: [file.status, file.version].filter(Boolean).join(" · ") || copy(lang, "已登记", "Recorded")
    }))
  ]);

  const firstCreatedAt = [...project.jobs]
    .map((job) => job.createdAt)
    .filter(Boolean)
    .sort()[0];
  const latestProduction = productionUpdates[0];
  const latestInspection = inspections[0];
  const latestShipment = shipments[0];
  const latestHandover = handovers[0];
  const timeline = [
    {
      title: copy(lang, "需求已接收", "Brief received"),
      detail: formatDate(firstCreatedAt, lang),
      stage: 0
    },
    {
      title: copy(lang, "规格与报价确认", "Specification confirmation"),
      detail:
        projectStage >= 1
          ? copy(lang, "已进入审核流程", "Review workflow active")
          : copy(lang, "尚未开始", "Not started"),
      stage: 1
    },
    {
      title: latestProduction?.process_name || copy(lang, "制造排期", "Production"),
      detail: latestProduction
        ? `${latestProduction.status || copy(lang, "已更新", "Updated")} · ${Number(latestProduction.progress_percent || 0)}%`
        : projectStage >= 2
          ? copy(lang, "制造记录已开启", "Production record opened")
          : copy(lang, "等待规格确认", "Awaiting specification confirmation"),
      stage: 2
    },
    {
      title: latestInspection?.work_package || copy(lang, "质检与合规", "Inspection & compliance"),
      detail: latestInspection
        ? `${latestInspection.status || copy(lang, "已登记", "Recorded")} · ${formatDate(latestInspection.inspected_at || latestInspection.created_at, lang)}`
        : copy(lang, "等待制造完成", "Awaiting production completion"),
      stage: 3
    },
    {
      title: latestHandover ? copy(lang, "现场交付", "Site handover") : copy(lang, "运输与交付", "Shipping & delivery"),
      detail: latestHandover
        ? `${latestHandover.status || copy(lang, "已登记", "Recorded")} · ${formatDate(latestHandover.signed_at || latestHandover.created_at, lang)}`
        : latestShipment
          ? `${latestShipment.status || copy(lang, "运输中", "In transit")} · ${formatDate(latestShipment.eta, lang)}`
          : deliveryDate
            ? `${copy(lang, "目标", "Target")} ${formatDate(deliveryDate, lang)}`
            : copy(lang, "日期待确认", "Date pending"),
      stage: 4
    }
  ];

  const openActionSheet = (nextSheet) => {
    setActionQuestionCursor(0);
    setActionSheet(nextSheet);
  };

  const referenceState = (itemKey) => referenceUploadStates[itemKey] || { status: "", message: "" };

  const setReferenceState = (itemKey, nextState) => {
    setReferenceUploadStates((current) => ({ ...current, [itemKey]: nextState }));
  };

  const prepareReferenceCandidate = (target, file) => {
    if (!target || !file) return;
    const extension = String(file.name || "")
      .split(".")
      .pop()
      .toLowerCase();
    const validType =
      ["image/jpeg", "image/png", "image/webp"].includes(String(file.type || "").toLowerCase()) ||
      ["jpg", "jpeg", "png", "webp"].includes(extension);
    if (!validType || Number(file.size || 0) > 12 * 1024 * 1024) {
      setReferenceState(target.itemKey, {
        status: "error",
        message: copy(
          lang,
          "请选择不超过 12MB 的 JPG、PNG 或 WebP 图片。",
          "Choose a JPG, PNG or WebP image under 12MB."
        )
      });
      return;
    }
    setReferenceCandidate({
      ...target,
      file,
      previewUrl: URL.createObjectURL(file)
    });
    setReferenceState(target.itemKey, { status: "ready", message: "" });
  };

  const chooseReferenceImage = (target) => {
    referenceTargetRef.current = target;
    if (referenceFileInputRef.current) {
      referenceFileInputRef.current.value = "";
      referenceFileInputRef.current.click();
    }
  };

  const closeReferenceUpload = () => {
    if (referenceCandidate && referenceState(referenceCandidate.itemKey).status === "uploading") return;
    setReferenceCandidate(null);
  };

  const confirmReferenceImage = async () => {
    if (!referenceCandidate || !onReferenceImageUpload) return;
    const { itemKey, job, item, itemIndex, sku, file } = referenceCandidate;
    setReferenceState(itemKey, {
      status: "uploading",
      message: copy(lang, "正在保存照片并加入 drawing 队列…", "Saving the photo and queueing its drawing…")
    });
    try {
      await onReferenceImageUpload({
        jobId: job.id,
        itemIndex,
        itemRef: item.itemRef,
        sku,
        file
      });
      setReferenceCandidate(null);
      setReferenceState(itemKey, {
        status: "queued",
        message: copy(lang, "参考照片已添加，drawing 已排队。", "Reference added. Drawing queued.")
      });
    } catch (error) {
      setReferenceState(itemKey, {
        status: "error",
        message: error.message || copy(lang, "照片补录失败，请重试。", "The reference image could not be added.")
      });
    }
  };

  useEffect(
    () => () => {
      if (referenceCandidate?.previewUrl) URL.revokeObjectURL(referenceCandidate.previewUrl);
    },
    [referenceCandidate?.previewUrl]
  );

  const handleDownloadDrawing = async () => {
    if (!drawingPreview || drawingDownloadState.status === "downloading") return;
    setDrawingDownloadState({
      status: "downloading",
      message: copy(lang, "正在准备带追踪二维码的三视图…", "Preparing the three-view with tracking QR…")
    });

    let sourceObjectUrl = "";
    let qrObjectUrl = "";
    try {
      const response = await window.fetch(drawingPreview.url);
      if (!response.ok) throw new Error(`Drawing download failed (${response.status}).`);
      const sourceBlob = await response.blob();
      const filename = `${safeDownloadName(`${drawingPreview.sku}-${drawingPreview.itemName}`)}-three-view.png`;

      if (drawingPreview.drawing.trackingEmbedded) {
        triggerBlobDownload(sourceBlob, filename);
      } else {
        const qrElement = document.getElementById(getDrawingQrElementId(drawingPreview.trackingId));
        if (!qrElement) throw new Error("The tracking QR code is not ready yet.");

        sourceObjectUrl = URL.createObjectURL(sourceBlob);
        const sourceImage = await loadBrowserImage(sourceObjectUrl);
        const qrMarkup = new window.XMLSerializer().serializeToString(qrElement);
        qrObjectUrl = URL.createObjectURL(new window.Blob([qrMarkup], { type: "image/svg+xml;charset=utf-8" }));
        const qrImage = await loadBrowserImage(qrObjectUrl);
        const usesCurrentSheetLayout = drawingPreview.drawing.promptVersion === "three-view-v1";
        const sourceWidth = sourceImage.naturalWidth || sourceImage.width;
        const sourceHeight = sourceImage.naturalHeight || sourceImage.height;
        const exportScale = Math.max(1, 2000 / sourceWidth);
        const exportWidth = Math.round(sourceWidth * exportScale);
        const exportHeight = Math.round(sourceHeight * exportScale);
        const legacyStripHeight = usesCurrentSheetLayout ? 0 : Math.round(exportWidth * 0.113);
        const canvas = document.createElement("canvas");
        canvas.width = exportWidth;
        canvas.height = exportHeight + legacyStripHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas export is not supported in this browser.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(sourceImage, 0, 0, exportWidth, exportHeight);

        if (usesCurrentSheetLayout) {
          drawTrackingPanel(context, {
            x: exportWidth * (1470 / 2000),
            y: exportHeight * (754 / 1300),
            width: exportWidth * (470 / 2000),
            height: exportHeight * (226 / 1300),
            qrImage,
            sku: drawingPreview.sku,
            trackingId: drawingPreview.trackingId
          });
        } else {
          drawTrackingPanel(context, {
            x: 0,
            y: exportHeight,
            width: exportWidth,
            height: legacyStripHeight,
            qrImage,
            sku: drawingPreview.sku,
            trackingId: drawingPreview.trackingId,
            legacy: true
          });
        }

        const downloadBlob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("The drawing export could not be created."))),
            "image/png",
            1
          );
        });
        triggerBlobDownload(downloadBlob, filename);
      }

      setDrawingDownloadState({
        status: "success",
        message: copy(lang, "三视图已下载到本地。", "Three-view downloaded to your computer.")
      });
    } catch (error) {
      setDrawingDownloadState({
        status: "error",
        message: error.message || copy(lang, "三视图下载失败，请稍后重试。", "Download failed. Please try again.")
      });
    } finally {
      if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
      if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl);
    }
  };

  useEffect(() => {
    if (!drawingPreview) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setDrawingPreview(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawingPreview]);

  useEffect(() => {
    setDrawingDownloadState({ status: "", message: "" });
  }, [drawingPreview?.url]);

  useEffect(() => {
    if (!actionSheet) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActionSheet(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionSheet]);

  useEffect(() => {
    if (!initialTrackingId) return;
    const match = projectItems.find(
      ({ job, item }) => getItemTrackingId(project, job, item) === String(initialTrackingId).toUpperCase()
    );
    if (match) setTrackingSheet(match);
    onTrackingDeepLinkHandled?.();
  }, [initialTrackingId, onTrackingDeepLinkHandled, project, projectItems]);

  useEffect(() => {
    if (!trackingSheet) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setTrackingSheet(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [trackingSheet]);

  return (
    <main className="cho-project-page" aria-labelledby="cho-project-title">
      <div className="cho-client-wrap">
        <nav className="cho-project-breadcrumb" aria-label={copy(lang, "面包屑导航", "Breadcrumb")}>
          <button type="button" onClick={onBack}>
            {copy(lang, "项目工作室", "Studio")}
          </button>
          <span>/</span>
          <button type="button" onClick={onBack}>
            {copy(lang, "项目", "Projects")}
          </button>
          <span>/</span>
          <strong>{project.projectName}</strong>
        </nav>

        <header className="cho-project-hero">
          <i className="fa-solid fa-plus cho-project-corner left" aria-hidden="true"></i>
          <i className="fa-solid fa-plus cho-project-corner right" aria-hidden="true"></i>
          <div className="cho-project-title-row">
            <div className="cho-project-title-copy">
              <h1 id="cho-project-title">{project.projectName}</h1>
              <p>
                {[
                  project.destination || copy(lang, "交付地点待确认", "Destination pending"),
                  `${project.jobs.length} ${copy(lang, "个订单", project.jobs.length === 1 ? "order" : "orders")}`,
                  clientName || copy(lang, "Crafton 客户", "Crafton client"),
                  project.projectId ? `#${String(project.projectId).slice(0, 8).toUpperCase()}` : ""
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <section className="cho-project-kpis" aria-label={copy(lang, "项目指标", "Project metrics")}>
              {[
                [totalPieces, copy(lang, "家具件数", "Pieces")],
                [project.jobs.length, copy(lang, "订单", "Orders")],
                [projectItems.length, copy(lang, "家具明细", "Furniture lines")],
                [actionCount, copy(lang, "待您确认", "Action needed")]
              ].map(([value, label]) => (
                <article className="cho-project-kpi" key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </article>
              ))}
            </section>
          </div>
          <div className="cho-project-hero-actions">
            {actionMap.projectEntries.length > 0 && (
              <button
                type="button"
                className="cho-project-context-action"
                onClick={() =>
                  openActionSheet({
                    scope: "project",
                    entries: actionMap.projectEntries
                  })
                }
              >
                <span>{copy(lang, "项目确认", "Project action")}</span>
                <small>{actionMap.projectEntries.length}</small>
              </button>
            )}
            <span className={`cho-project-status-pill tone-${status.tone}`}>{status.label}</span>
          </div>
        </header>

        <section className="cho-project-card cho-project-stage-card">
          <div className="cho-project-card-label">{copy(lang, "项目阶段", "PROJECT STAGE")}</div>
          <div className="cho-project-stage-bars" aria-label={`${status.label}: ${projectStage + 1} / 5`}>
            {progressSteps.map((step, index) => (
              <div className={index < projectStage ? "complete" : index === projectStage ? "current" : ""} key={step}>
                <span></span>
                <strong>{step}</strong>
                <small>{timeline[index].detail}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="cho-project-card cho-project-line-items">
          <div className="cho-project-line-items-heading">
            <div className="cho-project-card-label">
              {copy(lang, `家具明细 · ${projectItems.length} 项`, `LINE ITEMS · ${projectItems.length}`)}
            </div>
            {actionCount > 0 && (
              <span className="cho-project-line-action-count">
                {actionCount} {copy(lang, "项待处理", actionCount === 1 ? "action" : "actions")}
              </span>
            )}
          </div>
          <div className="cho-project-table" role="table">
            <div className="cho-project-table-head" role="row">
              <span role="columnheader">{copy(lang, "产品", "Item")}</span>
              <span role="columnheader">{copy(lang, "数量", "Qty")}</span>
              <span role="columnheader">{copy(lang, "规格", "Specification")}</span>
              <span role="columnheader">{copy(lang, "三视图", "Drawing")}</span>
              <span role="columnheader">{copy(lang, "阶段", "Stage")}</span>
              <span role="columnheader">{copy(lang, "操作", "Action")}</span>
            </div>
            {projectItems.map(({ job, item }) => {
              const itemKey = `${job.id}-${item.id}`;
              const itemIndex = job.items.indexOf(item);
              const itemActions = actionMap.itemEntries.get(itemKey) || [];
              const itemName = lang === "Cn" ? item.typeCn : item.typeEn;
              const itemSku = getItemSku(project, job, item);
              const itemStatus = getOrderStatus(job, lang);
              const material = lang === "Cn" ? item.materialCn : item.materialEn;
              const drawing = item.technicalDrawing || {};
              const drawingUrl = getItemDrawingUrl(item);
              const supplierDrawingRevisions = getSupplierDrawingRevisions(project, job, item);
              const approvedSupplierDrawing = supplierDrawingRevisions.find(
                (file) => file.payload?.review_status === "approved"
              );
              const drawingIsFormal = Boolean(approvedSupplierDrawing) || isManufacturingDrawing(drawing);
              return (
                <div
                  className={`cho-project-table-row${itemActions.length ? " has-action" : ""}`}
                  role="row"
                  key={itemKey}
                >
                  <div className="cho-project-item" role="cell" data-label={copy(lang, "产品", "Item")}>
                    <ItemReferenceImageControl
                      lang={lang}
                      src={item.imageUrl || job.previewUrl}
                      alt={itemName}
                      state={referenceState(itemKey)}
                      disabled={drawingIsFormal}
                      onChoose={() => chooseReferenceImage({ itemKey, job, item, itemIndex, sku: itemSku })}
                      onCandidate={(file) =>
                        prepareReferenceCandidate({ itemKey, job, item, itemIndex, sku: itemSku }, file)
                      }
                    />
                    <span className="cho-project-item-copy">
                      <strong>{itemName}</strong>
                      <small>
                        {[item.fabricCode, item.color, item.finish].filter(Boolean).join(" · ") ||
                          copy(lang, "规格整理中", "Specification in review")}
                      </small>
                      <span className="cho-project-item-identity">
                        <code>{itemSku}</code>
                        <button
                          type="button"
                          onClick={() => setTrackingSheet({ job, item })}
                          aria-label={`${copy(lang, "打开二维码追踪", "Open QR tracking for")} ${itemName}`}
                        >
                          <i className="fa-solid fa-qrcode" aria-hidden="true"></i>
                          {copy(lang, "追踪", "Track")}
                        </button>
                      </span>
                    </span>
                  </div>
                  <span className="cho-project-mono" role="cell" data-label={copy(lang, "数量", "Qty")}>
                    {item.qtyDisplay || item.qty || job.quantityText || "-"}
                  </span>
                  <span role="cell" data-label={copy(lang, "规格", "Specification")}>
                    <strong>{material || copy(lang, "待确认", "To confirm")}</strong>
                    <small>
                      {item.dimensionsText || job.dimensions || copy(lang, "尺寸待确认", "Dimensions pending")}
                    </small>
                  </span>
                  <div className="cho-project-drawing-cell" role="cell" data-label={copy(lang, "三视图", "Drawing")}>
                    {approvedSupplierDrawing?.file_url ? (
                      <a
                        className="cho-project-drawing-thumb is-supplier"
                        href={approvedSupplierDrawing.file_url}
                        target="_blank"
                        rel="noreferrer"
                        title={copy(lang, "打开已批准的供应商施工图", "Open approved supplier shop drawing")}
                      >
                        {isDrawingPreviewImage(approvedSupplierDrawing) ? (
                          <img src={approvedSupplierDrawing.file_url} alt="" aria-hidden="true" />
                        ) : (
                          <i className="fa-regular fa-file-lines" aria-hidden="true"></i>
                        )}
                        <span>
                          {approvedSupplierDrawing.payload?.revision || "R--"} ·{" "}
                          {copy(lang, "生产批准", "MFG APPROVED")}
                        </span>
                      </a>
                    ) : drawingUrl ? (
                      <button
                        type="button"
                        className="cho-project-drawing-thumb"
                        onClick={() => {
                          const trackingId = getItemTrackingId(project, job, item);
                          setDrawingPreview({
                            url: drawingUrl,
                            itemName,
                            drawing,
                            sku: itemSku,
                            trackingId,
                            trackingUrl: getItemTrackingUrl(trackingId, item)
                          });
                        }}
                        title={copy(lang, "打开家具三视图", "Open furniture three-view")}
                      >
                        <img src={drawingUrl} alt="" aria-hidden="true" />
                        <span>
                          {drawingIsFormal ? copy(lang, "正式图纸", "Formal") : copy(lang, "AI 概念参考", "AI concept")}
                        </span>
                      </button>
                    ) : (
                      <span className={`cho-project-drawing-pending status-${drawing.status || "pending"}`}>
                        {drawing.status === "generating"
                          ? copy(lang, "生成中", "Generating")
                          : drawing.status === "generation_failed"
                            ? copy(lang, "等待重试", "Retry queued")
                            : copy(lang, "待生成", "Pending")}
                      </span>
                    )}
                  </div>
                  <span role="cell" data-label={copy(lang, "阶段", "Stage")}>
                    <span className={`cho-project-stage-tag stage-${getOrderStage(job)}`}>
                      {progressSteps[getOrderStage(job)]}
                    </span>
                    <small className="cho-project-stage-date">
                      {job.desiredDeliveryDate
                        ? formatDate(job.desiredDeliveryDate, lang)
                        : copy(lang, "日期待确认", "Date pending")}
                    </small>
                  </span>
                  <span className="cho-project-row-action" role="cell" data-label={copy(lang, "操作", "Action")}>
                    {itemActions.length ? (
                      <button
                        type="button"
                        onClick={() =>
                          openActionSheet({
                            scope: "item",
                            item,
                            entries: itemActions
                          })
                        }
                      >
                        {copy(lang, "待处理", "Need action")} · {itemActions.length}
                      </button>
                    ) : (
                      <span className={`cho-project-row-status tone-${itemStatus.tone}`}>{itemStatus.label}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section
          className="cho-project-secondary-disclosures"
          aria-label={copy(lang, "项目次要资料", "Project details")}
        >
          <button
            type="button"
            className={secondaryPanel === "documents" ? "active" : ""}
            onClick={() => setSecondaryPanel((current) => (current === "documents" ? "" : "documents"))}
            aria-expanded={secondaryPanel === "documents"}
          >
            <span>{copy(lang, "项目文件", "Documents")}</span>
            <small>{documents.length}</small>
            <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
          </button>
          {secondaryPanel === "documents" && (
            <div className="cho-project-secondary-panel cho-project-documents">
              {documents.length ? (
                documents.map((document) => {
                  const content = (
                    <>
                      <span className="cho-project-document-type">{document.type}</span>
                      <span>
                        <strong>{document.name}</strong>
                        <small>{document.detail}</small>
                      </span>
                    </>
                  );
                  return document.url ? (
                    <a href={document.url} target="_blank" rel="noreferrer" key={document.id}>
                      {content}
                    </a>
                  ) : (
                    <div key={document.id}>{content}</div>
                  );
                })
              ) : (
                <p className="cho-project-empty-note">
                  {copy(lang, "尚未共享项目文件。", "No project documents have been shared yet.")}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            className={secondaryPanel === "timeline" ? "active" : ""}
            onClick={() => setSecondaryPanel((current) => (current === "timeline" ? "" : "timeline"))}
            aria-expanded={secondaryPanel === "timeline"}
          >
            <span>{copy(lang, "项目时间线", "Project timeline")}</span>
            <small>{timeline.length}</small>
            <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
          </button>
          {secondaryPanel === "timeline" && (
            <div className="cho-project-secondary-panel cho-project-timeline">
              {timeline.map((entry) => (
                <article
                  className={
                    entry.stage < projectStage ? "complete" : entry.stage === projectStage ? "current" : "upcoming"
                  }
                  key={entry.title}
                >
                  <span aria-hidden="true"></span>
                  <div>
                    <strong>{entry.title}</strong>
                    <small>{entry.detail}</small>
                  </div>
                </article>
              ))}
            </div>
          )}

          <button
            type="button"
            className={secondaryPanel === "contact" ? "active" : ""}
            onClick={() => setSecondaryPanel((current) => (current === "contact" ? "" : "contact"))}
            aria-expanded={secondaryPanel === "contact"}
          >
            <span>{copy(lang, "项目联系人", "Project contact")}</span>
            <small>1</small>
            <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
          </button>
          {secondaryPanel === "contact" && (
            <div className="cho-project-secondary-panel cho-project-manager">
              <div className="cho-project-manager-person">
                <span>CP</span>
                <div>
                  <strong>{copy(lang, "Crafton 项目团队", "Crafton Project Team")}</strong>
                  <small>{copy(lang, "深圳 · 客户项目服务", "Shenzhen · Client projects")}</small>
                </div>
              </div>
              <p>
                {copy(
                  lang,
                  "交期、样品、合规或运输方面的问题，将由同一项目团队持续跟进。",
                  "Questions about lead time, samples, compliance or shipping stay with one project team from brief to delivery."
                )}
              </p>
              <button type="button" className="cho-client-button secondary" onClick={onMessageProject}>
                {copy(lang, "联系项目团队", "Message project team")}
              </button>
            </div>
          )}
        </section>

        <div className="cho-project-page-actions">
          <button type="button" className="cho-client-button primary" onClick={onBrowseFurniture}>
            {copy(lang, "添加更多家具", "Add more pieces")}
          </button>
          <button type="button" className="cho-client-button secondary" onClick={onBack}>
            {copy(lang, "返回项目工作室", "Back to Studio")}
          </button>
        </div>
      </div>
      {drawingPreview &&
        createPortal(
          <div
            className="cho-drawing-lightbox"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDrawingPreview(null);
            }}
          >
            <section
              className="cho-drawing-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cho-drawing-dialog-title"
            >
              <header>
                <div>
                  <span className="cho-client-kicker">
                    {isManufacturingDrawing(drawingPreview.drawing)
                      ? copy(lang, "供应商施工图 · 已批准生产", "SUPPLIER SHOP DRAWING · APPROVED FOR MANUFACTURE")
                      : copy(lang, "AI 概念视图 · 仅供参考", "AI CONCEPT VIEW · REFERENCE ONLY")}
                  </span>
                  <h2 id="cho-drawing-dialog-title">{drawingPreview.itemName}</h2>
                </div>
                <button
                  type="button"
                  className="cho-drawing-close"
                  onClick={() => setDrawingPreview(null)}
                  aria-label={copy(lang, "关闭大图", "Close drawing")}
                  title={copy(lang, "关闭", "Close")}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
              </header>
              <div className="cho-drawing-canvas">
                <div className="cho-drawing-sheet">
                  <img src={drawingPreview.url} alt={`${drawingPreview.itemName} three-view`} />
                  {!drawingPreview.drawing.trackingEmbedded && (
                    <DrawingTrackingPanel
                      lang={lang}
                      preview={drawingPreview}
                      legacy={drawingPreview.drawing.promptVersion !== "three-view-v1"}
                    />
                  )}
                </div>
              </div>
              <footer>
                <div className="cho-drawing-footer-copy">
                  <p>
                    {isManufacturingDrawing(drawingPreview.drawing)
                      ? copy(
                          lang,
                          "该供应商施工图已经技术审核，可用于生产。",
                          "This supplier shop drawing has passed technical review and is approved for manufacture."
                        )
                      : copy(
                          lang,
                          "此为 AI 根据客户 FF&E 图片与尺寸生成的概念参考，只用于沟通外观，不能用于开料或生产。选定供应商后，将由供应商 CAD／施工图新版本取代。",
                          "This AI concept was generated from submitted FF&E images and dimensions for visual communication only. It must not be used for manufacture; an approved supplier CAD/shop-drawing revision will replace it after supplier appointment."
                        )}
                  </p>
                  <span className={`cho-drawing-download-status is-${drawingDownloadState.status}`} aria-live="polite">
                    {drawingDownloadState.message}
                  </span>
                </div>
                <div className="cho-drawing-footer-actions">
                  <button
                    type="button"
                    className="cho-client-button primary"
                    onClick={handleDownloadDrawing}
                    disabled={drawingDownloadState.status === "downloading"}
                  >
                    <i className="fa-solid fa-download" aria-hidden="true"></i>
                    {drawingDownloadState.status === "downloading"
                      ? copy(lang, "准备中…", "Preparing…")
                      : copy(lang, "下载三视图", "Download drawing")}
                  </button>
                  <a href={drawingPreview.url} target="_blank" rel="noreferrer" className="cho-client-button secondary">
                    {copy(lang, "在新窗口打开", "Open full size")}
                  </a>
                </div>
              </footer>
            </section>
          </div>,
          document.body
        )}
      {actionSheet &&
        createPortal(
          <ProjectActionSheet
            lang={lang}
            project={project}
            sheet={actionSheet}
            questionCursor={actionQuestionCursor}
            answerDrafts={answerDrafts}
            answerStates={answerStates}
            onQuestionCursorChange={setActionQuestionCursor}
            onAnswerChange={onAnswerChange}
            onAnswerInput={onAnswerInput}
            onSubmitAnswers={onSubmitAnswers}
            onClose={() => setActionSheet(null)}
          />,
          document.body
        )}
      {trackingSheet &&
        createPortal(
          <ItemTrackingSheet
            lang={lang}
            project={project}
            job={trackingSheet.job}
            item={trackingSheet.item}
            onOpenDrawing={(preview) => {
              setTrackingSheet(null);
              setDrawingPreview(preview);
            }}
            onClose={() => setTrackingSheet(null)}
          />,
          document.body
        )}
      <input
        ref={referenceFileInputRef}
        className="cho-reference-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(event) => prepareReferenceCandidate(referenceTargetRef.current, event.target.files?.[0])}
        tabIndex={-1}
        aria-hidden="true"
      />
      {referenceCandidate &&
        createPortal(
          <ReferenceImageUploadSheet
            lang={lang}
            candidate={referenceCandidate}
            state={referenceState(referenceCandidate.itemKey)}
            onChooseAnother={() => chooseReferenceImage(referenceCandidate)}
            onConfirm={confirmReferenceImage}
            onClose={closeReferenceUpload}
          />,
          document.body
        )}
    </main>
  );
}

function ClientOrderDashboard({
  lang,
  clientName,
  projectGroups,
  answerDrafts,
  answerStates,
  loading = false,
  onAnswerChange,
  onAnswerInput,
  onSubmitAnswers,
  onNewOrder,
  onBrowseFurniture,
  onMessageProject,
  onReferenceImageUpload
}) {
  const [projectPageKey, setProjectPageKey] = useState("");
  const [deepLinkTrackingId, setDeepLinkTrackingId] = useState("");

  useEffect(() => {
    if (projectPageKey && !projectGroups.some((project) => String(project.key) === String(projectPageKey))) {
      setProjectPageKey("");
    }
  }, [projectGroups, projectPageKey]);

  useEffect(() => {
    if (!projectGroups.length || typeof window === "undefined") return;
    const params = new window.URLSearchParams(window.location.search);
    const trackingId = params.get("view") === "item-tracking" ? params.get("tracking") : "";
    if (!trackingId) return;

    const targetProject = projectGroups.find((project) =>
      getProjectItems(project).some(
        ({ job, item }) => getItemTrackingId(project, job, item) === String(trackingId).toUpperCase()
      )
    );
    if (!targetProject) return;
    setProjectPageKey(targetProject.key);
    setDeepLinkTrackingId(String(trackingId).toUpperCase());
  }, [projectGroups]);

  const dashboardData = useMemo(() => {
    const jobs = projectGroups.flatMap((project) => project.jobs);
    const totalOrders = jobs.length;
    const totalPieces = jobs.reduce((total, job) => total + getJobQuantity(job), 0);
    const productionPieces = jobs.reduce(
      (total, job) => total + ([2, 3].includes(getOrderStage(job)) ? getJobQuantity(job) : 0),
      0
    );
    const actionCount = jobs.filter(isActionNeeded).length;
    const furnitureRows = projectGroups.flatMap((project) =>
      getProjectItems(project).map(({ job, item }) => ({ project, job, item }))
    );
    const updates = jobs
      .flatMap((job) => {
        const status = getOrderStatus(job, lang);
        const questions = isActionNeeded(job)
          ? (job.questions.length
              ? job.questions
              : [
                  job.reviewNotes ||
                    copy(lang, "请补充缺少的规格资料。", "Please provide the missing specification details.")
                ]
            ).map((question, index) => ({
              id: `${job.id}-question-${index}`,
              job,
              title: question,
              detail: copy(lang, "需要您的回复", "Reply requested"),
              action: true
            }))
          : [];
        return [
          ...questions,
          {
            id: `${job.id}-status`,
            job,
            title: `${job.projectName}: ${status.label}`,
            detail: `${formatDate(job.createdAt, lang)} · ${getStageDetail(job, lang)}`,
            action: false
          }
        ];
      })
      .slice(0, 8);
    return { totalOrders, totalPieces, productionPieces, actionCount, furnitureRows, updates };
  }, [lang, projectGroups]);

  const projectPage = projectGroups.find((project) => String(project.key) === String(projectPageKey));
  const firstName = String(clientName || "")
    .trim()
    .split(/\s+/)[0];
  const greetingName = firstName || copy(lang, "客户", "there");
  const progressSteps =
    lang === "Cn" ? ["需求", "规格", "制造", "质检", "交付"] : ["Brief", "Specify", "Make", "Inspect", "Deliver"];

  const openProjectPage = (projectKey) => {
    setProjectPageKey(projectKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (projectPage) {
    return (
      <ClientProjectDetail
        lang={lang}
        clientName={clientName}
        project={projectPage}
        answerDrafts={answerDrafts}
        answerStates={answerStates}
        onAnswerChange={onAnswerChange}
        onAnswerInput={onAnswerInput}
        onSubmitAnswers={onSubmitAnswers}
        onBack={() => {
          setProjectPageKey("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onBrowseFurniture={onBrowseFurniture}
        onMessageProject={onMessageProject || onNewOrder}
        initialTrackingId={deepLinkTrackingId}
        onTrackingDeepLinkHandled={() => {
          setDeepLinkTrackingId("");
          const url = new URL(window.location.href);
          url.searchParams.delete("view");
          url.searchParams.delete("tracking");
          window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }}
        onReferenceImageUpload={onReferenceImageUpload}
      />
    );
  }

  return (
    <main className="cho-client-studio" aria-labelledby="cho-client-dashboard-title">
      <div className="cho-client-wrap">
        <header className="cho-client-hero">
          <div>
            <span className="cho-client-kicker">{copy(lang, "客户项目工作室", "CLIENT PROJECT STUDIO")}</span>
            <h1 id="cho-client-dashboard-title">
              {lang === "Cn" ? (
                <>
                  {greetingName}，<em>欢迎回来。</em>
                </>
              ) : (
                <>
                  Welcome back, <em>{greetingName}.</em>
                </>
              )}
            </h1>
            <p>
              {copy(
                lang,
                "在一个清晰的工作台中查看项目、待确认事项与真实制造进度。",
                "Projects, decisions and verified production updates in one considered workspace."
              )}
            </p>
          </div>
          <div className="cho-client-hero-actions">
            <button type="button" className="cho-client-button secondary" onClick={onBrowseFurniture}>
              {copy(lang, "浏览 Set Furniture", "Browse Set Furniture")}
            </button>
            <button type="button" className="cho-client-button primary" onClick={onNewOrder}>
              <span aria-hidden="true">+</span>
              {copy(lang, "新建项目", "New project")}
            </button>
          </div>
        </header>

        <section className="cho-client-kpis" aria-label={copy(lang, "项目概览", "Project overview")}>
          {[
            [
              projectGroups.length,
              copy(lang, "进行中的项目", "Active projects"),
              copy(lang, "按项目归类", "Grouped by project")
            ],
            [
              dashboardData.totalOrders,
              copy(lang, "订单", "Orders"),
              copy(lang, "全部订单记录", "All recorded orders")
            ],
            [
              dashboardData.productionPieces,
              copy(lang, "制造中的家具", "Pieces in production"),
              copy(lang, `共 ${dashboardData.totalPieces} 件已登记`, `${dashboardData.totalPieces} pieces recorded`)
            ],
            [
              dashboardData.actionCount,
              copy(lang, "需要您处理", "Action needed"),
              dashboardData.actionCount
                ? copy(lang, "请查看待确认事项", "Review requested details")
                : copy(lang, "目前无需操作", "Nothing pending")
            ]
          ].map(([value, label, note], index) => (
            <article className={`cho-client-kpi ${index === 3 && value > 0 ? "needs-action" : ""}`} key={label}>
              <span className="cho-client-kpi-index">0{index + 1}</span>
              <strong>{loading ? "–" : value}</strong>
              <h2>{label}</h2>
              <p>{loading ? copy(lang, "正在读取项目…", "Loading projects…") : note}</p>
            </article>
          ))}
        </section>

        {loading ? (
          <section className="cho-client-loading" role="status" aria-live="polite">
            <span className="cho-client-kicker">{copy(lang, "安全同步中", "SECURE SYNC")}</span>
            <h2>{copy(lang, "正在读取您的项目记录", "Loading your project workspace")}</h2>
            <p>
              {copy(
                lang,
                "项目与附件会在验证账号权限后显示。",
                "Projects and attachments appear after account access is verified."
              )}
            </p>
          </section>
        ) : projectGroups.length === 0 ? (
          <section className="cho-client-empty" aria-labelledby="cho-client-empty-title">
            <div className="cho-client-empty-copy">
              <span className="cho-client-kicker">{copy(lang, "从这里开始", "BEGIN HERE")}</span>
              <h2 id="cho-client-empty-title">{copy(lang, "您的第一个 Crafton 项目", "Your first Crafton project")}</h2>
              <p>
                {copy(
                  lang,
                  "这个看板目前没有演示订单。您可以从 Set Furniture 选择成熟款式，或提交图纸、图片和需求资料开始定制项目。提交后，项目与真实进度会自动出现在这里。",
                  "This workspace contains no demonstration orders. Choose a proven Set Furniture piece or submit drawings, images and a brief. Your project and verified progress will then appear here."
                )}
              </p>
              <div className="cho-client-empty-actions">
                <button type="button" className="cho-client-button primary" onClick={onBrowseFurniture}>
                  {copy(lang, "选择 Set Furniture", "Choose Set Furniture")}
                </button>
                <button type="button" className="cho-client-button secondary" onClick={onNewOrder}>
                  {copy(lang, "提交定制需求", "Submit a custom brief")}
                </button>
              </div>
            </div>
            <div
              className="cho-client-empty-images"
              aria-label={copy(lang, "家具系列预览", "Furniture collection preview")}
            >
              <img src="/set-furniture/armchair.jpg" alt={copy(lang, "Crafton 扶手椅", "Crafton armchair")} />
              <img src="/set-furniture/dining-table.jpg" alt={copy(lang, "Crafton 餐桌", "Crafton dining table")} />
              <img src="/set-furniture/sofa.jpg" alt={copy(lang, "Crafton 沙发", "Crafton sofa")} />
            </div>
            <div className="cho-client-empty-steps">
              {[
                [
                  "01",
                  copy(lang, "选择或上传", "Choose or upload"),
                  copy(
                    lang,
                    "选择系列家具，或提交您的图纸与需求。",
                    "Select a collection piece or submit your own brief."
                  )
                ],
                [
                  "02",
                  copy(lang, "确认规格", "Confirm specifications"),
                  copy(
                    lang,
                    "与 Crafton 顾问确认材质、尺寸及合规要求。",
                    "Confirm material, dimensions and compliance with Crafton."
                  )
                ],
                [
                  "03",
                  copy(lang, "跟踪交付", "Track delivery"),
                  copy(
                    lang,
                    "从制造到交付，只显示已验证的真实进度。",
                    "Follow verified progress from manufacturing to delivery."
                  )
                ]
              ].map(([number, title, detail]) => (
                <article key={number}>
                  <span>{number}</span>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="cho-client-projects" aria-labelledby="cho-client-projects-title">
              <div className="cho-client-section-heading">
                <div>
                  <span className="cho-client-kicker">{copy(lang, "项目总览", "PROJECT OVERVIEW")}</span>
                  <h2 id="cho-client-projects-title">{copy(lang, "进行中的项目", "Active projects")}</h2>
                </div>
                <p>
                  {copy(
                    lang,
                    "选择项目打开完整订单与制造进度",
                    "Open a project for its complete order and production detail"
                  )}
                </p>
              </div>
              <div className="cho-client-project-grid">
                {projectGroups.map((project, projectIndex) => {
                  const image = getProjectImage(project);
                  const itemCount = getProjectItems(project).length;
                  const pieceCount = project.jobs.reduce((total, job) => total + getJobQuantity(job), 0);
                  const projectStatus = getProjectStatus(project, lang);
                  const stage = getProjectStage(project);
                  return (
                    <button
                      type="button"
                      className="cho-client-project-card"
                      onClick={() => openProjectPage(project.key)}
                      aria-label={`${copy(lang, "打开项目", "Open project")} ${project.projectName}`}
                      key={project.key}
                    >
                      <ProductImage src={image} alt={project.projectName} className="cho-client-project-image" />
                      <span className="cho-client-project-number">{String(projectIndex + 1).padStart(2, "0")}</span>
                      <div className="cho-client-project-copy">
                        <div className="cho-client-project-title-row">
                          <div>
                            <h3>{project.projectName || copy(lang, "项目名称待确认", "Project name pending")}</h3>
                            <p>{project.destination || copy(lang, "交付地点待确认", "Destination pending")}</p>
                          </div>
                          <span className={`cho-client-status tone-${projectStatus.tone}`}>{projectStatus.label}</span>
                        </div>
                        <div className="cho-client-project-meta">
                          <span>
                            {project.jobs.length} {copy(lang, "个订单", project.jobs.length === 1 ? "order" : "orders")}
                          </span>
                          <span>
                            {itemCount} {copy(lang, "项家具", itemCount === 1 ? "furniture line" : "furniture lines")}
                          </span>
                          <span>
                            {pieceCount} {copy(lang, "件", pieceCount === 1 ? "piece" : "pieces")}
                          </span>
                        </div>
                        <div
                          className="cho-client-project-progress"
                          aria-label={copy(lang, "项目进度", "Project progress")}
                        >
                          {progressSteps.map((step, stepIndex) => (
                            <span
                              className={stepIndex < stage ? "complete" : stepIndex === stage ? "current" : ""}
                              key={step}
                            >
                              <i></i>
                              <small>{step}</small>
                            </span>
                          ))}
                        </div>
                        <span className="cho-client-project-open">
                          {copy(lang, "查看项目", "View project")}{" "}
                          <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="cho-client-operations">
              <div className="cho-client-tracker">
                <div className="cho-client-section-heading compact">
                  <div>
                    <span className="cho-client-kicker">{copy(lang, "制造与交付", "PRODUCTION & DELIVERY")}</span>
                    <h2>{copy(lang, "家具进度", "Furniture tracker")}</h2>
                  </div>
                  <p>{copy(lang, "仅显示已记录的真实状态", "Verified status only")}</p>
                </div>
                <div className="cho-client-tracker-table" role="table">
                  <div className="cho-client-tracker-head" role="row">
                    <span role="columnheader">{copy(lang, "家具", "Furniture")}</span>
                    <span role="columnheader">{copy(lang, "项目", "Project")}</span>
                    <span role="columnheader">{copy(lang, "数量", "Qty")}</span>
                    <span role="columnheader">{copy(lang, "当前阶段", "Current stage")}</span>
                  </div>
                  {dashboardData.furnitureRows.map(({ project, job, item }) => {
                    const itemName = lang === "Cn" ? item.typeCn : item.typeEn;
                    const itemStatus = getOrderStatus(job, lang);
                    return (
                      <button
                        type="button"
                        className="cho-client-tracker-row"
                        role="row"
                        onClick={() => openProjectPage(project.key)}
                        key={`${job.id}-${item.id}`}
                      >
                        <span className="cho-client-tracker-product" role="cell">
                          <ProductImage src={item.imageUrl || job.previewUrl} alt={itemName} />
                          <strong>{itemName}</strong>
                        </span>
                        <span role="cell" data-label={copy(lang, "项目", "Project")}>
                          {project.projectName}
                        </span>
                        <span role="cell" data-label={copy(lang, "数量", "Qty")}>
                          {item.qtyDisplay || item.qty || job.quantityText || "-"}
                        </span>
                        <span role="cell" data-label={copy(lang, "当前阶段", "Current stage")}>
                          <strong>{itemStatus.label}</strong>
                          <small>{getStageDetail(job, lang)}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <aside className="cho-client-updates" aria-labelledby="cho-client-updates-title">
                <div className="cho-client-section-heading compact">
                  <div>
                    <span className="cho-client-kicker">{copy(lang, "消息中心", "PROJECT NOTES")}</span>
                    <h2 id="cho-client-updates-title">{copy(lang, "问题与更新", "Questions & updates")}</h2>
                  </div>
                </div>
                <div className="cho-client-update-list">
                  {dashboardData.updates.map((update) => {
                    const project = projectGroups.find((entry) =>
                      entry.jobs.some((job) => String(job.id) === String(update.job.id))
                    );
                    return (
                      <button
                        type="button"
                        className={update.action ? "needs-action" : ""}
                        onClick={() => project && openProjectPage(project.key)}
                        key={update.id}
                      >
                        <span className="cho-client-update-mark" aria-hidden="true">
                          {update.action ? "!" : "·"}
                        </span>
                        <span>
                          <strong>{update.title}</strong>
                          <small>{update.detail}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default ClientOrderDashboard;
