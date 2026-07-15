import { createHash } from "node:crypto";
import { createSupabaseAdmin } from "../lib/supabaseAdmin.mjs";
import { createQuoteAnalysis } from "../lib/quoteAnalyzer.mjs";

const projectId = process.argv[2];
const rfqCode = process.argv[3];
if (!projectId || !rfqCode) {
  throw new Error("Usage: node createS07TestQuotes.mjs <project-id> <rfq-code>");
}

const supabase = createSupabaseAdmin();
const project = await single(supabase.from("projects").select("*").eq("id", projectId).single());
const rfq = await single(
  supabase.from("rfq_batches").select("*").eq("project_id", projectId).eq("rfq_code", rfqCode).single()
);
const suppliers = await rows(supabase.from("suppliers").select("*").eq("is_active", true));
const byName = (fragment) => suppliers.find((supplier) => supplier.name.includes(fragment));
const quantity = (rfq.payload?.document?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 15;
const item = rfq.payload?.document?.items?.[0] || {};
const fixtures = [
  {
    supplier: byName("豪森"),
    quoteCode: "TEST-HANSEN-20260716",
    unitPrice: 112,
    moq: 10,
    leadTimeDays: 32,
    qualityScore: 88,
    reliabilityScore: 86,
    paymentTerms: "30% deposit, 70% after pre-shipment inspection",
    material: `${item.materialEn || item.materialCn || "RFQ material"}; dimensions and UK Crib 5 requirement confirmed subject to certificate review.`,
    risk: "Lowest executable test price. Final fabric colour code and foam density require written approval.",
    note: "Sample: USD 180, refundable after bulk order. Export carton included."
  },
  {
    supplier: byName("鼎盛"),
    quoteCode: "TEST-DINGSHENG-20260716",
    unitPrice: 119,
    moq: 30,
    leadTimeDays: 24,
    qualityScore: 82,
    reliabilityScore: 78,
    paymentTerms: "40% deposit, 60% before shipment",
    material: `${item.materialEn || item.materialCn || "RFQ material"}; metal frame confirmed, upholstery subcontracted.`,
    risk: `MOQ 30 exceeds the requested ${quantity} units; price is not executable unless quantity is increased.`,
    note: "Fastest metal-frame schedule. Fabric and Crib 5 evidence depend on an upholstery subcontractor."
  },
  {
    supplier: byName("英伦"),
    quoteCode: "TEST-ELITE-20260716",
    unitPrice: 126,
    moq: 15,
    leadTimeDays: 22,
    qualityScore: 94,
    reliabilityScore: 91,
    paymentTerms: "30% deposit, 60% before shipment, 10% after inspection",
    material: `${item.materialEn || item.materialCn || "RFQ material"}; upholstery workmanship, Navy sample and Crib 5 document pack included.`,
    risk: "Higher price; confirm whether the shorter lead time and stronger documentation justify the premium.",
    note: "Pre-production colour sample and four-angle QC photo set included."
  }
];

if (fixtures.some((fixture) => !fixture.supplier)) throw new Error("The three expected test suppliers were not found.");

const saved = [];
for (const fixture of fixtures) {
  const payload = {
    project_id: projectId,
    rfq_batch_id: rfq.id,
    supplier_id: fixture.supplier.id,
    supplier_name: fixture.supplier.name,
    quote_code: fixture.quoteCode,
    currency: "USD",
    unit_price: fixture.unitPrice,
    total_amount: fixture.unitPrice * quantity,
    moq: fixture.moq,
    lead_time_days: fixture.leadTimeDays,
    payment_terms: fixture.paymentTerms,
    material_confirmation: fixture.material,
    validity_until: "2026-08-31",
    quality_score: fixture.qualityScore,
    reliability_score: fixture.reliabilityScore,
    risk_notes: fixture.risk,
    notes: fixture.note,
    received_at: new Date().toISOString(),
    status: "quoted",
    payload: {
      test_fixture: true,
      source_rfq_code: rfq.rfq_code,
      generated_for_testing_at: new Date().toISOString(),
      supplier_response_document: {
        title: `${fixture.supplier.name} quotation response to ${rfq.rfq_code}`,
        items: (rfq.payload?.document?.items || []).map((rfqItem) => ({
          itemNo: rfqItem.itemNo,
          description: rfqItem.nameEn || rfqItem.nameCn,
          quantity: rfqItem.quantity,
          unitPrice: fixture.unitPrice,
          total: fixture.unitPrice * Number(rfqItem.quantity || 0),
          dimensions: rfqItem.dimensions,
          materialConfirmation: fixture.material
        })),
        commercialTerms: {
          moq: fixture.moq,
          leadTimeDays: fixture.leadTimeDays,
          paymentTerms: fixture.paymentTerms,
          validityUntil: "2026-08-31"
        },
        deviationsAndRisks: fixture.risk,
        supplierNotes: fixture.note
      }
    }
  };
  const existing = await maybeSingle(
    supabase.from("supplier_quotes").select("id").eq("project_id", projectId).eq("quote_code", fixture.quoteCode).maybeSingle()
  );
  const query = existing
    ? supabase.from("supplier_quotes").update(payload).eq("id", existing.id).select("*").single()
    : supabase.from("supplier_quotes").insert(payload).select("*").single();
  saved.push(await single(query));
}

const analysis = await createQuoteAnalysis({ project, rfq, quotes: saved, suppliers });
const hash = createHash("sha256").update(JSON.stringify(analysis)).digest("hex");
await single(
  supabase
    .from("project_files")
    .insert({
      project_id: projectId,
      stage_id: "S07",
      file_group: "quote_analysis",
      file_name: `${rfq.rfq_code}-quote-analysis-test.json`,
      sha256: hash,
      audit_hash: hash,
      payload: { analysis, version: 1, test_fixture: true }
    })
    .select("*")
    .single()
);

for (const row of analysis.quotes) {
  const source = saved.find((quote) => quote.id === row.id);
  await checked(
    supabase
      .from("supplier_quotes")
      .update({
        ai_verdict: row.id === analysis.recommendation.quoteId ? "recommended_lowest_executable_price" : `rank_${row.rank}`,
        recommendation: row.id === analysis.recommendation.quoteId ? analysis.recommendation.reasonCn : row.aiSummaryCn,
        payload: {
          ...(source.payload || {}),
          ai_analysis: {
            analysisHash: hash,
            generatedAt: analysis.generation.generatedAt,
            rank: row.rank,
            totalScore: row.totalScore,
            priceDeltaPercent: row.priceDeltaPercent,
            risks: row.risks,
            recommended: row.id === analysis.recommendation.quoteId
          }
        }
      })
      .eq("id", row.id)
  );
}

await checked(
  supabase.from("workflow_events").insert({
    project_id: projectId,
    stage_id: "S07",
    event_type: "ai_quote_analysis_test_generated",
    actor: "Crafton AI",
    message_cn: `已建立并分析 3 份测试报价，最低可执行价：${analysis.recommendation.supplierName}。`,
    message_en: `Created and analyzed three test quotes. Lowest executable price: ${analysis.recommendation.supplierName}.`,
    payload: { rfq_batch_id: rfq.id, analysis_hash: hash, test_fixture: true }
  })
);

console.log(
  JSON.stringify(
    {
      rfqCode: analysis.rfqCode,
      generation: analysis.generation,
      recommendation: analysis.recommendation,
      ranking: analysis.quotes.map((quote) => ({
        rank: quote.rank,
        supplier: quote.supplierName,
        unitPrice: quote.unitPrice,
        total: quote.normalizedTotal,
        moq: quote.moq,
        leadTimeDays: quote.leadTimeDays,
        score: quote.totalScore,
        executable: quote.commerciallyExecutable,
        risks: quote.risks
      })),
      auditHash: hash
    },
    null,
    2
  )
);

async function rows(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function single(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function maybeSingle(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function checked(query) {
  const { error } = await query;
  if (error) throw error;
}
