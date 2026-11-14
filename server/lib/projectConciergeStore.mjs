import { supportError } from "./projectConcierge.mjs";
import { supportProjectContext } from "./projectConciergeContext.mjs";

async function read(query) {
  const { data, error } = await (query.abortSignal ? query.abortSignal(AbortSignal.timeout(15000)) : query);
  if (error) throw supportError("Support records could not be saved or loaded. Please try again.", 503);
  return data;
}
export function supabaseConciergeStore(db) {
  const sessions = "project_support_sessions",
    turns = "project_support_turns",
    reviews = "project_support_reviews";
  return {
    projects: (user) =>
      read(
        db
          .from("projects")
          .select("id,name,current_stage,lifecycle_status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200)
      ),
    async context(user, projectId) {
      if (!/^[0-9a-f-]{36}$/i.test(projectId || "")) throw supportError("Select a project.");
      const project = await read(
        db
          .from("projects")
          .select("id,user_id,name,current_stage,lifecycle_status,client_contact,created_at")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .maybeSingle()
      );
      if (!project) throw supportError("Project not found in your account.", 404);
      const [profile, specifications, production, shipping, jobs, events] = await Promise.all([
        read(db.from("user_profiles").select("full_name,company,locale").eq("user_id", user.id).maybeSingle()),
        read(
          db
            .from("specifications")
            .select("id,item_type_cn,item_type_en,quantity,material_cn,material_en,created_at")
            .eq("project_id", project.id)
            .order("created_at")
            .limit(150)
        ),
        read(
          db
            .from("production_updates")
            .select("id,item_name,process_name,status,progress_percent,reported_at")
            .eq("project_id", project.id)
            .order("reported_at", { ascending: false })
            .limit(30)
        ),
        read(
          db
            .from("shipments")
            .select("id,reference_number,carrier,origin,destination,etd,eta,status,current_location,updated_at")
            .eq("project_id", project.id)
            .order("updated_at", { ascending: false })
            .limit(20)
        ),
        read(
          db
            .from("intake_jobs")
            .select(
              "id,user_id,requested_by,client_import_state,review_status,rfq_status,updated_at,items:result_json->items"
            )
            .eq("project_id", project.id)
            .order("created_at")
            .limit(200)
        ),
        read(
          db
            .from("workflow_events")
            .select("stage_id,created_at")
            .eq("project_id", project.id)
            .order("created_at", { ascending: false })
            .limit(100)
        )
      ]);
      return supportProjectContext({ user, project, profile, specifications, production, shipping, jobs, events });
    },
    listSessions: (ownerId) => {
      let query = db.from(sessions).select("*").order("updated_at", { ascending: false }).limit(200);
      if (ownerId) query = query.eq("user_id", ownerId);
      return read(query);
    },
    getSession: (id) => read(db.from(sessions).select("*").eq("id", id).maybeSingle()),
    createSession: (row) => read(db.from(sessions).insert(row).select().single()),
    updateSession: (id, patch) => read(db.from(sessions).update(patch).eq("id", id)),
    turns: (id) => read(db.from(turns).select("*").eq("session_id", id).order("created_at").order("id").limit(120)),
    findRequest: (userId, requestId) =>
      read(db.from(turns).select("*").eq("user_id", userId).eq("request_id", requestId).maybeSingle()),
    createTurn: (row) => read(db.from(turns).insert(row)),
    updateTurn: (id, patch) => read(db.from(turns).update(patch).eq("id", id)),
    async acquire(userId) {
      const { data, error } = await db
        .rpc("acquire_project_support", { p_user_id: userId })
        .abortSignal(AbortSignal.timeout(15000));
      if (error?.message === "Support rate limit")
        throw supportError("Too many messages. Please wait one minute.", 429);
      if (error?.message === "Support request active")
        throw supportError("A reply is already in progress. Please wait.", 409);
      if (error) throw supportError("Support is temporarily unavailable. Please retry.", 503);
      return data;
    },
    release: (userId, leaseId) => read(db.rpc("release_project_support", { p_user_id: userId, p_lease_id: leaseId })),
    recoverPending: (userId) => read(db.rpc("recover_project_support", { p_user_id: userId })),
    finishTurn: (turn, needsReview) =>
      read(
        db.rpc("finish_project_support_turn", {
          p_turn_id: turn.id,
          p_answer: turn.answer,
          p_sources: turn.sources,
          p_engine: turn.engine,
          p_needs_review: Boolean(needsReview)
        })
      ),
    reviews: (id) => read(db.from(reviews).select("*").eq("session_id", id).order("created_at", { ascending: false })),
    async reviewSession({ sessionId, reviewerId, expectedUpdatedAt, note, status }) {
      const { error } = await db.rpc("review_project_support", {
        p_session_id: sessionId,
        p_reviewer_id: reviewerId,
        p_expected_updated_at: expectedUpdatedAt,
        p_note: note,
        p_status: status
      });
      if (error?.message === "Conversation changed")
        throw supportError("This conversation changed. Refresh and review the latest messages.", 409);
      if (error) throw supportError("Review could not be saved. Please try again.", 503);
    }
  };
}
