import React, { useCallback, useEffect, useState } from "react";
import { callWorkflowAi } from "./workflowAiClient.js";
import { ChangeRequestList } from "./ClientProjectEditor.jsx";
import { customerServiceError } from "../customerServiceCopy.js";

export default function ClientChangeReview({ lang, projectId, supabaseClient, onChanged }) {
  const [workspace, setWorkspace] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState({});
  const t = (cn, en) => (lang === "Cn" ? cn : en);
  const load = useCallback(async () => {
    if (!projectId || !supabaseClient) return;
    try {
      const data = await callWorkflowAi(supabaseClient, {
        action: "client_project_edit",
        operation: "read",
        projectId
      });
      setWorkspace(data);
      setMessage("");
    } catch (error) {
      setMessage(customerServiceError(error.message, lang));
    }
  }, [lang, projectId, supabaseClient]);
  useEffect(() => {
    setWorkspace(null);
    load();
  }, [load]);
  const requests = (workspace?.jobs || []).flatMap((job) =>
    (job.result_json?.client_change_requests || [])
      .filter((request) => ["pending", "in_review"].includes(request.status))
      .map((request) => ({ job, request }))
  );
  const respond = async (jobId, requestId, status) => {
    setBusy(true);
    try {
      await callWorkflowAi(supabaseClient, {
        action: "client_project_edit",
        operation: "review_request",
        projectId,
        version: workspace.version,
        jobId,
        requestId,
        status,
        note:
          notes[requestId] ??
          workspace.jobs
            .find((job) => job.id === jobId)
            ?.result_json?.client_change_requests?.find((request) => request.id === requestId)?.response ??
          ""
      });
      await load();
      await onChanged?.();
    } catch (error) {
      setMessage(customerServiceError(error.message, lang));
    } finally {
      setBusy(false);
    }
  };
  if (!projectId || !supabaseClient) return null;
  return (
    <details className="client-staff-changes">
      <summary>
        {t("客户变更申请", "Client change requests")} · {requests.length}
      </summary>
      <p>
        {t(
          "请核对修改内容并回复价格及交期影响。现行规格保持有效；确认新版本时仍需经过项目原有的规格、报价与生产审批流程。",
          "Review the proposed changes and respond with pricing and delivery implications. The current specification remains in effect; a new revision still follows the project's specification, quotation and production approvals."
        )}
      </p>
      <button type="button" className="client-project-tool" disabled={busy} onClick={load}>
        {t("刷新申请", "Refresh requests")}
      </button>
      {message && <p role="alert">{message}</p>}
      {requests.map(({ job, request }) => (
        <section key={request.id}>
          <ChangeRequestList lang={lang} jobs={[{ ...job, result_json: { client_change_requests: [request] } }]} />
          {request.kind === "import" && workspace.documents?.find((file) => file.id === job.id)?.url && (
            <a
              className="client-project-tool"
              href={workspace.documents.find((file) => file.id === job.id).url}
              target="_blank"
              rel="noreferrer"
            >
              {t("查看客户原文件", "View original client file")}
            </a>
          )}
          {request.kind === "import" && (
            <details>
              <summary>{t("追加与更新的家具", "Proposed furniture")}</summary>
              <ul>
                {request.additions.map((item, index) => (
                  <li key={`add-${index}`}>
                    + {item.item_type_en} · {item.quantity} · {item.material_en} · {item.dimensions_text}
                    {item.client_reference_preview && (
                      <a href={item.client_reference_preview} target="_blank" rel="noreferrer">
                        {" "}
                        · {t("参考照片", "Reference photo")}
                      </a>
                    )}
                  </li>
                ))}
                {request.updates.map((item, index) => (
                  <li key={`update-${index}`}>
                    {item.before.item_type_en} → {item.after.item_type_en} · {item.after.quantity} ·{" "}
                    {item.after.material_en} · {item.after.dimensions_text}
                    {item.after.client_reference_preview && (
                      <a href={item.after.client_reference_preview} target="_blank" rel="noreferrer">
                        {" "}
                        · {t("参考照片", "Reference photo")}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <label>
            {t("回复客户（必填）", "Response to client (required)")}
            <textarea
              value={notes[request.id] ?? request.response ?? ""}
              maxLength={4000}
              disabled={busy}
              onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
            />
          </label>
          <div className="client-edit-inline">
            <button
              type="button"
              className="client-project-tool is-primary"
              disabled={busy || !(notes[request.id] ?? request.response)?.trim()}
              onClick={() => respond(job.id, request.id, "in_review")}
            >
              {t("记录审核回复", "Record review response")}
            </button>
            <button
              type="button"
              className="client-project-tool"
              disabled={busy || !(notes[request.id] ?? request.response)?.trim()}
              onClick={() => respond(job.id, request.id, "declined")}
            >
              {t("不采纳并回复", "Decline with response")}
            </button>
            <button
              type="button"
              className="client-project-tool"
              disabled={busy || !(notes[request.id] ?? request.response)?.trim()}
              onClick={() => respond(job.id, request.id, "resolved")}
            >
              {t("标记已实施", "Mark implemented")}
            </button>
          </div>
        </section>
      ))}
      {!requests.length && <p>{t("暂无待审核的客户变更申请。", "No open client change requests.")}</p>}
    </details>
  );
}
