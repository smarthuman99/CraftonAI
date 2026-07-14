import assert from "node:assert/strict";
import test from "node:test";

import { parseIntakeBrief } from "./intakeProcessor.mjs";

test("deterministic parser turns quantity text into itemized requirements", async () => {
  process.env.DEEPSEEK_API_KEY = "";

  const result = await parseIntakeBrief({
    job: {
      project_name: "St Albans Boutique Hotel Lobby",
      destination: "London, UK",
      quantity_text: "40 Lobby Armchairs linen W:65cm D:60cm H:85cm, 20 VIP Club Chairs velvet",
      brief_text: "Need UK Crib 5 compliance and matte black metal legs."
    },
    file: { original_name: "brief.txt", mime_type: "text/plain" },
    sourceText: ""
  });

  assert.equal(result.project.name, "St Albans Boutique Hotel Lobby");
  assert.equal(result.project.destination, "London, UK");
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].quantity, 40);
  assert.match(result.items[0].item_type_en, /Lobby Armchairs/i);
  assert.equal(result.items[0].material_en, "Linen (to confirm)");
  assert.equal(result.items[1].quantity, 20);
  assert.equal(result.items[1].material_en, "Velvet (to confirm)");
  assert.ok(result.questions.every((question) => !/Crib 5/.test(question)));
});

test("deterministic parser uses readable uploaded text when form fields are sparse", async () => {
  process.env.DEEPSEEK_API_KEY = "";

  const result = await parseIntakeBrief({
    job: {
      project_name: "",
      destination: "",
      quantity_text: "",
      brief_text: "Project: Riverside serviced apartments\nDestination: Manchester receiving warehouse"
    },
    file: { original_name: "requirements.csv", mime_type: "text/csv" },
    sourceText: [
      "item,quantity,material,notes",
      "Oak coffee tables,12,oak,W:900mm D:600mm H:420mm",
      "Leather dining chairs,48,leather,color cognac"
    ].join("\n")
  });

  assert.equal(result.project.name, "Riverside serviced apartments");
  assert.equal(result.project.destination, "Manchester receiving warehouse");
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].quantity, 12);
  assert.equal(result.items[0].material_en, "Oak (to confirm)");
  assert.equal(result.items[1].quantity, 48);
  assert.equal(result.items[1].material_en, "Leather (to confirm)");
  assert.ok(result.questions.some((question) => /fire-safety/i.test(question)));
});
