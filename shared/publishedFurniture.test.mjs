import assert from "node:assert/strict";
import test from "node:test";
import { applyCataloguePhotos } from "./cataloguePhotos.mjs";
import {
  catalogueImageSources,
  classifyFurniture,
  deduplicateFurniture,
  groupFurniture,
  publicFurniture
} from "./publishedFurniture.mjs";

test("reviewed photos survive synchronization without leaking source metadata or changing specifications", () => {
  const product = { id: "cf-1", code: "CODE-1", dimensions: "500 mm", image: "", images: [] };
  const image = "/thecrafton-assets/project-catalogue/1234567890abcdef12345678.webp";
  const overrides = { "cf-1": { code: "CODE-1", images: [image], sources: [{ file: "private.xlsx", cell: "B8" }] } };
  const [updated] = applyCataloguePhotos([product], overrides);
  assert.equal(updated.image, image);
  assert.equal(updated.dimensions, product.dimensions);
  assert.equal("sources" in updated, false);
  assert.equal(product.image, "");
  assert.throws(() => applyCataloguePhotos([{ ...product, code: "DIFFERENT" }], overrides), /identity/);
  assert.throws(
    () => applyCataloguePhotos([product], { "cf-1": { code: product.code, images: ["/private/file"] } }),
    /Invalid/
  );
});

test("classifies furniture without confusing bedsides, benches or screen desks", () => {
  for (const [name, expected] of [
    ["Bedside table", "storage"],
    ["Screen Desk", "tables"],
    ["Screen", "accessories"],
    ["Window Bench", "chairs"],
    ["Banquette", "sofa"],
    ["Double bed", "beds"],
    ["Chest of drawers", "storage"],
    ["Ceiling Lamp Shade", "accessories"]
  ]) {
    assert.equal(classifyFurniture({ item_type_en: name }), expected, name);
  }
});

test("public records keep source uncertainty and exclude internal data and prices", () => {
  const result = publicFurniture(
    {
      sku: "SKU-1",
      item_type_en: "Chair",
      item_type_cn: "椅子",
      dimensions_text: "To confirm",
      material_en: "Fabric (to confirm)",
      material_cn: "布版",
      unit_price: 500,
      original_unit_price: 600,
      quantity: 264,
      user_id: "private-owner",
      tracking_url: "private-link",
      notes_en: "Internal client notes",
      technical_drawing: { storage_path: "private-drawing" },
      client_revisions: [{ previous: { email: "private-email" } }]
    },
    { id: "cf-1", images: ["/thecrafton-assets/project-catalogue/photo.webp"] }
  );
  assert.equal(result.dimensions, "");
  assert.equal(result.material, "Fabric (to confirm)");
  assert.equal(result.materialCn, "布版（待确认）");
  assert.equal(result.price, null);
  for (const field of [
    "user_id",
    "quantity",
    "unit_price",
    "original_unit_price",
    "tracking_url",
    "notes_en",
    "technical_drawing",
    "client_revisions"
  ])
    assert.equal(field in result, false, field);
  assert.doesNotMatch(JSON.stringify(result), /private-|Internal client/);
});

test("photos are restricted to this source owner and job, without generated drawings", () => {
  const job = { id: "job", user_id: "owner" };
  const path = "owner/derived/job/photo.jpg";
  const item = {
    image_storage_path: path,
    image_storage_bucket: "intake-files",
    image_storage_paths: [
      { storage_path: path, storage_bucket: "intake-files" },
      { storage_path: "other/derived/job/photo.jpg", storage_bucket: "intake-files" },
      { storage_path: "owner/derived/other/photo.jpg", storage_bucket: "intake-files" },
      { storage_path: "owner/derived/job/technical-drawings/concept.png", storage_bucket: "intake-files" },
      { storage_path: "owner/derived/job/../private.jpg", storage_bucket: "intake-files" },
      { storage_path: "owner/item-references/job/manual.jpg", storage_bucket: "intake-files" },
      { storage_path: "owner/derived/job/foreign.jpg", storage_bucket: "other-bucket" }
    ]
  };
  assert.deepEqual(
    catalogueImageSources(item, job).map((photo) => photo.storage_path),
    [path, "owner/item-references/job/manual.jpg"]
  );
});

test("deduplication keeps different sizes, finishes and uncertain records separate", () => {
  const base = {
    category: "chairs",
    name: "Chair",
    image: "/a.webp",
    images: ["/a.webp"],
    material: "Oak",
    dimensions: "500 x 600 x 800 mm",
    finish: "Natural",
    color: "Brown"
  };
  const result = deduplicateFurniture([
    { ...base, id: "one" },
    { ...base, id: "same", images: ["/a.webp", "/b.webp"] },
    { ...base, id: "size", dimensions: "600 x 600 x 800 mm" },
    { ...base, id: "finish", finish: "Painted" },
    { ...base, id: "unknown-1", dimensions: "" },
    { ...base, id: "unknown-2", dimensions: "" }
  ]);
  assert.equal(result.products.length, 5);
  assert.deepEqual(result.merged, [{ id: "same", into: "one" }]);
  assert.deepEqual(result.products[0].images, ["/a.webp", "/b.webp"]);
});

test("grouping prefers actual photos while missing-photo products remain discoverable", () => {
  const result = groupFurniture([
    { id: "no-photo", name: "A chair", category: "chairs", code: "1", image: "" },
    { id: "photo", name: "Z chair", category: "chairs", code: "2", image: "/a.webp" }
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].image, "/a.webp");
  assert.deepEqual(
    result[0].products.map((item) => item.id),
    ["photo", "no-photo"]
  );
});
