import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLocalized, adminText } from "../adminI18n";
import AiRfqWorkspace from "./AiRfqWorkspace";
import AiQuoteComparison from "./AiQuoteComparison";
import AiOperationsAutomation from "./AiOperationsAutomation";

const PROJECT_TABLES = [
  "rfq_batches",
  "supplier_quotes",
  "approvals",
  "production_updates",
  "inspection_reports",
  "packing_plans",
  "shipment_documents",
  "shipments",
  "quantity_adjustments",
  "handover_reports",
  "project_files",
  "workflow_events",
  "intake_files",
  "intake_jobs"
];

const EMPTY_DATA = Object.fromEntries(PROJECT_TABLES.map((table) => [table, []]));

const money = (value, currency = "USD") => {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(number);
};

const shortDate = (value) => (value ? new Date(value).toLocaleString() : "-");
const valueList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const quoteLinesFromProject = (project) =>
  (project?.items || []).map((item, index) => ({
    item_id: item.id || `ITEM-${index + 1}`,
    item_no: item.sku || item.itemNo || `ITEM-${String(index + 1).padStart(2, "0")}`,
    item_name: item.typeEn || item.nameEn || item.typeCn || item.nameCn || `Item ${index + 1}`,
    quantity: Number(item.qty || item.quantity || 0),
    unit: item.unit || "pcs",
    unit_price: ""
  }));

const calculateQuoteScores = (quotes) => {
  const priced = quotes.filter((quote) => Number(quote.unit_price) > 0);
  const fastest = Math.min(...priced.map((quote) => Number(quote.lead_time_days || 999)), 999);
  const cheapest = Math.min(...priced.map((quote) => Number(quote.unit_price || Infinity)), Infinity);

  return quotes
    .map((quote) => {
      const unitPrice = Number(quote.unit_price || 0);
      const lead = Number(quote.lead_time_days || 999);
      const quality = Number(quote.quality_score || (quote.suppliers?.rating ? quote.suppliers.rating * 20 : 0));
      const reliability = Number(quote.reliability_score || quote.suppliers?.reliability_score || 0);
      const priceScore = unitPrice > 0 && Number.isFinite(cheapest) ? (cheapest / unitPrice) * 40 : 0;
      const leadScore = lead > 0 && fastest < 999 ? (fastest / lead) * 20 : 0;
      const score = priceScore + leadScore + Math.min(quality, 100) * 0.25 + Math.min(reliability, 100) * 0.15;
      const aiScore = Number(quote.payload?.ai_analysis?.totalScore);
      const aiRank = Number(quote.payload?.ai_analysis?.rank);
      return {
        ...quote,
        comparisonScore: Number.isFinite(aiScore) && aiScore > 0 ? aiScore : Math.round(score * 10) / 10,
        aiRank: Number.isFinite(aiRank) && aiRank > 0 ? aiRank : null
      };
    })
    .sort((a, b) => (a.aiRank && b.aiRank ? a.aiRank - b.aiRank : b.comparisonScore - a.comparisonScore));
};

function Notice({ tone = "", children }) {
  return <div className={`admin-ops-notice ${tone}`}>{children}</div>;
}

function StageSection({ stage, title, status, description, actions, children, wide = false }) {
  return (
    <section className={`admin-ops-section ${wide ? "wide" : ""}`}>
      <header>
        <div>
          <span>{stage}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="admin-ops-stage-actions">
          <b>{status}</b>
          {actions}
        </div>
      </header>
      <div className="admin-ops-body">{children}</div>
    </section>
  );
}

function Field({ label, children, wide = false }) {
  return (
    <label className={wide ? "wide" : ""}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Empty({ children }) {
  return <div className="admin-empty-state">{children}</div>;
}

export default function AdminWorkflowWorkspace({
  flow,
  lang = "En",
  project,
  supabaseClient,
  dbConnected,
  onOpenLoadingAi,
  onProjectChanged
}) {
  const projectId = project?.id || null;
  const t = (en, cn) => (lang === "Cn" ? cn : en);
  const localize = (content) => <AdminLocalized lang={lang}>{content}</AdminLocalized>;
  const [data, setData] = useState(EMPTY_DATA);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [missingTables, setMissingTables] = useState([]);
  const [activeForm, setActiveForm] = useState("");
  const [authStatus, setAuthStatus] = useState("checking");
  const [quoteLineItems, setQuoteLineItems] = useState(() => quoteLinesFromProject(project));
  const [quoteFile, setQuoteFile] = useState(null);
  const [editingQuoteId, setEditingQuoteId] = useState("");

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    code: "",
    category: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    country: "",
    city: "",
    capabilities: "",
    quality_score: "80",
    reliability_score: "80",
    notes: ""
  });
  const [quoteForm, setQuoteForm] = useState({
    rfq_batch_id: "",
    supplier_id: "",
    quote_code: "",
    currency: "USD",
    unit_price: "",
    total_amount: "",
    moq: "",
    lead_time_days: "",
    payment_terms: "30% deposit, 70% before shipment",
    material_confirmation: "",
    validity_until: "",
    quality_score: "80",
    reliability_score: "80",
    risk_notes: "",
    notes: ""
  });
  const [productionForm, setProductionForm] = useState({
    item_name: "",
    process_name: "Frame production",
    status: "in_progress",
    progress_percent: "20",
    risk_level: "low",
    expected_at: "",
    notes: ""
  });
  const [inspectionForm, setInspectionForm] = useState({
    item_name: "",
    ai_match_score: "90",
    color_score: "90",
    geometry_score: "90",
    status: "pending",
    issues: "",
    reviewer_notes: ""
  });
  const [documentForm, setDocumentForm] = useState({
    document_type: "commercial_invoice",
    document_name: "",
    status: "pending_review",
    check_result: "",
    notes: ""
  });
  const [shipmentForm, setShipmentForm] = useState({
    reference_number: "",
    carrier: "",
    vessel_name: "",
    origin: "",
    destination: project?.projectLocation || "",
    etd: "",
    eta: "",
    status: "booking",
    current_location: "",
    tracking_url: "",
    container_type: "40HQ",
    container_count: "1",
    notes: ""
  });
  const [adjustmentForm, setAdjustmentForm] = useState({
    item_name: project?.items?.[0]?.typeEn || "",
    original_quantity: project?.items?.[0]?.qty || "",
    revised_quantity: project?.items?.[0]?.qty || "",
    unit_price: project?.items?.[0]?.unitPrice || "",
    reason: ""
  });
  const [handoverForm, setHandoverForm] = useState({
    status: "accepted",
    accepted_quantity: "",
    issue_summary: "",
    signed_by: "",
    signed_at: ""
  });

  const loadData = useCallback(async () => {
    if (!supabaseClient || !dbConnected) return;
    setLoading(true);
    setMessage("");
    const missing = [];

    const authResult = await supabaseClient.auth.getUser().catch(() => ({ data: { user: null } }));
    setAuthStatus(authResult?.data?.user ? "authenticated" : "anonymous");

    const readTable = async (table, queryBuilder) => {
      try {
        const { data: rows, error } = await queryBuilder(supabaseClient.from(table).select("*"));
        if (error) throw error;
        return rows || [];
      } catch (error) {
        if (/does not exist|schema cache|relation/i.test(error.message || "")) missing.push(table);
        else setMessage((current) => current || `${table}: ${error.message || error}`);
        return [];
      }
    };

    const supplierRows = await readTable("suppliers", (query) => query.order("name", { ascending: true }));
    setSuppliers(supplierRows);

    if (projectId) {
      const entries = await Promise.all(
        PROJECT_TABLES.map(async (table) => {
          const rows = await readTable(table, (query) =>
            query.eq("project_id", projectId).order("created_at", { ascending: false }).limit(100)
          );
          return [table, rows];
        })
      );
      setData(Object.fromEntries(entries));
    } else {
      setData(EMPTY_DATA);
    }

    setMissingTables([...new Set(missing)]);
    setLoading(false);
  }, [dbConnected, projectId, supabaseClient]);

  useEffect(() => {
    loadData();
    const refresh = () => loadData();
    window.addEventListener("crafton:workflow-refresh", refresh);
    return () => window.removeEventListener("crafton:workflow-refresh", refresh);
  }, [loadData]);

  useEffect(() => {
    setQuoteLineItems(quoteLinesFromProject(project));
    setQuoteFile(null);
    setEditingQuoteId("");
  }, [projectId]);

  const insert = async (table, payload) => {
    if (!supabaseClient || !projectId) throw new Error(adminText("Select a live Supabase project first.", lang));
    const { data: result, error } = await supabaseClient.from(table).insert(payload).select().single();
    if (error) throw error;
    return result;
  };

  const updateProjectStage = async (stage, extra = {}) => {
    const { error } = await supabaseClient
      .from("projects")
      .update({ current_stage: stage, ...extra })
      .eq("id", projectId);
    if (error) throw error;
    onProjectChanged?.();
  };

  const writeEvent = async (stageId, eventType, messageText, payload = {}) => {
    await insert("workflow_events", {
      project_id: projectId,
      stage_id: stageId,
      event_type: eventType,
      actor: "Cho",
      message_cn: messageText,
      message_en: messageText,
      payload
    });
  };

  const runAction = async (successMessage, action) => {
    try {
      if (authStatus !== "authenticated") {
        throw new Error(adminText("Sign in with a Supabase staff account before saving operational data.", lang));
      }
      setLoading(true);
      setMessage("");
      await action();
      setMessage(adminText(successMessage, lang));
      setActiveForm("");
      await loadData();
    } catch (error) {
      setMessage(adminText(error.message || String(error), lang));
      setLoading(false);
    }
  };

  const submitSupplier = (event) => {
    event.preventDefault();
    runAction("Supplier saved to Supabase.", async () => {
      const payload = {
        name: supplierForm.name,
        code: supplierForm.code || null,
        categories: valueList(supplierForm.category),
        contact_person: supplierForm.contact_name,
        email: supplierForm.contact_email,
        phone: supplierForm.phone,
        address: [supplierForm.country, supplierForm.city].filter(Boolean).join(" / "),
        capabilities: valueList(supplierForm.capabilities),
        rating: Number(supplierForm.quality_score || 0) / 20,
        reliability_score: Number(supplierForm.reliability_score || 0),
        notes: supplierForm.notes,
        is_active: true
      };
      const { error } = await supabaseClient.from("suppliers").insert(payload);
      if (error) throw error;
      setSupplierForm({
        ...supplierForm,
        name: "",
        code: "",
        contact_name: "",
        contact_email: "",
        phone: "",
        notes: ""
      });
    });
  };

  const quoteTotals = useMemo(() => {
    const quantity = quoteLineItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const total = quoteLineItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
      0
    );
    return { quantity, total, weightedUnitPrice: quantity ? total / quantity : 0 };
  }, [quoteLineItems]);

  const openQuoteForm = (rfqBatchId = "", supplierId = "") => {
    const supplier = suppliers.find((row) => row.id === supplierId);
    const batch = data.rfq_batches.find((row) => row.id === rfqBatchId);
    const existingQuote = data.supplier_quotes.find(
      (quote) => quote.rfq_batch_id === rfqBatchId && quote.supplier_id === supplierId
    );
    setQuoteForm((current) => ({
      ...current,
      rfq_batch_id: rfqBatchId,
      supplier_id: supplierId,
      quote_code:
        existingQuote?.quote_code ||
        (batch ? `${batch.rfq_code || "RFQ"}-${supplier?.code || String(supplierId).slice(0, 6).toUpperCase()}` : ""),
      currency: existingQuote?.currency || batch?.currency || current.currency || "USD",
      unit_price: "",
      total_amount: "",
      moq: existingQuote?.moq ?? current.moq,
      lead_time_days: existingQuote?.lead_time_days ?? current.lead_time_days,
      payment_terms: existingQuote?.payment_terms || current.payment_terms,
      material_confirmation: existingQuote?.material_confirmation || "",
      validity_until: existingQuote?.validity_until || "",
      risk_notes: existingQuote?.risk_notes || "",
      notes: existingQuote?.notes || "",
      quality_score: supplier?.rating ? Number(supplier.rating) * 20 : current.quality_score,
      reliability_score: supplier?.reliability_score || current.reliability_score
    }));
    const savedLines = existingQuote?.payload?.line_items;
    setQuoteLineItems(
      savedLines?.length
        ? savedLines.map((line) => ({ ...line, unit_price: String(line.unit_price || "") }))
        : quoteLinesFromProject(project)
    );
    setQuoteFile(null);
    setEditingQuoteId(existingQuote?.id || "");
    setActiveForm("quote");
  };

  const submitQuote = (event) => {
    event.preventDefault();
    const supplier = suppliers.find((row) => row.id === quoteForm.supplier_id);
    const existingQuote = data.supplier_quotes.find((row) => row.id === editingQuoteId);
    runAction("Supplier quote recorded and comparison refreshed.", async () => {
      if (!quoteLineItems.length || quoteLineItems.some((line) => Number(line.unit_price || 0) <= 0)) {
        throw new Error(t("Enter a unit price for every BOM item.", "请为每个 BOM 品项填写供应商单价。"));
      }

      let uploadedQuote = null;
      if (quoteFile) {
        if (quoteFile.size > 15 * 1024 * 1024) {
          throw new Error(t("Supplier quote files must be 15 MB or smaller.", "供应商报价文件不能超过 15 MB。"));
        }
        const { data: authData, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !authData?.user?.id) throw authError || new Error("Staff session unavailable.");
        const safeName = quoteFile.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
        const storagePath = `${authData.user.id}/supplier-quotes/${projectId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabaseClient.storage
          .from("intake-files")
          .upload(storagePath, quoteFile, {
            contentType: quoteFile.type || "application/octet-stream",
            upsert: false
          });
        if (uploadError) throw uploadError;
        const digest = await window.crypto.subtle.digest("SHA-256", await quoteFile.arrayBuffer());
        uploadedQuote = {
          storage_bucket: "intake-files",
          storage_path: storagePath,
          file_name: quoteFile.name,
          mime_type: quoteFile.type,
          size: quoteFile.size,
          sha256: Array.from(new Uint8Array(digest))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("")
        };
      }

      const quoteValues = {
        project_id: projectId,
        ...quoteForm,
        supplier_name: supplier?.name || "",
        unit_price: quoteTotals.weightedUnitPrice,
        total_amount: quoteTotals.total,
        moq: Number(quoteForm.moq || 0),
        lead_time_days: Number(quoteForm.lead_time_days || 0),
        quality_score: Number(quoteForm.quality_score || 0),
        reliability_score: Number(quoteForm.reliability_score || 0),
        validity_until: quoteForm.validity_until || null,
        received_at: new Date().toISOString(),
        status: "quoted",
        payload: {
          line_items: quoteLineItems.map((line) => ({
            ...line,
            unit_price: Number(line.unit_price || 0),
            line_total: Number(line.quantity || 0) * Number(line.unit_price || 0)
          })),
          supplier_quote_file: uploadedQuote || existingQuote?.payload?.supplier_quote_file || null
        }
      };
      let quote;
      if (editingQuoteId) {
        const { data: updatedQuote, error: updateError } = await supabaseClient
          .from("supplier_quotes")
          .update(quoteValues)
          .eq("id", editingQuoteId)
          .select()
          .single();
        if (updateError) throw updateError;
        quote = updatedQuote;
      } else {
        quote = await insert("supplier_quotes", quoteValues);
      }
      if (uploadedQuote) {
        await insert("project_files", {
          project_id: projectId,
          stage_id: "S07",
          file_group: "supplier_quote",
          file_name: uploadedQuote.file_name,
          file_path: uploadedQuote.storage_path,
          sha256: uploadedQuote.sha256,
          audit_hash: uploadedQuote.sha256,
          payload: {
            ...uploadedQuote,
            quote_id: quote.id,
            supplier_id: quoteForm.supplier_id,
            rfq_batch_id: quoteForm.rfq_batch_id
          }
        });
      }
      await writeEvent(
        "S07",
        editingQuoteId ? "supplier_quote_revised" : "supplier_quote_received",
        `Quote received from ${supplier?.name || "supplier"}.`,
        {
          supplier_id: quoteForm.supplier_id,
          quote_id: quote.id,
          rfq_batch_id: quoteForm.rfq_batch_id,
          total_amount: quoteTotals.total
        }
      );
      await updateProjectStage(7);
      setQuoteFile(null);
      setEditingQuoteId("");
    });
  };

  const selectQuote = (quote) => {
    runAction(`${quote.supplier_name} approved as selected supplier.`, async () => {
      const { error: resetError } = await supabaseClient
        .from("supplier_quotes")
        .update({ status: "not_selected" })
        .eq("project_id", projectId)
        .eq("rfq_batch_id", quote.rfq_batch_id);
      if (resetError) throw resetError;
      const { error: selectError } = await supabaseClient
        .from("supplier_quotes")
        .update({ status: "selected" })
        .eq("id", quote.id);
      if (selectError) throw selectError;
      await insert("approvals", {
        project_id: projectId,
        stage_id: "S08",
        approval_type: "supplier_selection",
        status: "approved",
        reviewer_name: "Cho",
        notes: `Selected ${quote.supplier_name} at ${money(quote.unit_price, quote.currency)} per unit.`,
        reviewed_at: new Date().toISOString(),
        payload: { quote_id: quote.id, supplier_id: quote.supplier_id, comparison_score: quote.comparisonScore }
      });
      await writeEvent("S08", "supplier_selected", `${quote.supplier_name} selected by Cho.`, { quote_id: quote.id });
      await updateProjectStage(9, { selected_supplier: quote });
    });
  };

  const submitProduction = (event) => {
    event.preventDefault();
    runAction("Production update saved.", async () => {
      await insert("production_updates", {
        project_id: projectId,
        ...productionForm,
        progress_percent: Number(productionForm.progress_percent || 0),
        expected_at: productionForm.expected_at || null
      });
      await writeEvent(
        "S09",
        "production_update",
        `${productionForm.process_name}: ${productionForm.progress_percent}%`,
        productionForm
      );
      if (productionForm.risk_level !== "low") {
        await writeEvent("S10", "delay_risk", `${productionForm.process_name} risk: ${productionForm.risk_level}.`, {
          risk_level: productionForm.risk_level,
          risk_score: productionForm.risk_level === "high" ? 85 : 55,
          next_action: productionForm.notes
        });
      }
      await updateProjectStage(productionForm.risk_level === "low" ? 9 : 10);
    });
  };

  const submitInspection = (event) => {
    event.preventDefault();
    runAction("Inspection report saved.", async () => {
      await insert("inspection_reports", {
        project_id: projectId,
        stage_id: "S11",
        report_code: `QC-${Date.now().toString().slice(-8)}`,
        ...inspectionForm,
        ai_match_score: Number(inspectionForm.ai_match_score || 0),
        color_score: Number(inspectionForm.color_score || 0),
        geometry_score: Number(inspectionForm.geometry_score || 0),
        issues: valueList(inspectionForm.issues),
        inspected_at: new Date().toISOString()
      });
      await writeEvent(
        "S11",
        "inspection_completed",
        `${inspectionForm.item_name || "Item"} inspection ${inspectionForm.status}.`,
        inspectionForm
      );
      await updateProjectStage(11);
    });
  };

  const approveInspection = (report) => {
    runAction("Inspection approved and project released to packing.", async () => {
      const { error } = await supabaseClient
        .from("inspection_reports")
        .update({ status: "approved" })
        .eq("id", report.id);
      if (error) throw error;
      await insert("approvals", {
        project_id: projectId,
        stage_id: "S11",
        approval_type: "quality_release",
        status: "approved",
        reviewer_name: "Cho",
        reviewed_at: new Date().toISOString(),
        payload: { inspection_report_id: report.id }
      });
      await updateProjectStage(12);
    });
  };

  const submitDocument = (event) => {
    event.preventDefault();
    runAction("Shipment document record saved.", async () => {
      await insert("shipment_documents", {
        project_id: projectId,
        stage_id: "S13",
        ...documentForm,
        uploaded_at: new Date().toISOString()
      });
      await writeEvent(
        "S13",
        "document_checked",
        `${documentForm.document_type}: ${documentForm.status}.`,
        documentForm
      );
      await updateProjectStage(13);
    });
  };

  const submitShipment = (event) => {
    event.preventDefault();
    runAction("Shipment tracking record saved.", async () => {
      await insert("shipments", {
        project_id: projectId,
        ...shipmentForm,
        container_count: Number(shipmentForm.container_count || 0),
        etd: shipmentForm.etd || null,
        eta: shipmentForm.eta || null
      });
      await writeEvent(
        "S14",
        "shipment_update",
        `${shipmentForm.reference_number || "Shipment"}: ${shipmentForm.status}.`,
        {
          location: shipmentForm.current_location,
          eta: shipmentForm.eta,
          carrier: shipmentForm.carrier
        }
      );
      await updateProjectStage(14);
    });
  };

  const submitAdjustment = (event) => {
    event.preventDefault();
    runAction("Quantity and financial adjustment recorded.", async () => {
      const original = Number(adjustmentForm.original_quantity || 0);
      const revised = Number(adjustmentForm.revised_quantity || 0);
      const unitPrice = Number(adjustmentForm.unit_price || 0);
      await insert("quantity_adjustments", {
        project_id: projectId,
        ...adjustmentForm,
        original_quantity: original,
        revised_quantity: revised,
        unit_price: unitPrice,
        financial_impact: (revised - original) * unitPrice
      });
      await writeEvent(
        "S15",
        "quantity_adjusted",
        `${adjustmentForm.item_name}: ${original} to ${revised}.`,
        adjustmentForm
      );
      await updateProjectStage(15);
    });
  };

  const submitHandover = (event) => {
    event.preventDefault();
    runAction("Handover report and approval saved.", async () => {
      const report = await insert("handover_reports", {
        project_id: projectId,
        ...handoverForm,
        accepted_quantity: Number(handoverForm.accepted_quantity || 0),
        signed_at: handoverForm.signed_at || null
      });
      await insert("approvals", {
        project_id: projectId,
        stage_id: "S16",
        approval_type: "client_handover",
        status: handoverForm.status === "accepted" ? "approved" : "needs_action",
        reviewer_name: handoverForm.signed_by,
        notes: handoverForm.issue_summary,
        reviewed_at: handoverForm.signed_at || new Date().toISOString(),
        payload: { handover_report_id: report.id }
      });
      await updateProjectStage(16);
    });
  };

  const archiveProject = () => {
    runAction("Project archive manifest generated with SHA-256 hash.", async () => {
      const manifest = {
        project_id: projectId,
        project_name: project?.orderId,
        generated_at: new Date().toISOString(),
        record_counts: Object.fromEntries(PROJECT_TABLES.map((table) => [table, data[table]?.length || 0]))
      };
      const digest = await window.crypto.subtle.digest(
        "SHA-256",
        new window.TextEncoder().encode(JSON.stringify(manifest))
      );
      const hash = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      await insert("project_files", {
        project_id: projectId,
        stage_id: "S17",
        file_group: "archive",
        file_name: "project-archive-manifest.json",
        sha256: hash,
        audit_hash: hash,
        payload: manifest
      });
      await writeEvent("S17", "project_archived", `Project archive created: ${hash.slice(0, 12)}.`, { sha256: hash });
      await updateProjectStage(17);
    });
  };

  const scoredQuotes = useMemo(() => {
    const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
    return calculateQuoteScores(
      data.supplier_quotes.map((quote) => ({ ...quote, suppliers: supplierMap.get(quote.supplier_id) }))
    );
  }, [data.supplier_quotes, suppliers]);
  const sourcingBatch = useMemo(
    () =>
      data.rfq_batches.find((batch) => batch.status === "sent") ||
      data.rfq_batches.find((batch) => batch.status === "approved") ||
      data.rfq_batches.find((batch) => batch.payload?.document) ||
      data.rfq_batches[0] ||
      null,
    [data.rfq_batches]
  );
  const sourcingQuotes = useMemo(
    () => data.supplier_quotes.filter((quote) => !sourcingBatch || quote.rfq_batch_id === sourcingBatch.id),
    [data.supplier_quotes, sourcingBatch]
  );
  const invitedSuppliers = useMemo(() => {
    const ids = sourcingBatch?.supplier_ids || [];
    return ids.map((id) => suppliers.find((supplier) => supplier.id === id)).filter(Boolean);
  }, [sourcingBatch, suppliers]);
  const sourcingResponseCount = new Set(sourcingQuotes.map((quote) => quote.supplier_id).filter(Boolean)).size;
  const quoteAnalysisFile = data.project_files.find(
    (file) =>
      file.file_group === "quote_analysis" &&
      (!sourcingBatch || file.payload?.analysis?.rfqBatchId === sourcingBatch.id)
  );
  const latestQuoteTime = Math.max(
    0,
    ...sourcingQuotes.map((quote) => new Date(quote.updated_at || quote.received_at || quote.created_at || 0).getTime())
  );
  const quoteAnalysisReady = Boolean(
    quoteAnalysisFile && new Date(quoteAnalysisFile.created_at || 0).getTime() >= latestQuoteTime
  );
  const sourcingScoredQuotes = sourcingBatch
    ? scoredQuotes.filter((quote) => quote.rfq_batch_id === sourcingBatch.id)
    : scoredQuotes;
  const selectedQuote = sourcingScoredQuotes.find((quote) => quote.status === "selected") || null;
  const sourcingSteps = [
    {
      label: t("Inquiry generated", "询盘已生成"),
      detail: sourcingBatch?.payload?.document ? sourcingBatch.rfq_code : t("Waiting for RFQ", "等待生成 RFQ"),
      done: Boolean(sourcingBatch?.payload?.document)
    },
    {
      label: t("Cho approved", "Cho 已批准"),
      detail: ["approved", "sent"].includes(sourcingBatch?.status)
        ? t("Approved", "已批准")
        : t("Review required", "需要审核"),
      done: ["approved", "sent"].includes(sourcingBatch?.status)
    },
    {
      label: t("Sent to suppliers", "已发送给供应商"),
      detail:
        sourcingBatch?.status === "sent"
          ? t(`${invitedSuppliers.length} invited`, `已邀请 ${invitedSuppliers.length} 家`)
          : t("Not sent", "尚未发送"),
      done: sourcingBatch?.status === "sent"
    },
    {
      label: t("Quotes returned", "报价已回传"),
      detail: t(
        `${sourcingResponseCount}/${invitedSuppliers.length || 0} received`,
        `已收到 ${sourcingResponseCount}/${invitedSuppliers.length || 0} 份`
      ),
      done: invitedSuppliers.length > 0 && sourcingResponseCount >= invitedSuppliers.length
    },
    {
      label: t("Best quote selected", "最优报价已选定"),
      detail:
        selectedQuote?.supplier_name ||
        (quoteAnalysisReady ? t("AI recommendation ready", "AI 建议已生成") : t("Waiting for comparison", "等待比价")),
      done: Boolean(selectedQuote)
    }
  ];

  if (!dbConnected)
    return localize(
      <Notice tone="error">
        Supabase is not connected. Configure the live database before testing this workspace.
      </Notice>
    );
  if (!projectId)
    return localize(
      <Notice tone="error">
        Select a customer project with a real Supabase project ID before entering operational data.
      </Notice>
    );

  const toolbar = (
    <div className="admin-ops-toolbar">
      <div>
        <strong>{project?.clientName || "Client"}</strong>
        <span>{project?.orderId || projectId}</span>
      </div>
      <button type="button" onClick={loadData} disabled={loading}>
        Refresh data
      </button>
    </div>
  );

  const statusBanner = (
    <>
      {authStatus === "anonymous" && (
        <Notice tone="error">
          Demo staff login is read-only. Sign in with a Supabase staff email and password to create RFQs, quotes,
          suppliers, production records and shipping records.
        </Notice>
      )}
      {message && (
        <Notice
          tone={
            /saved|approved|recorded|generated|sent|已保存|已批准|已记录|已生成|已发送|已刷新|已放行/i.test(message)
              ? "success"
              : "error"
          }
        >
          {message}
        </Notice>
      )}
      {missingTables.length > 0 && (
        <Notice tone="error">
          Missing Supabase tables: {missingTables.join(", ")}. Apply the latest migrations before testing.
        </Notice>
      )}
    </>
  );

  if (flow === "sourcing") {
    return localize(
      <div className="admin-ops-workspace">
        {toolbar}
        {statusBanner}
        <section className="sourcing-flow-overview">
          <div className="sourcing-flow-heading">
            <div>
              <span>{t("RFQ WORKFLOW", "询价工作流")}</span>
              <h3>{t("Supplier RFQ & Best Quote", "供应商询价与最优报价")}</h3>
            </div>
            <p>
              {t(
                "Generate → approve → send → collect supplier returns → AI comparison → Cho decision",
                "生成询盘 → 批准 → 发送 → 收集供应商回传 → AI 比价 → Cho 决策"
              )}
            </p>
          </div>
          <div className="sourcing-flow-steps">
            {sourcingSteps.map((step, index) => (
              <article
                className={step.done ? "done" : index === sourcingSteps.findIndex((row) => !row.done) ? "current" : ""}
                key={step.label}
              >
                <b>{String(index + 1).padStart(2, "0")}</b>
                <div>
                  <strong>{step.label}</strong>
                  <span>{step.detail}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <div className="admin-ops-grid">
          <StageSection
            stage="SUPPLIERS"
            title="Supplier directory"
            status={`${suppliers.length} active`}
            description="Reusable supplier contacts, capability tags and performance scores."
            wide
            actions={
              <button onClick={() => setActiveForm(activeForm === "supplier" ? "" : "supplier")}>Add supplier</button>
            }
          >
            {activeForm === "supplier" && (
              <form className="admin-ops-form" onSubmit={submitSupplier}>
                <Field label="Supplier name">
                  <input
                    required
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  />
                </Field>
                <Field label="Supplier code">
                  <input
                    value={supplierForm.code}
                    onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })}
                  />
                </Field>
                <Field label="Category">
                  <input
                    value={supplierForm.category}
                    onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                  />
                </Field>
                <Field label="Capabilities">
                  <input
                    placeholder="chairs, upholstery, metalwork"
                    value={supplierForm.capabilities}
                    onChange={(e) => setSupplierForm({ ...supplierForm, capabilities: e.target.value })}
                  />
                </Field>
                <Field label="Contact">
                  <input
                    value={supplierForm.contact_name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contact_name: e.target.value })}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={supplierForm.contact_email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contact_email: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  />
                </Field>
                <Field label="Country / city">
                  <input
                    value={`${supplierForm.country}${supplierForm.city ? ` / ${supplierForm.city}` : ""}`}
                    onChange={(e) => {
                      const [country, city = ""] = e.target.value.split("/");
                      setSupplierForm({ ...supplierForm, country: country.trim(), city: city.trim() });
                    }}
                  />
                </Field>
                <Field label="Quality score">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={supplierForm.quality_score}
                    onChange={(e) => setSupplierForm({ ...supplierForm, quality_score: e.target.value })}
                  />
                </Field>
                <Field label="Reliability">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={supplierForm.reliability_score}
                    onChange={(e) => setSupplierForm({ ...supplierForm, reliability_score: e.target.value })}
                  />
                </Field>
                <Field label="Notes" wide>
                  <textarea
                    value={supplierForm.notes}
                    onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  />
                </Field>
                <div className="admin-ops-form-actions">
                  <button className="btn-premium" disabled={loading}>
                    Save supplier
                  </button>
                </div>
              </form>
            )}
            {suppliers.length ? (
              <div className="admin-table-wrap">
                <table className="admin-mini-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Capabilities</th>
                      <th>Contact</th>
                      <th>Quality</th>
                      <th>Reliability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td>
                          <strong>{supplier.name}</strong>
                          <br />
                          <small>{supplier.code || supplier.category || "-"}</small>
                        </td>
                        <td>{(supplier.capabilities || []).join(", ") || "-"}</td>
                        <td>
                          {supplier.contact_person || "-"}
                          <br />
                          <small>{supplier.email || supplier.phone}</small>
                        </td>
                        <td>{supplier.rating ? Math.round(Number(supplier.rating) * 20) : "-"}</td>
                        <td>{supplier.reliability_score || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No suppliers yet. Add the first supplier before creating an RFQ.</Empty>
            )}
          </StageSection>

          <StageSection
            stage="S06"
            title="AI RFQ preparation and dispatch"
            status={data.rfq_batches[0]?.status || "pending"}
            description="Generate a bilingual supplier RFQ from verified Supabase order data, review it, retain every version and dispatch it after Cho approval."
            wide
          >
            <AiRfqWorkspace
              lang={lang}
              project={project}
              supabaseClient={supabaseClient}
              batches={data.rfq_batches}
              projectFiles={data.project_files}
              intakeFiles={data.intake_files}
              intakeJobs={data.intake_jobs}
              specifications={project?.specifications || []}
              suppliers={suppliers}
              onChanged={loadData}
            />
          </StageSection>

          <StageSection
            stage="S07"
            title="Quote intake and normalized comparison"
            status={`${scoredQuotes.length} quotes`}
            description="Record commercial terms and compare price, lead time, quality and supplier reliability."
            wide
            actions={
              <button
                onClick={() => (activeForm === "quote" ? setActiveForm("") : openQuoteForm(sourcingBatch?.id || ""))}
              >
                {t("Record quote", "录入报价")}
              </button>
            }
          >
            <div className="supplier-response-tracker">
              <div className="supplier-response-heading">
                <div>
                  <strong>{t("Supplier response tracker", "供应商回传跟踪")}</strong>
                  <span>
                    {sourcingBatch
                      ? `${sourcingBatch.rfq_code} · ${t("Due", "截止")} ${shortDate(sourcingBatch.due_at)}`
                      : t("Generate and save an RFQ to start tracking.", "生成并保存 RFQ 后即可开始跟踪。")}
                  </span>
                </div>
                {sourcingBatch?.status === "sent" && (
                  <b>
                    {t(
                      `${sourcingResponseCount} of ${invitedSuppliers.length} returned`,
                      `已回传 ${sourcingResponseCount}/${invitedSuppliers.length}`
                    )}
                  </b>
                )}
              </div>
              {invitedSuppliers.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-mini-table supplier-response-table">
                    <thead>
                      <tr>
                        <th>{t("Supplier", "供应商")}</th>
                        <th>{t("Sent", "发送时间")}</th>
                        <th>{t("Due", "截止时间")}</th>
                        <th>{t("Response", "回传状态")}</th>
                        <th>{t("Quoted total", "报价总额")}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitedSuppliers.map((supplier) => {
                        const quote = sourcingQuotes.find((row) => row.supplier_id === supplier.id);
                        const overdue =
                          !quote &&
                          sourcingBatch?.status === "sent" &&
                          sourcingBatch?.due_at &&
                          new Date(sourcingBatch.due_at).getTime() < Date.now();
                        const responseStatus = quote
                          ? t("Received", "已回传")
                          : sourcingBatch?.status !== "sent"
                            ? t("Not sent", "尚未发送")
                            : overdue
                              ? t("Overdue", "已逾期")
                              : t("Awaiting", "等待回传");
                        return (
                          <tr key={supplier.id}>
                            <td>
                              <strong>{supplier.name}</strong>
                              <br />
                              <small>
                                {supplier.email || supplier.contact_email || t("Email missing", "缺少邮箱")}
                              </small>
                            </td>
                            <td>{shortDate(sourcingBatch?.sent_at)}</td>
                            <td>{shortDate(sourcingBatch?.due_at)}</td>
                            <td>
                              <b data-state={quote ? "received" : overdue ? "overdue" : "waiting"}>{responseStatus}</b>
                            </td>
                            <td>{quote ? money(quote.total_amount, quote.currency) : "-"}</td>
                            <td>
                              <button type="button" onClick={() => openQuoteForm(sourcingBatch.id, supplier.id)}>
                                {quote ? t("Record revision", "记录修订版") : t("Record return", "录入回传报价")}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>
                  {t(
                    "Select suppliers in S06 and save the RFQ to create the response list.",
                    "请在 S06 选择供应商并保存 RFQ，以建立回传名单。"
                  )}
                </Empty>
              )}
            </div>
            {activeForm === "quote" && (
              <form className="admin-ops-form" onSubmit={submitQuote}>
                <Field label="RFQ batch">
                  <select
                    required
                    value={quoteForm.rfq_batch_id}
                    onChange={(e) => setQuoteForm({ ...quoteForm, rfq_batch_id: e.target.value })}
                  >
                    <option value="">Select RFQ</option>
                    {data.rfq_batches.map((rfq) => (
                      <option key={rfq.id} value={rfq.id}>
                        {rfq.rfq_code || rfq.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Supplier">
                  <select
                    required
                    value={quoteForm.supplier_id}
                    onChange={(e) => {
                      const supplier = suppliers.find((row) => row.id === e.target.value);
                      setQuoteForm({
                        ...quoteForm,
                        supplier_id: e.target.value,
                        quality_score: supplier?.rating ? Number(supplier.rating) * 20 : quoteForm.quality_score,
                        reliability_score: supplier?.reliability_score || quoteForm.reliability_score
                      });
                    }}
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quote code">
                  <input
                    value={quoteForm.quote_code}
                    onChange={(e) => setQuoteForm({ ...quoteForm, quote_code: e.target.value })}
                  />
                </Field>
                <Field label="Currency">
                  <select
                    value={quoteForm.currency}
                    onChange={(e) => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                  >
                    <option>USD</option>
                    <option>CNY</option>
                    <option>GBP</option>
                    <option>EUR</option>
                  </select>
                </Field>
                <div className="quote-line-editor wide">
                  <div>
                    <strong>{t("BOM item pricing", "BOM 逐项报价")}</strong>
                    <span>
                      {t("Enter the supplier's unit price for every requested item.", "请录入供应商对每个品项的单价。")}
                    </span>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-mini-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{t("Item", "品项")}</th>
                          <th>{t("Qty", "数量")}</th>
                          <th>{t("Unit price", "单价")}</th>
                          <th>{t("Line total", "小计")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quoteLineItems.map((line, index) => (
                          <tr key={line.item_id}>
                            <td>{line.item_no}</td>
                            <td>
                              <strong>{line.item_name}</strong>
                            </td>
                            <td>
                              {line.quantity} {line.unit}
                            </td>
                            <td>
                              <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={line.unit_price}
                                onChange={(event) =>
                                  setQuoteLineItems((current) =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, unit_price: event.target.value } : item
                                    )
                                  )
                                }
                              />
                            </td>
                            <td>
                              {money(Number(line.quantity || 0) * Number(line.unit_price || 0), quoteForm.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th colSpan="3">{t("Comparable total", "可比总价")}</th>
                          <th>
                            {money(quoteTotals.weightedUnitPrice, quoteForm.currency)} / {t("unit", "件")}
                          </th>
                          <th>{money(quoteTotals.total, quoteForm.currency)}</th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <Field label="MOQ">
                  <input
                    type="number"
                    min="0"
                    value={quoteForm.moq}
                    onChange={(e) => setQuoteForm({ ...quoteForm, moq: e.target.value })}
                  />
                </Field>
                <Field label="Lead time (days)">
                  <input
                    required
                    type="number"
                    min="1"
                    value={quoteForm.lead_time_days}
                    onChange={(e) => setQuoteForm({ ...quoteForm, lead_time_days: e.target.value })}
                  />
                </Field>
                <Field label="Payment terms">
                  <input
                    value={quoteForm.payment_terms}
                    onChange={(e) => setQuoteForm({ ...quoteForm, payment_terms: e.target.value })}
                  />
                </Field>
                <Field label="Valid until">
                  <input
                    type="date"
                    value={quoteForm.validity_until}
                    onChange={(e) => setQuoteForm({ ...quoteForm, validity_until: e.target.value })}
                  />
                </Field>
                <Field label="Material confirmation">
                  <input
                    value={quoteForm.material_confirmation}
                    onChange={(e) => setQuoteForm({ ...quoteForm, material_confirmation: e.target.value })}
                  />
                </Field>
                <Field label="Risk notes">
                  <input
                    value={quoteForm.risk_notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, risk_notes: e.target.value })}
                  />
                </Field>
                <Field label={t("Supplier quote file", "供应商报价文件")} wide>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg,.jpeg,.webp"
                    onChange={(event) => setQuoteFile(event.target.files?.[0] || null)}
                  />
                  <small>
                    {t(
                      "Optional; PDF, spreadsheet, document or image up to 15 MB.",
                      "可选；支持 PDF、表格、文档或图片，最大 15 MB。"
                    )}
                  </small>
                </Field>
                <Field label={t("Internal notes", "内部备注")} wide>
                  <textarea
                    value={quoteForm.notes}
                    onChange={(event) => setQuoteForm({ ...quoteForm, notes: event.target.value })}
                  />
                </Field>
                <div className="admin-ops-form-actions">
                  <button type="button" onClick={() => setActiveForm("")} disabled={loading}>
                    {t("Cancel", "取消")}
                  </button>
                  <button className="btn-premium" disabled={loading || !quoteLineItems.length}>
                    {t("Save supplier return", "保存供应商回传")}
                  </button>
                </div>
              </form>
            )}
            <AiQuoteComparison
              lang={lang}
              project={project}
              supabaseClient={supabaseClient}
              batches={data.rfq_batches}
              quotes={data.supplier_quotes}
              projectFiles={data.project_files}
              onChanged={loadData}
            />
          </StageSection>

          <StageSection
            stage="S08"
            title="Cho supplier decision"
            status={selectedQuote ? "approved" : "needs review"}
            description="Human gate: review normalized terms and approve the winning supplier."
            wide
          >
            {sourcingScoredQuotes.length > 0 && !quoteAnalysisReady && (
              <Notice tone="error">
                {t(
                  "Run the S07 AI quotation comparison before Cho approves the winning supplier.",
                  "请先在 S07 运行 AI 报价比较，再由 Cho 批准最终供应商。"
                )}
              </Notice>
            )}
            {sourcingScoredQuotes.length ? (
              <div className="admin-ops-quote-cards">
                {sourcingScoredQuotes.map((quote, index) => (
                  <article key={quote.id} className={quote.status === "selected" ? "selected" : ""}>
                    <span>{quoteAnalysisReady ? `Rank #${index + 1}` : t("AI rank pending", "等待 AI 排名")}</span>
                    <h4>{quote.supplier_name || quote.suppliers?.name}</h4>
                    <strong>{money(quote.unit_price, quote.currency)} / unit</strong>
                    <p>
                      {quote.lead_time_days} days · score {quote.comparisonScore}
                    </p>
                    <button
                      className="btn-premium"
                      disabled={loading || quote.status === "selected" || !quoteAnalysisReady}
                      onClick={() => selectQuote(quote)}
                    >
                      {quote.status === "selected" ? "Selected" : "Approve supplier"}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>At least one quote is required before Cho can approve a supplier.</Empty>
            )}
          </StageSection>
        </div>
      </div>
    );
  }

  if (flow === "production") {
    const riskUpdates = data.production_updates.filter((row) => row.risk_level && row.risk_level !== "low");
    return localize(
      <div className="admin-ops-workspace">
        {toolbar}
        {statusBanner}
        <div className="admin-ops-grid">
          <StageSection
            stage="S09"
            title="Production progress"
            status={data.production_updates[0]?.status || "pending"}
            description="Record work package progress, expected dates, risks and supplier evidence."
            wide
            actions={
              <button onClick={() => setActiveForm(activeForm === "production" ? "" : "production")}>Add update</button>
            }
          >
            <AiOperationsAutomation
              scope="production"
              lang={lang}
              project={project}
              supabaseClient={supabaseClient}
              projectFiles={data.project_files}
              productionUpdates={data.production_updates}
              shipmentDocuments={data.shipment_documents}
              onChanged={loadData}
              onOpenLoadingAi={onOpenLoadingAi}
            />
            {activeForm === "production" && (
              <form className="admin-ops-form" onSubmit={submitProduction}>
                <Field label="Item / package">
                  <input
                    required
                    value={productionForm.item_name}
                    onChange={(e) => setProductionForm({ ...productionForm, item_name: e.target.value })}
                  />
                </Field>
                <Field label="Process">
                  <select
                    value={productionForm.process_name}
                    onChange={(e) => setProductionForm({ ...productionForm, process_name: e.target.value })}
                  >
                    <option>Material procurement</option>
                    <option>Frame production</option>
                    <option>Upholstery</option>
                    <option>Finishing</option>
                    <option>Assembly</option>
                    <option>Pre-shipment QC</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={productionForm.status}
                    onChange={(e) => setProductionForm({ ...productionForm, status: e.target.value })}
                  >
                    <option>not_started</option>
                    <option>in_progress</option>
                    <option>blocked</option>
                    <option>completed</option>
                  </select>
                </Field>
                <Field label="Progress %">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={productionForm.progress_percent}
                    onChange={(e) => setProductionForm({ ...productionForm, progress_percent: e.target.value })}
                  />
                </Field>
                <Field label="Risk">
                  <select
                    value={productionForm.risk_level}
                    onChange={(e) => setProductionForm({ ...productionForm, risk_level: e.target.value })}
                  >
                    <option>low</option>
                    <option>medium</option>
                    <option>high</option>
                  </select>
                </Field>
                <Field label="Expected completion">
                  <input
                    type="datetime-local"
                    value={productionForm.expected_at}
                    onChange={(e) => setProductionForm({ ...productionForm, expected_at: e.target.value })}
                  />
                </Field>
                <Field label="Notes / evidence" wide>
                  <textarea
                    value={productionForm.notes}
                    onChange={(e) => setProductionForm({ ...productionForm, notes: e.target.value })}
                  />
                </Field>
                <div className="admin-ops-form-actions">
                  <button className="btn-premium" disabled={loading}>
                    Save update
                  </button>
                </div>
              </form>
            )}
            {data.production_updates.length ? (
              <div className="admin-table-wrap">
                <table className="admin-mini-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Process</th>
                      <th>Progress</th>
                      <th>Risk</th>
                      <th>Expected</th>
                      <th>Reported</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.production_updates.map((row) => (
                      <tr key={row.id}>
                        <td>{row.item_name || "-"}</td>
                        <td>
                          {row.process_name}
                          <br />
                          <small>{row.status}</small>
                        </td>
                        <td>
                          <progress max="100" value={row.progress_percent || 0} /> {row.progress_percent || 0}%
                        </td>
                        <td>{row.risk_level}</td>
                        <td>{shortDate(row.expected_at)}</td>
                        <td>{shortDate(row.reported_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No production records for this project.</Empty>
            )}
          </StageSection>
          <StageSection
            stage="S10"
            title="Delay risk control"
            status={riskUpdates.length ? `${riskUpdates.length} risks` : "clear"}
            description="Escalation view generated from real production risk records."
          >
            {riskUpdates.length ? (
              riskUpdates.map((row) => (
                <Notice key={row.id} tone="error">
                  <strong>
                    {row.item_name}: {row.risk_level}
                  </strong>
                  <br />
                  {row.process_name} · {row.notes || "Follow-up required"}
                </Notice>
              ))
            ) : (
              <Notice tone="success">No medium or high production risks are currently recorded.</Notice>
            )}
          </StageSection>
          <StageSection
            stage="S11"
            title="Visual quality inspection"
            status={data.inspection_reports[0]?.status || "pending"}
            description="Record CAD/photo match, colour and geometry scores, defects and Cho release."
            wide
            actions={
              <button onClick={() => setActiveForm(activeForm === "inspection" ? "" : "inspection")}>New report</button>
            }
          >
            {activeForm === "inspection" && (
              <form className="admin-ops-form" onSubmit={submitInspection}>
                <Field label="Item">
                  <input
                    required
                    value={inspectionForm.item_name}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, item_name: e.target.value })}
                  />
                </Field>
                <Field label="Match score">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={inspectionForm.ai_match_score}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, ai_match_score: e.target.value })}
                  />
                </Field>
                <Field label="Colour score">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={inspectionForm.color_score}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, color_score: e.target.value })}
                  />
                </Field>
                <Field label="Geometry score">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={inspectionForm.geometry_score}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, geometry_score: e.target.value })}
                  />
                </Field>
                <Field label="Result">
                  <select
                    value={inspectionForm.status}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, status: e.target.value })}
                  >
                    <option>pending</option>
                    <option>passed</option>
                    <option>failed</option>
                    <option>rework_required</option>
                  </select>
                </Field>
                <Field label="Issue tags">
                  <input
                    placeholder="colour mismatch, scratch"
                    value={inspectionForm.issues}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, issues: e.target.value })}
                  />
                </Field>
                <Field label="Reviewer notes" wide>
                  <textarea
                    value={inspectionForm.reviewer_notes}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, reviewer_notes: e.target.value })}
                  />
                </Field>
                <div className="admin-ops-form-actions">
                  <button className="btn-premium" disabled={loading}>
                    Save inspection
                  </button>
                </div>
              </form>
            )}
            {data.inspection_reports.length ? (
              <div className="admin-table-wrap">
                <table className="admin-mini-table">
                  <thead>
                    <tr>
                      <th>Report</th>
                      <th>Item</th>
                      <th>Match / colour / geometry</th>
                      <th>Issues</th>
                      <th>Status</th>
                      <th>Gate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.inspection_reports.map((row) => (
                      <tr key={row.id}>
                        <td>{row.report_code}</td>
                        <td>{row.item_name}</td>
                        <td>
                          {row.ai_match_score || "-"} / {row.color_score || "-"} / {row.geometry_score || "-"}
                        </td>
                        <td>{Array.isArray(row.issues) ? row.issues.join(", ") : "-"}</td>
                        <td>{row.status}</td>
                        <td>
                          <button
                            disabled={loading || row.status === "approved"}
                            onClick={() => approveInspection(row)}
                          >
                            {row.status === "approved" ? "Approved" : "Approve & release"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No inspection reports yet.</Empty>
            )}
          </StageSection>
        </div>
      </div>
    );
  }

  return localize(
    <div className="admin-ops-workspace">
      {toolbar}
      {statusBanner}
      <div className="admin-ops-grid">
        <StageSection
          stage="S12"
          title="Container loading plan"
          status={data.packing_plans[0]?.status || "pending"}
          description="Open Loading AI with this project's BOM dimensions and save its packing result back to Supabase."
          wide
          actions={
            <button className="btn-premium" onClick={() => onOpenLoadingAi?.({ project, projectId })}>
              Open Loading AI
            </button>
          }
        >
          <AiOperationsAutomation
            scope="delivery"
            lang={lang}
            project={project}
            supabaseClient={supabaseClient}
            projectFiles={data.project_files}
            productionUpdates={data.production_updates}
            shipmentDocuments={data.shipment_documents}
            onChanged={loadData}
            onOpenLoadingAi={onOpenLoadingAi}
          />
          {data.packing_plans.length ? (
            <div className="admin-table-wrap">
              <table className="admin-mini-table">
                <thead>
                  <tr>
                    <th>Generated</th>
                    <th>Engine</th>
                    <th>Container</th>
                    <th>Count</th>
                    <th>Utilization</th>
                    <th>Unpacked</th>
                  </tr>
                </thead>
                <tbody>
                  {data.packing_plans.map((row) => (
                    <tr key={row.id}>
                      <td>{shortDate(row.generated_at)}</td>
                      <td>{row.engine_mode}</td>
                      <td>{row.container_type || "-"}</td>
                      <td>{row.total_containers}</td>
                      <td>{row.utilization_percent || 0}%</td>
                      <td>{row.unpacked_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No saved loading plan. Open Loading AI and save a computed result.</Empty>
          )}
        </StageSection>
        <StageSection
          stage="S13"
          title="Export document compliance"
          status={data.shipment_documents[0]?.status || "pending"}
          description="Register invoice, packing list, customs, IPPC and bill of lading checks."
          wide
          actions={
            <button onClick={() => setActiveForm(activeForm === "document" ? "" : "document")}>Add document</button>
          }
        >
          {activeForm === "document" && (
            <form className="admin-ops-form" onSubmit={submitDocument}>
              <Field label="Document type">
                <select
                  value={documentForm.document_type}
                  onChange={(e) => setDocumentForm({ ...documentForm, document_type: e.target.value })}
                >
                  <option>commercial_invoice</option>
                  <option>packing_list</option>
                  <option>customs_declaration</option>
                  <option>ippc_certificate</option>
                  <option>bill_of_lading</option>
                  <option>insurance</option>
                </select>
              </Field>
              <Field label="Document name">
                <input
                  required
                  value={documentForm.document_name}
                  onChange={(e) => setDocumentForm({ ...documentForm, document_name: e.target.value })}
                />
              </Field>
              <Field label="Check status">
                <select
                  value={documentForm.status}
                  onChange={(e) => setDocumentForm({ ...documentForm, status: e.target.value })}
                >
                  <option>pending_review</option>
                  <option>passed</option>
                  <option>blocked</option>
                  <option>revision_required</option>
                </select>
              </Field>
              <Field label="Check result">
                <input
                  value={documentForm.check_result}
                  onChange={(e) => setDocumentForm({ ...documentForm, check_result: e.target.value })}
                />
              </Field>
              <Field label="Notes" wide>
                <textarea
                  value={documentForm.notes}
                  onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })}
                />
              </Field>
              <div className="admin-ops-form-actions">
                <button className="btn-premium" disabled={loading}>
                  Save document check
                </button>
              </div>
            </form>
          )}
          {data.shipment_documents.length ? (
            <div className="admin-table-wrap">
              <table className="admin-mini-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Result</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.shipment_documents.map((row) => (
                    <tr key={row.id}>
                      <td>{row.document_name}</td>
                      <td>{row.document_type}</td>
                      <td>{row.status}</td>
                      <td>{row.check_result || row.notes || "-"}</td>
                      <td>{shortDate(row.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No export documents recorded.</Empty>
          )}
        </StageSection>
        <StageSection
          stage="S14"
          title="Shipment and freight tracking"
          status={data.shipments[0]?.status || "pending"}
          description="Maintain booking reference, carrier, vessel, ports, ETD/ETA and current location."
          wide
          actions={
            <button onClick={() => setActiveForm(activeForm === "shipment" ? "" : "shipment")}>Add tracking</button>
          }
        >
          {activeForm === "shipment" && (
            <form className="admin-ops-form" onSubmit={submitShipment}>
              <Field label="Reference">
                <input
                  required
                  value={shipmentForm.reference_number}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, reference_number: e.target.value })}
                />
              </Field>
              <Field label="Carrier">
                <input
                  value={shipmentForm.carrier}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, carrier: e.target.value })}
                />
              </Field>
              <Field label="Vessel">
                <input
                  value={shipmentForm.vessel_name}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, vessel_name: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <select
                  value={shipmentForm.status}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, status: e.target.value })}
                >
                  <option>booking</option>
                  <option>loaded</option>
                  <option>departed</option>
                  <option>in_transit</option>
                  <option>customs</option>
                  <option>delivered</option>
                  <option>delayed</option>
                </select>
              </Field>
              <Field label="Origin">
                <input
                  value={shipmentForm.origin}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, origin: e.target.value })}
                />
              </Field>
              <Field label="Destination">
                <input
                  value={shipmentForm.destination}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, destination: e.target.value })}
                />
              </Field>
              <Field label="ETD">
                <input
                  type="datetime-local"
                  value={shipmentForm.etd}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, etd: e.target.value })}
                />
              </Field>
              <Field label="ETA">
                <input
                  type="datetime-local"
                  value={shipmentForm.eta}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, eta: e.target.value })}
                />
              </Field>
              <Field label="Current location">
                <input
                  value={shipmentForm.current_location}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, current_location: e.target.value })}
                />
              </Field>
              <Field label="Tracking URL">
                <input
                  type="url"
                  value={shipmentForm.tracking_url}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, tracking_url: e.target.value })}
                />
              </Field>
              <Field label="Container type / count">
                <input
                  value={`${shipmentForm.container_type} / ${shipmentForm.container_count}`}
                  onChange={(e) => {
                    const [type, count = "1"] = e.target.value.split("/");
                    setShipmentForm({ ...shipmentForm, container_type: type.trim(), container_count: count.trim() });
                  }}
                />
              </Field>
              <Field label="Notes">
                <input
                  value={shipmentForm.notes}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, notes: e.target.value })}
                />
              </Field>
              <div className="admin-ops-form-actions">
                <button className="btn-premium" disabled={loading}>
                  Save tracking update
                </button>
              </div>
            </form>
          )}
          {data.shipments.length ? (
            <div className="admin-table-wrap">
              <table className="admin-mini-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Carrier / vessel</th>
                    <th>Route</th>
                    <th>Status / location</th>
                    <th>ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.shipments.map((row) => (
                    <tr key={row.id}>
                      <td>{row.reference_number}</td>
                      <td>
                        {row.carrier || "-"}
                        <br />
                        <small>{row.vessel_name}</small>
                      </td>
                      <td>
                        {row.origin || "-"} → {row.destination || "-"}
                      </td>
                      <td>
                        {row.status}
                        <br />
                        <small>{row.current_location}</small>
                      </td>
                      <td>{shortDate(row.eta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No shipment tracking record.</Empty>
          )}
        </StageSection>
        <StageSection
          stage="S15"
          title="Split delivery and quantity audit"
          status={data.quantity_adjustments.length ? "recalculated" : "pending"}
          description="Record approved quantity changes and calculate their commercial impact."
          actions={
            <button onClick={() => setActiveForm(activeForm === "adjustment" ? "" : "adjustment")}>
              New adjustment
            </button>
          }
        >
          {activeForm === "adjustment" && (
            <form className="admin-ops-form one-column" onSubmit={submitAdjustment}>
              <Field label="Item">
                <input
                  required
                  value={adjustmentForm.item_name}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, item_name: e.target.value })}
                />
              </Field>
              <Field label="Original quantity">
                <input
                  type="number"
                  required
                  value={adjustmentForm.original_quantity}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, original_quantity: e.target.value })}
                />
              </Field>
              <Field label="Revised quantity">
                <input
                  type="number"
                  required
                  value={adjustmentForm.revised_quantity}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, revised_quantity: e.target.value })}
                />
              </Field>
              <Field label="Unit price">
                <input
                  type="number"
                  step="0.01"
                  value={adjustmentForm.unit_price}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, unit_price: e.target.value })}
                />
              </Field>
              <Field label="Reason">
                <textarea
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                />
              </Field>
              <div className="admin-ops-form-actions">
                <button className="btn-premium" disabled={loading}>
                  Apply adjustment
                </button>
              </div>
            </form>
          )}
          {data.quantity_adjustments.length ? (
            data.quantity_adjustments.map((row) => (
              <Notice key={row.id}>
                <strong>{row.item_name}</strong>
                <br />
                {row.original_quantity} → {row.revised_quantity} · impact {money(row.financial_impact)}
              </Notice>
            ))
          ) : (
            <Empty>No quantity adjustments.</Empty>
          )}
        </StageSection>
        <StageSection
          stage="S16"
          title="Client handover"
          status={data.handover_reports[0]?.status || "pending"}
          description="Record accepted quantity, issues and client sign-off."
          actions={
            <button onClick={() => setActiveForm(activeForm === "handover" ? "" : "handover")}>Record handover</button>
          }
        >
          {activeForm === "handover" && (
            <form className="admin-ops-form one-column" onSubmit={submitHandover}>
              <Field label="Status">
                <select
                  value={handoverForm.status}
                  onChange={(e) => setHandoverForm({ ...handoverForm, status: e.target.value })}
                >
                  <option>accepted</option>
                  <option>accepted_with_issues</option>
                  <option>rejected</option>
                </select>
              </Field>
              <Field label="Accepted quantity">
                <input
                  type="number"
                  value={handoverForm.accepted_quantity}
                  onChange={(e) => setHandoverForm({ ...handoverForm, accepted_quantity: e.target.value })}
                />
              </Field>
              <Field label="Signed by">
                <input
                  required
                  value={handoverForm.signed_by}
                  onChange={(e) => setHandoverForm({ ...handoverForm, signed_by: e.target.value })}
                />
              </Field>
              <Field label="Signed at">
                <input
                  type="datetime-local"
                  value={handoverForm.signed_at}
                  onChange={(e) => setHandoverForm({ ...handoverForm, signed_at: e.target.value })}
                />
              </Field>
              <Field label="Issue summary">
                <textarea
                  value={handoverForm.issue_summary}
                  onChange={(e) => setHandoverForm({ ...handoverForm, issue_summary: e.target.value })}
                />
              </Field>
              <div className="admin-ops-form-actions">
                <button className="btn-premium" disabled={loading}>
                  Save handover
                </button>
              </div>
            </form>
          )}
          {data.handover_reports.length ? (
            data.handover_reports.map((row) => (
              <Notice key={row.id} tone={row.status === "accepted" ? "success" : "error"}>
                <strong>{row.status}</strong>
                <br />
                {row.accepted_quantity} accepted · {row.signed_by || "unsigned"} · {shortDate(row.signed_at)}
              </Notice>
            ))
          ) : (
            <Empty>No client handover record.</Empty>
          )}
        </StageSection>
        <StageSection
          stage="S17"
          title="Audit archive"
          status={data.project_files.some((row) => row.stage_id === "S17") ? "archived" : "pending"}
          description="Generate a manifest of project records and save a SHA-256 audit hash."
          wide
          actions={
            <button className="btn-premium" disabled={loading} onClick={archiveProject}>
              Generate archive
            </button>
          }
        >
          {data.project_files.filter((row) => row.stage_id === "S17").length ? (
            <div className="admin-table-wrap">
              <table className="admin-mini-table">
                <thead>
                  <tr>
                    <th>Manifest</th>
                    <th>SHA-256</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.project_files
                    .filter((row) => row.stage_id === "S17")
                    .map((row) => (
                      <tr key={row.id}>
                        <td>{row.file_name}</td>
                        <td>
                          <code>{row.sha256}</code>
                        </td>
                        <td>{shortDate(row.created_at)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No audit archive generated.</Empty>
          )}
        </StageSection>
      </div>
    </div>
  );
}
