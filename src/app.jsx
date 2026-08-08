/**
 * Crafton AI - Premium Interactive React Prototype Engine
 * Dual-Facing: (1) Client Website & Portal (2) Internal Backoffice & OpenClaw Console
 */

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import mockData from "./mockData";

// Modularized components
import ChairSVG from "./components/ChairSVG";
import MaterialStudio from "./components/MaterialStudio";
import CVQASimulator from "./components/CVQASimulator";
import ClientPortalTeaser from "./components/ClientPortalTeaser";
import ErrorBoundary from "./components/ErrorBoundary";
import MaterialLibrary from "./components/MaterialLibrary";
import ContactBlock from "./components/ContactBlock";
import ProjectDetailModal from "./components/ProjectDetailModal";
import Footer from "./components/Footer";
import { SetFurnitureCatalog, SetFurnitureShowcase } from "./components/SetFurniture";
import AdminWorkflowWorkspace from "./components/AdminWorkflowWorkspace";
import ClientOrderDashboard from "./components/ClientOrderDashboard";
import CraftonHomepage from "./components/CraftonHomepage";
import { AdminLocalized, adminText } from "./adminI18n";

const IMAGES = {
  heroChair: "/hero_chair.jpg", // 侘寂奢華皮質單椅 (取代 image1)
  workflowPhases: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop", // 手作工坊布樣與尺規 (取代 image2)
  masterShowwall: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop", // 意式奢華客廳實景 (取代 image3)
  wabiTextures: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop", // 暖沙天然洞石幾何特寫 (取代 image4)
  blueprintIntake: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop", // 設計手繪手稿與墨線圖 (取代 image5)
  caseGeneva: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop", // Westlake Penthouse 瑞士日內瓦豪宅 (案例 1)
  caseMayfair: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop", // Portal Hedge Fund 倫敦對沖基金辦公室 (案例 2)
  caseBermondsey: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop", // Bermondsey Lofts 工業風公寓 (案例 3)
  caseBathHotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop", // The Stow Boutique Hotel 精品客房 (案例 4)
  caseCamden: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=600&auto=format&fit=crop", // Camden Creative Studios 創意共享空間 (案例 5)
  setMilano: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop", // Milano Elegance
  setToscana: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800&auto=format&fit=crop", // Toscana Warmth
  setVenezia: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800&auto=format&fit=crop" // Venezia Contemporary
};

// Safely wrap localStorage operations to handle sandbox or private/incognito restrictions
const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch (e) {
    console.warn("localStorage.getItem is restricted in this environment:", e);
    return "";
  }
};

const safeSetItem = (key, val) => {
  try {
    localStorage.setItem(key, val);
  } catch (e) {
    console.warn("localStorage.setItem is restricted in this environment:", e);
  }
};

const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("localStorage.removeItem is restricted in this environment:", e);
  }
};

const clearSupabaseAuthStorage = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.includes("auth-token")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn("Supabase auth token cleanup was skipped:", e);
  }
};

// Inject into window for backward compatibility with legacy prototype code
window.supabase = { createClient };

const AI_SUPPORT_API_URL = "/api/ai-support-chat";
const INTAKE_UPLOAD_TIMEOUT_MS = 45000;
const INTAKE_DB_TIMEOUT_MS = 30000;
const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const ENV_SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  ""
).trim();
const isSupabaseConfiguredByEnv = Boolean(ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY);
const WORKSHOP_MILESTONE_MEDIA = {
  frame: {
    src: "/thecrafton-assets/workshop/frame-woodwork.webp",
    altCn: "佛山家具工厂内，工匠正在组装并检查实木休闲椅木架。",
    altEn: "A craftsperson assembling and checking a solid-wood lounge-chair frame in the Foshan furniture mill."
  },
  upholstery: {
    src: "/thecrafton-assets/workshop/upholstery-sewing.webp",
    altCn: "软包工匠正在为休闲椅手工定位并贴合海军蓝面料。",
    altEn: "An upholsterer hand-fitting and aligning navy fabric on a lounge chair."
  },
  finishing: {
    src: "/thecrafton-assets/workshop/artisan-finishing.webp",
    altCn: "表面处理工匠正在通风工位精细打磨胡桃木椅架。",
    altEn: "A finishing artisan carefully sanding a walnut chair frame at a ventilated workstation."
  },
  packaging: {
    src: "/thecrafton-assets/workshop/protective-packaging.webp",
    altCn: "两名工人正在为成品休闲椅安装护角并固定到出口木托。",
    altEn: "Two workers fitting corner protection and securing a finished lounge chair to an export pallet."
  }
};

const getSupabaseUrl = () => ENV_SUPABASE_URL || safeGetItem("supabase_url");
const getSupabaseKey = () => ENV_SUPABASE_ANON_KEY || safeGetItem("supabase_key");

// Initialize Supabase from deploy-time env vars first, then browser storage as a fallback.
const savedUrl = getSupabaseUrl();
const savedKey = getSupabaseKey();
let supabaseClient = null;
let supabaseClientCacheKey = "";

if (savedUrl && savedKey && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(savedUrl, savedKey);
    supabaseClientCacheKey = `${savedUrl}::${savedKey}`;
  } catch (err) {
    console.error("Supabase initialization error:", err);
  }
}

const getSupabaseBrowserClient = (urlOverride = "", keyOverride = "") => {
  const url = (urlOverride || getSupabaseUrl()).trim();
  const key = (keyOverride || getSupabaseKey()).trim();
  if (!url || !key || !window.supabase) return null;

  const cacheKey = `${url}::${key}`;
  if (supabaseClient && supabaseClientCacheKey === cacheKey) {
    return supabaseClient;
  }

  if (supabaseClient && supabaseClientCacheKey !== cacheKey) {
    try {
      supabaseClient.removeAllChannels?.();
    } catch (err) {
      console.warn("Previous Supabase realtime channels were not fully cleared:", err.message || err);
    }
  }

  supabaseClient = window.supabase.createClient(url, key);
  supabaseClientCacheKey = cacheKey;
  return supabaseClient;
};

const withTimeout = (promise, timeoutMs, message) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const getDisplayNameFromEmail = (email = "") => {
  const nameFromEmail = email.split("@")[0] || "Client";
  return nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
};

const isCraftonStaffEmail = (email = "") =>
  String(email || "")
    .toLowerCase()
    .endsWith("@crafton.com");

const mapSupabaseUserToAppUser = (supabaseUser, fallback = {}) => {
  const metadata = supabaseUser?.user_metadata || {};
  const appMetadata = supabaseUser?.app_metadata || {};
  const email = supabaseUser?.email || fallback.email || "";
  const role = appMetadata.role || fallback.role || "";
  return {
    id: supabaseUser?.id || fallback.id || null,
    name: metadata.full_name || metadata.name || fallback.name || getDisplayNameFromEmail(email),
    email,
    company: metadata.company || fallback.company || "Independent Designer",
    messenger: metadata.preferred_messenger || fallback.messenger || "WhatsApp",
    messengerId: metadata.messenger_id || fallback.messengerId || "N/A",
    avatarUrl: metadata.avatar_url || fallback.avatarUrl || "",
    authProvider: appMetadata.provider || fallback.authProvider || "email",
    role,
    isStaff: role === "staff" || role === "admin" || isCraftonStaffEmail(email) || Boolean(fallback.isStaff)
  };
};

const getOAuthRedirectUrl = () => {
  if (typeof window === "undefined") return undefined;
  return window.location.href.split("#")[0].split("?")[0];
};

const getLogActionEn = (cnText) => {
  if (!cnText) return "";

  // 1. Check exact match in mockData.changeLogs
  const match = mockData.changeLogs.find((cl) => cl.action === cnText);
  if (match && match.actionEn) return match.actionEn;

  // 2. Check other known exact matches
  const exactTranslations = {
    "技术规格书與BOM審核通過，簽名發布。": "Tech specifications and BOM approved, signed off.",
    "技術規格書與BOM審核通過，簽名發布。": "Tech specifications and BOM approved, signed off.",
    "現場反饋：因客戶硬裝現場變動，取消2把扶手椅與1張茶几。啟動劃線財務自動重算，餘款已核銷更新。":
      "Site feedback: Cancelled 2 Armchairs & 1 Table due to fitout changes. Auto strike-through recalculation initiated.",
    "CRIB 5 燃燒檢測失敗：純絲綢緞阻燃塗層收縮率/變色率超差（CRIB 5 BLOCKED）":
      "CRIB 5 Flammability Test Failed: Pure Silk Satin fire-retardant coating shrinkage and discoloration rate out of tolerance (CRIB 5 BLOCKED)",
    "CRIB 5 燃燒檢測合格：火焰暴露10秒內物理自熄（CRIB 5 PASSED）":
      "CRIB 5 Flammability Test Passed: Flame self-extinguished physically within 10 seconds of exposure (CRIB 5 PASSED)",
    "四大出口單證校驗成功：IPPC熏蒸證明、海關申報單、裝箱單序列號一致（100% MATCH）":
      "Four export compliance documents verified successfully: IPPC fumigation certificate, Customs declaration, Packing lists match perfectly (100% MATCH)",
    "項目資料哈希打包完畢：SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51":
      "Project archive hashed and packaged: SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51",
    "檢測到絲綢硬性不合規，一鍵替換面料為：L-4410 (海軍藍亞麻)":
      "Detected critical non-compliance on Silk. Swapped fabric to: L-4410 (Navy Classic Linen) with one click.",
    "生成PDF規格書，全自動調用 SMTP 郵件群發至 3 家意向工廠。":
      "Generated PDF specification sheet, automatically calling SMTP to dispatch RFQs to 3 target factories."
  };

  if (exactTranslations[cnText]) {
    return exactTranslations[cnText];
  }

  // 3. Dynamic templates (Crib 5 Override and supplier selections)
  if (cnText.includes("修改物料合规：替换面料为")) {
    const matchFabric = cnText.match(/替换面料为\s*(\S+)/);
    const code = matchFabric ? matchFabric[1] : "FAB-02";
    return `Bypassed Crib 5: Changed fabric to ${code} (Navy Classic Linen), successfully overriding gate.`;
  }

  if (cnText.includes("比价完成。最终选定代工厂:")) {
    const matchSupplier = cnText.match(/最终选定代工厂:\s*([^，]+)/);
    const matchPrice = cnText.match(/单价核定为\s*\$?([0-9.]+)/);
    const sName = matchSupplier ? matchSupplier[1] : "selected supplier";
    const sPrice = matchPrice ? matchPrice[1] : "195";
    return `Supplier bidding finalized. Factory selected: ${sName}. Lobby Armchair set to $${sPrice}/pc.`;
  }

  return cnText; // Fallback
};

const REVIEW_STATUS_META = {
  pending: { label: "Needs Cho review", tone: "orange" },
  revision_requested: { label: "Client answers needed", tone: "red" },
  approved: { label: "Specs approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  rfq_ready: { label: "RFQ draft ready", tone: "green" }
};

const PREQUOTE_SUPPLIERS = [
  { name: "Foshan Gold-Sun Contract", leadTime: "45 days", terms: "50/40/10", score: 92 },
  { name: "Dongguan Atelier Works", leadTime: "52 days", terms: "40/50/10", score: 86 },
  { name: "Shenzhen Hospitality Mill", leadTime: "48 days", terms: "50/30/20", score: 83 }
];

const safeJsonObject = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn("Failed to parse JSON object:", err);
    return fallback;
  }
};

const normalizeGroupingText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const getIntakeFileFromJob = (job = {}) => {
  if (Array.isArray(job.intake_files)) return job.intake_files[0] || null;
  return job.intake_files || null;
};

const formatDimensionPayload = (dimensions = {}) => {
  if (!dimensions || typeof dimensions !== "object") return "";
  const unit = dimensions.unit || "mm";
  const length = dimensions.length || dimensions.l || dimensions.width || "";
  const width = dimensions.width || dimensions.w || dimensions.depth || "";
  const height = dimensions.height || dimensions.h || "";
  const parts = [length ? `L ${length}` : "", width ? `W ${width}` : "", height ? `H ${height}` : ""].filter(Boolean);
  return parts.length ? `${parts.join(" x ")} ${unit}` : "";
};

const normalizeReviewJob = (job = {}) => {
  const result = safeJsonObject(job.result_json, {});
  const project = result.project || {};
  const items = Array.isArray(result.items) ? result.items : [];
  const firstItem = items[0] || {};
  const payments = Array.isArray(result.payments) ? result.payments : [];
  const questions = Array.isArray(result.questions) ? result.questions : [];
  const rfqDraft = safeJsonObject(job.rfq_draft_json, null);
  const intakeFile = getIntakeFileFromJob(job);
  const dimensionsText =
    result.dimensions_text ||
    result.dimensions ||
    firstItem.dimensions_text ||
    formatDimensionPayload(firstItem.dimensions || {});

  return {
    id: job.id || "LOCAL-INTAKE-DEMO",
    projectId: job.project_id || null,
    projectName: job.project_name || project.name || job.projectName || "To confirm",
    clientName: project.client_name || job.projects?.client_name || "Portal Intake Client",
    destination: job.destination || project.destination || job.destination || "",
    deliveryAddress: project.delivery_address || result.delivery_address || "",
    desiredDeliveryDate: project.desired_delivery_date || result.desired_delivery_date || "",
    deliveryWindow: project.delivery_window || result.delivery_window || "",
    targetBudget: project.target_budget || result.target_budget || "",
    currency: project.currency || result.currency || "USD",
    quantityText: job.quantity_text || job.quantityText || "",
    status: job.status || "needs_review",
    reviewStatus: job.review_status || (job.status === "completed" ? "approved" : "pending"),
    rfqStatus: job.rfq_status || "not_started",
    reviewNotes: job.review_notes || "",
    clientAnswers: safeJsonObject(job.client_answers, {}),
    sourceNotes: result.source_notes || job.brief_text || "",
    summaryEn: result.summary_en || "Intake draft parsed from client materials.",
    visualAnalysis: safeJsonObject(result.visual_analysis, null),
    createdAt: job.created_at || job.submittedAt || "",
    fileName: intakeFile?.original_name || job.fileName || "",
    previewUrl: job.client_preview_url || job.previewUrl || result.preview_url || "",
    dimensions: dimensionsText,
    tolerance: result.tolerance || firstItem.tolerance || "",
    fireStandard: result.fire_standard || firstItem.fire_standard || "",
    packaging: result.packaging || "",
    siteAccess: result.site_access || "",
    questions,
    rfqDraft,
    items: items.map((item, idx) => ({
      id: item.id || `DRAFT-ITEM-${idx + 1}`,
      typeCn: item.item_type_cn || item.typeCn || "Customer bespoke item",
      typeEn: item.item_type_en || item.typeEn || "Submitted Bespoke Item",
      qty: Number(item.quantity || item.qty || 0),
      qtyDisplay: item.quantity_text || item.qtyDisplay || String(item.quantity || item.qty || ""),
      dimensions: item.dimensions || {},
      dimensionsText:
        item.dimensions_text ||
        (typeof item.dimensions === "string" ? item.dimensions : formatDimensionPayload(item.dimensions || {})),
      tolerance: item.tolerance || "",
      materialCn: item.material_cn || item.materialCn || "To confirm",
      materialEn: item.material_en || item.materialEn || "To confirm",
      style: item.style_en || item.style_cn || item.style || "",
      fabricCode: item.fabric_code || item.fabricCode || "",
      finish: item.finish_en || item.finish_cn || item.finish || "",
      color: item.color_en || item.color_cn || item.color || "",
      hardware: item.hardware || "",
      visibleFeatures: item.visible_features_en || item.visible_features_cn || [],
      visualConfidence: Number(item.confidence || 0),
      usageLocation: item.usage_location || item.usageLocation || "",
      fireStandard: item.fire_standard || item.fireStandard || "",
      originalUnitPrice: Number(
        item.original_unit_price || item.originalUnitPrice || item.unit_price || item.unitPrice || 0
      ),
      unitPrice: Number(item.unit_price || item.unitPrice || item.original_unit_price || item.originalUnitPrice || 0),
      currency: item.currency || result.currency || project.currency || "USD",
      notesCn: item.notes_cn || item.notesCn || "",
      notesEn: item.notes_en || item.notesEn || item.note || "",
      imageUrl: item.image_url || item.imageUrl || item.preview_url || ""
    })),
    payments: payments.map((payment, idx) => ({
      id: payment.id || `DRAFT-PAYMENT-${idx + 1}`,
      milestoneCn: payment.milestone_cn || payment.milestoneCn || payment.milestone_en || payment.milestone || "",
      milestoneEn: payment.milestone_en || payment.milestoneEn || payment.milestone_cn || payment.milestone || "",
      amount: Number(payment.amount || 0),
      status: payment.status || "Pending",
      date: payment.payment_date || payment.date || "Pending"
    }))
  };
};

const buildProjectGroupsFromJobs = (jobs = []) => {
  const groups = new Map();

  jobs
    .map((job) => normalizeReviewJob(job))
    .forEach((job) => {
      const projectKey =
        job.projectId ||
        [normalizeGroupingText(job.projectName), normalizeGroupingText(job.destination)].filter(Boolean).join("|") ||
        job.id;
      const existing = groups.get(projectKey);

      if (existing) {
        existing.jobs.push(job);
        if (!existing.destination && job.destination) existing.destination = job.destination;
        if ((!existing.projectName || existing.projectName === "To confirm") && job.projectName) {
          existing.projectName = job.projectName;
        }
        return;
      }

      groups.set(projectKey, {
        key: projectKey,
        projectId: job.projectId,
        projectName: job.projectName || "To confirm",
        destination: job.destination || "",
        jobs: [job]
      });
    });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    jobs: group.jobs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }));
};

const buildClientDashboardDemoJobs = () => [
  {
    id: "DEMO-REGENT-02",
    project_id: "DEMO-PROJECT-REGENT",
    project_name: "Regent Grand Hotel",
    destination: "Jiangmen, Guangdong",
    quantity_text: "8 side tables",
    status: "completed",
    review_status: "approved",
    rfq_status: "not_started",
    created_at: "2026-07-14T09:30:00.000Z",
    result_json: {
      project: {
        name: "Regent Grand Hotel",
        client_name: "Jenkins Contract Interior Studio",
        destination: "Jiangmen, Guangdong",
        desired_delivery_date: "2026-10-20",
        fire_standard: "Not required"
      },
      summary_en:
        "Eight side tables for the hotel lounge extension. Dimensions, walnut finish and brushed brass base are confirmed.",
      items: [
        {
          item_type_cn: "酒店大堂邊几",
          item_type_en: "Hotel Lobby Side Table",
          image_url: "/set-furniture/side-table.jpg",
          quantity: 8,
          dimensions_text: "W 520 x D 520 x H 480 mm",
          material_cn: "胡桃木皮與香檳金不鏽鋼",
          material_en: "Walnut veneer and brushed champagne steel",
          finish: "Matt walnut",
          color: "Warm walnut",
          hardware: "Brushed brass plinth",
          usage_location: "Lobby lounge",
          fire_standard: "Not required"
        }
      ],
      questions: []
    }
  },
  {
    id: "DEMO-REGENT-01",
    project_id: "DEMO-PROJECT-REGENT",
    project_name: "Regent Grand Hotel",
    destination: "Jiangmen, Guangdong",
    quantity_text: "15 dining chairs and 4 lounge chairs",
    status: "needs_review",
    review_status: "revision_requested",
    rfq_status: "draft",
    created_at: "2026-07-12T07:15:00.000Z",
    intake_files: [{ original_name: "regent-chair-reference.jpg" }],
    result_json: {
      project: {
        name: "Regent Grand Hotel",
        client_name: "Jenkins Contract Interior Studio",
        destination: "Jiangmen, Guangdong",
        desired_delivery_date: "2026-10-15"
      },
      summary_en:
        "Guest-room and restaurant seating package. Product types, quantities and upholstery direction are recorded; dimensions and final compliance choice need confirmation.",
      items: [
        {
          item_type_cn: "餐廳餐椅",
          item_type_en: "Restaurant Dining Chair",
          image_url: "/set-furniture/dining-chair.jpg",
          quantity: 15,
          dimensions_text: "To confirm",
          material_cn: "海軍藍亞麻與白橡木",
          material_en: "Navy linen and white oak",
          fabric_code: "L-4410",
          finish: "Matt lacquer",
          color: "Navy",
          usage_location: "All-day dining",
          fire_standard: "UK BS 5852 - Source 5"
        },
        {
          item_type_cn: "客房休閒椅",
          item_type_en: "Guest Room Lounge Chair",
          image_url: "/set-furniture/armchair.jpg",
          quantity: 4,
          dimensions_text: "To confirm",
          material_cn: "皇家藍絲絨",
          material_en: "Royal blue velvet",
          fabric_code: "V-9082",
          finish: "Brushed bronze",
          color: "Royal blue",
          usage_location: "Guest suites",
          fire_standard: "UK BS 5852 - Source 5"
        }
      ],
      fire_standard: "UK BS 5852 - Source 5",
      questions: ["Please confirm the dining chair dimensions.", "Please confirm the final delivery window."]
    }
  },
  {
    id: "DEMO-WESTLAKE-01",
    project_id: "DEMO-PROJECT-WESTLAKE",
    project_name: "Westlake Penthouse",
    destination: "Geneva, Switzerland",
    quantity_text: "1 modular sofa",
    status: "needs_review",
    review_status: "pending",
    rfq_status: "not_started",
    created_at: "2026-07-15T12:20:00.000Z",
    intake_files: [{ original_name: "westlake-sofa-layout.pdf" }],
    result_json: {
      project: {
        name: "Westlake Penthouse",
        client_name: "Jenkins Contract Interior Studio",
        destination: "Geneva, Switzerland",
        desired_delivery_date: "2026-11-30"
      },
      summary_en:
        "Curved modular sofa for the main living room. The layout and reference image have been received and are under specification review.",
      items: [
        {
          item_type_cn: "弧形組合沙發",
          item_type_en: "Curved Modular Sofa",
          image_url: "/set-furniture/sofa.jpg",
          quantity: 1,
          dimensions_text: "Approx. W 4200 x D 1300 mm",
          material_cn: "羊毛混紡面料",
          material_en: "Wool-blend upholstery",
          color: "Warm ivory",
          usage_location: "Main living room",
          fire_standard: "EU EN 1021-1/2"
        }
      ],
      fire_standard: "EU EN 1021-1/2",
      questions: []
    }
  }
];

const buildClientGroupsFromJobs = (jobs = []) => {
  const groups = new Map();

  jobs.forEach((job) => {
    const normalized = normalizeReviewJob(job);
    const clientName = normalized.clientName || "Unassigned client";
    const key = normalizeGroupingText(clientName) || "unassigned-client";
    const existing = groups.get(key);

    if (existing) {
      existing.jobs.push(job);
      return;
    }

    groups.set(key, { key, clientName, jobs: [job] });
  });

  return Array.from(groups.values())
    .map((group) => {
      const projects = buildProjectGroupsFromJobs(group.jobs);
      const reviewCount = projects
        .flatMap((project) => project.jobs)
        .filter((job) => job.reviewStatus === "pending").length;
      return { ...group, projects, reviewCount };
    })
    .sort((a, b) => a.clientName.localeCompare(b.clientName));
};

const buildAiProjectOverviewFromJobs = (jobs = [], currentDraft = {}) => {
  const groups = buildProjectGroupsFromJobs(jobs);
  const allJobs = groups.flatMap((group) => group.jobs);
  const latestOrder = allJobs[0] || null;

  return {
    totalProjects: groups.length,
    totalOrders: allJobs.length,
    latestOrder: latestOrder
      ? {
          jobId: latestOrder.id,
          projectName: latestOrder.projectName,
          destination: latestOrder.destination,
          quantityText: latestOrder.quantityText,
          status: latestOrder.status,
          reviewStatus: latestOrder.reviewStatus,
          rfqStatus: latestOrder.rfqStatus,
          summary: latestOrder.summaryEn,
          fileName: latestOrder.fileName
        }
      : null,
    currentDraft,
    projects: groups.slice(0, 8).map((group) => ({
      projectId: group.projectId,
      projectName: group.projectName,
      destination: group.destination,
      orderCount: group.jobs.length,
      orders: group.jobs.slice(0, 6).map((job) => ({
        jobId: job.id,
        quantityText: job.quantityText,
        status: job.status,
        reviewStatus: job.reviewStatus,
        rfqStatus: job.rfqStatus,
        summary: job.summaryEn,
        questions: job.questions,
        clientAnswers: job.clientAnswers,
        items: job.items.map((item) => ({
          item: item.typeEn || item.typeCn,
          quantity: item.qty,
          material: item.materialEn || item.materialCn,
          notes: item.notesEn || item.notesCn
        })),
        fileName: job.fileName,
        createdAt: job.createdAt
      }))
    }))
  };
};

const denormalizeReviewDraft = (draft) => ({
  project: {
    name: draft.projectName || "Crafton Intake Project",
    client_name: "Portal Intake Client",
    destination: draft.destination || "",
    delivery_address: draft.deliveryAddress || "",
    desired_delivery_date: draft.desiredDeliveryDate || "",
    delivery_window: draft.deliveryWindow || "",
    target_budget: draft.targetBudget || "",
    currency: draft.currency || "USD"
  },
  items: (draft.items || []).map((item) => ({
    item_type_cn: item.typeCn || item.typeEn || "Custom item",
    item_type_en: item.typeEn || "Custom item",
    quantity: Number(item.qty || 0),
    quantity_text: item.qtyDisplay || String(item.qty || ""),
    dimensions: item.dimensions || null,
    dimensions_text: item.dimensionsText || "",
    tolerance: item.tolerance || "",
    material_cn: item.materialCn || item.materialEn || "",
    material_en: item.materialEn || "",
    fabric_code: item.fabricCode || "",
    finish: item.finish || "",
    color: item.color || "",
    hardware: item.hardware || "",
    usage_location: item.usageLocation || "",
    fire_standard: item.fireStandard || draft.fireStandard || "",
    original_unit_price: Number(item.originalUnitPrice || item.unitPrice || 0),
    unit_price: Number(item.unitPrice || item.originalUnitPrice || 0),
    notes_cn: item.notesCn || item.notesEn || "",
    notes_en: item.notesEn || ""
  })),
  questions: draft.questions || [],
  dimensions: draft.dimensions || "",
  tolerance: draft.tolerance || "",
  fire_standard: draft.fireStandard || "",
  packaging: draft.packaging || "",
  site_access: draft.siteAccess || "",
  summary_cn: "Cho reviewed the intake draft.",
  summary_en: "Cho reviewed the intake draft and prepared it for pre-quote handling.",
  source_notes: draft.sourceNotes || ""
});

const buildRfqDraft = (draft) => {
  const items = draft.items || [];
  const estimatedTotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0);

  return {
    project_name: draft.projectName,
    destination: draft.destination,
    package_status: "draft",
    generated_at: new Date().toISOString(),
    items: items.map((item) => ({
      item: item.typeEn,
      quantity: Number(item.qty || 0),
      dimensions: item.dimensionsText || formatDimensionPayload(item.dimensions || {}),
      tolerance: item.tolerance || draft.tolerance || "",
      material: item.materialEn,
      finish: item.finish || "",
      color: item.color || "",
      hardware: item.hardware || "",
      fire_standard: item.fireStandard || draft.fireStandard || "",
      target_unit_price: Number(item.unitPrice || 0),
      notes: item.notesEn || ""
    })),
    suppliers: PREQUOTE_SUPPLIERS.map((supplier, idx) => ({
      ...supplier,
      estimatedTotal: Math.round(estimatedTotal * (0.95 + idx * 0.06))
    }))
  };
};

function App() {
  console.log("=== APP COMPONENT EXECUTING ===");
  const [currentView, setCurrentStageView] = useState("Marketing"); // Views: "Marketing", "Backoffice", "ClientPortal"
  const [setFurnitureCategory, setSetFurnitureCategory] = useState("sofa");
  const [setFurnitureProduct, setSetFurnitureProduct] = useState("");
  const [lang, setLang] = useState("Cn"); // Language: "Cn" or "En"
  const [marketingTab, setMarketingTab] = useState("Overview"); // "Overview", "CaseStudies", "OurStory", "Contact"
  const [contactMessage, setContactMessage] = useState("");
  const [clientPortalTab, setClientPortalTab] = useState("Tracker"); // "Tracker", "Intake"
  const [openFaq, setOpenFaq] = useState(null); // Accordion FAQ toggle
  const [isIntakeUploading, setIsIntakeUploading] = useState(false); // For upload animation
  const [parsingLogs, setParsingLogs] = useState([]); // Real-time parsing logs

  // Premium Auth Gate States
  const [user, setUser] = useState(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "signup"
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [supabaseSessionUser, setSupabaseSessionUser] = useState(null);
  const [supabaseAuthReady, setSupabaseAuthReady] = useState(false);
  const [adminAccessStatus, setAdminAccessStatus] = useState("checking");
  const isStaffUser = Boolean(user?.isStaff);

  // Custom Registration Input States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCompany, setSignupCompany] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupMessenger, setSignupCompanyMessenger] = useState("WeChat");
  const [signupMessengerId, setSignupMessengerId] = useState("");

  // B2B Client Intake Form States
  const [intakeProjectName, setIntakeProjectName] = useState("");
  const [intakeDestination, setIntakeDestination] = useState("");
  const [intakeQuantity, setIntakeQuantity] = useState("");
  const [intakeItemType, setIntakeItemType] = useState("");
  const [intakeUsageLocation, setIntakeUsageLocation] = useState("");
  const [intakeLength, setIntakeLength] = useState("");
  const [intakeWidth, setIntakeWidth] = useState("");
  const [intakeHeight, setIntakeHeight] = useState("");
  const [intakeDimensionUnit, setIntakeDimensionUnit] = useState("mm");
  const [intakeTolerance, setIntakeTolerance] = useState("±5mm");
  const [intakeMaterial, setIntakeMaterial] = useState("");
  const [intakeFabricCode, setIntakeFabricCode] = useState("");
  const [intakeFinish, setIntakeFinish] = useState("");
  const [intakeColor, setIntakeColor] = useState("");
  const [intakeHardware, setIntakeHardware] = useState("");
  const [intakeDesiredDeliveryDate, setIntakeDesiredDeliveryDate] = useState("");
  const [intakeDeliveryWindow, setIntakeDeliveryWindow] = useState("");
  const [intakeDeliveryAddress, setIntakeDeliveryAddress] = useState("");
  const [intakeTargetBudget, setIntakeTargetBudget] = useState("");
  const [intakeCurrency, setIntakeCurrency] = useState("USD");
  const [intakeFireStandard, setIntakeFireStandard] = useState("UK BS 5852 - Source 5 (Crib 5)");
  const [intakePackaging, setIntakePackaging] = useState("");
  const [intakeSiteAccess, setIntakeSiteAccess] = useState("");
  const [intakeAdditionalNotes, setIntakeAdditionalNotes] = useState("");
  const [intakeSelectedFile, setIntakeSelectedFile] = useState(null);
  const [intakeSelectedFileName, setIntakeSelectedFileName] = useState("");
  const [intakeUploadedFileId, setIntakeUploadedFileId] = useState(null);
  const [intakeUploadStatus, setIntakeUploadStatus] = useState("");
  const [intakeFileUploading, setIntakeFileUploading] = useState(false);
  const [latestIntakeJob, setLatestIntakeJob] = useState(null);
  const [liveIntakeWarning, setLiveIntakeWarning] = useState("");
  const [submittedTrackerProject, setSubmittedTrackerProject] = useState(null);
  const [trackerPreviewUrl, setTrackerPreviewUrl] = useState("");
  const [intakeReviewJobs, setIntakeReviewJobs] = useState([]);
  const [selectedReviewJobId, setSelectedReviewJobId] = useState(() => safeGetItem("crafton_admin_selected_job_id"));
  const [expandedIntakeClientKey, setExpandedIntakeClientKey] = useState("");
  const [reviewDraft, setReviewDraft] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [prequoteNotice, setPrequoteNotice] = useState("");
  const [intakeApprovalSaving, setIntakeApprovalSaving] = useState(false);
  const [intakeBomDraftGenerated, setIntakeBomDraftGenerated] = useState(false);
  const [intakeBomDraftMessage, setIntakeBomDraftMessage] = useState("");
  const [adminIntakePreview, setAdminIntakePreview] = useState({
    jobId: "",
    url: "",
    status: "idle",
    message: ""
  });
  const [clientProjectJobs, setClientProjectJobs] = useState([]);
  const [clientProjectsLoading, setClientProjectsLoading] = useState(true);
  const [clientAnswerDrafts, setClientAnswerDrafts] = useState({});
  const [clientAnswerSubmitState, setClientAnswerSubmitState] = useState({});
  const [adminRfqBatches, setAdminRfqBatches] = useState([]);
  const [adminSupplierQuotes, setAdminSupplierQuotes] = useState([]);
  const [adminApprovals, setAdminApprovals] = useState([]);
  const [adminInspectionReports, setAdminInspectionReports] = useState([]);
  const [adminShipmentDocuments, setAdminShipmentDocuments] = useState([]);
  const [adminWorkflowEvents, setAdminWorkflowEvents] = useState([]);
  const [adminProjectFiles, setAdminProjectFiles] = useState([]);
  const [adminDataStatus, setAdminDataStatus] = useState({ loaded: false, missingTables: [] });
  const [supportMessages, setSupportMessages] = useState([
    {
      sender: "ai",
      text: "您好，我是 Crafton 项目客服。您可以直接描述项目、数量、交付地、材质、防火要求，或上传 PDF / 图片 / Excel。我会先帮您整理需求，并提交给 Crafton 顾问团队跟进项目草稿。"
    }
  ]);
  const [supportInput, setSupportInput] = useState("");
  const [supportSelectedFile, setSupportSelectedFile] = useState(null);
  const [supportSelectedFileName, setSupportSelectedFileName] = useState("");
  const [supportUploadedFileId, setSupportUploadedFileId] = useState(null);
  const [supportSubmittedJobId, setSupportSubmittedJobId] = useState(null);
  const [supportConversationId, setSupportConversationId] = useState(null);
  const [supportIsTyping, setSupportIsTyping] = useState(false);
  const [supportStatus, setSupportStatus] = useState("");

  const [currentStageIndex, setCurrentStageIndex] = useState(0); // S01 to S17
  const [activeAdminFlow, setActiveAdminFlow] = useState(() => {
    const savedFlow = safeGetItem("crafton_admin_active_flow");
    return ["intake", "sourcing", "production", "shipping"].includes(savedFlow) ? savedFlow : "intake";
  });
  const [order, setOrder] = useState(JSON.parse(JSON.stringify(mockData.initialOrder)));
  const [logs, setLogs] = useState(JSON.parse(JSON.stringify(mockData.changeLogs)));
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "client",
      text: "Hi, need 40 lobby armchairs and 20 club chairs for St Albans lobby. Blue style. Must pass UK fire safety."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isBiddingDone, setIsBiddingDone] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [fabricCompatibilityTest, setFabricCompatibilityTest] = useState(null); // null, 'passed', 'blocked'
  const [splitDeliveryActive, setSplitDeliveryActive] = useState(false);
  const [isCrib5Blocked, setIsCrib5Blocked] = useState(false);
  const terminalEndRef = useRef(null);
  const supportConversationIdRef = useRef(null);
  const intakeFileInputRef = useRef(null);
  const lastProfileSyncRef = useRef("");

  // Material Studio Swatch Configurator States
  const [selectedFabric, setSelectedFabric] = useState("FAB-02"); // default Navy Classic Linen
  const [selectedLeg, setSelectedLeg] = useState("matte-black"); // default Matte Black Steel
  const [configuratorCrib5Blocked, setConfiguratorCrib5Blocked] = useState(false);

  // Interactive Playgrounds State Variables
  const [signatureApproved, setSignatureApproved] = useState(false);
  const [crib5TestStatus, setCrib5TestStatus] = useState("idle"); // 'idle', 'running', 'passed', 'failed'
  const [crib5Progress, setCrib5Progress] = useState(0);
  const [rfqDispatched, setRfqDispatched] = useState(false);
  const [docAudited, setDocAudited] = useState(false);
  const [archiveHashed, setArchiveHashed] = useState(false);
  const [showVolumetricSimulation, setShowVolumetricSimulation] = useState(false);
  const [loadingAiContext, setLoadingAiContext] = useState(null);
  const [loadingAiResult, setLoadingAiResult] = useState(null);
  const [loadingAiSaveStatus, setLoadingAiSaveStatus] = useState("");
  const loadingAiFrameRef = useRef(null);

  // WOW effect state variables for homepage V1.2 enhancements
  const [activeSwatch, setActiveSwatch] = useState("nubuck"); // nubuck, linen, gold, walnut
  const [blueprintSliderPos, setBlueprintSliderPos] = useState(50);
  const [demoMilestone, setDemoMilestone] = useState("frame");
  const activeWorkshopMedia = WORKSHOP_MILESTONE_MEDIA[demoMilestone] || WORKSHOP_MILESTONE_MEDIA.frame;

  // V1.2/1.3 Intake Modal States
  const [activeIntakeModal, setActiveIntakeModal] = useState(null); // 'pdf', 'excel', 'words', 'item', or null
  const [modalProjectName, setModalProjectName] = useState("");
  const [modalDestination, setModalDestination] = useState("");
  const [modalQuantity, setModalQuantity] = useState("40");
  const [modalTextBrief, setModalTextBrief] = useState("");
  const [modalFilePreloaded, setModalFilePreloaded] = useState(false);
  const [modalFilePreloadedName, setModalFilePreloadedName] = useState("");
  const [modalSelectedFile, setModalSelectedFile] = useState(null);
  const [pendingSetFurnitureSelection, setPendingSetFurnitureSelection] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null); // null or project object for detail overlay modal

  // V1.3 Marketing Bespoke Simulation States (Now modularly encapsulated in CVQASimulator and ClientPortalTeaser)

  useEffect(() => {
    const handleLoadingAiMessage = (event) => {
      if (!loadingAiFrameRef.current || event.source !== loadingAiFrameRef.current.contentWindow) return;
      if (event.data?.type === "CRAFTON_LOADING_READY" && loadingAiContext) {
        loadingAiFrameRef.current.contentWindow.postMessage(
          { type: "CRAFTON_LOADING_INIT", payload: loadingAiContext },
          window.location.origin
        );
      }
      if (event.data?.type === "CRAFTON_LOADING_RESULT") {
        setLoadingAiResult(event.data.payload || null);
        setLoadingAiSaveStatus("");
      }
    };

    window.addEventListener("message", handleLoadingAiMessage);
    return () => window.removeEventListener("message", handleLoadingAiMessage);
  }, [loadingAiContext]);

  const sendLoadingAiContext = () => {
    if (!loadingAiContext || !loadingAiFrameRef.current?.contentWindow) return;
    loadingAiFrameRef.current.contentWindow.postMessage(
      { type: "CRAFTON_LOADING_INIT", payload: loadingAiContext },
      window.location.origin
    );
  };

  const saveLoadingAiPlan = async () => {
    if (!loadingAiContext?.projectId || !loadingAiResult) return;
    const client = getSupabaseBrowserClient();
    if (!client) {
      setLoadingAiSaveStatus("Supabase is not connected.");
      return;
    }

    setLoadingAiSaveStatus("Saving packing plan...");
    try {
      const { error } = await client.from("packing_plans").insert({
        project_id: loadingAiContext.projectId,
        stage_id: "S12",
        status: "generated",
        engine_mode: loadingAiResult.engineMode || "fast",
        container_type: loadingAiResult.containerType || "40HQ",
        total_containers: Number(loadingAiResult.totalContainers || 0),
        utilization_percent: Number(loadingAiResult.utilizationPercent || 0),
        unpacked_count: Number(loadingAiResult.unpackedCount || 0),
        plan_json: loadingAiResult,
        generated_at: loadingAiResult.generatedAt || new Date().toISOString()
      });
      if (error) throw error;

      const { error: projectError } = await client
        .from("projects")
        .update({ current_stage: 12 })
        .eq("id", loadingAiContext.projectId);
      if (projectError) throw projectError;

      const { error: eventError } = await client.from("workflow_events").insert({
        project_id: loadingAiContext.projectId,
        stage_id: "S12",
        event_type: "packing_plan_generated",
        actor: "Cho",
        message_cn: `Loading AI 已生成 ${loadingAiResult.totalContainers || 0} 个货柜方案。`,
        message_en: `Loading AI generated a ${loadingAiResult.totalContainers || 0}-container packing plan.`,
        payload: {
          container_type: loadingAiResult.containerType,
          utilization_percent: loadingAiResult.utilizationPercent,
          unpacked_count: loadingAiResult.unpackedCount
        }
      });
      if (eventError) throw eventError;

      setLoadingAiSaveStatus("Packing plan saved to Supabase.");
      window.dispatchEvent(new window.CustomEvent("crafton:workflow-refresh"));
      await loadAdminOperationalData();
    } catch (error) {
      setLoadingAiSaveStatus(`Save failed: ${error.message || error}`);
    }
  };

  // =====================================================================
  // THE CRAFTON - SESSION & AUTHENTICATION HANDLERS
  // =====================================================================
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!signupEmail) {
      alert(lang === "Cn" ? "請輸入電子郵件！" : "Please enter your email!");
      return;
    }
    const nameFromEmail = signupEmail.split("@")[0];
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    setUser({
      name: formattedName,
      email: signupEmail,
      company: "Contract Design Ltd",
      messenger: "WhatsApp",
      messengerId: "+44 7700 900077",
      isStaff: isCraftonStaffEmail(signupEmail)
    });
    setShowAuthGate(false);
  };

  const handleSignUp = (e) => {
    if (e) e.preventDefault();
    if (!signupEmail || !signupName) {
      alert(lang === "Cn" ? "請填寫電子郵件與姓名！" : "Please fill in email and name!");
      return;
    }
    setUser({
      name: signupName,
      email: signupEmail,
      company: signupCompany || "Independent Designer",
      messenger: signupMessenger,
      messengerId: signupMessengerId || "N/A",
      isStaff: isCraftonStaffEmail(signupEmail)
    });
    setShowAuthGate(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentStageView("Marketing");
    setMarketingTab("Overview");
  };

  const syncAuthenticatedUserProfile = async (supabaseUser, profilePatch = {}) => {
    if (!supabaseUser) return;

    const client = getSupabaseBrowserClient();
    if (!client) return;

    const appUser = mapSupabaseUserToAppUser(supabaseUser, profilePatch);
    const hasExplicitProfilePatch = Object.keys(profilePatch || {}).length > 0;
    const profileFingerprint = JSON.stringify({
      id: supabaseUser.id,
      name: appUser.name,
      company: appUser.company,
      messenger: appUser.messenger,
      messengerId: appUser.messengerId,
      avatarUrl: appUser.avatarUrl || null
    });

    if (!hasExplicitProfilePatch && lastProfileSyncRef.current === profileFingerprint) {
      return;
    }

    try {
      await client.from("user_profiles").upsert(
        {
          user_id: supabaseUser.id,
          full_name: appUser.name,
          company: appUser.company,
          preferred_messenger: appUser.messenger,
          messenger_id: appUser.messengerId,
          avatar_url: appUser.avatarUrl || null,
          onboarding_status: "active"
        },
        { onConflict: "user_id" }
      );

      const identities = Array.isArray(supabaseUser.identities) ? supabaseUser.identities : [];
      const providerRows =
        identities.length > 0
          ? identities
              .map((identity) => ({
                user_id: supabaseUser.id,
                provider: identity.provider,
                provider_subject: identity.id || identity.identity_id,
                email: supabaseUser.email || identity.identity_data?.email || null,
                email_verified: Boolean(supabaseUser.email_confirmed_at || identity.identity_data?.email_verified),
                last_used_at: new Date().toISOString()
              }))
              .filter(
                (identity) => ["email", "google", "apple"].includes(identity.provider) && identity.provider_subject
              )
          : [
              {
                user_id: supabaseUser.id,
                provider: "email",
                provider_subject: supabaseUser.id,
                email: supabaseUser.email || null,
                email_verified: Boolean(supabaseUser.email_confirmed_at),
                last_used_at: new Date().toISOString()
              }
            ];

      if (providerRows.length > 0) {
        await client.from("account_identities").upsert(providerRows, { onConflict: "provider,provider_subject" });
      }
      lastProfileSyncRef.current = profileFingerprint;
    } catch (err) {
      console.warn("User profile sync failed. Has the identity migration been run?", err.message || err);
    }
  };

  const handleAuthLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");

    const client = getSupabaseBrowserClient();
    if (!client) {
      setAuthError(
        lang === "Cn"
          ? "账户服务暂时不可用，请稍后再试。"
          : "The account service is temporarily unavailable. Please try again later."
      );
      return;
    }

    if (!signupEmail || !signupPassword) {
      setAuthError(lang === "Cn" ? "请输入邮箱和密码。" : "Please enter email and password.");
      return;
    }

    setAuthLoading(true);
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: signupEmail.trim(),
        password: signupPassword
      });

      if (error) throw error;
      if (!data?.user) throw new Error("No authenticated user returned.");

      setSupabaseSessionUser(data.user);
      setSupabaseAuthReady(true);
      setUser(mapSupabaseUserToAppUser(data.user));
      setShowAuthGate(false);
    } catch (err) {
      setAuthError(err.message || "Sign in failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSignUp = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");

    const client = getSupabaseBrowserClient();
    if (!client) {
      setAuthError(
        lang === "Cn"
          ? "账户服务暂时不可用，请稍后再试。"
          : "The account service is temporarily unavailable. Please try again later."
      );
      return;
    }

    if (!signupEmail || !signupName || !signupPassword) {
      setAuthError(lang === "Cn" ? "请填写邮箱、姓名和密码。" : "Please fill in email, name, and password.");
      return;
    }

    if (signupPassword.length < 8) {
      setAuthError(lang === "Cn" ? "密码至少 8 位。" : "Password must be at least 8 characters.");
      return;
    }

    setAuthLoading(true);
    const profilePatch = {
      name: signupName,
      email: signupEmail,
      company: signupCompany || "Independent Designer",
      messenger: signupMessenger,
      messengerId: signupMessengerId || "N/A"
    };

    try {
      const { data, error } = await client.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          emailRedirectTo: getOAuthRedirectUrl(),
          data: {
            full_name: signupName,
            company: signupCompany || "Independent Designer",
            preferred_messenger: signupMessenger,
            messenger_id: signupMessengerId || "N/A"
          }
        }
      });

      if (error) throw error;
      if (data?.user) await syncAuthenticatedUserProfile(data.user, profilePatch);

      if (data?.session && data?.user) {
        setUser(mapSupabaseUserToAppUser(data.user, profilePatch));
        setShowAuthGate(false);
      } else {
        setAuthError(
          lang === "Cn"
            ? "注册已送出，请到邮箱完成验证后再登录。"
            : "Registration submitted. Please verify your email, then sign in."
        );
      }
    } catch (err) {
      setAuthError(err.message || "Registration failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthOAuthSignIn = async (provider) => {
    setAuthError("");
    const client = getSupabaseBrowserClient();
    if (!client) {
      setAuthError(
        lang === "Cn"
          ? "账户服务暂时不可用，请稍后再试。"
          : "The account service is temporarily unavailable. Please try again later."
      );
      return;
    }

    setAuthLoading(true);
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getOAuthRedirectUrl()
      }
    });

    if (error) {
      setAuthError(error.message || `${provider} sign in failed.`);
      setAuthLoading(false);
    }
  };

  const handleAuthLogout = async () => {
    const client = getSupabaseBrowserClient();
    setAuthError("");
    setAuthLoading(false);
    setSupabaseSessionUser(null);
    setSupabaseAuthReady(true);
    setAdminAccessStatus("unauthenticated");
    setUser(null);
    setSupportConversationId(null);
    setSupportUploadedFileId(null);
    setSupportSubmittedJobId(null);
    supportConversationIdRef.current = null;
    lastProfileSyncRef.current = "";
    setCurrentStageView("Marketing");
    setMarketingTab("Overview");
    setClientPortalTab("Intake");
    setClientProjectsLoading(true);
    setSubmittedTrackerProject(null);
    setLatestIntakeJob(null);
    setTrackerPreviewUrl("");
    setClientProjectJobs([]);
    setClientAnswerDrafts({});
    setClientAnswerSubmitState({});
    clearSupabaseAuthStorage();

    if (client) {
      client.auth
        .signOut({ scope: "global" })
        .catch((err) => console.warn("Supabase sign out failed:", err.message || err));
    }
  };

  const loginAsDemo = (role) => {
    if (role === "client") {
      setUser({
        name: "Sarah Jenkins",
        email: "sarah@jenkins-design.co.uk",
        company: "Jenkins Contract Interior Studio",
        messenger: "WhatsApp",
        messengerId: "+44 7700 900077",
        isStaff: false
      });
      setClientProjectJobs(buildClientDashboardDemoJobs());
      setClientProjectsLoading(false);
      setClientPortalTab("Tracker");
    } else if (role === "cho") {
      if (getSupabaseBrowserClient()) {
        setSignupEmail("cho@crafton.com");
        setAuthMode("login");
        setAuthError(
          lang === "Cn"
            ? "管理员必须使用真实 Supabase 账号登录，输入 Cho 的密码后才能读取全部客户订单。"
            : "Administrators must sign in with the real Supabase account before customer orders can be loaded."
        );
        setShowAuthGate(true);
        return;
      }
      setUser({
        name: "Cho (Manager)",
        email: "cho@crafton.com",
        company: "The Crafton Ltd",
        messenger: "WeChat",
        messengerId: "cho_crafton",
        isStaff: true
      });
    }
    setShowAuthGate(false);
  };

  const getPortalSupabaseContext = async ({ requireAuth = true } = {}) => {
    if (!dbConnected || !window.supabase) return null;

    const client = getSupabaseBrowserClient();
    if (!client) return null;

    const authResult = await client.auth.getUser().catch(() => ({ data: { user: null } }));
    const supabaseUser = authResult?.data?.user || null;

    if (requireAuth && !supabaseUser) {
      // Quick-access demo users intentionally run the complete intake flow locally.
      // Avoid reopening the production auth gate while they test the customer dashboard.
      if (user && !supabaseSessionUser) return null;
      setAuthMode("login");
      setShowAuthGate(true);
      setAuthError(
        lang === "Cn"
          ? "请先登录，系统才能把操作绑定到你的用户 ID。"
          : "Please sign in so this action can be linked to your user ID."
      );
      return null;
    }

    return { client, supabaseUser };
  };

  const uploadIntakeFileRecord = async ({ file, fileType = "PORTAL_FORM", notes = "" }) => {
    const context = await getPortalSupabaseContext();
    if (!context) return null;

    const { client, supabaseUser } = context;
    const cleanName = file.name.replace(/[^\w.-]+/g, "_");
    const storagePath = `${supabaseUser.id}/${Date.now()}-${cleanName}`;
    const { error: uploadError } = await withTimeout(
      client.storage.from("intake-files").upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      }),
      INTAKE_UPLOAD_TIMEOUT_MS,
      "File upload to Supabase timed out. Please check the network, Storage bucket policy, and file size."
    );

    if (uploadError) throw uploadError;

    const { data: fileRow, error: fileError } = await withTimeout(
      client
        .from("intake_files")
        .insert({
          user_id: supabaseUser.id,
          uploaded_by: supabaseUser.id,
          original_name: file.name,
          storage_bucket: "intake-files",
          storage_path: storagePath,
          mime_type: file.type || null,
          file_size: file.size || null,
          intake_type: fileType,
          notes
        })
        .select()
        .single(),
      INTAKE_DB_TIMEOUT_MS,
      "File metadata was uploaded, but saving the intake_files row timed out."
    );

    if (fileError) throw fileError;
    return fileRow;
  };

  const createLiveIntakeJob = async ({
    projectName,
    destination,
    quantity,
    fileType,
    textBrief,
    structuredBrief,
    file,
    intakeFileId: existingIntakeFileId
  }) => {
    const context = await getPortalSupabaseContext();
    if (!context) return null;

    const { client, supabaseUser } = context;
    let intakeFileId = existingIntakeFileId || null;

    if (file && !intakeFileId) {
      const fileRow = await uploadIntakeFileRecord({
        file,
        fileType: fileType || "PORTAL_FORM",
        notes: textBrief || quantity || ""
      });
      intakeFileId = fileRow?.id || null;
    }

    const { data: job, error: jobError } = await withTimeout(
      client
        .from("intake_jobs")
        .insert({
          intake_file_id: intakeFileId,
          user_id: supabaseUser.id,
          requested_by: supabaseUser.id,
          project_name: projectName || null,
          destination,
          quantity_text: quantity,
          brief_text: [projectName ? `Display project: ${projectName}` : "", textBrief || ""]
            .filter(Boolean)
            .join("\n"),
          result_json: structuredBrief || null,
          step: structuredBrief?.schema_version === "portal_intake_v2" ? "cho_review" : "parse_intake",
          status: structuredBrief?.schema_version === "portal_intake_v2" ? "needs_review" : "queued"
        })
        .select()
        .single(),
      INTAKE_DB_TIMEOUT_MS,
      "Creating the intake job timed out. Please retry after confirming Supabase is connected."
    );

    if (jobError) throw jobError;
    setLatestIntakeJob(job);
    setClientProjectJobs((prev) => [job, ...prev.filter((item) => item.id !== job.id)]);
    return job;
  };

  const summarizeSupportConversation = (messages = supportMessages) => {
    return messages
      .map((message) => `${message.sender === "client" ? "Client" : "Crafton Concierge"}: ${message.text}`)
      .join("\n");
  };

  const ensureSupportConversation = async () => {
    if (supportConversationIdRef.current) return supportConversationIdRef.current;

    const context = await getPortalSupabaseContext();
    if (!context) return null;

    const { client, supabaseUser } = context;
    const { data, error } = await client
      .from("ai_support_conversations")
      .insert({
        user_id: supabaseUser.id,
        requested_by: supabaseUser.id,
        client_name: user?.name || null,
        client_email: user?.email || null,
        company: user?.company || null,
        project_name: intakeProjectName || null,
        destination: intakeDestination || null,
        quantity_text: intakeQuantity || null,
        status: "open"
      })
      .select("id")
      .single();

    if (error) throw error;
    supportConversationIdRef.current = data.id;
    setSupportConversationId(data.id);
    return data.id;
  };

  const saveSupportMessage = async ({ sender, text, attachmentFileId = null, aiPayload = {} }) => {
    try {
      const conversationId = await ensureSupportConversation();
      if (!conversationId) return null;

      const context = await getPortalSupabaseContext();
      if (!context) return null;

      const { client, supabaseUser } = context;
      const { error } = await client.from("ai_support_messages").insert({
        user_id: supabaseUser.id,
        conversation_id: conversationId,
        sender,
        message_text: text,
        attachment_file_id: attachmentFileId,
        ai_payload: aiPayload
      });

      if (error) throw error;
      return conversationId;
    } catch (err) {
      console.warn("AI support message was not persisted:", err.message || err);
      return null;
    }
  };

  const updateSupportConversationSummary = async ({ status = "open", summaryText = "", latestIntakeFileId } = {}) => {
    try {
      const conversationId = await ensureSupportConversation();
      if (!conversationId) return;

      const context = await getPortalSupabaseContext();
      if (!context) return;

      await context.client
        .from("ai_support_conversations")
        .update({
          status,
          project_name: intakeProjectName || null,
          destination: intakeDestination || null,
          quantity_text: intakeQuantity || null,
          summary_text: summaryText || summarizeSupportConversation(),
          latest_intake_file_id: latestIntakeFileId ?? supportUploadedFileId ?? null
        })
        .eq("id", conversationId);
    } catch (err) {
      console.warn("AI support conversation summary was not persisted:", err.message || err);
    }
  };

  const applySupportExtraction = (extracted = {}) => {
    if (extracted.projectName) setIntakeProjectName(extracted.projectName);
    if (extracted.destination) setIntakeDestination(extracted.destination);
    if (extracted.quantityText) setIntakeQuantity(extracted.quantityText);
  };

  const getPortalContextJobs = () => {
    const merged = new Map();
    [...clientProjectJobs, ...getLocalReviewJobs()].forEach((job) => {
      const key =
        job.id || `${job.project_name || job.projectName || "local"}-${job.created_at || job.submittedAt || ""}`;
      if (!merged.has(key)) merged.set(key, job);
    });
    return Array.from(merged.values());
  };

  const buildSupportProjectContext = () =>
    buildAiProjectOverviewFromJobs(getPortalContextJobs(), {
      projectName: intakeProjectName,
      destination: intakeDestination,
      quantityText: intakeQuantity,
      selectedFileName: supportSelectedFileName || intakeSelectedFileName || "",
      draftSource: supportSelectedFileName ? "ai_concierge" : "manual_intake"
    });

  /* legacy tracker fallback disabled after unified project context upgrade
  const buildTrackerContextReply = (latestText) => {
    const overview = buildSupportProjectContext();
    const latestOrder = overview.latestOrder;
    const wantsProgress = /progress|status|stage|when|ready|done|進度|进度|狀態|状态|完成|幾時|什么时候|何時/i.test(latestText);

    if (wantsProgress && latestOrder) {
      return lang === "Cn"
        ? `我看到最新订单是「${latestOrder.projectName || "待确认项目"}」，状态为 ${latestOrder.reviewStatus || latestOrder.status}。${latestOrder.summary || "Crafton 团队正在整理需求草稿。"}`
        : `The latest order I can see is "${latestOrder.projectName || "To confirm"}", currently ${latestOrder.reviewStatus || latestOrder.status}. ${latestOrder.summary || "The Crafton team is preparing the intake draft."}`;
    }

    if (latestOrder) {
      return lang === "Cn"
        ? `收到。我会参考当前项目概览：${latestOrder.projectName || "待确认项目"}，${latestOrder.destination || "目的地待确认"}，${latestOrder.quantityText || "数量待确认"}。请继续补充要新增、修改或查询的内容。`
        : `Received. I will use the current project overview: ${latestOrder.projectName || "To confirm"}, ${latestOrder.destination || "destination pending"}, ${latestOrder.quantityText || "quantity pending"}. Please tell me whether this is a new order, a modification, or a progress question.`;
    }

    return lang === "Cn"
      ? "收到。我还没有看到已提交的项目概览，请先提交一份需求或告诉我项目名、地点、数量和参考资料。"
      : "Received. I do not see a submitted project overview yet, so please share the project name, destination, quantity, and reference files first.";
  };

  */
  const buildTrackerContextReply = (latestText) => {
    const overview = buildSupportProjectContext();
    const latestOrder = overview.latestOrder;
    const wantsProgress = /progress|status|stage|when|ready|done|進度|进度|狀態|状态|完成|幾時|什么时候|何時/i.test(
      latestText
    );

    if (wantsProgress && latestOrder) {
      return `The latest order I can see is "${latestOrder.projectName || "To confirm"}", currently ${
        latestOrder.reviewStatus || latestOrder.status
      }. ${latestOrder.summary || "The Crafton team is preparing the intake draft."}`;
    }

    if (latestOrder) {
      return `Received. I will use the current project overview: ${latestOrder.projectName || "To confirm"}, ${
        latestOrder.destination || "destination pending"
      }, ${latestOrder.quantityText || "quantity pending"}. Please tell me whether this is a new order, a modification, or a progress question.`;
    }

    return "Received. I do not see a submitted project overview yet, so please share the project name, destination, quantity, and reference files first.";
  };

  const requestAiSupportReply = async (messages) => {
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        return await requestAiSupportReplyOnce(messages);
      } catch (err) {
        lastError = err;
        if (attempt === 1) {
          setSupportStatus("智能客服连接不稳定，正在自动重试...");
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }

    throw lastError;
  };

  const requestAiSupportReplyOnce = async (messages) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 110000);
    const projectOverview = buildSupportProjectContext();

    let response;
    try {
      response = await fetch(AI_SUPPORT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages,
          context: {
            projectName: intakeProjectName,
            destination: intakeDestination,
            quantity: intakeQuantity,
            selectedFileName: supportSelectedFileName,
            clientName: user?.name || "",
            company: user?.company || "",
            preferredLanguage: lang,
            projectOverview
          }
        })
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || "Crafton customer service is temporarily unavailable.");
      error.requestId = payload.requestId;
      throw error;
    }

    return payload;
  };

  const handleSupportSend = async (e) => {
    if (e) e.preventDefault();
    const text = supportInput.trim();
    if (!text || supportIsTyping) return;

    const nextMessages = [...supportMessages, { sender: "client", text }];
    setSupportMessages(nextMessages);
    setSupportInput("");
    setSupportIsTyping(true);
    setSupportStatus("");
    saveSupportMessage({ sender: "client", text }).catch(() => {});

    try {
      const result = await requestAiSupportReply(nextMessages);
      applySupportExtraction(result.extracted);
      setSupportMessages((prev) => [...prev, { sender: "ai", text: result.reply }]);
      setSupportStatus("");
      saveSupportMessage({ sender: "ai", text: result.reply, aiPayload: result }).catch(() => {});
      updateSupportConversationSummary({ summaryText: result.extracted?.briefText || "" }).catch(() => {});
    } catch (err) {
      console.error("AI support reply failed:", err);
      const fallbackText =
        err.name === "AbortError"
          ? "抱歉，这一轮智能回复超时了。对话没有结束，您可以继续发送消息，或稍后再试。"
          : `抱歉，这一轮智能客服连接不稳定。对话没有结束，您可以继续发送消息，或直接提交项目需求给 Crafton 团队。${err.requestId ? `（错误编号：${err.requestId}）` : ""}`;
      setSupportMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: fallbackText
        }
      ]);
      saveSupportMessage({ sender: "ai", text: fallbackText }).catch(() => {});
    } finally {
      setSupportIsTyping(false);
    }
  };

  const handleSupportFileSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    setSupportSelectedFile(file || null);
    setSupportSelectedFileName(file?.name || "");
    setSupportSubmittedJobId(null);
    if (!file) return;

    const isVisualImage =
      String(file.type || "")
        .toLowerCase()
        .startsWith("image/") || /\.(?:png|jpe?g|webp)$/i.test(file.name || "");
    const clientFileMessage = `Uploaded file: ${file.name} (${file.type || "unknown type"})`;
    const nextMessages = [...supportMessages, { sender: "client", text: clientFileMessage }];
    setSupportMessages(nextMessages);

    setSupportStatus("正在保存客户文件...");
    let uploadedFileRow = null;

    try {
      const fileRow = await uploadIntakeFileRecord({
        file,
        fileType: "AI_SUPPORT_FILE",
        notes: summarizeSupportConversation(nextMessages)
      });
      uploadedFileRow = fileRow;

      setSupportUploadedFileId(fileRow?.id || null);
      await saveSupportMessage({ sender: "client", text: clientFileMessage, attachmentFileId: fileRow?.id || null });

      if (isVisualImage && fileRow?.id) {
        setSupportStatus("图片已保存，正在创建视觉解析任务...");
        setSupportIsTyping(true);
        const job = await createLiveIntakeJob({
          projectName: intakeProjectName,
          destination: intakeDestination,
          quantity: intakeQuantity,
          fileType: "AI_SUPPORT_IMAGE",
          textBrief: [
            "Source: Crafton customer service image upload",
            `Client: ${user?.name || "Portal Client"} (${user?.company || "Unknown company"})`,
            summarizeSupportConversation(nextMessages)
          ].join("\n\n"),
          file: null,
          intakeFileId: fileRow.id
        });
        const aiFileReply = job
          ? "图片已上传并进入视觉解析。系统会识别家具类型、可见材质/颜色、风格与构造特征，生成双语需求草稿；数量、尺寸和防火认证等不能仅凭照片确认的内容会列为问题，交由 Cho 审核。"
          : "图片已保存，但当前未能创建视觉解析任务。请确认 Supabase 登录与连接后，再点击提交项目需求。";
        setSupportMessages((prev) => [...prev, { sender: "ai", text: aiFileReply }]);
        await saveSupportMessage({
          sender: "ai",
          text: aiFileReply,
          attachmentFileId: fileRow.id,
          aiPayload: job ? { intakeJobId: job.id, visualAnalysis: "queued" } : {}
        });
        if (job) {
          setSupportSubmittedJobId(job.id);
          setSupportStatus(`图片视觉解析已排队。任务 ID：${job.id}`);
          updateSupportConversationSummary({ status: "submitted", latestIntakeFileId: fileRow.id }).catch(() => {});
          loadPrequoteWorkspace().catch((err) => console.warn("Prequote refresh after image intake failed:", err));
        } else {
          setSupportStatus("图片已保存，但视觉解析任务尚未创建。");
        }
        setSupportIsTyping(false);
        return;
      }

      setSupportStatus("File saved. Crafton is updating the project overview...");
      setSupportIsTyping(true);
      const result = await requestAiSupportReply(nextMessages);
      applySupportExtraction(result.extracted);
      const aiFileReply =
        result.reply ||
        "文件已安全保存。我会把它作为客户原始资料，连同对话摘要一起提交给 Crafton 顾问团队。图片会自动进入视觉解析；其他文件会结合当前可读取的表单与对话文字整理草稿。";
      setSupportMessages((prev) => [...prev, { sender: "ai", text: aiFileReply }]);
      await saveSupportMessage({
        sender: "ai",
        text: aiFileReply,
        attachmentFileId: fileRow?.id || null,
        aiPayload: result
      });
      updateSupportConversationSummary({ summaryText: result.extracted?.briefText || "" }).catch(() => {});
      setSupportIsTyping(false);
      setSupportStatus(`文件已保存：${file.name}`);
    } catch (err) {
      console.error("Support file upload failed:", err);
      setSupportIsTyping(false);
      const aiFileError = uploadedFileRow?.id
        ? "文件已保存到云端，但视觉解析任务暂时创建失败。请稍后点击提交项目需求重试。"
        : "我已经在当前页面接收了这个文件，但暂时没有成功保存到云端。请稍后重试上传，或检查 Supabase 连接后再提交项目需求。";
      setSupportMessages((prev) => [...prev, { sender: "ai", text: aiFileError }]);
      setSupportStatus(
        uploadedFileRow?.id
          ? "文件已保存，但视觉解析任务创建失败。"
          : "文件暂时只保存在当前浏览器，尚未保存到 Supabase。"
      );
    }
  };

  const handleSupportHandoffToIntake = async () => {
    if (supportSubmittedJobId) {
      setSupportStatus(`图片需求已提交，正在等待视觉解析。任务 ID：${supportSubmittedJobId}`);
      loadPrequoteWorkspace().catch((err) => console.warn("Prequote refresh after image intake failed:", err));
      setClientPortalTab("Tracker");
      return;
    }

    const transcript = summarizeSupportConversation();
    const transcriptFile =
      supportSelectedFile ||
      new File([transcript], `crafton-support-transcript-${Date.now()}.txt`, { type: "text/plain" });

    setSupportStatus("正在整理对话并提交项目需求...");
    setLiveIntakeWarning("");

    try {
      const job = await createLiveIntakeJob({
        projectName: intakeProjectName,
        destination: intakeDestination,
        quantity: intakeQuantity,
        fileType: supportSelectedFile ? "AI_SUPPORT_FILE" : "AI_SUPPORT_CHAT",
        textBrief: [
          "Source: Crafton customer service chat",
          `Client: ${user?.name || "Portal Client"} (${user?.company || "Unknown company"})`,
          transcript
        ].join("\n\n"),
        file: supportUploadedFileId ? null : transcriptFile,
        intakeFileId: supportUploadedFileId
      });

      if (job) {
        setSupportStatus(`已提交项目需求。任务 ID：${job.id}`);
        updateSupportConversationSummary({ status: "submitted" }).catch(() => {});
        loadPrequoteWorkspace().catch((err) => console.warn("Prequote refresh after AI handoff failed:", err));
        setClientPortalTab("Tracker");
        setSupportMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "已提交项目需求。后台会继续整理资料并生成项目草稿，完成后会交由 Cho 审核。"
          }
        ]);
      } else {
        setSupportStatus("当前未连接 Supabase，已保留本地对话摘要。连接后可再次提交项目需求。");
      }
    } catch (err) {
      console.error("AI support handoff failed:", err);
      setSupportStatus(err.message || "提交项目需求失败，请检查 Supabase 连接和文件类型。");
    }
  };

  const getStructuredIntakeMissingQuestions = (payload = {}) => {
    const project = payload.project || {};
    const item = payload.items?.[0] || {};
    const dimensions = item.dimensions || {};
    return [
      project.name ? null : "Project name is missing.",
      project.destination ? null : "Delivery destination is missing.",
      project.desired_delivery_date ? null : "Desired delivery date is missing.",
      item.item_type_en && item.item_type_en !== "Custom furniture item" ? null : "Furniture type is missing.",
      item.quantity ? null : "Quantity is missing.",
      dimensions.length && dimensions.width && dimensions.height ? null : "Length, width, and height are incomplete.",
      (item.material_en && item.material_en !== "To confirm") || item.fabric_code || item.finish
        ? null
        : "Material, fabric, or finish is missing.",
      payload.file_name ? null : "Drawing, photo, or reference file is missing."
    ].filter(Boolean);
  };

  const buildStructuredIntakePayload = ({
    projectName = intakeProjectName,
    destination = intakeDestination,
    quantity = intakeQuantity,
    fileName = intakeSelectedFileName || supportSelectedFileName || ""
  } = {}) => {
    const quantityNumber = Number(String(quantity || "").match(/\d+/)?.[0] || 0);
    const dimensions = {
      length: intakeLength.trim(),
      width: intakeWidth.trim(),
      height: intakeHeight.trim(),
      unit: intakeDimensionUnit || "mm"
    };
    const dimensionsText = formatDimensionPayload(dimensions);
    const itemType = intakeItemType.trim();
    const material = intakeMaterial.trim();
    const finish = intakeFinish.trim();
    const color = intakeColor.trim();
    const fabricCode = intakeFabricCode.trim();
    const hardware = intakeHardware.trim();
    const notes = intakeAdditionalNotes.trim();
    const materialSummary = [material, fabricCode ? `Fabric ${fabricCode}` : "", finish, color]
      .filter(Boolean)
      .join(" / ");

    const payload = {
      schema_version: "portal_intake_v2",
      file_name: fileName,
      project: {
        name: projectName.trim(),
        client_name: user?.company || user?.name || "Portal Intake Client",
        contact_name: user?.name || "",
        destination: destination.trim(),
        delivery_address: intakeDeliveryAddress.trim(),
        desired_delivery_date: intakeDesiredDeliveryDate,
        delivery_window: intakeDeliveryWindow.trim(),
        target_budget: intakeTargetBudget.trim(),
        currency: intakeCurrency || "USD"
      },
      items: [
        {
          id: "CLIENT-ITEM-01",
          item_type_en: itemType || "Custom furniture item",
          item_type_cn: itemType || "Customer bespoke item",
          quantity: quantityNumber,
          quantity_text: quantity.trim(),
          dimensions,
          dimensions_text: dimensionsText,
          tolerance: intakeTolerance.trim(),
          material_en: materialSummary || "To confirm",
          material_cn: materialSummary || "To confirm",
          fabric_code: fabricCode,
          finish,
          color,
          hardware,
          usage_location: intakeUsageLocation.trim(),
          fire_standard: intakeFireStandard.trim(),
          notes_en: notes || "Client submitted through portal intake form."
        }
      ],
      dimensions: dimensionsText,
      tolerance: intakeTolerance.trim(),
      fire_standard: intakeFireStandard.trim(),
      packaging: intakePackaging.trim(),
      site_access: intakeSiteAccess.trim(),
      target_budget: intakeTargetBudget.trim(),
      currency: intakeCurrency || "USD",
      summary_en: [
        projectName ? `${projectName.trim()} furniture order` : "Customer furniture order",
        itemType ? `Item: ${itemType}` : "",
        quantity ? `Quantity: ${quantity.trim()}` : "",
        dimensionsText ? `Dimensions: ${dimensionsText}` : "",
        intakeDesiredDeliveryDate ? `Desired delivery: ${intakeDesiredDeliveryDate}` : ""
      ]
        .filter(Boolean)
        .join(" | "),
      source_notes: notes
    };

    payload.questions = getStructuredIntakeMissingQuestions(payload);
    return payload;
  };

  const buildStructuredIntakeBriefText = (payload = {}) => {
    const project = payload.project || {};
    const item = payload.items?.[0] || {};
    return [
      `Project: ${project.name || "To confirm"}`,
      `Client: ${project.client_name || "Portal Intake Client"}`,
      `Destination: ${project.destination || "To confirm"}`,
      `Delivery address: ${project.delivery_address || "To confirm"}`,
      `Desired delivery date: ${project.desired_delivery_date || "To confirm"}`,
      `Budget: ${project.target_budget || "To confirm"} ${project.currency || ""}`.trim(),
      `Furniture type: ${item.item_type_en || "To confirm"}`,
      `Quantity: ${item.quantity_text || item.quantity || "To confirm"}`,
      `Dimensions: ${item.dimensions_text || "To confirm"}`,
      `Tolerance: ${item.tolerance || "To confirm"}`,
      `Material/fabric/finish/color: ${item.material_en || "To confirm"}`,
      `Hardware/base: ${item.hardware || "To confirm"}`,
      `Usage location: ${item.usage_location || "To confirm"}`,
      `Fire/compliance: ${item.fire_standard || "To confirm"}`,
      `Packaging: ${payload.packaging || "To confirm"}`,
      `Site access: ${payload.site_access || "To confirm"}`,
      `Reference file: ${payload.file_name || "Not uploaded"}`,
      `Client notes: ${payload.source_notes || "None"}`
    ].join("\n");
  };

  const handleIntakeFileSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    setIntakeSelectedFile(file || null);
    setIntakeSelectedFileName(file?.name || "");
    setIntakeUploadedFileId(null);
    setIntakeUploadStatus("");
    setIntakeFileUploading(false);
    if (!file) return;

    setLiveIntakeWarning("");
    setIntakeFileUploading(true);
    setIntakeUploadStatus(
      lang === "Cn" ? "\u6b63\u5728\u4fdd\u5b58\u6587\u4ef6\u5230 Supabase..." : "Saving file to Supabase..."
    );

    try {
      const fileRow = await uploadIntakeFileRecord({
        file,
        fileType: "PORTAL_FORM",
        notes: [
          intakeProjectName,
          intakeDestination,
          intakeQuantity,
          intakeItemType,
          formatDimensionPayload({
            length: intakeLength,
            width: intakeWidth,
            height: intakeHeight,
            unit: intakeDimensionUnit
          }),
          intakeDesiredDeliveryDate
        ]
          .filter(Boolean)
          .join(" | ")
      });

      if (fileRow?.id) {
        setIntakeUploadedFileId(fileRow.id);
        setIntakeUploadStatus(
          `${lang === "Cn" ? "\u5df2\u4fdd\u5b58\u5230 intake_files\uff1a" : "Saved to intake_files: "}${file.name}`
        );
      } else {
        setIntakeUploadStatus(
          lang === "Cn"
            ? "\u6587\u4ef6\u5df2\u9009\u4e2d\u3002\u8bf7\u5148\u767b\u5f55\u5e76\u4fdd\u6301 Supabase \u8fde\u63a5\uff0c\u63d0\u4ea4\u65f6\u4f1a\u518d\u6b21\u4e0a\u4f20\u3002"
            : "File selected. Please sign in and keep Supabase connected before submitting."
        );
      }
    } catch (err) {
      console.error("Intake file upload failed:", err);
      setIntakeUploadedFileId(null);
      setIntakeUploadStatus("");
      setLiveIntakeWarning(err.message || "File upload failed. Please check Supabase Storage and table permissions.");
    } finally {
      setIntakeFileUploading(false);
    }
  };

  const handleIntakeSubmit = async (e, override = {}) => {
    if (e) e.preventDefault();
    const submitProjectName = override.projectName || intakeProjectName;
    const submitDestination = override.destination || intakeDestination;
    const submitQuantity = override.quantity || intakeQuantity;
    const submitFileType = override.fileType || "PORTAL_FORM";
    const submitTextBrief = override.textBrief || "";
    const submitFile = override.file || intakeSelectedFile;
    const submitIntakeFileId = override.intakeFileId || intakeUploadedFileId;
    const submittedFileName = submitFile?.name || supportSelectedFileName || intakeSelectedFileName || "";
    const structuredBrief =
      override.structuredBrief ||
      buildStructuredIntakePayload({
        projectName: submitProjectName,
        destination: submitDestination,
        quantity: submitQuantity,
        fileName: submittedFileName
      });
    const structuredTextBrief = [submitTextBrief, buildStructuredIntakeBriefText(structuredBrief)]
      .filter(Boolean)
      .join("\n\n");

    setIsIntakeUploading(true);
    setParsingLogs([]);
    setLiveIntakeWarning("");
    let createdJob = null;

    try {
      const job = await createLiveIntakeJob({
        projectName: submitProjectName,
        destination: submitDestination,
        quantity: submitQuantity,
        fileType: submitFileType,
        textBrief: structuredTextBrief,
        structuredBrief,
        file: submitFile,
        intakeFileId: submitIntakeFileId
      });

      if (job) {
        createdJob = job;
        setParsingLogs((prev) => [
          ...prev,
          {
            cn: `已建立 Supabase Intake Job：${job.id}。VPS Worker 将接手后台解析。`,
            en: `Supabase Intake Job created: ${job.id}. The VPS worker will process it in the background.`
          }
        ]);
      }
    } catch (err) {
      console.error("Live intake job creation failed:", err);
      setLiveIntakeWarning(err.message || "Live intake job creation failed. Falling back to local simulation.");
    }

    // Simulate real-time parsing logs
    const simulatedLogs = [
      {
        delay: 400,
        cn: "[Crafton Intake] 已连接规格解析服务...",
        en: "[Crafton Intake] Connected to the specification service..."
      },
      {
        delay: 1000,
        cn: "🔍 [Intake Agent] 正在讀取上傳設計草圖幾何線條...",
        en: "🔍 [Intake Agent] Analysing uploaded sketch geometry..."
      },
      {
        delay: 1600,
        cn: "📐 [Spec Agent] 自動推導扶手椅與休閒椅比例及公差限制 (W:65cm, D:60cm, H:85cm)...",
        en: "📐 [Spec Agent] Extrapolating chair dimensions and tolerances (W:65cm, D:60cm, H:85cm)..."
      },
      {
        delay: 2200,
        cn: "🔥 [Compliance Agent] 比對英國 BS 5852 Crib 5 消防安全性：面料耐燃性相符...",
        en: "🔥 [Compliance Agent] Auditing British BS 5852 Crib 5 compliance: Swatch flammability compatible..."
      },
      {
        delay: 2800,
        cn: "📝 [BOM Agent] 自動生成雙語技術 BOM 清單與圖紙歸檔...",
        en: "📝 [BOM Agent] Compiling bilingual technical BOM spreadsheet & blueprint archives..."
      },
      {
        delay: 3400,
        cn: "[Crafton Intake] 项目主数据已导入，进度面板现已开放。",
        en: "[Crafton Intake] Project data synchronized. The tracker is now available."
      }
    ];

    simulatedLogs.forEach((log) => {
      setTimeout(() => {
        setParsingLogs((prev) => [...prev, log]);
      }, log.delay);
    });

    setTimeout(() => {
      const submittedFile = submitFile || supportSelectedFile || intakeSelectedFile || null;
      const newItems = buildSubmittedOrderItems(submitQuantity, structuredBrief);

      setSubmittedTrackerProject({
        projectName: submitProjectName || "",
        destination: submitDestination || "",
        quantityText: submitQuantity || "",
        desiredDeliveryDate: structuredBrief.project?.desired_delivery_date || "",
        dimensions: structuredBrief.dimensions || "",
        structuredBrief,
        file: submittedFile,
        fileName: submittedFileName,
        jobId: createdJob?.id || null,
        intakeFileId: createdJob?.intake_file_id || submitIntakeFileId || supportUploadedFileId || null,
        quoteStatus: "pending_quote",
        submittedAt: new Date().toISOString()
      });

      setOrder({
        orderId: "CRAFT-" + new Date().getFullYear() + ("0" + (new Date().getMonth() + 1)).slice(-2) + "-BESPOKE",
        clientName: user ? user.company : "Bespoke Partner",
        projectLocation: submitDestination,
        createdDate: new Date().toISOString().split("T")[0],
        currentStageId: "S02",
        quoteStatus: "pending_quote",
        items: newItems,
        payments: [
          {
            milestone: "Supplier quotation pending",
            amount: 0,
            date: "Pending",
            status: "Pending Quote"
          }
        ]
      });

      setCurrentStageIndex(1); // S02: specs received, supplier quote pending
      setIsIntakeUploading(false);
      setClientPortalTab("Tracker");
    }, 4000);
  };

  // =====================================================================
  // CRAFTON AI - LOW SATURATION VECTOR RENDERS & STAGE PLAYGROUNDS
  // =====================================================================

  const renderChairSVG = (fabricId, legId, animateStyle = {}) => {
    return <ChairSVG fabricId={fabricId} legId={legId} animateStyle={animateStyle} />;
  };

  const handleFabricSelect = async (fabId) => {
    setSelectedFabric(fabId);
    const isSilk = fabId === "FAB-03";
    setConfiguratorCrib5Blocked(isSilk);

    if (dbConnected && order.id) {
      try {
        const client = getSupabaseBrowserClient();
        await client
          .from("projects")
          .update({
            selected_fabric: fabId,
            is_crib5_blocked: isSilk,
            fabric_compatibility_test: isSilk ? "blocked" : "passed"
          })
          .eq("id", order.id);
      } catch (err) {
        console.error("Supabase fabric sync error:", err);
      }
    }
  };

  const handleLegSelect = async (legId) => {
    setSelectedLeg(legId);
    if (dbConnected && order.id) {
      try {
        const client = getSupabaseBrowserClient();
        await client.from("projects").update({ selected_leg: legId }).eq("id", order.id);
      } catch (err) {
        console.error("Supabase leg sync error:", err);
      }
    }
  };

  const handleStartCrib5Test = () => {
    setCrib5TestStatus("running");
    setCrib5Progress(0);
    const interval = setInterval(() => {
      setCrib5Progress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (selectedFabric === "FAB-03") {
            setCrib5TestStatus("failed");
            addLog(
              "System",
              "CRIB 5 燃燒檢測失敗：純絲綢緞阻燃塗層收縮率/變色率超差（CRIB 5 BLOCKED）",
              "CRIB 5 Flammability Test Failed: Pure Silk Satin fire-retardant coating shrinkage and discoloration rate out of tolerance (CRIB 5 BLOCKED)"
            );
          } else {
            setCrib5TestStatus("passed");
            addLog(
              "System",
              "CRIB 5 燃燒檢測合格：火焰暴露10秒內物理自熄（CRIB 5 PASSED）",
              "CRIB 5 Flammability Test Passed: Flame self-extinguished physically within 10 seconds of exposure (CRIB 5 PASSED)"
            );
          }
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleDocumentAudit = () => {
    setDocAudited(true);
    addLog(
      "System",
      "四大出口單證校驗成功：IPPC熏蒸證明、海關申報單、裝箱單序列號一致（100% MATCH）",
      "Four export compliance documents verified successfully: IPPC fumigation certificate, Customs declaration, Packing lists match perfectly (100% MATCH)"
    );
  };

  const handleCryptographicArchive = () => {
    setArchiveHashed(true);
    addLog(
      "System",
      "項目資料哈希打包完畢：SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51",
      "Project archive hashed and packaged: SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51"
    );
  };

  const handleIntakeFlowSubmit = (projectName, destination, quantity, fileType, textBrief, file) => {
    const selectedSetFurnitureItems = Array.isArray(pendingSetFurnitureSelection)
      ? pendingSetFurnitureSelection
      : pendingSetFurnitureSelection
        ? [{ ...pendingSetFurnitureSelection, quantity: Number(String(quantity || "").match(/\d+/)?.[0] || 10) }]
        : [];
    const quantityNumber = selectedSetFurnitureItems.length
      ? selectedSetFurnitureItems.reduce((total, selection) => total + Number(selection.quantity || 0), 0)
      : Number(String(quantity || "").match(/\d+/)?.[0] || 10);
    const setFurnitureBrief = selectedSetFurnitureItems.length
      ? {
          schema_version: "portal_intake_v2",
          source_mode: "set_furniture",
          file_name: file?.name || "",
          project: {
            name: projectName || "Set Furniture project",
            client_name: user?.company || user?.name || "Portal Intake Client",
            contact_name: user?.name || "",
            destination: destination || ""
          },
          items: selectedSetFurnitureItems.map(({ product, category, quantity: itemQuantity }) => ({
            id: product.code,
            item_type_en: product.name,
            item_type_cn: product.nameCn || product.name,
            quantity: Number(itemQuantity || 0),
            quantity_text: `${Number(itemQuantity || 0)} pcs`,
            dimensions_text: product.dimensions,
            material_en: product.material,
            material_cn: product.material,
            finish: product.finish,
            fire_standard: product.compliance,
            image_url: product.image || category.image,
            original_unit_price: Number(product.price || 0),
            unit_price: Number(product.price || 0),
            currency: product.currency || "USD",
            notes_en: product.description,
            usage_location: category.nameEn
          })),
          fire_standard: selectedSetFurnitureItems.map(({ product }) => product.compliance).join(" · "),
          questions: destination ? [] : ["Please confirm the delivery destination and site address."],
          summary_en: `${quantityNumber} pieces across ${selectedSetFurnitureItems.length} Set Furniture product${selectedSetFurnitureItems.length === 1 ? "" : "s"} selected from the Crafton catalogue.`,
          source_notes: textBrief
        }
      : null;

    setIntakeProjectName(projectName || "");
    setIntakeDestination(destination || "");
    setIntakeQuantity(quantity || "");
    setIntakeSelectedFile(file || null);
    setIntakeSelectedFileName(file?.name || "");
    setIntakeUploadedFileId(null);
    setIntakeUploadStatus("");
    setIntakeFileUploading(false);
    setClientPortalTab("Intake");
    setCurrentStageView("ClientPortal");
    setActiveIntakeModal(null);
    setTimeout(() => {
      handleIntakeSubmit(null, {
        projectName: projectName || "",
        destination: destination || "",
        quantity: quantity || "",
        fileType,
        textBrief,
        file,
        structuredBrief: setFurnitureBrief || undefined
      });
      if (selectedSetFurnitureItems.length) {
        setPendingSetFurnitureSelection(null);
        safeRemoveItem("crafton_set_furniture_project_cart");
      }
    }, 100);
  };

  const renderIntakeModal = () => {
    if (!activeIntakeModal) return null;

    const titleCn =
      activeIntakeModal === "pdf"
        ? "No. 01 — 上傳招標 PDF 規格書"
        : activeIntakeModal === "excel"
          ? "No. 02 — 導入 Excel 家具清單"
          : activeIntakeModal === "item"
            ? "獲取精選配套定制報價"
            : "No. 03 — 貼入文字需求描述";
    const titleEn =
      activeIntakeModal === "pdf"
        ? "No. 01 — Upload Tender PDF Specs"
        : activeIntakeModal === "excel"
          ? "No. 02 — Import Excel Furniture List"
          : activeIntakeModal === "item"
            ? "Request Curated Package Quote"
            : "No. 03 — Paste Text Requirements";

    const descCn =
      activeIntakeModal === "pdf"
        ? "请拖曳上传您的 PDF 招标文件或技术规格书。系统将整理几何参数并进行合规性预审。"
        : activeIntakeModal === "excel"
          ? "請上傳包含家具品名、尺寸、面料與數量的 Excel 電子表格。系統將自動解析為 B2B 門戶中的物料清單。"
          : activeIntakeModal === "item"
            ? "確認配套定制信息，一鍵為您的項目生成專屬報價單，並在控制台中實時跟蹤。"
            : "直接粘贴邮件对话记录或输入需求，系统将整理为可生产的技术条目。";
    const descEn =
      activeIntakeModal === "pdf"
        ? "Drag and drop your PDF spec sheet or tender documents. The intake service will extract dimensions, geometry parameters, and perform a compliance review."
        : activeIntakeModal === "excel"
          ? "Upload your spreadsheet containing item schedules, sizes, and swatches. The system will automatically convert it to a structured BOM list."
          : activeIntakeModal === "item"
            ? "Confirm the details of your package. The system will automatically generate a tailored commercial bid and load it to your portal."
            : "Paste email threads or type out your requirements. Our multi-agent system will parse text into ready-to-manufacture line items.";

    return (
      <div className="volumetric-modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
        <div
          className="volumetric-modal-card"
          style={{ maxWidth: "650px", width: "90%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        >
          {/* Header */}
          <div
            className="volumetric-modal-header"
            style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--glass-border)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  fontFamily: "var(--font-tech)",
                  fontSize: "1.2rem",
                  fontStyle: "italic",
                  color: "var(--accent-primary)",
                  flexShrink: 0
                }}
              >
                {activeIntakeModal === "pdf"
                  ? "No. 01"
                  : activeIntakeModal === "excel"
                    ? "No. 02"
                    : activeIntakeModal === "item"
                      ? "⭐"
                      : "No. 03"}
              </span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.2rem",
                    fontFamily: "var(--font-tech)",
                    color: "var(--text-primary)",
                    fontWeight: "500"
                  }}
                >
                  {lang === "Cn" ? titleCn : titleEn}
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "0.78rem",
                    color: "var(--text-secondary)",
                    lineHeight: "1.4"
                  }}
                >
                  {lang === "Cn" ? descCn : descEn}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveIntakeModal(null);
                setPendingSetFurnitureSelection(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(28,27,24,0.06)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              padding: "1.8rem 2rem",
              overflowY: "auto",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem"
            }}
          >
            {/* Project Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label
                style={{ fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}
              >
                {lang === "Cn" ? "項目名稱 / PROJECT NAME" : "PROJECT NAME"}
              </label>
              <input
                type="text"
                className="chat-input"
                value={modalProjectName}
                onChange={(e) => setModalProjectName(e.target.value)}
                placeholder={lang === "Cn" ? "請輸入項目名稱..." : "Enter project name..."}
                style={{
                  width: "100%",
                  background: "#FFFFFF",
                  padding: "0.7rem",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-primary)",
                  borderRadius: "2px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.9rem"
                }}
                required
              />
            </div>

            {/* Destination & Quantity Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    letterSpacing: "1px",
                    color: "var(--text-secondary)"
                  }}
                >
                  {lang === "Cn" ? "交付目的地 / DESTINATION" : "DELIVERY DESTINATION"}
                </label>
                <input
                  type="text"
                  className="chat-input"
                  value={modalDestination}
                  onChange={(e) => setModalDestination(e.target.value)}
                  placeholder={lang === "Cn" ? "例如：英國倫敦" : "e.g. London, UK"}
                  style={{
                    width: "100%",
                    background: "#FFFFFF",
                    padding: "0.7rem",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-primary)",
                    borderRadius: "2px",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.9rem"
                  }}
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    letterSpacing: "1px",
                    color: "var(--text-secondary)"
                  }}
                >
                  {lang === "Cn" ? "預估數量 / EST. QUANTITY" : "ESTIMATED QUANTITY"}
                </label>
                <input
                  type="text"
                  className="chat-input"
                  value={modalQuantity}
                  onChange={(e) => setModalQuantity(e.target.value)}
                  readOnly={activeIntakeModal === "item" && Array.isArray(pendingSetFurnitureSelection)}
                  placeholder="40"
                  style={{
                    width: "100%",
                    background: "#FFFFFF",
                    padding: "0.7rem",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-primary)",
                    borderRadius: "2px",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.9rem"
                  }}
                  required
                />
              </div>
            </div>

            {/* Interactive File Section or Textarea */}
            {activeIntakeModal === "item" ? (
              <div
                style={{
                  background: "#FAF7F2",
                  padding: "1.2rem",
                  border: "1px solid rgba(124, 114, 103, 0.15)",
                  borderRadius: "4px"
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--accent-primary)",
                    fontWeight: "600",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "0.4rem"
                  }}
                >
                  {lang === "Cn" ? "⚡ 精選設計配套已加載" : "⚡ CURATED DESIGN PACKAGE PRE-LOADED"}
                </span>
                <span style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: "bold" }}>
                  {modalProjectName}
                </span>
                {Array.isArray(pendingSetFurnitureSelection) && pendingSetFurnitureSelection.length > 0 && (
                  <div style={{ display: "grid", gap: "0.55rem", marginTop: "0.9rem" }}>
                    {pendingSetFurnitureSelection.map(({ product, quantity }) => (
                      <div
                        key={product.code}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: "1rem",
                          paddingTop: "0.55rem",
                          borderTop: "1px solid rgba(124, 114, 103, 0.14)",
                          color: "var(--text-secondary)",
                          fontSize: "0.76rem"
                        }}
                      >
                        <span>
                          {product.code} · {lang === "Cn" ? product.nameCn : product.name}
                        </span>
                        <strong>
                          {quantity} × {product.currency} {Number(product.price || 0).toLocaleString()}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeIntakeModal === "words" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    letterSpacing: "1px",
                    color: "var(--text-secondary)"
                  }}
                >
                  {lang === "Cn" ? "手寫文字需求描述 / WORDS BRIEF" : "TEXT REQUIREMENTS BRIEF"}
                </label>
                <textarea
                  className="chat-input"
                  value={modalTextBrief}
                  onChange={(e) => setModalTextBrief(e.target.value)}
                  placeholder={
                    lang === "Cn"
                      ? "在此處輸入或粘貼您的家具定製要求、材質防火指標、交期限制等..."
                      : "Paste or type your furniture specs, fabric options, Crib 5 requirements here..."
                  }
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    background: "#FFFFFF",
                    padding: "0.7rem",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-primary)",
                    borderRadius: "2px",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.85rem",
                    lineHeight: "1.6",
                    resize: "vertical"
                  }}
                  required
                />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    letterSpacing: "1px",
                    color: "var(--text-secondary)"
                  }}
                >
                  {activeIntakeModal === "pdf"
                    ? lang === "Cn"
                      ? "招標 PDF 規格書 / TENDER PDF"
                      : "TENDER PDF ATTACHMENT"
                    : lang === "Cn"
                      ? "Excel 家具清單表格 / EXCEL SHEET"
                      : "EXCEL SHEET ATTACHMENT"}
                </label>
                <div
                  style={{
                    border: "1px dashed var(--accent-primary)",
                    borderRadius: "2px",
                    padding: "2rem 1.5rem",
                    textAlign: "center",
                    background: "rgba(176, 91, 67, 0.02)",
                    position: "relative"
                  }}
                >
                  <svg
                    style={{
                      width: "32px",
                      height: "32px",
                      display: "block",
                      margin: "0 auto 0.6rem auto",
                      color: "var(--accent-primary)"
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                    />
                  </svg>
                  {modalFilePreloaded ? (
                    <div>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontFamily: "var(--font-tech)",
                          color: "var(--text-primary)",
                          display: "block",
                          fontWeight: "500"
                        }}
                      >
                        📎 {modalFilePreloadedName}
                      </span>
                      <span
                        style={{ fontSize: "0.7rem", color: "var(--accent-muted)", display: "block", marginTop: "4px" }}
                      >
                        {lang === "Cn" ? "⚡ 系統預加載文件已就緒！" : "⚡ System preloaded file is active!"}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>
                        {lang === "Cn"
                          ? "拖曳文件到此處，或點擊瀏覽本地"
                          : "Drag & drop files here, or click to browse"}
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer"
                    }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setModalSelectedFile(file);
                        setModalFilePreloadedName(file.name);
                        setModalFilePreloaded(true);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="volumetric-modal-footer"
            style={{
              padding: "1.2rem 2rem",
              background: "rgba(124, 114, 103, 0.02)",
              borderTop: "1px solid var(--glass-border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px"
            }}
          >
            <button
              className="btn-secondary"
              style={{ padding: "0.5rem 1.5rem", fontSize: "0.82rem" }}
              onClick={() => {
                setActiveIntakeModal(null);
                setPendingSetFurnitureSelection(null);
              }}
            >
              {lang === "Cn" ? "取消 / CANCEL" : "CANCEL"}
            </button>
            <button
              className="btn-premium"
              style={{ padding: "0.5rem 2rem", fontSize: "0.82rem" }}
              onClick={() => {
                const fileTypeLabel =
                  activeIntakeModal === "pdf"
                    ? "TENDER_PDF"
                    : activeIntakeModal === "excel"
                      ? "EXCEL_BOM"
                      : activeIntakeModal === "item"
                        ? "CURATED_PACKAGE"
                        : "TEXT_BRIEF";
                handleIntakeFlowSubmit(
                  modalProjectName,
                  modalDestination,
                  modalQuantity,
                  fileTypeLabel,
                  modalTextBrief,
                  modalSelectedFile
                );
              }}
            >
              {lang === "Cn" ? "开始整理规格" : "PROCESS SPECIFICATIONS →"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInteractivePlayground = () => {
    const stageId = currentStage.id;

    // 1. S01, S02, S03, S04: CAD Drafting and Approvals
    if (stageId === "S01" || stageId === "S02" || stageId === "S03" || stageId === "S04") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(124,114,103,0.03)" }}>
            <div className="panel-title">
              <svg
                style={{
                  width: "16px",
                  height: "16px",
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: "6px",
                  color: "var(--accent-primary)"
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 22L2 2v20h20z" />
                <path d="M18 18L6 6v12h12z" />
              </svg>
              {lang === "Cn" ? "中英雙語 CAD 技術藍圖規格書" : "Bilingual CAD Technical Specs"}
            </div>
            <span className="logo-badge" style={{ color: "var(--accent-primary)" }}>
              AUTO-DRAFTED
            </span>
          </div>
          <div className="panel-body" style={{ padding: "1rem" }}>
            <div className="blueprint-board">
              <span className="blueprint-title-tag">
                {stageId === "S01"
                  ? "S01: Intake Draft"
                  : stageId === "S02"
                    ? "S02: Attributes Query"
                    : stageId === "S03"
                      ? "S03: Spec Ready"
                      : "S04: Approved BOM"}
              </span>

              {/* Dimensions Layout */}
              <div
                style={{
                  position: "absolute",
                  top: "40px",
                  left: "46px",
                  right: "46px",
                  height: "1px",
                  background: "var(--accent-secondary)",
                  opacity: 0.5
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  top: "35px",
                  left: "46px",
                  width: "1px",
                  height: "10px",
                  background: "var(--accent-secondary)",
                  opacity: 0.5
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  top: "35px",
                  right: "46px",
                  width: "1px",
                  height: "10px",
                  background: "var(--accent-secondary)",
                  opacity: 0.5
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  top: "22px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "0.65rem",
                  color: "var(--text-secondary)",
                  background: "#FAF9F6",
                  padding: "0 4px",
                  fontFamily: "monospace"
                }}
              >
                W: 650mm ±5mm
              </div>

              <div
                style={{
                  position: "absolute",
                  top: "60px",
                  right: "25px",
                  bottom: "66px",
                  width: "1px",
                  background: "var(--accent-secondary)",
                  opacity: 0.5
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  top: "60px",
                  right: "20px",
                  height: "1px",
                  width: "10px",
                  background: "var(--accent-secondary)",
                  opacity: 0.5
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  bottom: "66px",
                  right: "20px",
                  height: "1px",
                  width: "10px",
                  background: "var(--accent-secondary)",
                  opacity: 0.5
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%) rotate(90deg)",
                  fontSize: "0.65rem",
                  color: "var(--text-secondary)",
                  background: "#FAF9F6",
                  padding: "0 4px",
                  fontFamily: "monospace"
                }}
              >
                H: 850mm
              </div>

              {renderChairSVG(selectedFabric, selectedLeg)}

              {/* Glowing Hotspots */}
              <div className="hotspot-marker" style={{ top: "110px", left: "100px" }}>
                <div className="hotspot-tooltip">
                  <strong>{lang === "Cn" ? "座包填充規格" : "Cushion Padding"}</strong>
                  <br />
                  {lang === "Cn"
                    ? "35kg/m³高回彈聚氨酯海綿，包裹防火無纺布，經受10萬次受壓疲勞測試。"
                    : "35kg/m³ high-resilience PU foam wrapped in fire barrier, passes 100k cycles durability."}
                </div>
              </div>

              <div className="hotspot-marker" style={{ top: "165px", left: "50px" }}>
                <div className="hotspot-tooltip">
                  <strong>{lang === "Cn" ? "椅腿工藝" : "Leg Structure"}</strong>
                  <br />
                  {lang === "Cn"
                    ? "2.5mm壁厚冷軋重碳鋼，表面 basalt 磨砂黑防指紋靜電噴塗。"
                    : "2.5mm heavy-gauge cold steel frame, matte Basalt Black fingerprint-proof electrostatic coating."}
                </div>
              </div>

              <div className="hotspot-marker" style={{ top: "70px", left: "135px" }}>
                <div className="hotspot-tooltip">
                  <strong>{lang === "Cn" ? "靠背傾角與公差" : "Back Angle"}</strong>
                  <br />
                  {lang === "Cn"
                    ? "105°人體工學黃金微傾角。框架結構製造公差嚴格控制在 ±2mm 內。"
                    : "105° ergonomic golden tilt. Frame structural welding tolerance is strictly under ±2mm."}
                </div>
              </div>

              {/* Approved Ink Signature (S04) */}
              {(signatureApproved || stageId !== "S04") && (
                <div className="signature-box">
                  <div className="signature-label">{lang === "Cn" ? "審批簽名 / Approved by" : "Review Sign-Off"}</div>
                  <span className={`signature-font ${signatureApproved || stageId !== "S04" ? "signed" : ""}`}>
                    Cho Chen
                  </span>
                </div>
              )}

              <span className="blueprint-scale-tag">SCALE 1:12 | UNIT: MM | TOLERANCE: ±2mm</span>
            </div>

            {stageId === "S04" && !signatureApproved && (
              <button
                className="btn-premium"
                style={{
                  width: "100%",
                  marginTop: "0.8rem",
                  justifyContent: "center",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                onClick={() => {
                  setSignatureApproved(true);
                  handleChoApproval();
                }}
              >
                <svg
                  style={{ width: "16px", height: "16px" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>{lang === "Cn" ? "我已確認規格無誤，签字放行" : "Review Specs & Sign-Off Block"}</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    // 2. S05: Crib 5 Test chamber
    if (stageId === "S05") {
      const selectedFabObj = mockData.fabrics.find((f) => f.id === selectedFabric);
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(166, 132, 128, 0.03)" }}>
            <div className="panel-title">
              <svg
                style={{
                  width: "16px",
                  height: "16px",
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: "6px",
                  color: "var(--accent-red)"
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.657 16.657c2.12-2.121 2.29-5.467.51-7.78L13 13l-4-4-2.28 4.28c-1.78 2.313-1.61 5.659.51 7.78a8 8 0 1010.417 0z" />
              </svg>
              {lang === "Cn" ? "英國 Crib 5 消防燃燒阻燃測試艙" : "UK Crib 5 Fire Ignition Testing Rig"}
            </div>
            <span className="logo-badge" style={{ color: "var(--accent-red)" }}>
              COMPLIANCE GATE
            </span>
          </div>
          <div className="panel-body" style={{ padding: "1rem" }}>
            <div className="crib5-rig">
              {renderChairSVG(
                selectedFabric,
                selectedLeg,
                crib5TestStatus === "running" ? { filter: "brightness(0.9) contrast(1.1)" } : {}
              )}

              {/* Flame Effect Overlay */}
              <div className={`flame-effect-layer ${crib5TestStatus === "running" ? "active" : ""}`}>
                <div className="flame-particle"></div>
                <div className="flame-inner"></div>
              </div>

              {/* Distressed Wax Stamp */}
              {crib5TestStatus === "passed" && (
                <div className="wax-stamp-overlay stamped stamp-pass">Crib 5 Passed</div>
              )}
              {crib5TestStatus === "failed" && (
                <div className="wax-stamp-overlay stamped stamp-fail">Crib 5 Blocked</div>
              )}

              {crib5TestStatus === "idle" && (
                <div
                  style={{
                    position: "absolute",
                    background: "rgba(28,27,24,0.7)",
                    color: "white",
                    padding: "0.5rem 1rem",
                    fontSize: "0.75rem",
                    borderRadius: "2px",
                    textAlign: "center"
                  }}
                >
                  {lang === "Cn" ? "待測面料: " : "Target Swatch: "}
                  <strong>{selectedFabObj.name}</strong>
                  <br />
                  <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
                    {lang === "Cn"
                      ? "點擊下方按鈕啟動 10 秒模擬火焰燃燒測試"
                      : "Click below to initiate 10s flame test"}
                  </span>
                </div>
              )}
            </div>

            <div className="fire-gauge-card">
              <div className="fire-gauge-row">
                <span>{lang === "Cn" ? "燃燒測試進度" : "Flame Test Exposure"}</span>
                <span style={{ fontFamily: "monospace" }}>{crib5Progress}%</span>
              </div>
              <div className="fire-progress-bar">
                <div
                  className="fire-progress-fill"
                  style={{
                    width: `${crib5Progress}%`,
                    background: crib5TestStatus === "failed" ? "var(--accent-red)" : "var(--accent-green)"
                  }}
                ></div>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.8rem" }}>
                <button
                  className="btn-premium"
                  style={{ flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}
                  onClick={handleStartCrib5Test}
                  disabled={crib5TestStatus === "running"}
                >
                  <svg
                    style={{ width: "16px", height: "16px" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M20 4a2 2 0 00-2.83 0L10 11.17l-1.41-1.41a1 1 0 00-1.42 0L3.5 13.5a1 1 0 000 1.42l4.24 4.24a1 1 0 001.42 0L12.92 15l1.41 1.41a1 1 0 001.42-1.42l7.17-7.17A2 2 0 0020 4z" />
                  </svg>
                  <span>{lang === "Cn" ? "執行物理燃燒校驗" : "Trigger Crib 5 Burn"}</span>
                </button>
                {crib5TestStatus === "failed" && (
                  <button
                    className="btn-secondary"
                    style={{
                      borderColor: "var(--accent-green)",
                      color: "var(--accent-green)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    onClick={() => {
                      setSelectedFabric("FAB-02"); // auto replace with safe Linen
                      setCrib5TestStatus("idle");
                      setCrib5Progress(0);
                      addLog(
                        "Cho",
                        "檢測到絲綢硬性不合規，一鍵替換面料為：L-4410 (海軍藍亞麻)",
                        "Detected critical non-compliance on Silk. Swapped fabric to: L-4410 (Navy Classic Linen) with one click."
                      );
                    }}
                  >
                    <svg
                      style={{ width: "14px", height: "14px" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                    </svg>
                    <span>{lang === "Cn" ? "一鍵降級替換" : "Bypass with Linen"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. S06, S07: RFQ Dispatched and Multi-Factory Comparisons
    if (stageId === "S06" || stageId === "S07") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(255,159,67,0.03)" }}>
            <div className="panel-title">
              <svg
                style={{
                  width: "16px",
                  height: "16px",
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: "6px",
                  color: "var(--accent-orange)"
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {lang === "Cn" ? "自動化 RFQ 郵件詢價發送中心" : "Automated RFQ Mailer Daemon"}
            </div>
          </div>
          <div className="panel-body" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div
                style={{
                  padding: "1rem",
                  background: "#F4F2EE",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "2px",
                  position: "relative"
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold" }}
                >
                  <span>{lang === "Cn" ? "PDF 詢價規格書已就緒" : "Specs Package Compiled"}</span>
                  <span style={{ color: "var(--accent-primary)", fontSize: "0.7rem" }}>SIZE: 2.4 MB</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {lang === "Cn"
                    ? "附件：CRAFT-202605-01-RFQ_Specification.pdf (帶雙語規格、包裝容積要求)"
                    : "Attachment: CRAFT-202605-01-RFQ_Specification.pdf (Includes bilingual CAD & volume limits)"}
                </div>

                {rfqDispatched && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(255,255,255,0.92)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent-green)",
                      fontWeight: "bold",
                      fontSize: "0.8rem"
                    }}
                  >
                    ✓{" "}
                    {lang === "Cn"
                      ? "郵件已全數抄送：佛山金陽、東莞皇家橡樹、順德經典舒適"
                      : "RFQs Dispatched to 3 Partner Mills via SMTP"}
                  </div>
                )}
              </div>

              {!rfqDispatched ? (
                <button
                  className="btn-premium"
                  style={{ justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}
                  onClick={() => {
                    setRfqDispatched(true);
                    addLog(
                      "Crafton Quotation Service",
                      "生成PDF規格書，全自動調用 SMTP 郵件群發至 3 家意向工廠。",
                      "Generated PDF specification sheet, automatically calling SMTP to dispatch RFQs to 3 target factories."
                    );
                  }}
                >
                  <svg
                    style={{ width: "16px", height: "16px" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                  </svg>
                  <span>{lang === "Cn" ? "自動群發詢價郵件" : "Compile & Dispatch RFQs"}</span>
                </button>
              ) : (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    borderTop: "1px dashed var(--glass-border)",
                    paddingTop: "0.8rem"
                  }}
                >
                  <strong style={{ color: "var(--text-primary)" }}>
                    {lang === "Cn" ? "工廠反饋監聽器狀態：" : "Factory Mail Feed Daemon:"}
                  </strong>
                  <br />
                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      alignItems: "center",
                      marginTop: "4px",
                      color: "var(--accent-green)"
                    }}
                  >
                    <span className="stage-badge-dot dot-completed"></span>
                    {lang === "Cn"
                      ? "佛山金陽家具廠 (已回填報價：W: $195)"
                      : "Foshan Gold-Sun (Returned Quote: W: $195)"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      alignItems: "center",
                      marginTop: "4px",
                      color: "var(--accent-green)"
                    }}
                  >
                    <span className="stage-badge-dot dot-completed"></span>
                    {lang === "Cn"
                      ? "東莞皇家橡樹家具 (已回填報價：W: $185)"
                      : "Dongguan Royal Oak (Returned Quote: W: $185)"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      alignItems: "center",
                      marginTop: "4px",
                      color: "var(--accent-green)"
                    }}
                  >
                    <span className="stage-badge-dot dot-completed"></span>
                    {lang === "Cn"
                      ? "順德經典舒適家居 (已回填報價：W: $230)"
                      : "Shunde Classic Comfort (Returned Quote: W: $230)"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 4. S08: Cho Selection Supplier layout
    if (stageId === "S08") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(255,159,67,0.05)" }}>
            <div
              className="panel-title"
              style={{ color: "var(--accent-orange)", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg
                style={{ width: "16px", height: "16px", flexShrink: 0 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="5" y1="5" x2="19" y2="5" />
                <path d="M12 22a4 4 0 008-4H4a4 4 0 008 0z" />
                <path d="M19 5l-3 9H8l-3-9" />
              </svg>
              <span>{lang === "Cn" ? "三家合作代工厂报价分析" : "Supplier Bid Matrix & Comparison"}</span>
            </div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {mockData.supplierBids.map((bid, bidx) => (
              <div
                key={bidx}
                style={{
                  padding: "1rem",
                  borderRadius: "2px",
                  border:
                    selectedSupplier?.name === bid.name
                      ? "1px solid var(--text-primary)"
                      : "1px solid var(--glass-border)",
                  background: selectedSupplier?.name === bid.name ? "#ffffff" : "var(--bg-primary)",
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
                onClick={() => handleSelectSupplier(bid)}
                className="glass-card"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    color: "var(--text-primary)"
                  }}
                >
                  <span>{bid.name}</span>
                  <span style={{ color: "var(--accent-primary)" }}>${bid.pricePerChair}/chair</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    marginTop: "0.4rem"
                  }}
                >
                  <span>{lang === "Cn" ? `工期: ${bid.deliveryDays} 天` : `Lead Time: ${bid.deliveryDays} Days`}</span>
                  <span>{lang === "Cn" ? `合格率: ${bid.qualityScore}` : `QC Score: ${bid.qualityScore}`}</span>
                  <span>{lang === "Cn" ? `信譽: ${bid.reliability}` : `Reliability: ${bid.reliability}`}</span>
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "0.5rem",
                    borderTop: "1px dashed var(--glass-border)",
                    paddingTop: "0.4rem"
                  }}
                >
                  评估建议: {bid.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 5. S09, S10: Factory QR Link & WhatsApp Follow up
    if (stageId === "S09" || stageId === "S10") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(124,114,103,0.03)" }}>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg
                style={{ width: "16px", height: "16px", flexShrink: 0, color: "var(--accent-primary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 22V4a2 2 0 00-2-2H4a2 2 0 00-2 2v18M20 22V8a2 2 0 00-2-2h-4" />
                <path d="M6 12h4M6 16h4M17 12h2" />
              </svg>
              <span>{lang === "Cn" ? "車間現場物料掃碼與生產實時跟進" : "Factory QR Flow & Realtime Progress"}</span>
            </div>
          </div>
          <div className="panel-body" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--glass-border)",
                  padding: "0.4rem",
                  borderRadius: "2px"
                }}
              >
                <svg viewBox="0 0 100 100" width="80" height="80">
                  <rect x="0" y="0" width="100" height="100" fill="#FAF9F6" />
                  <rect x="10" y="10" width="25" height="25" fill="#1C1B18" />
                  <rect x="15" y="15" width="15" height="15" fill="#FAF9F6" />
                  <rect x="18" y="18" width="9" height="9" fill="#1C1B18" />

                  <rect x="65" y="10" width="25" height="25" fill="#1C1B18" />
                  <rect x="70" y="15" width="15" height="15" fill="#FAF9F6" />
                  <rect x="73" y="18" width="9" height="9" fill="#1C1B18" />

                  <rect x="10" y="65" width="25" height="25" fill="#1C1B18" />
                  <rect x="15" y="70" width="15" height="15" fill="#FAF9F6" />
                  <rect x="18" y="73" width="9" height="9" fill="#1C1B18" />

                  <rect x="45" y="45" width="10" height="10" fill="#1C1B18" />
                  <rect x="55" y="65" width="15" height="10" fill="#1C1B18" />
                  <rect x="75" y="75" width="15" height="15" fill="#1C1B18" />
                </svg>
              </div>
              <div style={{ flex: 1, fontSize: "0.75rem", lineHeight: "1.4" }}>
                <strong style={{ color: "var(--text-primary)" }}>QR: CRAFT-2026-01-ITEM01</strong>
                <br />
                <span style={{ color: "var(--text-secondary)" }}>
                  {lang === "Cn"
                    ? "工廠工人用平板掃描此碼，直接調取 Supabase 對應 3D 結構工程圖，杜絕車間看錯圖紙做錯貨。"
                    : "Workers scan this tag to fetch design drawings dynamically from Supabase. Minimizes layout errors."}
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "1rem",
                padding: "0.8rem",
                background: "#F4F2EE",
                border: "1px solid var(--glass-border)",
                borderRadius: "2px",
                fontSize: "0.75rem"
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  color: "var(--accent-orange)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg
                  style={{ width: "14px", height: "14px", flexShrink: 0 }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
                </svg>
                <span>{lang === "Cn" ? "交期剩餘 15 天 - 黃色風險警告" : "Delivery Warning: 15 Days Remaining"}</span>
              </div>
              <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                {lang === "Cn"
                  ? "进度监控发现工厂未按时上传本周进度，系统已启动 WhatsApp 催询。"
                  : "Progress monitoring detected a delayed update. A WhatsApp follow-up has been triggered."}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 6. S11: AI CV Inspection
    if (stageId === "S11") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(125, 143, 123, 0.05)" }}>
            <div
              className="panel-title"
              style={{ color: "var(--accent-green)", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg
                style={{ width: "16px", height: "16px", flexShrink: 0 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{lang === "Cn" ? "图纸与实物重合质检" : "Photo-to-CAD Overlap Inspection"}</span>
            </div>
            <span className="logo-badge" style={{ color: "var(--accent-green)" }}>
              PASS 98.2%
            </span>
          </div>
          <div className="panel-body" style={{ padding: "1rem" }}>
            <div className="cv-container">
              <div
                className="cv-photo"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80')"
                }}
              ></div>
              <div className="cv-overlay-text">LIVE PHOTO: FOSHAN GOLD-SUN ST-01</div>
              <div className="cv-grid-line"></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginTop: "0.8rem" }}>
              <span>
                {lang === "Cn" ? "幾何輪廓重合度 (CAD Overlay): " : "Feature Match: "}
                <strong style={{ color: "var(--accent-green)" }}>98.2%</strong>
              </span>
              <span>
                {lang === "Cn" ? "椅腿顏色核檢: " : "Color Swatch Match: "}
                <strong style={{ color: "var(--accent-green)" }}>Matte Black OK</strong>
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 7. S12: Volumetric Container packing (3D Cargo)
    if (stageId === "S12") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(124,114,103,0.03)" }}>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg
                style={{ width: "16px", height: "16px", flexShrink: 0, color: "var(--accent-primary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
              </svg>
              <span>{lang === "Cn" ? "集裝箱體積排櫃優化算法" : "3D Volumetric Container Packing Optimizer"}</span>
            </div>
          </div>
          <div className="panel-body" style={{ padding: "1rem" }}>
            <div className="cube-container">
              <div className="shipping-box-stacked" style={{ width: "130px", height: "110px" }}>
                Armchairs (24 CBM)
              </div>
              <div className="shipping-box-stacked" style={{ width: "80px", height: "110px", marginLeft: "5px" }}>
                Club Chairs (16 CBM)
              </div>
              <div
                className="shipping-box-stacked"
                style={{
                  width: "40px",
                  height: "70px",
                  marginLeft: "5px",
                  alignSelf: "flex-end",
                  background: "rgba(168,143,128,0.2)",
                  borderColor: "var(--accent-orange)"
                }}
              >
                Tables (6 CBM)
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginTop: "0.8rem" }}>
              <span>
                {lang === "Cn" ? "裝載箱型: " : "Container Type: "}
                <strong style={{ color: "var(--accent-cyan)" }}>40GP Container</strong>
              </span>
              <span>
                {lang === "Cn" ? "容積利用率: " : "Space Efficiency: "}
                <strong style={{ color: "var(--accent-cyan)" }}>68.6%</strong>
              </span>
            </div>
            <button
              className="btn-premium"
              style={{
                width: "100%",
                marginTop: "1rem",
                justifyContent: "center",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onClick={() => setShowVolumetricSimulation(true)}
            >
              <svg
                style={{ width: "16px", height: "16px" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
              <span>{lang === "Cn" ? "啟動 3D 排櫃三維立體仿真" : "Launch Interactive 3D Packing Simulation"}</span>
            </button>
          </div>
        </div>
      );
    }

    // 8. S13: Customs Document stamp board
    if (stageId === "S13") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(124,114,103,0.03)" }}>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg
                style={{ width: "16px", height: "16px", flexShrink: 0, color: "var(--accent-primary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>
              <span>{lang === "Cn" ? "出港四大合規單證自動核驗" : "Customs Credentials Ledger Verification"}</span>
            </div>
            <span className="logo-badge" style={{ color: "var(--accent-orange)" }}>
              COMPLIANCE
            </span>
          </div>
          <div className="panel-body" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", position: "relative" }}>
              <div
                style={{
                  padding: "0.6rem 0.8rem",
                  background: "#F4F2EE",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "2px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ fontSize: "0.75rem" }}>
                  1. {lang === "Cn" ? "實木大茶几 IPPC 熏蒸證明" : "IPPC Solid Wood Fumigation"}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    color: docAudited ? "var(--accent-green)" : "var(--accent-orange)"
                  }}
                >
                  {docAudited ? "✓ VERIFIED" : "PENDING"}
                </span>
              </div>
              <div
                style={{
                  padding: "0.6rem 0.8rem",
                  background: "#F4F2EE",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "2px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ fontSize: "0.75rem" }}>
                  2. {lang === "Cn" ? "提單、裝箱單序列號一致性" : "Bill of Lading Consistency Check"}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    color: docAudited ? "var(--accent-green)" : "var(--accent-orange)"
                  }}
                >
                  {docAudited ? "✓ VERIFIED" : "PENDING"}
                </span>
              </div>
              <div
                style={{
                  padding: "0.6rem 0.8rem",
                  background: "#F4F2EE",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "2px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ fontSize: "0.75rem" }}>
                  3. {lang === "Cn" ? "海關出境報關登記核銷" : "Customs Declaration Matching"}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    color: docAudited ? "var(--accent-green)" : "var(--accent-orange)"
                  }}
                >
                  {docAudited ? "✓ VERIFIED" : "PENDING"}
                </span>
              </div>

              {docAudited && (
                <div
                  className="wax-stamp-overlay stamped stamp-pass"
                  style={{ top: "30px", left: "100px", zIndex: 100 }}
                >
                  Docs Passed
                </div>
              )}

              {!docAudited && (
                <button
                  className="btn-premium"
                  style={{
                    width: "100%",
                    marginTop: "0.4rem",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  onClick={handleDocumentAudit}
                >
                  <svg
                    style={{ width: "16px", height: "16px" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 11l2 2 4-4" />
                  </svg>
                  <span>{lang === "Cn" ? "執行四大單證自動審計" : "Audit Export Documents"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 9. S14: Maritime Vessel Map
    if (stageId === "S14") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(124,114,103,0.03)" }}>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg
                style={{ width: "16px", height: "16px", flexShrink: 0, color: "var(--accent-primary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                <path d="M2 12h20" />
              </svg>
              <span>{lang === "Cn" ? "貨船在途軌跡 (馬士基實時 API)" : "Maersk Maritime API Tracking"}</span>
            </div>
          </div>
          <div className="panel-body" style={{ padding: "0.8rem" }}>
            <div className="maritime-map">
              <svg width="100%" height="100%" viewBox="0 0 400 250">
                <path d="M10,80 L80,60 L120,90 L90,140 L40,160 Z" fill="#D3CECA" opacity="0.4" />
                <path d="M160,50 L200,40 L280,30 L260,80 L290,120 L230,160 Z" fill="#D3CECA" opacity="0.4" />
                <path d="M110,210 L160,220 L150,240 Z" fill="#D3CECA" opacity="0.4" />

                <path
                  d="M260,110 C210,130 180,180 150,160 C130,140 105,100 60,60"
                  fill="none"
                  className="ocean-vector-path"
                />

                <text x="265" y="114" fontSize="7" fill="var(--text-primary)" fontWeight="bold">
                  Nansha Port
                </text>
                <circle cx="260" cy="110" r="3" fill="var(--accent-orange)" />

                <text x="45" y="55" fontSize="7" fill="var(--text-primary)" fontWeight="bold">
                  Southampton
                </text>
                <circle cx="60" cy="60" r="3" fill="var(--accent-green)" />

                <g transform="translate(162, 160)">
                  <circle cx="0" cy="0" r="4" fill="var(--accent-primary)" />
                  <circle cx="0" cy="0" r="8" fill="none" stroke="var(--accent-primary)" strokeWidth="1">
                    <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                </g>
              </svg>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                marginTop: "0.5rem"
              }}
            >
              <span>{lang === "Cn" ? "当前航行位置: 蘇伊士運河" : "Position: Suez Canal Transit"}</span>
              <span>
                ETA: <strong style={{ color: "var(--text-primary)" }}>2026-06-08</strong>
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 10. S15: Split delivery Accounting ledger
    if (stageId === "S15") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(166,132,128,0.03)" }}>
            <div
              className="panel-title"
              style={{ color: "var(--accent-red)", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg
                style={{ width: "16px", height: "16px", flexShrink: 0 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                <line x1="12" y1="11" x2="12" y2="13" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{lang === "Cn" ? "財務自動對賬與分批到貨核銷" : "Strike-through Accounting Audit"}</span>
            </div>
          </div>
          <div className="panel-body" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                {lang === "Cn"
                  ? "客戶硬裝現場臨時變更，取消 2 把扶手椅及 1 張大茶几。會計系統將對取消項目進行劃線銷賬，實時減免退款並重算尾款。"
                  : "The site reported layout modifications. 2 Armchairs and 1 Table are canceled. recasting accounts under the strike-through policy."}
              </div>

              {!splitDeliveryActive ? (
                <button
                  className="btn-premium"
                  style={{
                    background: "var(--accent-red)",
                    color: "white",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  onClick={triggerSplitDelivery}
                >
                  <svg
                    style={{ width: "16px", height: "16px" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>{lang === "Cn" ? "執行分批到貨劃線銷賬" : "Execute Split strike recalculation"}</span>
                </button>
              ) : (
                <div
                  style={{
                    padding: "0.8rem",
                    background: "rgba(125, 143, 123, 0.08)",
                    border: "1px solid var(--accent-green)",
                    borderRadius: "2px",
                    fontSize: "0.75rem",
                    color: "var(--accent-green)",
                    fontWeight: "600"
                  }}
                >
                  ✓{" "}
                  {lang === "Cn"
                    ? "劃線重算成功！合同總額減少 $870，尾款已自動核銷修正。"
                    : "Recalculation Applied: Invoice reduced by $870. Balanced updated."}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 11. S16, S17: Handover & Archive Hash
    if (stageId === "S16" || stageId === "S17") {
      return (
        <div className="glass-card animate-fade-in" style={{ marginBottom: "1rem" }}>
          <div className="panel-header" style={{ background: "rgba(124,114,103,0.03)" }}>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg
                style={{ width: "16px", height: "16px", flexShrink: 0, color: "var(--accent-primary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>{lang === "Cn" ? "安全歸檔與密碼學審計" : "Secure Handover & Archive Lock"}</span>
            </div>
          </div>
          <div className="panel-body" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div
                style={{
                  padding: "0.8rem",
                  background: "#F4F2EE",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "2px",
                  fontSize: "0.72rem"
                }}
              >
                <strong style={{ color: "var(--text-primary)" }}>
                  {lang === "Cn" ? "項目證書文件包：" : "Project Dossier Compile:"}
                </strong>
                <br />
                <span style={{ color: "var(--text-secondary)" }}>
                  {lang === "Cn"
                    ? "包含中英双语规格书、变更审计日志、视觉质检合格证、燃烧及熏蒸单证、现场验收签认。"
                    : "Includes CAD specs, change logs, visual QC reports, IPPC certificates, and signed client receipts."}
                </span>
              </div>

              {archiveHashed ? (
                <div
                  style={{
                    padding: "0.8rem",
                    background: "rgba(125,143,123,0.08)",
                    border: "1px solid var(--accent-green)",
                    borderRadius: "2px"
                  }}
                >
                  <div style={{ fontSize: "0.72rem", fontWeight: "bold", color: "var(--accent-green)" }}>
                    ✓ {lang === "Cn" ? "項目已完整密封存檔" : "Dossier Encrypted & Archived"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      fontFamily: "monospace",
                      color: "var(--text-secondary)",
                      marginTop: "4px",
                      wordBreak: "break-all"
                    }}
                  >
                    SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51
                  </div>
                </div>
              ) : (
                <button
                  className="btn-premium"
                  style={{ justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}
                  onClick={handleCryptographicArchive}
                  disabled={stageId !== "S17"}
                >
                  <svg
                    style={{ width: "16px", height: "16px" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span>{lang === "Cn" ? "密封存檔並生成加密哈希" : "Archive & Lock Ledger dossier"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Supabase connection configuration states
  const [dbUrl, setDbUrl] = useState(savedUrl);
  const [dbKey, setDbKey] = useState(savedKey);
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [dbConnected, setDbConnected] = useState(!!supabaseClient);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  const stages = mockData.stages;
  const currentStage = stages[currentStageIndex];
  const adminProgressFlows = [
    {
      id: "intake",
      stageIndexes: [0, 1, 2, 3, 4],
      titleCn: "接收客户订单",
      titleEn: "Client Order Intake",
      descCn: "客户需求接入、规格补齐、BOM、Cho 图纸/技术审核与 Crib 5 合规闸口。",
      descEn: "Client requirements, spec completion, BOM, Cho drawing review, and Crib 5 compliance gate."
    },
    {
      id: "sourcing",
      stageIndexes: [5, 6, 7],
      titleCn: "供应商报价与最优报价",
      titleEn: "Supplier RFQ & Best Quote",
      descCn: "向供应商发出 RFQ，收集报价，由 Cho 审核并选定最优供应商。",
      descEn: "Dispatch RFQs, compare supplier bids, and let Cho select the best offer."
    },
    {
      id: "production",
      stageIndexes: [8, 9, 10],
      titleCn: "生产进度",
      titleEn: "Production Progress",
      descCn: "工厂接单、二维码图纸联动、延期风险跟进与视觉质检。",
      descEn: "Factory kickoff, QR drawing linkage, delay follow-up, and visual inspection."
    },
    {
      id: "shipping",
      stageIndexes: [11, 12, 13, 14, 15, 16],
      titleCn: "出货与交付",
      titleEn: "Shipping & Handover",
      descCn: "装柜、出货合规、物流追踪、分批交付、验收与归档。",
      descEn: "Container loading, export checks, shipping, split delivery, handover, and archive."
    }
  ];
  const activeAdminFlowConfig = adminProgressFlows.find((flow) => flow.id === activeAdminFlow) || adminProgressFlows[0];
  const adminStageCopy = {
    S01: { cn: "订单需求接入", en: "Order Intake" },
    S02: { cn: "双语补齐规格", en: "Spec Completion" },
    S03: { cn: "生成技术 BOM", en: "Technical BOM" },
    S04: { cn: "Cho 技术审核", en: "Cho Technical Review" },
    S05: { cn: "Crib 5 消防拦截", en: "Crib 5 Compliance" },
    S06: { cn: "供应商智能询价", en: "Supplier RFQ Dispatch" },
    S07: { cn: "多厂报价比较", en: "Bid Comparison" },
    S08: { cn: "Cho 比价决策", en: "Cho Supplier Decision" },
    S09: { cn: "生产状态联动", en: "Production Kickoff" },
    S10: { cn: "延期风险跟进", en: "Delay Risk Follow-up" },
    S11: { cn: "视觉实物对比", en: "Visual Inspection" },
    S12: { cn: "集装箱装柜规划", en: "Container Loading Plan" },
    S13: { cn: "出货合规检查", en: "Export Compliance" },
    S14: { cn: "物流货运追踪", en: "Shipping Tracker" },
    S15: { cn: "分批到货核销", en: "Split Delivery Audit" },
    S16: { cn: "客户交付验收", en: "Client Handover" },
    S17: { cn: "项目审计归档", en: "Project Archive" }
  };

  // Auto scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentStageIndex, chatMessages]);

  useEffect(() => {
    const file = submittedTrackerProject?.file;
    if (!file || !file.type?.startsWith("image/")) {
      setTrackerPreviewUrl(submittedTrackerProject?.previewUrl || "");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setTrackerPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [submittedTrackerProject]);

  useEffect(() => {
    if (intakeReviewJobs.length === 0) {
      setExpandedIntakeClientKey("");
      setReviewDraft(null);
      setAdminIntakePreview({ jobId: "", url: "", status: "idle", message: "" });
      return;
    }

    const selectedJob = intakeReviewJobs.find((job) => job.id === selectedReviewJobId) || intakeReviewJobs[0];
    if (selectedJob.id !== selectedReviewJobId) {
      setSelectedReviewJobId(selectedJob.id);
    }
    syncReviewDraftFromJob(selectedJob);
  }, [intakeReviewJobs, selectedReviewJobId]);

  useEffect(() => {
    if (selectedReviewJobId) safeSetItem("crafton_admin_selected_job_id", selectedReviewJobId);
  }, [selectedReviewJobId]);

  useEffect(() => {
    safeSetItem("crafton_admin_active_flow", activeAdminFlow);
  }, [activeAdminFlow]);

  useEffect(() => {
    const selectedJob = intakeReviewJobs.find((job) => job.id === selectedReviewJobId) || intakeReviewJobs[0];
    if (!selectedJob) return;
    const clientKey = normalizeGroupingText(normalizeReviewJob(selectedJob).clientName) || "unassigned-client";
    setExpandedIntakeClientKey((currentKey) => (currentKey === clientKey ? currentKey : clientKey));
  }, [intakeReviewJobs, selectedReviewJobId]);

  useEffect(() => {
    let cancelled = false;
    const selectedJob = intakeReviewJobs.find((job) => job.id === selectedReviewJobId) || intakeReviewJobs[0];
    const sourceFile = selectedJob ? getIntakeFileFromJob(selectedJob) : null;

    const setPreview = (preview) => {
      if (!cancelled) setAdminIntakePreview(preview);
    };

    if (!selectedJob || !sourceFile) {
      setPreview({ jobId: selectedJob?.id || "", url: "", status: "idle", message: "" });
      return () => {
        cancelled = true;
      };
    }

    if (!sourceFile.mime_type?.startsWith("image/")) {
      setPreview({
        jobId: selectedJob.id,
        url: "",
        status: "unsupported",
        message: "Uploaded source file is not an image preview."
      });
      return () => {
        cancelled = true;
      };
    }

    if (!sourceFile.storage_bucket || !sourceFile.storage_path || !dbConnected) {
      setPreview({
        jobId: selectedJob.id,
        url: "",
        status: "missing",
        message: "Image metadata exists, but storage path is missing."
      });
      return () => {
        cancelled = true;
      };
    }

    setPreview({ jobId: selectedJob.id, url: "", status: "loading", message: "Loading thumbnail..." });

    const loadSignedPreview = async () => {
      try {
        const client = getSupabaseBrowserClient();
        const { data, error } = await client.storage
          .from(sourceFile.storage_bucket)
          .createSignedUrl(sourceFile.storage_path, 60 * 60);
        if (error) throw error;
        setPreview({
          jobId: selectedJob.id,
          url: data?.signedUrl || "",
          status: data?.signedUrl ? "ready" : "missing",
          message: data?.signedUrl ? "" : "Supabase did not return an image preview URL."
        });
      } catch (err) {
        console.warn("Admin intake thumbnail could not be loaded:", err.message || err);
        setPreview({
          jobId: selectedJob.id,
          url: "",
          status: "error",
          message: err.message || "Thumbnail could not be loaded from Supabase Storage."
        });
      }
    };

    loadSignedPreview();

    return () => {
      cancelled = true;
    };
  }, [dbConnected, intakeReviewJobs, selectedReviewJobId]);

  useEffect(() => {
    if (currentView === "Backoffice" && reviewDraft) {
      setOrder(buildOrderFromReviewDraft(reviewDraft));
    }
  }, [currentView, reviewDraft, lang]);

  // Fetch real-time data from Supabase if connected
  const fetchSupabaseData = async (shouldThrow = false) => {
    if (!window.supabase || !getSupabaseUrl() || !getSupabaseKey()) {
      setDbConnected(false);
      return;
    }

    setDbLoading(true);
    setDbError("");

    try {
      const url = getSupabaseUrl();
      const key = getSupabaseKey();
      const client = getSupabaseBrowserClient(url, key);
      const authResult = await client.auth.getUser().catch(() => ({ data: { user: null } }));
      const supabaseUser = authResult?.data?.user || null;

      if (!supabaseUser) {
        setDbConnected(true);
        return;
      }

      const resetPortalDraftState = () => {
        setSubmittedTrackerProject(null);
        setLatestIntakeJob(null);
        setOrder((prev) => ({
          ...prev,
          id: null,
          orderId: "",
          clientName: user?.name || "",
          projectLocation: "",
          currentStageId: "S01",
          quoteStatus: null,
          items: [],
          payments: []
        }));
        setLogs([]);
        setCurrentStageIndex(0);
      };

      // 1. Fetch live Project named 'CRAFT-202605-01'
      const { data: projectsData, error: projectErr } = await client
        .from("projects")
        .select("*")
        .eq("user_id", supabaseUser.id)
        .eq("name", "CRAFT-202605-01")
        .limit(1);

      if (projectErr) throw projectErr;

      let dbProject = null;
      let needToSeed = false;

      if (!projectsData || projectsData.length === 0) {
        resetPortalDraftState();
        setDbConnected(true);
        return;
      } else {
        dbProject = projectsData[0];

        const isSeededDemoProject =
          dbProject.name === "CRAFT-202605-01" &&
          dbProject.client_name === "Client Design Studio (UK)" &&
          dbProject.client_contact === "St Albans, UK";

        if (isSeededDemoProject) {
          resetPortalDraftState();
          setDbConnected(true);
          return;
        }

        // Robustness integrity check: Ensure all child tables are actually populated
        const { data: specsCheck, error: specsErr } = await client
          .from("specifications")
          .select("id")
          .eq("project_id", dbProject.id)
          .limit(1);

        const { data: paymentsCheck, error: paymentsErr } = await client
          .from("payments")
          .select("id")
          .eq("project_id", dbProject.id)
          .limit(1);

        if (
          specsErr ||
          paymentsErr ||
          !specsCheck ||
          specsCheck.length === 0 ||
          !paymentsCheck ||
          paymentsCheck.length === 0
        ) {
          console.log(
            "Project CRAFT-202605-01 exists, but specifications or payments are empty. Skipping demo auto-seed for authenticated client."
          );
          resetPortalDraftState();
          setDbConnected(true);
          return;
        }
      }

      if (needToSeed) {
        console.log("Running client-side auto-seeding...");

        // 1. Insert default project
        const { data: newProjData, error: seedProjErr } = await client
          .from("projects")
          .insert({
            user_id: supabaseUser.id,
            name: "CRAFT-202605-01",
            client_name: "Client Design Studio (UK)",
            client_contact: "St Albans, UK",
            current_stage: 1,
            selected_fabric: "FAB-02",
            selected_leg: "matte-black",
            fabric_compatibility_test: null,
            is_crib5_blocked: false,
            selected_supplier: null,
            split_delivery_active: false
          })
          .select();

        if (seedProjErr) throw new Error("Auto-seeding Projects failed: " + seedProjErr.message);

        let insertedProj = newProjData && newProjData.length > 0 ? newProjData[0] : null;

        // Robust fallback: if insert-select returns empty (common with some RLS/triggers/SDK issues), select explicitly by name
        if (!insertedProj) {
          console.warn("Insert select returned empty, attempting fallback select by name...");
          const { data: fallbackData, error: fallbackErr } = await client
            .from("projects")
            .select("*")
            .eq("user_id", supabaseUser.id)
            .eq("name", "CRAFT-202605-01")
            .limit(1);

          if (fallbackErr) {
            throw new Error("Fallback project retrieval failed: " + fallbackErr.message);
          }
          if (fallbackData && fallbackData.length > 0) {
            insertedProj = fallbackData[0];
          }
        }

        if (insertedProj) {
          // 2. Insert standard specifications linked to the project
          const { error: seedSpecsErr } = await client.from("specifications").insert([
            {
              project_id: insertedProj.id,
              user_id: supabaseUser.id,
              item_type_cn: "大堂扶手椅",
              item_type_en: "Lobby Armchair",
              quantity: 40,
              material_cn: "海军蓝亚麻 (L-4410)",
              material_en: "Navy Classic Linen (L-4410)",
              original_unit_price: 210,
              unit_price: 210,
              notes_cn: "",
              notes_en: ""
            },
            {
              project_id: insertedProj.id,
              item_type_cn: "贵宾单人椅",
              item_type_en: "VIP Club Chair",
              quantity: 20,
              material_cn: "皇家蓝丝绒 (V-9082)",
              material_en: "Royal Velvet (V-9082)",
              original_unit_price: 280,
              unit_price: 280,
              notes_cn: "",
              notes_en: ""
            },
            {
              project_id: insertedProj.id,
              item_type_cn: "定制实木大茶几",
              item_type_en: "Custom Oak Coffee Table",
              quantity: 5,
              material_cn: "天然白橡木",
              material_en: "Natural Solid White Oak",
              original_unit_price: 450,
              unit_price: 450,
              notes_cn: "",
              notes_en: ""
            }
          ]);

          if (seedSpecsErr) throw new Error("Auto-seeding Specifications failed: " + seedSpecsErr.message);

          // 3. Insert standard payment milestones
          const { error: seedPaymentsErr } = await client.from("payments").insert([
            {
              project_id: insertedProj.id,
              milestone_cn: "50% 首期定金 (已付)",
              milestone_en: "50% Deposit (Paid)",
              amount: 10450,
              status: "Paid",
              payment_date: "2026-05-25"
            },
            {
              project_id: insertedProj.id,
              milestone_cn: "40% 出货中款 (未核销)",
              milestone_en: "40% Shipping Release (Pending)",
              amount: 8360,
              status: "Pending",
              payment_date: "Pending"
            },
            {
              project_id: insertedProj.id,
              milestone_cn: "10% 交付尾款 (未核销)",
              milestone_en: "10% Handover Balance (Pending)",
              amount: 2090,
              status: "Pending",
              payment_date: "Pending"
            }
          ]);
          if (seedPaymentsErr) throw new Error("Auto-seeding Payments failed: " + seedPaymentsErr.message);

          // 4. Insert initial human-AI audit logs
          const { error: seedLogsErr } = await client.from("agent_logs").insert([
            {
              project_id: insertedProj.id,
              operator: "Crafton System",
              action_desc_cn: "解析會員中心內置對話框需求及手稿，自動生成主訂單草稿",
              action_desc_en: "Parsed member portal message and sketch, auto-generated project master draft."
            },
            {
              project_id: insertedProj.id,
              operator: "Crafton System",
              action_desc_cn: "自動通過內置消息通道向客户追問補充椅子的金屬腿部塗裝工藝和公差",
              action_desc_en: "Automatically followed up via member portal to query metal legs coating and tolerance."
            },
            {
              project_id: insertedProj.id,
              operator: "Crafton System",
              action_desc_cn: "一鍵生成中英文對照規格書，尺寸標準定義：W: 650mm, D: 600mm, H: 850mm",
              action_desc_en: "Bilingual specifications generated. Dimensions defined: W: 650mm, D: 600mm, H: 850mm."
            }
          ]);

          if (seedLogsErr) throw new Error("Auto-seeding Agent Logs failed: " + seedLogsErr.message);

          // 5. Insert detailed technical agent thought trace logs (for all 17 stages)
          const seedThoughtRows = [];
          Object.entries(mockData.agentThoughtLogs).forEach(([stageId, logList]) => {
            logList.forEach((line) => {
              seedThoughtRows.push({
                project_id: insertedProj.id,
                stage_id: stageId,
                role: line.role,
                log_text_cn: line.text,
                log_text_en: line.textEn || line.text
              });
            });
          });
          if (seedThoughtRows.length > 0) {
            const { error: seedThoughtsErr } = await client.from("agent_thought_logs").insert(seedThoughtRows);
            if (seedThoughtsErr) throw new Error("Auto-seeding Agent Thought Logs failed: " + seedThoughtsErr.message);
          }

          dbProject = insertedProj;
        } else {
          throw new Error("Failed to retrieve auto-seeded project.");
        }
      } else {
        dbProject = projectsData[0];
      }

      // Load specs, payments, logs and thought logs
      if (dbProject) {
        // 2. Fetch live Specifications
        const { data: itemsData, error: itemsErr } = await client
          .from("specifications")
          .select("*")
          .eq("project_id", dbProject.id);

        if (itemsErr) throw itemsErr;

        // 3. Fetch live Payments Schedule
        const { data: paymentsData, error: paymentsErr } = await client
          .from("payments")
          .select("*")
          .eq("project_id", dbProject.id)
          .order("created_at", { ascending: true });

        if (paymentsErr) throw paymentsErr;

        // 4. Fetch live Agent Logs
        const { data: logsData } = await client
          .from("agent_logs")
          .select("*")
          .eq("project_id", dbProject.id)
          .order("created_at", { ascending: false });

        // 5. Fetch live Agent Thought Logs
        const { data: dbThoughtLogs, error: thoughtsErr } = await client
          .from("agent_thought_logs")
          .select("*")
          .eq("project_id", dbProject.id);

        if (thoughtsErr) throw thoughtsErr;

        // Apply dbThoughtLogs to in-memory mockData.agentThoughtLogs with English healing
        if (dbThoughtLogs && dbThoughtLogs.length > 0) {
          const newThoughtLogs = {};

          // Sort or group by stage_id, and preserve insertion order
          const sortedDbThoughtLogs = [...dbThoughtLogs].sort((a, b) => {
            if (a.stage_id !== b.stage_id) return a.stage_id.localeCompare(b.stage_id);
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);
          });

          sortedDbThoughtLogs.forEach((row) => {
            if (!newThoughtLogs[row.stage_id]) {
              newThoughtLogs[row.stage_id] = [];
            }

            const currentIdx = newThoughtLogs[row.stage_id].length;
            const localLines = mockData.agentThoughtLogs[row.stage_id];
            const localLine = localLines ? localLines[currentIdx] : null;

            let textEn = row.log_text_en || row.log_text_cn;
            // If DB English text is missing or contains Chinese, but we have a clean local English text, use local
            if (
              localLine &&
              localLine.textEn &&
              (!row.log_text_en || row.log_text_en === row.log_text_cn || /[\u4e00-\u9fa5]/.test(row.log_text_en))
            ) {
              textEn = localLine.textEn;
            }

            newThoughtLogs[row.stage_id].push({
              role: row.role,
              text: row.log_text_cn || row.log_text_en,
              textEn: textEn
            });
          });

          Object.assign(mockData.agentThoughtLogs, newThoughtLogs);
        }

        const stageNum = dbProject.current_stage || 1;
        const currentStageId = "S" + String(stageNum).padStart(2, "0");

        // Sync state variables from the database to React state
        if (dbProject.selected_fabric) setSelectedFabric(dbProject.selected_fabric);
        if (dbProject.selected_leg) setSelectedLeg(dbProject.selected_leg);
        if (dbProject.fabric_compatibility_test !== undefined)
          setFabricCompatibilityTest(dbProject.fabric_compatibility_test);
        if (dbProject.is_crib5_blocked !== undefined) {
          setIsCrib5Blocked(dbProject.is_crib5_blocked);
          setConfiguratorCrib5Blocked(dbProject.is_crib5_blocked && dbProject.selected_fabric === "FAB-03");
        }
        if (dbProject.selected_supplier) setSelectedSupplier(dbProject.selected_supplier);
        if (dbProject.split_delivery_active !== undefined) setSplitDeliveryActive(dbProject.split_delivery_active);

        // Map project shape dynamically
        const mappedOrder = {
          id: dbProject.id,
          orderId: dbProject.name || "CRAFT-202605-01",
          clientName: dbProject.client_name || "Client Design Studio (UK)",
          projectLocation: dbProject.client_contact || "St Albans, UK",
          createdDate: dbProject.created_at ? dbProject.created_at.split("T")[0] : "2026-05-25",
          currentStageId: currentStageId,
          items:
            itemsData && itemsData.length > 0
              ? itemsData.map((item) => ({
                  id: item.id,
                  typeCn: item.item_type_cn,
                  typeEn: item.item_type_en,
                  qty: item.quantity,
                  materialCn: item.material_cn,
                  materialEn: item.material_en,
                  originalUnitPrice: Number(item.original_unit_price || 0),
                  unitPrice: Number(item.unit_price || 0),
                  status: "Active",
                  note: item.notes_cn || item.notes_en || ""
                }))
              : JSON.parse(JSON.stringify(mockData.initialOrder.items)),
          payments:
            paymentsData && paymentsData.length > 0
              ? paymentsData.map((p) => ({
                  id: p.id,
                  milestone: lang === "Cn" ? p.milestone_cn : p.milestone_en,
                  amount: Number(p.amount || 0),
                  date: p.payment_date,
                  status: p.status
                }))
              : JSON.parse(JSON.stringify(mockData.initialOrder.payments))
        };

        setOrder(mappedOrder);
        setDbConnected(true);

        // Update local stage view to match Supabase's status
        const stageIdx = stages.findIndex((s) => s.id === currentStageId);
        if (stageIdx !== -1) {
          setCurrentStageIndex(stageIdx);
        }

        if (logsData && logsData.length > 0) {
          setLogs(
            logsData.map((log) => {
              const actionCn = log.action_desc_cn || log.action_desc_en;
              let actionEn = log.action_desc_en || log.action_desc_cn;
              if (!actionEn || actionEn === actionCn || /[\u4e00-\u9fa5]/.test(actionEn)) {
                actionEn = getLogActionEn(actionCn) || actionEn;
              }
              return {
                time: log.created_at ? new Date(log.created_at).toLocaleString() : "2026-05-25 10:15:20",
                user: log.operator || "Crafton System",
                action: actionCn,
                actionEn: actionEn
              };
            })
          );
        }
      }
    } catch (err) {
      console.error("Supabase load error:", err);
      setDbError(err.message || "Failed to query. Please verify connection credentials.");
      setDbConnected(false);
      if (shouldThrow) throw err;
    } finally {
      setDbLoading(false);
    }
  };

  const loadLatestSubmittedTrackerProject = async () => {
    if (!window.supabase || !getSupabaseUrl() || !getSupabaseKey()) return;

    const context = await getPortalSupabaseContext({ requireAuth: false });
    if (!context?.supabaseUser) return;

    const { client, supabaseUser } = context;
    const { data, error } = await client
      .from("intake_jobs")
      .select("*, intake_files(*)")
      .eq("user_id", supabaseUser.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.warn("Latest submitted tracker project was not loaded:", error.message || error);
      return;
    }

    const job = data?.[0];
    if (!job) {
      setLatestIntakeJob(null);
      setSubmittedTrackerProject(null);
      setTrackerPreviewUrl("");
      return;
    }

    const file = Array.isArray(job.intake_files) ? job.intake_files[0] : job.intake_files;
    let previewUrl = "";
    if (file?.mime_type?.startsWith("image/") && file.storage_bucket && file.storage_path) {
      const { data: signed } = await client.storage
        .from(file.storage_bucket)
        .createSignedUrl(file.storage_path, 60 * 60);
      previewUrl = signed?.signedUrl || "";
    }

    const quantityText = job.quantity_text || "";
    const trackerProject = {
      projectName: job.project_name || "",
      destination: job.destination || "",
      quantityText,
      file: null,
      fileName: file?.original_name || "",
      jobId: job.id,
      intakeFileId: job.intake_file_id || file?.id || null,
      quoteStatus: "pending_quote",
      submittedAt: job.created_at || new Date().toISOString(),
      previewUrl
    };

    setLatestIntakeJob(job);
    setSubmittedTrackerProject(trackerProject);
    setOrder((prev) => ({
      ...prev,
      orderId: job.project_name || prev.orderId,
      projectLocation: job.destination || prev.projectLocation,
      currentStageId: "S02",
      quoteStatus: "pending_quote",
      items: buildSubmittedOrderItems(quantityText),
      payments: [
        {
          milestone: "Supplier quotation pending",
          amount: 0,
          date: "Pending",
          status: "Pending Quote"
        }
      ]
    }));
    setCurrentStageIndex(1);
  };

  const getLocalReviewJobs = () => {
    const baseJob =
      latestIntakeJob ||
      (submittedTrackerProject
        ? {
            id: submittedTrackerProject.jobId || "LOCAL-INTAKE-DEMO",
            project_name: submittedTrackerProject.projectName,
            destination: submittedTrackerProject.destination,
            quantity_text: submittedTrackerProject.quantityText,
            status: "needs_review",
            review_status: "pending",
            rfq_status: "not_started",
            result_json: {
              project: {
                name: submittedTrackerProject.projectName,
                client_name: user?.company || "Portal Intake Client",
                destination: submittedTrackerProject.destination
              },
              items: buildSubmittedOrderItems(
                submittedTrackerProject.quantityText,
                submittedTrackerProject.structuredBrief
              ).map((item) => ({
                id: item.id,
                item_type_cn: item.typeCn,
                item_type_en: item.typeEn,
                quantity: item.qty,
                quantity_text: item.qtyDisplay,
                dimensions_text: item.dimensionsText,
                material_cn: item.materialCn,
                material_en: item.materialEn,
                finish: item.finish,
                usage_location: item.usageLocation,
                fire_standard: item.fireStandard,
                original_unit_price: Number(item.originalUnitPrice || 0),
                unit_price: Number(item.unitPrice || 0),
                currency: item.currency || "USD",
                notes_cn: item.note,
                notes_en: item.note,
                image_url: item.imageUrl || ""
              })),
              questions: [
                "Confirm exact dimensions for each furniture type.",
                "Confirm final fabric code and Crib 5 fire requirement.",
                "Confirm target delivery date and receiving window."
              ],
              summary_en: "Local intake draft ready for Cho review.",
              source_notes: submittedTrackerProject.fileName || "Portal intake submission"
            }
          }
        : null);

    return baseJob ? [baseJob] : [];
  };

  const isMissingSupabaseTableError = (error) => {
    const message = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
    return message.includes("42p01") || message.includes("does not exist") || message.includes("schema cache");
  };

  const resetAdminOperationalData = () => {
    setAdminRfqBatches([]);
    setAdminSupplierQuotes([]);
    setAdminApprovals([]);
    setAdminInspectionReports([]);
    setAdminShipmentDocuments([]);
    setAdminWorkflowEvents([]);
    setAdminProjectFiles([]);
    setAdminDataStatus({ loaded: false, missingTables: [] });
  };

  const queryOptionalAdminTable = async (client, table, options = {}) => {
    const {
      select = "*",
      orderColumn = "created_at",
      ascending = false,
      limit = 50,
      projectColumn = "project_id",
      projectId = order.id
    } = options;

    try {
      let query = client.from(table).select(select);
      if (projectId && projectColumn) query = query.eq(projectColumn, projectId);
      if (orderColumn) query = query.order(orderColumn, { ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return { rows: data || [], missing: false };
    } catch (error) {
      if (isMissingSupabaseTableError(error)) {
        return { rows: [], missing: true };
      }
      console.warn(`Admin table ${table} could not be loaded:`, error.message || error);
      return { rows: [], missing: false, error };
    }
  };

  const loadAdminOperationalData = async () => {
    if (!window.supabase || !getSupabaseUrl() || !getSupabaseKey()) {
      resetAdminOperationalData();
      return;
    }

    const context = await getPortalSupabaseContext({ requireAuth: false });
    if (!context?.client || !context?.supabaseUser) {
      resetAdminOperationalData();
      return;
    }

    const authenticatedUser = mapSupabaseUserToAppUser(context.supabaseUser);
    if (!authenticatedUser.isStaff) {
      resetAdminOperationalData();
      return;
    }

    const tableSpecs = [
      { key: "rfq_batches", setter: setAdminRfqBatches },
      { key: "supplier_quotes", setter: setAdminSupplierQuotes, select: "*, suppliers(*)" },
      { key: "approvals", setter: setAdminApprovals },
      { key: "inspection_reports", setter: setAdminInspectionReports },
      { key: "shipment_documents", setter: setAdminShipmentDocuments },
      { key: "workflow_events", setter: setAdminWorkflowEvents },
      { key: "project_files", setter: setAdminProjectFiles }
    ];

    const missingTables = [];
    await Promise.all(
      tableSpecs.map(async (spec) => {
        let result = await queryOptionalAdminTable(context.client, spec.key, { select: spec.select || "*" });
        if (result.error && spec.select && spec.select !== "*") {
          result = await queryOptionalAdminTable(context.client, spec.key, { select: "*" });
        }
        spec.setter(result.rows);
        if (result.missing) missingTables.push(spec.key);
      })
    );

    setAdminDataStatus({ loaded: true, missingTables });
  };

  const loadPrequoteWorkspace = async () => {
    setClientProjectsLoading(true);
    const localJobs = getLocalReviewJobs();

    if (!window.supabase || !getSupabaseUrl() || !getSupabaseKey()) {
      setIntakeReviewJobs(localJobs);
      setClientProjectJobs(localJobs);
      setClientProjectsLoading(false);
      return;
    }

    const context = await getPortalSupabaseContext({ requireAuth: false });
    if (!context?.client) {
      setIntakeReviewJobs(localJobs);
      setClientProjectJobs(localJobs);
      setClientProjectsLoading(false);
      return;
    }

    try {
      const { client, supabaseUser } = context;
      const authenticatedUser = supabaseUser ? mapSupabaseUserToAppUser(supabaseUser) : null;

      if (!supabaseUser) {
        setAdminAccessStatus("unauthenticated");
        setIntakeReviewJobs([]);
        setClientProjectJobs([]);
        return;
      }

      if (authenticatedUser?.isStaff) {
        setAdminAccessStatus("loading");
        const { data: reviewData, error: reviewError } = await client
          .from("intake_jobs")
          .select("*, intake_files(*), projects(*)")
          .in("status", ["queued", "processing", "needs_review", "completed"])
          .order("created_at", { ascending: false })
          .limit(24);

        if (reviewError) throw reviewError;
        setIntakeReviewJobs(reviewData || []);
        setAdminAccessStatus("ready");
      } else {
        setAdminAccessStatus("forbidden");
        setIntakeReviewJobs([]);
      }

      if (supabaseUser) {
        const { data: clientData, error: clientError } = await client
          .from("intake_jobs")
          .select("*, intake_files(*), projects(*)")
          .eq("user_id", supabaseUser.id)
          .order("created_at", { ascending: false })
          .limit(24);

        if (clientError) throw clientError;
        const clientRows = clientData && clientData.length > 0 ? clientData : [];
        const clientRowsWithPreviews = await Promise.all(
          clientRows.map(async (row) => {
            const file = getIntakeFileFromJob(row);
            if (!file?.mime_type?.startsWith("image/") || !file.storage_bucket || !file.storage_path) return row;

            try {
              const { data: signed, error: signedError } = await client.storage
                .from(file.storage_bucket)
                .createSignedUrl(file.storage_path, 60 * 60);
              if (signedError) throw signedError;
              return { ...row, client_preview_url: signed?.signedUrl || "" };
            } catch (previewError) {
              console.warn("Client furniture preview could not be created:", previewError.message || previewError);
              return row;
            }
          })
        );
        setClientProjectJobs(clientRowsWithPreviews);
      } else {
        setClientProjectJobs([]);
      }
    } catch (err) {
      console.warn("Pre-quote workspace was not loaded from Supabase:", err.message || err);
      setAdminAccessStatus("error");
      setIntakeReviewJobs([]);
      setClientProjectJobs([]);
    } finally {
      setClientProjectsLoading(false);
    }
  };

  const updateLocalReviewJob = (jobId, patch) => {
    const applyPatch = (job) => {
      if (job.id !== jobId) return job;
      return typeof patch === "function" ? patch(job) : { ...job, ...patch };
    };

    setIntakeReviewJobs((prev) => prev.map(applyPatch));
    setClientProjectJobs((prev) => prev.map(applyPatch));
    if (latestIntakeJob?.id === jobId) {
      setLatestIntakeJob((prev) => (prev ? applyPatch(prev) : prev));
    }
  };

  const persistIntakeJobUpdate = async (job, updates) => {
    updateLocalReviewJob(job.id, updates);

    if (!window.supabase || !getSupabaseUrl() || !getSupabaseKey() || String(job.id).startsWith("LOCAL-")) {
      return { ...job, ...updates };
    }

    const context = await getPortalSupabaseContext({ requireAuth: false });
    if (!context?.client) return { ...job, ...updates };

    const { data, error } = await context.client.from("intake_jobs").update(updates).eq("id", job.id).select().single();
    if (error) throw error;
    updateLocalReviewJob(job.id, data);
    return data;
  };

  const buildOrderFromReviewDraft = (draft) => ({
    id: draft.projectId || null,
    orderId: draft.projectName || "S01 Intake Draft",
    clientName: draft.clientName || "Portal Intake Client",
    projectLocation: draft.destination || "Destination pending",
    createdDate: new Date().toISOString().split("T")[0],
    currentStageId: "S01",
    quoteStatus: draft.reviewStatus || "pending",
    items: (draft.items || []).map((item, idx) => ({
      id: item.id || `DRAFT-ITEM-${idx + 1}`,
      typeCn: item.typeCn || item.typeEn || "客户提交定制产品",
      typeEn: item.typeEn || item.typeCn || "Submitted Bespoke Item",
      qty: Number(item.qty || 0),
      materialCn: item.materialCn || "待确认",
      materialEn: item.materialEn || "To confirm",
      originalUnitPrice: Number(item.originalUnitPrice || item.unitPrice || 0),
      unitPrice: Number(item.unitPrice || item.originalUnitPrice || 0),
      status: "Draft",
      note: item.notesCn || item.notesEn || ""
    })),
    payments:
      draft.payments && draft.payments.length > 0
        ? draft.payments.map((payment) => ({
            milestone: lang === "Cn" ? payment.milestoneCn : payment.milestoneEn,
            amount: Number(payment.amount || 0),
            date: payment.date || "Pending",
            status: payment.status || "Pending"
          }))
        : [
            {
              milestone: "Draft quotation pending",
              amount: 0,
              date: "Pending",
              status: "Pending"
            }
          ]
  });

  const syncReviewDraftFromJob = (job) => {
    const normalized = normalizeReviewJob(job);
    setReviewDraft(normalized);
    setReviewNote(normalized.reviewNotes || "");
    setPrequoteNotice(
      normalized.reviewStatus === "approved"
        ? "Intake draft approved. Specs are ready for RFQ package preparation."
        : ""
    );
    setIntakeApprovalSaving(false);
    setIntakeBomDraftGenerated(false);
    setIntakeBomDraftMessage("");
    setOrder(buildOrderFromReviewDraft(normalized));
    setCurrentStageIndex(0);
  };

  const handleReviewItemChange = (idx, field, value) => {
    setReviewDraft((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((item, itemIdx) => (itemIdx === idx ? { ...item, [field]: value } : item));
      return { ...prev, items };
    });
  };

  const ensureIntakeProject = async (job, draft, stage = 4) => {
    if (!dbConnected) return job?.project_id || draft?.projectId || null;

    const context = await getPortalSupabaseContext({ requireAuth: true });
    if (!context?.client) throw new Error("A Supabase staff session is required to link this order to a project.");

    const { client } = context;
    const projectName = draft?.projectName || job?.project_name || `INTAKE-${String(job?.id || "").slice(0, 8)}`;
    const ownerId = job?.user_id || job?.requested_by || null;
    let projectId = job?.project_id || draft?.projectId || null;

    if (!projectId) {
      let lookup = client.from("projects").select("id,current_stage").eq("name", projectName);
      lookup = ownerId ? lookup.eq("user_id", ownerId) : lookup.is("user_id", null);
      const { data: existingProject, error: lookupError } = await lookup.maybeSingle();
      if (lookupError) throw lookupError;

      if (existingProject?.id) {
        projectId = existingProject.id;
      } else {
        const { data: createdProject, error: createError } = await client
          .from("projects")
          .insert({
            user_id: ownerId,
            name: projectName,
            client_name: draft?.clientName || "Portal Intake Client",
            client_contact: draft?.destination || job?.destination || "",
            current_stage: stage
          })
          .select("id")
          .single();
        if (createError) throw createError;
        projectId = createdProject.id;
      }

      const { error: linkError } = await client.from("intake_jobs").update({ project_id: projectId }).eq("id", job.id);
      if (linkError) throw linkError;
    }

    const { error: projectError } = await client
      .from("projects")
      .update({
        current_stage: stage,
        name: projectName,
        client_name: draft?.clientName || "Portal Intake Client",
        client_contact: draft?.destination || job?.destination || ""
      })
      .eq("id", projectId);
    if (projectError) throw projectError;

    updateLocalReviewJob(job.id, { project_id: projectId });
    setReviewDraft((previous) => (previous ? { ...previous, projectId } : previous));
    setOrder((previous) => ({ ...previous, id: projectId }));
    return projectId;
  };

  const handleApproveIntakeReview = async () => {
    const job = intakeReviewJobs.find((item) => item.id === selectedReviewJobId) || intakeReviewJobs[0];
    if (!job || !reviewDraft) return;

    const resultJson = denormalizeReviewDraft(reviewDraft);
    const updates = {
      status: "completed",
      step: "cho_review_approved",
      review_status: "approved",
      review_notes: reviewNote || "Approved for RFQ preparation.",
      result_json: resultJson,
      reviewed_at: new Date().toISOString()
    };

    setIntakeApprovalSaving(true);
    setPrequoteNotice("Saving approval to Supabase...");
    try {
      const updated = await persistIntakeJobUpdate(job, updates);
      const projectId = await ensureIntakeProject(updated, reviewDraft, 4);
      if (dbConnected && projectId) {
        const client = getSupabaseBrowserClient();
        const { data: authData } = await client.auth.getUser();
        const { data: existingApproval, error: approvalLookupError } = await client
          .from("approvals")
          .select("id")
          .eq("project_id", projectId)
          .eq("stage_id", "S04")
          .eq("approval_type", "intake_technical_review")
          .contains("payload", { intake_job_id: updated.id })
          .limit(1);
        if (approvalLookupError) throw approvalLookupError;

        if (!existingApproval?.length) {
          const { error: approvalError } = await client.from("approvals").insert({
            project_id: projectId,
            stage_id: "S04",
            approval_type: "intake_technical_review",
            status: "approved",
            reviewer_id: authData?.user?.id || null,
            reviewer_name: user?.name || "Cho",
            notes: updates.review_notes,
            reviewed_at: updates.reviewed_at,
            payload: { intake_job_id: updated.id, bom_items: resultJson.items?.length || 0 }
          });
          if (approvalError) throw approvalError;
        }
      }
      setReviewDraft((previous) =>
        previous ? { ...previous, projectId, reviewStatus: "approved", reviewNotes: updates.review_notes } : previous
      );
      setPrequoteNotice("Intake draft approved. Specs are ready for RFQ package preparation.");
      setCurrentStageIndex(3);
      addLog("Cho", "Intake draft approved for RFQ preparation.", "Intake draft approved for RFQ preparation.");
      await loadPrequoteWorkspace();
      await loadAdminOperationalData();
    } catch (err) {
      console.error("Approve intake review failed:", err);
      setPrequoteNotice(`Approval could not be saved to Supabase: ${err.message || err}`);
    } finally {
      setIntakeApprovalSaving(false);
    }
  };

  const handleAskClientForRevision = async () => {
    const job = intakeReviewJobs.find((item) => item.id === selectedReviewJobId) || intakeReviewJobs[0];
    if (!job || !reviewDraft) return;

    const resultJson = denormalizeReviewDraft(reviewDraft);
    const updates = {
      status: "needs_review",
      step: "client_clarification_requested",
      review_status: "revision_requested",
      review_notes: reviewNote || "Please answer the missing specification questions before RFQ.",
      result_json: resultJson
    };

    try {
      await persistIntakeJobUpdate(job, updates);
      setPrequoteNotice("Clarification request sent to the client portal.");
      addLog("Cho", "Requested client clarification before RFQ.", "Requested client clarification before RFQ.");
      await loadPrequoteWorkspace();
      await loadAdminOperationalData();
    } catch (err) {
      console.error("Client clarification request failed:", err);
      setPrequoteNotice(`Clarification request could not be saved: ${err.message || err}`);
    }
  };

  const handleRejectIntakeReview = async () => {
    const job = intakeReviewJobs.find((item) => item.id === selectedReviewJobId) || intakeReviewJobs[0];
    if (!job) return;

    try {
      await persistIntakeJobUpdate(job, {
        status: "failed",
        step: "cho_review_rejected",
        review_status: "rejected",
        review_notes: reviewNote || "Rejected by Cho during intake review."
      });
      setPrequoteNotice("Intake draft rejected and removed from the pre-quote path.");
      addLog("Cho", "Rejected intake draft.", "Rejected intake draft.");
      await loadPrequoteWorkspace();
      await loadAdminOperationalData();
    } catch (err) {
      console.error("Reject intake review failed:", err);
      setPrequoteNotice(`Rejection could not be saved: ${err.message || err}`);
    }
  };

  const handleCreateRfqDraft = async () => {
    const job = intakeReviewJobs.find((item) => item.id === selectedReviewJobId) || intakeReviewJobs[0];
    if (!job || !reviewDraft) return;

    const rfqDraft = buildRfqDraft(reviewDraft);
    try {
      const updated = await persistIntakeJobUpdate(job, {
        status: "completed",
        step: "rfq_draft_ready",
        review_status: "rfq_ready",
        rfq_status: "draft",
        rfq_draft_json: rfqDraft,
        rfq_created_at: rfqDraft.generated_at
      });
      const projectId = await ensureIntakeProject(updated, reviewDraft, 6);

      if (dbConnected && projectId) {
        const client = getSupabaseBrowserClient();
        const rfqCode = `RFQ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(updated.id).slice(0, 6).toUpperCase()}`;
        const rfqPayload = {
          project_id: projectId,
          intake_job_id: updated.id,
          rfq_code: rfqCode,
          title: `${reviewDraft.projectName || "Project"} sourcing package`,
          status: "draft",
          supplier_count: 0,
          invited_count: 0,
          supplier_ids: [],
          currency: "USD",
          payload: rfqDraft
        };
        const { data: existingRfq, error: lookupError } = await client
          .from("rfq_batches")
          .select("id")
          .eq("intake_job_id", updated.id)
          .maybeSingle();
        if (lookupError) throw lookupError;
        const rfqWrite = existingRfq
          ? client.from("rfq_batches").update(rfqPayload).eq("id", existingRfq.id)
          : client.from("rfq_batches").insert(rfqPayload);
        const { error: rfqError } = await rfqWrite;
        if (rfqError) throw rfqError;

        const { error: eventError } = await client.from("workflow_events").insert({
          project_id: projectId,
          job_id: updated.id,
          stage_id: "S06",
          event_type: "rfq_drafted",
          actor: "Cho",
          message_cn: `${rfqCode} 询价包草稿已建立。`,
          message_en: `${rfqCode} RFQ package draft created.`,
          payload: { rfq_code: rfqCode }
        });
        if (eventError) throw eventError;
      }

      setReviewDraft((prev) => (prev ? { ...prev, rfqDraft, reviewStatus: "rfq_ready", rfqStatus: "draft" } : prev));
      setPrequoteNotice("RFQ draft package created with three supplier comparison slots.");
      setCurrentStageIndex(5);
      addLog("Cho", "RFQ draft package created.", "RFQ draft package created.");
      await loadPrequoteWorkspace();
      await loadAdminOperationalData();
      setActiveAdminFlow("sourcing");
    } catch (err) {
      console.error("Create RFQ draft failed:", err);
      setPrequoteNotice(`RFQ draft could not be saved: ${err.message || err}`);
    }
  };

  const handleSubmitClientAnswers = async (job) => {
    const normalized = normalizeReviewJob(job);
    const answers = clientAnswerDrafts[job.id] || {};
    const hasAnswer = Object.values(answers).some((value) => String(value || "").trim());
    if (!hasAnswer) {
      setClientAnswerSubmitState((prev) => ({
        ...prev,
        [job.id]: {
          status: "error",
          message: "Add at least one answer before submitting."
        }
      }));
      setPrequoteNotice("Add at least one clarification answer before submitting.");
      return;
    }

    const resultJson = {
      ...safeJsonObject(job.result_json, {}),
      client_answers: answers
    };

    try {
      setClientAnswerSubmitState((prev) => ({
        ...prev,
        [job.id]: {
          status: "submitting",
          message: "Submitting answers to Cho..."
        }
      }));
      await persistIntakeJobUpdate(job, {
        status: "needs_review",
        step: "client_answers_submitted",
        review_status: "pending",
        review_notes: "Client submitted clarification answers.",
        client_answers: answers,
        result_json: resultJson
      });
      setClientAnswerSubmitState((prev) => ({
        ...prev,
        [job.id]: {
          status: "success",
          message: "Answers submitted successfully. Cho can now see your updates."
        }
      }));
      setPrequoteNotice(`${normalized.projectName}: answers submitted back to Cho.`);
      await loadPrequoteWorkspace();
      await loadAdminOperationalData();
    } catch (err) {
      console.error("Client answer submission failed:", err);
      setClientAnswerSubmitState((prev) => ({
        ...prev,
        [job.id]: {
          status: "error",
          message: `Answers could not be saved: ${err.message || err}`
        }
      }));
      setPrequoteNotice(`Answers could not be saved: ${err.message || err}`);
    }
  };

  // Listen to postMessage from child loading-ai
  useEffect(() => {
    console.log("=== APP COMPONENT MOUNTED (EFFECT) ===");
    const handleChildMessage = (e) => {
      if (e.data && e.data.type === "CRAFTON_CHILD_LANG_CHANGE") {
        setLang(e.data.lang); // "Cn" or "En"
      }
    };
    window.addEventListener("message", handleChildMessage);
    return () => window.removeEventListener("message", handleChildMessage);
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setSupabaseSessionUser(null);
      setSupabaseAuthReady(true);
      return undefined;
    }

    let cancelled = false;
    setSupabaseAuthReady(false);

    const hydrateAuthenticatedUser = async (supabaseUser) => {
      if (cancelled) return;
      setSupabaseSessionUser(supabaseUser || null);
      setSupabaseAuthReady(true);
      setUser(supabaseUser ? mapSupabaseUserToAppUser(supabaseUser) : null);
      if (supabaseUser) {
        await syncAuthenticatedUserProfile(supabaseUser);
        if (cancelled) return;
        await fetchSupabaseData();
        if (cancelled) return;
        await loadLatestSubmittedTrackerProject();
        if (cancelled) return;
        await loadPrequoteWorkspace();
        if (cancelled) return;
        await loadAdminOperationalData();
      }
    };

    const { data } = client.auth.onAuthStateChange((event, session) => {
      const supabaseUser = session?.user || null;
      setSupabaseSessionUser(supabaseUser);
      setSupabaseAuthReady(true);
      if (!supabaseUser) {
        setSupportConversationId(null);
        setSupportUploadedFileId(null);
        setSupportSubmittedJobId(null);
        supportConversationIdRef.current = null;
        lastProfileSyncRef.current = "";
        setUser(null);
        return;
      }

      setUser(mapSupabaseUserToAppUser(supabaseUser));

      if (!["INITIAL_SESSION", "SIGNED_IN", "USER_UPDATED"].includes(event)) {
        return;
      }

      setTimeout(() => {
        hydrateAuthenticatedUser(supabaseUser).catch((err) =>
          console.warn("Authenticated user hydration failed:", err.message || err)
        );
      }, 0);
    });

    return () => {
      cancelled = true;
      data?.subscription?.unsubscribe();
    };
  }, [dbUrl, dbKey]);

  useEffect(() => {
    if (clientPortalTab === "Support") setClientPortalTab("Intake");
  }, [clientPortalTab]);

  // Re-fetch after the browser has restored its own Supabase session.
  useEffect(() => {
    if (!supabaseAuthReady) return undefined;
    let cancelled = false;
    (async () => {
      await fetchSupabaseData();
      if (!cancelled) await loadLatestSubmittedTrackerProject();
      if (!cancelled) await loadPrequoteWorkspace();
      if (!cancelled) await loadAdminOperationalData();
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, supabaseAuthReady, supabaseSessionUser?.id]);

  // Subscribe to real-time changes on Supabase when connected
  useEffect(() => {
    if (!dbConnected) return;

    let channel = null;
    let realtimeClient = null;
    try {
      const url = getSupabaseUrl();
      const key = getSupabaseKey();
      if (url && key && window.supabase) {
        realtimeClient = getSupabaseBrowserClient(url, key);

        channel = realtimeClient
          .channel("schema-db-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "projects"
            },
            (payload) => {
              console.log("Realtime Change detected on 'projects':", payload);
              fetchSupabaseData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "specifications"
            },
            (payload) => {
              console.log("Realtime Change detected on 'specifications':", payload);
              fetchSupabaseData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "payments"
            },
            (payload) => {
              console.log("Realtime Change detected on 'payments':", payload);
              fetchSupabaseData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "agent_logs"
            },
            (payload) => {
              console.log("Realtime Change detected on 'agent_logs':", payload);
              fetchSupabaseData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "agent_thought_logs"
            },
            (payload) => {
              console.log("Realtime Change detected on 'agent_thought_logs':", payload);
              fetchSupabaseData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "intake_jobs"
            },
            (payload) => {
              console.log("Realtime Change detected on 'intake_jobs':", payload);
              if (payload.new) setLatestIntakeJob(payload.new);
              loadLatestSubmittedTrackerProject();
              loadPrequoteWorkspace();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "workflow_events"
            },
            (payload) => {
              console.log("Realtime Change detected on 'workflow_events':", payload);
              loadPrequoteWorkspace();
              loadAdminOperationalData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "rfq_batches"
            },
            (payload) => {
              console.log("Realtime Change detected on 'rfq_batches':", payload);
              loadPrequoteWorkspace();
              loadAdminOperationalData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "supplier_quotes"
            },
            (payload) => {
              console.log("Realtime Change detected on 'supplier_quotes':", payload);
              loadAdminOperationalData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "approvals"
            },
            (payload) => {
              console.log("Realtime Change detected on 'approvals':", payload);
              loadAdminOperationalData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "inspection_reports"
            },
            (payload) => {
              console.log("Realtime Change detected on 'inspection_reports':", payload);
              loadAdminOperationalData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "shipment_documents"
            },
            (payload) => {
              console.log("Realtime Change detected on 'shipment_documents':", payload);
              loadAdminOperationalData();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "project_files"
            },
            (payload) => {
              console.log("Realtime Change detected on 'project_files':", payload);
              loadAdminOperationalData();
            }
          )
          .subscribe((status) => {
            console.log("Supabase Realtime subscription status:", status);
          });
      }
    } catch (err) {
      console.error("Realtime subscription setup failed:", err);
    }

    return () => {
      if (channel && realtimeClient) {
        try {
          realtimeClient.removeChannel(channel);
          console.log("Supabase Realtime subscription unsubscribed successfully.");
        } catch (err) {
          console.error("Failed to clean up realtime channel:", err);
        }
      }
    };
  }, [dbConnected]);

  // Handle saving and testing Supabase configuration
  const handleSaveDbConfig = async (e) => {
    e.preventDefault();
    if (isSupabaseConfiguredByEnv) {
      setDbLoading(true);
      setDbError("");
      try {
        setDbUrl(savedUrl);
        setDbKey(savedKey);
        await fetchSupabaseData(true);
        setDbConnected(true);
        setShowDbConfig(false);
      } catch (err) {
        console.error("Environment Supabase connection failed:", err);
        setDbError(err.message || "Connection failed. Please check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.");
        setDbConnected(false);
      } finally {
        setDbLoading(false);
      }
      return;
    }

    if (!dbUrl.trim() || !dbKey.trim()) {
      safeRemoveItem("supabase_url");
      safeRemoveItem("supabase_key");
      setDbConnected(false);
      setShowDbConfig(false);
      return;
    }

    setDbLoading(true);
    setDbError("");

    try {
      // Test the client connection
      const testClient = getSupabaseBrowserClient(dbUrl.trim(), dbKey.trim());
      const { error } = await testClient.from("projects").select("id").limit(1);

      if (error) throw error;

      // Persist to localStorage
      safeSetItem("supabase_url", dbUrl.trim());
      safeSetItem("supabase_key", dbKey.trim());

      // Load actual data and execute the auto-seeder, letting errors propagate
      await fetchSupabaseData(true);

      // Only set success status and close the drawer on complete success!
      setDbConnected(true);
      setShowDbConfig(false);
    } catch (err) {
      console.error("Connection and seeding failed:", err);
      setDbError(err.message || "Connection failed. Please check URL / Anon Key and database tables.");
      setDbConnected(false);
    } finally {
      setDbLoading(false);
    }
  };

  const handleForceSeed = async () => {
    if (!window.supabase) {
      setDbError("Supabase client is not loaded in window.");
      return;
    }
    const url = getSupabaseUrl();
    const key = getSupabaseKey();
    if (!url || !key) {
      setDbError("Please save a valid database connection first before seeding.");
      return;
    }

    setDbLoading(true);
    setDbError("");

    try {
      const client = getSupabaseBrowserClient(url, key);
      const authResult = await client.auth.getUser().catch(() => ({ data: { user: null } }));
      const supabaseUser = authResult?.data?.user || null;
      if (!supabaseUser) {
        setAuthError(
          lang === "Cn" ? "请先登录，才能重建你的项目数据。" : "Please sign in before re-seeding your project data."
        );
        setShowAuthGate(true);
        return;
      }
      console.log("Force Re-seed: Clearing projects named 'CRAFT-202605-01'...");

      const { error: deleteErr } = await client
        .from("projects")
        .delete()
        .eq("user_id", supabaseUser.id)
        .eq("name", "CRAFT-202605-01");

      if (deleteErr) {
        console.warn("Delete of projects failed or returned error:", deleteErr);
      }

      console.log("Running cascading auto-seeding...");
      await fetchSupabaseData(true);
      setDbConnected(true);
      console.log("Force Re-seed completed successfully.");
    } catch (err) {
      console.error("Force Re-seed failed:", err);
      setDbError("Force Re-seed failed: " + (err.message || err));
    } finally {
      setDbLoading(false);
    }
  };

  const handleStageChange = async (index) => {
    setCurrentStageIndex(index);
    // Special trigger logic based on stage clicks to make prototype feel alive
    if (index === 4) {
      // Stage 5: Crib 5 Check
      setFabricCompatibilityTest("passed");
      setIsCrib5Blocked(false);
    } else if (index === 7) {
      // Stage 8: Cho Decision
      setIsBiddingDone(true);
    } else if (index === 14) {
      // Stage 15: Split Delivery and Strike out
      triggerSplitDelivery();
    }

    // Sync to Supabase if connected
    if (dbConnected && order.id) {
      try {
        const client = getSupabaseBrowserClient();
        const stageId = stages[index].id;
        const currentStageInt = parseInt(stageId.substring(1), 10);
        await client.from("projects").update({ current_stage: currentStageInt }).eq("id", order.id);
      } catch (err) {
        console.error("Supabase stage sync error:", err);
      }
    }
  };

  const handleLangToggle = () => {
    setLang(lang === "Cn" ? "En" : "Cn");
  };

  // Simulating user typing in chat window
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const newMsg = { sender: "client", text: inputText };
    setChatMessages([...chatMessages, newMsg]);
    setInputText("");

    // AI automated reply simulate
    setTimeout(async () => {
      let replyText = "";
      if (lang === "Cn") {
        replyText = "【Crafton 项目客服】：收到，我们正在根据您的需求核对项目资料。";
      } else {
        replyText = "[Crafton Concierge]: Received. We are checking your request against the project information.";
      }

      if (inputText.toLowerCase().includes("silk") || inputText.toLowerCase().includes("丝绸")) {
        // Trigger blocking scenario!
        setFabricCompatibilityTest("blocked");
        setIsCrib5Blocked(true);
        if (lang === "Cn") {
          replyText =
            "合规警报 / BANNED：检测到您选用“纯丝绸缎”。英国 (Crib 5) 防火阻燃规定禁止将丝绸进行化学防火涂层处理（会导致严重缩水与变色）。订单已自动拦截锁定。请更换为亚麻 (Linen) 或皮质 (Leather)！";
        } else {
          replyText =
            "COMPLIANCE ALERT / BANNED: You selected Pure Silk Satin. UK Crib 5 fire codes prohibit flame coating on delicate silks (causes extreme shrinkage & discoloration). Order has been BLOCKED. Please select Linen or Leather!";
        }
        // Force process stage to S05 for demonstration
        setCurrentStageIndex(4);

        if (dbConnected && order.id) {
          try {
            const client = getSupabaseBrowserClient();
            await client
              .from("projects")
              .update({
                current_stage: 5,
                selected_fabric: "FAB-03",
                is_crib5_blocked: true,
                fabric_compatibility_test: "blocked"
              })
              .eq("id", order.id);
          } catch (err) {
            console.error("Supabase silk block update error:", err);
          }
        }
      }

      setChatMessages((prev) => [...prev, { sender: "agent", text: replyText }]);
    }, 1200);
  };

  const handleTrackerAiMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    const nextMessages = [...chatMessages, { sender: "client", text }];
    setChatMessages(nextMessages);
    setInputText("");
    saveSupportMessage({ sender: "client", text }).catch(() => {});

    let replyText = "";
    const mentionsSilk = /silk|pure silk|satin|涓濈桓|绾笣/i.test(text);

    try {
      const aiMessages = nextMessages.map((message) => ({
        sender: message.sender === "client" ? "client" : "ai",
        text: message.text
      }));
      const result = await requestAiSupportReply(aiMessages);
      applySupportExtraction(result.extracted);
      replyText = result.reply || buildTrackerContextReply(text);
      saveSupportMessage({ sender: "ai", text: replyText, aiPayload: result }).catch(() => {});
    } catch (err) {
      console.warn("Tracker AI reply failed:", err.message || err);
      replyText = buildTrackerContextReply(text);
      saveSupportMessage({ sender: "ai", text: replyText }).catch(() => {});
    }

    if (mentionsSilk) {
      setFabricCompatibilityTest("blocked");
      setIsCrib5Blocked(true);
      replyText = `${replyText}\n\nCompliance alert: Pure silk/satin may be blocked for UK Crib 5 because flame-retardant coating can cause shrinkage or discoloration. Please confirm an alternative such as linen or leather.`;
      setCurrentStageIndex(4);

      if (dbConnected && order.id) {
        try {
          const client = getSupabaseBrowserClient();
          await client
            .from("projects")
            .update({
              current_stage: 5,
              selected_fabric: "FAB-03",
              is_crib5_blocked: true,
              fabric_compatibility_test: "blocked"
            })
            .eq("id", order.id);
        } catch (err) {
          console.error("Supabase silk block update error:", err);
        }
      }
    }

    setChatMessages((prev) => [...prev, { sender: "agent", text: replyText }]);
  };

  // Simulate Cho's review check-off in S04
  const handleChoApproval = async () => {
    const nextIndex = currentStageIndex + 1;
    setCurrentStageIndex(nextIndex);
    addLog(
      "Cho",
      "技术规格书與BOM審核通過，簽名發布。",
      "Technical specifications and BOM approved, signature released."
    );

    if (dbConnected && order.id) {
      try {
        const client = getSupabaseBrowserClient();
        const nextStageId = stages[nextIndex].id;
        const nextStageInt = parseInt(nextStageId.substring(1), 10);
        await client.from("projects").update({ current_stage: nextStageInt }).eq("id", order.id);
        await client.from("agent_logs").insert({
          project_id: order.id,
          operator: "Cho",
          action_desc_cn: "技术规格书與BOM審核通過，簽名發布。",
          action_desc_en: "Tech specifications and BOM approved, signed off."
        });
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }
  };

  // Simulate Crib 5 Override to bypass block
  const handleBypassCrib5 = async (fabricCode) => {
    setFabricCompatibilityTest("passed");
    setIsCrib5Blocked(false);
    setCurrentStageIndex(5); // Move to next stage S06
    addLog(
      "Cho",
      `修改物料合规：替换面料为 ${fabricCode} (海军蓝亚麻)，成功通过 Crib 5 安全拦截门禁。`,
      `Modified material compliance: Swapped fabric to ${fabricCode} (Navy Classic Linen), successfully passing the Crib 5 safety compliance gate.`
    );

    if (dbConnected && order.id) {
      try {
        const client = getSupabaseBrowserClient();
        await client
          .from("projects")
          .update({
            current_stage: 6,
            selected_fabric: "FAB-02",
            is_crib5_blocked: false,
            fabric_compatibility_test: "passed"
          })
          .eq("id", order.id);
        await client.from("agent_logs").insert({
          project_id: order.id,
          operator: "Cho",
          action_desc_cn: `修改物料合规：替换面料为 ${fabricCode} (海军蓝亚麻)，成功通过 Crib 5 安全拦截门禁。`,
          action_desc_en: `Bypassed Crib 5: Changed fabric to ${fabricCode} (Navy Classic Linen), successfully overriding gate.`
        });
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }
  };

  // Simulate Cho picking Foshan Gold-Sun in S08
  const handleSelectSupplier = async (supplier) => {
    setSelectedSupplier(supplier);
    setIsBiddingDone(true);

    // Update Master order values
    const updatedItems = order.items.map((item) => {
      if (item.typeEn === "Lobby Armchair" || item.typeEn === "VIP Club Chair") {
        return { ...item, unitPrice: supplier.pricePerChair };
      }
      return item;
    });

    const updatedPayments = order.payments.map((payment) => {
      if (payment.milestone.includes("50%")) {
        return { ...payment, amount: 9350 }; // Simulated price recalculation
      }
      return payment;
    });

    setOrder((prev) => ({ ...prev, items: updatedItems, payments: updatedPayments }));
    addLog(
      "Cho",
      `比价完成。最终选定代工厂: ${supplier.name}，大堂扶手椅单价核定为 $${supplier.pricePerChair}/把。`,
      `Bidding completed. Selected final supplier: ${supplier.name}. Lobby armchair unit price approved at $${supplier.pricePerChair}/pc.`
    );
    setCurrentStageIndex(8); // Move to production stage S09

    if (dbConnected && order.id) {
      try {
        const client = getSupabaseBrowserClient();
        await client
          .from("projects")
          .update({
            current_stage: 9,
            selected_supplier: supplier
          })
          .eq("id", order.id);

        // Update specifications in database
        await client
          .from("specifications")
          .update({ unit_price: supplier.pricePerChair })
          .eq("project_id", order.id)
          .in("item_type_en", ["Lobby Armchair", "VIP Club Chair"]);

        // Update relational payments schedule in database
        await client
          .from("payments")
          .update({ amount: 9350 })
          .eq("project_id", order.id)
          .ilike("milestone_en", "%50% Deposit%");
        await client
          .from("payments")
          .update({ amount: 7480 })
          .eq("project_id", order.id)
          .ilike("milestone_en", "%40% Shipping%");
        await client
          .from("payments")
          .update({ amount: 1870 })
          .eq("project_id", order.id)
          .ilike("milestone_en", "%10% Handover%");

        await client.from("agent_logs").insert({
          project_id: order.id,
          operator: "Cho",
          action_desc_cn: `比价完成。最终选定代工厂: ${supplier.name}，大堂扶手椅单价核定为 $${supplier.pricePerChair}/把。`,
          action_desc_en: `Supplier bidding finalized. Factory selected: ${supplier.name}. Lobby Armchair set to $${supplier.pricePerChair}/pc.`
        });
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }
  };

  // Simulate Client Split Delivery and Strike out (S15)
  const triggerSplitDelivery = async () => {
    setSplitDeliveryActive(true);
    const updatedItems = order.items.map((item) => {
      if (item.typeEn === "Lobby Armchair") {
        return { ...item, qty: 38, note: "已出港: 38 把 / ⚠️ 取消: 2 把 (现场划线核销)" };
      }
      if (item.typeEn === "Custom Oak Coffee Table") {
        return { ...item, qty: 4, note: "已到港: 4 张 / ⚠️ 取消: 1 张 (财务已退款)" };
      }
      return item;
    });

    const updatedPayments = [
      { milestone: "50% Deposit (已付)", amount: 10450, date: "2026-05-25", status: "Paid" },
      { milestone: "40% Shipping Release (出货中款)", amount: 7860, date: "2026-05-25", status: "Paid" },
      { milestone: "10% Recalculated Balance (尾款划线重算)", amount: 470, date: "Pending", status: "Pending" }
    ];

    setOrder((prev) => ({ ...prev, items: updatedItems, payments: updatedPayments }));
    addLog(
      "Client",
      "現場反饋：因客戶硬裝現場變動，取消2把扶手椅與1張茶几。啟動劃線財務自動重算，餘款已核銷更新。",
      "On-site feedback: Due to site changes, 2 armchairs and 1 coffee table were canceled. Initiated automatic strike-through financial recalculation; remaining balance updated."
    );

    if (dbConnected && order.id) {
      try {
        const client = getSupabaseBrowserClient();
        await client.from("projects").update({ split_delivery_active: true }).eq("id", order.id);

        // Update specifications quantities and notes in database
        await client
          .from("specifications")
          .update({
            quantity: 38,
            notes_cn: "已出港: 38 把 / ⚠️ 取消: 2 把 (现场划线核销)",
            notes_en: "Shipped: 38 pcs / ⚠️ Cancelled: 2 pcs (site strike-through)"
          })
          .eq("project_id", order.id)
          .eq("item_type_en", "Lobby Armchair");

        await client
          .from("specifications")
          .update({
            quantity: 4,
            notes_cn: "已到港: 4 张 / ⚠️ 取消: 1 张 (财务已退款)",
            notes_en: "Arrived: 4 pcs / ⚠️ Cancelled: 1 pc (refunded)"
          })
          .eq("project_id", order.id)
          .eq("item_type_en", "Custom Oak Coffee Table");

        // Recalculate payments directly in the database
        await client
          .from("payments")
          .update({ amount: 10450, status: "Paid", payment_date: "2026-05-25" })
          .eq("project_id", order.id)
          .ilike("milestone_en", "%50% Deposit%");
        await client
          .from("payments")
          .update({ amount: 7860, status: "Paid", payment_date: "2026-05-25" })
          .eq("project_id", order.id)
          .ilike("milestone_en", "%40% Shipping%");
        await client
          .from("payments")
          .update({
            milestone_cn: "10% 尾款划线重算 (未核销)",
            milestone_en: "10% Recalculated Balance (Pending)",
            amount: 470,
            status: "Pending"
          })
          .eq("project_id", order.id)
          .ilike("milestone_en", "%10% Handover%");

        await client.from("agent_logs").insert({
          project_id: order.id,
          operator: "Client",
          action_desc_cn:
            "現場反饋：因客戶硬裝現場變動，取消2把扶手椅與1張茶几。啟動劃線財務自動重算，餘款已核銷更新。",
          action_desc_en:
            "Site feedback: Cancelled 2 Armchairs & 1 Table due to fitout changes. Auto strike-through recalculation initiated."
        });
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }
  };

  const addLog = (user, actionCn, actionEn) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      {
        time: `2026-05-25 ${time}`,
        user,
        action: actionCn,
        actionEn: actionEn || actionCn
      },
      ...prev
    ]);
  };

  // Calculate order total
  const getOrderTotal = () => {
    return order.items.reduce((acc, item) => acc + Number(item.unitPrice || 0) * Number(item.qty || 0), 0);
  };

  function buildSubmittedOrderItems(quantityText = "", structuredBrief = null) {
    const structuredItems = Array.isArray(structuredBrief?.items) ? structuredBrief.items : [];
    if (structuredItems.length) {
      return structuredItems.map((structuredItem) => {
        const quantity = Number(structuredItem.quantity || String(quantityText || "").match(/\d+/)?.[0] || 1);
        return {
          id: structuredItem.id || "SUBMITTED-ITEM-01",
          typeCn: structuredItem.item_type_cn || structuredItem.item_type_en || "Customer bespoke item",
          typeEn: structuredItem.item_type_en || "Submitted Bespoke Item",
          qty: quantity,
          qtyDisplay: structuredItem.quantity_text || quantityText || String(quantity),
          dimensions: structuredItem.dimensions || {},
          dimensionsText: structuredItem.dimensions_text || formatDimensionPayload(structuredItem.dimensions || {}),
          tolerance: structuredItem.tolerance || structuredBrief.tolerance || "",
          materialCn: structuredItem.material_cn || structuredItem.material_en || "To confirm",
          materialEn: structuredItem.material_en || structuredItem.material_cn || "To confirm",
          fabricCode: structuredItem.fabric_code || "",
          finish: structuredItem.finish || "",
          color: structuredItem.color || "",
          hardware: structuredItem.hardware || "",
          usageLocation: structuredItem.usage_location || "",
          fireStandard: structuredItem.fire_standard || structuredBrief.fire_standard || "",
          imageUrl: structuredItem.image_url || structuredItem.imageUrl || "",
          originalUnitPrice: Number(structuredItem.original_unit_price || structuredItem.unit_price || 0),
          unitPrice: Number(structuredItem.unit_price || structuredItem.original_unit_price || 0),
          currency: structuredItem.currency || "USD",
          status: "Pending Quote",
          quotePending: true,
          note: structuredItem.notes_en || "Client submitted a structured furniture requirement through the portal."
        };
      });
    }

    const cleanQuantityText = String(quantityText || "").trim();
    const quantity = Number(cleanQuantityText.match(/\d+/)?.[0] || 1);

    return [
      {
        id: "SUBMITTED-ITEM-01",
        typeCn: "客户提交定制产品",
        typeEn: "Submitted Bespoke Item",
        qty: quantity,
        qtyDisplay: cleanQuantityText || String(quantity),
        materialCn: "待 Crafton 顾问与供应商确认",
        materialEn: "To be confirmed by Crafton consultant and supplier",
        originalUnitPrice: null,
        unitPrice: null,
        status: "Pending Quote",
        quotePending: true,
        note: "已接收需求；供应商报价完成后将主动通知客户。"
      }
    ];
  }

  // =====================================================================
  // THE CRAFTON - PREMIUM EDITORIAL MODULES
  // =====================================================================
  const renderStatusPill = (status) => {
    const meta = REVIEW_STATUS_META[status] || REVIEW_STATUS_META.pending;
    return <span className={`review-status-pill status-${meta.tone}`}>{adminText(meta.label, lang)}</span>;
  };

  const renderAiConciergePanel = ({ embedded = false } = {}) => {
    const overview = buildSupportProjectContext();
    const latestOrder = overview.latestOrder;

    const content = (
      <div className="ai-concierge-panel">
        <div className="panel-header ai-concierge-header">
          <div className="panel-title">
            <span className="stage-badge-dot dot-ai"></span>
            <span>{lang === "Cn" ? "Crafton 项目客服录入" : "Crafton Concierge Intake"}</span>
          </div>
          <span className="logo-badge">Live</span>
        </div>

        <div className="ai-context-strip">
          <strong>Current overview</strong>
          <span>
            {latestOrder
              ? `${latestOrder.projectName || "To confirm"} / ${latestOrder.destination || "Destination pending"} / ${
                  latestOrder.quantityText || "Quantity pending"
                }`
              : "No submitted order overview yet."}
          </span>
        </div>

        <div className="ai-concierge-messages">
          {supportMessages.map((message, idx) => (
            <div
              key={`${message.sender}-${idx}`}
              className={`chat-bubble ${message.sender === "client" ? "bubble-client" : "bubble-agent"}`}
            >
              {message.text}
            </div>
          ))}
          {supportIsTyping && <div className="chat-bubble bubble-agent">Crafton is updating the brief...</div>}
        </div>

        <form className="ai-concierge-input" onSubmit={handleSupportSend}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => document.getElementById("support-file-upload").click()}
            title="Upload reference file"
          >
            +
          </button>
          <input
            id="support-file-upload"
            type="file"
            style={{ display: "none" }}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.txt"
            onChange={handleSupportFileSelect}
          />
          <input
            className="chat-input"
            value={supportInput}
            onChange={(e) => setSupportInput(e.target.value)}
            placeholder="Tell us the requirement, change, or progress question..."
          />
          <button type="submit" className="btn-premium" disabled={!supportInput.trim() || supportIsTyping}>
            Send
          </button>
        </form>

        {supportSelectedFileName && <div className="ai-file-chip">File received: {supportSelectedFileName}</div>}

        <button
          type="button"
          className="btn-premium"
          onClick={handleSupportHandoffToIntake}
          disabled={isIntakeUploading || supportIsTyping}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {supportSubmittedJobId ? "View image analysis task" : "Submit brief to Crafton"}
        </button>

        {supportStatus && <div className="ai-support-status">{supportStatus}</div>}
      </div>
    );

    return embedded ? content : <div className="glass-card">{content}</div>;
  };

  const renderClientPrequoteWorkspace = () => {
    const jobs = clientProjectJobs.length > 0 ? clientProjectJobs : getLocalReviewJobs();
    const projectGroups = [];
    const groupIndex = new Map();

    jobs.forEach((job) => {
      const normalized = normalizeReviewJob(job);
      const groupKey =
        normalized.projectId ||
        [normalizeGroupingText(normalized.projectName), normalizeGroupingText(normalized.destination)]
          .filter(Boolean)
          .join("|") ||
        normalized.id;
      let group = groupIndex.get(groupKey);
      if (!group) {
        group = {
          key: groupKey,
          projectName: normalized.projectName || "To confirm",
          destination: normalized.destination || "",
          jobs: []
        };
        groupIndex.set(groupKey, group);
        projectGroups.push(group);
      }
      group.jobs.push({ job, normalized });
    });

    return (
      <div className="glass-card prequote-workspace">
        <div className="panel-header">
          <div className="panel-title">
            <span className="stage-badge-dot dot-human"></span>
            <span>{lang === "Cn" ? "报价前工作流" : "Pre-quote Workspace"}</span>
          </div>
          <span className="logo-badge">Intake Review</span>
        </div>
        <div className="panel-body prequote-client-list">
          {projectGroups.length === 0 ? (
            <div className="prequote-empty">
              {lang === "Cn"
                ? "还没有提交的 intake 项目。"
                : "No intake projects yet. Submit a brief and the review path will appear here."}
            </div>
          ) : (
            projectGroups.flatMap((group) =>
              group.jobs.map(({ job, normalized }, groupJobIndex) => {
                const answers = clientAnswerDrafts[job.id] || normalized.clientAnswers || {};
                const answerSubmitState = clientAnswerSubmitState[job.id] || {};
                const isSubmittingAnswers = answerSubmitState.status === "submitting";
                const questions =
                  normalized.reviewStatus === "revision_requested" && normalized.questions.length === 0
                    ? [normalized.reviewNotes || "Please provide the missing specification details."]
                    : normalized.questions;

                return (
                  <React.Fragment key={`${group.key}-${job.id}`}>
                    {groupJobIndex === 0 && (
                      <div className="prequote-project-group-header">
                        <div>
                          <div className="prequote-project-group-title">{group.projectName}</div>
                          <div className="prequote-project-group-meta">
                            {group.destination || "Destination pending"} / {group.jobs.length} order
                            {group.jobs.length > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="prequote-client-card">
                      <div className="prequote-card-topline">
                        <div>
                          <div className="prequote-project-name">{normalized.projectName}</div>
                          <div className="prequote-project-meta">
                            {normalized.destination || "Destination pending"} / Job {String(normalized.id).slice(0, 8)}
                          </div>
                        </div>
                        {renderStatusPill(normalized.reviewStatus)}
                      </div>

                      <div className="prequote-steps">
                        {["Submitted", "Cho Review", "Client Answers", "RFQ Draft"].map((step, idx) => {
                          const activeIdx =
                            normalized.reviewStatus === "rfq_ready"
                              ? 3
                              : normalized.reviewStatus === "approved"
                                ? 2
                                : normalized.reviewStatus === "revision_requested"
                                  ? 2
                                  : 1;
                          return (
                            <div key={step} className={`prequote-step ${idx <= activeIdx ? "active" : ""}`}>
                              <span></span>
                              {step}
                            </div>
                          );
                        })}
                      </div>

                      {normalized.summaryEn && <p className="prequote-summary">{normalized.summaryEn}</p>}

                      {questions.length > 0 && (
                        <div className="prequote-questions">
                          <div className="prequote-section-label">Clarification questions</div>
                          {questions.map((question, qidx) => (
                            <label key={`${job.id}-question-${qidx}`} className="prequote-answer-field">
                              <span>{question}</span>
                              <textarea
                                value={answers[qidx] || ""}
                                onChange={(e) =>
                                  setClientAnswerDrafts((prev) => ({
                                    ...prev,
                                    [job.id]: {
                                      ...(prev[job.id] || normalized.clientAnswers || {}),
                                      [qidx]: e.target.value
                                    }
                                  }))
                                }
                                onInput={() =>
                                  setClientAnswerSubmitState((prev) => {
                                    if (prev[job.id]?.status === "submitting") return prev;
                                    return {
                                      ...prev,
                                      [job.id]: {
                                        status: "editing",
                                        message: "Unsaved answer changes."
                                      }
                                    };
                                  })
                                }
                                placeholder="Type the client answer for Cho..."
                                disabled={isSubmittingAnswers}
                              />
                            </label>
                          ))}
                          <button
                            className="btn-premium"
                            onClick={() => handleSubmitClientAnswers(job)}
                            disabled={isSubmittingAnswers}
                            style={{
                              opacity: isSubmittingAnswers ? 0.72 : 1,
                              cursor: isSubmittingAnswers ? "wait" : "pointer"
                            }}
                          >
                            {isSubmittingAnswers
                              ? "Submitting answers..."
                              : answerSubmitState.status === "success"
                                ? "Submitted to Cho"
                                : "Submit answers to Cho"}
                          </button>
                          {answerSubmitState.message && (
                            <div
                              role="status"
                              aria-live="polite"
                              className={`client-answer-status status-${answerSubmitState.status}`}
                              style={{
                                marginTop: "0.65rem",
                                padding: "0.7rem 0.8rem",
                                borderRadius: "6px",
                                border:
                                  answerSubmitState.status === "success"
                                    ? "1px solid rgba(125, 143, 123, 0.35)"
                                    : answerSubmitState.status === "error"
                                      ? "1px solid rgba(166, 132, 128, 0.45)"
                                      : "1px solid rgba(124, 114, 103, 0.18)",
                                background:
                                  answerSubmitState.status === "success"
                                    ? "rgba(125, 143, 123, 0.08)"
                                    : answerSubmitState.status === "error"
                                      ? "rgba(166, 132, 128, 0.08)"
                                      : "rgba(124, 114, 103, 0.05)",
                                color:
                                  answerSubmitState.status === "success"
                                    ? "var(--accent-green)"
                                    : answerSubmitState.status === "error"
                                      ? "var(--accent-red)"
                                      : "var(--text-secondary)",
                                fontSize: "0.78rem",
                                lineHeight: 1.45
                              }}
                            >
                              {answerSubmitState.message}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )
          )}
        </div>
      </div>
    );
  };

  const renderClientOrderDashboard = () => {
    const forceEmptyDashboard =
      import.meta.env.DEV && new window.URLSearchParams(window.location.search).has("empty-dashboard");
    const dashboardJobs = [...getLocalReviewJobs(), ...clientProjectJobs].filter(
      (job, index, jobs) => jobs.findIndex((item) => String(item.id) === String(job.id)) === index
    );
    const jobs = forceEmptyDashboard ? [] : dashboardJobs;
    const projectGroups = buildProjectGroupsFromJobs(jobs).map((project) => ({
      ...project,
      jobs: project.jobs.map((job) =>
        trackerPreviewUrl && String(job.id) === String(latestIntakeJob?.id)
          ? { ...job, previewUrl: job.previewUrl || trackerPreviewUrl }
          : job
      )
    }));

    return (
      <ClientOrderDashboard
        lang={lang}
        clientName={user?.name || user?.company || ""}
        projectGroups={projectGroups}
        answerDrafts={clientAnswerDrafts}
        answerStates={clientAnswerSubmitState}
        loading={clientProjectsLoading}
        onNewOrder={() => setClientPortalTab("Intake")}
        onBrowseFurniture={() => {
          setSetFurnitureProduct("");
          setMarketingTab("SetFurniture");
          setCurrentStageView("Marketing");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onAnswerChange={(jobId, questionIndex, value, savedAnswers) =>
          setClientAnswerDrafts((previous) => ({
            ...previous,
            [jobId]: {
              ...(previous[jobId] || savedAnswers || {}),
              [questionIndex]: value
            }
          }))
        }
        onAnswerInput={(jobId) =>
          setClientAnswerSubmitState((previous) => {
            if (previous[jobId]?.status === "submitting") return previous;
            return {
              ...previous,
              [jobId]: {
                status: "editing",
                message: lang === "Cn" ? "答案尚未提交。" : "Unsaved answer changes."
              }
            };
          })
        }
        onSubmitAnswers={(jobId) => {
          const sourceJob = jobs.find((job) => String(job.id) === String(jobId));
          if (sourceJob) handleSubmitClientAnswers(sourceJob);
        }}
      />
    );
  };

  const getAdminStageLabel = (stage) => {
    const copy = adminStageCopy[stage.id];
    if (!copy) return lang === "Cn" ? stage.nameCn : stage.nameEn;
    return lang === "Cn" ? copy.cn : copy.en;
  };

  const renderAdminStatusPill = (status) => {
    if (
      ["passed", "ready", "selected", "sent", "recommended", "recalculated", "archived", "planned"].includes(status)
    ) {
      return <span className="admin-card-status status-green">{adminText(status.replaceAll("_", " "), lang)}</span>;
    }
    if (["blocked", "gate"].includes(status)) {
      return <span className="admin-card-status status-red">{adminText(status.replaceAll("_", " "), lang)}</span>;
    }
    if (
      [
        "needs_cho_review",
        "watch",
        "human_gate",
        "pending",
        "reviewing",
        "tracking",
        "in_production",
        "quoted"
      ].includes(status)
    ) {
      return <span className="admin-card-status status-orange">{adminText(status.replaceAll("_", " "), lang)}</span>;
    }
    return <span className="admin-card-status">{adminText(status.replaceAll("_", " "), lang)}</span>;
  };

  const formatAdminDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 10);
  };

  const formatAdminMoney = (value, currency = "USD") => {
    const number = Number(value || 0);
    if (!number) return "-";
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(number);
  };

  const renderAdminEmptyState = (title, detail) => (
    <div className="admin-empty-state">
      <strong>{adminText(title, lang)}</strong>
      {detail && <span>{adminText(detail, lang)}</span>}
    </div>
  );

  const renderAdminAccessNotice = () => {
    const notices = {
      checking: {
        titleCn: "正在验证管理员会话",
        titleEn: "Verifying administrator session",
        detailCn: "正在从当前浏览器恢复 Supabase 登录状态，请稍候。",
        detailEn: "Restoring the Supabase session stored in this browser."
      },
      loading: {
        titleCn: "正在读取客户订单",
        titleEn: "Loading customer orders",
        detailCn: "管理员身份已验证，正在读取 Supabase 实时数据。",
        detailEn: "Administrator access is verified and live Supabase data is loading."
      },
      unauthenticated: {
        titleCn: "当前浏览器尚未登录 Supabase 管理员账号",
        titleEn: "This browser is not signed in to the Supabase administrator account",
        detailCn: "不同浏览器不会共享登录会话。请使用 cho@crafton.com 和管理员密码登录。",
        detailEn: "Browser sessions are not shared. Sign in with the Cho administrator account to continue."
      },
      forbidden: {
        titleCn: "当前账号没有管理员权限",
        titleEn: "This account does not have administrator access",
        detailCn: "请退出当前客户账号，并使用 @crafton.com 管理员账号重新登录。",
        detailEn: "Sign out of the client account and sign in with an @crafton.com administrator account."
      },
      error: {
        titleCn: "客户订单读取失败",
        titleEn: "Customer orders could not be loaded",
        detailCn: "管理员会话存在，但 Supabase 查询失败。请重新登录后再试。",
        detailEn: "An administrator session exists, but the Supabase query failed. Sign in again and retry."
      }
    };
    const notice = notices[adminAccessStatus] || notices.checking;
    const canSignIn = ["unauthenticated", "forbidden", "error"].includes(adminAccessStatus);

    return (
      <div className="admin-empty-state">
        <strong>{lang === "Cn" ? notice.titleCn : notice.titleEn}</strong>
        <span>{lang === "Cn" ? notice.detailCn : notice.detailEn}</span>
        {canSignIn && (
          <button
            type="button"
            className="btn-premium"
            onClick={() => {
              setSignupEmail("cho@crafton.com");
              setAuthMode("login");
              setAuthError("");
              setShowAuthGate(true);
            }}
          >
            {lang === "Cn" ? "登录 Cho 管理员账号" : "Sign in as Cho administrator"}
          </button>
        )}
      </div>
    );
  };

  const getAdminTableMissingText = (tableName) =>
    adminDataStatus.missingTables.includes(tableName)
      ? `${tableName} 表尚未创建，请先运行 Supabase migration。`
      : `${tableName} 表暂时没有当前项目记录。`;

  const getWorkflowEventsForStage = (stageId) =>
    adminWorkflowEvents.filter((event) => String(event.stage_id || event.stage || "").toUpperCase() === stageId);

  const getApprovalsForStage = (stageId) =>
    adminApprovals.filter((approval) => String(approval.stage_id || approval.stage || "").toUpperCase() === stageId);

  const getShipmentDocumentsByStage = (stageId) =>
    adminShipmentDocuments.filter(
      (document) => String(document.stage_id || document.stage || "").toUpperCase() === stageId
    );

  const renderAdminMetric = (label, value, tone = "") => (
    <div className={`admin-metric-card ${tone}`}>
      <span>{adminText(label, lang)}</span>
      <strong>{value}</strong>
    </div>
  );

  const renderAdminChecklist = (items) => (
    <div className="admin-checklist">
      {items.map((item) => (
        <div key={item.label} className={`admin-check-row ${item.state || "done"}`}>
          <span>{item.state === "blocked" ? "!" : item.state === "pending" ? "..." : "✓"}</span>
          <div>
            <strong>{adminText(item.label, lang)}</strong>
            {item.detail && <small>{adminText(item.detail, lang)}</small>}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAdminMiniTable = (headers, rows) => (
    <div className="admin-table-wrap">
      <table className="admin-mini-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{adminText(header, lang)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAdminStagePanel = ({ stageId, title, status, subtitle, children, className = "", actions = null }) => (
    <section className={`admin-stage-panel ${className}`}>
      <div className="admin-panel-topline">
        <div>
          <div className="admin-panel-kicker">{stageId}</div>
          <h4>{adminText(title, lang)}</h4>
          {subtitle && <p>{adminText(subtitle, lang)}</p>}
        </div>
        {renderAdminStatusPill(status)}
      </div>
      <div className="admin-panel-content">{children}</div>
      {actions && <div className="admin-panel-actions">{actions}</div>}
    </section>
  );

  const getAdminDraftContext = () => {
    const jobs = intakeReviewJobs.length > 0 ? intakeReviewJobs : dbConnected ? [] : getLocalReviewJobs();
    const selectedJob = jobs.find((job) => job.id === selectedReviewJobId) || jobs[0];
    const selectedNormalized = selectedJob ? normalizeReviewJob(selectedJob) : null;
    const draft = reviewDraft || selectedNormalized;
    const bomItems = draft?.items?.length ? draft.items : dbConnected ? [] : order.items;
    return { jobs, selectedJob, selectedNormalized, draft, bomItems };
  };

  const renderIntakeFlowWorkspace = () => {
    const { jobs, selectedJob, draft, bomItems } = getAdminDraftContext();
    const clientGroups = buildClientGroupsFromJobs(jobs);
    const hasActiveIntake = Boolean(draft) || (!dbConnected && Boolean(order.orderId));
    const hasVerifiedAdminAccess = !dbConnected || (supabaseAuthReady && adminAccessStatus === "ready");
    const sourceFile = selectedJob ? getIntakeFileFromJob(selectedJob) : null;
    const orderPreviewUrl = adminIntakePreview.url || trackerPreviewUrl;
    const uploadedAssets = [
      sourceFile
        ? {
            id: sourceFile.id || sourceFile.storage_path || sourceFile.original_name,
            name: sourceFile.original_name || "Uploaded source file",
            type: sourceFile.mime_type || "file",
            size: sourceFile.file_size ? `${Math.round(Number(sourceFile.file_size) / 1024)} KB` : "Saved in Supabase"
          }
        : null,
      draft?.fileName && (!sourceFile || draft.fileName !== sourceFile.original_name)
        ? { id: draft.fileName, name: draft.fileName, type: "client reference", size: "Attached to intake" }
        : null
    ].filter(Boolean);
    const hasUploadedEvidence = uploadedAssets.length > 0 || Boolean(orderPreviewUrl);

    const bomRows = bomItems.map((item) => [
      item.typeEn || item.typeCn || item.item_type_en || item.item_type_cn || "-",
      item.qtyDisplay || item.qty || item.quantity || "-",
      item.dimensionsText ||
        item.dimensions_text ||
        formatDimensionPayload(item.dimensions || {}) ||
        draft?.dimensions ||
        "-",
      item.materialEn || item.materialCn || item.material_en || item.material_cn || "To confirm",
      [item.style, item.finish, item.color, item.fabricCode || item.fabric_code, item.hardware]
        .filter(Boolean)
        .join(" / ") || "Finish pending",
      item.unitPrice || item.unit_price ? formatAdminMoney(item.unitPrice || item.unit_price) : "Target pending",
      item.notesEn || item.notesCn || item.note || item.notes_en || item.notes_cn || "-"
    ]);

    const requirementRows = bomItems.map((item) => [
      item.typeEn || item.typeCn || item.item_type_en || item.item_type_cn || "Submitted item",
      item.qtyDisplay || item.qty || item.quantity || "Pending",
      item.dimensionsText || item.dimensions_text || formatDimensionPayload(item.dimensions || {}) || "Pending",
      item.materialEn || item.materialCn || item.material_en || item.material_cn || "To confirm",
      [item.usageLocation, item.fireStandard || draft?.fireStandard].filter(Boolean).join(" / ") || "Usage pending",
      item.note || item.notesEn || item.notesCn || item.notes_en || item.notes_cn || "-"
    ]);

    const approvalRows = getApprovalsForStage("S04").map((approval) => [
      approval.approval_type || approval.id,
      approval.status || "pending",
      approval.reviewer_name || approval.actor || approval.created_by || "-",
      formatAdminDate(approval.reviewed_at || approval.created_at)
    ]);

    const derivedMissingQuestions = [
      draft?.clientName || order.clientName ? null : "Customer name is missing.",
      draft?.destination || order.projectLocation ? null : "Delivery destination is missing.",
      bomItems.length ? null : "Furniture item, quantity, or material rows are missing.",
      draft?.desiredDeliveryDate || draft?.deliveryWindow ? null : "Desired delivery date is missing.",
      draft?.dimensions || bomItems.some((item) => item.dimensionsText) ? null : "Furniture dimensions are missing.",
      hasUploadedEvidence ? null : "Furniture drawing, photo, or source file is missing."
    ].filter(Boolean);
    const missingQuestions = Array.from(new Set([...(draft?.questions || []), ...derivedMissingQuestions]));
    const hasMissingInfo = missingQuestions.length > 0;
    const isIntakeApproved = ["approved", "rfq_ready"].includes(draft?.reviewStatus);
    const liveRfqPackage = adminRfqBatches.find((batch) => batch.intake_job_id === selectedJob?.id);

    const completenessItems = [
      {
        label: "Customer and project",
        value: draft?.clientName || order.clientName,
        state: draft?.clientName || order.clientName ? "done" : "pending"
      },
      {
        label: "Delivery destination",
        value: draft?.destination || order.projectLocation,
        state: draft?.destination || order.projectLocation ? "done" : "pending"
      },
      {
        label: "Target delivery date",
        value: draft?.desiredDeliveryDate || draft?.deliveryWindow,
        state: draft?.desiredDeliveryDate || draft?.deliveryWindow ? "done" : "pending"
      },
      {
        label: "Furniture items and quantity",
        value: draft?.quantityText || `${bomItems.length} item rows`,
        state: bomItems.length ? "done" : "pending"
      },
      {
        label: "Dimensions and material",
        value:
          [draft?.dimensions, bomItems[0]?.materialEn || bomItems[0]?.materialCn || ""].filter(Boolean).join(" / ") ||
          "",
        state: draft?.dimensions && (bomItems[0]?.materialEn || bomItems[0]?.materialCn) ? "done" : "pending"
      },
      {
        label: "Drawings / photos / files",
        value: hasUploadedEvidence ? `${uploadedAssets.length || 1} uploaded` : "No upload found",
        state: hasUploadedEvidence ? "done" : "pending"
      },
      ...(String(sourceFile?.mime_type || "").startsWith("image/")
        ? [
            {
              label: "Image understanding",
              value:
                draft?.visualAnalysis?.image_summary_en ||
                (draft?.visualAnalysis?.status === "completed"
                  ? "Visual evidence extracted"
                  : "Manual image review required"),
              state: draft?.visualAnalysis?.status === "completed" ? "done" : "pending"
            }
          ]
        : []),
      {
        label: "Open clarification questions",
        value: hasMissingInfo ? `${missingQuestions.length} missing` : "No missing fields",
        state: hasMissingInfo ? "pending" : "done"
      }
    ];

    const handleGenerateBomDraft = () => {
      if (!bomRows.length) {
        const message = "BOM/spec draft cannot be generated yet because no order item rows were parsed.";
        setIntakeBomDraftMessage(message);
        setPrequoteNotice(message);
        return;
      }

      if (hasMissingInfo) {
        const message = `BOM/spec draft is blocked: ${missingQuestions.join(" / ")}`;
        setIntakeBomDraftMessage(message);
        setPrequoteNotice(message);
        return;
      }

      setIntakeBomDraftGenerated(true);
      const message =
        "BOM and bilingual specification draft generated. Review S03 dimensions, tolerance, material, thumbnail, and BOM rows before approval.";
      setIntakeBomDraftMessage(message);
      setPrequoteNotice(message);
    };

    return (
      <div className="intake-command-workspace">
        <section className="intake-command-header">
          <div>
            <span className="logo-badge">S01-S05 / Integrated intake review</span>
            <h4>
              {draft?.projectName ||
                (!dbConnected ? order.orderId : "") ||
                (!hasVerifiedAdminAccess
                  ? lang === "Cn"
                    ? "需要验证管理员身份"
                    : "Administrator verification required"
                  : lang === "Cn"
                    ? "当前没有客户订单"
                    : "No active customer order")}
            </h4>
            <p>
              Read the customer order first, then review missing fields, generate the BOM/spec draft, and approve the
              package.
            </p>
          </div>
          <div className="intake-command-status">
            {renderAdminStatusPill(
              liveRfqPackage
                ? "rfq_ready"
                : isIntakeApproved
                  ? "approved"
                  : hasMissingInfo
                    ? "reviewing"
                    : bomRows.length
                      ? "ready"
                      : "pending"
            )}
            <span>{dbConnected ? "Supabase data" : "Local preview"}</span>
          </div>
        </section>

        {clientGroups.length > 0 && (
          <section className="intake-client-project-directory" aria-label="Customer project directory">
            <div className="intake-directory-heading">
              <div>
                <span className="logo-badge">Customer directory</span>
                <h5>Customers and their order projects</h5>
                <p>Choose a customer first, then open the relevant project for review.</p>
              </div>
              <span>
                {lang === "Cn"
                  ? `${clientGroups.length} 个客户 / ${jobs.length} 条订单接入记录`
                  : `${clientGroups.length} customers / ${jobs.length} intake records`}
              </span>
            </div>

            <div className="intake-client-tree">
              {clientGroups.map((clientGroup) => {
                const isExpanded = clientGroup.key === expandedIntakeClientKey;
                const selectedProject = clientGroup.projects.find((project) =>
                  project.jobs.some((job) => job.id === selectedJob?.id)
                );

                return (
                  <div className={`intake-client-group ${isExpanded ? "expanded" : ""}`} key={clientGroup.key}>
                    <button
                      type="button"
                      className={`intake-client-toggle ${selectedProject ? "contains-active" : ""}`}
                      aria-expanded={isExpanded}
                      onClick={() => {
                        setExpandedIntakeClientKey((currentKey) =>
                          currentKey === clientGroup.key ? "" : clientGroup.key
                        );
                      }}
                    >
                      <span className="intake-client-monogram" aria-hidden="true">
                        {clientGroup.clientName.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="intake-client-toggle-copy">
                        <strong>{clientGroup.clientName}</strong>
                        <small>
                          {lang === "Cn"
                            ? `${clientGroup.projects.length} 个项目${clientGroup.reviewCount ? ` / ${clientGroup.reviewCount} 个待审核` : ""}`
                            : `${clientGroup.projects.length} project${clientGroup.projects.length === 1 ? "" : "s"}${clientGroup.reviewCount ? ` / ${clientGroup.reviewCount} awaiting review` : ""}`}
                        </small>
                      </span>
                      <span className="intake-client-disclosure" aria-hidden="true">
                        {isExpanded ? "-" : "+"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="intake-project-submenu">
                        {clientGroup.projects.map((project) => {
                          const latestProjectJob = project.jobs[0];
                          const isActive = project.jobs.some((job) => job.id === selectedJob?.id);
                          const submissionCount = project.jobs.length;
                          return (
                            <button
                              key={project.key}
                              type="button"
                              className={`intake-project-menu-item ${isActive ? "active" : ""}`}
                              onClick={() => {
                                setExpandedIntakeClientKey(clientGroup.key);
                                setSelectedReviewJobId(latestProjectJob.id);
                              }}
                            >
                              <span className="intake-project-menu-copy">
                                <strong>{project.projectName}</strong>
                                <small>
                                  {project.destination || "Destination pending"} /{" "}
                                  {formatAdminDate(latestProjectJob.createdAt)}
                                </small>
                              </span>
                              <span className="intake-project-menu-meta">
                                {submissionCount > 1 && (
                                  <small>
                                    {lang === "Cn" ? `${submissionCount} 次提交` : `${submissionCount} submissions`}
                                  </small>
                                )}
                                {renderStatusPill(latestProjectJob.reviewStatus)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!hasVerifiedAdminAccess ? (
          renderAdminAccessNotice()
        ) : !hasActiveIntake ? (
          renderAdminEmptyState(
            "No live intake draft",
            "When a client submits an order, intake_jobs and intake_files records will appear here as one readable review packet."
          )
        ) : (
          <>
            <div className="intake-review-grid">
              <section className="intake-order-brief-panel">
                <div className="intake-section-heading">
                  <span>S01</span>
                  <div>
                    <h5>Customer order packet</h5>
                    <p>
                      Client identity, uploaded source material, order content, drawings, photos, and files in one
                      place.
                    </p>
                  </div>
                </div>

                <div className="intake-client-strip">
                  <div>
                    <span>Client</span>
                    <strong>{draft?.clientName || order.clientName || "Pending client"}</strong>
                  </div>
                  <div>
                    <span>Destination</span>
                    <strong>{draft?.destination || order.projectLocation || "Pending"}</strong>
                  </div>
                  <div>
                    <span>Target delivery</span>
                    <strong>{draft?.desiredDeliveryDate || draft?.deliveryWindow || "Pending"}</strong>
                  </div>
                  <div>
                    <span>Submitted</span>
                    <strong>{formatAdminDate(draft?.createdAt || selectedJob?.created_at || order.createdDate)}</strong>
                  </div>
                </div>

                <div className="intake-upload-zone">
                  <div className="intake-preview-frame">
                    {orderPreviewUrl ? (
                      <img src={orderPreviewUrl} alt="Customer uploaded furniture reference" />
                    ) : (
                      <div className="intake-preview-fallback">
                        {renderChairSVG(selectedFabric, selectedLeg)}
                        <span>{adminIntakePreview.message || "Reference thumbnail"}</span>
                      </div>
                    )}
                  </div>
                  <div className="intake-upload-list">
                    <strong>Uploaded drawings / photos / files</strong>
                    {uploadedAssets.length ? (
                      uploadedAssets.map((asset) => (
                        <div className="intake-file-card" key={asset.id}>
                          <span>{asset.type}</span>
                          <strong>{asset.name}</strong>
                          <small>{asset.size}</small>
                        </div>
                      ))
                    ) : (
                      <div className="intake-file-card muted">
                        <span>No source file found</span>
                        <strong>Waiting for intake_files</strong>
                        <small>Customer upload will appear here after Supabase receives it.</small>
                      </div>
                    )}
                  </div>
                </div>

                {requirementRows.length
                  ? renderAdminMiniTable(
                      ["Order item", "Qty", "Dimensions", "Material request", "Usage / compliance", "Client notes"],
                      requirementRows
                    )
                  : renderAdminEmptyState(
                      "No order items",
                      "The specification service has not produced item rows yet."
                    )}
              </section>

              <section className="intake-ai-review-panel">
                <div className="intake-section-heading">
                  <span>S02</span>
                  <div>
                    <h5>Specification gap review</h5>
                    <p>Checks whether the customer brief has enough data for BOM and bilingual spec generation.</p>
                  </div>
                </div>

                <div className="intake-completeness-list">
                  {completenessItems.map((item) => (
                    <div className={`intake-completeness-row ${item.state}`} key={item.label}>
                      <span>{item.state === "done" ? "OK" : "Need"}</span>
                      <div>
                        <strong>{item.label}</strong>
                        <small>{item.value || "Pending"}</small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`intake-ai-gap-box ${hasMissingInfo ? "needs-info" : "complete"}`}>
                  <strong>
                    {hasMissingInfo ? "Client must complete these fields" : "Review result: ready for BOM"}
                  </strong>
                  {hasMissingInfo ? (
                    <ul>
                      {missingQuestions.map((question, idx) => (
                        <li key={`${question}-${idx}`}>{question}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No blocking questions remain. Cho can generate the BOM and bilingual specification draft.</p>
                  )}
                </div>

                <div className="intake-action-stack">
                  <button className="btn-secondary" onClick={handleAskClientForRevision} disabled={!hasMissingInfo}>
                    Ask client to complete missing info
                  </button>
                  <button className="btn-premium" onClick={handleGenerateBomDraft} disabled={!bomRows.length}>
                    {intakeBomDraftGenerated ? "BOM/spec draft generated" : "Generate BOM and spec draft"}
                  </button>
                </div>
                {intakeBomDraftMessage && (
                  <div
                    className={`intake-generation-status ${intakeBomDraftGenerated ? "success" : "blocked"}`}
                    role="status"
                  >
                    {intakeBomDraftMessage}
                  </div>
                )}
              </section>
            </div>

            <section className="intake-bom-spec-panel">
              <div className="intake-section-heading">
                <span>S03</span>
                <div>
                  <h5>BOM and bilingual specification draft</h5>
                  <p>Generated draft for Cho to check: BOM rows, dimensions, tolerance, material, and thumbnail.</p>
                </div>
              </div>

              {bomRows.length ? (
                <>
                  <div className="intake-spec-summary-grid">
                    <div className="intake-spec-thumb">
                      {orderPreviewUrl ? (
                        <img src={orderPreviewUrl} alt="Generated specification thumbnail" />
                      ) : (
                        renderChairSVG(selectedFabric, selectedLeg)
                      )}
                    </div>
                    <div className="admin-detail-block">
                      <strong>Draft status</strong>
                      <span>
                        {intakeBomDraftGenerated ? "Generated in this review" : "Available from intake/specifications"}
                      </span>
                      <span>{hasMissingInfo ? "Blocked by missing fields" : "Ready for Cho check"}</span>
                    </div>
                    <div className="admin-detail-block">
                      <strong>Dimensions and tolerance</strong>
                      <span>{draft?.dimensions || bomItems[0]?.dimensionsText || "Dimensions pending"}</span>
                      <span>{draft?.tolerance || bomItems[0]?.tolerance || "Tolerance: to be confirmed by Cho"}</span>
                    </div>
                    <div className="admin-detail-block">
                      <strong>Material basis</strong>
                      <span>
                        {[bomItems[0]?.materialEn || bomItems[0]?.materialCn, bomItems[0]?.finish, bomItems[0]?.color]
                          .filter(Boolean)
                          .join(" / ") || "Material to confirm"}
                      </span>
                      <span>
                        {draft?.fireStandard ||
                          bomItems[0]?.fireStandard ||
                          (isCrib5Blocked ? "Crib 5 blocked" : "Compliance pending")}
                      </span>
                    </div>
                    <div className="admin-detail-block">
                      <strong>Delivery and budget</strong>
                      <span>{draft?.desiredDeliveryDate || draft?.deliveryWindow || "Delivery date pending"}</span>
                      <span>
                        {draft?.targetBudget
                          ? `${draft.targetBudget} ${draft.currency || ""}`.trim()
                          : "Target budget pending"}
                      </span>
                    </div>
                  </div>
                  {renderAdminMiniTable(
                    ["Item", "Qty", "Dimensions", "Material", "Finish / color / hardware", "Target / Unit", "Notes"],
                    bomRows
                  )}
                </>
              ) : (
                renderAdminEmptyState(
                  "BOM not generated",
                  "Complete the missing customer fields first, then generate BOM and specs."
                )
              )}
            </section>

            <section className="intake-approval-panel">
              <div className="intake-section-heading">
                <span>S04-S05</span>
                <div>
                  <h5>Cho final approval</h5>
                  <p>
                    Approve after BOM, bilingual spec, material, compliance, dimensions, tolerance, and thumbnail are
                    checked.
                  </p>
                </div>
              </div>

              {approvalRows.length
                ? renderAdminMiniTable(["Approval", "Status", "Reviewer", "Date"], approvalRows)
                : null}
              {isIntakeApproved && (
                <div className="intake-approval-confirmation" role="status">
                  <strong>BOM and specifications approved</strong>
                  <span>
                    {draft?.projectId
                      ? "The order is linked to a live Supabase project and can proceed to RFQ preparation."
                      : "The intake is approved. Complete the project link before creating the RFQ package."}
                  </span>
                </div>
              )}
              {prequoteNotice && <div className="prequote-notice">{prequoteNotice}</div>}
              <textarea
                className="admin-review-textarea"
                value={adminText(reviewNote, lang)}
                onChange={(e) => setReviewNote(e.target.value)}
                disabled={intakeApprovalSaving}
                placeholder="Cho review note for drawing, BOM, material, dimensions, tolerance, and RFQ readiness..."
              />
              <div className="intake-approval-actions">
                <button className="btn-secondary" onClick={handleAskClientForRevision} disabled={!hasMissingInfo}>
                  Request clarification
                </button>
                <button
                  className={`btn-premium ${isIntakeApproved && draft?.projectId ? "approval-complete" : ""}`}
                  onClick={handleApproveIntakeReview}
                  disabled={
                    hasMissingInfo ||
                    !bomRows.length ||
                    intakeApprovalSaving ||
                    (isIntakeApproved && Boolean(draft?.projectId))
                  }
                >
                  {intakeApprovalSaving
                    ? "Saving approval..."
                    : isIntakeApproved && draft?.projectId
                      ? "Approved"
                      : isIntakeApproved
                        ? "Complete project link"
                        : "Approve checked BOM and specs"}
                </button>
                <button
                  className="btn-premium"
                  onClick={liveRfqPackage ? () => setActiveAdminFlow("sourcing") : handleCreateRfqDraft}
                  disabled={hasMissingInfo || !bomRows.length || !isIntakeApproved || intakeApprovalSaving}
                >
                  {liveRfqPackage ? "Open RFQ workspace" : "Create RFQ package"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    );
  };

  const renderSourcingFlowWorkspace = () => {
    const quoteRows = adminSupplierQuotes.map((quote) => {
      const supplierName = quote.supplier_name || quote.suppliers?.name || quote.vendor_name || "Unnamed supplier";
      const unitPrice = quote.unit_price || quote.price_per_unit || quote.price_per_chair || quote.total_amount;
      const leadTime = quote.lead_time_days || quote.delivery_days || quote.lead_time || "-";
      const qualityScore = quote.quality_score || quote.score || quote.ai_score || "-";
      const verdict = quote.ai_verdict || quote.recommendation || quote.status || "Pending Cho review";
      return [
        supplierName,
        formatAdminMoney(unitPrice, quote.currency || "USD"),
        `${leadTime}${Number(leadTime) ? " days" : ""}`,
        qualityScore,
        verdict
      ];
    });

    const rfqRows = adminRfqBatches.map((batch) => [
      batch.rfq_code || batch.code || batch.id,
      batch.status || "draft",
      batch.supplier_count || batch.invited_count || adminSupplierQuotes.length || "-",
      formatAdminDate(batch.sent_at || batch.created_at),
      formatAdminDate(batch.due_at || batch.deadline_at)
    ]);

    const quoteDecisionRows = adminSupplierQuotes.map((quote) => {
      const supplierName = quote.supplier_name || quote.suppliers?.name || quote.vendor_name || "Unnamed supplier";
      return {
        id: quote.id || supplierName,
        supplier: {
          name: supplierName,
          pricePerChair: Number(quote.unit_price || quote.price_per_unit || quote.price_per_chair || 0),
          deliveryDays: Number(quote.lead_time_days || quote.delivery_days || 0),
          qualityScore: quote.quality_score || quote.score || "-",
          note: quote.notes || quote.ai_verdict || quote.recommendation || "Supabase supplier quote"
        },
        paymentTerms: quote.payment_terms || quote.terms || "-",
        status: quote.status || "quoted"
      };
    });

    return (
      <div className="admin-flow-grid sourcing-flow">
        {renderAdminStagePanel({
          stageId: "S06",
          title: "Supplier RFQ dispatch and return tracking",
          status: adminRfqBatches.length ? "sent" : "pending",
          subtitle:
            "Reads Supabase rfq_batches and supplier_quotes to show RFQ batches, invited suppliers, quote status, and due dates.",
          className: "wide",
          children: (
            <>
              <div className="admin-metric-grid">
                {renderAdminMetric("RFQ batches", adminRfqBatches.length)}
                {renderAdminMetric(
                  "Returned quotes",
                  adminSupplierQuotes.length,
                  adminSupplierQuotes.length ? "good" : "warn"
                )}
                {renderAdminMetric("Source", dbConnected ? "Supabase" : "Disconnected", dbConnected ? "good" : "warn")}
              </div>
              {rfqRows.length
                ? renderAdminMiniTable(["RFQ", "Status", "Suppliers", "Sent", "Due"], rfqRows)
                : renderAdminEmptyState("No RFQ batch records", getAdminTableMissingText("rfq_batches"))}
            </>
          )
        })}
        {renderAdminStagePanel({
          stageId: "S07",
          title: "Supplier quote comparison",
          status: adminSupplierQuotes.length ? "quoted" : "pending",
          subtitle:
            "This table reads unit price, lead time, quality score, terms, and evaluation notes from supplier_quotes.",
          className: "wide",
          children: quoteRows.length ? (
            <>
              {renderAdminMiniTable(["Supplier", "Unit / Total", "Lead", "Quality", "Evaluation"], quoteRows)}
              <div className="admin-note-box success">
                Comparison data is coming from Supabase supplier_quotes. Cho can make the S08 decision from live quote
                records.
              </div>
            </>
          ) : (
            renderAdminEmptyState("No supplier quotes yet", getAdminTableMissingText("supplier_quotes"))
          )
        })}
        {renderAdminStagePanel({
          stageId: "S08",
          title: "Cho best quote decision",
          status: selectedSupplier ? "selected" : adminSupplierQuotes.length ? "needs_cho_review" : "pending",
          subtitle:
            "Selecting a live supplier quote updates the project supplier, specification pricing, payment plan, and logs through the existing flow.",
          className: "wide",
          children: quoteDecisionRows.length ? (
            <div className="admin-supplier-decision-grid">
              {quoteDecisionRows.map((quote) => {
                const isSelected = selectedSupplier?.name === quote.supplier.name;
                return (
                  <button
                    key={quote.id}
                    type="button"
                    className={`admin-supplier-decision ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectSupplier(quote.supplier)}
                  >
                    <strong>{quote.supplier.name}</strong>
                    <span>{formatAdminMoney(quote.supplier.pricePerChair)} / unit</span>
                    <span>
                      {quote.supplier.deliveryDays || "-"} days ? quality {quote.supplier.qualityScore}
                    </span>
                    <small>
                      {quote.paymentTerms} ? {quote.status}
                    </small>
                  </button>
                );
              })}
            </div>
          ) : (
            renderAdminEmptyState(
              "Waiting for live supplier quotes",
              "Supplier decision cards appear only after supplier_quotes records exist for this project."
            )
          )
        })}
      </div>
    );
  };

  const renderProductionFlowWorkspace = () => {
    const kickoffEvents = getWorkflowEventsForStage("S09");
    const riskEvents = getWorkflowEventsForStage("S10");
    const inspectionRows = adminInspectionReports.map((report) => [
      report.report_code || report.id,
      report.item_name || report.work_package || "-",
      report.ai_match_score ? `${report.ai_match_score}%` : report.match_score ? `${report.match_score}%` : "-",
      report.status || "pending",
      formatAdminDate(report.created_at || report.inspected_at)
    ]);

    return (
      <div className="admin-flow-grid production-flow">
        {renderAdminStagePanel({
          stageId: "S09",
          title: "Production scan-linked status",
          status: kickoffEvents.length ? "in_production" : "pending",
          subtitle: "Reads S09 workflow_events for factory scans, process starts, photo uploads, and evidence records.",
          className: "wide",
          children: kickoffEvents.length ? (
            <>
              <div className="admin-metric-grid">
                {renderAdminMetric("Production events", kickoffEvents.length, "good")}
                {renderAdminMetric("Project", order.orderId || "-")}
                {renderAdminMetric("Source", "workflow_events")}
              </div>
              {renderAdminMiniTable(
                ["Time", "Actor", "Event", "Message"],
                kickoffEvents.map((event) => [
                  formatAdminDate(event.created_at),
                  event.actor || "system",
                  event.event_type || "production_update",
                  lang === "Cn" ? event.message_cn : event.message_en
                ])
              )}
            </>
          ) : (
            renderAdminEmptyState(
              "No production scan records",
              "S09 workflow_events will appear here after the factory or worker writes real production milestones."
            )
          )
        })}
        {renderAdminStagePanel({
          stageId: "S10",
          title: "Delay risk follow-up",
          status: riskEvents.length ? "watch" : "pending",
          subtitle:
            "Reads S10 workflow_events for delay risk scoring, reminders, supplier follow-up, and missing evidence.",
          children: riskEvents.length ? (
            <>
              <div className="admin-risk-meter">
                <span>Delay risk</span>
                <strong>{riskEvents[0]?.payload?.risk_level || riskEvents[0]?.event_type || "Review"}</strong>
                <div>
                  <i style={{ width: `${Number(riskEvents[0]?.payload?.risk_score || 50)}%` }} />
                </div>
              </div>
              {renderAdminMiniTable(
                ["Time", "Owner", "Risk / Action", "Evidence"],
                riskEvents.map((event) => [
                  formatAdminDate(event.created_at),
                  event.actor || "system",
                  lang === "Cn" ? event.message_cn : event.message_en,
                  event.payload?.evidence || event.payload?.next_action || "-"
                ])
              )}
            </>
          ) : (
            renderAdminEmptyState(
              "No delay risk records",
              "S10 workflow_events will show the real reminder and escalation chain once available."
            )
          )
        })}
        {renderAdminStagePanel({
          stageId: "S11",
          title: "Visual inspection",
          status: inspectionRows.length ? "passed" : "pending",
          subtitle: "Reads inspection_reports for CAD/photo match score, issue tags, status, and Cho review results.",
          className: "wide",
          children: inspectionRows.length
            ? renderAdminMiniTable(["Report", "Item", "Match", "Status", "Date"], inspectionRows)
            : renderAdminEmptyState("No inspection reports", getAdminTableMissingText("inspection_reports")),
          actions: inspectionRows.length ? (
            <button className="btn-premium" onClick={() => setCurrentStageIndex(11)}>
              Release to packing
            </button>
          ) : null
        })}
      </div>
    );
  };

  const renderShippingFlowWorkspace = () => {
    const loadingDocs = getShipmentDocumentsByStage("S12");
    const complianceDocs = getShipmentDocumentsByStage("S13");
    const trackingEvents = getWorkflowEventsForStage("S14");
    const handoverApprovals = getApprovalsForStage("S16");
    const archiveFiles = adminProjectFiles.filter((file) =>
      ["S17", "archive", "ARCHIVE"].includes(String(file.stage_id || file.stage || file.file_group || ""))
    );
    const splitRows = order.items.map((item) => [
      item.typeEn || item.typeCn,
      item.qty,
      splitDeliveryActive ? Math.max(Number(item.qty || 0) - 1, 0) : item.qty,
      splitDeliveryActive ? formatAdminMoney(Number(item.unitPrice || 0) * -1) : formatAdminMoney(0)
    ]);

    return (
      <div className="admin-flow-grid shipping-flow">
        {renderAdminStagePanel({
          stageId: "S12",
          title: "Container loading plan",
          status: loadingDocs.length ? "planned" : "pending",
          subtitle:
            "Reads S12 shipment_documents for container plan versions, file status, volume, and loading evidence.",
          children: loadingDocs.length ? (
            <>
              <div className="admin-metric-grid">
                {renderAdminMetric("Loading docs", loadingDocs.length, "good")}
                {renderAdminMetric(
                  "Latest version",
                  loadingDocs[0]?.version || loadingDocs[0]?.document_version || "-"
                )}
                {renderAdminMetric("Status", loadingDocs[0]?.status || "-")}
              </div>
              {renderAdminMiniTable(
                ["Document", "Type", "Status", "Updated"],
                loadingDocs.map((doc) => [
                  doc.document_name || doc.file_name || doc.id,
                  doc.document_type || doc.doc_type || "loading_plan",
                  doc.status || "draft",
                  formatAdminDate(doc.updated_at || doc.created_at)
                ])
              )}
            </>
          ) : (
            renderAdminEmptyState("No loading plan records", getAdminTableMissingText("shipment_documents"))
          )
        })}
        {renderAdminStagePanel({
          stageId: "S13",
          title: "Export compliance document check",
          status: complianceDocs.length ? "gate" : "pending",
          subtitle:
            "Reads S13 shipment_documents to verify IPPC, commercial invoice, packing list, customs declaration, and bill of lading status.",
          className: "wide",
          children: complianceDocs.length
            ? renderAdminMiniTable(
                ["Document", "Type", "Status", "Check"],
                complianceDocs.map((doc) => [
                  doc.document_name || doc.file_name || doc.id,
                  doc.document_type || doc.doc_type || "compliance",
                  doc.status || "pending",
                  doc.check_result || doc.notes || "-"
                ])
              )
            : renderAdminEmptyState(
                "No export compliance documents",
                "S13 shipment_documents will appear here after real shipment documents are uploaded."
              )
        })}
        {renderAdminStagePanel({
          stageId: "S14",
          title: "Freight tracking",
          status: trackingEvents.length ? "tracking" : "pending",
          subtitle: "Reads S14 workflow_events for vessel, port, ETA, and logistics change history.",
          children: trackingEvents.length ? (
            <div className="admin-timeline-mini">
              {trackingEvents.map((event) => (
                <div key={event.id}>
                  <strong>{event.payload?.location || event.event_type || "Shipping update"}</strong>
                  <span>
                    {lang === "Cn" ? event.message_cn : event.message_en} ? {formatAdminDate(event.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            renderAdminEmptyState(
              "No freight tracking events",
              "S14 workflow_events will sync shipping status to Backoffice and the client portal."
            )
          )
        })}
        {renderAdminStagePanel({
          stageId: "S15",
          title: "Split delivery audit",
          status: splitDeliveryActive ? "recalculated" : "pending",
          subtitle:
            "Reads live project specifications and payment state to support partial cancellation, split delivery, and quantity adjustments.",
          children: splitRows.length
            ? renderAdminMiniTable(["Item", "Original", "Revised", "Financial impact"], splitRows)
            : renderAdminEmptyState(
                "No project specifications",
                "specifications rows are required before quantity audit can be shown."
              ),
          actions: splitRows.length ? (
            <button className="btn-premium" onClick={triggerSplitDelivery}>
              Apply split delivery
            </button>
          ) : null
        })}
        {renderAdminStagePanel({
          stageId: "S16",
          title: "Client handover acceptance",
          status: handoverApprovals.length ? "human_gate" : "pending",
          subtitle: "Reads S16 approvals for client sign-off, final balance, issue reports, and field-photo review.",
          children: handoverApprovals.length
            ? renderAdminMiniTable(
                ["Approval", "Status", "Reviewer", "Date"],
                handoverApprovals.map((approval) => [
                  approval.approval_type || approval.id,
                  approval.status || "pending",
                  approval.reviewer_name || approval.actor || approval.created_by || "-",
                  formatAdminDate(approval.reviewed_at || approval.created_at)
                ])
              )
            : renderAdminEmptyState("No handover approvals", getAdminTableMissingText("approvals"))
        })}
        {renderAdminStagePanel({
          stageId: "S17",
          title: "Project audit archive",
          status: archiveHashed || archiveFiles.length ? "archived" : "pending",
          subtitle:
            "Reads project_files and approvals to archive drawings, BOM, RFQ, QC, shipping documents, payments, and audit hashes.",
          className: "wide",
          children: archiveFiles.length
            ? renderAdminMiniTable(
                ["File", "Group", "Hash", "Created"],
                archiveFiles.map((file) => [
                  file.file_name || file.name || file.id,
                  file.file_group || file.stage_id || "archive",
                  file.sha256 || file.audit_hash || "-",
                  formatAdminDate(file.created_at)
                ])
              )
            : renderAdminEmptyState("No archive files", getAdminTableMissingText("project_files"))
        })}
      </div>
    );
  };

  const getActiveAdminProject = () => {
    const selectedJob =
      intakeReviewJobs.find((job) => job.id === selectedReviewJobId) ||
      intakeReviewJobs.find((job) => job.project_id === order.id) ||
      intakeReviewJobs[0];
    const selectedDraft =
      reviewDraft?.id === selectedJob?.id ? reviewDraft : selectedJob ? normalizeReviewJob(selectedJob) : reviewDraft;

    if (selectedDraft?.projectId) {
      return buildOrderFromReviewDraft(selectedDraft);
    }

    return order;
  };

  const renderAdminProgressBoard = () => {
    const flowStageIndexes = activeAdminFlowConfig.stageIndexes;
    const flowTitle = lang === "Cn" ? activeAdminFlowConfig.titleCn : activeAdminFlowConfig.titleEn;
    const flowDesc = lang === "Cn" ? activeAdminFlowConfig.descCn : activeAdminFlowConfig.descEn;
    const activeAdminProject = getActiveAdminProject();
    const flowWorkspaces = {
      intake: renderIntakeFlowWorkspace,
      sourcing: () => (
        <AdminWorkflowWorkspace
          flow="sourcing"
          lang={lang}
          project={activeAdminProject}
          supabaseClient={getSupabaseBrowserClient()}
          dbConnected={dbConnected}
          onProjectChanged={() => {
            loadAdminOperationalData();
            loadPrequoteWorkspace();
          }}
        />
      ),
      production: () => (
        <AdminWorkflowWorkspace
          flow="production"
          lang={lang}
          project={activeAdminProject}
          supabaseClient={getSupabaseBrowserClient()}
          dbConnected={dbConnected}
          onProjectChanged={loadAdminOperationalData}
        />
      ),
      shipping: () => (
        <AdminWorkflowWorkspace
          flow="shipping"
          lang={lang}
          project={activeAdminProject}
          supabaseClient={getSupabaseBrowserClient()}
          dbConnected={dbConnected}
          onOpenLoadingAi={({ project }) => {
            const sourceItems = reviewDraft?.projectId === project?.id ? reviewDraft.items : project?.items;
            const palette = ["#a97c73", "#7a8775", "#607d8b", "#8b6f47", "#6f5b7b", "#4d7c78"];
            const normalizedItems = (sourceItems || []).map((item, index) => ({
              id: item.id || `project-item-${index + 1}`,
              sku: item.typeCn || item.typeEn || item.itemType || `Item ${index + 1}`,
              skuEn: item.typeEn || item.typeCn || item.itemType || `Item ${index + 1}`,
              l: Number(item.length || item.l || 1000),
              w: Number(item.width || item.depth || item.w || 800),
              h: Number(item.height || item.h || 800),
              qty: Math.max(1, Number(item.qty || item.quantity || 1)),
              weight: Math.max(1, Number(item.weight || 25)),
              stackingGrade: Number(item.stackingGrade || 2),
              allowSide: item.allowSide !== false,
              allowUpsideDown: item.allowUpsideDown === true,
              color: item.color || palette[index % palette.length]
            }));
            setLoadingAiContext({ projectId: project.id, projectName: project.orderId, items: normalizedItems });
            setLoadingAiResult(null);
            setLoadingAiSaveStatus("");
            setShowVolumetricSimulation(true);
          }}
          onProjectChanged={loadAdminOperationalData}
        />
      )
    };
    const renderFlowWorkspace = flowWorkspaces[activeAdminFlow] || renderIntakeFlowWorkspace;

    return (
      <AdminLocalized lang={lang}>
        <div className="admin-status-board">
          <div className="admin-board-heading">
            <div>
              <span className="logo-badge">{lang === "Cn" ? "运营工作区" : "Operations Workspace"}</span>
              <h3>{flowTitle}</h3>
              <p>{flowDesc}</p>
            </div>
            <div className="admin-stage-chip-row" aria-label="Stage shortcuts">
              {flowStageIndexes.map((stageIndex) => {
                const stage = stages[stageIndex];
                return (
                  <button
                    key={stage.id}
                    type="button"
                    className={`admin-stage-chip ${currentStage.id === stage.id ? "active" : ""}`}
                    onClick={() => handleStageChange(stageIndex)}
                  >
                    {stage.id}
                  </button>
                );
              })}
            </div>
          </div>

          {renderFlowWorkspace()}
        </div>
      </AdminLocalized>
    );
  };

  const renderIntakeReviewWorkspace = () => {
    const jobs = intakeReviewJobs.length > 0 ? intakeReviewJobs : dbConnected ? [] : getLocalReviewJobs();
    const selectedJob = jobs.find((job) => job.id === selectedReviewJobId) || jobs[0];
    const selectedNormalized = selectedJob ? normalizeReviewJob(selectedJob) : null;
    const draft = reviewDraft || selectedNormalized;
    const draftRfq = draft?.rfqDraft || selectedNormalized?.rfqDraft;

    return (
      <div className="intake-review-shell">
        <div className="glass-card intake-review-inbox">
          <div className="panel-header">
            <div className="panel-title">
              <span className="stage-badge-dot dot-ai"></span>
              <span>{lang === "Cn" ? "Intake 审核队列" : "Intake Review Inbox"}</span>
            </div>
            <div className="panel-header-badges">
              <span className="stage-label-badge">Stage S01</span>
              <span className="logo-badge">{jobs.length} Drafts</span>
            </div>
          </div>
          <div className="panel-body review-list-body">
            {jobs.length === 0 ? (
              <div className="prequote-empty">No intake drafts are waiting for review.</div>
            ) : (
              jobs.map((job) => {
                const normalized = normalizeReviewJob(job);
                const isActive = selectedJob?.id === job.id;
                return (
                  <button
                    key={job.id}
                    type="button"
                    className={`review-list-item ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedReviewJobId(job.id)}
                  >
                    <div>
                      <strong>{normalized.projectName}</strong>
                      <span>{normalized.destination || "Destination pending"}</span>
                    </div>
                    {renderStatusPill(normalized.reviewStatus)}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-card intake-review-editor">
          <div className="panel-header">
            <div className="panel-title">
              <span className="stage-badge-dot dot-human"></span>
              <span>{lang === "Cn" ? "Cho 审核与 RFQ 准备" : "Cho Review & RFQ Prep"}</span>
            </div>
            <div className="panel-header-badges">
              <span className="stage-label-badge">Stage S04</span>
              {draft && renderStatusPill(draft.reviewStatus)}
            </div>
          </div>

          <div className="panel-body">
            {!draft ? (
              <div className="prequote-empty">Select an intake draft to review.</div>
            ) : (
              <>
                {prequoteNotice && <div className="prequote-notice">{prequoteNotice}</div>}

                <div className="review-form-grid">
                  <label>
                    Project name
                    <input
                      value={draft.projectName || ""}
                      onChange={(e) => setReviewDraft((prev) => ({ ...(prev || draft), projectName: e.target.value }))}
                    />
                  </label>
                  <label>
                    Destination
                    <input
                      value={draft.destination || ""}
                      onChange={(e) => setReviewDraft((prev) => ({ ...(prev || draft), destination: e.target.value }))}
                    />
                  </label>
                </div>

                <div className="table-container">
                  <table className="order-table review-edit-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Material</th>
                        <th>Target Price</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>
                            <input
                              value={item.typeEn || ""}
                              onChange={(e) => handleReviewItemChange(idx, "typeEn", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              value={item.qty || ""}
                              onChange={(e) => handleReviewItemChange(idx, "qty", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              value={item.materialEn || ""}
                              onChange={(e) => handleReviewItemChange(idx, "materialEn", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              value={item.unitPrice || ""}
                              onChange={(e) => handleReviewItemChange(idx, "unitPrice", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              value={item.notesEn || ""}
                              onChange={(e) => handleReviewItemChange(idx, "notesEn", e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="review-questions-grid">
                  <div>
                    <div className="prequote-section-label">Missing specification questions</div>
                    {(draft.questions || []).map((question, idx) => (
                      <div key={`${draft.id}-missing-${idx}`} className="review-question-row">
                        {question}
                      </div>
                    ))}
                    {(draft.questions || []).length === 0 && (
                      <div className="review-question-row">No missing questions detected.</div>
                    )}
                  </div>
                  <label>
                    Cho review note
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Write a client-facing clarification or an internal approval note..."
                    />
                  </label>
                </div>

                {draft.clientAnswers && Object.keys(draft.clientAnswers).length > 0 && (
                  <div className="client-answer-summary">
                    <div className="prequote-section-label">Client answers received</div>
                    {Object.entries(draft.clientAnswers).map(([key, value]) => (
                      <div key={key}>
                        <strong>Q{Number(key) + 1}:</strong> {value}
                      </div>
                    ))}
                  </div>
                )}

                {draftRfq && (
                  <div className="rfq-draft-panel">
                    <div className="prequote-section-label">RFQ draft package</div>
                    <div className="rfq-draft-grid">
                      {draftRfq.suppliers?.map((supplier) => (
                        <div key={supplier.name} className="rfq-supplier-card">
                          <strong>{supplier.name}</strong>
                          <span>Lead time: {supplier.leadTime}</span>
                          <span>Terms: {supplier.terms}</span>
                          <span>Evaluation score: {supplier.score}/100</span>
                          <b>${Number(supplier.estimatedTotal || 0).toLocaleString()}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="review-action-row">
                  <button className="btn-secondary" onClick={handleAskClientForRevision}>
                    Ask client
                  </button>
                  <button className="btn-secondary" onClick={handleRejectIntakeReview}>
                    Reject
                  </button>
                  <button className="btn-premium" onClick={handleApproveIntakeReview}>
                    Approve specs
                  </button>
                  <button className="btn-premium" onClick={handleCreateRfqDraft}>
                    Create RFQ draft
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAuthGate = () => {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(28, 27, 24, 0.65)",
          backdropFilter: "blur(12px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}
        className="animate-fade-in"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            background: "#FAF9F6",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "row",
            border: "1px solid rgba(124, 114, 103, 0.15)",
            minHeight: "550px"
          }}
        >
          {/* Left Column: Premium Editorial Visuals */}
          <div
            style={{
              flex: "1",
              background: "#F3F1ED",
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRight: "1px solid rgba(124, 114, 103, 0.1)",
              position: "relative"
            }}
            className="hidden-mobile"
          >
            <div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "600",
                  color: "#1C1B18",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                  fontFamily: "'Outfit', 'Inter', sans-serif"
                }}
              >
                THE CRAFTON
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#7C7267",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "40px"
                }}
              >
                {lang === "Cn" ? "倫敦工作室 × 智能製造" : "London Studio × Intelligent Manufacture"}
              </div>
            </div>

            <div style={{ textAlign: "center", margin: "20px 0" }}>{renderChairSVG("FAB-02", "matte-black")}</div>

            <div>
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: "15px",
                  color: "#7C7267",
                  lineHeight: "1.6",
                  fontFamily: "'Georgia', serif",
                  marginBottom: "0"
                }}
              >
                {lang === "Cn"
                  ? "「您提需求，剩下的交給我們。圖紙為每件作品自動生成。」"
                  : "“You bring the requirements, we handle the rest. Blueprints auto-generate for every piece we build.”"}
              </p>
              <div
                style={{
                  fontSize: "11px",
                  color: "#9C9287",
                  marginTop: "12px",
                  letterSpacing: "0.05em"
                }}
              >
                THE CRAFTON B2B PORTAL
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Form */}
          <div
            style={{
              flex: "1.2",
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative"
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowAuthGate(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "none",
                border: "none",
                fontSize: "24px",
                color: "#7C7267",
                cursor: "pointer",
                padding: "5px",
                lineHeight: "1"
              }}
              aria-label="Close"
            >
              ×
            </button>

            <div style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: "600",
                  color: "#1C1B18",
                  marginBottom: "8px",
                  letterSpacing: "0.02em",
                  fontFamily: "'Outfit', 'Inter', sans-serif"
                }}
              >
                {authMode === "login"
                  ? lang === "Cn"
                    ? "尊貴會員登入"
                    : "Partner Sign In"
                  : lang === "Cn"
                    ? "註冊尊貴會員"
                    : "Partner Registration"}
              </h3>
              <p style={{ fontSize: "13px", color: "#7C7267", margin: 0, lineHeight: "1.4" }}>
                {lang === "Cn"
                  ? "由於定制圖紙、BOM及工廠報價涉及商業機密，項目中心需帳戶驗證保護。"
                  : "As drawings, BOMs & factory bids involve B2B trade secrets, access is gated to registered clients."}
              </p>
            </div>

            <form
              onSubmit={authMode === "login" ? handleAuthLogin : handleAuthSignUp}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {authMode === "signup" && (
                <>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7C7267",
                        marginBottom: "4px",
                        fontWeight: "500"
                      }}
                    >
                      {lang === "Cn" ? "姓名" : "Your Name"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(124, 114, 103, 0.2)",
                        background: "#FAF9F6",
                        fontSize: "14px",
                        color: "#1C1B18"
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7C7267",
                        marginBottom: "4px",
                        fontWeight: "500"
                      }}
                    >
                      {lang === "Cn" ? "公司名稱" : "Company Name"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jenkins Contract Interior Studio"
                      value={signupCompany}
                      onChange={(e) => setSignupCompany(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(124, 114, 103, 0.2)",
                        background: "#FAF9F6",
                        fontSize: "14px",
                        color: "#1C1B18"
                      }}
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#7C7267",
                    marginBottom: "4px",
                    fontWeight: "500"
                  }}
                >
                  {lang === "Cn" ? "電子郵件" : "Email Address"}
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. client@designstudio.co.uk"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(124, 114, 103, 0.2)",
                    background: "#FAF9F6",
                    fontSize: "14px",
                    color: "#1C1B18"
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#7C7267",
                    marginBottom: "4px",
                    fontWeight: "500"
                  }}
                >
                  {lang === "Cn" ? "密碼" : "Password"}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(124, 114, 103, 0.2)",
                    background: "#FAF9F6",
                    fontSize: "14px",
                    color: "#1C1B18"
                  }}
                />
              </div>

              {authMode === "signup" && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: "1" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7C7267",
                        marginBottom: "4px",
                        fontWeight: "500"
                      }}
                    >
                      {lang === "Cn" ? "首選即時通訊" : "Preferred Messenger"}
                    </label>
                    <select
                      value={signupMessenger}
                      onChange={(e) => setSignupCompanyMessenger(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(124, 114, 103, 0.2)",
                        background: "#FAF9F6",
                        fontSize: "14px",
                        color: "#1C1B18"
                      }}
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="WeChat">WeChat (微信)</option>
                    </select>
                  </div>
                  <div style={{ flex: "1.5" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7C7267",
                        marginBottom: "4px",
                        fontWeight: "500"
                      }}
                    >
                      {lang === "Cn" ? "通訊ID / 手機號" : "Messenger ID / Number"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={signupMessenger === "WhatsApp" ? "e.g. +44 7700 900077" : "e.g. wechat_id"}
                      value={signupMessengerId}
                      onChange={(e) => setSignupMessengerId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(124, 114, 103, 0.2)",
                        background: "#FAF9F6",
                        fontSize: "14px",
                        color: "#1C1B18"
                      }}
                    />
                  </div>
                </div>
              )}

              {authError && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid rgba(170, 70, 55, 0.3)",
                    background: "rgba(170, 70, 55, 0.08)",
                    color: "#8E3B2F",
                    fontSize: "12px",
                    lineHeight: "1.4"
                  }}
                >
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#7C7267",
                  color: "#FAF9F6",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: authLoading ? "wait" : "pointer",
                  letterSpacing: "0.05em",
                  transition: "background 0.3s",
                  marginTop: "10px",
                  opacity: authLoading ? 0.75 : 1
                }}
                onMouseOver={(e) => (e.target.style.background = "#63594F")}
                onMouseOut={(e) => (e.target.style.background = "#7C7267")}
              >
                {authMode === "login"
                  ? lang === "Cn"
                    ? "安全登入"
                    : "Authenticate Session"
                  : lang === "Cn"
                    ? "完成註冊並開通"
                    : "Register Partner Account"}
              </button>
            </form>

            <div
              style={{
                margin: "18px 0 8px 0",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px"
              }}
            >
              <button
                type="button"
                onClick={() => handleAuthOAuthSignIn("google")}
                disabled={authLoading}
                style={{
                  padding: "10px",
                  background: "#FFFFFF",
                  border: "1px solid rgba(124, 114, 103, 0.18)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#1C1B18",
                  cursor: authLoading ? "wait" : "pointer",
                  fontWeight: "600"
                }}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => handleAuthOAuthSignIn("apple")}
                disabled={authLoading}
                style={{
                  padding: "10px",
                  background: "#1C1B18",
                  border: "1px solid #1C1B18",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#FFFFFF",
                  cursor: authLoading ? "wait" : "pointer",
                  fontWeight: "600"
                }}
              >
                Apple
              </button>
            </div>

            {/* Quick Demo Access Header */}
            <div
              style={{
                margin: "24px 0 12px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }}
            >
              <div style={{ flex: "1", height: "1px", background: "rgba(124, 114, 103, 0.15)" }}></div>
              <span style={{ fontSize: "11px", color: "#9C9287", letterSpacing: "0.05em" }}>
                {lang === "Cn" ? "快捷入口" : "QUICK ACCESS"}
              </span>
              <div style={{ flex: "1", height: "1px", background: "rgba(124, 114, 103, 0.15)" }}></div>
            </div>

            {/* Quick Demo Login Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => loginAsDemo("client")}
                style={{
                  flex: "1",
                  padding: "10px",
                  background: "rgba(124, 114, 103, 0.08)",
                  border: "1px solid rgba(124, 114, 103, 0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#7C7267",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontWeight: "500"
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(124, 114, 103, 0.12)";
                  e.target.style.borderColor = "rgba(124, 114, 103, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "rgba(124, 114, 103, 0.08)";
                  e.target.style.borderColor = "rgba(124, 114, 103, 0.15)";
                }}
              >
                CLIENT · {lang === "Cn" ? "Sarah Jenkins (客戶)" : "Sarah (Client View)"}
              </button>
              <button
                onClick={() => loginAsDemo("cho")}
                style={{
                  flex: "1",
                  padding: "10px",
                  background: "rgba(124, 114, 103, 0.08)",
                  border: "1px solid rgba(124, 114, 103, 0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#7C7267",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontWeight: "500"
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(124, 114, 103, 0.12)";
                  e.target.style.borderColor = "rgba(124, 114, 103, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "rgba(124, 114, 103, 0.08)";
                  e.target.style.borderColor = "rgba(124, 114, 103, 0.15)";
                }}
              >
                {lang === "Cn" ? "Cho 管理员登录" : "Cho administrator sign in"}
              </button>
            </div>

            {/* Toggle Mode */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <span style={{ fontSize: "13px", color: "#9C9287" }}>
                {authMode === "login"
                  ? lang === "Cn"
                    ? "還沒有帳戶？ "
                    : "New to the platform? "
                  : lang === "Cn"
                    ? "已有註冊帳戶？ "
                    : "Already have an account? "}
              </span>
              <button
                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "13px",
                  color: "#7C7267",
                  fontWeight: "600",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                {authMode === "login"
                  ? lang === "Cn"
                    ? "申請加入"
                    : "Register Partner"
                  : lang === "Cn"
                    ? "登入帳戶"
                    : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHowItWorksBlock = () => {
    const steps = [
      {
        num: "01",
        titleCn: "Brief · 項目對接與手稿導入",
        titleEn: "Project Intake & Specification Review",
        descCn: "客户于会员中心上传设计手稿、几何尺寸或文字需求。系统整理规格、识别比例并导入项目数据。",
        descEn:
          "Clients upload sketch drafts, dimensions, or text briefs. The intake service extracts the files and initializes order entries."
      },
      {
        num: "02",
        titleCn: "Quote · 多廠實時比價與透明招標",
        titleEn: "B2B Bid Comparison & Sourcing",
        descCn: "系统生成双语 RFQ 技术文件，分发至三家合约代工厂，并汇总单价、工期与质量记录。",
        descEn:
          "The workflow generates RFQ packages for three contract mills and aggregates price, lead time, and quality records."
      },
      {
        num: "03",
        titleCn: "Spec · 技術圖紙與BOM自動生成",
        titleEn: "Automated CAD specs & BOMs",
        descCn: "根據確定的物料，算法自動生成幾何三視圖、公差邊界與完整的雙語 BOM 列表，提供給客戶及 Cho 審批簽發。",
        descEn:
          "Based on confirmed specifications, custom CAD elevations and bilingual BOM lists are auto-generated for sign-off."
      },
      {
        num: "04",
        titleCn: "Production · 掃碼動態監測與進度追蹤",
        titleEn: "QR Progress Scan & Tracking",
        descCn: "物料到廠粘貼唯一二維碼，工匠車間掃碼隨時查看 3D 三視圖，每日進度同步更新至客戶平台與 WhatsApp。",
        descEn:
          "Mill materials are labeled with QR codes. Craftsmen scan to view 3D assemblies, logging daily progress live."
      },
      {
        num: "05",
        titleCn: "Compliance · 英國 Crib 5 消防與CV驗證",
        titleEn: "Crib 5 Gate & CV Verification",
        descCn: "硬性防火及环保拦截门槛。通过图像与 CAD 对照验证大货照片，降低色差与尺寸偏差风险。",
        descEn: "Gated for UK Crib 5 fire resistance, with physical photos checked against CAD contours."
      },
      {
        num: "06",
        titleCn: "Delivery · 集裝箱排櫃優化與在途追踪",
        titleEn: "3D Cargo Stacking & Shipping",
        descCn:
          "根據大貨尺寸自動運算 3D 箱體容積最大化排櫃圖。實時追蹤馬士基船運 ETA 進度，直至倫敦或 St Albans 交付簽字。",
        descEn:
          "Calculates optimal 3D container stacking plans. MAERSK marine APIs track shipping positions until final site handover."
      }
    ];

    return (
      <div id="how-it-works" style={{ padding: "80px 0", borderTop: "1px solid rgba(124, 114, 103, 0.15)" }}>
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <span style={{ fontSize: "12px", color: "#7C7267", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {lang === "Cn" ? "製造生命週期" : "MANUFACTURING LIFE-CYCLE"}
          </span>
          <h2
            style={{
              fontSize: "32px",
              color: "#1C1B18",
              fontWeight: "600",
              marginTop: "10px",
              letterSpacing: "0.05em",
              fontFamily: "'Outfit', 'Inter', sans-serif"
            }}
          >
            {lang === "Cn" ? "六大核心交付階段" : "Six Pillars of Seamless B2B Delivery"}
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#7C7267", margin: "20px auto 0 auto" }}></div>
        </div>

        <div
          className="grid-3"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}
        >
          {steps.map((st, idx) => (
            <div
              key={idx}
              className="case-study-card"
              style={{
                background: "#FAF9F6",
                border: "1px solid rgba(124, 114, 103, 0.1)",
                borderRadius: "12px",
                padding: "30px",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  right: "15px",
                  fontSize: "80px",
                  fontWeight: "900",
                  color: "rgba(124, 114, 103, 0.05)",
                  userSelect: "none",
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                {st.num}
              </div>

              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#7C7267",
                  color: "#FAF9F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginBottom: "20px"
                }}
              >
                {st.num}
              </div>

              <h4
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1C1B18",
                  marginBottom: "10px",
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                {lang === "Cn" ? st.titleCn : st.titleEn}
              </h4>

              <p
                style={{
                  fontSize: "13.5px",
                  color: "#7C7267",
                  lineHeight: "1.6",
                  margin: 0
                }}
              >
                {lang === "Cn" ? st.descCn : st.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOurStoryBlock = () => {
    return (
      <div style={{ padding: "60px 0" }} className="animate-fade-in">
        {/* Banner Section */}
        <div
          style={{
            background: "#F3F1ED",
            borderRadius: "16px",
            padding: "60px 40px",
            marginBottom: "60px",
            textAlign: "center",
            border: "1px solid rgba(124, 114, 103, 0.1)"
          }}
        >
          <span style={{ fontSize: "12px", color: "#7C7267", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {lang === "Cn" ? "我們的傳承" : "OUR HERITAGE"}
          </span>
          <h2
            style={{
              fontSize: "36px",
              color: "#1C1B18",
              fontWeight: "600",
              marginTop: "12px",
              marginBottom: "20px",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              letterSpacing: "0.05em"
            }}
          >
            {lang === "Cn" ? "倫敦思維與極致工藝的全球協同" : "London Design Synergized with Chinese Craftsmanship"}
          </h2>
          <p
            style={{
              maxWidth: "700px",
              margin: "0 auto",
              fontSize: "15px",
              color: "#7C7267",
              lineHeight: "1.7",
              fontFamily: "'Georgia', serif",
              fontStyle: "italic"
            }}
          >
            {lang === "Cn"
              ? "「我们在伦敦定义美学、融汇法规；我们在中国精工落地、精确量产。这不是简单的代工，而是一套连接高端设计、工程审核与制造交付的完整服务。」"
              : "“We define premium aesthetics and ensure UK/EU compliance in London; we execute custom engineering and scale production seamlessly in China. A flawless union of classic craft and multi-agent automations.”"}
          </p>
        </div>

        {/* Dual Column Synergy Details - Interlaced with Images */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px", marginBottom: "60px" }}>
          {/* Row 1: London (Text Left, Image Right) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "40px",
              alignItems: "center"
            }}
          >
            <div
              style={{
                background: "#FAF9F6",
                borderRadius: "12px",
                padding: "40px",
                border: "1px solid rgba(124, 114, 103, 0.1)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center"
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#7C7267",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: "15px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg
                  style={{ width: "16px", height: "16px", color: "var(--accent-primary)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>LONDON HEADQUARTERS</span>
              </div>
              <h3
                style={{
                  fontSize: "22px",
                  color: "#1C1B18",
                  fontWeight: "600",
                  marginBottom: "15px",
                  fontFamily: "'Cormorant Garamond', serif"
                }}
              >
                {lang === "Cn" ? "倫敦設計工作室與體驗廳" : "London Design & Client Hub"}
              </h3>
              <p style={{ fontSize: "14px", color: "#7C7267", lineHeight: "1.6", marginBottom: "20px" }}>
                {lang === "Cn"
                  ? "座落於倫敦核心設計街區，負責全球合約傢俱 (Contract Furniture) 的前期概念策劃、物料板定案及歐洲嚴苛的消防法規（如 BS 5852 Crib 5）對接。我們是客戶與智能工廠之間的靈魂紐帶。"
                  : "Located in London's premier design district, coordinates custom material selection, FF&E consulting, and stringent European fire code compliance (BS 5852 Crib 5). The creative and compliance soul linking clients with engineering."}
              </p>
              <div
                style={{
                  fontSize: "12px",
                  color: "#7C7267",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg
                  style={{ width: "14px", height: "14px", color: "var(--accent-primary)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>56 Clerkenwell Road, London, EC1M 5PX</span>
              </div>
            </div>
            <div
              className="hero-image-container glass-card"
              style={{ height: "380px", overflow: "hidden", borderRadius: "12px" }}
            >
              <img
                src={IMAGES.blueprintIntake}
                alt="London Design Sketch"
                loading="lazy"
                decoding="async"
                className="hero-image-zoom"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>

          {/* Row 2: China (Image Left, Text Right) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "40px",
              alignItems: "center"
            }}
          >
            <div
              className="hero-image-container glass-card"
              style={{
                height: "380px",
                overflow: "hidden",
                borderRadius: "12px",
                order: window.innerWidth < 768 ? 2 : 0
              }}
            >
              <img
                src={IMAGES.workflowPhases}
                alt="High Precision Manufacturing"
                loading="lazy"
                decoding="async"
                className="hero-image-zoom"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                background: "#FAF9F6",
                borderRadius: "12px",
                padding: "40px",
                border: "1px solid rgba(124, 114, 103, 0.1)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center"
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#7C7267",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: "15px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg
                  style={{ width: "16px", height: "16px", color: "var(--accent-primary)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>INTELLIGENT MANUFACTURING</span>
              </div>
              <h3
                style={{
                  fontSize: "22px",
                  color: "#1C1B18",
                  fontWeight: "600",
                  marginBottom: "15px",
                  fontFamily: "'Cormorant Garamond', serif"
                }}
              >
                {lang === "Cn" ? "中國高精尖製造合作基地" : "High-Precision Manufacturing base"}
              </h3>
              <p style={{ fontSize: "14px", color: "#7C7267", lineHeight: "1.6", marginBottom: "20px" }}>
                {lang === "Cn"
                  ? "分布于广东佛山与东莞的合约家具制造基地，将老师傅的手工经验与高精密 CNC、二维码图纸定位结合，让每件成品与 CAD 图纸准确吻合。"
                  : "Our Foshan and Dongguan manufacturing base combines experienced craftsmanship with CNC production and QR-linked drawings, keeping every piece aligned with its approved CAD specification."}
              </p>
              <div
                style={{
                  fontSize: "12px",
                  color: "#7C7267",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg
                  style={{ width: "14px", height: "14px", color: "var(--accent-primary)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Longjiang Furniture Hub, Shunde, Guangdong, China</span>
              </div>
            </div>
          </div>
        </div>

        {/* Values and Global Logistics Network */}
        <div
          style={{
            background: "#FAF9F6",
            borderRadius: "12px",
            padding: "40px",
            border: "1px solid rgba(124, 114, 103, 0.1)"
          }}
        >
          <h3
            style={{
              fontSize: "24px",
              color: "#1C1B18",
              fontWeight: "600",
              marginBottom: "20px",
              textAlign: "center",
              fontFamily: "'Cormorant Garamond', serif",
              letterSpacing: "1px"
            }}
          >
            {lang === "Cn" ? "我們的核心承諾" : "Our B2B Commitments"}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "30px",
              marginTop: "30px"
            }}
          >
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <svg
                style={{ width: "32px", height: "32px", color: "var(--accent-primary)", marginBottom: "15px" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#1C1B18", marginBottom: "8px" }}>
                {lang === "Cn" ? "商業機密安全" : "IP & Commercial Security"}
              </h4>
              <p style={{ fontSize: "13px", color: "#7C7267", margin: 0, lineHeight: "1.5" }}>
                {lang === "Cn"
                  ? "所有定製藍圖、BOM表與詢價細節受帳號 hard-gated 門檻保護，嚴防設計外洩。"
                  : "All drawings, BOMs and bids are hard-gated to prevent commercial leaks."}
              </p>
            </div>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <svg
                style={{ width: "32px", height: "32px", color: "var(--accent-primary)", marginBottom: "15px" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 16.121A3 3 0 1012.01 11c0 1.11-.277 3.06-1.552 4.121z"
                />
              </svg>
              <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#1C1B18", marginBottom: "8px" }}>
                {lang === "Cn" ? "100% 英國 Crib 5 合規" : "100% Crib 5 Fire Compliance"}
              </h4>
              <p style={{ fontSize: "13px", color: "#7C7267", margin: 0, lineHeight: "1.5" }}>
                {lang === "Cn"
                  ? "智能識別材料消防資質，全自動卡點硬阻攔不合規物料，護航商業交付。"
                  : "Automated material compliance checks prevent non-compliant materials from being shipped."}
              </p>
            </div>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <svg
                style={{ width: "32px", height: "32px", color: "var(--accent-primary)", marginBottom: "15px" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#1C1B18", marginBottom: "8px" }}>
                {lang === "Cn" ? "自動生成圖紙" : "Auto Blueprint Generation"}
              </h4>
              <p style={{ fontSize: "13px", color: "#7C7267", margin: 0, lineHeight: "1.5" }}>
                {lang === "Cn"
                  ? "深度解析草圖，平面/立面/剖面圖紙為每一件產品自動精確生成與歸檔。"
                  : "Sketches are auto-parsed into geometric CAD specs and archived."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContactBlock = () => {
    return <ContactBlock lang={lang} contactMessage={contactMessage} setContactMessage={setContactMessage} />;
  };

  const renderProjectDetailModal = () => {
    return (
      <ProjectDetailModal
        lang={lang}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        setContactMessage={setContactMessage}
        setMarketingTab={setMarketingTab}
      />
    );
  };

  const renderFooter = () => {
    return <Footer lang={lang} setCurrentStageView={setCurrentStageView} setMarketingTab={setMarketingTab} />;
  };

  console.log("=== APP RENDER STATEMENT REACHED ===");
  return (
    <div className={`crafton-app view-${currentView.toLowerCase()}`} data-view={currentView}>
      {/* Supabase Connection Drawer */}
      {showDbConfig && import.meta.env.DEV && (
        <div
          className="animate-fade-in"
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid var(--glass-border)",
            padding: "2.5rem 2rem",
            position: "relative",
            zIndex: 1000,
            boxShadow: "0 10px 30px rgba(28,27,24,0.05)"
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}
            >
              <h3 style={{ fontFamily: "var(--font-tech)", color: "var(--text-primary)", margin: 0 }}>
                🔌 Supabase 實時數據庫連接 (Live Database Sync)
              </h3>
              <button
                onClick={() => setShowDbConfig(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "1.2rem"
                }}
              >
                ✕
              </button>
            </div>

            <p
              style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: "1.6" }}
            >
              {lang === "Cn"
                ? "連接到您的 Supabase 實時雲數據庫。系統將直接從 projects, specifications 和 agent_logs 數據表中讀取和實時寫入數據。如果斷開，將優雅降級到本地模擬數據。"
                : "Connect to your live Supabase cloud database. The prototype will dynamically read and write records to your projects, specifications, and agent_logs tables. Falls back to local mockup data if disconnected."}
            </p>

            {isSupabaseConfiguredByEnv && (
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  marginBottom: "1.25rem",
                  lineHeight: "1.5"
                }}
              >
                Supabase is configured by deployment environment variables. Update VITE_SUPABASE_URL and
                VITE_SUPABASE_ANON_KEY on the server to change the permanent connection.
              </p>
            )}

            <form onSubmit={handleSaveDbConfig} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--accent-cyan)",
                    fontFamily: "var(--font-tech)",
                    letterSpacing: "1px"
                  }}
                >
                  SUPABASE PROJECT URL
                </label>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="https://your-project-id.supabase.co"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  readOnly={isSupabaseConfiguredByEnv}
                  style={{
                    width: "100%",
                    background: "#FFFFFF",
                    padding: "0.6rem",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-primary)",
                    borderRadius: "2px"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--accent-cyan)",
                    fontFamily: "var(--font-tech)",
                    letterSpacing: "1px"
                  }}
                >
                  SUPABASE ANON KEY
                </label>
                <input
                  type="password"
                  className="chat-input"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={dbKey}
                  onChange={(e) => setDbKey(e.target.value)}
                  readOnly={isSupabaseConfiguredByEnv}
                  style={{
                    width: "100%",
                    background: "#FFFFFF",
                    padding: "0.6rem",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-primary)",
                    borderRadius: "2px"
                  }}
                />
              </div>

              {dbError && (
                <div
                  style={{
                    color: "var(--accent-red)",
                    fontSize: "0.8rem",
                    background: "rgba(255, 76, 76, 0.08)",
                    padding: "0.8rem",
                    borderRadius: "6px",
                    border: "1px solid var(--accent-red)",
                    fontFamily: "var(--font-tech)"
                  }}
                >
                  ⚠️ ERROR: {dbError}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-premium" disabled={dbLoading} style={{ padding: "0.6rem 1.5rem" }}>
                  {dbLoading ? "Testing..." : "Save & Sync Live Database"}
                </button>
                {dbConnected && (
                  <>
                    <button
                      type="button"
                      className="btn-premium"
                      style={{
                        background: "linear-gradient(135deg, var(--accent-orange) 0%, #B8836C 100%)",
                        borderColor: "transparent",
                        color: "white",
                        padding: "0.6rem 1.5rem"
                      }}
                      onClick={handleForceSeed}
                      disabled={dbLoading}
                    >
                      {dbLoading
                        ? lang === "Cn"
                          ? "處理中..."
                          : "Processing..."
                        : lang === "Cn"
                          ? "⚡️ 強制重新播種數據"
                          : "⚡️ Force Re-Seed Database"}
                    </button>
                    {!isSupabaseConfiguredByEnv && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{
                          borderColor: "var(--accent-red)",
                          color: "var(--accent-red)",
                          padding: "0.6rem 1.5rem"
                        }}
                        onClick={() => {
                          setDbUrl("");
                          setDbKey("");
                          safeRemoveItem("supabase_url");
                          safeRemoveItem("supabase_key");
                          setDbConnected(false);
                          setOrder(JSON.parse(JSON.stringify(mockData.initialOrder)));
                          setLogs(JSON.parse(JSON.stringify(mockData.changeLogs)));
                          setCurrentStageIndex(0);
                        }}
                      >
                        Disconnect
                      </button>
                    )}
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navbar Header */}
      <nav className={`navbar ${lang === "En" ? "navbar-en" : ""}`}>
        <div
          className="logo-container"
          onClick={() => {
            setCurrentStageView("Marketing");
            setMarketingTab("Overview");
          }}
          style={{ cursor: "pointer" }}
        >
          <img className="crafton-nav-logo" src="/thecrafton-assets/thecrafton-logo.png" alt="The Crafton" />
        </div>

        <div className="nav-links">
          <span
            className={`nav-link ${currentView === "Marketing" && marketingTab === "Overview" ? "active" : ""}`}
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("Overview");
            }}
          >
            {lang === "Cn" ? "首頁" : "HOME"}
          </span>
          <span
            className={`nav-link ${currentView === "Marketing" && marketingTab === "HowItWorks" ? "active" : ""}`}
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("HowItWorks");
            }}
          >
            {lang === "Cn" ? "合作流程" : "HOW IT WORKS"}
          </span>
          <span
            className={`nav-link ${currentView === "Marketing" && marketingTab === "MaterialLibrary" ? "active" : ""}`}
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("MaterialLibrary");
            }}
          >
            {lang === "Cn" ? "選材庫" : "MATERIAL LIBRARY"}
          </span>
          <span
            className={`nav-link ${currentView === "Marketing" && marketingTab === "CaseStudies" ? "active" : ""}`}
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("CaseStudies");
            }}
          >
            {lang === "Cn" ? "經典案例" : "CASE STUDY"}
          </span>
          <span
            className={`nav-link ${currentView === "Marketing" && marketingTab === "BespokeFurniture" ? "active" : ""}`}
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("BespokeFurniture");
            }}
          >
            {lang === "Cn" ? "高端定製" : "BESPOKE FURNITURE"}
          </span>
          <span
            className={`nav-link ${currentView === "Marketing" && marketingTab === "SetFurniture" ? "active" : ""}`}
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("SetFurniture");
            }}
          >
            {lang === "Cn" ? "标准家具" : "SET FURNITURE"}
          </span>
          <span
            className={`nav-link ${currentView === "Marketing" && marketingTab === "Contact" ? "active" : ""}`}
            onClick={() => {
              setCurrentStageView("Marketing");
              setMarketingTab("Contact");
            }}
          >
            {lang === "Cn" ? "聯絡我們" : "CONTACT"}
          </span>
        </div>

        <div className="navbar-actions">
          <button
            className="btn-secondary"
            onClick={handleLangToggle}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <svg
              style={{ width: "14px", height: "14px" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              <path d="M2 12h20" />
            </svg>
            <span>{lang === "Cn" ? "English" : "繁體中文"}</span>
          </button>

          {user ? (
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {lang === "Cn"
                  ? `歡迎，${String(user.name || "").replace(/\(Manager\)$/i, "(管理员)")}`
                  : `Welcome, ${user.name}`}
              </span>
              <span
                className={`nav-link ${currentView === "ClientPortal" ? "active" : ""}`}
                onClick={() => setCurrentStageView("ClientPortal")}
                style={{ fontSize: "0.85rem", cursor: "pointer" }}
              >
                {lang === "Cn" ? "客戶中心" : "Client Portal"}
              </span>
              {isStaffUser && (
                <span
                  className={`nav-link ${currentView === "Backoffice" ? "active" : ""}`}
                  onClick={() => {
                    setCurrentStageView("Backoffice");
                    setTimeout(() => loadAdminOperationalData(), 0);
                  }}
                  style={{ fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {lang === "Cn" ? "管理控制台" : "Backoffice"}
                </span>
              )}
              <button
                onClick={handleAuthLogout}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "0.85rem",
                  color: "var(--accent-red)",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0
                }}
              >
                {lang === "Cn" ? "登出" : "Sign Out"}
              </button>
            </div>
          ) : (
            <>
              <button
                className="nav-link"
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthGate(true);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {lang === "Cn" ? "登入" : "Sign In"}
              </button>
              <button
                className="btn-premium animate-pulse"
                onClick={() => {
                  if (user) {
                    setCurrentStageView("ClientPortal");
                    setClientPortalTab("Intake");
                  } else {
                    setAuthMode("signup");
                    setShowAuthGate(true);
                  }
                }}
                style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", fontWeight: "600" }}
              >
                {lang === "Cn" ? "啟動項目" : "Start Project"}
              </button>
            </>
          )}
        </div>
      </nav>

      {dbError && !dbConnected && import.meta.env.DEV && (
        <div
          className="animate-fade-in"
          style={{
            background: "rgba(166, 132, 128, 0.95)",
            color: "#ffffff",
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
            fontFamily: "var(--font-tech)",
            borderBottom: "1px solid #FAF9F6",
            gap: "1.5rem",
            zIndex: 999,
            position: "relative"
          }}
        >
          <div>
            ⚠️{" "}
            <strong>
              {lang === "Cn" ? "Supabase 同步 / 播種錯誤 (Seeding Error):" : "Supabase Sync / Seeding Error:"}
            </strong>{" "}
            {dbError}
          </div>
          <button
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid #ffffff",
              color: "#ffffff",
              padding: "0.4rem 1rem",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}
            onClick={() => setShowDbConfig(true)}
          >
            {lang === "Cn" ? "點擊排查配置 / Troubleshoot" : "Troubleshoot Config"}
          </button>
        </div>
      )}

      {/* VIEW 1: Web Marketing Portal */}
      {currentView === "Marketing" && (
        <div
          className={`crafton-marketing animate-fade-in ${marketingTab === "Overview" ? "home-reference-host" : ""}`}
          style={{ paddingBottom: "4rem" }}
        >
          {marketingTab === "Overview" && (
            <CraftonHomepage
              onStartOrder={() => {
                if (user) {
                  setCurrentStageView("ClientPortal");
                  setClientPortalTab("Intake");
                } else {
                  setAuthMode("signup");
                  setShowAuthGate(true);
                }
              }}
              onOpenCollection={() => {
                setSetFurnitureCategory("");
                setSetFurnitureProduct("");
                setMarketingTab("SetFurniture");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onFactoryApply={() => {
                setContactMessage("I would like to apply to join The Crafton factory network.");
                setMarketingTab("Contact");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}

          {marketingTab === "LegacyOverview" && (
            <>
              {/* Asymmetrical Editorial Split-Screen Magazine Hero */}
              <div
                className="crafton-hero animate-editorial-slide-up"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr",
                  gap: "4rem",
                  alignItems: "center",
                  maxWidth: "1200px",
                  margin: "0 auto",
                  padding: "6rem 2rem 4rem 2rem"
                }}
              >
                {/* Left: Typography Editorial Block */}
                <div
                  className="crafton-hero-copy"
                  style={{ display: "flex", flexDirection: "column", textAlign: "left" }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      letterSpacing: "2px",
                      color: "var(--accent-muted)",
                      textTransform: "uppercase",
                      marginBottom: "1rem",
                      fontFamily: "var(--font-sans)"
                    }}
                  >
                    EST. 2021 | BESPOKE B2B CONTRACT ATELIER
                  </div>

                  <img className="crafton-hero-logo" src="/thecrafton-assets/thecrafton-logo.png" alt="The Crafton" />

                  {lang === "Cn" ? (
                    <h1
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "3.2rem",
                        fontWeight: "300",
                        lineHeight: "1.15",
                        color: "var(--text-primary)",
                        marginBottom: "1.8rem",
                        letterSpacing: "-0.5px"
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.8rem",
                          color: "var(--text-secondary)",
                          fontStyle: "italic",
                          fontFamily: "var(--font-tech)"
                        }}
                      >
                        意式極簡 · 專屬高端合約家具與軟裝製造
                      </span>
                    </h1>
                  ) : (
                    <h1
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "3.4rem",
                        fontWeight: "300",
                        lineHeight: "1.15",
                        color: "var(--text-primary)",
                        marginBottom: "1.8rem",
                        textTransform: "uppercase",
                        letterSpacing: "-1px"
                      }}
                    >
                      <span
                        style={{
                          fontSize: "2rem",
                          textTransform: "none",
                          color: "var(--text-secondary)",
                          fontStyle: "italic",
                          fontFamily: "var(--font-tech)"
                        }}
                      >
                        Makers of High-End Contract Furniture
                      </span>
                    </h1>
                  )}

                  <p
                    style={{
                      fontSize: "1.02rem",
                      color: "var(--text-secondary)",
                      marginBottom: "2.5rem",
                      lineHeight: "1.8",
                      fontWeight: "300",
                      fontFamily: "var(--font-sans)"
                    }}
                  >
                    {lang === "Cn"
                      ? "我們為全球高端商業項目與頂奢豪宅量身定製、設計並製造 B2B 合約家具。精準圖紙與自動化工程規格書在您的專屬雲端工作坊（Client Portal）中實時同步，以匠人匠心與阻尼動效致敬意式極簡美學。"
                      : "We engineer, refine and manufacture bespoke contract furniture to your exact specifications. Autogenous engineering blueprints, real-time bid evaluations, and strict Crib 5 fire compliances sync dynamically in your digital Client Portal."}
                  </p>

                  <div style={{ display: "flex", gap: "1.2rem", justifyContent: "flex-start" }}>
                    <button
                      className="btn-premium"
                      style={{
                        padding: "0.8rem 2rem",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        letterSpacing: "1px",
                        textTransform: "uppercase"
                      }}
                      onClick={() => {
                        if (user) {
                          setCurrentStageView("ClientPortal");
                          setClientPortalTab("Intake");
                        } else {
                          setAuthMode("signup");
                          setShowAuthGate(true);
                        }
                      }}
                    >
                      {lang === "Cn" ? "启动项目并整理规格" : "Start Project & Prepare Specifications"}
                    </button>
                  </div>
                </div>

                {/* Right: Asymmetric Showroom Image Card backed by a Travertine panel */}
                <div
                  className="hero-image-container"
                  style={{
                    position: "relative",
                    paddingRight: "15px",
                    paddingBottom: "15px",
                    display: "flex",
                    justifyContent: "center"
                  }}
                >
                  {/* Travertine-stone offset background panel */}
                  <div
                    style={{
                      position: "absolute",
                      right: "0",
                      bottom: "0",
                      width: "100%",
                      height: "100%",
                      backgroundColor: "var(--bg-tertiary)",
                      zIndex: 1,
                      borderRadius: "6px",
                      transform: "translate(10px, 10px)"
                    }}
                  ></div>
                  {/* Actual image container with border and zoom */}
                  <div
                    className="glass-card"
                    style={{
                      position: "relative",
                      zIndex: 2,
                      overflow: "hidden",
                      borderRadius: "6px",
                      aspectRatio: "1/1.1",
                      width: "100%",
                      border: "1px solid var(--glass-border)",
                      boxShadow: "var(--glass-shadow)",
                      transform: "translateY(0px)"
                    }}
                  >
                    <img
                      loading="lazy"
                      decoding="async"
                      className="hero-image-zoom"
                      src="/thecrafton-assets/crafton-hero-interior.jpg"
                      alt="A curated contract furniture interior by The Crafton"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {/* Editorial Model Tag */}
                    <div
                      style={{
                        position: "absolute",
                        top: "20px",
                        left: "20px",
                        background: "rgba(250, 247, 242, 0.9)",
                        backdropFilter: "blur(10px)",
                        padding: "0.4rem 0.8rem",
                        fontSize: "0.65rem",
                        fontWeight: "600",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        color: "var(--accent-primary)",
                        borderRadius: "2px",
                        border: "1px solid var(--glass-border)"
                      }}
                    >
                      CURATED ENVIRONMENTS
                    </div>
                    {/* Subtext info overlay at bottom of image */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0",
                        left: "0",
                        right: "0",
                        background: "linear-gradient(to top, rgba(26,25,24,0.85) 0%, rgba(26,25,24,0) 100%)",
                        padding: "2.5rem 1.5rem 1.5rem 1.5rem",
                        color: "#ffffff",
                        textAlign: "left"
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.35rem",
                          fontWeight: "400",
                          letterSpacing: "0.5px"
                        }}
                      >
                        Selected work — build-to-rent
                      </div>
                      <div
                        style={{
                          fontSize: "0.65rem",
                          opacity: "0.8",
                          marginTop: "5px",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          fontFamily: "var(--font-sans)"
                        }}
                      >
                        Designed · made · delivered
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Tell Us What You Need */}
              <div
                className="animate-editorial-slide-up"
                style={{
                  maxWidth: "1200px",
                  margin: "8rem auto 4rem auto",
                  padding: "0 2rem",
                  textAlign: "center"
                }}
              >
                <h2
                  style={{
                    fontSize: "3rem",
                    fontFamily: "var(--font-tech)",
                    color: "var(--text-primary)",
                    fontWeight: "300",
                    letterSpacing: "0.01em",
                    marginBottom: "1.2rem"
                  }}
                >
                  {lang === "Cn" ? (
                    <>
                      告訴我們您的<strong>需求。</strong>
                    </>
                  ) : (
                    <>
                      Tell us <em>what you need.</em>
                    </>
                  )}
                </h2>
                <p
                  style={{
                    fontSize: "0.98rem",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-sans)",
                    fontWeight: "300",
                    lineHeight: "1.8",
                    maxWidth: "850px",
                    margin: "0 auto 4rem auto"
                  }}
                >
                  {lang === "Cn"
                    ? "无论资料以何种文件格式存在，我们都能接手并整理成结构化项目规格书。"
                    : "However it lives in your filing system, we'll take it from there and structure it into a clear project brief."}
                </p>

                {/* 4 Cards Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "2rem"
                  }}
                >
                  {/* Card 1 */}
                  <div
                    className="glass-card"
                    style={{
                      border: "1px dashed rgba(124, 114, 103, 0.3)",
                      padding: "2.5rem 1.5rem",
                      borderRadius: "6px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease"
                    }}
                    onClick={() => {
                      if (user) {
                        setCurrentStageView("ClientPortal");
                        setClientPortalTab("Intake");
                      } else {
                        setAuthMode("signup");
                        setShowAuthGate(true);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 12px 24px rgba(124, 114, 103, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--accent-muted)",
                          letterSpacing: "0.1em",
                          fontFamily: "var(--font-sans)",
                          display: "block",
                          marginBottom: "1.2rem"
                        }}
                      >
                        No. 01
                      </span>
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(124, 114, 103, 0.05)",
                          border: "1px solid rgba(124, 114, 103, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 1.5rem auto"
                        }}
                      >
                        <svg
                          style={{ width: "22px", height: "24px", stroke: "var(--accent-primary)", fill: "none" }}
                          viewBox="0 0 24 24"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      <h4
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.2rem",
                          fontWeight: "400",
                          color: "var(--text-primary)",
                          marginBottom: "0.8rem"
                        }}
                      >
                        {lang === "Cn" ? (
                          <>
                            上傳 <em>PDF 文件</em>
                          </>
                        ) : (
                          <>
                            Upload a <em>PDF</em>
                          </>
                        )}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          lineHeight: "1.6",
                          fontWeight: "300",
                          minHeight: "40px"
                        }}
                      >
                        {lang === "Cn"
                          ? "設計規格書、招標書或單頁簡報，拖拽直接導入。"
                          : "A spec sheet, a tender pack, a single-page brief. Drop it in."}
                      </p>
                    </div>

                    <div>
                      {/* Interactive Mock Form */}
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid rgba(124,114,103,0.12)",
                          borderRadius: "4px",
                          padding: "1rem",
                          marginTop: "1.5rem",
                          boxShadow: "0 4px 12px rgba(26,25,24,0.02)",
                          textAlign: "left"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div
                            style={{
                              height: "6px",
                              width: "35%",
                              background: "rgba(124,114,103,0.3)",
                              borderRadius: "2px"
                            }}
                          ></div>
                          <div
                            style={{
                              height: "6px",
                              width: "75%",
                              background: "rgba(124,114,103,0.15)",
                              borderRadius: "2px"
                            }}
                          ></div>
                          <div
                            style={{
                              border: "1px solid rgba(124,114,103,0.1)",
                              borderRadius: "3px",
                              height: "22px",
                              display: "flex",
                              alignItems: "center",
                              padding: "0 0.4rem",
                              background: "#FAF7F2"
                            }}
                          >
                            <div
                              style={{
                                height: "5px",
                                width: "45%",
                                background: "rgba(124,114,103,0.2)",
                                borderRadius: "1px"
                              }}
                            ></div>
                          </div>
                          <div
                            style={{
                              border: "1px dashed var(--accent-primary)",
                              borderRadius: "3px",
                              height: "36px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "rgba(124,114,103,0.02)"
                            }}
                          >
                            <svg
                              style={{
                                width: "12px",
                                height: "12px",
                                stroke: "var(--accent-primary)",
                                fill: "none",
                                marginBottom: "2px"
                              }}
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                            <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Drop PDF Here</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className="card-link"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "var(--accent-primary)",
                          borderBottom: "1.5px solid rgba(124, 114, 103, 0.2)",
                          paddingBottom: "4px",
                          display: "inline-block",
                          marginTop: "1.5rem",
                          transition: "all 0.3s ease"
                        }}
                      >
                        {lang === "Cn" ? "選擇檔案 →" : "CHOOSE FILE →"}
                      </span>
                    </div>
                  </div>

                  {/* Card 2 (Highlighted Dark Card) */}
                  <div
                    style={{
                      backgroundColor: "#1C1B1A",
                      color: "#FAF7F2",
                      padding: "2.5rem 1.5rem",
                      borderRadius: "6px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      boxShadow: "0 15px 35px rgba(26, 25, 24, 0.15)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease"
                    }}
                    onClick={() => {
                      if (user) {
                        setCurrentStageView("ClientPortal");
                        setClientPortalTab("Intake");
                      } else {
                        setAuthMode("signup");
                        setShowAuthGate(true);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 20px 40px rgba(26, 25, 24, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 15px 35px rgba(26, 25, 24, 0.15)";
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "#C5B4A5",
                          opacity: "0.7",
                          letterSpacing: "0.1em",
                          fontFamily: "var(--font-sans)",
                          display: "block",
                          marginBottom: "1.2rem"
                        }}
                      >
                        No. 02
                      </span>
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          backgroundColor: "var(--accent-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 1.5rem auto"
                        }}
                      >
                        <svg
                          style={{ width: "22px", height: "22px", stroke: "#ffffff", fill: "none" }}
                          viewBox="0 0 24 24"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="9" y1="3" x2="9" y2="21" />
                          <line x1="15" y1="3" x2="15" y2="21" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                          <line x1="3" y1="15" x2="21" y2="15" />
                        </svg>
                      </div>
                      <h4
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.2rem",
                          fontWeight: "300",
                          color: "#ffffff",
                          marginBottom: "0.8rem"
                        }}
                      >
                        {lang === "Cn" ? (
                          <>
                            Excel <em>彙總表</em>
                          </>
                        ) : (
                          <>
                            Excel <em>summary</em>
                          </>
                        )}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.82rem",
                          color: "#C5B4A5",
                          opacity: "0.85",
                          lineHeight: "1.6",
                          fontWeight: "300",
                          minHeight: "40px"
                        }}
                      >
                        {lang === "Cn"
                          ? "包含產品清單、數量及規格尺寸的電子表格。"
                          : "A schedule of items, quantities and dimensions in a spreadsheet."}
                      </p>
                    </div>

                    <div>
                      {/* Interactive Dark Mock Form */}
                      <div
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "4px",
                          padding: "1rem",
                          marginTop: "1.5rem",
                          textAlign: "left"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div
                            style={{
                              height: "6px",
                              width: "40%",
                              background: "rgba(255, 255, 255, 0.3)",
                              borderRadius: "2px"
                            }}
                          ></div>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <div
                              style={{
                                flex: 1,
                                height: "18px",
                                background: "rgba(255, 255, 255, 0.08)",
                                borderRadius: "2px",
                                border: "1px solid rgba(255, 255, 255, 0.05)"
                              }}
                            ></div>
                            <div
                              style={{
                                flex: 1,
                                height: "18px",
                                background: "rgba(255, 255, 255, 0.08)",
                                borderRadius: "2px",
                                border: "1px solid rgba(255, 255, 255, 0.05)"
                              }}
                            ></div>
                            <div
                              style={{
                                flex: 1,
                                height: "18px",
                                background: "rgba(255, 255, 255, 0.08)",
                                borderRadius: "2px",
                                border: "1px solid rgba(255, 255, 255, 0.05)"
                              }}
                            ></div>
                          </div>
                          <div
                            style={{
                              height: "18px",
                              background: "var(--accent-primary)",
                              borderRadius: "2px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <div
                              style={{
                                height: "5px",
                                width: "35%",
                                background: "#ffffff",
                                opacity: 0.9,
                                borderRadius: "1px"
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <span
                        className="card-link"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "var(--accent-secondary)",
                          borderBottom: "1.5px solid rgba(197, 180, 165, 0.4)",
                          paddingBottom: "4px",
                          display: "inline-block",
                          marginTop: "1.5rem",
                          transition: "all 0.3s ease"
                        }}
                      >
                        {lang === "Cn" ? "上傳表格 →" : "UPLOAD SHEET →"}
                      </span>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div
                    className="glass-card"
                    style={{
                      border: "1px dashed rgba(124, 114, 103, 0.3)",
                      padding: "2.5rem 1.5rem",
                      borderRadius: "6px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease"
                    }}
                    onClick={() => {
                      if (user) {
                        setCurrentStageView("ClientPortal");
                        setClientPortalTab("Intake");
                      } else {
                        setAuthMode("signup");
                        setShowAuthGate(true);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 12px 24px rgba(124, 114, 103, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--accent-muted)",
                          letterSpacing: "0.1em",
                          fontFamily: "var(--font-sans)",
                          display: "block",
                          marginBottom: "1.2rem"
                        }}
                      >
                        No. 03
                      </span>
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(124, 114, 103, 0.05)",
                          border: "1px solid rgba(124, 114, 103, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 1.5rem auto"
                        }}
                      >
                        <svg
                          style={{ width: "22px", height: "22px", stroke: "var(--accent-primary)", fill: "none" }}
                          viewBox="0 0 24 24"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </div>
                      <h4
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.2rem",
                          fontWeight: "400",
                          color: "var(--text-primary)",
                          marginBottom: "0.8rem"
                        }}
                      >
                        {lang === "Cn" ? (
                          <>
                            文字<em>自由描述</em>
                          </>
                        ) : (
                          <>
                            Describe in <em>words</em>
                          </>
                        )}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          lineHeight: "1.6",
                          fontWeight: "300",
                          minHeight: "40px"
                        }}
                      >
                        {lang === "Cn"
                          ? "貼上電子郵件往來，直接輸入，或與我們語音交談。"
                          : "Paste an email thread, type it out, or talk us through it."}
                      </p>
                    </div>

                    <div>
                      {/* Interactive Mock Form */}
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid rgba(124,114,103,0.12)",
                          borderRadius: "4px",
                          padding: "1rem",
                          marginTop: "1.5rem",
                          boxShadow: "0 4px 12px rgba(26,25,24,0.02)",
                          textAlign: "left"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div
                            style={{
                              height: "6px",
                              width: "45%",
                              background: "rgba(124,114,103,0.3)",
                              borderRadius: "2px"
                            }}
                          ></div>
                          <div
                            style={{
                              border: "1px solid rgba(124,114,103,0.1)",
                              borderRadius: "3px",
                              padding: "0.4rem",
                              background: "#FAF7F2"
                            }}
                          >
                            <div
                              style={{
                                height: "5px",
                                width: "90%",
                                background: "rgba(124,114,103,0.15)",
                                borderRadius: "1px",
                                marginBottom: "4px"
                              }}
                            ></div>
                            <div
                              style={{
                                height: "5px",
                                width: "75%",
                                background: "rgba(124,114,103,0.15)",
                                borderRadius: "1px",
                                marginBottom: "4px"
                              }}
                            ></div>
                            <div
                              style={{
                                height: "5px",
                                width: "50%",
                                background: "rgba(124,114,103,0.15)",
                                borderRadius: "1px"
                              }}
                            ></div>
                          </div>
                          <div
                            style={{
                              height: "18px",
                              background: "var(--accent-primary)",
                              borderRadius: "2px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <div
                              style={{
                                height: "5px",
                                width: "35%",
                                background: "#ffffff",
                                opacity: 0.8,
                                borderRadius: "1px"
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <span
                        className="card-link"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "var(--accent-primary)",
                          borderBottom: "1.5px solid rgba(124, 114, 103, 0.2)",
                          paddingBottom: "4px",
                          display: "inline-block",
                          marginTop: "1.5rem",
                          transition: "all 0.3s ease"
                        }}
                      >
                        {lang === "Cn" ? "打開編輯器 →" : "OPEN EDITOR →"}
                      </span>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div
                    className="glass-card"
                    style={{
                      border: "1px dashed rgba(124, 114, 103, 0.3)",
                      padding: "2.5rem 1.5rem",
                      borderRadius: "6px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease"
                    }}
                    onClick={() => {
                      if (user) {
                        setCurrentStageView("ClientPortal");
                        setClientPortalTab("Intake");
                      } else {
                        setAuthMode("signup");
                        setShowAuthGate(true);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 12px 24px rgba(124, 114, 103, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--accent-muted)",
                          letterSpacing: "0.1em",
                          fontFamily: "var(--font-sans)",
                          display: "block",
                          marginBottom: "1.2rem"
                        }}
                      >
                        No. 04
                      </span>
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(124, 114, 103, 0.05)",
                          border: "1px solid rgba(124, 114, 103, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 1.5rem auto"
                        }}
                      >
                        <svg
                          style={{ width: "22px", height: "22px", stroke: "var(--accent-primary)", fill: "none" }}
                          viewBox="0 0 24 24"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </div>
                      <h4
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.2rem",
                          fontWeight: "400",
                          color: "var(--text-primary)",
                          marginBottom: "0.8rem"
                        }}
                      >
                        {lang === "Cn" ? (
                          <>
                            逐項<em>手動添加</em>
                          </>
                        ) : (
                          <>
                            Add <em>item by item</em>
                          </>
                        )}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          lineHeight: "1.6",
                          fontWeight: "300",
                          minHeight: "40px"
                        }}
                      >
                        {lang === "Cn"
                          ? "使用直觀的引導表單，一次建立一個產品的需求規格。"
                          : "Build the brief one product at a time using our guided form."}
                      </p>
                    </div>

                    <div>
                      {/* Interactive Mock Form */}
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid rgba(124,114,103,0.12)",
                          borderRadius: "4px",
                          padding: "1rem",
                          marginTop: "1.5rem",
                          boxShadow: "0 4px 12px rgba(26,25,24,0.02)",
                          textAlign: "left"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div
                              style={{
                                height: "6px",
                                width: "30%",
                                background: "rgba(124,114,103,0.3)",
                                borderRadius: "2px"
                              }}
                            ></div>
                            <div
                              style={{
                                height: "10px",
                                width: "10px",
                                borderRadius: "50%",
                                background: "var(--accent-green)"
                              }}
                            ></div>
                          </div>
                          <div
                            style={{
                              height: "5px",
                              width: "85%",
                              background: "rgba(124,114,103,0.15)",
                              borderRadius: "2px"
                            }}
                          ></div>
                          <div
                            style={{
                              border: "1px solid rgba(124,114,103,0.1)",
                              borderRadius: "3px",
                              height: "18px",
                              background: "#FAF7F2"
                            }}
                          ></div>
                          <div
                            style={{
                              border: "1px solid rgba(124,114,103,0.1)",
                              borderRadius: "3px",
                              height: "18px",
                              background: "#FAF7F2"
                            }}
                          ></div>
                        </div>
                      </div>

                      <span
                        className="card-link"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "var(--accent-primary)",
                          borderBottom: "1.5px solid rgba(124, 114, 103, 0.2)",
                          paddingBottom: "4px",
                          display: "inline-block",
                          marginTop: "1.5rem",
                          transition: "all 0.3s ease"
                        }}
                      >
                        {lang === "Cn" ? "開始填寫 →" : "START FORM →"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Set furniture is a standalone homepage section, not part of the intake cards. */}
              <SetFurnitureShowcase
                lang={lang}
                onSelectCategory={(categorySlug) => {
                  setSetFurnitureCategory(categorySlug);
                  setSetFurnitureProduct("");
                  setMarketingTab("SetFurniture");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />

              {/* Integration: Material Studio Configurator */}
              <div style={{ maxWidth: "1200px", margin: "0 auto 4rem auto", padding: "0 2rem" }}>
                <MaterialStudio
                  lang={lang}
                  selectedFabric={selectedFabric}
                  selectedLeg={selectedLeg}
                  configuratorCrib5Blocked={configuratorCrib5Blocked}
                  handleFabricSelect={handleFabricSelect}
                  handleLegSelect={handleLegSelect}
                />
              </div>

              {/* SECTION 1: 意式高定材质微观画廊 (The Digital Swatches Studio) */}
              <div
                className="animate-editorial-slide-up"
                style={{
                  maxWidth: "1200px",
                  margin: "6rem auto 6rem auto",
                  padding: "0 2rem",
                  textAlign: "left"
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "#7C7267",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-sans)",
                    display: "block",
                    marginBottom: "0.6rem"
                  }}
                >
                  {lang === "Cn" ? "意式高定材質微觀畫廊" : "EXQUISITE MATERIAL ATELIER"}
                </span>
                <h2
                  style={{
                    fontSize: "2.4rem",
                    fontFamily: "var(--font-tech)",
                    color: "var(--text-primary)",
                    fontWeight: "300",
                    marginBottom: "1rem",
                    letterSpacing: "0.02em"
                  }}
                >
                  {lang === "Cn" ? "觸摸微觀細節，感知意式匠心。" : "Touch the details. Feel the craft."}
                </h2>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-sans)",
                    fontWeight: "300",
                    lineHeight: "1.7",
                    maxWidth: "750px",
                    marginBottom: "3rem"
                  }}
                >
                  {lang === "Cn"
                    ? "高端合約採購本質上是對材質細節與安全性的考量。我們甄選符合最高標準的可持續硬木、拉絲金屬以及 BS 5852 Crib 5 消防阻燃面料，在您的專属雲端展廳中微觀呈現。"
                    : "Contract sourcing is defined by the integrity of materials. Explore our curated library of FSC sustainable hardwoods, sand-polished metals, and Crib 5 certified textiles in high-fidelity digital macro."}
                </p>

                {/* Swatches Grid Split-screen */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(280px, 1fr) 1.5fr",
                    gap: "3rem",
                    alignItems: "start"
                  }}
                >
                  {/* Left Selector List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {[
                      {
                        id: "nubuck",
                        nameCn: "意大利磨砂 Nubuck 皮革",
                        nameEn: "Tuscan Nubuck Leather",
                        color: "#B05B43",
                        subCn: "頂奢皮藝 · 消防合規",
                        subEn: "CRIB 5 FLAMMABILITY SECURED"
                      },
                      {
                        id: "linen",
                        nameCn: "比利時頂級雨露麻",
                        nameEn: "Belgian Dew-Retted Linen",
                        color: "#E5DEC9",
                        subCn: "環保面料 · 粗克重防霉",
                        subEn: "100% ORGANIC CERTIFIED"
                      },
                      {
                        id: "gold",
                        nameCn: "陽極氧化手磨香檳拉絲金",
                        nameEn: "Anodized Champagne Bronze",
                        color: "#C5B4A5",
                        subCn: "陽極氧化 · 無縫手磨拋光",
                        subEn: "FINGERPRINT-RESISTANT SUS304"
                      },
                      {
                        id: "walnut",
                        nameCn: "北美特級實心黑胡桃木",
                        nameEn: "FAS American Black Walnut",
                        color: "#5C4B40",
                        subCn: "FSC可持續硬木 · 真空窑干",
                        subEn: "8% MOISTURE WATER SECURED"
                      }
                    ].map((sw) => {
                      const isActive = activeSwatch === sw.id;
                      return (
                        <div
                          key={sw.id}
                          onClick={() => setActiveSwatch(sw.id)}
                          style={{
                            padding: "1.2rem 1.5rem",
                            background: isActive ? "var(--bg-secondary)" : "transparent",
                            border: isActive ? "1px solid var(--accent-primary)" : "1px solid var(--glass-border)",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "1.2rem",
                            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                            transform: isActive ? "translateX(10px)" : "translateX(0)",
                            boxShadow: isActive ? "var(--glass-shadow)" : "none"
                          }}
                          className="swatch-item-selector"
                        >
                          <span
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: sw.color,
                              border: "1px solid rgba(26,25,24,0.1)",
                              flexShrink: 0,
                              display: "block"
                            }}
                          />
                          <div style={{ textAlign: "left" }}>
                            <div
                              style={{
                                fontFamily: "var(--font-tech)",
                                fontSize: "1.05rem",
                                fontWeight: isActive ? "500" : "400",
                                color: "var(--text-primary)"
                              }}
                            >
                              {lang === "Cn" ? sw.nameCn : sw.nameEn}
                            </div>
                            <div
                              style={{
                                fontSize: "0.68rem",
                                letterSpacing: "1px",
                                textTransform: "uppercase",
                                color: "var(--accent-muted)",
                                marginTop: "3px",
                                fontFamily: "var(--font-sans)"
                              }}
                            >
                              {lang === "Cn" ? sw.subCn : sw.subEn}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Detail Showcase Card */}
                  <div
                    className="glass-card"
                    style={{
                      padding: "2.5rem",
                      borderRadius: "6px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--glass-border)",
                      boxShadow: "var(--glass-shadow)",
                      display: "grid",
                      gridTemplateColumns: "1fr 1.2fr",
                      gap: "2rem",
                      alignItems: "center",
                      minHeight: "380px"
                    }}
                  >
                    {/* Left: Swatch Image */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        aspectRatio: "1/1",
                        borderRadius: "4px",
                        overflow: "hidden",
                        border: "1px solid var(--glass-border)"
                      }}
                    >
                      <img
                        src={
                          activeSwatch === "nubuck"
                            ? "https://images.unsplash.com/photo-1581428982868-e410dd047a90?q=80&w=600&auto=format&fit=crop"
                            : activeSwatch === "linen"
                              ? "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=600&auto=format&fit=crop"
                              : activeSwatch === "gold"
                                ? "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=600&auto=format&fit=crop"
                                : "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop"
                        }
                        alt="Macro Swatch Material"
                        loading="lazy"
                        decoding="async"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          background: "rgba(26,25,24,0.75)",
                          backdropFilter: "blur(6px)",
                          padding: "3px 8px",
                          fontSize: "0.62rem",
                          color: "#ffffff",
                          borderRadius: "2px",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          fontFamily: "var(--font-sans)"
                        }}
                      >
                        MACRO RENDERING
                      </div>
                    </div>

                    {/* Right: Technical Spec Text */}
                    <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: "600",
                            letterSpacing: "1.5px",
                            color: "var(--accent-primary)",
                            fontFamily: "var(--font-sans)",
                            textTransform: "uppercase"
                          }}
                        >
                          {activeSwatch === "nubuck"
                            ? lang === "Cn"
                              ? "頂奢合約皮藝飾面"
                              : "ANILINE LEATHER FINISH"
                            : activeSwatch === "linen"
                              ? lang === "Cn"
                                ? "生態可持續亞麻紡織"
                                : "ECOLOGICAL COMPATIBLE TEXTILE"
                              : activeSwatch === "gold"
                                ? lang === "Cn"
                                  ? "工匠手工拉絲五金"
                                  : "HAND-SHIELDED METAL ARTISTRY"
                                : lang === "Cn"
                                  ? "FSC認證工藝硬實木"
                                  : "FSC CRAFTSMAN HARDWOOD"}
                        </span>
                        <h3
                          style={{
                            fontFamily: "var(--font-tech)",
                            fontSize: "1.5rem",
                            fontWeight: "400",
                            margin: "6px 0 0 0",
                            color: "var(--text-primary)"
                          }}
                        >
                          {activeSwatch === "nubuck"
                            ? lang === "Cn"
                              ? "意大利特級 Nubuck 磨砂皮革"
                              : "Tuscan Nubuck Leather"
                            : activeSwatch === "linen"
                              ? lang === "Cn"
                                ? "比利時天然雨露退膠亞麻"
                                : "Belgian Dew-Washed Linen"
                              : activeSwatch === "gold"
                                ? lang === "Cn"
                                  ? "不留紋拉絲陽極氧化香檳金"
                                  : "Anodized Champagne Gold Steel"
                                : lang === "Cn"
                                  ? "北美阿巴拉契亞 FAS 黑胡桃木"
                                  : "FAS American Black Walnut Wood"}
                        </h3>
                      </div>

                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                          lineHeight: "1.6",
                          fontWeight: "300",
                          margin: 0
                        }}
                      >
                        {activeSwatch === "nubuck"
                          ? lang === "Cn"
                            ? "精選北歐公牛皮，經意大利托斯卡納植鞣工藝精心硝製。表面經過極細砂纸磨砂拋光，保留真皮呼吸氣孔的同時，呈現如同天鵝絨般的極致磨砂微絨觸感。手感綿密，厚實耐磨。"
                            : "Full-grain northern European bull hides, vegetable-tanned in Tuscany. Lightly sanded to create a micro-velvet nubuck texture that retains genuine breathability, forming an elegant organic patina with age."
                          : activeSwatch === "linen"
                            ? lang === "Cn"
                              ? "來自西法蘭德斯大麻產區的天然有機原麻。採用傳統雨露退膠工藝，編織出粗克重天然肌理。防霉防蟎，克重高達 450g/㎡，防縮水且具備極佳的骨架挺拔度。"
                              : "Harvested in Belgium's famous flax valleys. Retains the authentic organic linen slub fibers. Features high tensile strength, resistance to mold, weighing 450g/sqm to guarantee elegant contract tailoring."
                            : activeSwatch === "gold"
                              ? lang === "Cn"
                                ? "選用加厚 SUS304 高精不銹鋼板。表面由十年經驗工匠在拉絲轉盤上物理手工打磨。在無氧車間進行精密陽極着色，多重氟碳防油膜保護，耐酸鹼、不留指紋痕跡，金属光澤在自然光下極具厚重感。"
                                : "Thickened SUS304 stainless base, hand-brushed on polishing turns. Coated in chemical anodized chambrays and topped with Monocoat protection against fingerprints and scratch, presenting a rich architectural sheen."
                              : lang === "Cn"
                                ? "嚴選阿巴拉契亞可持續硬木森林 FAS 特等木心。採用長達 65 天的漸進式真空蒸汽窯干處理，含水率在出廠時牢牢鎖定在 8% - 12% 之間，徹底隔絕在極乾氣候（如倫敦冬日暖氣）或潮濕環境下變形、爆裂的風險。"
                                : "FAS Appalachian timber hearts, vacuum kiln-dried for 65 days. The internal moisture is calibrated to exactly 8%-12% to lock structural volume and prevent bowing, cracking, or joint fatigue when deployed in dry climates."}
                      </p>

                      <div
                        style={{
                          borderTop: "1px solid rgba(124, 114, 103, 0.15)",
                          paddingTop: "0.8rem",
                          fontSize: "0.72rem",
                          fontFamily: "var(--font-sans)",
                          color: "var(--accent-primary)",
                          fontWeight: "600",
                          letterSpacing: "1px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "var(--accent-primary)",
                            display: "block"
                          }}
                        />
                        {activeSwatch === "nubuck"
                          ? lang === "Cn"
                            ? "等級：A級全粒面 · 消防安全：英國 BS 5852 Crib 5 阻燃合規"
                            : "GRADE: FAS FULL GRAIN · SAFETY: BRITISH BS 5852 CRIB 5 COMPLIANT"
                          : activeSwatch === "linen"
                            ? lang === "Cn"
                              ? "成分：100% 亞麻 · 耐磨：Martindale 35,000次 · 阻燃：支持CRIB 5"
                              : "COMPOS: 100% NATURAL · MARTINDALE: 35,000 rubs · CRIB 5 COMPATIBLE"
                            : activeSwatch === "gold"
                              ? lang === "Cn"
                                ? "工藝：手工拋光 ＋ 陽極氧化 · 耐腐蝕：鹽霧測試 480 小時無變色"
                                : "PROCESS: HAND POLISHED + ANODIZED · RESISTANCE: 480H CORROSION BARRIER"
                              : lang === "Cn"
                                ? "等級：USDA-FAS 特級 · 可持續：FSC 綠色認證 · 飾面：0-VOC 天然木蠟"
                                : "GRADE: FAS SPECIAL · SUSTAINABLE: FSC CERTIFIED · COATING: 0-VOC MONOCOAT"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: 手稿 ➔ CAD 智能双子对比滑块 (Digital Twin Blueprint Slider) */}
              <div
                className="animate-editorial-slide-up"
                style={{
                  maxWidth: "1200px",
                  margin: "6rem auto 6rem auto",
                  padding: "0 2rem",
                  textAlign: "left"
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "#7C7267",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-sans)",
                    display: "block",
                    marginBottom: "0.6rem"
                  }}
                >
                  {lang === "Cn" ? "靈感手稿與毫米級精密 CAD 雙子比對" : "DESIGN TWIN: SKETCH TO MILLIMETER CAD"}
                </span>
                <h2
                  style={{
                    fontSize: "2.4rem",
                    fontFamily: "var(--font-tech)",
                    color: "var(--text-primary)",
                    fontWeight: "300",
                    marginBottom: "1rem",
                    letterSpacing: "0.02em"
                  }}
                >
                  {lang === "Cn"
                    ? "從粗糙靈感，到精密工程規格的平滑演變。"
                    : "From raw sketch to millimeter-precision specs."}
                </h2>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-sans)",
                    fontWeight: "300",
                    lineHeight: "1.7",
                    maxWidth: "750px",
                    marginBottom: "2.5rem"
                  }}
                >
                  {lang === "Cn"
                    ? "拉动对比条查看客户尺寸手稿与三视标注 CAD 工程图，核对每一处尺寸与公差。"
                    : "Drag or slide the center bronze control. On the left is the client's pencil sketch or email brief. Slide right to witness its translation into a multi-elevation manufacturing blueprint."}
                </p>

                {/* Sliding Curtain Container */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "460px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--glass-shadow)",
                    background: "#1A1918",
                    userSelect: "none"
                  }}
                >
                  {/* Underlay layer: SKETCH (Full width) */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      background: "#FAF7F2", // Limestone warm paper background
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: "2rem"
                    }}
                  >
                    {/* Pencil hand-drawn chair drawing using responsive custom SVG */}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        maxWidth: "500px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
                      }}
                    >
                      <svg
                        viewBox="0 0 400 400"
                        style={{
                          width: "100%",
                          height: "320px",
                          stroke: "#7C7267",
                          fill: "none",
                          strokeWidth: "1.2",
                          strokeLinecap: "round",
                          strokeLinejoin: "round"
                        }}
                      >
                        {/* Hand-drawn sketchy paths */}
                        <path d="M 120 280 C 130 285, 140 285, 280 280" strokeDasharray="3 3" /> {/* Floor line */}
                        <path d="M 150 280 L 158 180" /> {/* Back leg left */}
                        <path d="M 250 278 L 242 195" /> {/* Front leg right */}
                        <path d="M 175 280 L 175 190" /> {/* Front leg left */}
                        <path d="M 225 278 L 225 190" /> {/* Back leg right */}
                        {/* Seat box */}
                        <path d="M 145 190 C 145 190, 180 180, 255 190 C 255 190, 240 215, 150 210 Z" />
                        <path d="M 150 210 L 250 210" />
                        {/* Backrest cushion */}
                        <path d="M 148 190 C 142 140, 155 100, 160 85 C 165 78, 205 76, 235 85 C 240 100, 242 140, 242 190 Z" />
                        <path d="M 170 100 C 180 110, 210 110, 220 100" /> {/* stitch lines */}
                        <path d="M 175 130 C 185 140, 205 140, 215 130" />
                        {/* Dimensions and handwritten notes */}
                        <text
                          x="140"
                          y="55"
                          fontFamily="'Cormorant Garamond', serif"
                          fontSize="14"
                          fontStyle="italic"
                          fill="#B05B43"
                        >
                          Make Back comfy & thick?
                        </text>
                        <text
                          x="270"
                          y="195"
                          fontFamily="'Cormorant Garamond', serif"
                          fontSize="14"
                          fontStyle="italic"
                          fill="#7C7267"
                        >
                          H ~ 45cm
                        </text>
                        <text
                          x="180"
                          y="325"
                          fontFamily="'Cormorant Garamond', serif"
                          fontSize="14"
                          fontStyle="italic"
                          fill="#7C7267"
                        >
                          W: 65cm approx.
                        </text>
                        {/* Annotation pointers */}
                        <path d="M 190 312 L 195 295" stroke="#7C7267" strokeWidth="0.8" />
                        <path d="M 285 205 L 255 200" stroke="#7C7267" strokeWidth="0.8" />
                      </svg>

                      {/* Watermark Label */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "25px",
                          left: "25px",
                          color: "var(--accent-muted)",
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.68rem",
                          fontWeight: "600",
                          letterSpacing: "1px"
                        }}
                      >
                        {lang === "Cn" ? "■ 客戶原始幾何手稿" : "■ ORIGINAL CLIENT BRIEF SKETCH"}
                      </div>
                    </div>
                  </div>

                  {/* Sliding overlay layer: HIGH-TECH CAD BLUEPRINT */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: `${100 - blueprintSliderPos}%`,
                      height: "100%",
                      background: "#151413", // Deep CAD background slate
                      overflow: "hidden",
                      borderLeft: "2px solid var(--accent-primary)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    {/* Blueprint grid offset matching layout */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "1000px", // Large fixed width to prevent text from squeezing during slide
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundImage:
                          "radial-gradient(rgba(176, 91, 67, 0.12) 1px, transparent 1px), linear-gradient(rgba(124, 114, 103, 0.05) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                        padding: "2rem"
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          maxWidth: "500px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          position: "relative"
                        }}
                      >
                        <svg
                          viewBox="0 0 400 400"
                          style={{
                            width: "100%",
                            height: "320px",
                            stroke: "var(--accent-primary)",
                            fill: "none",
                            strokeWidth: "1.2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round"
                          }}
                        >
                          {/* Precise engineering guidelines and crosshairs */}
                          <line
                            x1="30"
                            y1="200"
                            x2="370"
                            y2="200"
                            stroke="#7C7267"
                            strokeWidth="0.5"
                            strokeDasharray="5 5"
                          />
                          <line
                            x1="200"
                            y1="30"
                            x2="200"
                            y2="370"
                            stroke="#7C7267"
                            strokeWidth="0.5"
                            strokeDasharray="5 5"
                          />

                          {/* Coordinate circles */}
                          <circle cx="200" cy="200" r="140" stroke="rgba(124,114,103,0.15)" strokeWidth="0.8" />

                          {/* Solid legs with thickness */}
                          <line x1="150" y1="280" x2="158" y2="180" stroke="var(--accent-primary)" strokeWidth="2" />
                          <line x1="250" y1="278" x2="242" y2="195" stroke="var(--accent-primary)" strokeWidth="2" />
                          <line x1="175" y1="280" x2="175" y2="190" stroke="var(--accent-primary)" strokeWidth="2" />
                          <line x1="225" y1="278" x2="225" y2="190" stroke="var(--accent-primary)" strokeWidth="2" />

                          {/* Precise engineered seat pan */}
                          <path
                            d="M 145 190 L 255 190 L 245 210 L 155 210 Z"
                            stroke="var(--accent-primary)"
                            strokeWidth="1.5"
                          />

                          {/* Backrest profile with spline anchors */}
                          <path
                            d="M 148 190 Q 140 140, 160 85 Q 200 76, 235 85 Q 245 140, 242 190 Z"
                            stroke="var(--accent-primary)"
                            strokeWidth="1.5"
                          />

                          {/* Vector spline control vertices indicators */}
                          <rect x="158" y="83" width="4" height="4" fill="none" stroke="#FAF7F2" strokeWidth="0.8" />
                          <rect x="233" y="83" width="4" height="4" fill="none" stroke="#FAF7F2" strokeWidth="0.8" />
                          <rect x="146" y="188" width="4" height="4" fill="none" stroke="#FAF7F2" strokeWidth="0.8" />
                          <rect x="240" y="188" width="4" height="4" fill="none" stroke="#FAF7F2" strokeWidth="0.8" />

                          {/* Technical drawing dimension rules and arrows */}
                          {/* Width dimension */}
                          <path d="M 145 310 L 255 310" stroke="#FAF7F2" strokeWidth="0.8" />
                          <path d="M 145 307 L 145 313" stroke="#FAF7F2" strokeWidth="0.8" />
                          <path d="M 255 307 L 255 313" stroke="#FAF7F2" strokeWidth="0.8" />

                          {/* Height dimension */}
                          <path d="M 290 85 L 290 280" stroke="#FAF7F2" strokeWidth="0.8" />
                          <path d="M 287 85 L 293 85" stroke="#FAF7F2" strokeWidth="0.8" />
                          <path d="M 287 280 L 293 280" stroke="#FAF7F2" strokeWidth="0.8" />

                          {/* CAD vector labels */}
                          <text
                            x="168"
                            y="325"
                            fontFamily="var(--font-tech)"
                            fontSize="10"
                            fill="#FAF7F2"
                            letterSpacing="0.5"
                          >
                            W: 650.00 mm
                          </text>
                          <text
                            x="300"
                            y="185"
                            fontFamily="var(--font-tech)"
                            fontSize="10"
                            fill="#FAF7F2"
                            letterSpacing="0.5"
                          >
                            H: 850.00 mm
                          </text>
                          <text
                            x="180"
                            y="235"
                            fontFamily="var(--font-tech)"
                            fontSize="9"
                            fill="rgba(124,114,103,0.6)"
                            letterSpacing="0.5"
                          >
                            GRID INTERVAL: 10mm
                          </text>
                        </svg>

                        {/* Live technical info block */}
                        <div
                          style={{
                            position: "absolute",
                            top: "25px",
                            right: "25px",
                            border: "1px solid rgba(176,91,67,0.3)",
                            padding: "6px 12px",
                            background: "rgba(26,25,24,0.85)",
                            borderRadius: "2px",
                            textAlign: "left"
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "var(--font-tech)",
                              fontSize: "0.62rem",
                              color: "var(--accent-primary)",
                              letterSpacing: "1px",
                              textTransform: "uppercase"
                            }}
                          >
                            VECTOR ENGINE ACTIVE
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-tech)",
                              fontSize: "0.68rem",
                              color: "#FAF7F2",
                              marginTop: "2px"
                            }}
                          >
                            TOLERANCE: &lt; 0.15mm
                          </div>
                        </div>

                        {/* Bottom alignment caption */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "25px",
                            right: "25px",
                            color: "var(--accent-primary)",
                            fontFamily: "var(--font-sans)",
                            fontSize: "0.68rem",
                            fontWeight: "600",
                            letterSpacing: "1px"
                          }}
                        >
                          {lang === "Cn"
                            ? "■ AUTOMATIC CAD BLUEPRINT / 自動化製造圖紙"
                            : "■ AUTOMATIC MANUFACTURABLE CAD BLUEPRINT"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal range input overlay handling drags smoothly */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={blueprintSliderPos}
                    onChange={(e) => setBlueprintSliderPos(Number(e.target.value))}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "ew-resize",
                      zIndex: 20
                    }}
                  />

                  {/* Visual slider controller handle */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: `${blueprintSliderPos}%`,
                      width: "2px",
                      height: "100%",
                      background: "var(--accent-primary)",
                      pointerEvents: "none",
                      zIndex: 15,
                      boxShadow: "0 0 10px rgba(176, 91, 67, 0.5)"
                    }}
                  >
                    {/* Circular Handle Grab */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "var(--accent-primary)",
                        border: "2px solid #FAF7F2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                        color: "#FAF7F2",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        letterSpacing: "1px"
                      }}
                    >
                      ⇆
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: 极简艺术字信誉看板 (Atelier Credibility Ribbon) */}
              <div
                style={{
                  width: "100%",
                  background: "var(--bg-secondary)",
                  borderTop: "1px solid rgba(124, 114, 103, 0.12)",
                  borderBottom: "1px solid rgba(124, 114, 103, 0.12)",
                  padding: "4rem 2rem",
                  margin: "6rem 0 6rem 0"
                }}
              >
                <div
                  style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "3rem",
                    textAlign: "left"
                  }}
                >
                  {/* Metric 1 */}
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "3rem",
                        fontWeight: "300",
                        color: "var(--accent-primary)",
                        lineHeight: "1"
                      }}
                    >
                      3{" "}
                      <span style={{ fontSize: "1.2rem", fontFamily: "var(--font-sans)", fontWeight: "600" }}>
                        MILLS
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "1.1rem",
                        color: "var(--text-primary)",
                        margin: "10px 0 6px 0",
                        fontWeight: "400"
                      }}
                    >
                      {lang === "Cn" ? "三家嚴選代工廠" : "Vetted Contract Mills"}
                    </div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                        margin: 0,
                        fontWeight: "300"
                      }}
                    >
                      {lang === "Cn"
                        ? "精選佛山、惠州三大頂級合約加工廠，產線與技術完全打通，提供極致性價比與產能保障。"
                        : "Fully integrated production arrays across 3 elite Chinese manufacturing plants, ensuring quality and price."}
                    </p>
                  </div>

                  {/* Metric 2 */}
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "3rem",
                        fontWeight: "300",
                        color: "var(--accent-primary)",
                        lineHeight: "1"
                      }}
                    >
                      100%{" "}
                      <span style={{ fontSize: "1.2rem", fontFamily: "var(--font-sans)", fontWeight: "600" }}>
                        CRIB 5
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "1.1rem",
                        color: "var(--text-primary)",
                        margin: "10px 0 6px 0",
                        fontWeight: "400"
                      }}
                    >
                      {lang === "Cn" ? "消防安全自動攔截" : "Fire Compliance Gate"}
                    </div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                        margin: 0,
                        fontWeight: "300"
                      }}
                    >
                      {lang === "Cn"
                        ? "所有合約家具、皮革與海綿默認符合英國 BS 5852 消防高標準，系統預審檢索，拒絕不合格品。"
                        : "All fillings and fabrics meet UK BS 5852 fire standards by default. Non-compliant elements are blocked upfront."}
                    </p>
                  </div>

                  {/* Metric 3 */}
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "3rem",
                        fontWeight: "300",
                        color: "var(--accent-primary)",
                        lineHeight: "1"
                      }}
                    >
                      8%-12%{" "}
                      <span style={{ fontSize: "1.2rem", fontFamily: "var(--font-sans)", fontWeight: "600" }}>H₂O</span>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "1.1rem",
                        color: "var(--text-primary)",
                        margin: "10px 0 6px 0",
                        fontWeight: "400"
                      }}
                    >
                      {lang === "Cn" ? "精控實木含水率" : "Vacuum Wood Kiln-Dry"}
                    </div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                        margin: 0,
                        fontWeight: "300"
                      }}
                    >
                      {lang === "Cn"
                        ? "實木含水率穩鎖 8%-12%，徹底消除高端家具在倫敦冬季暖氣下翹曲、開裂的宿命隱患。"
                        : "Wood components are lock-dried to 8%-12% moisture. Eliminating cracking and warping under extreme indoor heat."}
                    </p>
                  </div>

                  {/* Metric 4 */}
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "3rem",
                        fontWeight: "300",
                        color: "var(--accent-primary)",
                        lineHeight: "1"
                      }}
                    >
                      1.5k+{" "}
                      <span style={{ fontSize: "1.2rem", fontFamily: "var(--font-sans)", fontWeight: "600" }}>
                        ITEMS
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "1.1rem",
                        color: "var(--text-primary)",
                        margin: "10px 0 6px 0",
                        fontWeight: "400"
                      }}
                    >
                      {lang === "Cn" ? "全球合約家具交付" : "B2B Items Delivered"}
                    </div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                        margin: 0,
                        fontWeight: "300"
                      }}
                    >
                      {lang === "Cn"
                        ? "在倫敦、赫特福德郡、聖奧爾本斯精品工裝項目均有交付案例，深受頂奢室內設計事務所信賴。"
                        : "Highly trusted by premium interior design ateliers, supplying boutique hotel and high-end residential sites."}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: 实时车间追踪微演示 (Interactive Milestone Live Demo) */}
              <div
                className="animate-editorial-slide-up"
                style={{
                  maxWidth: "1200px",
                  margin: "6rem auto 6rem auto",
                  padding: "0 2rem",
                  textAlign: "left"
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "#7C7267",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-sans)",
                    display: "block",
                    marginBottom: "0.6rem"
                  }}
                >
                  {lang === "Cn" ? "實時車間製造節點追蹤演示" : "CLIENT PORTAL PREVIEW: MILL PROGRESS SNEAK"}
                </span>
                <h2
                  style={{
                    fontSize: "2.4rem",
                    fontFamily: "var(--font-tech)",
                    color: "var(--text-primary)",
                    fontWeight: "300",
                    marginBottom: "1rem",
                    letterSpacing: "0.02em"
                  }}
                >
                  {lang === "Cn"
                    ? "足不出戶，車間現場動態一覽無遺。"
                    : "Watch the workshop, from anywhere in the world."}
                </h2>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-sans)",
                    fontWeight: "300",
                    lineHeight: "1.7",
                    maxWidth: "750px",
                    marginBottom: "3rem"
                  }}
                >
                  {lang === "Cn"
                    ? "我們為您的每個項目創建專屬的數字工作坊門戶。代工廠物料均貼有唯一二維碼，工匠在完成開料、軟包、飾面、包裝時掃碼登記。實拍大貨照即時上傳，Cho 與您共享掌控感。"
                    : "Every contract order is provisioned with a private tracking workshop. Craft mills log milestones by scanning item QR codes. Real-time site photographs and specifications sync to your dashboard."}
                </p>

                {/* Tracker Simulator Container */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(260px, 1fr) 1.5fr",
                    gap: "3rem",
                    alignItems: "start"
                  }}
                >
                  {/* Left workflow list selectors */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {[
                      {
                        id: "frame",
                        num: "STAGE 01",
                        nameCn: "Frame Woodwork · 木架工序",
                        nameEn: "FSC Wood Framing",
                        leadCn: "已完成 · 22 小時前",
                        leadEn: "Completed · 22h ago"
                      },
                      {
                        id: "upholstery",
                        num: "STAGE 02",
                        nameCn: "Upholstery Sew · 軟包工藝",
                        nameEn: "Stitching & Foam-Flipping",
                        leadCn: "進行中 · 正在覆蓋面料",
                        leadEn: "Active · Stitching classic swatches"
                      },
                      {
                        id: "finishing",
                        num: "STAGE 03",
                        nameCn: "Artisan Finishing · 表面拋光/噴漆",
                        nameEn: "Polishing & Anodizing",
                        leadCn: "預計 · 2 天內啟動",
                        leadEn: "Scheduled · Starts in 2 days"
                      },
                      {
                        id: "packaging",
                        num: "STAGE 04",
                        nameCn: "Protective Packaging · 木托安全打包",
                        nameEn: "Fitted Corner Protection",
                        leadCn: "預計 · 5 天內啟动",
                        leadEn: "Scheduled · Starts in 5 days"
                      }
                    ].map((ms) => {
                      const isActive = demoMilestone === ms.id;
                      return (
                        <div
                          key={ms.id}
                          onClick={() => setDemoMilestone(ms.id)}
                          style={{
                            padding: "1.2rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                            background: isActive ? "rgba(176, 91, 67, 0.05)" : "var(--bg-secondary)",
                            border: isActive ? "1px solid var(--accent-primary)" : "1px solid var(--glass-border)",
                            textAlign: "left",
                            transition: "all 0.25s ease"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span
                              style={{
                                fontFamily: "var(--font-tech)",
                                fontSize: "0.65rem",
                                letterSpacing: "1px",
                                color: isActive ? "var(--accent-primary)" : "var(--accent-muted)"
                              }}
                            >
                              {ms.num}
                            </span>
                            <span
                              style={{
                                fontSize: "0.65rem",
                                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                                fontWeight: isActive ? "600" : "400",
                                fontFamily: "var(--font-sans)"
                              }}
                            >
                              {lang === "Cn" ? ms.leadCn : ms.leadEn}
                            </span>
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-tech)",
                              fontSize: "1.1rem",
                              color: "var(--text-primary)",
                              marginTop: "6px",
                              fontWeight: isActive ? "500" : "400"
                            }}
                          >
                            {lang === "Cn" ? ms.nameCn : ms.nameEn}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right live feed simulator glass card */}
                  <div
                    className="glass-card"
                    style={{
                      padding: "2rem",
                      borderRadius: "6px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--glass-border)",
                      boxShadow: "var(--glass-shadow)",
                      textAlign: "left",
                      minHeight: "380px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    {/* Header line status */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid rgba(124, 114, 103, 0.12)",
                        paddingBottom: "1rem",
                        marginBottom: "1.2rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#5B9F4E", // Breathing green light
                            display: "block",
                            boxShadow: "0 0 8px #5B9F4E",
                            animation: "pulse 1.5s infinite"
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-tech)",
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            color: "var(--text-primary)",
                            letterSpacing: "1.5px"
                          }}
                        >
                          LIVE FEED FROM MILLS
                        </span>
                      </div>
                      <span
                        style={{ fontFamily: "var(--font-tech)", fontSize: "0.7rem", color: "var(--accent-muted)" }}
                      >
                        SYNC: 12S AGO | MILL-ID: #3_FOSHAN
                      </span>
                    </div>

                    {/* Middle grid image + spec audit */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr",
                        gap: "2rem",
                        alignItems: "center",
                        flex: 1
                      }}
                    >
                      {/* Left side workshop image */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          minHeight: "220px",
                          aspectRatio: "1.4/1",
                          borderRadius: "4px",
                          overflow: "hidden",
                          border: "1px solid var(--glass-border)"
                        }}
                      >
                        <img
                          src={activeWorkshopMedia.src}
                          alt={lang === "Cn" ? activeWorkshopMedia.altCn : activeWorkshopMedia.altEn}
                          loading="lazy"
                          decoding="async"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: "10px",
                            left: "10px",
                            background: "rgba(26,25,24,0.8)",
                            padding: "3px 8px",
                            fontSize: "0.6rem",
                            color: "#FAF7F2",
                            borderRadius: "2px",
                            fontFamily: "var(--font-tech)"
                          }}
                        >
                          QC PHOTO SIGNED BY MASTER CHO
                        </div>
                      </div>

                      {/* Right side spec logs */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                        <div>
                          <div
                            style={{
                              fontSize: "0.62rem",
                              letterSpacing: "1px",
                              color: "var(--accent-primary)",
                              textTransform: "uppercase",
                              fontFamily: "var(--font-sans)",
                              fontWeight: "600"
                            }}
                          >
                            {lang === "Cn" ? "工藝核對與質檢報告" : "PROCESS AUDIT SPEC"}
                          </div>
                          <h4
                            style={{
                              fontFamily: "var(--font-tech)",
                              fontSize: "1.15rem",
                              color: "var(--text-primary)",
                              margin: "4px 0 0 0",
                              fontWeight: "400"
                            }}
                          >
                            {demoMilestone === "frame"
                              ? lang === "Cn"
                                ? "白橡木榫卯框架精密度校準"
                                : "Appalachian Oak Framing"
                              : demoMilestone === "upholstery"
                                ? lang === "Cn"
                                  ? "阻燃回彈高密度海綿覆布"
                                  : "High-Density Foam Wrap"
                                : demoMilestone === "finishing"
                                  ? lang === "Cn"
                                    ? "啞光防刮氟碳漆噴塗"
                                    : "Matte Fluorocarbon Spray"
                                  : lang === "Cn"
                                    ? "特厚實木托盤與防護泡沫封裝"
                                    : "Solid Wooden Pallet Wrapping"}
                          </h4>
                        </div>

                        {/* Audit log text list */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                            fontSize: "0.78rem",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-sans)",
                            fontWeight: "300"
                          }}
                        >
                          {demoMilestone === "frame" ? (
                            <>
                              <div>
                                - {lang === "Cn" ? "FSC認證可持續木心檢查：通過" : "FSC certified core check: Passed"}
                              </div>
                              <div>
                                - {lang === "Cn" ? "物理含水率傳感儀測試：9.2%" : "Digital moisture sensor test: 9.2%"}
                              </div>
                              <div>
                                -{" "}
                                {lang === "Cn" ? "榫卯咬合公差度校準：< 0.1mm" : "Mortise fit tolerance test: < 0.1mm"}
                              </div>
                            </>
                          ) : demoMilestone === "upholstery" ? (
                            <>
                              <div>
                                -{" "}
                                {lang === "Cn"
                                  ? "英國 Crib 5 阻燃底襯檢查：通過"
                                  : "British BS 5852 Crib 5 barrier: Passed"}
                              </div>
                              <div>
                                -{" "}
                                {lang === "Cn"
                                  ? "面料拼接對位度 CV 驗證：100% 重合"
                                  : "Textile contour alignment CV: 100% Match"}
                              </div>
                              <div>
                                -{" "}
                                {lang === "Cn"
                                  ? "高回彈多層冷發泡海綿：35kg/m³ 達標"
                                  : "High resilience cold-cure foam: 35kg/m³ Ok"}
                              </div>
                            </>
                          ) : demoMilestone === "finishing" ? (
                            <>
                              <div>
                                -{" "}
                                {lang === "Cn"
                                  ? "香檳暗金拉絲紋理比對：合格"
                                  : "Brushed champagne grain contrast: Passed"}
                              </div>
                              <div>
                                -{" "}
                                {lang === "Cn"
                                  ? "零 VOC 天然漆硬度測試：2H 通過"
                                  : "Zero-VOC monocoat hardness test: 2H Passed"}
                              </div>
                              <div>
                                -{" "}
                                {lang === "Cn"
                                  ? "高溫恆濕烘烤固化時間：48小時"
                                  : "Oven humidity baking period: 48 hours"}
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                -{" "}
                                {lang === "Cn"
                                  ? "雙重防撞實木護角加固：裝配"
                                  : "Double-thick custom solid wood corner pads: Done"}
                              </div>
                              <div>
                                -{" "}
                                {lang === "Cn"
                                  ? "3D 排櫃算法最大容積圖：生成"
                                  : "3D cargo stacking plan bitmap: Auto-gen"}
                              </div>
                              <div>
                                -{" "}
                                {lang === "Cn" ? "倫敦項目在途標籤綁定：OK" : "London site transit tag matched: Ready"}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Append renderHowItWorksBlock() to the bottom of the overview tab content */}
              <div style={{ maxWidth: "1200px", margin: "4rem auto 0 auto", padding: "0 2rem" }} id="how-it-works">
                {renderHowItWorksBlock()}
              </div>
            </>
          )}

          {marketingTab === "CaseStudies" && (
            <div className="animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem" }}>
              {/* Case Studies Grid - Asymmetrical Editorial Layout */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                  gap: "2.5rem",
                  marginBottom: "4rem"
                }}
              >
                {[
                  {
                    id: "CASE-FA-01",
                    titleCn: "吉内斯特拉别墅",
                    titleEn: "Villa Ginestre",
                    locationCn: "意大利 科莫湖",
                    locationEn: "Lake Como, Italy",
                    descCn:
                      "为座落于意大利科莫湖畔的新建奢华别墅量身定制室内布局与高奢家具。Crafton 工匠以顶级美洲黑胡桃木打造手工格栅护墙，并提供精梳亚麻全定制休闲椅。全系列合规家具均通过严苛的 Crib 5 物理阻燃测试，完美融合自然触感与意式低调奢华。",
                    descEn:
                      "Bespoke interior architecture and customized furnishings for a newly built estate on Lake Como. Our craftspeople delivered fluted timber joinery and custom-woven luxury linen loungers. Every piece of contract seating was custom-fabricated to achieve Crib 5 fire-safety standards while celebrating natural textures.",
                    detailDescCn:
                      "這座落於意大利科莫湖畔的新建奢華別墅，由 THE CRAFTON 與頂級設計師團隊協作完成。為了呼應窗外科莫湖粼粼波光與阿爾卑斯山脈的自然輪廓，我們為項目定制了全套室內實木格柵護牆及活動家具。工匠採用特級美洲黑胡桃木 (WD-01)，經過真空窯乾精準控制含水率，打造出經久不變形的手工格柵；休閒椅選用比利時進口奢級雨露麻面料 (BF-08)，展現出無與倫比的天然肌理與挺拔骨架。同時，所有填充海綿與面料均符合英國 BS 5852 Crib 5 商業消防安全標準，確保在提供極致美學和親膚觸感的同時，達到頂級別墅對公眾合約採購的最高安全合規要求。",
                    detailDescEn:
                      "Nestled on the prestigious shores of Lake Como, this newly built luxury estate represents a bespoke collaboration between THE CRAFTON and master interior architects. To mirror the shimmering lake views and the Alpine silhouette, we manufactured custom fluted American Black Walnut (WD-01) wall paneling and loose furniture. Handcrafted from vacuum kiln-dried timber to lock internal moisture, the joinery resists expansion in lakeside humidity. The accompanying lounge seating features custom-tailored Belgian Combed Linen (BF-08), presenting a sophisticated, tactile drape. Emphasizing high-end contract safety, all materials and fillings strictly comply with British BS 5852 Crib 5 flammability standards, beautifully unifying modern Italian minimalism with heritage engineering.",
                    materials: [
                      { code: "WD-01", nameCn: "FAS級美洲黑胡桃木", nameEn: "FAS American Black Walnut" },
                      { code: "BF-08", nameCn: "比利時精梳雨露亞麻", nameEn: "Belgian Combed Linen" }
                    ],
                    img: "https://fosseyarora.com/wp-content/uploads/2023/03/Villa-Ginestre-Header-Image-scaled.jpg",
                    tagCn: "顶级私宅",
                    tagEn: "Luxury Residence",
                    initials: "VG",
                    specsCn:
                      "规格: Crib 5 消防阻燃 / 木料: 顶级美洲黑胡桃 / 面料: 比利时进口奢级亚麻 / 产地: Crafton 工艺车间",
                    specsEn:
                      "Specs: Crib 5 Fire-Rated / Timber: American Black Walnut / Fabric: Belgian Premium Linen / Origin: Crafton Atelier"
                  },
                  {
                    id: "CASE-FA-02",
                    titleCn: "格里布庄园别馆",
                    titleEn: "Glebe Cottage",
                    locationCn: "英国 科茨沃尔德",
                    locationEn: "Cotswolds, UK",
                    descCn:
                      "紧邻科茨沃尔德 Chastleton 庄园的历史保护别馆的全盘修复与家具定制。Crafton 工匠将现代开放式居住体验与乡村传统美学无缝契合，手工雕琢白橡木大餐桌与配套实木靠背椅。选用橄榄绿、深红与沙色，在历史悠久的岁月质感中注入极高防燃耐久度。",
                    descEn:
                      "A complete restoration of a historic cottage bordering the Chastleton Estate. Crafton blended contemporary open-plan living with rural heritage, hand-crafting a custom dining table and solid oak chairs. Rich natural tones of olive and deep red create an authentic, layered historic patina with modern structural durability.",
                    detailDescCn:
                      "格里布莊園別館是一次對科茨沃爾德二級保護歷史建築的深情致敬與極致翻新。在與業主和當地歷史保護學會的緊密協作下，THE CRAFTON 以現代開放式人居美學無縫契合英倫鄉村傳統。我們選用最頂級的歐洲白橡木 (WD-04) 打造宏大的手作大餐桌，表面採用古老的手工天然蜂蠟塗裝，在保留木材溫潤導管孔與獨特山形紋的同時，散發出優雅的歷史歲月質感。配套餐椅融合了高強度榫卯結構，兼備卓越的結構耐用度與極致美學比例，完美適應低頻家用與高頻會客等多元場景。",
                    detailDescEn:
                      "A heartfelt restoration and custom furnishing project for a historic Grade II listed cottage in the Cotswolds. Bordering the historic Chastleton Estate, Crafton blended contemporary open-plan flow with rural British heritage. Our artisans fabricated an expansive bespoke dining table and matching backrest chairs from Premium European White Oak (WD-04). Finished with traditional, organic beeswax hand-rubbing, the surface celebrates the wood's warm natural grain and open-pore character while establishing a resilient barrier. Constructed with authentic mortise-and-tenon joinery, the collection delivers peerless heritage charm combined with robust commercial-grade structural integrity.",
                    materials: [{ code: "WD-04", nameCn: "歐洲白橡木", nameEn: "European White Oak" }],
                    img: "https://fosseyarora.com/wp-content/uploads/2023/03/Glebe-Cottage-Header-Image-1.jpg",
                    tagCn: "庄园别馆",
                    tagEn: "Historic Estate",
                    initials: "GC",
                    specsCn: "规格: BS 5852 消防标准 / 木料: 欧洲白橡木 / 涂装: 手工天然蜂蜡 / 产地: Crafton 原木工坊",
                    specsEn:
                      "Specs: BS 5852 Certified / Timber: European White Oak / Finishing: Natural Beeswax / Origin: Crafton Bespoke Mill"
                  },
                  {
                    id: "CASE-FA-03",
                    titleCn: "Chastje 艺术探索空间",
                    titleEn: "Chastje Barn",
                    locationCn: "拉脱维亚",
                    locationEn: "Latvia",
                    descCn:
                      "将一座宏大历史谷仓改造成前卫的艺术探索和启发空间。Crafton 汲取导演 Wes Anderson 的独特美学风格，特别研发全套儿童安全级几何软包游乐单椅、音乐工作室声学阻尼垫及定制科学实验室一体台。将极高安全合规性与天马行空的童趣设计完美结合。",
                    descEn:
                      "Transformation of an expansive historic barn into an avant-garde creative and educational wonderland. Inspired by Wes Anderson's cinematic narratives, Crafton manufactured highly customized, kid-safe interactive geometric play seats, soft music room acoustics, and bespoke science lab workbenches.",
                    detailDescCn:
                      "Chastje 藝術探索空間將拉脫維亞一座宏偉的歷史谷倉徹底改造為前衛、充滿靈感與童心童趣的教育與創意冒險樂園。我們深度致敬導演韋斯·安德森（Wes Anderson）的對稱美學與高飽和度色彩對抗，為空間高定開發了極具藝術感的幾何遊樂單椅與防塵防霉阻尼背板。為了保證兒童及教育空間的嚴苛安全，全系列軟包製品精選天然抗菌的有機羊毛圈圈絨 (BF-02)，觸感如同雲朵般綿密舒適，且極易清潔維護。框架及金屬點綴採用手工拉絲香檳金 (MT-02)，100% 通過歐盟 EN 71-3 玩具級無毒無害安全環保合規認證，讓藝術想像與安全防護並行不悖。",
                    detailDescEn:
                      "Transforming a massive historic agricultural barn in Latvia into an avant-garde creative and educational sanctuary. Deeply inspired by Wes Anderson's cinematic symmetry and color blocking, Crafton produced whimsical geometric play seats, soft musical acoustic dampening, and safe laboratory workstations. Prioritizing child safety and institutional longevity, we upholstered the soft seating in ultra-soft, naturally anti-microbial Organic Bouclé (BF-02), while the structural nodes feature sand-polished Anodized Champagne Gold (MT-02). Every piece is fully compliant with the European EN 71-3 child safety standards and Crib 5 regulations, keeping spaces endlessly creative yet chemically pristine.",
                    materials: [
                      { code: "BF-02", nameCn: "有機羊毛圈圈絨", nameEn: "Organic Bouclé" },
                      { code: "MT-02", nameCn: "手工拉絲香檳金", nameEn: "Hand-Brushed Champagne Gold" }
                    ],
                    img: "https://fosseyarora.com/wp-content/uploads/2023/03/Chastje-Header-Image-2.jpg",
                    tagCn: "艺术创意空间",
                    tagEn: "Creative & Educational Hub",
                    initials: "CJ",
                    specsCn: "规格: 欧盟 EN 71-3 儿童安全 / 材质: 无毒环保抗菌面料 / 产地: Crafton 研发中心",
                    specsEn:
                      "Specs: EN 71-3 (Child-Safe) & Crib 5 / Materials: Non-Toxic Eco-Textiles / Origin: Crafton Innovation Labs"
                  },
                  {
                    id: "CASE-FA-04",
                    titleCn: "罗宾逊奢华共享公寓",
                    titleEn: "The Robinson",
                    locationCn: "英国 伦敦温布利",
                    locationEn: "Wembley, London, UK",
                    descCn:
                      "一座极富英伦幽默感与张扬个性的高尚共享生活空间。Crafton 为其定制了号称“伦敦最长的”的多彩拼色沙发组、高光木质护墙板及隔音丝绒电话亭。空间融合了达米安·赫斯特的色彩冲突，在完美通过 Crib 5 高频商用消防测试的同时，打造出极致吸睛的社交地标。",
                    descEn:
                      "An unapologetic, highly eccentric co-living development. Crafton manufactured the spectacular 'longest lounge seating bank in London' for the residents' hub, alongside custom timber wall panels and velvet phone booths, balancing bold social-media-ready features with high-traffic Crib 5 safety compliance.",
                    detailDescCn:
                      "這是一次富有英倫幽默、反叛張揚個性與極高合約規格的共享生活空間實踐。為了替倫敦溫布利的 The Robinson 打造一個極具話題度的社交大堂，THE CRAFTON 為其高定製造了號稱「倫敦最長」的多彩拼色模塊沙發、高光煙熏尤加利 (WD-07) 護牆板，以及隔音私密絲絨電話亭。沙發選用頂級重磅奢級棉絨 (BF-12)，具備高達 100,000 次 Martindale 循環耐磨強度，並通過了高規格 Crib 5 商業消防安全防護測試。空間的色彩衝突與極高頻公共使用的耐候性在我們內部智能製造的閉環管控下得到了完美融合，成為倫敦新晉的網紅打卡地標。",
                    detailDescEn:
                      "A high-impact, eccentric B2B contract project designed to redefine luxury co-living in Wembley, London. Crafton manufactured the spectacular 'longest lounge seating bank in London' for the central residents' hub, alongside custom Smoked Eucalyptus (WD-07) millwork and acoustic velvet phone booths. The modular sofas are clad in our heavy-traffic Crimson Cotton Velvet (BF-12), carrying a 100k Martindale rub rate and fully certified to British Crib 5 fire-safety standards. This ambitious project showcases Crafton's capability to balance bold, social-media-ready custom aesthetics with heavy-duty commercial longevity and institutional compliance.",
                    materials: [
                      { code: "BF-12", nameCn: "重磅奢級棉絨", nameEn: "Heavyweight Cotton Velvet" },
                      { code: "WD-07", nameCn: "煙熏尤加利實木", nameEn: "Smoked Eucalyptus" }
                    ],
                    img: "https://fosseyarora.com/wp-content/uploads/2023/03/KILO-0358-0025-1-scaled.jpg",
                    tagCn: "奢华共享公寓",
                    tagEn: "Luxury Co-Living & Lifestyle",
                    initials: "TR",
                    specsCn: "规格: Crib 5 商业高合规 / 面料: 全定制高耐磨丝绒 / 产地: Crafton 制造基地",
                    specsEn:
                      "Specs: Crib 5 High-Traffic Compliant / Fabrics: Custom Velvet & Bouclé / Origin: Crafton East Factory"
                  },
                  {
                    id: "CASE-FA-05",
                    titleCn: "卡多根广场大平层",
                    titleEn: "Cadogan Square",
                    locationCn: "英国 伦敦切尔西",
                    locationEn: "Chelsea, London, UK",
                    descCn:
                      "对伦敦切尔西核心区顶级大平层的奢华家具重塑。Crafton 为其定制了直通天花板的高光珍珠色软包大床头背板、手工抛光黄铜茶几及皇家深紫丝绒单椅。精美家具与大理石壁炉优雅互衬，展现了古典建筑比例与现代工艺的完美交融。",
                    descEn:
                      "Refining the interior of an ultra-exclusive Chelsea apartment. Crafton crafted an extraordinary ceiling-height headboard, bespoke gold-finished brass coffee tables, and tailored velvet accent chairs in rich Royal Purple, demonstrating a flawless fusion of classical volume with minimalist craftsmanship.",
                    detailDescCn:
                      "座落於倫敦切爾西核心街區，這是一次對挑高頂層豪華大平層的極致改造。THE CRAFTON 秉持意式奢華設計哲學，為業主定制了高達 4.5 米、直通天花板的高光珍珠色手工軟包床頭大背板，選用頂級防污重磅棉絨 (BF-12)，在視覺與觸覺上給予業主包裹式的奢華蠶繭體驗。客廳茶幾則由大理石與手工拉絲香檳金 (MT-02) 圓管組裝而成，金屬表面經過氟碳防指紋膜塗層防護，即使在自然光照射下也絕無炫目反光。每件家具的製造均經過 Crafton 專屬高定坊工藝大師簽名認證，古典對稱比例與現代精密金工在這裡和諧共生。",
                    detailDescEn:
                      "Located in the heart of Chelsea, London, this high-end residential project is an exploration of volumetric luxury. Crafton fabricated an extraordinary 4.5-meter ceiling-height headboard, individually upholstered in Royal Crimson Cotton Velvet (BF-12) to provide a soft, enveloping 'cocoon' experience in the master suite. This is paired with custom-engineered coffee tables featuring Hand-Brushed Champagne Gold (MT-02) structural legs, treated with an active anti-fingerprint layer to retain pristine metal luster. Signed off and certified by Master Cho at the Crafton Atelier, this collection showcases the flawless synthesis of classical British volumes with high-end Italian furniture tailoring.",
                    materials: [
                      { code: "MT-02", nameCn: "手工拉絲香檳金", nameEn: "Hand-Brushed Champagne Gold" },
                      { code: "BF-12", nameCn: "重磅奢級棉絨", nameEn: "Heavyweight Cotton Velvet" }
                    ],
                    img: "https://fosseyarora.com/wp-content/uploads/2022/10/cadogan-sq-15.png",
                    tagCn: "顶级高奢公寓",
                    tagEn: "Ultra-Luxury Penthouse",
                    initials: "CS",
                    specsCn: "规格: Crib 5 消防合规 / 金属: 手工拉丝黄铜镀金 / 产地: Crafton 精工车间",
                    specsEn:
                      "Specs: Crib 5 Compliant / Metalwork: Brushed Brass & Gilded Frame / Origin: Crafton Specialist Atelier"
                  },
                  {
                    id: "CASE-FA-06",
                    titleCn: "骑士桥奢雅公馆",
                    titleEn: "Lancelot Knightsbridge",
                    locationCn: "英国 伦敦骑士桥",
                    locationEn: "Knightsbridge, London, UK",
                    descCn:
                      "座落于伦敦高档街区的触觉美学典范。Crafton 为其量身打造低重心现代极简沙发组，精选马海毛与真丝混纺面料，并配以手工对纹大理石圆茶几。深色亮漆实木收纳柜在水滴水晶吊灯的映照下，流淌出极具层次感且宁静祥和的安享氛围。",
                    descEn:
                      "A masterclass in tactile luxury within London's most exclusive district. Crafton fabricated low-profile modernist lounge seating in sumptuous mohair and silk-blend fabrics, coupled with bespoke book-matched marble coffee tables, creating an exceptionally layered and calm interior retreat.",
                    detailDescCn:
                      "這座坐落於倫敦最貴街區騎士橋的公寓，是 THE CRAFTON 將觸覺美學與自然奢石推向極致的代表作。客廳中央的主茶几選用奢華意式卡拉卡塔紫大理石 (ST-01)，工匠在車間進行了精準的手工對紋拼接，保留了大理石原生的魅惑紫色脈絡與象牙白背景的鮮明對比；低重心休閒沙發椅則選用比利時進口精梳雨露麻 (BF-08) 搭配馬海毛與真絲混紡。全系列護牆及實木收納櫃表面採用不遮蓋木紋的啞光烤漆工藝，搭配水滴形水晶瀑布吊燈的暖色光暈，在喧囂的倫敦市中心為精英業主開闢了一方極其奢雅、安寧祥和的私人安享殿堂。",
                    detailDescEn:
                      "A masterpiece of tactile luxury within London's most exclusive Knightsbridge enclave. Crafton fabricated low-profile lounge chairs finished in organic Belgian Combed Linen (BF-08), paired with custom-crafted coffee tables featuring book-matched Italian Calacatta Viola (ST-01) marble. Our stonemasons precision-cut the marble block to display its deep claret veins and cream-white breccia in seamless symmetrical harmony. Supported by rich, matte-lacquered ash cabinetry, the light reflecting from crystal waterfalls bounces softly across raw textures, creating an incredibly serene, deeply layered luxury retreat from the urban pulse.",
                    materials: [
                      { code: "ST-01", nameCn: "意大利卡拉卡塔紫大理石", nameEn: "Italian Calacatta Viola" },
                      { code: "BF-08", nameCn: "比利時精梳雨露亞麻", nameEn: "Belgian Combed Linen" }
                    ],
                    img: "https://fosseyarora.com/wp-content/uploads/2021/06/lancelot-knightsbridge-4.jpeg",
                    tagCn: "骑士桥奢雅公馆",
                    tagEn: "Premium Private Residence",
                    initials: "LK",
                    specsCn:
                      "规格: BS 5852 消防认证 / 木作: 哑光漆白蜡木 / 面料: 马海毛真丝混纺 / 产地: Crafton 高定坊",
                    specsEn:
                      "Specs: BS 5852 Certified / Timber: Bog Oak & Lacquered Ash / Fabric: Mohair & Silk Blend / Origin: Crafton Atelier"
                  },
                  {
                    id: "CASE-FA-07",
                    titleCn: "埃尼斯莫尔私人公馆",
                    titleEn: "Ennismore Townhouse",
                    locationCn: "英国 伦敦骑士桥",
                    locationEn: "Knightsbridge, London, UK",
                    descCn:
                      "埃尼斯莫尔花园之内的贵族联排别馆。Crafton 为其打造全套手工雕刻大餐桌、奢华大堂扶手椅以及私人控温酒窖的定制实木博古架。将现代都市的前卫细节融入伦敦经典的历史风貌，为业主量身缔造尊贵的英伦生活方式。",
                    descEn:
                      "Exuding sophistication in Ennismore Gardens, this historic townhouse was fitted with Crafton's premium custom seating, hand-carved dining furniture, and bespoke wood panels for the temperature-controlled private wine cellar, harmonizing ultra-chic modern details with heritage architecture.",
                    detailDescCn:
                      "位於騎士橋埃尼斯莫爾花園之內的古典貴族聯排公館，是一場古典歷史外殼與前衛奢華室內的深度對話。THE CRAFTON 為這座受歷史保護的建築定制了整套餐廳及休閒區家具。寬大的手作餐廳大餐桌以美洲黑胡桃木 (WD-01) 與沙比利紅木拼花打造，搭配選用頂級全粒面馬鞍皮 (TL-09) 手工包裹縫裝的餐椅，皮質手感細膩，邊緣走線平整如畫。私人恆溫酒窖博古架與護牆則經由我們數位化 CAD 精密測量，完美契合拱頂。全案在完美契合 Crib 5 消防標準的基礎上，為當代貴族生活方式進行了尊貴的量身定制。",
                    detailDescEn:
                      "Exuding historical elegance within Ennismore Gardens, Knightsbridge, this heritage townhouse was completely refitted with Crafton's signature joinery and custom contract seating. In the formal dining room, we installed an artisan-crafted marquetry table made of American Black Walnut (WD-01), paired with dining chairs hand-wrapped in vegetable-tanned, Full-Grain Saddle Leather (TL-09) showcasing tight double-stitching. The private temperature-controlled wine cellar shelves are engineered with millimetric CAD tolerances to match the historic brick vaults, successfully blending high-end B2B safety certifications (Crib 5) with timeless, aristocratic lifestyle design.",
                    materials: [
                      { code: "WD-01", nameCn: "FAS級美洲黑胡桃木", nameEn: "FAS American Black Walnut" },
                      { code: "TL-09", nameCn: "頂級全粒面馬鞍皮", nameEn: "Full-Grain Saddle Leather" }
                    ],
                    img: "https://fosseyarora.com/wp-content/uploads/2022/10/ennismore_fetures.png",
                    tagCn: "定制私享公馆",
                    tagEn: "Bespoke Townhouse",
                    initials: "ET",
                    specsCn:
                      "规格: Crib 5 物理合规 / 木作: 沙比利红木 / 皮革: 顶级全粒面纳帕皮 / 产地: Crafton 工艺车间",
                    specsEn:
                      "Specs: Crib 5 Compliant / Carpentry: Bespoke Sapele Mahogany / Leather: Full-Grain Nappa / Origin: Crafton Atelier"
                  },
                  {
                    id: "CASE-FA-08",
                    titleCn: "诺丁山奢雅别院",
                    titleEn: "St Lukes Mews",
                    locationCn: "英国 伦敦诺丁山",
                    locationEn: "Notting Hill, London, UK",
                    descCn:
                      "座落于经典电影取景地诺丁山，屡获殊荣的马车房革新项目。Crafton 为其专属定制了“奢华蚕茧”家具套包，包含高定防污雪尼尔现代模块化沙发、手工胡桃木床头柜，以及用于私密屋顶露台的户外级缅甸柚木躺椅，展现了极致雅致的都市生活美学。",
                    descEn:
                      "An award-winning Mews home transformation in iconic Notting Hill. Crafton developed a 'cozy cocoon' furniture package, featuring minimalist modular sofas in performance chenille, custom walnut bedside tables, and outdoor-grade teak loungers for the private rooftop terrace.",
                    detailDescCn:
                      "座落於經典電影《真愛至上》取景地諾丁山，這座屢獲殊榮的馬車房（Mews Home）翻新工程打破了常規室內佈局。設計師將生活起居空間置於頂層，以享受極致的自然採光。THE CRAFTON 為該項目量身定制了「奢華蠶繭」家具套包。客廳核心沙發選用防污、防潑水高定雪尼爾面料與比利時雨露麻 (BF-08) 混紡，並配有手工打磨的美洲黑胡桃木 (WD-01) 抽屜床頭櫃。而在屋頂花園露台，工匠則選用頂級緬甸金絲柚木，經多道手工戶外防腐油塗刷，打造出奢華的露天休閒躺椅，完美呈現都市隱逸與高奢功能主義的極致融合。",
                    detailDescEn:
                      "An award-winning carriage house (Mews) transformation located in the iconic, film-famous streets of Notting Hill. Embracing an upside-down open-plan penthouse layout to maximize skylight exposure, Crafton delivered a fully integrated 'cozy cocoon' residential package. The central lounge features modular seating upholstered in Belgian Combed Linen (BF-08) and performance chenille, paired with solid American Black Walnut (WD-01) bedside tables. On the private rooftop oasis, we deployed premium-grade Burma Teak loungers treated with marine-grade outdoor protectants, delivering an exquisite, highly functional retreat embodying London's finest urban living.",
                    materials: [
                      { code: "WD-01", nameCn: "FAS級美洲黑胡桃木", nameEn: "FAS American Black Walnut" },
                      { code: "BF-08", nameCn: "比利時精梳雨露亞麻", nameEn: "Belgian Combed Linen" }
                    ],
                    img: "https://fosseyarora.com/wp-content/uploads/2022/10/xLetC1cQ-2048x1365-1.jpeg",
                    tagCn: "诺丁山奢雅别院",
                    tagEn: "Bespoke Mews Renovation",
                    initials: "SL",
                    specsCn:
                      "规格: Crib 5 消防标准 / 木料: 缅甸柚木 & 北美黑胡桃 / 面料: 防污防泼水雪尼尔 / 产地: Crafton 户外线",
                    specsEn:
                      "Specs: Crib 5 Compliant / Timber: Burma Teak & American Walnut / Fabric: Stain-Resistant Chenille / Origin: Crafton Outdoor"
                  }
                ].map((c, idx) => (
                  <div
                    key={c.id}
                    className="case-study-card glass-card"
                    onClick={() => setSelectedProject(c)}
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      cursor: "pointer",
                      gridColumn: idx === 0 || idx === 3 ? "span 2" : "span 1"
                    }}
                  >
                    <div
                      style={{
                        height: idx === 0 || idx === 3 ? "500px" : "360px",
                        overflow: "hidden",
                        position: "relative"
                      }}
                    >
                      <img
                        src={c.img}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                        alt={c.titleEn}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(26,25,24,0.85) 100%)",
                          zIndex: 1
                        }}
                      ></div>
                      <div
                        style={{
                          position: "absolute",
                          left: "1.5rem",
                          bottom: "1.5rem",
                          zIndex: 2,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem"
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-tech)",
                            color: "var(--accent-secondary)",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            letterSpacing: "2px",
                            textTransform: "uppercase"
                          }}
                        >
                          {c.initials} &nbsp;|&nbsp; {lang === "Cn" ? c.locationCn : c.locationEn}
                        </span>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: idx === 0 || idx === 3 ? "1.6rem" : "1.3rem",
                            color: "#FAF7F2",
                            fontWeight: "300",
                            fontFamily: "var(--font-tech)",
                            letterSpacing: "1px",
                            textShadow: "0 2px 4px rgba(0,0,0,0.6)"
                          }}
                        >
                          {lang === "Cn" ? c.titleCn : c.titleEn}
                        </h4>
                      </div>
                      <span
                        style={{
                          position: "absolute",
                          top: "1rem",
                          right: "1rem",
                          background: "rgba(26, 25, 24, 0.75)",
                          color: "var(--accent-primary)",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.7rem",
                          borderRadius: "3px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          zIndex: 2,
                          textTransform: "uppercase",
                          fontFamily: "var(--font-tech)"
                        }}
                      >
                        {lang === "Cn" ? c.tagCn : c.tagEn}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {marketingTab === "HowItWorks" && (
            <div
              className="animate-editorial-slide-up"
              style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem" }}
            >
              <div style={{ textAlign: "center", marginBottom: "4.5rem" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "#7C7267",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-sans)",
                    display: "block",
                    marginBottom: "0.8rem"
                  }}
                >
                  {lang === "Cn" ? "合作流程" : "OUR WORKFLOW"}
                </span>
                <h2
                  style={{
                    fontSize: "2.5rem",
                    fontFamily: "var(--font-tech)",
                    color: "var(--text-primary)",
                    fontWeight: "300",
                    letterSpacing: "0.02em",
                    marginBottom: "1rem"
                  }}
                >
                  {lang === "Cn" ? "四大交付階段 ── 合作流程。" : "Four phases of seamless delivery."}
                </h2>
                <div
                  style={{
                    width: "40px",
                    height: "1.5px",
                    background: "var(--accent-primary)",
                    margin: "1.5rem auto 0 auto"
                  }}
                ></div>
              </div>

              {/* 4 columns layout connected by line */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "2.2rem",
                  position: "relative"
                }}
              >
                {/* Phase I */}
                <div
                  className="glass-card"
                  style={{
                    padding: "2.5rem 2rem",
                    borderRadius: "6px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--glass-border)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "340px"
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.5rem"
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          color: "var(--accent-muted)"
                        }}
                      >
                        PHASE I
                      </span>
                      <svg
                        style={{ width: "18px", height: "18px", color: "var(--accent-primary)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12h4.5m-1.5-1.5h1.5m-7.5-3h7.5M6 21.75h12a3 3 0 003-3V12a3 3 0 00-3-3H6a3 3 0 00-3 3v6.75a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "1.4rem",
                        fontWeight: "400",
                        color: "var(--text-primary)",
                        marginBottom: "1rem"
                      }}
                    >
                      {lang === "Cn" ? "項目對接與報價" : "Brief & Quote"}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.88rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.7",
                        fontWeight: "300"
                      }}
                    >
                      {lang === "Cn"
                        ? "上傳 PDF 招標文件、粘貼 Excel 或是描述您的需求。我們將規格發送至三家受審代工廠進行比價，並並列展示供您挑選。"
                        : "Upload a PDF, paste an Excel, or describe what you need. We send to three vetted factories and lay the prices side by side. You pick."}
                    </p>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid rgba(124, 114, 103, 0.15)",
                      paddingTop: "1rem",
                      marginTop: "1.5rem",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      letterSpacing: "1px",
                      color: "var(--accent-muted)"
                    }}
                  >
                    {lang === "Cn" ? "第 1-2 週" : "WEEKS 1-2"}
                  </div>
                </div>

                {/* Phase II */}
                <div
                  className="glass-card"
                  style={{
                    padding: "2.5rem 2rem",
                    borderRadius: "6px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--glass-border)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "340px"
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.5rem"
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          color: "var(--accent-muted)"
                        }}
                      >
                        PHASE II
                      </span>
                      <svg
                        style={{ width: "18px", height: "18px", color: "var(--accent-primary)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                        />
                      </svg>
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "1.4rem",
                        fontWeight: "400",
                        color: "var(--text-primary)",
                        marginBottom: "1rem"
                      }}
                    >
                      {lang === "Cn" ? "規格定案與樣品" : "Spec & Samples"}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.88rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.7",
                        fontWeight: "300"
                      }}
                    >
                      {lang === "Cn"
                        ? "系統自動生成幾何三視圖、立面與材料方案。實物樣品將快遞寄送至您的府上，一鍵審批即可正式投產。"
                        : "Drawings auto-generated from your brief — plan, elevation, section, materials. Physical samples shipped to your door. You approve in a tap."}
                    </p>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid rgba(124, 114, 103, 0.15)",
                      paddingTop: "1rem",
                      marginTop: "1.5rem",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      letterSpacing: "1px",
                      color: "var(--accent-muted)"
                    }}
                  >
                    {lang === "Cn" ? "第 3-5 週" : "WEEKS 3-5"}
                  </div>
                </div>

                {/* Phase III (Burnt Terracotta Highlight) */}
                <div
                  className="glass-card"
                  style={{
                    padding: "2.5rem 2rem",
                    borderRadius: "6px",
                    background: "#B05B43", // Burnt Terracotta
                    border: "1px solid #B05B43",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "340px",
                    color: "#FAF7F2",
                    boxShadow: "0 15px 35px rgba(176, 91, 67, 0.25)",
                    transform: "scale(1.03)",
                    zIndex: "5"
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.5rem"
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          color: "#EBE5DF"
                        }}
                      >
                        PHASE III
                      </span>
                      <svg
                        style={{ width: "18px", height: "18px", color: "#FAF7F2" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "1.4rem",
                        fontWeight: "400",
                        color: "#FAF7F2",
                        marginBottom: "1rem"
                      }}
                    >
                      {lang === "Cn" ? "車間生產與追蹤" : "Production & Tracking"}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.88rem",
                        color: "#FAF7F2",
                        opacity: "0.9",
                        lineHeight: "1.7",
                        fontWeight: "300"
                      }}
                    >
                      {lang === "Cn"
                        ? "生產節點實時更新，並配備高清車間質檢相片。覆蓋木架、軟包、油漆與包裝。工廠生產，您線上實時監看。"
                        : "Live milestone updates with photos at every stage. Frame · upholstery · finishing · packaging. The factory works. You watch."}
                    </p>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid rgba(250, 247, 242, 0.3)",
                      paddingTop: "1rem",
                      marginTop: "1.5rem",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      letterSpacing: "1px",
                      color: "#FAF7F2"
                    }}
                  >
                    {lang === "Cn" ? "第 6-14 週" : "WEEKS 6-14"}
                  </div>
                </div>

                {/* Phase IV */}
                <div
                  className="glass-card"
                  style={{
                    padding: "2.5rem 2rem",
                    borderRadius: "6px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--glass-border)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "340px"
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.5rem"
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          color: "var(--accent-muted)"
                        }}
                      >
                        PHASE IV
                      </span>
                      <svg
                        style={{ width: "18px", height: "18px", color: "var(--accent-primary)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.959 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                        />
                      </svg>
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "1.4rem",
                        fontWeight: "400",
                        color: "var(--text-primary)",
                        marginBottom: "1rem"
                      }}
                    >
                      {lang === "Cn" ? "消防合規與交付" : "Compliance & Delivery"}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.88rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.7",
                        fontWeight: "300"
                      }}
                    >
                      {lang === "Cn"
                        ? "出廠前須通過四重合規質檢關卡。單證與清關手續全託管。安全、百分百準時送達您的指定項目現場。"
                        : "Four compliance gates passed before anything ships. Documents cross-checked. Customs handled. Delivered to your site, on time."}
                    </p>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid rgba(124, 114, 103, 0.15)",
                      paddingTop: "1rem",
                      marginTop: "1.5rem",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      letterSpacing: "1px",
                      color: "var(--accent-muted)"
                    }}
                  >
                    {lang === "Cn" ? "第 15-22 週" : "WEEKS 15-22"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {marketingTab === "MaterialLibrary" && (
            <MaterialLibrary
              lang={lang}
              onProceedToContact={(text) => {
                setContactMessage(text);
                setMarketingTab("Contact");
                setTimeout(() => {
                  const el = document.getElementById("contact-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
            />
          )}

          {marketingTab === "BespokeFurniture" && (
            <ErrorBoundary lang={lang}>
              <div
                className="animate-editorial-slide-up"
                style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem" }}
              >
                {/* Block 1: Your order, automated. Backed by quiet, tireless AI. */}
                <div style={{ marginBottom: "5rem" }}>
                  <ClientPortalTeaser
                    lang={lang}
                    selectedFabric={selectedFabric}
                    selectedLeg={selectedLeg}
                    setActiveIntakeModal={setActiveIntakeModal}
                  />
                </div>

                {/* Block 2: AI Computer Vision QA Diagnostics */}
                <div
                  style={{ borderTop: "1px solid rgba(124, 114, 103, 0.15)", paddingTop: "5rem", marginBottom: "5rem" }}
                >
                  <CVQASimulator lang={lang} selectedFabric={selectedFabric} selectedLeg={selectedLeg} />
                </div>

                {/* Block 3: Bespoke contract furniture engineered to endure. */}
                <div style={{ borderTop: "1px solid rgba(124, 114, 103, 0.15)", paddingTop: "5rem" }}>
                  <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#7C7267",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        fontFamily: "var(--font-sans)",
                        display: "block",
                        marginBottom: "0.8rem"
                      }}
                    >
                      {lang === "Cn" ? "高端定製" : "BESPOKE MANUFACTURING"}
                    </span>
                    <h2
                      style={{
                        fontSize: "2.5rem",
                        fontFamily: "var(--font-tech)",
                        color: "var(--text-primary)",
                        fontWeight: "300",
                        letterSpacing: "0.02em",
                        marginBottom: "1rem"
                      }}
                    >
                      {lang === "Cn"
                        ? "精雕細琢 ── 專屬合約定制系列。"
                        : "Bespoke contract furniture engineered to endure."}
                    </h2>
                    <div
                      style={{
                        width: "40px",
                        height: "1.5px",
                        background: "var(--accent-primary)",
                        margin: "1.5rem auto 0 auto"
                      }}
                    ></div>
                  </div>

                  {/* Craftsmanship Narratives Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                      gap: "2.5rem",
                      marginBottom: "1rem"
                    }}
                  >
                    {/* Story 1 */}
                    <div style={{ textAlign: "left" }}>
                      <h4
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.25rem",
                          fontWeight: "400",
                          color: "var(--text-primary)",
                          marginBottom: "0.8rem"
                        }}
                      >
                        {lang === "Cn" ? "🌳 甄選可持續實木硬木" : "🌳 Premium Hardwood Selection"}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-secondary)",
                          lineHeight: "1.7",
                          fontWeight: "300"
                        }}
                      >
                        {lang === "Cn"
                          ? "所有框架均採用經 FSC 認證的美國黑胡桃木、白橡木與歐洲山毛櫸。木材含水率嚴格烘乾至 8% - 12%，確保在高濕或極乾氣候下均不起翹不開裂。"
                          : "We source FSC-certified American walnut, white oak, and European beech wood. Kiln-dried to 8%-12% moisture content to prevent wrapping, cracking or joint separation."}
                      </p>
                    </div>
                    {/* Story 2 */}
                    <div style={{ textAlign: "left" }}>
                      <h4
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.25rem",
                          fontWeight: "400",
                          color: "var(--text-primary)",
                          marginBottom: "0.8rem"
                        }}
                      >
                        {lang === "Cn" ? "✨ 意式砂光金屬與表面處理" : "✨ Artisan Sand-Polished Metal Finishes"}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-secondary)",
                          lineHeight: "1.7",
                          fontWeight: "300"
                        }}
                      >
                        {lang === "Cn"
                          ? "配備香檳金拉絲、黑鈦拉丝與高精砂光不銹鋼。所有焊接均由十年以上匠人手工打磨、拋光，保證在自然光下展現無接縫、無瑕疵的完美過渡。"
                          : "Brushed champagne bronze, matte gunmetal, and micro-sanded stainless steel. Every joint is hand-shielded and polished by seasoned artisans to eliminate visible seams."}
                      </p>
                    </div>
                    {/* Story 3 */}
                    <div style={{ textAlign: "left" }}>
                      <h4
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.25rem",
                          fontWeight: "400",
                          color: "var(--text-primary)",
                          marginBottom: "0.8rem"
                        }}
                      >
                        {lang === "Cn" ? "🔥 英國 BS 5852 Crib 5 消防標準" : "🔥 Strict UK BS 5852 Crib 5 Compliance"}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-secondary)",
                          lineHeight: "1.7",
                          fontWeight: "300"
                        }}
                      >
                        {lang === "Cn"
                          ? "專為高奢酒店、會所和公共場所設計。所有海綿和麵料均默認提供 BS 5852 阻燃測試證書，出廠前進行明火噴槍考驗，確保萬無一失。"
                          : "Engineered specifically for boutique hospitality and public spaces. All foam cores, interliners, and fabrics come fully certified to British BS 5852 fire safety requirements."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          )}

          {marketingTab === "SetFurniture" && (
            <SetFurnitureCatalog
              lang={lang}
              categorySlug={setFurnitureCategory}
              productId={setFurnitureProduct}
              onSelectCategory={(categorySlug) => {
                setSetFurnitureCategory(categorySlug);
                setSetFurnitureProduct("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onSelectProduct={(productId) => {
                setSetFurnitureProduct(productId);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onBackToCatalog={() => {
                setSetFurnitureProduct("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onRequestQuote={(selections) => {
                const selectedItems = Array.isArray(selections) ? selections : [];
                const totalQuantity = selectedItems.reduce(
                  (total, selection) => total + Number(selection.quantity || 0),
                  0
                );
                setPendingSetFurnitureSelection(selectedItems);
                setModalProjectName(
                  selectedItems.length === 1
                    ? `${selectedItems[0].product.name} Project`
                    : lang === "Cn"
                      ? "Set Furniture 家具项目"
                      : "Set Furniture Project"
                );
                setModalDestination("");
                setModalQuantity(`${totalQuantity} pcs / ${selectedItems.length} designs`);
                setModalTextBrief(
                  selectedItems
                    .map(
                      ({ product, category, quantity }) =>
                        `${quantity} × ${product.name} (${product.code}). Category: ${category.nameEn}. Unit price: ${product.currency} ${product.price}. Material: ${product.material}. Reference dimensions: ${product.dimensions}. Compliance: ${product.compliance}.`
                    )
                    .join("\n")
                );
                setActiveIntakeModal("item");
              }}
            />
          )}

          {marketingTab === "LegacySetFurniture" && (
            <div
              className="animate-editorial-slide-up"
              style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem" }}
            >
              <div style={{ textAlign: "center", marginBottom: "4.5rem" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "#7C7267",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-sans)",
                    display: "block",
                    marginBottom: "0.8rem"
                  }}
                >
                  {lang === "Cn" ? "標準套配" : "CURATED SET COLLECTIONS"}
                </span>
                <h2
                  style={{
                    fontSize: "2.5rem",
                    fontFamily: "var(--font-tech)",
                    color: "var(--text-primary)",
                    fontWeight: "300",
                    letterSpacing: "0.02em",
                    marginBottom: "1rem"
                  }}
                >
                  {lang === "Cn" ? "標準套配系列 ── B2B 整合採購方案。" : "Curated contract furniture packages."}
                </h2>
                <div
                  style={{
                    width: "40px",
                    height: "1.5px",
                    background: "var(--accent-primary)",
                    margin: "1.5rem auto 0 auto"
                  }}
                ></div>
              </div>

              {/* Curated sets grid */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5rem"
                }}
              >
                {/* Suite 1: Milano Elegance */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "3.5rem",
                    alignItems: "center"
                  }}
                  className="hidden-mobile-grid"
                >
                  <div className="glass-card" style={{ borderRadius: "6px", overflow: "hidden", aspectRatio: "4/3" }}>
                    <img
                      src={IMAGES.setMilano}
                      alt="Milano Elegance Lobby Package"
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "#B05B43",
                        fontWeight: "600",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "0.5rem"
                      }}
                    >
                      {lang === "Cn" ? "大堂奢華系列" : "LOBBY & LOUNGE"}
                    </span>
                    <h3
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "2rem",
                        fontWeight: "400",
                        color: "var(--text-primary)",
                        marginBottom: "1rem"
                      }}
                    >
                      {lang === "Cn" ? "「米蘭雅緻」大堂配套 (Milano Elegance)" : "Milano Elegance Lobby Package"}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.92rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.8",
                        fontWeight: "300",
                        marginBottom: "1.8rem"
                      }}
                    >
                      {lang === "Cn"
                        ? "專為高端精品酒店及豪宅大堂設計。低矮流線的休閒沙發、天然洞石茶几與實木胡桃木邊櫃完美交融，營造優雅、內斂的意大利極簡尊貴質感。"
                        : "Low-profile lounge suites in travertine and sand-washed linen. Curated for luxury hotel receptions and elite apartment lobbies, blending rich walnut credenzas and custom sculptural brass armchairs."}
                    </p>
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        padding: "1.2rem",
                        borderRadius: "4px",
                        border: "1px solid var(--glass-border)",
                        marginBottom: "2rem"
                      }}
                    >
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                        <strong>{lang === "Cn" ? "套配清單：" : "Package Includes:"}</strong>
                        <br />
                        {lang === "Cn"
                          ? "2x 大堂定制休閒沙發, 4x 洞石不規則邊几, 1x 實木胡桃木定制邊櫃, 2x 藝術雕塑單椅。"
                          : "2x Lounge Sofas, 4x Travertine Side Tables, 1x Solid Walnut Credenza, 2x Sculptural Accent Chairs."}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "2rem",
                          marginTop: "1rem",
                          borderTop: "1px solid rgba(124,114,103,0.1)",
                          paddingTop: "0.8rem"
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>
                            {lang === "Cn" ? "估算體積" : "EST. VOLUME"}
                          </span>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>14.5 m³</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>
                            {lang === "Cn" ? "定制工期" : "PRODUCTION LEAD"}
                          </span>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                            8 {lang === "Cn" ? "週" : "Weeks"}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn-premium"
                      style={{ padding: "0.6rem 1.6rem" }}
                      onClick={() => {
                        setModalProjectName("Milano Elegance Lobby Curated Package");
                        setModalDestination("London, UK");
                        setModalQuantity("15 sets");
                        setActiveIntakeModal("item");
                      }}
                    >
                      {lang === "Cn" ? "索取本套配最優報價 →" : "Request Curated Quote →"}
                    </button>
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid rgba(124, 114, 103, 0.15)" }} />

                {/* Suite 2: Toscana Warmth */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "3.5rem",
                    alignItems: "center"
                  }}
                  className="hidden-mobile-grid"
                >
                  <div style={{ textAlign: "left" }}>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "#B05B43",
                        fontWeight: "600",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "0.5rem"
                      }}
                    >
                      {lang === "Cn" ? "精品客房系列" : "SUITE & BEDROOM"}
                    </span>
                    <h3
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "2rem",
                        fontWeight: "400",
                        color: "var(--text-primary)",
                        marginBottom: "1rem"
                      }}
                    >
                      {lang === "Cn" ? "「托斯卡納溫馨」客房配套 (Toscana Warmth)" : "Toscana Warmth Bedroom Suite"}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.92rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.8",
                        fontWeight: "300",
                        marginBottom: "1.8rem"
                      }}
                    >
                      {lang === "Cn"
                        ? "溫暖的實木胡桃木床架、手工縫製的真皮床頭背板與暗青銅金屬配件完美匹配。為酒店住客提供沉浸式的托斯卡納莊園暖意與極致安寧體驗。"
                        : "Warm walnut bedframes, hand-stitched leather panels, and bronze fixtures. Curated to wrap guests in Tuscan serenity, creating an inviting, residential-grade feel with contract-grade durability."}
                    </p>
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        padding: "1.2rem",
                        borderRadius: "4px",
                        border: "1px solid var(--glass-border)",
                        marginBottom: "2rem"
                      }}
                    >
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                        <strong>{lang === "Cn" ? "套配清單：" : "Package Includes:"}</strong>
                        <br />
                        {lang === "Cn"
                          ? "1x 奢華大床架 (真皮靠背), 2x 特製床頭櫃, 1x 全實木書桌椅, 1x 精奢客房單人沙發, 1x 一體化衣櫃。"
                          : "1x King Bedframe, 2x Integrated Nightstands, 1x Writing Desk, 1x Lounge Armchair, 1x Wardrobe."}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "2rem",
                          marginTop: "1rem",
                          borderTop: "1px solid rgba(124,114,103,0.1)",
                          paddingTop: "0.8rem"
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>
                            {lang === "Cn" ? "估算體積" : "EST. VOLUME"}
                          </span>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>11.2 m³</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>
                            {lang === "Cn" ? "定制工期" : "PRODUCTION LEAD"}
                          </span>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                            10 {lang === "Cn" ? "週" : "Weeks"}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn-premium"
                      style={{ padding: "0.6rem 1.6rem" }}
                      onClick={() => {
                        setModalProjectName("Toscana Curated Guestrooms Suite");
                        setModalDestination("Florence, Italy");
                        setModalQuantity("40 sets");
                        setActiveIntakeModal("item");
                      }}
                    >
                      {lang === "Cn" ? "索取本套配最優報價 →" : "Request Curated Quote →"}
                    </button>
                  </div>
                  <div className="glass-card" style={{ borderRadius: "6px", overflow: "hidden", aspectRatio: "4/3" }}>
                    <img
                      src={IMAGES.setToscana}
                      alt="Toscana Curated Bed Suite"
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid rgba(124, 114, 103, 0.15)" }} />

                {/* Suite 3: Venezia Contemporary */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "3.5rem",
                    alignItems: "center"
                  }}
                  className="hidden-mobile-grid"
                >
                  <div className="glass-card" style={{ borderRadius: "6px", overflow: "hidden", aspectRatio: "4/3" }}>
                    <img
                      src={IMAGES.setVenezia}
                      alt="Venezia Dining Set"
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "#B05B43",
                        fontWeight: "600",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "0.5rem"
                      }}
                    >
                      {lang === "Cn" ? "精緻餐廚系列" : "FINE DINING RESTAURANT"}
                    </span>
                    <h3
                      style={{
                        fontFamily: "var(--font-tech)",
                        fontSize: "2rem",
                        fontWeight: "400",
                        color: "var(--text-primary)",
                        marginBottom: "1rem"
                      }}
                    >
                      {lang === "Cn"
                        ? "「威尼斯現代」餐廚系列 (Venezia Contemporary)"
                        : "Venezia Contemporary Dining Set"}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.92rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.8",
                        fontWeight: "300",
                        marginBottom: "1.8rem"
                      }}
                    >
                      {lang === "Cn"
                        ? "雕塑般的白橡木長餐几、圓潤低背皮質餐椅與奢華大理石餐邊櫃交錯，展現極具張力的幾何美感與威尼斯運河畔的現代風韻。"
                        : "Sculptural oak dining tables and low-back dining chairs. Crafted for high-end boutique restaurants and VIP dining rooms, with brushed travertine sidings and premium contract grain leather."}
                    </p>
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        padding: "1.2rem",
                        borderRadius: "4px",
                        border: "1px solid var(--glass-border)",
                        marginBottom: "2rem"
                      }}
                    >
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                        <strong>{lang === "Cn" ? "套配清單：" : "Package Includes:"}</strong>
                        <br />
                        {lang === "Cn"
                          ? "1x 雕塑白橡木長餐几 (10人座), 10x 精製低背牛皮餐椅, 1x 奢華大理石定制餐邊櫃。"
                          : "1x 10-Seater Oak Table, 10x Tailored Leather Dining Chairs, 1x Marble Sideboard."}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "2rem",
                          marginTop: "1rem",
                          borderTop: "1px solid rgba(124,114,103,0.1)",
                          paddingTop: "0.8rem"
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>
                            {lang === "Cn" ? "估算體積" : "EST. VOLUME"}
                          </span>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>8.8 m³</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>
                            {lang === "Cn" ? "定制工期" : "PRODUCTION LEAD"}
                          </span>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                            7 {lang === "Cn" ? "週" : "Weeks"}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn-premium"
                      style={{ padding: "0.6rem 1.6rem" }}
                      onClick={() => {
                        setModalProjectName("Venezia Restaurant Sourcing Package");
                        setModalDestination("Venice, Italy");
                        setModalQuantity("10 sets");
                        setActiveIntakeModal("item");
                      }}
                    >
                      {lang === "Cn" ? "索取本套配最優報價 →" : "Request Curated Quote →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {marketingTab === "Contact" && (
            <div
              id="contact-section"
              className="animate-fade-in"
              style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}
            >
              {renderContactBlock()}
            </div>
          )}

          {renderFooter()}
        </div>
      )}

      {/* VIEW 2: Client Portal (Member Center) */}
      {currentView === "ClientPortal" && (
        <div
          className={`crafton-client-view animate-fade-in ${clientPortalTab === "Tracker" ? "client-tracker-mode" : ""}`}
          style={{
            padding: clientPortalTab === "Tracker" ? "0" : "2rem",
            maxWidth: clientPortalTab === "Tracker" ? "none" : "1200px",
            margin: "0 auto"
          }}
        >
          {!user ? (
            /* Premium Hard Gated Information Screen if not logged in */
            <div
              className="glass-card"
              style={{
                maxWidth: "800px",
                margin: "4rem auto",
                padding: "4rem 3rem",
                textAlign: "center",
                background: "#FAF9F6",
                border: "1px solid rgba(124, 114, 103, 0.15)",
                borderRadius: "16px",
                boxShadow: "0 20px 40px rgba(28, 27, 24, 0.05)"
              }}
            >
              <span
                className="logo-badge"
                style={{
                  marginBottom: "1.5rem",
                  background: "rgba(124, 114, 103, 0.08)",
                  color: "var(--accent-primary)"
                }}
              >
                {lang === "Cn" ? "商業機密安全防護門檻" : "COMMERCIAL INTELLECTUAL PROPERTY SECURITY"}
              </span>
              <h2
                style={{
                  fontFamily: "'Outfit', 'Inter', sans-serif",
                  fontWeight: "600",
                  fontSize: "2.5rem",
                  letterSpacing: "-0.02em",
                  color: "#1C1B18",
                  marginBottom: "1.5rem",
                  lineHeight: "1.2"
                }}
              >
                {lang === "Cn" ? "高端合約製造圖紙與規格保護" : "Secure Gate: Drawings & Specifications"}
              </h2>
              <p
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "1.15rem",
                  fontStyle: "italic",
                  color: "#7C7267",
                  lineHeight: "1.8",
                  maxWidth: "600px",
                  margin: "0 auto 2.5rem auto"
                }}
              >
                {lang === "Cn"
                  ? "「為確保定製合約家具圖紙、BOM 材料清單及工廠競標數據等商業機密，我們對該客戶專區實施 RLS 加密。請登入或註冊您的 B2B 設計師帳戶以查看或導入新項目。」"
                  : "“To protect proprietary contract drawings, manufacturing BOM specifications, and competitive factory bids, this dashboard is guarded by secure RLS. Please sign in or register to access the premium project tracker or submit new briefs.”"}
              </p>
              <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
                <button
                  className="btn-premium"
                  style={{ padding: "0.8rem 2.5rem", fontSize: "1rem" }}
                  onClick={() => {
                    setAuthMode("login");
                    setShowAuthGate(true);
                  }}
                >
                  {lang === "Cn" ? "登入帳戶" : "Sign In"}
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: "0.8rem 2.5rem", fontSize: "1rem", borderColor: "rgba(124, 114, 103, 0.3)" }}
                  onClick={() => {
                    setAuthMode("signup");
                    setShowAuthGate(true);
                  }}
                >
                  {lang === "Cn" ? "註冊新帳戶" : "Create Account"}
                </button>
              </div>
            </div>
          ) : (
            /* Authenticated Client View with Dual Tab */
            <>
              <div
                className="client-portal-legacy-heading"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  borderBottom: "1px solid var(--glass-border)",
                  paddingBottom: "1rem",
                  flexWrap: "wrap",
                  gap: "1rem"
                }}
              >
                <div>
                  <h2 style={{ fontFamily: "var(--font-tech)", color: "var(--accent-cyan)", marginBottom: "0.3rem" }}>
                    {lang === "Cn" ? "THE CRAFTON - 客戶專屬控制台" : "THE CRAFTON - CLIENT CONSOLE"}
                  </h2>
                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                    <span
                      onClick={() => setClientPortalTab("Intake")}
                      style={{
                        fontSize: "1rem",
                        fontFamily: "var(--font-tech)",
                        fontWeight: "600",
                        color: clientPortalTab === "Intake" ? "var(--accent-primary)" : "var(--text-secondary)",
                        borderBottom: clientPortalTab === "Intake" ? "2px solid var(--accent-primary)" : "none",
                        paddingBottom: "0.4rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <svg
                        style={{ width: "16px", height: "16px", marginRight: "6px" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                      </svg>
                      <span>{lang === "Cn" ? "需求詳情錄入 (Project Intake)" : "Project Intake (New Sketch)"}</span>
                    </span>
                    <span
                      onClick={() => setClientPortalTab("Support")}
                      style={{
                        fontSize: "1rem",
                        fontFamily: "var(--font-tech)",
                        fontWeight: "600",
                        color: clientPortalTab === "Support" ? "var(--accent-primary)" : "var(--text-secondary)",
                        borderBottom: clientPortalTab === "Support" ? "2px solid var(--accent-primary)" : "none",
                        paddingBottom: "0.4rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "none",
                        alignItems: "center"
                      }}
                    >
                      <svg
                        style={{ width: "16px", height: "16px", marginRight: "6px" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
                        <path d="M8 9h8M8 13h5" />
                      </svg>
                      <span>{lang === "Cn" ? "项目客服接待" : "Project Concierge"}</span>
                    </span>
                    <span
                      onClick={() => setClientPortalTab("Tracker")}
                      style={{
                        fontSize: "1rem",
                        fontFamily: "var(--font-tech)",
                        fontWeight: "600",
                        color: clientPortalTab === "Tracker" ? "var(--accent-primary)" : "var(--text-secondary)",
                        borderBottom: clientPortalTab === "Tracker" ? "2px solid var(--accent-primary)" : "none",
                        paddingBottom: "0.4rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "inline-flex",
                        alignItems: "center"
                      }}
                    >
                      <svg
                        style={{ width: "16px", height: "16px", marginRight: "6px" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 20V10M12 20V4M6 20v-6" />
                      </svg>
                      <span>
                        {lang === "Cn" ? "進度跟蹤看板 (Interactive Tracker)" : "Interactive Tracker & Specs"}
                      </span>
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                  <div
                    style={{
                      background: "rgba(124, 114, 103, 0.08)",
                      padding: "0.4rem 1rem",
                      borderRadius: "2px",
                      border: "1px solid var(--glass-border)",
                      fontSize: "0.85rem"
                    }}
                  >
                    <strong
                      style={{ color: "var(--accent-primary)", fontFamily: "var(--font-tech)", fontWeight: "bold" }}
                    >
                      {lang === "Cn" ? "項目與訂單總覽" : "Projects & Orders Overview"}
                    </strong>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {lang === "Cn"
                      ? `設計師: ${user.name} | 公司: ${user.company}`
                      : `Designer: ${user.name} | Co: ${user.company}`}
                  </span>
                </div>
              </div>

              {clientPortalTab === "Support" && (
                <div
                  className="dashboard-panels animate-fade-in"
                  style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "2rem", marginTop: "1.5rem" }}
                >
                  <div
                    className="glass-card"
                    style={{ padding: "1.5rem", display: "flex", flexDirection: "column", minHeight: "620px" }}
                  >
                    <div
                      className="panel-header"
                      style={{
                        marginBottom: "1rem",
                        borderBottom: "1px solid rgba(124, 114, 103, 0.1)",
                        paddingBottom: "1rem"
                      }}
                    >
                      <div
                        className="panel-title"
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.05rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <svg
                          style={{ width: "18px", height: "18px", color: "var(--accent-primary)" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
                          <path d="M8 9h8M8 13h5" />
                        </svg>
                        <span>{lang === "Cn" ? "Crafton 项目客服" : "Crafton Concierge"}</span>
                      </div>
                      <p
                        style={{
                          margin: "0.5rem 0 0",
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          lineHeight: "1.5"
                        }}
                      >
                        {lang === "Cn"
                          ? "请直接描述您的项目需求，也可以上传图纸、图片、PDF 或 Excel 清单。我们会整理成项目资料并安排专人跟进。"
                          : "Describe your project brief or upload drawings, images, PDFs, or Excel lists. We will organize the materials and follow up with a project draft."}
                      </p>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        padding: "0.5rem",
                        background: "rgba(124, 114, 103, 0.025)",
                        border: "1px solid rgba(124, 114, 103, 0.12)",
                        borderRadius: "4px"
                      }}
                    >
                      {supportMessages.map((message, idx) => (
                        <div
                          key={`${message.sender}-${idx}`}
                          style={{
                            alignSelf: message.sender === "client" ? "flex-end" : "flex-start",
                            maxWidth: "78%",
                            padding: "0.75rem 0.85rem",
                            borderRadius: "4px",
                            background: message.sender === "client" ? "rgba(74, 61, 51, 0.92)" : "#FFFFFF",
                            color: message.sender === "client" ? "#FFFFFF" : "var(--text-primary)",
                            border:
                              message.sender === "client"
                                ? "1px solid rgba(74, 61, 51, 0.2)"
                                : "1px solid rgba(124, 114, 103, 0.16)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                            fontSize: "0.86rem",
                            lineHeight: "1.55",
                            whiteSpace: "pre-wrap"
                          }}
                        >
                          {message.text}
                        </div>
                      ))}
                      {supportIsTyping && (
                        <div
                          style={{
                            alignSelf: "flex-start",
                            padding: "0.65rem 0.8rem",
                            borderRadius: "4px",
                            background: "#FFFFFF",
                            border: "1px solid rgba(124, 114, 103, 0.16)",
                            color: "var(--text-muted)",
                            fontSize: "0.82rem"
                          }}
                        >
                          {lang === "Cn" ? "项目客服正在整理回复..." : "Crafton concierge is drafting..."}
                        </div>
                      )}
                    </div>

                    <form
                      onSubmit={handleSupportSend}
                      style={{ marginTop: "1rem", display: "flex", gap: "0.65rem", alignItems: "stretch" }}
                    >
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => document.getElementById("support-file-upload").click()}
                        title={lang === "Cn" ? "上传客户文件" : "Upload client file"}
                        style={{ width: "44px", minWidth: "44px", padding: 0, display: "grid", placeItems: "center" }}
                      >
                        <svg
                          style={{ width: "17px", height: "17px" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                        </svg>
                      </button>
                      <input
                        id="support-file-upload"
                        type="file"
                        style={{ display: "none" }}
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.txt"
                        onChange={handleSupportFileSelect}
                      />
                      <input
                        className="chat-input"
                        value={supportInput}
                        onChange={(e) => setSupportInput(e.target.value)}
                        placeholder={
                          lang === "Cn"
                            ? "描述需求，例如：40把大堂扶手椅，伦敦酒店，海军蓝亚麻，需要 Crib 5..."
                            : "Describe the brief, e.g. 40 lobby armchairs, London hotel, navy linen, Crib 5..."
                        }
                        style={{
                          flex: 1,
                          background: "#FFFFFF",
                          border: "1px solid var(--glass-border)",
                          color: "var(--text-primary)",
                          borderRadius: "2px",
                          padding: "0.75rem"
                        }}
                      />
                      <button
                        type="submit"
                        className="btn-premium"
                        disabled={!supportInput.trim() || supportIsTyping}
                        style={{ padding: "0 1rem" }}
                      >
                        {lang === "Cn" ? "发送" : "Send"}
                      </button>
                    </form>

                    {supportSelectedFileName && (
                      <div
                        style={{
                          marginTop: "0.6rem",
                          fontSize: "0.78rem",
                          color: "var(--accent-primary)",
                          wordBreak: "break-word"
                        }}
                      >
                        {lang === "Cn" ? "已接收文件：" : "Received file: "}
                        {supportSelectedFileName}
                      </div>
                    )}
                  </div>

                  <div
                    className="glass-card"
                    style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
                  >
                    <div>
                      <h3
                        style={{
                          fontFamily: "var(--font-tech)",
                          color: "var(--text-primary)",
                          fontSize: "1rem",
                          marginBottom: "0.4rem"
                        }}
                      >
                        {lang === "Cn" ? "服务流程" : "Service Flow"}
                      </h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: "1.65", margin: 0 }}>
                        {lang === "Cn"
                          ? "我会先帮您把零散需求整理清楚，包括数量、交付地、材质、防火要求、参考图纸和预算。资料齐全后，Crafton 团队会生成项目草稿并交由 Cho 审核。"
                          : "We first organize your quantities, destination, materials, fire-safety needs, references, and budget. Once ready, the Crafton team prepares a project draft for Cho's review."}
                      </p>
                    </div>

                    <div
                      style={{
                        border: "1px solid rgba(124, 114, 103, 0.14)",
                        background: "rgba(255,255,255,0.55)",
                        borderRadius: "4px",
                        padding: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem"
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em"
                        }}
                      >
                        {lang === "Cn" ? "当前项目摘要" : "Current Project Summary"}
                      </div>
                      <div style={{ fontSize: "0.84rem", color: "var(--text-primary)", lineHeight: "1.6" }}>
                        <strong>{lang === "Cn" ? "项目：" : "Project: "}</strong>
                        {intakeProjectName || "-"}
                        <br />
                        <strong>{lang === "Cn" ? "目的地：" : "Destination: "}</strong>
                        {intakeDestination || "-"}
                        <br />
                        <strong>{lang === "Cn" ? "数量：" : "Quantity: "}</strong>
                        {intakeQuantity || "-"}
                        <br />
                        <strong>{lang === "Cn" ? "附件：" : "File: "}</strong>
                        {supportSelectedFileName ||
                          (lang === "Cn" ? "将生成对话摘要 TXT" : "Chat transcript TXT will be generated")}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-premium"
                      onClick={handleSupportHandoffToIntake}
                      disabled={isIntakeUploading || supportIsTyping}
                      style={{
                        width: "100%",
                        padding: "0.85rem",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}
                    >
                      <svg
                        style={{ width: "16px", height: "16px" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                      <span>
                        {supportSubmittedJobId
                          ? lang === "Cn"
                            ? "查看图片解析任务"
                            : "View Image Analysis Task"
                          : lang === "Cn"
                            ? "提交项目需求"
                            : "Submit Project Brief"}
                      </span>
                    </button>

                    {supportStatus && (
                      <div
                        style={{
                          padding: "0.75rem",
                          border: "1px solid rgba(122, 135, 117, 0.35)",
                          background: "rgba(122, 135, 117, 0.08)",
                          color: "var(--text-secondary)",
                          fontSize: "0.8rem",
                          lineHeight: "1.5",
                          borderRadius: "3px",
                          wordBreak: "break-word"
                        }}
                      >
                        {supportStatus}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setClientPortalTab("Intake")}
                      style={{ width: "100%", padding: "0.75rem" }}
                    >
                      {lang === "Cn" ? "打开完整需求表单" : "Open Full Intake Form"}
                    </button>
                  </div>
                </div>
              )}

              {clientPortalTab === "Intake" && (
                <div
                  className="dashboard-panels animate-fade-in"
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1.5rem" }}
                >
                  {/* Left Form: B2B Project Intake Form */}
                  <div className="glass-card" style={{ padding: "2rem" }}>
                    <div
                      className="panel-header"
                      style={{ marginBottom: "1.5rem", borderBottom: "1px solid rgba(124, 114, 103, 0.1)" }}
                    >
                      <div
                        className="panel-title"
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <svg
                          style={{ width: "16px", height: "16px", color: "var(--accent-primary)" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>{lang === "Cn" ? "項目設計與製造詳情" : "Bespoke Project Briefing Specifications"}</span>
                      </div>
                    </div>
                    <form
                      onSubmit={handleIntakeSubmit}
                      style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-secondary)" }}>
                          {lang === "Cn" ? "項目名稱" : "PROJECT NAME"}
                        </label>
                        <input
                          type="text"
                          className="chat-input"
                          value={intakeProjectName}
                          onChange={(e) => setIntakeProjectName(e.target.value)}
                          placeholder={
                            lang === "Cn" ? "例如：St Albans 精品酒店大堂" : "e.g. St Albans Boutique Hotel Lobby"
                          }
                          style={{
                            width: "100%",
                            background: "#FFFFFF",
                            padding: "0.6rem",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-primary)",
                            borderRadius: "2px"
                          }}
                          required
                        />
                      </div>

                      <div className="intake-form-section">
                        <div className="intake-form-section-title">
                          <span>00</span>
                          <strong>Order overview</strong>
                        </div>
                        <div className="intake-form-grid">
                          <label className="intake-field">
                            <span>Delivery destination</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeDestination}
                              onChange={(e) => setIntakeDestination(e.target.value)}
                              placeholder="e.g. London, UK"
                              required
                            />
                          </label>
                          <label className="intake-field">
                            <span>Quantity and style mix</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeQuantity}
                              onChange={(e) => setIntakeQuantity(e.target.value)}
                              placeholder="e.g. 40 lobby armchairs, 20 club chairs"
                              required
                            />
                          </label>
                        </div>
                      </div>

                      <div className="intake-form-section">
                        <div className="intake-form-section-title">
                          <span>01</span>
                          <strong>Furniture specification</strong>
                        </div>
                        <div className="intake-form-grid">
                          <label className="intake-field">
                            <span>Furniture type</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeItemType}
                              onChange={(e) => setIntakeItemType(e.target.value)}
                              placeholder="Lobby chair, sofa, dining table, cabinet..."
                              required
                            />
                          </label>
                          <label className="intake-field">
                            <span>Use location</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeUsageLocation}
                              onChange={(e) => setIntakeUsageLocation(e.target.value)}
                              placeholder="Hotel lobby, restaurant, suite, outdoor terrace..."
                            />
                          </label>
                          <label className="intake-field">
                            <span>Length</span>
                            <input
                              type="number"
                              className="chat-input"
                              min="0"
                              value={intakeLength}
                              onChange={(e) => setIntakeLength(e.target.value)}
                              placeholder="650"
                              required
                            />
                          </label>
                          <label className="intake-field">
                            <span>Width / depth</span>
                            <input
                              type="number"
                              className="chat-input"
                              min="0"
                              value={intakeWidth}
                              onChange={(e) => setIntakeWidth(e.target.value)}
                              placeholder="600"
                              required
                            />
                          </label>
                          <label className="intake-field">
                            <span>Height</span>
                            <input
                              type="number"
                              className="chat-input"
                              min="0"
                              value={intakeHeight}
                              onChange={(e) => setIntakeHeight(e.target.value)}
                              placeholder="850"
                              required
                            />
                          </label>
                          <label className="intake-field">
                            <span>Unit</span>
                            <select
                              className="chat-input"
                              value={intakeDimensionUnit}
                              onChange={(e) => setIntakeDimensionUnit(e.target.value)}
                            >
                              <option value="mm">mm</option>
                              <option value="cm">cm</option>
                              <option value="inch">inch</option>
                            </select>
                          </label>
                          <label className="intake-field">
                            <span>Tolerance</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeTolerance}
                              onChange={(e) => setIntakeTolerance(e.target.value)}
                              placeholder="+/-5mm"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="intake-form-section">
                        <div className="intake-form-section-title">
                          <span>02</span>
                          <strong>Material, finish and compliance</strong>
                        </div>
                        <div className="intake-form-grid">
                          <label className="intake-field">
                            <span>Main material</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeMaterial}
                              onChange={(e) => setIntakeMaterial(e.target.value)}
                              placeholder="Oak veneer, stainless steel, linen upholstery..."
                              required
                            />
                          </label>
                          <label className="intake-field">
                            <span>Fabric / leather code</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeFabricCode}
                              onChange={(e) => setIntakeFabricCode(e.target.value)}
                              placeholder="L-4410, V-9082, customer supplied..."
                            />
                          </label>
                          <label className="intake-field">
                            <span>Finish</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeFinish}
                              onChange={(e) => setIntakeFinish(e.target.value)}
                              placeholder="Matt lacquer, brushed brass, natural oil..."
                            />
                          </label>
                          <label className="intake-field">
                            <span>Colour</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeColor}
                              onChange={(e) => setIntakeColor(e.target.value)}
                              placeholder="Navy, walnut, champagne gold..."
                            />
                          </label>
                          <label className="intake-field">
                            <span>Hardware / base</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeHardware}
                              onChange={(e) => setIntakeHardware(e.target.value)}
                              placeholder="Black metal legs, brass handles, soft-close runners..."
                            />
                          </label>
                          <label className="intake-field">
                            <span>Fire / safety standard</span>
                            <select
                              className="chat-input"
                              value={intakeFireStandard}
                              onChange={(e) => setIntakeFireStandard(e.target.value)}
                            >
                              <optgroup label="United Kingdom">
                                <option value="UK Furniture and Furnishings (Fire) (Safety) Regulations 1988">
                                  UK Furniture and Furnishings (Fire) (Safety) Regulations 1988
                                </option>
                                <option value="UK BS 5852 - Source 0/1 (cigarette and match)">
                                  UK BS 5852 - Source 0/1 (cigarette and match)
                                </option>
                                <option value="UK BS 5852 - Source 5 (Crib 5)">UK BS 5852 - Source 5 (Crib 5)</option>
                                <option value="UK BS EN 1021-1 (smouldering cigarette)">
                                  UK BS EN 1021-1 (smouldering cigarette)
                                </option>
                                <option value="UK BS EN 1021-2 (match flame)">UK BS EN 1021-2 (match flame)</option>
                              </optgroup>
                              <optgroup label="United States">
                                <option value="US 16 CFR Part 1640 / TB 117-2013">
                                  US 16 CFR Part 1640 / TB 117-2013
                                </option>
                                <option value="US CAL TB 117-2013 (smoulder resistance)">
                                  US CAL TB 117-2013 (smoulder resistance)
                                </option>
                                <option value="US CAL TB 133 (public-occupancy seating)">
                                  US CAL TB 133 (public-occupancy seating)
                                </option>
                                <option value="US NFPA 260 (cigarette ignition resistance)">
                                  US NFPA 260 (cigarette ignition resistance)
                                </option>
                              </optgroup>
                              <optgroup label="European Union">
                                <option value="EU EN 1021-1 (smouldering cigarette)">
                                  EU EN 1021-1 (smouldering cigarette)
                                </option>
                                <option value="EU EN 1021-2 (match flame)">EU EN 1021-2 (match flame)</option>
                                <option value="EU EN 597-1 (mattress / upholstered bed base - cigarette)">
                                  EU EN 597-1 (mattress / upholstered bed base - cigarette)
                                </option>
                                <option value="EU EN 597-2 (mattress / upholstered bed base - match flame)">
                                  EU EN 597-2 (mattress / upholstered bed base - match flame)
                                </option>
                              </optgroup>
                              <optgroup label="Australia / New Zealand">
                                <option value="AU/NZ AS/NZS 4088.1 (domestic upholstery - smouldering)">
                                  AU/NZ AS/NZS 4088.1 (domestic upholstery - smouldering)
                                </option>
                              </optgroup>
                              <option value="Not required">Not required</option>
                              <option value="To confirm">To confirm</option>
                            </select>
                          </label>
                        </div>
                      </div>

                      <div className="intake-form-section">
                        <div className="intake-form-section-title">
                          <span>03</span>
                          <strong>Delivery and commercial details</strong>
                        </div>
                        <div className="intake-form-grid">
                          <label className="intake-field">
                            <span>Desired delivery date</span>
                            <input
                              type="date"
                              className="chat-input"
                              value={intakeDesiredDeliveryDate}
                              onChange={(e) => setIntakeDesiredDeliveryDate(e.target.value)}
                              required
                            />
                          </label>
                          <label className="intake-field">
                            <span>Delivery window</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeDeliveryWindow}
                              onChange={(e) => setIntakeDeliveryWindow(e.target.value)}
                              placeholder="Before grand opening, phased delivery, urgent..."
                            />
                          </label>
                          <label className="intake-field">
                            <span>Target budget / unit price</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeTargetBudget}
                              onChange={(e) => setIntakeTargetBudget(e.target.value)}
                              placeholder="e.g. 280 per chair, total budget 12000"
                            />
                          </label>
                          <label className="intake-field">
                            <span>Currency</span>
                            <select
                              className="chat-input"
                              value={intakeCurrency}
                              onChange={(e) => setIntakeCurrency(e.target.value)}
                            >
                              <option value="USD">USD</option>
                              <option value="GBP">GBP</option>
                              <option value="EUR">EUR</option>
                              <option value="HKD">HKD</option>
                              <option value="CNY">CNY</option>
                            </select>
                          </label>
                          <label className="intake-field full">
                            <span>Full delivery address / site notes</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeDeliveryAddress}
                              onChange={(e) => setIntakeDeliveryAddress(e.target.value)}
                              placeholder="Hotel name, loading bay, floor, lift size, contact person..."
                            />
                          </label>
                          <label className="intake-field">
                            <span>Packaging requirement</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakePackaging}
                              onChange={(e) => setIntakePackaging(e.target.value)}
                              placeholder="Export carton, pallet, individual wrapping..."
                            />
                          </label>
                          <label className="intake-field">
                            <span>Site access / installation</span>
                            <input
                              type="text"
                              className="chat-input"
                              value={intakeSiteAccess}
                              onChange={(e) => setIntakeSiteAccess(e.target.value)}
                              placeholder="Lift access, stair carry, assembly on site..."
                            />
                          </label>
                          <label className="intake-field full">
                            <span>Additional order notes</span>
                            <textarea
                              className="chat-input"
                              value={intakeAdditionalNotes}
                              onChange={(e) => setIntakeAdditionalNotes(e.target.value)}
                              rows={4}
                              placeholder="Special requirements, sample approval, matching existing furniture, warranty, sustainability certificates..."
                            />
                          </label>
                        </div>
                      </div>

                      <div style={{ display: "none" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-secondary)" }}>
                          {lang === "Cn" ? "交付目的地" : "DELIVERY DESTINATION"}
                        </label>
                        <input
                          type="text"
                          className="chat-input"
                          value={intakeDestination}
                          onChange={(e) => setIntakeDestination(e.target.value)}
                          placeholder={lang === "Cn" ? "例如：英國倫敦" : "e.g. London, UK"}
                          style={{
                            width: "100%",
                            background: "#FFFFFF",
                            padding: "0.6rem",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-primary)",
                            borderRadius: "2px"
                          }}
                        />
                      </div>

                      <div style={{ display: "none" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-secondary)" }}>
                          {lang === "Cn" ? "預估定製數量 (及款式)" : "ESTIMATED BESPOKE QUANTITIES"}
                        </label>
                        <input
                          type="text"
                          className="chat-input"
                          value={intakeQuantity}
                          onChange={(e) => setIntakeQuantity(e.target.value)}
                          placeholder={
                            lang === "Cn"
                              ? "例如：40 把大堂單人椅, 20 把休閒沙發"
                              : "e.g. 40 Lobby Armchairs, 20 VIP Club Chairs"
                          }
                          style={{
                            width: "100%",
                            background: "#FFFFFF",
                            padding: "0.6rem",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-primary)",
                            borderRadius: "2px"
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-secondary)" }}>
                          {lang === "Cn" ? "設計草圖 / 藍圖上傳" : "DESIGN SKETCH / BLUEPRINT UPLOAD"}
                        </label>
                        <div
                          style={{
                            border: "2px dashed rgba(124, 114, 103, 0.3)",
                            borderRadius: "4px",
                            padding: "2.5rem 1.5rem",
                            textAlign: "center",
                            background: "rgba(124, 114, 103, 0.02)",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            position: "relative"
                          }}
                        >
                          <input
                            ref={intakeFileInputRef}
                            id="intake-file-upload"
                            type="file"
                            aria-label="Upload reference images, PDFs, spreadsheets, CSV, or TXT files"
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              opacity: 0,
                              cursor: "pointer",
                              zIndex: 2
                            }}
                            accept=".pdf,.png,.jpg,.jpeg,.jfif,.webp,.heic,.heif,.avif,.xlsx,.xls,.csv,.txt,.doc,.docx"
                            onClick={(event) => {
                              event.currentTarget.value = "";
                            }}
                            onChange={handleIntakeFileSelect}
                          />
                          <svg
                            style={{
                              width: "40px",
                              height: "40px",
                              display: "block",
                              margin: "0 auto 0.5rem auto",
                              color: "var(--accent-primary)"
                            }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 22L2 2v20h20z" />
                            <path d="M18 18L6 6v12h12z" />
                          </svg>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block" }}>
                            {lang === "Cn"
                              ? "Upload reference images, PDFs, spreadsheets, CSV, or TXT files"
                              : "Upload reference images, PDFs, spreadsheets, CSV, or TXT files"}
                          </span>
                          {intakeSelectedFileName && (
                            <span
                              style={{
                                display: "block",
                                marginTop: "0.5rem",
                                fontSize: "0.78rem",
                                color: "var(--accent-primary)",
                                wordBreak: "break-word"
                              }}
                            >
                              {lang === "Cn" ? "已選文件：" : "Selected file: "}
                              {intakeSelectedFileName}
                            </span>
                          )}
                          {intakeUploadStatus && (
                            <span
                              style={{
                                display: "block",
                                marginTop: "0.35rem",
                                fontSize: "0.75rem",
                                color: "var(--accent-green)",
                                wordBreak: "break-word"
                              }}
                            >
                              {intakeUploadStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      {latestIntakeJob && (
                        <div
                          style={{
                            padding: "0.65rem 0.75rem",
                            border: "1px solid rgba(122, 135, 117, 0.35)",
                            background: "rgba(122, 135, 117, 0.08)",
                            color: "var(--text-secondary)",
                            fontSize: "0.78rem",
                            borderRadius: "3px"
                          }}
                        >
                          {lang === "Cn" ? "后台任务已创建：" : "Background job created: "}
                          <span style={{ color: "var(--accent-primary)", fontFamily: "var(--font-tech)" }}>
                            {latestIntakeJob.id}
                          </span>
                        </div>
                      )}

                      {liveIntakeWarning && (
                        <div
                          style={{
                            padding: "0.65rem 0.75rem",
                            border: "1px solid rgba(169, 124, 115, 0.35)",
                            background: "rgba(169, 124, 115, 0.08)",
                            color: "var(--accent-red)",
                            fontSize: "0.78rem",
                            borderRadius: "3px"
                          }}
                        >
                          {lang === "Cn" ? "实时后台暂未接通，已使用本地演示解析：" : "Live backend fallback: "}
                          {liveIntakeWarning}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="btn-premium"
                        style={{
                          width: "100%",
                          padding: "0.8rem",
                          marginTop: "0.5rem",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                        disabled={isIntakeUploading || intakeFileUploading}
                      >
                        {intakeFileUploading ? (
                          <>
                            <svg
                              style={{ width: "16px", height: "16px" }}
                              className="animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                            </svg>
                            <span>{lang === "Cn" ? "正在保存文件到 Supabase..." : "Saving file to Supabase..."}</span>
                          </>
                        ) : isIntakeUploading ? (
                          <>
                            <svg
                              style={{ width: "16px", height: "16px" }}
                              className="animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                            </svg>
                            <span>
                              {lang === "Cn" ? "正在整理项目规格..." : "Processing project specifications..."}
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              style={{ width: "16px", height: "16px" }}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M20 4a2 2 0 00-2.83 0L10 11.17l-1.41-1.41a1 1 0 00-1.42 0L3.5 13.5a1 1 0 000 1.42l4.24 4.24a1 1 0 001.42 0L12.92 15l1.41 1.41a1 1 0 001.42-1.42l7.17-7.17A2 2 0 0020 4z" />
                            </svg>
                            <span>
                              {lang === "Cn" ? "提交项目详情并整理图纸规格" : "Submit Brief & Process Specifications"}
                            </span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right: Premium Preview or Live Log terminal console */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {renderAiConciergePanel()}
                    <div
                      className="glass-card"
                      style={{
                        padding: "2rem",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        background: "rgba(124, 114, 103, 0.01)"
                      }}
                    >
                      {!isIntakeUploading ? (
                        <>
                          <div style={{ width: "120px", margin: "0 auto 1.5rem auto" }}>
                            {renderChairSVG("FAB-02", "matte-black", { opacity: 0.5 })}
                          </div>
                          <h4
                            style={{
                              fontFamily: "var(--font-tech)",
                              fontSize: "1rem",
                              color: "var(--text-primary)",
                              marginBottom: "0.5rem"
                            }}
                          >
                            {lang === "Cn" ? "實時 CAD & 消防合規預審" : "Real-time CAD & Flammability Pre-Audit"}
                          </h4>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-muted)",
                              maxWidth: "350px",
                              lineHeight: "1.6"
                            }}
                          >
                            {lang === "Cn"
                              ? "提交草图后，系统将比对英国 Crib 5 阻燃要求、核对几何公差并整理三视图。完成后可在进度看板查看项目图纸。"
                              : "Once submitted, the workflow checks Crib 5 requirements and geometric tolerances, then prepares orthogonal CAD drawings for the project tracker."}
                          </p>
                        </>
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            textAlign: "left",
                            background: "#1C1B18",
                            color: "#E8E5E0",
                            fontFamily: "var(--font-tech)",
                            padding: "1.5rem",
                            borderRadius: "4px",
                            border: "1px solid var(--glass-border)",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                            display: "flex",
                            flexDirection: "column",
                            minHeight: "320px"
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderBottom: "1px solid rgba(255,255,255,0.1)",
                              paddingBottom: "0.8rem",
                              marginBottom: "1rem"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span
                                className="stage-badge-dot dot-ai animate-pulse"
                                style={{ background: "var(--accent-cyan)" }}
                              ></span>
                              <strong style={{ fontSize: "0.85rem", letterSpacing: "1px" }}>
                                CRAFTON SPECIFICATION SERVICE
                              </strong>
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "#BAC2B9" }}>RUNNING</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.6rem",
                              flex: 1,
                              overflowY: "auto"
                            }}
                          >
                            {parsingLogs.map((log, lidx) => (
                              <div key={lidx} style={{ fontSize: "0.8rem", lineHeight: "1.5", color: "#FAF9F6" }}>
                                <span style={{ color: "var(--accent-green)" }}>[Crafton]</span>{" "}
                                {lang === "Cn" ? log.cn : log.en}
                              </div>
                            ))}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                color: "#BAC2B9",
                                fontSize: "0.8rem",
                                marginTop: "0.5rem"
                              }}
                            >
                              <span className="animate-pulse">⏳</span>
                              <span>
                                {lang === "Cn"
                                  ? "项目规格正在处理中..."
                                  : "Project specifications are being processed..."}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {clientPortalTab === "Tracker" && (
                <div className="dashboard-panels animate-fade-in">
                  {/* Left Column: Member Order Dashboard */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {renderClientOrderDashboard()}
                    {clientPortalTab === "LegacyTracker" && (
                      <>
                        {renderClientPrequoteWorkspace()}
                        <div className="glass-card">
                          <div className="panel-header">
                            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <svg
                                style={{ width: "16px", height: "16px", flexShrink: 0, color: "var(--accent-primary)" }}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
                              </svg>
                              <span>{lang === "Cn" ? "在单定制规格与进度" : "Bespoke Items & Specs"}</span>
                            </div>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--accent-green)",
                                fontFamily: "var(--font-tech)"
                              }}
                            >
                              {order.quoteStatus === "pending_quote"
                                ? lang === "Cn"
                                  ? "报价待定"
                                  : "Quote pending"
                                : `Total: $${getOrderTotal().toLocaleString()}`}
                            </span>
                          </div>
                          <div className="panel-body">
                            <table className="order-table">
                              <thead>
                                <tr>
                                  <th>{lang === "Cn" ? "项目类型" : "Item"}</th>
                                  <th>{lang === "Cn" ? "数量" : "Qty"}</th>
                                  <th>{lang === "Cn" ? "预选材质" : "Material Specs"}</th>
                                  <th>{lang === "Cn" ? "单价" : "Price"}</th>
                                  <th>{lang === "Cn" ? "小计" : "Subtotal"}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item) => (
                                  <tr
                                    key={item.id}
                                    className={
                                      splitDeliveryActive && (item.qty === 38 || item.qty === 4) ? "strike-row" : ""
                                    }
                                  >
                                    <td style={{ fontWeight: "500" }}>{lang === "Cn" ? item.typeCn : item.typeEn}</td>
                                    <td>
                                      {splitDeliveryActive && item.id === "ITEM-01" ? (
                                        <span>
                                          <span style={{ textDecoration: "line-through", color: "var(--accent-red)" }}>
                                            40
                                          </span>{" "}
                                          <strong style={{ color: "var(--accent-green)" }}>38</strong>
                                        </span>
                                      ) : splitDeliveryActive && item.id === "ITEM-03" ? (
                                        <span>
                                          <span style={{ textDecoration: "line-through", color: "var(--accent-red)" }}>
                                            5
                                          </span>{" "}
                                          <strong style={{ color: "var(--accent-green)" }}>4</strong>
                                        </span>
                                      ) : (
                                        item.qtyDisplay || item.qty
                                      )}
                                    </td>
                                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                      {lang === "Cn" ? item.materialCn : item.materialEn}
                                      {item.note && (
                                        <div
                                          style={{
                                            color: "var(--accent-orange)",
                                            fontSize: "0.75rem",
                                            marginTop: "3px"
                                          }}
                                        >
                                          {item.note}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      {item.quotePending || order.quoteStatus === "pending_quote"
                                        ? lang === "Cn"
                                          ? "待报价"
                                          : "Pending quote"
                                        : `$${item.unitPrice}`}
                                    </td>
                                    <td style={{ fontWeight: "bold" }}>
                                      {item.quotePending || order.quoteStatus === "pending_quote"
                                        ? lang === "Cn"
                                          ? "待报价"
                                          : "Pending quote"
                                        : `$${(item.unitPrice * item.qty).toLocaleString()}`}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {order.quoteStatus === "pending_quote" && (
                              <div
                                style={{
                                  marginTop: "0.9rem",
                                  padding: "0.75rem 0.85rem",
                                  background: "rgba(122, 135, 117, 0.08)",
                                  border: "1px solid rgba(122, 135, 117, 0.28)",
                                  borderRadius: "4px",
                                  color: "var(--text-secondary)",
                                  fontSize: "0.82rem",
                                  lineHeight: "1.55"
                                }}
                              >
                                {lang === "Cn"
                                  ? "报价状态：待供应商报价。Crafton 团队已接收您的产品资料与附件；供应商价格、交期和可行性确认后，我们会主动通知您。"
                                  : "Quote status: supplier quotation pending. The Crafton team has received your product details and attachment; we will notify you once pricing, timing, and feasibility are confirmed."}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Step bar inside member portal */}
                        <div className="glass-card" style={{ padding: "1.2rem" }}>
                          <h4
                            style={{
                              fontFamily: "var(--font-tech)",
                              fontSize: "0.85rem",
                              marginBottom: "1rem",
                              color: "var(--accent-cyan)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <svg
                              style={{ width: "16px", height: "16px", flexShrink: 0 }}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>
                              {lang === "Cn" ? "製造與合規進度追蹤" : "Production & Compliance Progress Tracker"}
                            </span>
                          </h4>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(17, 1fr)",
                              gap: "4px",
                              height: "10px",
                              background: "var(--bg-tertiary)",
                              borderRadius: "5px",
                              overflow: "hidden"
                            }}
                          >
                            {stages.map((st, sidx) => {
                              let bg = "var(--bg-tertiary)";
                              if (sidx < currentStageIndex) bg = "var(--accent-green)";
                              if (sidx === currentStageIndex) bg = "var(--accent-cyan)";
                              return (
                                <div
                                  key={st.id}
                                  title={`${st.id} - ${lang === "Cn" ? st.nameCn : st.nameEn}`}
                                  style={{ background: bg, transition: "background 0.3s" }}
                                ></div>
                              );
                            })}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              marginTop: "0.5rem"
                            }}
                          >
                            <span>{lang === "Cn" ? "項目登錄" : "Intake Specs"}</span>
                            <span>{lang === "Cn" ? "Crib 5 消防驗證" : "Crib 5 Gate"}</span>
                            <span>{lang === "Cn" ? "视觉质检" : "Visual Inspection"}</span>
                            <span>{lang === "Cn" ? "交付完成" : "Delivery Complete"}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: OpenClaw Web chat for member to talk directly to AI Agent */}
                  <div className="glass-card">
                    <div className="panel-header" style={{ background: "rgba(124, 114, 103, 0.04)" }}>
                      <div className="panel-title">
                        <span className="stage-badge-dot dot-ai" style={{ background: "var(--accent-primary)" }}></span>
                        {lang === "Cn" ? "与 Crafton 选品顾问对话" : "Crafton Design & Swatch Concierge"}
                      </div>
                      <span className="logo-badge">Live Chat</span>
                    </div>
                    <div className="panel-body chat-window">
                      <div className="chat-messages">
                        {chatMessages.map((msg, midx) => (
                          <div
                            key={midx}
                            className={`chat-bubble ${msg.sender === "client" ? "bubble-client" : "bubble-agent"}`}
                          >
                            {msg.text}
                          </div>
                        ))}
                      </div>

                      {/* Simulated SWATCH selectors for easier demoing */}
                      <div
                        style={{
                          padding: "0.8rem",
                          background: "var(--bg-secondary)",
                          borderTop: "1px solid var(--glass-border)",
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap"
                        }}
                      >
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", width: "100%" }}>
                          {lang === "Cn"
                            ? "快捷选品面料测试（点击发送模拟检测）："
                            : "Fabric swatches shortcut (click to simulate):"}
                        </span>
                        <button
                          className="btn-secondary"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}
                          onClick={() => {
                            setInputText("I want to check FAB-01 Royal Velvet (皇家蓝丝绒) compatibility");
                            setTimeout(handleSendMessage, 100);
                          }}
                        >
                          Royal Velvet (Crib 5 Ok)
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderColor: "var(--accent-red)" }}
                          onClick={() => {
                            setInputText("I select FAB-03 Pure Silk Satin (纯丝绸缎)");
                            setTimeout(handleSendMessage, 100);
                          }}
                        >
                          Pure Silk Satin (NON-COMPLIANT)
                        </button>
                      </div>

                      <div className="chat-input-area">
                        <input
                          type="text"
                          className="chat-input"
                          placeholder={
                            lang === "Cn" ? "询问或变更面料..." : "Ask about swatches or change material codes..."
                          }
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleTrackerAiMessage()}
                        />
                        <button className="btn-premium" onClick={handleTrackerAiMessage}>
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* VIEW 3: Internal Backoffice (Cho / Client View) */}
      {currentView === "Backoffice" && !isStaffUser && (
        <div
          className="crafton-backoffice-gate glass-card"
          style={{ maxWidth: "760px", margin: "4rem auto", padding: "3rem", textAlign: "center" }}
        >
          <span className="logo-badge">{lang === "Cn" ? "STAFF ONLY" : "STAFF ONLY"}</span>
          <h2 style={{ fontFamily: "var(--font-tech)", margin: "1rem 0", color: "var(--text-primary)" }}>
            {lang === "Cn" ? "请使用 Crafton 管理员账号登录" : "Sign in with a Crafton staff account"}
          </h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1.8rem" }}>
            {lang === "Cn"
              ? "Backoffice 会显示客户文件、订单草稿、BOM 和 Cho 审核动作，需要 @crafton.com 员工账号权限。"
              : "Backoffice shows client files, order drafts, BOM rows, and Cho review actions. It requires a @crafton.com staff account."}
          </p>
          <button
            className="btn-premium"
            onClick={() => {
              setAuthMode("login");
              setShowAuthGate(true);
            }}
          >
            {lang === "Cn" ? "登录管理员账号" : "Staff Sign In"}
          </button>
        </div>
      )}
      {currentView === "Backoffice" && isStaffUser && (
        <div className="crafton-backoffice dashboard-grid animate-fade-in">
          {/* Sidebar Left: Order progress controller */}
          <div className="sidebar">
            <h3 className="sidebar-title">{lang === "Cn" ? "订单进度菜单" : "Order Progress Menu"}</h3>
            <div className="admin-progress-menu">
              {adminProgressFlows.map((flow, flowIndex) => {
                const isActive = activeAdminFlow === flow.id;
                const firstStage = stages[flow.stageIndexes[0]];
                const lastStage = stages[flow.stageIndexes[flow.stageIndexes.length - 1]];
                return (
                  <button
                    key={flow.id}
                    type="button"
                    className={`admin-progress-button ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveAdminFlow(flow.id);
                      handleStageChange(flow.stageIndexes[0]);
                    }}
                  >
                    <span className="admin-progress-index">0{flowIndex + 1}</span>
                    <span className="admin-progress-copy">
                      <strong>{lang === "Cn" ? flow.titleCn : flow.titleEn}</strong>
                      <small>
                        {firstStage.id}-{lastStage.id}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Admin Area */}
          <div className="main-content">{renderAdminProgressBoard()}</div>
        </div>
      )}

      {/* High-End Glassmorphism Volumetric 3D Packing Simulation Modal */}
      {showVolumetricSimulation && (
        <div className="volumetric-modal-overlay">
          <div className="volumetric-modal-card">
            {/* Modal Header */}
            <div className="volumetric-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg
                  style={{ width: "22px", height: "22px", color: "var(--accent-primary)", flexShrink: 0 }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
                </svg>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.1rem",
                      fontFamily: "var(--font-tech)",
                      color: "var(--text-primary)",
                      fontWeight: "600",
                      letterSpacing: "0.5px"
                    }}
                  >
                    {lang === "Cn"
                      ? "3D 集裝箱排櫃優化仿真模型 (Live Volumetric Packing Simulation)"
                      : "3D Volumetric Container Packing Simulation Console"}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                    {lang === "Cn"
                      ? "正在運行於 Bluehost VPS 服务器：129.121.98.185 | 實時三維渲染與堆疊算法"
                      : "Live executing on Bluehost VPS: 129.121.98.185 | Realtime WebGL Render & Heuristics"}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  justifyContent: "center"
                }}
              >
                {/* Open in New Tab Button */}
                <button
                  onClick={() =>
                    window.open(
                      `/loading-ai/index.html?lang=${lang === "Cn" ? "cn" : "en"}&projectId=${encodeURIComponent(loadingAiContext?.projectId || "")}`,
                      "_blank"
                    )
                  }
                  style={{
                    background: "none",
                    border: "1px solid var(--text-primary)",
                    color: "var(--text-primary)",
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-tech)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    borderRadius: "2px",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "var(--text-primary)";
                    e.target.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "var(--text-primary)";
                  }}
                >
                  <span style={{ fontSize: "0.85rem" }}>↗</span>{" "}
                  {lang === "Cn" ? "在新分頁中全屏運行" : "Open Fullscreen in New Tab"}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setShowVolumetricSimulation(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "1.4rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    transition: "background-color 0.2s",
                    lineHeight: "1"
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(28,27,24,0.08)")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body / Iframe Container (Perfect 100% Height Fill) */}
            <div className="volumetric-modal-body">
              <iframe
                ref={loadingAiFrameRef}
                src={`/loading-ai/index.html?lang=${lang === "Cn" ? "cn" : "en"}&projectId=${encodeURIComponent(loadingAiContext?.projectId || "")}`}
                onLoad={sendLoadingAiContext}
                style={{
                  width: "100%",
                  height: "100%",
                  flex: 1,
                  border: "1px solid var(--glass-border)",
                  background: "#FFFFFF",
                  borderRadius: "2px",
                  boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)",
                  display: "block"
                }}
                title="3D Container Loading Simulation"
              />
            </div>

            {/* Modal Footer */}
            <div className="volumetric-modal-footer">
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                {loadingAiResult
                  ? `${loadingAiResult.totalContainers || 0} containers · ${loadingAiResult.utilizationPercent || 0}% utilization · ${loadingAiResult.unpackedCount || 0} unpacked`
                  : lang === "Cn"
                    ? "装柜结果计算完成后，可保存到当前项目的 Supabase 记录。"
                    : "Save the computed loading result to the current project when it is ready."}
                {loadingAiSaveStatus ? ` · ${loadingAiSaveStatus}` : ""}
              </span>
              <button
                className="btn-premium"
                style={{ padding: "0.5rem 1.5rem" }}
                disabled={!loadingAiResult || loadingAiSaveStatus === "Saving packing plan..."}
                onClick={saveLoadingAiPlan}
              >
                {lang === "Cn" ? "保存装柜方案" : "Save packing plan"}
              </button>
              <button
                className="btn-premium"
                style={{ padding: "0.5rem 1.5rem" }}
                onClick={() => setShowVolumetricSimulation(false)}
              >
                {lang === "Cn" ? "關閉主控台" : "Close Simulation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared project intake / quote modal */}
      {renderIntakeModal()}

      {/* Interactive Case Studies Detail Modal Overlay */}
      {selectedProject && renderProjectDetailModal()}

      {/* Premium Auth Gate Overlay */}
      {showAuthGate && renderAuthGate()}
    </div>
  );
}

export default App;
