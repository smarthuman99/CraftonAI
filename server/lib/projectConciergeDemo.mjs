import { supportError } from "./projectConcierge.mjs";
import { supportStage } from "../../shared/supportStages.mjs";
import { randomUUID } from "node:crypto";

export const demoClient = { id: "e1000000-0000-4000-8000-000000000001", app_metadata: {} };
export const demoReviewer = { id: "e1000000-0000-4000-8000-000000000002", app_metadata: { role: "admin" } };
const projectA = "a1000000-0000-4000-8000-000000000001";
const projectB = "a1000000-0000-4000-8000-000000000002";
export const demoProjects = [
  {
    id: projectA,
    name: "The Henley · Riverside Suites",
    current_stage: 9,
    client_contact: "London, United Kingdom",
    created_at: "2026-10-08T09:00:00Z"
  },
  {
    id: projectB,
    name: "Mayfair · Private Residence",
    current_stage: 5,
    client_contact: "London, United Kingdom",
    created_at: "2026-10-28T09:00:00Z"
  }
];
export function demoContext(projectId) {
  const project = demoProjects.find((p) => p.id === projectId);
  if (!project) throw supportError("Project not found in your account.", 404);
  const items =
    projectId === projectA
      ? [
          {
            id: "demo-chair",
            item_type_en: "Lounge armchair",
            item_type_cn: "休閒扶手椅",
            quantity: 24,
            material_en: "Solid oak frame · oatmeal linen",
            material_cn: "實心橡木框架 · 燕麥色亞麻"
          },
          {
            id: "demo-table",
            item_type_en: "Side table",
            item_type_cn: "邊桌",
            quantity: 12,
            material_en: "Walnut veneer · brushed brass base",
            material_cn: "胡桃木飾面 · 拉絲黃銅底座"
          }
        ]
      : [
          {
            id: "demo-sofa",
            item_type_en: "Bespoke sofa",
            item_type_cn: "訂製沙發",
            quantity: 9,
            material_en: "Bouclé upholstery · oak legs (sample pending)",
            material_cn: "圈圈絨面料 · 橡木椅腳（色樣待確認）"
          }
        ];
  const production =
    projectId === projectA
      ? [
          {
            id: "demo-frame",
            item_name: "Lounge armchair / 休閒扶手椅",
            process_name: "Frame assembly",
            status: "in_progress",
            progress_percent: 75,
            reported_at: "2026-11-13T10:30:00Z"
          },
          {
            id: "demo-finish",
            item_name: "Side table / 邊桌",
            process_name: "Finishing",
            status: "in_progress",
            progress_percent: 40,
            reported_at: "2026-11-13T10:30:00Z"
          }
        ]
      : [];
  const retrievedAt = new Date().toISOString();
  return {
    profile: { full_name: "Sarah Jenkins", company: "Jenkins Interior Studio", locale: "en" },
    project: { ...project, stage_name: supportStage(project.current_stage) },
    items,
    production,
    shipping: [],
    retrievedAt,
    sources: [
      {
        id: "project",
        label: project.name,
        detail: `S${String(project.current_stage).padStart(2, "0")} · project record`,
        retrievedAt
      },
      { id: "items", label: "Product specifications / 產品規格", detail: `${items.length} product lines`, retrievedAt },
      {
        id: "production",
        label: "Production reports / 生產回報",
        detail: "13 Nov 2026 · reported figures",
        retrievedAt
      },
      {
        id: "shipping",
        label: "Shipment records / 貨運記錄",
        detail: "No shipment or confirmed date recorded",
        retrievedAt
      },
      {
        id: "profile",
        label: "Account profile / 帳戶資料",
        detail: "Sarah Jenkins · Jenkins Interior Studio",
        retrievedAt
      }
    ]
  };
}

// Synthetic data only. The production server never imports this adapter.
export function demoConciergeStore({ state = { sessions: [], turns: [], reviews: [] }, persist = () => {} } = {}) {
  const clone = (v) => structuredClone(v);
  const commit = (mutate) => {
    const next = clone(state);
    const result = mutate(next);
    persist(next);
    state = next;
    return clone(result);
  };
  return {
    projects: async (user) => (user.id === demoClient.id ? clone(demoProjects) : []),
    context: async (user, id) => {
      if (user.id !== demoClient.id) throw supportError("Project not found in your account.", 404);
      return demoContext(id);
    },
    listSessions: async (owner) =>
      clone(
        state.sessions
          .filter((s) => !owner || s.user_id === owner)
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      ),
    getSession: async (id) => clone(state.sessions.find((s) => s.id === id) || null),
    createSession: async (row) =>
      commit((s) => {
        s.sessions.push(row);
        return row;
      }),
    updateSession: async (id, patch) =>
      commit((s) =>
        Object.assign(
          s.sessions.find((r) => r.id === id),
          patch
        )
      ),
    turns: async (id) => clone(state.turns.filter((t) => t.session_id === id)),
    findRequest: async (userId, requestId) =>
      clone(state.turns.find((t) => t.user_id === userId && t.request_id === requestId) || null),
    createTurn: async (row) =>
      commit((s) => {
        if (s.turns.some((t) => t.user_id === row.user_id && t.request_id === row.request_id))
          throw supportError("Duplicate message.", 409);
        s.turns.push(row);
        return row;
      }),
    updateTurn: async (id, patch) =>
      commit((s) =>
        Object.assign(
          s.turns.find((r) => r.id === id),
          patch
        )
      ),
    reviews: async (id) => clone(state.reviews.filter((r) => r.session_id === id).reverse()),
    reviewSession: async ({ sessionId, reviewerId, expectedUpdatedAt, note, status }) =>
      commit((s) => {
        const row = s.sessions.find((r) => r.id === sessionId);
        if (row.updated_at !== expectedUpdatedAt)
          throw supportError("This conversation changed. Refresh and review the latest messages.", 409);
        const created_at = new Date().toISOString();
        s.reviews.push({ id: randomUUID(), session_id: sessionId, reviewer_id: reviewerId, note, status, created_at });
        Object.assign(row, { status, updated_at: created_at });
        return { ok: true };
      })
  };
}
