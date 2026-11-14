// Customer-facing names for the existing S01–S17 workflow; a stage is a recorded
// position in the workflow, not evidence that earlier approvals were completed.
const names = [
  ["需求接收", "Brief received"],
  ["規格核對", "Specification review"],
  ["產品清單準備", "Product list preparation"],
  ["技術審核", "Technical review"],
  ["合規核對", "Compliance review"],
  ["詢價準備", "Quotation preparation"],
  ["報價評估", "Quotation review"],
  ["生產安排確認", "Production arrangement review"],
  ["製作進度", "Production tracking"],
  ["製作排期跟進", "Production schedule follow-up"],
  ["品質檢查", "Quality inspection"],
  ["包裝與裝櫃準備", "Packing and loading preparation"],
  ["出貨資料核對", "Shipping documentation review"],
  ["貨運追蹤", "Shipment tracking"],
  ["分批交付核對", "Split delivery review"],
  ["交付驗收", "Client handover"],
  ["項目歸檔", "Project archive"]
];
export function supportStage(stage) {
  const entry = names[Number(stage) - 1];
  return entry ? { zh: entry[0], en: entry[1] } : { zh: "階段待確認", en: "Stage to be confirmed" };
}
