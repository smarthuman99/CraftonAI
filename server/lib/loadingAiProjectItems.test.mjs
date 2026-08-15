import assert from "node:assert/strict";
import test from "node:test";

import {
  dimensionsForLoadingItem,
  normalizeProjectItemsForLoading,
  parseLoadingDimensions
} from "../../src/loadingAiProjectItems.js";

test("converts furniture W x D x H text into Loading AI L x W x H millimetres", () => {
  assert.deepEqual(parseLoadingDimensions("W 2600 x D 1050 x H 760 mm"), {
    l: 2600,
    w: 1050,
    h: 760
  });
});

test("supports nested BOM dimensions and metre conversion", () => {
  assert.deepEqual(dimensionsForLoadingItem({ dimensions: { width: 2.8, depth: 0.98, height: 0.73, unit: "m" } }), {
    l: 2800,
    w: 980,
    h: 730
  });
});

test("prefers packed dimensions when both packed and product sizes exist", () => {
  assert.deepEqual(
    dimensionsForLoadingItem({
      dimensionsText: "W 2200 x D 900 x H 750 mm",
      packed_dimensions: "2300 x 1000 x 850 mm"
    }),
    { l: 2300, w: 1000, h: 850 }
  );
});

test("reads dimensions stored in canonical specification notes", () => {
  const result = normalizeProjectItemsForLoading([
    {
      id: "SF-103",
      item_type_en: "Mercer Three-Seat Sofa",
      quantity: 10,
      notes_en: "Walnut base / W 2240 x D 920 x H 790 mm / contract finish"
    }
  ]);

  assert.equal(result.omittedItems.length, 0);
  assert.deepEqual(
    { l: result.items[0].l, w: result.items[0].w, h: result.items[0].h, qty: result.items[0].qty },
    { l: 2240, w: 920, h: 790, qty: 10 }
  );
});

test("does not silently replace missing BOM dimensions with mock defaults", () => {
  const result = normalizeProjectItemsForLoading([
    { id: "valid", item_type_en: "Sofa", quantity: 2, dimensions_text: "2000 x 900 x 800 mm" },
    { id: "invalid", item_type_en: "Unknown chair", quantity: 5 }
  ]);

  assert.equal(result.items.length, 1);
  assert.deepEqual(result.omittedItems, [
    { id: "invalid", name: "Unknown chair", reason: "missing_dimensions" }
  ]);
});
