import test from "node:test";
import assert from "node:assert/strict";
import { analyzeQuotesDeterministically } from "./quoteAnalyzer.mjs";

const context = {
  project: { id: "project-1", name: "Test hotel" },
  rfq: { id: "rfq-1", rfq_code: "RFQ-TEST", payload: { document: { items: [{ quantity: 15 }] } } },
  suppliers: [
    { id: "supplier-a", name: "Supplier A", rating: 4.8 },
    { id: "supplier-b", name: "Supplier B", rating: 4.6 },
    { id: "supplier-c", name: "Supplier C", rating: 4.9 }
  ],
  quotes: [
    {
      id: "quote-a",
      supplier_id: "supplier-a",
      currency: "USD",
      unit_price: 112,
      total_amount: 1680,
      moq: 10,
      lead_time_days: 32,
      payment_terms: "30/70",
      material_confirmation: "Confirmed",
      validity_until: "2026-08-31",
      quote_code: "A-1"
    },
    {
      id: "quote-b",
      supplier_id: "supplier-b",
      currency: "USD",
      unit_price: 119,
      total_amount: 1785,
      moq: 30,
      lead_time_days: 24,
      payment_terms: "30/70",
      material_confirmation: "Confirmed",
      validity_until: "2026-08-31",
      quote_code: "B-1"
    },
    {
      id: "quote-c",
      supplier_id: "supplier-c",
      currency: "USD",
      unit_price: 126,
      total_amount: 1890,
      moq: 15,
      lead_time_days: 22,
      payment_terms: "40/60",
      material_confirmation: "Confirmed",
      validity_until: "2026-08-31",
      quote_code: "C-1"
    }
  ]
};

test("recommends the strongest weighted value and rejects an excessive MOQ", () => {
  const result = analyzeQuotesDeterministically(context);
  assert.equal(result.recommendation.quoteId, "quote-c");
  assert.equal(result.recommendation.basis, "best_weighted_value");
  assert.equal(result.recommendation.isLowestPrice, false);
  assert.equal(result.quotes[0].id, "quote-c");
  assert.equal(result.priceBenchmark.lowestExecutableQuoteId, "quote-a");
  const blockedQuote = result.quotes.find((quote) => quote.id === "quote-b");
  assert.equal(blockedQuote.commerciallyExecutable, false);
  assert.ok(blockedQuote.scoreBreakdown.price <= 40);
  assert.match(blockedQuote.risks.join(" "), /MOQ 30/);
});

test("preserves verified prices and calculates savings", () => {
  const result = analyzeQuotesDeterministically(context);
  const quote = result.quotes.find((row) => row.id === "quote-a");
  assert.equal(quote.unitPrice, 112);
  assert.equal(quote.normalizedTotal, 1680);
  assert.equal(result.priceBenchmark.spread, 210);
  assert.equal(result.recommendation.pricePremiumVsLowest, 210);
});

test("does not recommend across unnormalized currencies", () => {
  const result = analyzeQuotesDeterministically({
    ...context,
    quotes: context.quotes.map((quote) => (quote.id === "quote-c" ? { ...quote, currency: "CNY" } : quote))
  });

  assert.equal(result.comparisonCurrency, null);
  assert.equal(result.recommendation, null);
  assert.match(result.warnings.join(" "), /different currencies/i);
});

test("uses the latest supplier revision and flags incomplete BOM pricing", () => {
  const result = analyzeQuotesDeterministically({
    ...context,
    rfq: {
      ...context.rfq,
      supplier_ids: ["supplier-a", "supplier-b", "supplier-c"],
      payload: { document: { items: [{ quantity: 10 }, { quantity: 5 }] } }
    },
    quotes: [
      ...context.quotes,
      {
        ...context.quotes[0],
        id: "quote-a-revision",
        updated_at: "2026-08-09T10:00:00Z",
        payload: {
          line_items: [{ item_no: "ITEM-01", quantity: 10, unit_price: 100, line_total: 1000 }]
        }
      }
    ]
  });

  const supplierA = result.quotes.find((quote) => quote.supplierId === "supplier-a");
  assert.equal(result.quotes.length, 3);
  assert.equal(supplierA.id, "quote-a-revision");
  assert.equal(supplierA.lineItemCoverage, 50);
  assert.equal(supplierA.commerciallyExecutable, false);
  assert.match(result.warnings.join(" "), /older supplier quote revision/i);
});

test("normalizes supplier workbook totals and applies line-level MOQ and lead time", () => {
  const result = analyzeQuotesDeterministically({
    ...context,
    quotes: context.quotes.map((quote) =>
      quote.id === "quote-a"
        ? {
            ...quote,
            payload: {
              supplier_return: { workbook_total: 1500 },
              line_items: [
                {
                  item_no: "ITEM-01",
                  quantity: 15,
                  unit_price: 112,
                  line_total: 1680,
                  line_moq: 25,
                  lead_time_days: 45,
                  material_confirmation: "Confirmed"
                }
              ]
            }
          }
        : quote
    )
  });

  const supplierA = result.quotes.find((quote) => quote.id === "quote-a");
  assert.equal(supplierA.normalizedTotal, 1680);
  assert.equal(supplierA.supplierWorkbookTotal, 1500);
  assert.equal(supplierA.moq, 25);
  assert.equal(supplierA.leadTimeDays, 45);
  assert.equal(supplierA.commerciallyExecutable, false);
  assert.match(supplierA.risks.join(" "), /workbook total/i);
});
