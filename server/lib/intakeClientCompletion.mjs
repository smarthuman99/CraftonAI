const CLIENT_COMPLETION_VERSION = 1;

const clean = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const uniqueQuestions = (values = []) => {
  const seen = new Set();
  return values.reduce((rows, value) => {
    const question = clean(value);
    const key = question.toLocaleLowerCase();
    if (!question || seen.has(key)) return rows;
    seen.add(key);
    rows.push(question);
    return rows;
  }, []);
};

const INTERNAL_EXCEPTION_PATTERN =
  /\b(?:cho|crafton)\s+(?:must|should|needs? to)|manual(?:ly)?\s+(?:review|check)|automated (?:image|document) understanding was not completed|could not fully read|source extraction status|vision analysis status/i;

const CRAFTON_OWNED_PATTERN =
  /\b(?:unit pric(?:e|ing)|supplier|quotation|quote|manufacturing method|production method|factory tolerance|costing)\b/i;

const normalizeIdentity = (value) =>
  clean(value)
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const resolveQuestionScope = (question, items = []) => {
  const normalizedQuestion = normalizeIdentity(question);
  const references = items
    .map((item, index) => ({ item, index, ref: normalizeIdentity(item.item_ref) }))
    .filter(({ ref }) => ref && ` ${normalizedQuestion} `.includes(` ${ref} `));
  if (references.length > 1) return { scope: "project", itemId: "", itemIndex: null };
  if (references.length === 1)
    return {
      scope: "item",
      itemId: clean(references[0].item.id || references[0].item.sku || references[0].item.item_ref),
      itemIndex: references[0].index
    };
  let bestMatch = null;

  items.forEach((item, index) => {
    const names = [item.item_type_en, item.item_type_cn, item.typeEn, item.typeCn]
      .map(normalizeIdentity)
      .filter((name) => name.length > 1);
    const directName = names.find((name) => normalizedQuestion.includes(name));
    if (!directName || (bestMatch && directName.length <= bestMatch.name.length)) return;
    bestMatch = {
      item,
      index,
      name: directName
    };
  });

  if (!bestMatch) return { scope: "project", itemId: "", itemIndex: null };
  return {
    scope: "item",
    itemId: clean(bestMatch.item.id || bestMatch.item.sku || bestMatch.item.sku_code),
    itemIndex: bestMatch.index
  };
};

const classifyQuestionOwner = (question) => {
  if (INTERNAL_EXCEPTION_PATTERN.test(question)) return "admin_exception";
  if (CRAFTON_OWNED_PATTERN.test(question) && !/target budget/i.test(question)) return "crafton";
  return "client";
};

export function prepareInitialClientCompletion({ result = {}, jobId = "job", createdAt = new Date().toISOString() }) {
  const normalizedResult = result && typeof result === "object" ? result : {};
  const items = Array.isArray(normalizedResult.items) ? normalizedResult.items : [];
  const evidenceBlocked =
    normalizedResult.review_routing?.route === "internal_review" ||
    normalizedResult.evidence_gate?.final?.status === "internal_review_required";
  const questions = uniqueQuestions([
    ...(Array.isArray(normalizedResult.open_questions) ? normalizedResult.open_questions : []),
    ...(Array.isArray(normalizedResult.questions) ? normalizedResult.questions : []),
    ...((evidenceBlocked || normalizedResult.quality_gate?.status === "manual_review_required") &&
    ![...(normalizedResult.open_questions || []), ...(normalizedResult.questions || [])].some((q) =>
      INTERNAL_EXCEPTION_PATTERN.test(q)
    )
      ? ["Crafton must review the failed document quality checks before approval."]
      : [])
  ]);
  const requestId = `CC-${clean(jobId) || "job"}`;
  const issueRegistry = questions.map((question, index) => {
    const scope = resolveQuestionScope(question, items);
    return {
      id: `${requestId}-Q${String(index + 1).padStart(2, "0")}`,
      question,
      owner: evidenceBlocked ? "admin_exception" : classifyQuestionOwner(question),
      scope: scope.scope,
      item_id: scope.itemId,
      item_index: scope.itemIndex,
      blocking_stage: "specification",
      status: "open"
    };
  });
  const clientItems = issueRegistry.filter((issue) => issue.owner === "client");
  const craftonTasks = issueRegistry.filter((issue) => issue.owner === "crafton");
  const adminExceptions = issueRegistry.filter((issue) => issue.owner === "admin_exception");
  const readyForApproval = clientItems.length === 0 && adminExceptions.length === 0 && items.length > 0;

  return {
    result: {
      ...normalizedResult,
      open_questions: questions,
      issue_registry: issueRegistry,
      crafton_tasks: craftonTasks,
      admin_exceptions: adminExceptions,
      clarification_request: {
        id: requestId,
        version: CLIENT_COMPLETION_VERSION,
        status: clientItems.length ? "sent" : "not_required",
        created_at: createdAt,
        questions: clientItems.map((item) => item.question),
        items: clientItems
      },
      clarification_workflow: {
        version: 2,
        status: readyForApproval
          ? "ready_for_approval"
          : clientItems.length
            ? "client_completion"
            : "manual_review_required",
        request_id: requestId,
        source_question_count: questions.length,
        client_question_count: clientItems.length,
        crafton_task_count: craftonTasks.length,
        admin_exception_count: adminExceptions.length,
        remaining_question_count: clientItems.length,
        continue_client_clarification: clientItems.length > 0,
        bom_draft_ready: readyForApproval,
        summary_en: readyForApproval
          ? "Intake check complete. The structured project draft is ready for Cho approval."
          : clientItems.length
            ? `Intake check complete. ${clientItems.length} client detail(s) need confirmation before approval.`
            : "Intake check complete. An exception needs Cho review before approval.",
        summary_cn: readyForApproval
          ? "已完成资料检查，结构化项目草稿可交由 Cho 审批。"
          : clientItems.length
            ? `已完成资料检查，客户仍需确认 ${clientItems.length} 项资料。`
            : "已完成资料检查，但有异常需要 Cho 审核。"
      }
    },
    clientItems,
    craftonTasks,
    adminExceptions,
    readyForApproval,
    jobState: {
      step: readyForApproval
        ? "ai_intake_ready_for_approval"
        : clientItems.length
          ? "client_completion"
          : "ai_intake_exception_review",
      reviewStatus: clientItems.length ? "revision_requested" : "pending",
      reviewNotes: readyForApproval
        ? "Intake check complete. Project draft is ready for Cho approval."
        : clientItems.length
          ? `Crafton found ${clientItems.length} client-owned detail(s) to complete.`
          : `Crafton found ${adminExceptions.length} exception(s) for Cho review.`
    }
  };
}

export const __test__ = { classifyQuestionOwner, resolveQuestionScope };
