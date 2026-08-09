const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);

const asArray = (value) => (Array.isArray(value) ? value : []);

const safeUrl = (value) => {
  const url = String(value || "").trim();
  return /^(https?:|blob:|data:image\/)/i.test(url) ? url : "";
};

const formatDate = (value, locale, withTime = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
  }).format(date);
};

const bilingual = (primary, secondary) => [primary, secondary].filter(Boolean).map(escapeHtml).join("<br>");

export function buildPrintableRfqHtml({
  document: rfqDocument,
  form = {},
  batch = null,
  project = {},
  attachmentUrls = {},
  lang = "En",
  autoPrint = true
}) {
  if (!rfqDocument) throw new Error("RFQ document is required.");

  const locale = lang === "Cn" ? "zh-CN" : "en-GB";
  const rfqCode = batch?.rfq_code || "DRAFT";
  const projectReference = project.orderId || project.projectName || project.id || "-";
  const client = project.clientCompany || project.company || project.clientName || "-";
  const destination = project.projectLocation || project.destination || "-";
  const deliveryDate = project.desiredDeliveryDate || project.deliveryDate;
  const items = asArray(rfqDocument.items);
  const commercialRequirements = asArray(rfqDocument.commercialRequirements);
  const responseFields = asArray(rfqDocument.supplierResponseFields);
  const attachments = asArray(rfqDocument.attachments);

  const specificationRows = items
    .map(
      (item) => `<tr>
        <td class="mono">${escapeHtml(item.itemNo)}</td>
        <td>${bilingual(item.nameCn, item.nameEn)}</td>
        <td class="nowrap">${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td>
        <td>${bilingual(item.dimensions, item.tolerance)}</td>
        <td>${bilingual(item.materialCn, item.materialEn)}</td>
        <td>${bilingual(item.finishColor, item.hardware)}</td>
        <td>${bilingual(item.compliance, item.supplierNotes)}</td>
      </tr>`
    )
    .join("");

  const responseRows = items
    .map(
      (item) => `<tr>
        <td class="mono">${escapeHtml(item.itemNo)}</td>
        <td>${bilingual(item.nameCn, item.nameEn)}</td>
        <td class="response-cell"></td>
        <td class="response-cell"></td>
        <td class="response-cell"></td>
        <td class="response-cell"></td>
        <td class="response-cell response-wide"></td>
      </tr>`
    )
    .join("");

  const commercialRows = commercialRequirements.length
    ? commercialRequirements
        .map(
          (row) => `<tr>
            <th>${bilingual(row.labelCn, row.labelEn)}</th>
            <td>${escapeHtml(row.value) || "-"}</td>
          </tr>`
        )
        .join("")
    : '<tr><td colspan="2">No additional commercial requirements.</td></tr>';

  const responseFieldList = responseFields.length
    ? responseFields.map((row) => `<li>${bilingual(row.labelCn, row.labelEn)}</li>`).join("")
    : "<li>Completed quotation table and authorised signature.</li>";

  const attachmentRows = attachments.length
    ? attachments
        .map((file, index) => {
          const key = file.id || file.name;
          const url = safeUrl(attachmentUrls[key] || file.url);
          const name = escapeHtml(file.name || `Attachment ${index + 1}`);
          const link = url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${name}</a>` : name;
          return `<tr>
            <td>${index + 1}</td>
            <td>${link}</td>
            <td>${escapeHtml(file.type || file.mimeType || "-")}</td>
            <td>${escapeHtml(file.note || "-")}</td>
          </tr>`;
        })
        .join("")
    : '<tr><td colspan="4">No reference attachment listed.</td></tr>';

  const titleCn = escapeHtml(rfqDocument.titleCn || "供应商询价单");
  const titleEn = escapeHtml(rfqDocument.titleEn || "Supplier Request for Quotation");
  const printScript = autoPrint
    ? '<script>window.addEventListener("load",()=>window.setTimeout(()=>window.print(),350));</script>'
    : "";

  return `<!doctype html>
<html lang="${lang === "Cn" ? "zh-CN" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(rfqCode)} - ${titleEn}</title>
  <style>
    :root{color-scheme:light;--ink:#2d2926;--muted:#706861;--line:#cfc7bd;--paper:#fff;--wash:#f4f0e9;--accent:#725441;--ok:#52644f}
    *{box-sizing:border-box}
    html{background:#e9e5df}
    body{max-width:1280px;margin:0 auto;background:var(--paper);color:var(--ink);font:11px/1.45 Arial,"Noto Sans SC","Microsoft YaHei",sans-serif}
    .print-toolbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 18px;background:#2d2926;color:#fff;box-shadow:0 3px 12px #0003}
    .print-toolbar strong{font-size:12px;letter-spacing:.04em}
    .print-actions{display:flex;gap:8px}
    button{border:1px solid #ffffff66;border-radius:3px;background:#fff;color:#2d2926;padding:8px 14px;font:700 11px Arial;cursor:pointer}
    button.secondary{background:transparent;color:#fff}
    main{padding:12mm}
    .masthead{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;border-bottom:2px solid var(--ink);padding-bottom:10px}
    .brand{font:700 20px/1 Georgia,serif;letter-spacing:.16em}
    .brand small{display:block;margin-top:5px;color:var(--muted);font:600 7px/1.2 Arial;letter-spacing:.25em}
    .document-type{text-align:right;color:var(--accent);font-size:9px;font-weight:700;letter-spacing:.14em}
    h1{margin:14px 0 4px;font:600 22px/1.15 Georgia,"Noto Serif SC",serif}
    h1 small{display:block;margin-top:4px;color:var(--muted);font:500 13px/1.2 Arial,"Microsoft YaHei",sans-serif}
    h2{margin:16px 0 7px;border-bottom:1px solid var(--line);padding-bottom:5px;color:var(--accent);font-size:10px;letter-spacing:.09em;text-transform:uppercase}
    .meta-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:12px;border:1px solid var(--line);background:var(--wash)}
    .meta{min-height:48px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:8px}
    .meta:nth-child(4n){border-right:0}
    .meta:nth-last-child(-n+4){border-bottom:0}
    .meta span{display:block;margin-bottom:3px;color:var(--muted);font-size:7px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .meta strong{font-size:10px}
    .supplier-line{margin-top:9px;border-bottom:1px solid var(--ink);padding:8px 2px 6px}
    .supplier-line b{display:inline-block;width:145px;color:var(--muted);font-size:8px;text-transform:uppercase}
    .intro-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:12px 0}
    .intro-grid p{margin:0;white-space:pre-wrap}
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th,td{border:1px solid var(--line);padding:6px;vertical-align:top;overflow-wrap:anywhere}
    thead{display:table-header-group}
    th{background:var(--wash);font-size:8px;line-height:1.35;text-align:left}
    tr{break-inside:avoid;page-break-inside:avoid}
    .spec-table th:nth-child(1){width:6%}.spec-table th:nth-child(2){width:15%}.spec-table th:nth-child(3){width:7%}.spec-table th:nth-child(4){width:14%}.spec-table th:nth-child(5){width:18%}.spec-table th:nth-child(6){width:17%}.spec-table th:nth-child(7){width:23%}
    .response-table th:nth-child(1){width:6%}.response-table th:nth-child(2){width:22%}.response-table th:nth-child(3){width:11%}.response-table th:nth-child(4){width:9%}.response-table th:nth-child(5){width:11%}.response-table th:nth-child(6){width:14%}.response-table th:nth-child(7){width:27%}
    .response-cell{height:30px;background:#fff}
    .mono{font-family:Consolas,"Courier New",monospace}.nowrap{white-space:nowrap}
    .lower-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:16px;align-items:start}
    .commercial-table th{width:38%}
    .return-list{display:grid;grid-template-columns:1fr 1fr;gap:0;margin:0;padding:0;list-style:none;border:1px solid var(--line)}
    .return-list li{min-height:34px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:7px}
    .return-list li:nth-child(2n){border-right:0}.return-list li:nth-last-child(-n+2){border-bottom:0}
    .signature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}
    .signature{min-height:48px;border-bottom:1px solid var(--ink);padding-top:28px;color:var(--muted);font-size:8px}
    .document-footer{display:flex;justify-content:space-between;gap:20px;margin-top:18px;border-top:1px solid var(--line);padding-top:7px;color:var(--muted);font-size:7px}
    .confidential{color:var(--accent);font-weight:700;letter-spacing:.08em}
    a{color:var(--accent);text-decoration:none}
    @page{size:A4 landscape;margin:8mm}
    @media print{
      html{background:#fff}.print-toolbar{display:none!important}body{max-width:none}main{padding:0}
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      h2{break-after:avoid;page-break-after:avoid}
    }
    @media(max-width:760px){main{padding:18px}.meta-grid,.intro-grid,.lower-grid,.signature-grid{grid-template-columns:1fr}.meta{border-right:0}.meta:nth-last-child(-n+4){border-bottom:1px solid var(--line)}.meta:last-child{border-bottom:0}.print-toolbar{align-items:flex-start;flex-direction:column}.spec-table,.response-table{min-width:980px}section.table-scroll{overflow:auto}}
  </style>
</head>
<body>
  <div class="print-toolbar">
    <strong>${escapeHtml(rfqCode)} - RFQ print preview</strong>
    <div class="print-actions">
      <button type="button" class="secondary" onclick="window.close()">Close</button>
      <button type="button" onclick="window.print()">Print / Save PDF</button>
    </div>
  </div>
  <main>
    <header class="masthead">
      <div class="brand">THE CRAFTON<small>CONTRACT FURNITURE · SOURCING & MANUFACTURING</small></div>
      <div class="document-type">REQUEST FOR QUOTATION<br>供应商询价单</div>
    </header>
    <h1>${titleCn}<small>${titleEn}</small></h1>
    <section class="meta-grid" aria-label="RFQ information">
      <div class="meta"><span>RFQ reference / 询价编号</span><strong class="mono">${escapeHtml(rfqCode)}</strong></div>
      <div class="meta"><span>Issue date / 发出日期</span><strong>${formatDate(batch?.created_at || new Date(), locale)}</strong></div>
      <div class="meta"><span>Quotation due / 报价截止</span><strong>${formatDate(form.dueAt || batch?.due_at, locale, true)}</strong></div>
      <div class="meta"><span>Currency / 币种</span><strong>${escapeHtml(form.currency || batch?.currency || "USD")}</strong></div>
      <div class="meta"><span>Project / 项目</span><strong>${escapeHtml(projectReference)}</strong></div>
      <div class="meta"><span>Client / 客户</span><strong>${escapeHtml(client)}</strong></div>
      <div class="meta"><span>Destination / 目的地</span><strong>${escapeHtml(destination)}</strong></div>
      <div class="meta"><span>Required delivery / 要求交付</span><strong>${formatDate(deliveryDate, locale)}</strong></div>
    </section>
    <div class="supplier-line"><b>Supplier company / 供应商</b> ________________________________________________</div>
    <section class="intro-grid">
      <p>${escapeHtml(rfqDocument.introductionCn || "请根据以下规格提交正式报价，并说明任何偏差。")}</p>
      <p>${escapeHtml(rfqDocument.introductionEn || "Please submit a formal quotation against the following specification and disclose every deviation.")}</p>
    </section>

    <h2>01 · Product specification / 产品规格</h2>
    <section class="table-scroll">
      <table class="spec-table">
        <thead><tr><th>#</th><th>Item / 品项</th><th>Qty / 数量</th><th>Dimensions / Tolerance<br>尺寸 / 公差</th><th>Material / 材质</th><th>Finish / Hardware<br>饰面 / 五金</th><th>Compliance / Notes<br>合规 / 备注</th></tr></thead>
        <tbody>${specificationRows || '<tr><td colspan="7">No RFQ item row available.</td></tr>'}</tbody>
      </table>
    </section>

    <h2>02 · Supplier quotation / 供应商报价</h2>
    <section class="table-scroll">
      <table class="response-table">
        <thead><tr><th>#</th><th>Item / 品项</th><th>Unit price<br>单价</th><th>MOQ</th><th>Lead time<br>交期天数</th><th>Material confirmed<br>材质确认</th><th>Deviation / Notes<br>偏差 / 备注</th></tr></thead>
        <tbody>${responseRows || '<tr><td colspan="7">No RFQ item row available.</td></tr>'}</tbody>
      </table>
    </section>

    <section class="lower-grid">
      <div>
        <h2>03 · Commercial requirements / 商务要求</h2>
        <table class="commercial-table"><tbody>${commercialRows}</tbody></table>
      </div>
      <div>
        <h2>04 · Required return information / 必须回填</h2>
        <ul class="return-list">${responseFieldList}</ul>
      </div>
    </section>

    <h2>05 · Reference attachments / 参考附件</h2>
    <table><thead><tr><th style="width:6%">#</th><th style="width:34%">File / 文件</th><th style="width:18%">Type / 类型</th><th>Note / 说明</th></tr></thead><tbody>${attachmentRows}</tbody></table>

    <section class="signature-grid">
      <div class="signature">Supplier representative / 供应商代表</div>
      <div class="signature">Authorised signature & stamp / 授权签字及盖章</div>
      <div class="signature">Quotation date / 报价日期</div>
    </section>
    <footer class="document-footer">
      <span class="confidential">CONFIDENTIAL SUPPLIER RFQ</span>
      <span>Please return the completed quotation before the stated deadline and reference ${escapeHtml(rfqCode)} in all correspondence.</span>
    </footer>
  </main>
  ${printScript}
</body>
</html>`;
}
