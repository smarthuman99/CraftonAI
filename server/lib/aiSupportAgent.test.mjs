import assert from "node:assert/strict";
import test from "node:test";
import { createAiSupportReply } from "./aiSupportAgent.mjs";

test("AI support keeps the authoritative lifecycle and production summary", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.DEEPSEEK_API_KEY;
  let capturedBody;
  process.env.DEEPSEEK_API_KEY = "test-key";
  globalThis.fetch = async (_url, options) => {
    capturedBody = JSON.parse(options.body);
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reply: "Terra project 已进入 S09 生产阶段。",
                intent: "progress_inquiry",
                matchedProjectId: "terra-job",
                matchedProjectName: "Terra project",
                orderOverview: "S09 production",
                extracted: {},
                readyToSubmit: false
              })
            }
          }
        ]
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    await createAiSupportReply({
      messages: [{ sender: "client", text: "Terra project 进度去到边度？" }],
      context: {
        preferredLanguage: "Cn",
        projectOverview: {
          latestOrder: {
            jobId: "terra-job",
            projectName: "Terra project",
            reviewStatus: "rfq_ready",
            rfqStatus: "draft",
            currentStage: 9,
            stageId: "S09",
            lifecycle: {
              stageNumber: 9,
              stageId: "S09",
              phase: "production",
              status: "in_production",
              source: "projects.current_stage",
              production: {
                updateCount: 6,
                pendingReviewCount: 1,
                revisionRequiredCount: 5,
                maxProgressPercent: 100,
                latestProcess: "material_procurement",
                latestStatus: "pending_review",
                riskLevel: "low"
              }
            }
          }
        }
      }
    });

    const contextMessage = capturedBody.messages[1].content;
    assert.match(capturedBody.messages[0].content, /authoritative current status/);
    assert.match(contextMessage, /"stageId":"S09"/);
    assert.match(contextMessage, /"phase":"production"/);
    assert.match(contextMessage, /"pendingReviewCount":1/);
    assert.match(contextMessage, /"revisionRequiredCount":5/);
    assert.match(contextMessage, /"rfqStatus":"draft"/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = originalApiKey;
  }
});
