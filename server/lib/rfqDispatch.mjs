function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function dispatchRfqEmails({ rfqCode, document, suppliers = [] }) {
  if (!process.env.RESEND_API_KEY) {
    const error = new Error("Supplier email service is not configured. Set RESEND_API_KEY and RFQ_FROM_EMAIL on the VPS.");
    error.statusCode = 503;
    throw error;
  }

  const recipients = suppliers
    .slice(0, 20)
    .map((supplier) => ({ id: supplier.id, name: String(supplier.name || "Supplier"), email: String(supplier.email || "").trim() }))
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
        from: process.env.RFQ_FROM_EMAIL || "Crafton Sourcing <rfq@thecrafton.com>",
        to: [supplier.email],
        reply_to: process.env.RFQ_REPLY_TO || undefined,
        subject: `[${rfqCode}] ${document.email?.subjectEn || document.titleEn || "Request for Quotation"}`,
        html: renderRfqEmail({ rfqCode, document, supplier })
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

  return { sentAt: new Date().toISOString(), recipients: results };
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
    .map((row) => `<li><strong>${escapeHtml(row.labelCn)} / ${escapeHtml(row.labelEn)}:</strong> ${escapeHtml(row.value)}</li>`)
    .join("");
  const attachments = (document.attachments || []).map((file) => `<li>${escapeHtml(file.name)} - ${escapeHtml(file.note)}</li>`).join("");

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
