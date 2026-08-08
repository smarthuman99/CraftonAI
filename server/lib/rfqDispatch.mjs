function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function safeFilePart(value) {
  return (
    String(value || "RFQ")
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "RFQ"
  );
}

export function getRfqDispatchStatus() {
  return {
    configured: Boolean(process.env.RESEND_API_KEY && process.env.RFQ_FROM_EMAIL),
    provider: "resend",
    apiKeyConfigured: Boolean(process.env.RESEND_API_KEY),
    fromAddressConfigured: Boolean(process.env.RFQ_FROM_EMAIL),
    replyToConfigured: Boolean(process.env.RFQ_REPLY_TO)
  };
}

export function buildRfqResponseCsv({ rfqCode, document = {} }) {
  const header = [
    "RFQ code",
    "Item no.",
    "Item / 品项",
    "Quantity / 数量",
    "Unit / 单位",
    "Dimensions / 尺寸",
    "Material / 材质",
    "Finish / hardware / 饰面五金",
    "Compliance / 合规",
    "Supplier unit price / 供应商单价",
    "Supplier total / 供应商总价",
    "MOQ",
    "Lead time days / 交期天数",
    "Material confirmed / 材质确认",
    "Deviation / 偏差说明"
  ];
  const rows = (document.items || []).map((item) => [
    rfqCode,
    item.itemNo,
    [item.nameEn, item.nameCn].filter(Boolean).join(" / "),
    item.quantity,
    item.unit,
    [item.dimensions, item.tolerance].filter(Boolean).join(" / "),
    [item.materialEn, item.materialCn].filter(Boolean).join(" / "),
    [item.finishColor, item.hardware].filter(Boolean).join(" / "),
    item.compliance,
    "",
    "",
    "",
    "",
    "",
    ""
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

export function buildGeneratedRfqAttachments({ rfqCode, document = {} }) {
  const baseName = safeFilePart(rfqCode);
  const csv = buildRfqResponseCsv({ rfqCode, document });
  const html = renderSupplierRfqAttachment({ rfqCode, document });
  return [
    { filename: `${baseName}-supplier-response.csv`, content: Buffer.from(csv, "utf8").toString("base64") },
    { filename: `${baseName}-inquiry.html`, content: Buffer.from(html, "utf8").toString("base64") }
  ];
}

export async function dispatchRfqEmails({
  rfqCode,
  document,
  suppliers = [],
  attachments = [],
  omittedAttachments = []
}) {
  const service = getRfqDispatchStatus();
  if (!service.configured) {
    const error = new Error(
      "Supplier email service is not configured. Set RESEND_API_KEY and RFQ_FROM_EMAIL on the VPS."
    );
    error.statusCode = 503;
    throw error;
  }

  const generatedAttachments = buildGeneratedRfqAttachments({ rfqCode, document });
  const emailAttachments = [...generatedAttachments, ...attachments];

  const recipients = suppliers
    .slice(0, 20)
    .map((supplier) => ({
      id: supplier.id,
      name: String(supplier.name || "Supplier"),
      email: String(supplier.email || "").trim()
    }))
    .filter((supplier) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email));
  if (!recipients.length) {
    const error = new Error("None of the selected suppliers has a valid email address.");
    error.statusCode = 400;
    throw error;
  }

  const results = [];
  for (const supplier of recipients) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.RFQ_FROM_EMAIL,
        to: [supplier.email],
        reply_to: process.env.RFQ_REPLY_TO || undefined,
        subject: `[${rfqCode}] ${document.email?.subjectEn || document.titleEn || "Request for Quotation"}`,
        html: renderRfqEmail({ rfqCode, document, supplier }),
        attachments: emailAttachments
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(`Email to ${supplier.email} failed: ${payload.message || response.status}`);
      error.statusCode = 502;
      throw error;
    }
    results.push({ supplierId: supplier.id, email: supplier.email, providerMessageId: payload.id, status: "sent" });
  }

  return {
    sentAt: new Date().toISOString(),
    recipients: results,
    attachmentCount: emailAttachments.length,
    generatedAttachments: generatedAttachments.map((attachment) => attachment.filename),
    omittedAttachments
  };
}

export function renderSupplierRfqAttachment({ rfqCode, document }) {
  const responseHead = (document.supplierResponseFields || [])
    .map((field) => `<th>${escapeHtml(field.labelEn)}<br>${escapeHtml(field.labelCn)}</th>`)
    .join("");
  const rows = (document.items || [])
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.itemNo)}</td>
        <td><strong>${escapeHtml(item.nameEn)}</strong><br>${escapeHtml(item.nameCn)}</td>
        <td>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td>
        <td>${escapeHtml(item.dimensions)}<br>${escapeHtml(item.tolerance)}</td>
        <td>${escapeHtml(item.materialEn)}<br>${escapeHtml(item.materialCn)}</td>
        <td>${escapeHtml(item.finishColor)}<br>${escapeHtml(item.hardware)}</td>
        <td>${escapeHtml(item.compliance)}</td>
        ${responseHead ? (document.supplierResponseFields || []).map(() => "<td>&nbsp;</td>").join("") : ""}
      </tr>`
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(rfqCode)}</title><style>@page{size:A4 landscape;margin:10mm}body{font:12px Arial;color:#2f2925}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:6px;vertical-align:top}th{background:#f2eee8}h1{font-size:21px}.meta{display:flex;gap:24px;margin:10px 0}</style></head><body><p>THE CRAFTON · REQUEST FOR QUOTATION</p><h1>${escapeHtml(document.titleEn || "Request for Quotation")}<br><small>${escapeHtml(document.titleCn)}</small></h1><div class="meta"><b>${escapeHtml(rfqCode)}</b></div><p>${escapeHtml(document.introductionEn)}</p><table><thead><tr><th>#</th><th>Item / 品项</th><th>Qty / 数量</th><th>Dimensions / 尺寸</th><th>Material / 材质</th><th>Finish / Hardware</th><th>Compliance</th>${responseHead}</tr></thead><tbody>${rows}</tbody></table><p>Please complete every supplier-response column and return this file before the quotation deadline.</p></body></html>`;
}

export function renderRfqEmail({ rfqCode, document, supplier }) {
  const rows = (document.items || [])
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.itemNo)}</td>
        <td><strong>${escapeHtml(item.nameCn)}</strong><br>${escapeHtml(item.nameEn)}</td>
        <td>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td>
        <td>${escapeHtml(item.dimensions)}<br>${escapeHtml(item.tolerance)}</td>
        <td>${escapeHtml(item.materialCn)}<br>${escapeHtml(item.materialEn)}</td>
        <td>${escapeHtml(item.finishColor)}<br>${escapeHtml(item.hardware)}</td>
        <td>${escapeHtml(item.compliance)}</td>
      </tr>`
    )
    .join("");
  const commercial = (document.commercialRequirements || [])
    .map(
      (row) =>
        `<li><strong>${escapeHtml(row.labelCn)} / ${escapeHtml(row.labelEn)}:</strong> ${escapeHtml(row.value)}</li>`
    )
    .join("");
  const attachments = (document.attachments || [])
    .map((file) => `<li>${escapeHtml(file.name)} - ${escapeHtml(file.note)}</li>`)
    .join("");

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#2f2925;line-height:1.5">
    <div style="max-width:1100px;margin:auto">
      <p>Dear ${escapeHtml(supplier.name)},</p>
      <p>${escapeHtml(document.email?.bodyEn || document.introductionEn)}</p>
      <h1 style="font-size:22px">${escapeHtml(document.titleCn)}<br><span style="font-size:16px;font-weight:normal">${escapeHtml(document.titleEn)}</span></h1>
      <p><strong>RFQ:</strong> ${escapeHtml(rfqCode)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:12px" border="1" cellpadding="7"><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Dimensions</th><th>Material</th><th>Finish / Hardware</th><th>Compliance</th></tr></thead><tbody>${rows}</tbody></table>
      <h2 style="font-size:16px">Commercial requirements / 商务要求</h2><ul>${commercial}</ul>
      <h2 style="font-size:16px">Reference attachments / 参考附件</h2><ul>${attachments || "<li>No attachment listed</li>"}</ul>
      <p>Please reply with unit price, total price, MOQ, sample/tooling cost, production lead time, payment terms, warranty, quotation validity, and every deviation.</p>
      <p>Regards,<br>Crafton Sourcing Team</p>
    </div></body></html>`;
}
