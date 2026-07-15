import React, { useEffect, useMemo, useState } from "react";

const AI_API_URL = import.meta.env.VITE_AI_SUPPORT_API_URL || "/api/ai-support-chat";

function futureInput(days = 7) {
  const date = new Date(Date.now() + days * 86400000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function displayDate(value, lang) {
  return value
    ? new Date(value).toLocaleString(lang === "Cn" ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "-";
}

async function sha256(value) {
  const digest = await window.crypto.subtle.digest("SHA-256", new window.TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function AiRfqWorkspace({
  lang,
  project,
  supabaseClient,
  batches = [],
  projectFiles = [],
  intakeFiles = [],
  intakeJobs = [],
  specifications = [],
  suppliers = [],
  onChanged
}) {
  const zh = lang === "Cn";
  const t = (en, cn) => (zh ? cn : en);
  const [document, setDocument] = useState(null);
  const [generation, setGeneration] = useState(null);
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [status, setStatus] = useState("draft");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", dueAt: futureInput(), currency: "USD", notes: "", supplierIds: [] });
  const projectBatches = useMemo(() => batches.filter((row) => row.project_id === project.id), [batches, project.id]);
  const currentProjectFiles = useMemo(
    () => projectFiles.filter((row) => row.project_id === project.id),
    [projectFiles, project.id]
  );
  const currentIntakeFiles = useMemo(
    () => intakeFiles.filter((row) => row.project_id === project.id),
    [intakeFiles, project.id]
  );
  const currentIntakeJobs = useMemo(
    () => intakeJobs.filter((row) => row.project_id === project.id),
    [intakeJobs, project.id]
  );
  const currentSpecifications = useMemo(
    () => specifications.filter((row) => row.project_id === project.id),
    [specifications, project.id]
  );

  const sourceFiles = useMemo(() => {
    const rows = [
      ...currentIntakeFiles.map((file) => ({
        id: file.id,
        name: file.original_name,
        mimeType: file.mime_type,
        group: file.intake_type,
        note: file.notes,
        path: file.storage_path
      })),
      ...currentProjectFiles
        .filter((file) => !["rfq_document", "rfq_dispatch"].includes(file.file_group))
        .map((file) => ({
          id: file.id,
          name: file.file_name,
          mimeType: file.payload?.mime_type,
          group: file.file_group,
          note: file.payload?.note,
          url: file.file_url,
          path: file.file_path
        }))
    ];
    const seen = new Set();
    return rows.filter((file) => file.name && !seen.has(file.name) && seen.add(file.name));
  }, [currentIntakeFiles, currentProjectFiles]);

  const versions = useMemo(
    () => currentProjectFiles.filter((file) => file.file_group === "rfq_document"),
    [currentProjectFiles]
  );
  const selectedSuppliers = suppliers.filter((supplier) => form.supplierIds.includes(supplier.id));
  const highWarnings = (document?.missingInformation || []).filter((warning) => warning.severity === "high").length;

  useEffect(() => {
    if (!document) {
      const saved = projectBatches.find((batch) => batch.payload?.document);
      if (saved) loadBatch(saved);
    }
  }, [projectBatches, document]);

  useEffect(() => {
    setDocument(null);
    setGeneration(null);
    setActiveBatchId(null);
    setStatus("draft");
    setMessage("");
    setForm({ title: "", dueAt: futureInput(), currency: "USD", notes: "", supplierIds: [] });
  }, [project.id]);

  async function token() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data?.session?.access_token) {
      throw new Error(t("Your staff login has expired. Sign in again.", "管理员登录已过期，请重新登录。"));
    }
    return data.session.access_token;
  }

  async function post(url, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `${response.status} ${response.statusText}`);
    return payload;
  }

  function context() {
    return {
      project: {
        id: project.id,
        projectName: project.orderId || project.projectName,
        orderId: project.orderId,
        clientName: project.clientName,
        company: project.clientCompany || project.company,
        destination: project.projectLocation || project.destination,
        deliveryDate: project.desiredDeliveryDate || project.deliveryDate,
        packaging: project.packagingRequirement || project.packaging,
        currency: form.currency,
        dueAt: form.dueAt,
        notes: [project.additionalOrderNotes, form.notes].filter(Boolean).join("\n")
      },
      items: project.items || [],
      files: sourceFiles,
      specifications: currentSpecifications,
      intake: currentIntakeJobs[0]?.result_json || currentIntakeJobs[0] || {}
    };
  }

  async function generate() {
    setBusy("generate");
    setMessage("");
    try {
      const result = await post(AI_API_URL, { action: "generate_rfq", context: context() });
      setDocument(result.document);
      setGeneration(result.generation);
      setActiveBatchId(null);
      setStatus("draft");
      setForm((current) => ({ ...current, title: zh ? result.document.titleCn : result.document.titleEn }));
      setMessage(
        t(
          "AI RFQ draft generated. Review all warnings before approval.",
          "AI 询价单草稿已生成，请在批准前检查所有警示。"
        )
      );
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  function nextVersion(batchId) {
    return (
      Math.max(
        0,
        ...versions
          .filter((file) => file.payload?.rfq_batch_id === batchId)
          .map((file) => Number(file.payload?.version || 0))
      ) + 1
    );
  }

  async function event(type, cn, en, payload = {}) {
    const { error } = await supabaseClient.from("workflow_events").insert({
      project_id: project.id,
      stage_id: "S06",
      event_type: type,
      actor: "Cho",
      message_cn: cn,
      message_en: en,
      payload
    });
    if (error) throw error;
  }

  async function persist(nextStatus) {
    if (!document) throw new Error(t("Generate an RFQ draft first.", "请先生成 RFQ 询价单草稿。"));
    const code = `RFQ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${window.crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    let version = activeBatchId ? nextVersion(activeBatchId) : 1;
    const basePayload = {
      document,
      generation,
      version,
      status: nextStatus,
      source: {
        project_id: project.id,
        intake_job_ids: currentIntakeJobs.map((row) => row.id),
        source_file_ids: [...currentIntakeFiles, ...currentProjectFiles].map((row) => row.id),
        specification_ids: currentSpecifications.map((row) => row.id)
      }
    };
    const batchValues = {
      title: form.title || document.titleEn,
      status: nextStatus,
      supplier_ids: form.supplierIds,
      supplier_count: form.supplierIds.length,
      invited_count: form.supplierIds.length,
      due_at: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      currency: form.currency,
      notes: form.notes,
      payload: basePayload
    };

    let batch;
    if (activeBatchId) {
      const { data, error } = await supabaseClient
        .from("rfq_batches")
        .update(batchValues)
        .eq("id", activeBatchId)
        .select()
        .single();
      if (error) throw error;
      batch = data;
    } else {
      const { data, error } = await supabaseClient
        .from("rfq_batches")
        .insert({ project_id: project.id, rfq_code: code, ...batchValues })
        .select()
        .single();
      if (error) throw error;
      batch = data;
    }

    version = activeBatchId ? nextVersion(batch.id) : 1;
    const record = { ...basePayload, rfq_batch_id: batch.id, rfq_code: batch.rfq_code, version };
    const hash = await sha256(record);
    const { error: fileError } = await supabaseClient.from("project_files").insert({
      project_id: project.id,
      stage_id: "S06",
      file_group: "rfq_document",
      file_name: `${batch.rfq_code}-v${version}.json`,
      sha256: hash,
      audit_hash: hash,
      payload: record
    });
    if (fileError) throw fileError;

    await event(
      nextStatus === "approved" ? "rfq_document_approved" : "rfq_document_version_saved",
      `${batch.rfq_code} 第 ${version} 版询价单已${nextStatus === "approved" ? "批准" : "保存"}。`,
      `${batch.rfq_code} RFQ version ${version} ${nextStatus === "approved" ? "approved" : "saved"}.`,
      { rfq_batch_id: batch.id, version, sha256: hash, supplier_ids: form.supplierIds }
    );
    const { error: projectError } = await supabaseClient
      .from("projects")
      .update({ current_stage: 6 })
      .eq("id", project.id);
    if (projectError) throw projectError;
    setActiveBatchId(batch.id);
    setStatus(nextStatus);
    return batch;
  }

  async function save() {
    setBusy("save");
    setMessage("");
    try {
      const batch = await persist("draft");
      setMessage(t(`${batch.rfq_code} saved as a traceable version.`, `${batch.rfq_code} 已保存为可追溯版本。`));
      await onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  async function approve() {
    if (
      highWarnings &&
      !window.confirm(
        t(
          `This RFQ has ${highWarnings} high-priority warnings. Approve anyway?`,
          `这份询价单仍有 ${highWarnings} 项高优先级警示，仍要批准吗？`
        )
      )
    )
      return;
    setBusy("approve");
    setMessage("");
    try {
      const batch = await persist("approved");
      const { error } = await supabaseClient.from("approvals").insert({
        project_id: project.id,
        stage_id: "S06",
        approval_type: "rfq_document_approval",
        status: "approved",
        reviewer_name: "Cho",
        notes: `${batch.rfq_code} approved for supplier dispatch.`,
        reviewed_at: new Date().toISOString(),
        payload: { rfq_batch_id: batch.id, warning_count: document.missingInformation?.length || 0 }
      });
      if (error) throw error;
      setMessage(t("RFQ approved and ready for supplier dispatch.", "RFQ 已批准，可以发送给供应商。"));
      await onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  async function dispatch() {
    if (!activeBatchId || status !== "approved") {
      setMessage(t("Approve and save this RFQ before dispatch.", "请先保存并批准这份 RFQ，再发送给供应商。"));
      return;
    }
    const withoutEmail = selectedSuppliers.filter((supplier) => !supplier.contact_email);
    if (!selectedSuppliers.length || withoutEmail.length) {
      setMessage(
        withoutEmail.length
          ? t(
              `Add email addresses for: ${withoutEmail.map((row) => row.name).join(", ")}.`,
              `请先补充以下供应商的邮箱：${withoutEmail.map((row) => row.name).join("、")}。`
            )
          : t("Select at least one supplier.", "请至少选择一家供应商。")
      );
      return;
    }

    setBusy("send");
    setMessage("");
    try {
      const batch = projectBatches.find((row) => row.id === activeBatchId) || { id: activeBatchId, rfq_code: "RFQ" };
      const receipt = await post(AI_API_URL, {
        action: "dispatch_rfq",
        rfqCode: batch.rfq_code,
        document,
        suppliers: selectedSuppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          email: supplier.contact_email
        }))
      });
      const { error } = await supabaseClient
        .from("rfq_batches")
        .update({
          status: "sent",
          sent_at: receipt.sentAt,
          supplier_ids: form.supplierIds,
          supplier_count: form.supplierIds.length,
          invited_count: receipt.recipients.length,
          payload: { document, generation, status: "sent", dispatch: receipt }
        })
        .eq("id", activeBatchId);
      if (error) throw error;
      const hash = await sha256(receipt);
      const { error: receiptError } = await supabaseClient.from("project_files").insert({
        project_id: project.id,
        stage_id: "S06",
        file_group: "rfq_dispatch",
        file_name: `${batch.rfq_code}-dispatch.json`,
        sha256: hash,
        audit_hash: hash,
        payload: { rfq_batch_id: activeBatchId, ...receipt }
      });
      if (receiptError) throw receiptError;
      await event(
        "rfq_dispatched",
        `${batch.rfq_code} 已发送给 ${receipt.recipients.length} 家供应商。`,
        `${batch.rfq_code} sent to ${receipt.recipients.length} suppliers.`,
        receipt
      );
      setStatus("sent");
      setMessage(
        t(
          `RFQ sent to ${receipt.recipients.length} suppliers; the receipt is saved.`,
          `RFQ 已发送给 ${receipt.recipients.length} 家供应商，发送回执已保存。`
        )
      );
      await onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  function loadBatch(batch) {
    if (!batch.payload?.document) {
      setMessage(
        t(
          "This legacy RFQ has no generated document. Generate a new AI version to upgrade it.",
          "这条旧 RFQ 没有询价文件，请生成新的 AI 版本进行升级。"
        )
      );
      return;
    }
    const due = batch.due_at ? new Date(batch.due_at) : null;
    if (due) due.setMinutes(due.getMinutes() - due.getTimezoneOffset());
    setDocument(batch.payload.document);
    setGeneration(batch.payload.generation || null);
    setActiveBatchId(batch.id);
    setStatus(batch.status || batch.payload.status || "draft");
    setForm({
      title: batch.title || batch.payload.document.titleEn,
      dueAt: due ? due.toISOString().slice(0, 16) : futureInput(),
      currency: batch.currency || "USD",
      notes: batch.notes || "",
      supplierIds: batch.supplier_ids || []
    });
    setMessage("");
  }

  function updateItem(index, field, value) {
    setDocument((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
    if (status !== "draft") setStatus("draft");
  }

  function updateDocument(field, value) {
    setDocument((current) => ({ ...current, [field]: value }));
    if (status !== "draft") setStatus("draft");
  }

  function updateCommercial(index, value) {
    setDocument((current) => ({
      ...current,
      commercialRequirements: current.commercialRequirements.map((row, rowIndex) =>
        rowIndex === index ? { ...row, value } : row
      )
    }));
    if (status !== "draft") setStatus("draft");
  }

  function printRfq() {
    const popup = document && window.open("", "_blank", "noopener,noreferrer");
    if (!popup) {
      setMessage(t("Allow pop-ups to open the printable RFQ.", "请允许浏览器弹出窗口以打开可打印 RFQ。"));
      return;
    }
    popup.document.write(
      printableHtml(
        document,
        form,
        projectBatches.find((row) => row.id === activeBatchId)
      )
    );
    popup.document.close();
  }

  const statusCn = { draft: "草稿", approved: "已批准", sent: "已发送" };

  return (
    <div className="ai-rfq-workspace">
      <div className="ai-rfq-controls">
        <label>
          <span>{t("Quotation due", "报价截止")}</span>
          <input
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
          />
        </label>
        <label>
          <span>{t("Currency", "币种")}</span>
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option>USD</option>
            <option>CNY</option>
            <option>GBP</option>
            <option>EUR</option>
            <option>HKD</option>
          </select>
        </label>
        <label className="wide">
          <span>{t("Invite suppliers", "邀请供应商")}</span>
          <div className="admin-ops-checks">
            {suppliers.map((supplier) => (
              <label key={supplier.id}>
                <input
                  type="checkbox"
                  checked={form.supplierIds.includes(supplier.id)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      supplierIds: e.target.checked
                        ? [...form.supplierIds, supplier.id]
                        : form.supplierIds.filter((id) => id !== supplier.id)
                    })
                  }
                />
                <span>{supplier.name}</span>
                <small>{supplier.contact_email || t("Email missing", "缺少邮箱")}</small>
              </label>
            ))}
          </div>
        </label>
        <label className="wide">
          <span>{t("Internal sourcing notes", "内部询价备注")}</span>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <div className="ai-rfq-primary-actions wide">
          <button className="btn-premium" type="button" disabled={Boolean(busy)} onClick={generate}>
            {busy === "generate"
              ? t("AI is preparing the RFQ...", "AI 正在生成询价单...")
              : t("Generate standard RFQ with AI", "使用 AI 生成标准询价单")}
          </button>
          <span>
            {t(
              `${project.items?.length || 0} item rows and ${sourceFiles.length} source files will be used.`,
              `将引用 ${project.items?.length || 0} 项订单明细及 ${sourceFiles.length} 个源文件。`
            )}
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`admin-ops-notice ${/generated|saved|approved|sent|已生成|已保存|已批准|已发送/.test(message) ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      {document && (
        <div className="ai-rfq-document">
          <div className="ai-rfq-document-toolbar">
            <div>
              <strong>{t("RFQ document preview", "RFQ 询价文件预览")}</strong>
              <span>
                {generation?.method === "ai"
                  ? t("AI generated from verified Supabase data", "AI 根据 Supabase 已核实资料生成")
                  : t("Verified-data fallback", "已核实资料规则生成")}
              </span>
            </div>
            <div>
              <b data-status={status}>{zh ? statusCn[status] || status : status}</b>
              <button type="button" onClick={printRfq}>
                {t("Print / Save PDF", "打印 / 保存 PDF")}
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={save}>
                {busy === "save" ? t("Saving...", "保存中...") : t("Save version", "保存版本")}
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={approve}>
                {busy === "approve" ? t("Approving...", "批准中...") : t("Approve RFQ", "批准 RFQ")}
              </button>
              <button
                className="btn-premium"
                type="button"
                disabled={Boolean(busy) || status !== "approved"}
                onClick={dispatch}
              >
                {busy === "send" ? t("Sending...", "发送中...") : t("Send to suppliers", "发送给供应商")}
              </button>
            </div>
          </div>

          <div className="ai-rfq-title-block">
            <span>THE CRAFTON · REQUEST FOR QUOTATION</span>
            <input value={document.titleCn} onChange={(e) => updateDocument("titleCn", e.target.value)} />
            <input value={document.titleEn} onChange={(e) => updateDocument("titleEn", e.target.value)} />
            <div>
              <b>{t("Project", "项目")}</b> {project.orderId || project.id}
              <b>{t("Client", "客户")}</b> {project.clientName || "-"}
              <b>{t("Due", "截止")}</b> {displayDate(form.dueAt, lang)}
              <b>{t("Currency", "币种")}</b> {form.currency}
            </div>
          </div>
          <div className="ai-rfq-introduction">
            <textarea
              value={document.introductionCn}
              onChange={(e) => updateDocument("introductionCn", e.target.value)}
            />
            <textarea
              value={document.introductionEn}
              onChange={(e) => updateDocument("introductionEn", e.target.value)}
            />
          </div>

          <div className="admin-table-wrap ai-rfq-items-table">
            <table className="admin-mini-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("Item", "品项")}</th>
                  <th>{t("Qty", "数量")}</th>
                  <th>{t("Dimensions / tolerance", "尺寸 / 公差")}</th>
                  <th>{t("Material", "材质")}</th>
                  <th>{t("Finish / hardware", "饰面 / 五金")}</th>
                  <th>{t("Compliance / notes", "合规 / 报价备注")}</th>
                </tr>
              </thead>
              <tbody>
                {document.items.map((item, index) => (
                  <tr key={`${item.itemNo}-${index}`}>
                    <td>{item.itemNo}</td>
                    <td>
                      <input value={item.nameCn} onChange={(e) => updateItem(index, "nameCn", e.target.value)} />
                      <input value={item.nameEn} onChange={(e) => updateItem(index, "nameEn", e.target.value)} />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      />
                      <small>{item.unit}</small>
                    </td>
                    <td>
                      <input
                        value={item.dimensions}
                        onChange={(e) => updateItem(index, "dimensions", e.target.value)}
                      />
                      <input value={item.tolerance} onChange={(e) => updateItem(index, "tolerance", e.target.value)} />
                    </td>
                    <td>
                      <input
                        value={item.materialCn}
                        onChange={(e) => updateItem(index, "materialCn", e.target.value)}
                      />
                      <input
                        value={item.materialEn}
                        onChange={(e) => updateItem(index, "materialEn", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        value={item.finishColor}
                        onChange={(e) => updateItem(index, "finishColor", e.target.value)}
                      />
                      <input value={item.hardware} onChange={(e) => updateItem(index, "hardware", e.target.value)} />
                    </td>
                    <td>
                      <input
                        value={item.compliance}
                        onChange={(e) => updateItem(index, "compliance", e.target.value)}
                      />
                      <textarea
                        value={item.supplierNotes}
                        onChange={(e) => updateItem(index, "supplierNotes", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ai-rfq-lower-grid">
            <section>
              <h4>{t("Commercial requirements", "商务要求")}</h4>
              {document.commercialRequirements.map((row, index) => (
                <label key={`${row.labelEn}-${index}`}>
                  <span>
                    {row.labelCn}
                    <small>{row.labelEn}</small>
                  </span>
                  <input value={row.value} onChange={(e) => updateCommercial(index, e.target.value)} />
                </label>
              ))}
            </section>
            <section>
              <h4>{t("Supplier must return", "供应商必须回复")}</h4>
              <div className="ai-rfq-response-fields">
                {document.supplierResponseFields.map((row) => (
                  <span key={row.key}>
                    {row.labelCn}
                    <small>{row.labelEn}</small>
                  </span>
                ))}
              </div>
            </section>
            <section>
              <h4>{t("Reference attachments", "参考附件")}</h4>
              {document.attachments.length ? (
                <ul>
                  {document.attachments.map((file, index) => (
                    <li key={`${file.name}-${index}`}>
                      <strong>{file.name}</strong>
                      <span>
                        {file.type} · {file.note}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t("No attachment found.", "未找到附件。")}</p>
              )}
            </section>
            <section className="ai-rfq-warnings">
              <h4>{t("AI review warnings", "AI 审核警示")}</h4>
              {document.missingInformation.length ? (
                <ul>
                  {document.missingInformation.map((warning, index) => (
                    <li data-severity={warning.severity} key={`${warning.field}-${index}`}>
                      <b>{warning.severity}</b>
                      <span>{zh ? warning.messageCn : warning.messageEn}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t("No missing information detected.", "未发现缺失资料。")}</p>
              )}
            </section>
          </div>
        </div>
      )}

      <div className="ai-rfq-history">
        <div>
          <strong>{t("RFQ history", "RFQ 历史记录")}</strong>
          <span>
            {t(
              "Every version and dispatch receipt is retained in Supabase.",
              "每个版本及发送回执都会保留在 Supabase。"
            )}
          </span>
        </div>
        {projectBatches.length ? (
          <div className="admin-table-wrap">
            <table className="admin-mini-table">
              <thead>
                <tr>
                  <th>RFQ</th>
                  <th>{t("Title", "标题")}</th>
                  <th>{t("Version", "版本")}</th>
                  <th>{t("Suppliers", "供应商")}</th>
                  <th>{t("Status", "状态")}</th>
                  <th>{t("Due", "截止")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projectBatches.map((batch) => (
                  <tr key={batch.id}>
                    <td>{batch.rfq_code}</td>
                    <td>{batch.title || "-"}</td>
                    <td>
                      v
                      {batch.payload?.version ||
                        versions.filter((file) => file.payload?.rfq_batch_id === batch.id).length ||
                        "-"}
                    </td>
                    <td>{batch.supplier_count || batch.supplier_ids?.length || 0}</td>
                    <td>{zh ? statusCn[batch.status] || batch.status : batch.status}</td>
                    <td>{displayDate(batch.due_at, lang)}</td>
                    <td>
                      <button type="button" onClick={() => loadBatch(batch)}>
                        {t("Preview", "预览")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            {t("No RFQ documents saved for this project.", "当前项目尚未保存 RFQ 询价文件。")}
          </div>
        )}
      </div>
    </div>
  );
}

function printableHtml(document, form, batch) {
  const esc = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const rows = document.items
    .map(
      (item) =>
        `<tr><td>${esc(item.itemNo)}</td><td><b>${esc(item.nameCn)}</b><br>${esc(item.nameEn)}</td><td>${esc(item.quantity)} ${esc(item.unit)}</td><td>${esc(item.dimensions)}<br>${esc(item.tolerance)}</td><td>${esc(item.materialCn)}<br>${esc(item.materialEn)}</td><td>${esc(item.finishColor)}<br>${esc(item.hardware)}</td><td>${esc(item.compliance)}<br>${esc(item.supplierNotes)}</td></tr>`
    )
    .join("");
  const commercial = document.commercialRequirements
    .map((row) => `<tr><th>${esc(row.labelCn)}<br>${esc(row.labelEn)}</th><td>${esc(row.value)}</td></tr>`)
    .join("");
  const files = document.attachments.map((file) => `<li><b>${esc(file.name)}</b> - ${esc(file.note)}</li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(batch?.rfq_code || document.titleEn)}</title><style>@page{size:A4 landscape;margin:12mm}body{font:12px Arial;color:#2e2926}h1{font-size:22px;margin:8px 0}h2{font-size:14px;margin-top:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cfc8c3;padding:7px;text-align:left;vertical-align:top}th{background:#f3f1ef}.meta{display:flex;gap:25px;border-block:1px solid #999;padding:8px 0}.intro{display:grid;grid-template-columns:1fr 1fr;gap:20px}.commercial{width:55%}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print / Save PDF</button><p>THE CRAFTON · REQUEST FOR QUOTATION</p><h1>${esc(document.titleCn)}<br><small>${esc(document.titleEn)}</small></h1><div class="meta"><span><b>RFQ</b> ${esc(batch?.rfq_code || "DRAFT")}</span><span><b>Due</b> ${esc(form.dueAt)}</span><span><b>Currency</b> ${esc(form.currency)}</span></div><div class="intro"><p>${esc(document.introductionCn)}</p><p>${esc(document.introductionEn)}</p></div><table><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Dimensions</th><th>Material</th><th>Finish / Hardware</th><th>Compliance / Notes</th></tr></thead><tbody>${rows}</tbody></table><h2>Commercial requirements / 商务要求</h2><table class="commercial">${commercial}</table><h2>Attachments / 附件</h2><ul>${files}</ul></body></html>`;
}
