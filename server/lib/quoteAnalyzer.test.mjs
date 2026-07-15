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

test("recommends the lowest executable price and rejects an excessive MOQ", () => {
  const result = analyzeQuotesDeterministically(context);
  assert.equal(result.recommendation.quoteId, "quote-a");
  assert.equal(result.recommendation.basis, "lowest_executable_price");
  assert.equal(result.quotes.find((quote) => quote.id === "quote-b").commerciallyExecutable, false);
  assert.match(result.quotes.find((quote) => quote.id === "quote-b").risks.join(" "), /MOQ 30/);
});

test("preserves verified prices and calculates savings", () => {
  const result = analyzeQuotesDeterministically(context);
  const quote = result.quotes.find((row) => row.id === "quote-a");
  assert.equal(quote.unitPrice, 112);
  assert.equal(quote.normalizedTotal, 1680);
  assert.equal(result.recommendation.savingsVsHighest, 210);
});
