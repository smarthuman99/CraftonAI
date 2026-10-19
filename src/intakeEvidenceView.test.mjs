import test from "node:test";
import assert from "node:assert/strict";
import { buildIntakeEvidenceView, evidenceItemLabel } from "./intakeEvidenceView.mjs";

const field = (status, name = "material") => ({ field: name, value: "Oak", status });
function fixture() {
  return {
    items: [
      { item_ref: "OF01", item_type_en: "Office chair", item_type_cn: "办公椅" },
      { item_type_en: "Dining table" }
    ],
    evidence_gate: {
      final: {
        status: "passed",
        items: [
          {
            item_index: 0,
            item_ref: "REVIEW-ITEM-1",
            fields: [field("supported"), field("not_marked_in_source", "optional")]
          },
          { item_index: 1, item_ref: "REVIEW-ITEM-2", fields: [field("supported")] }
        ],
        unresolved_risks: []
      }
    },
    risk_review: { status: "completed", issues: [], failures: [] },
    review_routing: { route: "ready_for_approval", proposed_client_questions: [] }
  };
}

test("completed records stay available but do not fill the pending list", () => {
  const view = buildIntakeEvidenceView(fixture());
  assert.equal(view.rows.length, 2);
  assert.equal(view.pendingRows.length, 0);
  assert.equal(view.needsReview, false);
});

test("missing, partial, unverified and confirmed source gaps remain actionable; unknown states fail closed", () => {
  const result = fixture();
  result.evidence_gate.final.items[1].fields.push(
    ...["missing", "unverified", "partial", "source_partial", "source_missing", "new_status"].map((s) => field(s))
  );
  const view = buildIntakeEvidenceView(result);
  assert.deepEqual(
    view.pendingRows.map((r) => r.item_index),
    [1]
  );
  assert.equal(view.pendingRows[0].pendingFields.length, 6);
  assert.equal(view.rows[1].fields.length, 7);
  assert.equal(view.needsReview, true);
});

test("conflicts and unresolved risks retain rows even with fully supported fields", () => {
  const result = fixture();
  result.items[0].review_conflicts = ["Quantity conflicts with the schedule"];
  result.evidence_gate.final.unresolved_risks = [{ code: "shared_image_mapping", item_index: 1, field: "image" }];
  const view = buildIntakeEvidenceView(result);
  assert.equal(view.pendingRows.length, 2);
  assert.equal(view.pendingRows[0].pendingFields.length, 0);
  assert.equal(view.pendingRows[1].risks[0].field, "image");
});

test("project-only failures and approval routing cannot be hidden by zero pending furniture", () => {
  for (const change of [
    (r) => {
      r.review_routing.route = "internal_review";
    },
    (r) => {
      r.review_routing.route = "client_clarification";
    },
    (r) => {
      r.risk_review.status = "failed";
    },
    (r) => {
      r.risk_review.failures = [{ source_units: [2], reason: "Unreadable page" }];
    },
    (r) => {
      r.risk_review.issues = ["Quantity total mismatch"];
    },
    (r) => {
      r.review_routing.proposed_client_questions = ["Please confirm delivery location"];
    },
    (r) => {
      r.completeness_review = { status: "needs_review" };
    },
    (r) => {
      delete r.evidence_gate.final.status;
    }
  ]) {
    const result = fixture();
    change(result);
    const view = buildIntakeEvidenceView(result);
    assert.equal(view.pendingRows.length, 0);
    assert.equal(view.needsReview, true);
  }
});

test("unmatched risks are preserved as project reminders instead of being dropped", () => {
  const result = fixture();
  result.evidence_gate.final.unresolved_risks = [
    { code: "source_read_failure", item_index: null },
    { code: "unmatched_output_row", item_index: 99 }
  ];
  const view = buildIntakeEvidenceView(result);
  assert.equal(view.projectRisks.length, 2);
  assert.equal(view.pendingRows.length, 0);
  assert.equal(view.needsReview, true);
});

test("post-review completeness failures are included without duplicating gate risks", () => {
  const result = fixture();
  result.evidence_gate.final.unresolved_risks = [{ code: "spreadsheet_source_value_mismatch", item_index: 0 }];
  result.completeness_review = {
    status: "needs_review",
    issues: [
      { code: "source_value_mismatch", item_index: 0 },
      { code: "source_photo_not_verified", item_index: 1 },
      { code: "missing_source_row", row_id: "sheet1:15" }
    ]
  };
  const view = buildIntakeEvidenceView(result);
  assert.equal(view.pendingRows.length, 2);
  assert.equal(view.pendingRows[0].risks.length, 1);
  assert.equal(view.projectRisks.length, 1);
});

test("labels use the original item index and localized furniture identity, not the filtered list order", () => {
  const result = fixture();
  result.evidence_gate.final.items.reverse();
  const view = buildIntakeEvidenceView(result);
  assert.equal(evidenceItemLabel(view.rows[1], "En"), "OF01 · Office chair");
  assert.equal(evidenceItemLabel(view.rows[1], "Cn"), "OF01 · 办公椅");
  assert.equal(evidenceItemLabel(view.rows[0], "En"), "Dining table");
  assert.equal(evidenceItemLabel({ item_index: 3, item_ref: "REVIEW-ITEM-4" }, "En"), "Furniture item 4");
});

test("viewing evidence does not modify customer values, review records or routing", () => {
  const result = fixture();
  result.items[0].customer_notes = "Keep the customer's chosen finish";
  result.items[0].image_storage_path = "original-photo";
  result.items[0].image_sha256 = "thumbnail-revision";
  const before = structuredClone(result);
  const freeze = (value) => {
    Object.freeze(value);
    Object.values(value)
      .filter((v) => v && typeof v === "object")
      .forEach(freeze);
  };
  freeze(result);
  const view = buildIntakeEvidenceView(result);
  view.rows.forEach((row) => evidenceItemLabel(row, "En"));
  assert.deepEqual(result, before);
});

test("older results without a final gate do not invent a completed review", () => {
  assert.equal(buildIntakeEvidenceView(null), null);
  assert.equal(buildIntakeEvidenceView({}), null);
  assert.equal(buildIntakeEvidenceView({ evidence_gate: { initial: {} } }), null);
});
