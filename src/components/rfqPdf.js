import { isImageReference, referencesForItem } from "../../shared/rfqReferences.mjs";
import { imageAsBase64 } from "./rfqExcel.js";

const FONT_PATH = "/fonts/NotoSansCJKsc-Regular.otf";
const bilingual = (en, cn) => [en, cn].filter(Boolean).join("\n");
const text = (value) => String(value ?? "");
const header = (value) => ({ text: value, fillColor: "#4A3525", color: "#FBF6EC", margin: [6, 7] });
const section = (value, pageBreak) => ({ text: value, style: "section", ...(pageBreak ? { pageBreak } : {}) });
const table = (body, widths, headerRows = 0) => ({
  table: { body, widths, headerRows },
  layout: {
    hLineColor: () => "#D7CEBD",
    vLineColor: () => "#D7CEBD",
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    paddingLeft: () => 7,
    paddingRight: () => 7,
    paddingTop: () => 4,
    paddingBottom: () => 4
  }
});

export async function buildRfqPdfDefinition({ project, batch, document, form = {}, references = [] }) {
  if (!document?.items?.length) throw new Error("The RFQ has no product rows.");
  const images = {};
  const prepared = [];
  for (const reference of references) {
    if (!isImageReference(reference)) continue;
    try {
      if (!reference.url) throw new Error("Missing image URL");
      const image = await imageAsBase64(reference.url);
      const key = `reference${prepared.length}`;
      images[key] = image.base64;
      prepared.push({ ...reference, pdfImageKey: key });
    } catch {
      throw new Error(`参考图片无法嵌入 PDF：${reference.name}。请重试。 / Cannot embed reference image.`);
    }
  }
  const code = batch.rfq_code;
  const version = batch.payload?.version || 1;
  const content = [
    { text: "THE CRAFTON", style: "brand" },
    { text: bilingual(document.titleEn || "Request for quotation", document.titleCn), style: "title" },
    {
      text: `${code}  ·  v${version}  ·  ${batch.status === "draft" ? "DRAFT / 草稿" : "SUPPLIER RFQ / 供应商询价"}`,
      style: "muted",
      margin: [0, 4, 0, 18]
    },
    table(
      [
        ["Project / 项目", text(project.orderId || project.projectName || document.project?.projectName)],
        ["Client / 客户", text(document.project?.clientName || project.clientCompany || project.clientName)],
        ["Quotation due / 报价截止", text(form.dueAt ? new Date(form.dueAt).toLocaleString("en-GB") : "-")],
        ["Currency / 币种", text(form.currency || batch.currency || "USD")]
      ],
      [120, "*"]
    ),
    { text: bilingual(document.introductionEn, document.introductionCn), margin: [0, 16, 0, 14] },
    section("01  Product schedule / 产品清单"),
    table(
      [
        ["Item / 编号", "Product / 产品", "Quantity / 数量"].map(header),
        ...document.items.map((item) => [
          text(item.itemNo),
          bilingual(item.nameEn, item.nameCn),
          `${text(item.quantity)} ${text(item.unit)}`
        ])
      ],
      [100, "*", 72],
      1
    ),
    section("02  Commercial requirements / 商务要求", "before"),
    table(
      document.commercialRequirements?.length
        ? document.commercialRequirements.map((row) => [bilingual(row.labelEn, row.labelCn), text(row.value)])
        : [["To confirm / 待确认", ""]],
      [150, "*"]
    ),
    section("Required supplier return / 供应商回填"),
    table(
      document.supplierResponseFields?.length
        ? document.supplierResponseFields.map((row) => [
            bilingual(row.labelEn || row.key, row.labelCn),
            "________________________________"
          ])
        : [["Quotation / 报价", "________________________________"]],
      [220, "*"]
    )
  ];
  document.items.forEach((item, index) => {
    const itemImages = referencesForItem(item, prepared);
    content.push(
      section(`03.${index + 1}  ${text(item.itemNo)}  /  ${text(item.nameEn)}`, "before"),
      { text: text(item.nameCn), style: "muted", margin: [0, 0, 0, 12] },
      ...(itemImages.length
        ? itemImages.map((reference) => ({
            image: reference.pdfImageKey,
            fit: [470, 235],
            alignment: "center",
            margin: [0, 0, 0, 14]
          }))
        : [{ text: "No linked product image / 未关联产品图片", style: "muted", margin: [0, 12, 0, 12] }]),
      table(
        [
          ["Quantity / 数量", `${text(item.quantity)} ${text(item.unit)}`],
          ["Dimensions / 尺寸", text(item.dimensions)],
          ["Tolerance / 公差", text(item.tolerance)],
          ["Material / 材质", bilingual(item.materialEn, item.materialCn)],
          ["Finish & hardware / 饰面与五金", bilingual(item.finishColor, item.hardware)],
          ["Compliance & notes / 合规与备注", bilingual(item.compliance, item.supplierNotes)]
        ],
        [145, "*"]
      ),
      {
        text: "Unit price / 单价: __________   MOQ / 起订量: __________   Lead days / 交期: __________",
        margin: [0, 16, 0, 8]
      },
      { text: "Material confirmed & deviations / 材质确认与偏差: __________________________________" }
    );
  });
  const unmatched = prepared.filter((ref) => !document.items.some((item) => referencesForItem(item, [ref]).length));
  if (unmatched.length) {
    content.push(section("Additional reference images / 其他参考图片", "before"));
    unmatched.forEach((ref) =>
      content.push({ text: ref.name, style: "section" }, { image: ref.pdfImageKey, fit: [470, 400] })
    );
  }
  content.push(section("04  Clarifications & attachments / 待确认事项与附件", "before"));
  (document.missingInformation || []).forEach((row) =>
    content.push({
      text: bilingual(row.messageEn, row.messageCn),
      margin: [0, 0, 0, 10]
    })
  );
  references.forEach((ref) =>
    content.push({
      text: `${ref.name || "Reference"}${ref.note ? ` - ${ref.note}` : ""}`,
      style: "muted",
      margin: [0, 0, 0, 7]
    })
  );
  content.push({
    text: "Supplier representative / 供应商代表: ____________________\n\nSignature & date / 签名及日期: ____________________",
    margin: [0, 25, 0, 0]
  });
  return {
    info: { title: `${code} Supplier RFQ`, author: "The Crafton", subject: "Supplier request for quotation" },
    pageSize: "A4",
    pageMargins: [38, 42, 38, 45],
    defaultStyle: { font: "CraftonCJK", fontSize: 9, color: "#232220", lineHeight: 1.15 },
    styles: {
      brand: { fontSize: 13, color: "#4A3525", characterSpacing: 2, margin: [0, 0, 0, 12] },
      title: { fontSize: 20, color: "#4A3525" },
      section: { fontSize: 12, color: "#4A3525", margin: [0, 16, 0, 10] },
      muted: { fontSize: 8, color: "#776D5D" }
    },
    footer: (page, pages) => ({
      text: `THE CRAFTON  |  ${code}  |  v${version}  |  ${page} / ${pages}`,
      alignment: "center",
      fontSize: 8,
      color: "#776D5D",
      margin: [38, 12]
    }),
    images,
    content
  };
}

export async function buildRfqPdf(options) {
  const definition = await buildRfqPdfDefinition(options);
  const module = await import("pdfmake/build/pdfmake");
  const pdfMake = module.default || module;
  const font = new URL(FONT_PATH, window.location.origin).href;
  const fonts = { CraftonCJK: { normal: font, bold: font, italics: font, bolditalics: font } };
  // getBuffer waits for fonts and embedded images before the archive is written.
  pdfMake.addFonts(fonts);
  const buffer = await pdfMake.createPdf(definition).getBuffer();
  return {
    buffer,
    mimeType: "application/pdf",
    fileName: `${options.batch.rfq_code}-v${options.batch.payload?.version || 1}-RFQ.pdf`,
    metadata: {
      document_version: options.batch.payload?.version || 1,
      embedded_images: Object.keys(definition.images).length
    }
  };
}
