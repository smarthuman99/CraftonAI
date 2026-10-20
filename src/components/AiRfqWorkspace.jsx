import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildRfqWorkbook } from "./rfqExcel";
import { buildRfqPdf } from "./rfqPdf";
import { archiveRfqExport, downloadRfqBlob, readArchivedRfqFile } from "./rfqArchive";
import { isImageReference, resolveRfqReference } from "../../shared/rfqReferences.mjs";
import { rfqReviewWarnings } from "../../shared/rfqValidation.mjs";

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
  onChanged,
  displayMode = "standard"
}) {
  const zh = lang === "Cn";
  const t = (en, cn) => (zh ? cn : en);
  const hierarchical = displayMode === "hierarchical";
  const [document, setDocument] = useState(null);
  const [generation, setGeneration] = useState(null);
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [status, setStatus] = useState("draft");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [dispatchService, setDispatchService] = useState(null);
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [attachmentErrors, setAttachmentErrors] = useState({});
  const [attachmentRetry, setAttachmentRetry] = useState(0);
  const reviewWarnings = useMemo(() => (document ? rfqReviewWarnings(document) : []), [document]);
  const [form, setForm] = useState({ title: "", dueAt: futureInput(), currency: "USD", notes: "", supplierIds: [] });
  const autoUpgradeRef = useRef("");
  const activeProjectRef = useRef("");
  const [savedBatches, setSavedBatches] = useState({});
  const [savedFiles, setSavedFiles] = useState([]);
  const projectBatches = useMemo(
    () =>
      Array.from(
        new Map(
          [...batches, ...Object.values(savedBatches)]
            .filter((row) => row.project_id === project.id)
            .map((row) => [row.id, row])
        ).values()
      ).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [batches, savedBatches, project.id]
  );
  const currentProjectFiles = useMemo(
    () =>
      Array.from(
        new Map(
          [...projectFiles, ...savedFiles].filter((row) => row.project_id === project.id).map((row) => [row.id, row])
        ).values()
      ),
    [projectFiles, savedFiles, project.id]
  );
  const exportedFiles = useMemo(
    () =>
      currentProjectFiles
        .filter((file) => ["rfq_excel", "rfq_pdf"].includes(file.file_group))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [currentProjectFiles]
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
            !["rfq_document", "rfq_dispatch", "rfq_excel", "rfq_pdf", "supplier_quote", "quote_analysis"].includes(
              file.file_group
            )
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
  const selectedSuppliers = suppliers.filter((supplier) => form.supplierIds.includes(supplier.id));
  const highWarnings = reviewWarnings.filter((warning) => warning.severity === "high").length;

  useEffect(() => {
    if (activeProjectRef.current === project.id) return;
    activeProjectRef.current = project.id;
    setDocument(null);
    setGeneration(null);
    setActiveBatchId(null);
    setStatus("draft");
    setMessage("");
    setDispatchService(null);
    setAttachmentUrls({});
    setAttachmentErrors({});
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

    const refresh = async () => {
      const results = await Promise.allSettled(attachments.map((file) => resolveRfqReference(file, supabaseClient)));
      if (!active) return;
      setAttachmentUrls(
        Object.fromEntries(
          attachments.map((file, index) => [
            file.id || file.name,
            results[index].status === "fulfilled" ? results[index].value : ""
          ])
        )
      );
      setAttachmentErrors(
        Object.fromEntries(
          attachments.map((file, index) => [
            file.id || file.name,
            results[index].status === "rejected" || !results[index].value
          ])
        )
      );
    };
    refresh();
    const timer = setInterval(refresh, 45 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [document?.attachments, supabaseClient, attachmentRetry]);

  useEffect(() => {
    let active = true;
    post(AI_API_URL, { action: "rfq_dispatch_status" })
      .then((result) => {
        if (active) setDispatchService(result);
      })
      .catch(() => {
        if (active) setDispatchService({ configured: false, unavailable: true });
      });
    return () => {
      active = false;
    };
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
      await persist("draft", {
        document: result.document,
        generation: result.generation,
        activeBatchId: targetBatch?.id || null,
        form: nextForm
      });
      setMessage(
        t(
          "RFQ draft generated and saved. Reopen it from RFQ history.",
          "询价草稿已生成并自动保存，关闭后可从询价版本记录再次打开。"
        )
      );
      await onChanged?.();
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
        Number(projectBatches.find((row) => row.id === batchId)?.payload?.version || 0),
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
    const workingDocument = overrides.document || (document && { ...document, missingInformation: reviewWarnings });
    const workingGeneration = overrides.generation || generation;
    const workingBatchId = Object.prototype.hasOwnProperty.call(overrides, "activeBatchId")
      ? overrides.activeBatchId
      : activeBatchId;
    const workingForm = overrides.form || form;
    if (!workingDocument) throw new Error(t("Generate an RFQ draft first.", "请先生成 RFQ 询价单草稿。"));
    const code = `RFQ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${window.crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    let version = workingBatchId ? nextVersion(workingBatchId) : 1;
    const basePayload = {
      ...(projectBatches.find((row) => row.id === workingBatchId)?.payload || {}),
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

    setActiveBatchId(batch.id);
    setSavedBatches((current) => ({ ...current, [batch.id]: batch }));
    setStatus(nextStatus);
    version = workingBatchId ? nextVersion(batch.id) : 1;
    const record = { ...basePayload, rfq_batch_id: batch.id, rfq_code: batch.rfq_code, version };
    const hash = await sha256(record);
    const { data: savedVersion, error: fileError } = await supabaseClient
      .from("project_files")
      .insert({
        project_id: project.id,
        stage_id: "S06",
        file_group: "rfq_document",
        file_name: `${batch.rfq_code}-v${version}.json`,
        sha256: hash,
        audit_hash: hash,
        payload: record
      })
      .select()
      .single();
    if (fileError) throw fileError;
    setSavedFiles((current) => [...current, savedVersion]);

    await event(
      nextStatus === "approved" ? "rfq_document_approved" : "rfq_document_version_saved",
      `${batch.rfq_code} 第 ${version} 版询价单已${nextStatus === "approved" ? "批准" : "保存"}。`,
      `${batch.rfq_code} RFQ version ${version} ${nextStatus === "approved" ? "approved" : "saved"}.`,
      { rfq_batch_id: batch.id, version, sha256: hash, supplier_ids: workingForm.supplierIds }
    );
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
        payload: { rfq_batch_id: batch.id, warning_count: reviewWarnings.length }
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

  async function dispatch() {
    if (!activeBatchId || status !== "approved") {
      setMessage(t("Approve and save this RFQ before dispatch.", "请先保存并批准这份 RFQ，再发送给供应商。"));
      return;
    }
    if (!dispatchService?.configured) {
      setMessage(
        t(
          "Direct email sending is not configured. Download the RFQ Excel and send it from your mailbox instead.",
          "直接邮件发送尚未配置，请下载 RFQ Excel 后使用自己的邮箱发送。"
        )
      );
      return;
    }
    const withoutEmail = selectedSuppliers.filter((supplier) => !(supplier.contact_email || supplier.email));
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
        projectId: project.id,
        rfqCode: batch.rfq_code,
        document,
        suppliers: selectedSuppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          email: supplier.contact_email || supplier.email
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
          payload: { ...(batch.payload || {}), document, generation, status: "sent", dispatch: receipt }
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

  async function exportReferences() {
    return Promise.all(
      (document.attachments || []).map(async (file) => ({
        ...file,
        url: await resolveRfqReference(file, supabaseClient)
      }))
    );
  }

  async function openExport(file, preview = false) {
    const popup = preview ? window.open("", "_blank") : null;
    if (popup) popup.opener = null;
    setBusy("open-file");
    setMessage("");
    try {
      const blob = await readArchivedRfqFile(supabaseClient, file);
      if (popup) {
        const url = URL.createObjectURL(new window.Blob([blob], { type: "application/pdf" }));
        popup.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 300000);
      } else downloadRfqBlob(blob, file.file_name);
    } catch (error) {
      popup?.close();
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
    }
  }

  async function printRfq() {
    if (!document) return;
    setBusy("pdf");
    setMessage(t("Preparing PDF with embedded images...", "正在生成含产品图片的 PDF…"));
    try {
      let batch = projectBatches.find((row) => row.id === activeBatchId);
      const unchanged =
        batch &&
        JSON.stringify(batch.payload?.document) === JSON.stringify(document) &&
        batch.status === status &&
        batch.currency === form.currency &&
        (batch.notes || "") === form.notes &&
        JSON.stringify(batch.supplier_ids || []) === JSON.stringify(form.supplierIds) &&
        (batch.due_at ? new Date(batch.due_at).getTime() : 0) === (form.dueAt ? new Date(form.dueAt).getTime() : 0);
      if (!unchanged) batch = await persist("draft");
      const exported = await buildRfqPdf({
        project,
        batch,
        document: { ...document, missingInformation: reviewWarnings },
        form,
        references: await exportReferences()
      });
      const hash = await sha256Buffer(exported.buffer);
      const archived = await archiveRfqExport({
        client: supabaseClient,
        projectId: project.id,
        batch,
        supplierIds: form.supplierIds,
        exported,
        hash,
        group: "rfq_pdf"
      });
      setSavedFiles((current) => [...current, archived.file]);
      downloadRfqBlob(archived.blob, exported.fileName);
      setMessage(
        t(
          "PDF downloaded and archived. Reopen it from Generated files.",
          "PDF 已下载并归档，可在「已生成文件」中再次查看或下载。"
        )
      );
      await onChanged?.();
    } catch (error) {
      setMessage(error.message || String(error));
    } finally {
      setBusy("");
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
      const references = await exportReferences();
      const exported = await buildRfqWorkbook({
        project,
        batch,
        document: { ...document, missingInformation: reviewWarnings },
        form,
        references
      });
      const hash = await sha256Buffer(exported.buffer);
      const archived = await archiveRfqExport({
        client: supabaseClient,
        projectId: project.id,
        batch,
        supplierIds: form.supplierIds,
        exported,
        hash,
        group: "rfq_excel"
      });
      setSavedFiles((current) => [...current, archived.file]);
      const exportedAt = archived.file.payload.exported_at;
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

      downloadRfqBlob(archived.blob, exported.fileName);
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
    <div className={`ai-rfq-workspace ${hierarchical ? "is-hierarchical" : ""}`.trim()}>
      {hierarchical && (
        <div className="sourcing-next-source-strip">
          <div>
            <span>{t("APPROVED SOURCE", "已批准资料")}</span>
            <strong>{project.orderId || project.projectName || project.id}</strong>
          </div>
          <div>
            <span>{t("LINE ITEMS", "订单明细")}</span>
            <strong>{project.items?.length || 0}</strong>
          </div>
          <div>
            <span>{t("SOURCE FILES", "来源文件")}</span>
            <strong>{Math.max(sourceFiles.length, document?.attachments?.length || 0)}</strong>
          </div>
          <div>
            <span>{t("RFQ STATUS", "询价状态")}</span>
            <strong>{zh ? statusCn[status] || status : status}</strong>
          </div>
        </div>
      )}
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
              ? t("We are preparing the RFQ...", "正在生成询价单...")
              : t("Generate standard RFQ", "生成标准询价单")}
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

      {!hierarchical && (
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
      )}

      {hierarchical && dispatchService && !dispatchService.configured && (
        <div className="sourcing-next-channel-note">
          <strong>{t("Send from your mailbox", "使用你的邮箱发送")}</strong>
          <span>
            {t(
              "Download the approved RFQ Excel, send it to the selected suppliers, then upload their returned quotations here.",
              "下载已批准的询价 Excel，发送给选定供应商，再将回传报价上传至此。"
            )}
          </span>
        </div>
      )}

      <section
        id={`rfq-files-${project.id}`}
        className="ai-rfq-exports ai-rfq-history"
        aria-label={t("Generated files", "已生成文件")}
      >
        <div className="ai-rfq-document-toolbar">
          <div>
            <strong>{t("Generated files", "已生成文件")}</strong>
            <span>
              {t(
                "Saved to this project. Available after closing or refreshing.",
                "文件保存在此项目中，关闭或刷新后仍可查看和下载。"
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              window.document
                .getElementById(`rfq-history-${project.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            {t("RFQ version history", "查看询价版本记录")}
          </button>
        </div>
        {exportedFiles.length ? (
          <div className="admin-table-wrap">
            <table className="admin-mini-table">
              <thead>
                <tr>
                  <th>{t("File", "文件")}</th>
                  <th>{t("Created", "生成时间")}</th>
                  <th>{t("Actions", "操作")}</th>
                </tr>
              </thead>
              <tbody>
                {exportedFiles.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <strong>{file.file_group === "rfq_pdf" ? "PDF" : "Excel"}</strong>
                      <br />
                      {file.file_name}
                    </td>
                    <td>{displayDate(file.created_at || file.payload?.exported_at, lang)}</td>
                    <td>
                      {file.file_group === "rfq_pdf" && (
                        <button type="button" disabled={Boolean(busy)} onClick={() => openExport(file, true)}>
                          {t("View PDF", "查看 PDF")}
                        </button>
                      )}
                      <button type="button" disabled={Boolean(busy)} onClick={() => openExport(file)}>
                        {t("Download again", "再次下载")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            {t("Your generated Excel and PDF files will appear here.", "生成的 Excel 和 PDF 将显示在这里。")}
          </div>
        )}
      </section>

      {document && (
        <div className="ai-rfq-document" id={`rfq-preview-${project.id}`}>
          <div className="ai-rfq-document-toolbar">
            <div>
              <strong>{t("RFQ Excel content preview", "RFQ Excel 内容预览")}</strong>
              <span>
                {generation?.method === "ai"
                  ? t("Crafton generated from verified Supabase data", "根据 Supabase 已核实资料生成")
                  : t("Verified-data fallback", "已核实资料规则生成")}
              </span>
            </div>
            <div>
              <b data-status={status}>{zh ? statusCn[status] || status : status}</b>
              {hierarchical ? (
                <>
                  {status === "draft" && (
                    <button className="btn-premium" type="button" disabled={Boolean(busy)} onClick={approve}>
                      {busy === "approve" ? t("Approving...", "批准中...") : t("Approve RFQ", "批准询价")}
                    </button>
                  )}
                  {status === "approved" && dispatchService?.configured && (
                    <button className="btn-premium" type="button" disabled={Boolean(busy)} onClick={dispatch}>
                      {busy === "send" ? t("Sending...", "发送中...") : t("Send to suppliers", "发送给供应商")}
                    </button>
                  )}
                  {["approved", "sent"].includes(status) && !dispatchService?.configured && (
                    <button className="btn-premium" type="button" disabled={Boolean(busy)} onClick={downloadRfqExcel}>
                      {busy === "excel"
                        ? t("Creating Excel...", "正在生成 Excel...")
                        : t("Download RFQ Excel", "下载询价 Excel")}
                    </button>
                  )}
                  {status === "sent" && (
                    <span className="sourcing-next-sent-label">
                      {t("Sent to selected suppliers", "已发送给所选供应商")}
                    </span>
                  )}
                  <button type="button" disabled={Boolean(busy)} onClick={printRfq}>
                    {busy === "pdf" ? t("Creating PDF...", "正在生成 PDF...") : t("Download PDF", "下载 PDF")}
                  </button>
                  <details className="sourcing-next-more-menu">
                    <summary>{t("More", "更多")}</summary>
                    <div>
                      <button type="button" disabled={Boolean(busy)} onClick={save}>
                        {busy === "save" ? t("Saving...", "保存中...") : t("Save version", "保存版本")}
                      </button>
                      {["approved", "sent"].includes(status) && (
                        <button type="button" disabled={Boolean(busy)} onClick={downloadRfqExcel}>
                          {t("Download RFQ Excel", "下载询价 Excel")}
                        </button>
                      )}
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <button type="button" disabled={Boolean(busy)} onClick={printRfq}>
                    {busy === "pdf" ? t("Creating PDF...", "正在生成 PDF...") : t("Download PDF", "下载 PDF")}
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
                </>
              )}
            </div>
          </div>

          <details className="ai-rfq-document-details" open={!hierarchical ? true : undefined}>
            <summary>
              <span>
                <strong>{t("Review RFQ contents", "复核询价内容")}</strong>
                <small>
                  {t(
                    `${document.items.length} items · ${reviewWarnings.length} warning(s)`,
                    `${document.items.length} 项明细 · ${reviewWarnings.length} 条提示`
                  )}
                </small>
              </span>
              <b aria-hidden="true">›</b>
            </summary>
            <div className="ai-rfq-title-block">
              <span>THE CRAFTON · REQUEST FOR QUOTATION</span>
              <input value={document.titleCn} onChange={(e) => updateDocument("titleCn", e.target.value)} />
              <input value={document.titleEn} onChange={(e) => updateDocument("titleEn", e.target.value)} />
              <div>
                <b>{t("Project", "项目")}</b> {project.orderId || project.id}
                <b>{t("Client", "客户")}</b> {document.project?.clientName || project.clientName || "-"}
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
                        <input
                          value={item.tolerance}
                          onChange={(e) => updateItem(index, "tolerance", e.target.value)}
                        />
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
                          !attachmentErrors[file.id || file.name] &&
                          isImageReference(file) && (
                            <img
                              src={attachmentUrls[file.id || file.name]}
                              alt={file.name}
                              onError={() =>
                                setAttachmentErrors((current) => ({ ...current, [file.id || file.name]: true }))
                              }
                            />
                          )}
                        {attachmentErrors[file.id || file.name] && (
                          <span role="status">
                            {t("Reference unavailable. ", "参考附件暂时无法读取。")}
                            <button type="button" onClick={() => setAttachmentRetry((value) => value + 1)}>
                              {t("Retry", "重试")}
                            </button>
                          </span>
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
                <h4>{t("Review warnings", "审核警示")}</h4>
                {reviewWarnings.length ? (
                  <ul>
                    {reviewWarnings.map((warning, index) => (
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
          </details>
        </div>
      )}

      <details
        id={`rfq-history-${project.id}`}
        className={`ai-rfq-history ${hierarchical ? "is-disclosure" : ""}`.trim()}
        open
      >
        {hierarchical && (
          <summary>
            <span>
              <strong>{t("RFQ version history", "询价版本记录")}</strong>
              <small>{t(`${projectBatches.length} saved batch(es)`, `${projectBatches.length} 个已保存批次`)}</small>
            </span>
            <b aria-hidden="true">›</b>
          </summary>
        )}
        <div>
          <strong>{t("RFQ history", "RFQ 历史记录")}</strong>
          <span>
            {t(
              "Generated drafts are saved automatically. Reopen a saved RFQ below.",
              "生成草稿时自动保存，可在这里重新打开已保存的询价单。"
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
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => {
                          loadBatch(batch);
                          window.requestAnimationFrame(() => {
                            const preview = window.document.getElementById(`rfq-preview-${project.id}`);
                            const details = preview?.querySelector(".ai-rfq-document-details");
                            if (details) details.open = true;
                            preview?.scrollIntoView({ behavior: "smooth", block: "start" });
                          });
                        }}
                      >
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
      </details>
    </div>
  );
}
