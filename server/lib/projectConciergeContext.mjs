import { activeProjectJob, itemFields } from "../../shared/clientProjectEditing.mjs";
import { supportStage } from "../../shared/supportStages.mjs";
import { supportError } from "./projectConcierge.mjs";

const text = (value, max = 600) =>
  typeof value === "string" || typeof value === "number" ? String(value).slice(0, max) : "";
export function supportProjectContext({
  user,
  project,
  profile,
  specifications = [],
  jobs = [],
  production = [],
  shipping = [],
  events = []
}) {
  if (project.user_id !== user.id) throw supportError("Project not found in your account.", 404);
  const active = jobs.filter(activeProjectJob);
  if (active.some((job) => (job.user_id || job.requested_by) !== user.id))
    throw supportError("Project ownership records need to be checked by Crafton.", 403);
  const intakeItems = active.flatMap((job) =>
    (Array.isArray(job.items) ? job.items : []).map((item) => ({
      ...item,
      record_status: job.review_status,
      order_id: job.id
    }))
  );
  const items = (intakeItems.length ? intakeItems : specifications).slice(0, 150).map((item) => {
    const fields = itemFields(item);
    const rawQuantity = item.quantity ?? item.qty;
    return {
      id: text(item.id),
      order_id: text(item.order_id),
      item_type_en: text(item.item_type_en || item.typeEn || fields.name),
      item_type_cn: text(item.item_type_cn || item.typeCn || fields.name),
      quantity:
        rawQuantity !== null && rawQuantity !== undefined && rawQuantity !== "" && Number.isFinite(Number(rawQuantity))
          ? Number(rawQuantity)
          : null,
      quantity_text: text(item.quantity_text || item.qtyDisplay, 180),
      material_en: text(item.material_en || item.materialEn || fields.material),
      material_cn: text(item.material_cn || item.materialCn || fields.material),
      dimensions: text(fields.dimensions),
      color: text(fields.color),
      finish: text(item.finish_en || item.finish_cn || item.finish),
      location: text(fields.location),
      sku: text(item.sku || item.source_item_code, 150),
      record_status: text(item.record_status || "recorded")
    };
  });
  const stage = Math.min(
    17,
    Math.max(
      Number(project.current_stage) || 1,
      ...events.map((event) => Number(String(event.stage_id || "").match(/^S(\d{1,2})$/)?.[1]) || 1),
      ...active.map((job) =>
        ["approved", "rfq_ready"].includes(job.review_status) || ["draft", "sent"].includes(job.rfq_status)
          ? 6
          : job.review_status === "revision_requested"
            ? 2
            : job.items?.length
              ? 3
              : 1
      )
    )
  );
  const retrievedAt = new Date().toISOString();
  return {
    profile: {
      full_name: text(profile?.full_name || "Client", 200),
      company: text(profile?.company, 200),
      locale: text(profile?.locale, 20)
    },
    project: {
      id: project.id,
      name: project.name,
      current_stage: stage,
      stage_name: supportStage(stage),
      lifecycle_status: project.lifecycle_status,
      destination: text(project.client_contact),
      created_at: project.created_at
    },
    items,
    production,
    shipping,
    retrievedAt,
    orders: active.map((job) => ({
      id: job.id,
      review_status: job.review_status,
      rfq_status: job.rfq_status,
      updated_at: job.updated_at
    })),
    coverage: {
      items: `${items.length} of ${intakeItems.length || specifications.length} product lines included; pending/revision records are not approved specifications`,
      production: "Up to 30 latest reported work packages; not overall completion",
      shipping: "Up to 20 shipment records; ETA/ETD are estimates"
    },
    sources: [
      {
        id: "project",
        label: project.name,
        detail: `S${String(stage).padStart(2, "0")} · ${project.lifecycle_status || "active"}`,
        retrievedAt
      },
      {
        id: "items",
        label: "Product specifications / 產品規格",
        detail: `${items.length} recorded lines · ${intakeItems.length ? "portal order records" : "specifications"}`,
        retrievedAt
      },
      {
        id: "production",
        label: "Production reports / 生產回報",
        detail: `${production.length} reported work packages`,
        retrievedAt
      },
      {
        id: "shipping",
        label: "Shipment records / 貨運記錄",
        detail: `${shipping.length} shipments · ETA is an estimate`,
        retrievedAt
      },
      { id: "profile", label: "Account profile / 帳戶資料", detail: "Name & company", retrievedAt }
    ]
  };
}
