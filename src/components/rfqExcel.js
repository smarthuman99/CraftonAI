const COLORS = {
  cream: "FFEFE7D6",
  paper: "FFFBF6EC",
  ink: "FF232220",
  walnut: "FF4A3525",
  stone: "FF8F8064",
  input: "FFF3E5C9",
  line: "FFD7CEBD"
};

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const valueOf = (cell) => {
  const value = cell?.value;
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if (Object.prototype.hasOwnProperty.call(value, "result")) return value.result ?? "";
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || "").join("");
    if (value.text) return value.text;
  }
  return value;
};

const textOf = (cell) => String(valueOf(cell) ?? "").trim();
const numberOf = (cell) => {
  const value = valueOf(cell);
  if (typeof value === "number") return value;
  const parsed = Number(String(value || "").replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const safeFilePart = (value) =>
  String(value || "RFQ")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);

const borders = {
  top: { style: "thin", color: { argb: COLORS.line } },
  left: { style: "thin", color: { argb: COLORS.line } },
  bottom: { style: "thin", color: { argb: COLORS.line } },
  right: { style: "thin", color: { argb: COLORS.line } }
};

function styleLabel(cell) {
  cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.walnut } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream } };
  cell.border = borders;
  cell.alignment = { vertical: "middle", wrapText: true };
}

function styleInput(cell) {
  cell.font = { name: "Arial", size: 10, color: { argb: COLORS.ink } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.input } };
  cell.border = borders;
  cell.alignment = { vertical: "middle", wrapText: true };
  cell.protection = { locked: false };
}

function styleHeader(cell) {
  cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.paper } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.walnut } };
  cell.border = borders;
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
}

function styleRequestCell(cell) {
  cell.font = { name: "Arial", size: 9, color: { argb: COLORS.ink } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.paper } };
  cell.border = borders;
  cell.alignment = { vertical: "top", wrapText: true };
}

async function excelJs() {
  const module = await import("exceljs");
  return module.default || module;
}

async function imageAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image download failed: ${response.status}`);
  const blob = await response.blob();
  if (!/image\/(png|jpe?g)/i.test(blob.type)) throw new Error("Excel supports PNG and JPEG references only.");
  return await new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = () => resolve({ base64: reader.result, extension: /png/i.test(blob.type) ? "png" : "jpeg" });
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function buildRfqWorkbook({ project, batch, document, form, references = [] }) {
  if (!document?.items?.length) throw new Error("The RFQ has no BOM item rows.");
  if (!batch?.id || !batch?.rfq_code) throw new Error("Save and approve the RFQ before creating Excel.");

  const ExcelJS = await excelJs();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "The Crafton";
  workbook.company = "The Crafton";
  workbook.subject = `${batch.rfq_code} supplier request for quotation`;
  workbook.title = `${batch.rfq_code} Supplier RFQ`;
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const sheet = workbook.addWorksheet("RFQ", {
    views: [{ state: "frozen", ySplit: 14, showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 }
  });
  sheet.properties.defaultRowHeight = 22;
  sheet.columns = [
    { key: "itemNo", width: 13 },
    { key: "item", width: 28 },
    { key: "quantity", width: 10 },
    { key: "unit", width: 9 },
    { key: "dimensions", width: 25 },
    { key: "material", width: 25 },
    { key: "finish", width: 23 },
    { key: "compliance", width: 24 },
    { key: "unitPrice", width: 17 },
    { key: "lineTotal", width: 17 },
    { key: "lineMoq", width: 12 },
    { key: "leadDays", width: 15 },
    { key: "materialConfirmed", width: 18 },
    { key: "deviation", width: 26 },
    { key: "supplierNotes", width: 28 }
  ];

  sheet.mergeCells("A1:O1");
  const title = sheet.getCell("A1");
  title.value = "THE CRAFTON · SUPPLIER REQUEST FOR QUOTATION";
  title.font = { name: "Arial", size: 19, bold: true, color: { argb: COLORS.paper } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.walnut } };
  title.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 34;

  sheet.mergeCells("A2:O2");
  const subtitle = sheet.getCell("A2");
  subtitle.value = `${document.titleEn || "Request for Quotation"} / ${document.titleCn || "供应商询价单"}`;
  subtitle.font = { name: "Arial", size: 13, bold: true, color: { argb: COLORS.ink } };
  subtitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.paper } };

  const metaLabels = ["RFQ / 询价编号", "Project / 项目", "Client / 客户", "Due / 截止", "Currency / 币种"];
  const metaValues = [
    batch.rfq_code,
    project.orderId || project.projectName || project.id,
    project.clientName || project.clientCompany || "-",
    form.dueAt ? new Date(form.dueAt).toLocaleString("en-GB") : "-",
    form.currency || batch.currency || "USD"
  ];
  for (let index = 0; index < metaLabels.length; index += 1) {
    const start = index * 3 + 1;
    const labelCell = sheet.getCell(3, start);
    const valueCell = sheet.getCell(4, start);
    sheet.mergeCells(3, start, 3, start + 2);
    sheet.mergeCells(4, start, 4, start + 2);
    labelCell.value = metaLabels[index];
    valueCell.value = metaValues[index];
    styleLabel(labelCell);
    styleRequestCell(valueCell);
    valueCell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.ink } };
  }

  sheet.mergeCells("A5:O5");
  const instruction = sheet.getCell("A5");
  instruction.value =
    "SUPPLIER: Complete all warm-coloured cells and return this .xlsx file without deleting the hidden identification sheet. / 供应商：请填写所有暖色单元格，并保留隐藏识别页后回传本文件。";
  instruction.font = { name: "Arial", size: 10, italic: true, color: { argb: COLORS.walnut } };
  instruction.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream } };
  instruction.alignment = { wrapText: true, vertical: "middle" };
  sheet.getRow(5).height = 30;

  const fields = [
    ["Supplier company / 供应商公司", "B6:F6", ""],
    ["Quote reference / 报价编号", "H6:K6", `${batch.rfq_code}-SUPPLIER`],
    ["Currency / 币种", "M6:O6", form.currency || batch.currency || "USD"],
    ["Contact person / 联系人", "B7:F7", ""],
    ["Valid until / 有效期", "H7:K7", ""],
    ["Overall MOQ / 总起订量", "M7:O7", ""],
    ["Contact email / 联系邮箱", "B8:F8", ""],
    ["Production lead days / 生产交期（天）", "H8:K8", ""],
    ["Payment terms / 付款条件", "M8:O8", ""],
    ["Material confirmation / 材质确认", "B9:F9", ""],
    ["Delivery / Incoterm / 交货条款", "H9:K9", ""],
    ["Packing / 包装", "M9:O9", ""],
    ["Supplier notes / 供应商备注", "B10:O11", ""]
  ];
  const labelCells = ["A6", "G6", "L6", "A7", "G7", "L7", "A8", "G8", "L8", "A9", "G9", "L9", "A10"];
  fields.forEach(([label, range, value], index) => {
    const [start, end] = range.split(":");
    sheet.mergeCells(range);
    const labelCell = sheet.getCell(labelCells[index]);
    const inputCell = sheet.getCell(start);
    labelCell.value = label;
    inputCell.value = value;
    styleLabel(labelCell);
    styleInput(inputCell);
    const endCell = sheet.getCell(end);
    endCell.border = borders;
  });
  [6, 7, 8, 9].forEach((row) => (sheet.getRow(row).height = 28));
  sheet.getRow(10).height = 28;
  sheet.getRow(11).height = 28;

  sheet.mergeCells("A12:O12");
  const intro = sheet.getCell("A12");
  intro.value = `${document.introductionEn || ""}\n${document.introductionCn || ""}`.trim();
  styleRequestCell(intro);
  intro.alignment = { wrapText: true, vertical: "top" };
  sheet.getRow(12).height = 52;

  sheet.mergeCells("A13:O13");
  const commercial = sheet.getCell("A13");
  commercial.value = (document.commercialRequirements || [])
    .map((row) => `${row.labelEn || row.labelCn}: ${row.value || "To confirm"}`)
    .join("  |  ");
  styleRequestCell(commercial);
  commercial.font = { name: "Arial", size: 9, color: { argb: COLORS.stone } };
  commercial.alignment = { wrapText: true, vertical: "top" };
  sheet.getRow(13).height = 42;

  const headers = [
    "Item No. / 品项编号",
    "Product / 产品",
    "Qty / 数量",
    "Unit / 单位",
    "Dimensions & tolerance / 尺寸与公差",
    "Material / 材质",
    "Finish & hardware / 饰面与五金",
    "Compliance / 合规",
    "Supplier unit price / 供应商单价",
    "Line total / 小计",
    "Line MOQ / 品项MOQ",
    "Lead days / 交期天数",
    "Material confirmed / 材质确认",
    "Deviation / 偏差说明",
    "Supplier notes / 供应商备注"
  ];
  const headerRow = sheet.getRow(14);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    styleHeader(cell);
  });
  headerRow.height = 42;

  const itemStartRow = 15;
  document.items.forEach((item, index) => {
    const rowNumber = itemStartRow + index;
    const row = sheet.getRow(rowNumber);
    const requestValues = [
      item.itemNo,
      [item.nameEn, item.nameCn].filter(Boolean).join(" / "),
      Number(item.quantity || 0),
      item.unit || "pcs",
      [item.dimensions, item.tolerance].filter(Boolean).join(" / "),
      [item.materialEn, item.materialCn].filter(Boolean).join(" / "),
      [item.finishColor, item.hardware].filter(Boolean).join(" / "),
      [item.compliance, item.supplierNotes].filter(Boolean).join(" / ")
    ];
    requestValues.forEach((value, cellIndex) => {
      const cell = row.getCell(cellIndex + 1);
      cell.value = value;
      styleRequestCell(cell);
    });
    for (let column = 9; column <= 15; column += 1) styleInput(row.getCell(column));
    row.getCell(10).value = { formula: `IF(I${rowNumber}="","",C${rowNumber}*I${rowNumber})`, result: "" };
    row.getCell(10).numFmt = "#,##0.00";
    row.getCell(9).numFmt = "#,##0.00";
    row.getCell(13).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Yes / 是,No / 否,Conditional / 有条件"']
    };
    row.height = 58;
  });

  const totalRowNumber = itemStartRow + document.items.length;
  const totalRow = sheet.getRow(totalRowNumber);
  sheet.mergeCells(totalRowNumber, 1, totalRowNumber, 8);
  totalRow.getCell(1).value = "QUOTED GOODS TOTAL / 货品报价总额";
  totalRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  totalRow.getCell(1).font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.paper } };
  totalRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.walnut } };
  totalRow.getCell(9).value = "";
  totalRow.getCell(10).value = { formula: `SUM(J${itemStartRow}:J${totalRowNumber - 1})`, result: 0 };
  totalRow.getCell(10).numFmt = "#,##0.00";
  for (let column = 9; column <= 15; column += 1) {
    const cell = totalRow.getCell(column);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.input } };
    cell.border = borders;
    cell.font = { name: "Arial", size: 10, bold: column === 10, color: { argb: COLORS.ink } };
  }
  totalRow.height = 28;

  sheet.autoFilter = { from: { row: 14, column: 1 }, to: { row: totalRowNumber - 1, column: 15 } };
  sheet.getColumn(3).numFmt = "0";
  sheet.getColumn(9).numFmt = "#,##0.00";
  sheet.getColumn(10).numFmt = "#,##0.00";
  sheet.headerFooter.oddFooter = `The Crafton · ${batch.rfq_code} · &P / &N`;

  const referenceSheet = workbook.addWorksheet("Product References", { views: [{ showGridLines: false }] });
  referenceSheet.columns = [
    { width: 4 },
    { width: 18 },
    { width: 18 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 22 }
  ];
  referenceSheet.mergeCells("A1:G1");
  referenceSheet.getCell("A1").value = "PRODUCT REFERENCES / 产品参考资料";
  referenceSheet.getCell("A1").font = { name: "Arial", size: 17, bold: true, color: { argb: COLORS.paper } };
  referenceSheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.walnut } };
  referenceSheet.getRow(1).height = 32;

  if (!references.length) {
    referenceSheet.mergeCells("A3:G4");
    referenceSheet.getCell("A3").value = "No reference image is linked to this RFQ. / 此询价单没有关联参考图片。";
    styleRequestCell(referenceSheet.getCell("A3"));
  } else {
    let anchorRow = 3;
    for (const reference of references) {
      referenceSheet.getCell(`D${anchorRow}`).value = reference.name || "Reference";
      referenceSheet.getCell(`D${anchorRow}`).font = {
        name: "Arial",
        size: 12,
        bold: true,
        color: { argb: COLORS.ink }
      };
      referenceSheet.mergeCells(`D${anchorRow}:G${anchorRow}`);
      referenceSheet.getCell(`D${anchorRow + 1}`).value = reference.note || "";
      referenceSheet.getCell(`D${anchorRow + 1}`).alignment = { wrapText: true, vertical: "top" };
      referenceSheet.mergeCells(`D${anchorRow + 1}:G${anchorRow + 4}`);
      if (reference.url) {
        try {
          const image = await imageAsBase64(reference.url);
          const imageId = workbook.addImage(image);
          referenceSheet.addImage(imageId, {
            tl: { col: 0.3, row: anchorRow - 0.7 },
            ext: { width: 255, height: 155 },
            editAs: "oneCell"
          });
        } catch {
          referenceSheet.getCell(`A${anchorRow}`).value = "Image unavailable in export";
        }
      }
      for (let row = anchorRow; row < anchorRow + 7; row += 1) referenceSheet.getRow(row).height = 24;
      anchorRow += 8;
    }
  }

  const metadata = workbook.addWorksheet("_CraftonMeta", { state: "veryHidden" });
  const metaRows = [
    ["template_version", "crafton-rfq-xlsx-v1"],
    ["project_id", project.id],
    ["rfq_batch_id", batch.id],
    ["rfq_code", batch.rfq_code],
    ["currency", form.currency || batch.currency || "USD"],
    ["document_version", batch.payload?.version || 1],
    ["item_start_row", itemStartRow],
    ["item_end_row", totalRowNumber - 1],
    ["exported_at", new Date().toISOString()]
  ];
  metadata.addRows(metaRows);
  metadata.columns = [{ width: 24 }, { width: 50 }];

  await sheet.protect("crafton-rfq", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertRows: false,
    deleteRows: false,
    sort: false,
    autoFilter: true
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    mimeType: MIME_XLSX,
    fileName: `${safeFilePart(batch.rfq_code)}-${safeFilePart(project.orderId || project.projectName || "project")}-supplier-RFQ.xlsx`,
    metadata: Object.fromEntries(metaRows)
  };
}

export async function parseSupplierRfqWorkbook(file) {
  if (!file) throw new Error("Choose a supplier .xlsx file first.");
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Only the generated .xlsx RFQ template can be imported.");
  const ExcelJS = await excelJs();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const metadataSheet = workbook.getWorksheet("_CraftonMeta");
  if (!metadataSheet) throw new Error("This file is missing the Crafton RFQ identification sheet.");
  const metadata = {};
  metadataSheet.eachRow((row) => {
    const key = textOf(row.getCell(1));
    if (key) metadata[key] = valueOf(row.getCell(2));
  });
  if (metadata.template_version !== "crafton-rfq-xlsx-v1") {
    throw new Error("This Excel file is not a supported Crafton RFQ template.");
  }

  const sheet = workbook.getWorksheet("RFQ");
  if (!sheet) throw new Error("The RFQ worksheet is missing.");
  const itemStartRow = Number(metadata.item_start_row || 15);
  const itemEndRow = Number(metadata.item_end_row || sheet.rowCount);
  const items = [];
  for (let rowNumber = itemStartRow; rowNumber <= itemEndRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const itemNo = textOf(row.getCell(1));
    if (!itemNo) continue;
    items.push({
      itemNo,
      itemName: textOf(row.getCell(2)),
      quantity: numberOf(row.getCell(3)),
      unit: textOf(row.getCell(4)) || "pcs",
      unitPrice: numberOf(row.getCell(9)),
      lineTotal: numberOf(row.getCell(10)) || numberOf(row.getCell(3)) * numberOf(row.getCell(9)),
      moq: numberOf(row.getCell(11)),
      leadTimeDays: numberOf(row.getCell(12)),
      materialConfirmation: textOf(row.getCell(13)),
      deviation: textOf(row.getCell(14)),
      supplierNotes: textOf(row.getCell(15))
    });
  }
  if (!items.length) throw new Error("No RFQ item rows were found in the workbook.");

  return {
    metadata,
    supplierCompany: textOf(sheet.getCell("B6")),
    quoteCode: textOf(sheet.getCell("H6")),
    currency: textOf(sheet.getCell("M6")) || metadata.currency || "USD",
    contactPerson: textOf(sheet.getCell("B7")),
    validityUntil: textOf(sheet.getCell("H7")),
    moq: numberOf(sheet.getCell("M7")),
    contactEmail: textOf(sheet.getCell("B8")),
    leadTimeDays: numberOf(sheet.getCell("H8")) || Math.max(0, ...items.map((item) => item.leadTimeDays)),
    paymentTerms: textOf(sheet.getCell("M8")),
    materialConfirmation: textOf(sheet.getCell("B9")),
    deliveryTerms: textOf(sheet.getCell("H9")),
    packing: textOf(sheet.getCell("M9")),
    notes: textOf(sheet.getCell("B10")),
    items,
    quotedItemCount: items.filter((item) => item.unitPrice > 0).length,
    totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0)
  };
}
