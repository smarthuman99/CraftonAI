import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildRfqWorkbook } from "./rfqExcel";
import { buildPrintableRfqHtml } from "./rfqPrint";

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

async function sha256Buffer(value) {
  const digest = await window.crypto.subtle.digest("SHA-256", value);
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
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [form, setForm] = useState({ title: "", dueAt: futureInput(), currency: "USD", notes: "", supplierIds: [] });
  const autoUpgradeRef = useRef("");
  const activeProjectRef = useRef("");
  const projectBatches = useMemo(() => batches.filter((row) => row.project_id === project.id), [batches, project.id]);
  const currentProjectFiles = useMemo(
    () => projectFiles.filter((row) => row.project_id === project.id),
    [projectFiles, project.id]
  );
  const currentIntakeJobs = useMemo(
    () => intakeJobs.filter((row) => row.project_id === project.id),
    [intakeJobs, project.id]
  );
  const currentIntakeFiles = useMemo(() => {
    const linkedFileIds = new Set(currentIntakeJobs.map((row) => row.intake_file_id).filter(Boolean));
    return intakeFiles.filter((row) => row.project_id === project.id || linkedFileIds.has(row.id));
  }, [intakeFiles, currentIntakeJobs, project.id]);
  const currentSpecifications = useMemo(
    () => specifications.filter((row) => row.project_id === project.id),
    [specifications, project.id]
  );
  const suggestedSupplierIds = useMemo(() => {
    const requirement = (project.items || [])
      .flatMap((item) => [item.typeEn, item.typeCn, item.materialEn, item.materialCn, item.finish])
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const ranked = suppliers
      .filter((supplier) => supplier.is_active !== false && supplier.status !== "inactive")
      .filter((supplier) => supplier.email || supplier.contact_email)
      .map((supplier) => {
        const tags = [supplier.category, ...(supplier.categories || []), ...(supplier.capabilities || [])]
          .filter(Boolean)
          .map((tag) => String(tag).toLowerCase());
        const matchScore = tags.reduce(
          (score, tag) =>
            score + (requirement.includes(tag) || (tag.includes("sofa") && requirement.includes("sofa")) ? 1 : 0),
          0
        );
        return { supplier, matchScore, rating: Number(supplier.rating || supplier.quality_score || 0) };
      })
      .sort((a, b) => b.matchScore - a.matchScore || b.rating - a.rating);
    const matched = ranked.filter((row) => row.matchScore > 0);
    return (matched.length ? matched : ranked).slice(0, 3).map((row) => row.supplier.id);
  }, [project.items, suppliers]);

  const sourceFiles = useMemo(() => {
    const rows = [
      ...currentIntakeFiles.map((file) => ({
        id: file.id,
        name: file.original_name,
        mimeType: file.mime_type,
        group: file.intake_type,
        note: file.notes,
        bucket: file.storage_bucket,
        path: file.storage_path
      })),
      ...currentProjectFiles
        .filter(
          (file) =>
            !["rfq_document", "rfq_dispatch", "rfq_excel", "supplier_quote", "quote_analysis"].includes(file.file_group)
        )
        .map((file) => ({
          id: file.id,
          name: file.file_name,
          mimeType: file.payload?.mime_type,
          group: file.file_group,
          note: file.payload?.note,
          url: file.file_url,
          bucket: file.payload?.storage_bucket,
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
  const highWarnings = (document?.missingInformation || []).filter((warning) => warning.severity === "high").length;

  useEffect(() => {
    if (activeProjectRef.current === project.id) return;
    activeProjectRef.current = project.id;
    setDocument(null);
    setGeneration(null);
    setActiveBatchId(null);
    setStatus("draft");
    setMessage("");
    setAttachmentUrls({});
    autoUpgradeRef.current = "";
    setForm({ title: "", dueAt: futureInput(), currency: "USD", notes: "", supplierIds: suggestedSupplierIds });
  }, [project.id]);

  useEffect(() => {
    if (!activeBatchId && !form.supplierIds.length && suggestedSupplierIds.length) {
      setForm((current) => ({ ...current, supplierIds: suggestedSupplierIds }));
    }
  }, [activeBatchId, form.supplierIds.length, suggestedSupplierIds]);

  useEffect(() => {
    if (document || busy === "generate") return;
    const saved = projectBatches.find((batch) => batch.payload?.document);
    if (saved) {
      loadBatch(saved);
      return;
    }
    const legacy = projectBatches.find((batch) => ["draft", "approved"].includes(batch.status));
    const upgradeKey = legacy ? `${project.id}:${legacy.id}` : "";
    if (legacy && autoUpgradeRef.current !== upgradeKey) {
      autoUpgradeRef.current = upgradeKey;
      generate(legacy);
    }
  }, [busy, document, project.id, projectBatches]);

  useEffect(() => {
    let active = true;
    const attachments = document?.attachments || [];
    if (!attachments.length) {
      setAttachmentUrls({});
      return () => {
        active = false;
      };
    }

    Promise.all(
      attachments.map(async (file) => {
        const key = file.id || file.name;
        if (file.url) return [key, file.url];
        if (!file.bucket || !file.path) return [key, ""];
        const { data } = await supabaseClient.storage.from(file.bucket).createSignedUrl(file.path, 60 * 60);
        return [key, data?.signedUrl || ""];
      })
    ).then((entries) => {
      if (active) setAttachmentUrls(Object.fromEntries(entries));
    });

    return () => {
      active = false;
    };
  }, [document?.attachments, supabaseClient]);

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

  async function generate(targetBatch = null) {
    setBusy("generate");
    setMessage("");
    try {
      const result = await post(AI_API_URL, { action: "generate_rfq", context: context() });
      const targetSupplierIds = targetBatch?.supplier_ids?.length ? targetBatch.supplier_ids : suggestedSupplierIds;
      const due = targetBatch?.due_at ? new Date(targetBatch.due_at) : null;
      if (due) due.setMinutes(due.getMinutes() - due.getTimezoneOffset());
      const nextForm = {
        title: targetBatch?.title || (zh ? result.document.titleCn : result.document.titleEn),
        dueAt: due ? due.toISOString().slice(0, 16) : form.dueAt,
        currency: targetBatch?.currency || form.currency,
        notes: targetBatch?.notes || form.notes,
        supplierIds: targetSupplierIds
      };
      setDocument(result.document);
      setGeneration(result.generation);
      setActiveBatchId(targetBatch?.id || null);
      setStatus("draft");
      setForm(nextForm);
      if (targetBatch?.id) {
        await persist("draft", {
          document: result.document,
          generation: result.generation,
          activeBatchId: targetBatch.id,
          form: nextForm
        });
        setMessage(t("Legacy RFQ upgraded to a complete inquiry document.", "旧版 RFQ 已自动升级为完整询盘文件。"));
        await onChanged?.();
      } else {
        setMessage(
          t(
            "AI RFQ draft generated. Review all warnings before approval.",
            "AI 询价单草稿已生成，请在批准前检查所有警示。"
          )
        );
      }
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

  async function persist(nextStatus, overrides = {}) {
    const workingDocument = overrides.document || document;
    const workingGeneration = overrides.generation || generation;
    const workingBatchId = Object.prototype.hasOwnProperty.call(overrides, "activeBatchId")
      ? overrides.activeBatchId
      : activeBatchId;
    const workingForm = overrides.form || form;
    if (!workingDocument) throw new Error(t("Generate an RFQ draft first.", "请先生成 RFQ 询价单草稿。"));
    const code = `RFQ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${window.crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    let version = workingBatchId ? nextVersion(workingBatchId) : 1;
    const basePayload = {
      document: workingDocument,
      generation: workingGeneration,
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
      title: workingForm.title || workingDocument.titleEn,
      status: nextStatus,
      supplier_ids: workingForm.supplierIds,
      supplier_count: workingForm.supplierIds.length,
      invited_count: workingForm.supplierIds.length,
      due_at: workingForm.dueAt ? new Date(workingForm.dueAt).toISOString() : null,
      currency: workingForm.currency,
      notes: workingForm.notes,
      payload: basePayload
    };

    let batch;
    if (workingBatchId) {
      const { data, error } = await supabaseClient
        .from("rfq_batches")
        .update(batchValues)
        .eq("id", workingBatchId)
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

    version = workingBatchId ? nextVersion(batch.id) : 1;
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
      { rfq_batch_id: batch.id, version, sha256: hash, supplier_ids: workingForm.supplierIds }
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
        notes: `${batch.rfq_code} approved for supplier Excel export.`,
        reviewed_at: new Date().toISOString(),
        payload: { rfq_batch_id: batch.id, warning_count: document.missingInformation?.length || 0 }
      });
      if (error) throw error;
      setMessage(t("RFQ approved and ready for Excel export.", "RFQ 已批准，可以下载供应商 Excel 询价文件。"));
      await onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  function loadBatch(batch) {
    if (!batch.payload?.document) {
      generate(batch);
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
    if (!document) return;

    const popup = window.open("", "_blank");
    if (!popup) {
      setMessage(t("Allow pop-ups to open the printable RFQ.", "请允许浏览器弹出窗口以打开可打印 RFQ。"));
      return;
    }

    try {
      const batch = projectBatches.find((row) => row.id === activeBatchId) || null;
      const html = buildPrintableRfqHtml({
        document,
        form,
        batch,
        project,
        attachmentUrls,
        lang,
        autoPrint: true
      });

      popup.opener = null;
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      popup.focus();
    } catch (error) {
      popup.close();
      setMessage(error.message || String(error));
    }
  }

  async function downloadRfqExcel() {
    if (!document) return;
    const batch = projectBatches.find((row) => row.id === activeBatchId);
    if (!batch || !["approved", "sent"].includes(status)) {
      setMessage(
        t(
          "Save and approve the RFQ before downloading its supplier Excel file.",
          "请先保存并批准 RFQ，再下载供应商 Excel 询价文件。"
        )
      );
      return;
    }
    if (!form.supplierIds.length) {
      setMessage(t("Select at least one supplier before export.", "请先选择至少一家询价供应商。"));
      return;
    }

    setBusy("excel");
    setMessage("");
    try {
      const exported = await buildRfqWorkbook({
        project,
        batch,
        document,
        form,
        references: (document.attachments || []).map((file) => ({
          name: file.name,
          note: file.note,
          url: attachmentUrls[file.id || file.name] || file.url || ""
        }))
      });
      const hash = await sha256Buffer(exported.buffer);
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !authData?.user?.id) throw authError || new Error("Staff session unavailable.");
      const storagePath = `${authData.user.id}/rfq-exports/${project.id}/${Date.now()}-${exported.fileName}`;
      const exportFile = new window.File([exported.buffer], exported.fileName, { type: exported.mimeType });
      const { error: uploadError } = await supabaseClient.storage
        .from("intake-files")
        .upload(storagePath, exportFile, { contentType: exported.mimeType, upsert: false });
      if (uploadError) throw uploadError;

      const exportedAt = new Date().toISOString();
      const { error: fileError } = await supabaseClient.from("project_files").insert({
        project_id: project.id,
        stage_id: "S06",
        file_group: "rfq_excel",
        file_name: exported.fileName,
        file_path: storagePath,
        sha256: hash,
        audit_hash: hash,
        payload: {
          ...exported.metadata,
          rfq_batch_id: batch.id,
          rfq_code: batch.rfq_code,
          supplier_ids: form.supplierIds,
          storage_bucket: "intake-files",
          storage_path: storagePath,
          mime_type: exported.mimeType,
          exported_at: exportedAt
        }
      });
      if (fileError) throw fileError;

      const { error: batchError } = await supabaseClient
        .from("rfq_batches")
        .update({
          payload: {
            ...(batch.payload || {}),
            document,
            generation,
            manual_excel: {
              exported_at: exportedAt,
              file_name: exported.fileName,
              sha256: hash,
              supplier_ids: form.supplierIds
            }
          }
        })
        .eq("id", batch.id);
      if (batchError) throw batchError;

      await event(
        "rfq_excel_exported",
        `${batch.rfq_code} Excel 询价文件已生成并下载。`,
        `${batch.rfq_code} supplier Excel RFQ generated and downloaded.`,
        { rfq_batch_id: batch.id, file_name: exported.fileName, sha256: hash, supplier_ids: form.supplierIds }
      );

      const url = URL.createObjectURL(exportFile);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = exported.fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        t(
          "Excel RFQ downloaded and archived. Send the same file from your own mailbox, then import each supplier return below.",
          "Excel RFQ 已下载并归档。请用自己的邮箱发送；收到回复后，在下方对应供应商位置导入回传文件。"
        )
      );
      await onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
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
        <div className="wide ai-rfq-suppliers-field">
          <span>{t("Suppliers to compare", "本轮参与比价的供应商")}</span>
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
                <small>{supplier.contact_email || supplier.email || t("Email missing", "缺少邮箱")}</small>
              </label>
            ))}
          </div>
        </div>
        <label className="wide">
          <span>{t("Internal sourcing notes", "内部询价备注")}</span>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <div className="ai-rfq-primary-actions wide">
          <button className="btn-premium" type="button" disabled={Boolean(busy)} onClick={() => generate()}>
            {busy === "generate"
              ? t("AI is preparing the RFQ...", "AI 正在生成询价单...")
              : t("Generate standard RFQ with AI", "使用 AI 生成标准询价单")}
          </button>
          <span>
            {t(
              `${project.items?.length || 0} item rows and ${Math.max(sourceFiles.length, document?.attachments?.length || 0)} source references will be used.`,
              `将引用 ${project.items?.length || 0} 项订单明细及 ${Math.max(sourceFiles.length, document?.attachments?.length || 0)} 个资料参考。`
            )}
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`admin-ops-notice ${/generated|saved|approved|downloaded|archived|已生成|已保存|已批准|已下载|已归档/.test(message) ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      <div className="manual-rfq-guide" aria-label={t("Manual RFQ workflow", "手动 RFQ 工作流程")}>
        <article>
          <b>01</b>
          <span>
            <strong>{t("Approve the RFQ", "批准询价内容")}</strong>
            <small>{t("Confirm items, quantities and commercial terms.", "确认品项、数量与商务要求。")}</small>
          </span>
        </article>
        <article>
          <b>02</b>
          <span>
            <strong>{t("Download Excel", "下载 Excel")}</strong>
            <small>{t("Send the same editable .xlsx from your mailbox.", "用自己的邮箱发送可填写的 .xlsx。")}</small>
          </span>
        </article>
        <article>
          <b>03</b>
          <span>
            <strong>{t("Import supplier returns", "录入供应商回传")}</strong>
            <small>
              {t("Match each returned file to its supplier below.", "在下方把每份回传文件归入对应供应商。")}
            </small>
          </span>
        </article>
      </div>

      {document && (
        <div className="ai-rfq-document">
          <div className="ai-rfq-document-toolbar">
            <div>
              <strong>{t("RFQ Excel content preview", "RFQ Excel 内容预览")}</strong>
              <span>
                {generation?.method === "ai"
                  ? t("AI generated from verified Supabase data", "AI 根据 Supabase 已核实资料生成")
                  : t("Verified-data fallback", "已核实资料规则生成")}
              </span>
            </div>
            <div>
              <b data-status={status}>{zh ? statusCn[status] || status : status}</b>
              <button type="button" disabled={Boolean(busy)} onClick={printRfq}>
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
                disabled={Boolean(busy) || !["approved", "sent"].includes(status)}
                onClick={downloadRfqExcel}
              >
                {busy === "excel"
                  ? t("Creating Excel...", "正在生成 Excel...")
                  : t("Download RFQ Excel", "下载 RFQ Excel")}
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
                      {attachmentUrls[file.id || file.name] &&
                        (file.type?.startsWith("image/") || /\.(png|jpe?g|webp|avif|heic)$/i.test(file.name)) && (
                          <img src={attachmentUrls[file.id || file.name]} alt={file.name} />
                        )}
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
              "Every approved version and generated Excel file is retained in Supabase.",
              "每个批准版本及生成的 Excel 文件都会保留在 Supabase。"
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
