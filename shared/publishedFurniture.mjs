// Public catalogue fields are explicitly selected; source records must never be spread into the output.
export const FURNITURE_CATEGORIES = [
  {
    slug: "sofa",
    nameEn: "Sofas",
    nameCn: "沙发",
    summaryEn: "Sofas, modular seating and banquettes.",
    summaryCn: "沙发、模块组合与卡座。"
  },
  {
    slug: "chairs",
    nameEn: "Chairs & benches",
    nameCn: "椅凳",
    summaryEn: "Lounge chairs, dining chairs, stools and benches.",
    summaryCn: "休闲椅、餐椅、吧椅与长凳。"
  },
  {
    slug: "tables",
    nameEn: "Tables & desks",
    nameCn: "桌类",
    summaryEn: "Dining tables, coffee tables, side tables and desks.",
    summaryCn: "餐桌、茶几、边几与书桌。"
  },
  {
    slug: "beds",
    nameEn: "Beds & mattresses",
    nameCn: "床类",
    summaryEn: "Upholstered beds and mattresses.",
    summaryCn: "软包床与床垫。"
  },
  {
    slug: "storage",
    nameEn: "Cabinets & storage",
    nameCn: "柜类",
    summaryEn: "Sideboards, bedside cabinets and shelving.",
    summaryCn: "餐边柜、床头柜与储物柜。"
  },
  {
    slug: "accessories",
    nameEn: "Other furnishings",
    nameCn: "其他配套",
    summaryEn: "Screens, rugs and lighting accessories.",
    summaryCn: "屏风、地毯与灯饰配套。"
  }
];

export const cleanText = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");
const normalized = (value) =>
  cleanText(value)
    .toLowerCase()
    .replace(/[\s.,:;()–—-]+/g, "");
const pending = (value) =>
  !cleanText(value) || /^(to confirm|tbc|tbd|unknown|n\/?a|待确认|待補充|待补充)$/i.test(cleanText(value));
export function chineseSpecification(chinese, english) {
  const value = cleanText(chinese);
  if (!value) return "";
  return /to confirm|\btbc\b|\btbd\b/i.test(english || "") && !/待|确认|確認/.test(value)
    ? `${value}（待确认）`
    : value;
}

export function classifyFurniture(item) {
  const text = `${item.item_type_en || ""} ${item.item_type_cn || ""}`.toLowerCase();
  if (
    /bedside|nightstand|chest of drawers|sideboard|shelving|cabinet|tv unit|dispenser|床头柜|床頭櫃|斗柜|储物|储物柜|餐边柜|电视柜/.test(
      text
    )
  )
    return "storage";
  if (/sofa|settee|banquette|沙发|沙發|卡座/.test(text)) return "sofa";
  if (/chair|stool|bench|pouff|ottoman|bean bag|椅|凳/.test(text)) return "chairs";
  if (/table|desk|桌|茶几|边几|案几/.test(text)) return "tables";
  if (/\bbed\b|mattress|床/.test(text)) return "beds";
  return "accessories";
}

export function catalogueImageSources(item, job) {
  const paths = [
    ...(item.image_storage_path
      ? [{ storage_path: item.image_storage_path, storage_bucket: item.image_storage_bucket || "intake-files" }]
      : []),
    ...(Array.isArray(item.image_storage_paths) ? item.image_storage_paths : [])
  ];
  const allowedPrefixes = [`${job.user_id}/derived/${job.id}/`, `${job.user_id}/item-references/${job.id}/`];
  const seen = new Set();
  return paths.filter((entry) => {
    const key = entry.storage_path;
    if (
      entry.storage_bucket !== "intake-files" ||
      typeof key !== "string" ||
      !allowedPrefixes.some((prefix) => key.startsWith(prefix)) ||
      /technical-drawings|\.\./i.test(key) ||
      seen.has(key)
    )
      return false;
    seen.add(key);
    return true;
  });
}

export function publicFurniture(item, { id, images = [], override = {} }) {
  const category = override.category || classifyFurniture(item);
  if (!FURNITURE_CATEGORIES.some((entry) => entry.slug === category))
    throw new Error(`Unknown catalogue category: ${category}`);
  return {
    id,
    code: cleanText(item.sku) || id.toUpperCase(),
    category,
    name: cleanText(override.name || item.item_type_en) || "Furniture",
    nameCn: cleanText(override.nameCn || item.item_type_cn || override.name || item.item_type_en) || "家具",
    dimensions: pending(item.dimensions_text) ? "" : cleanText(item.dimensions_text),
    material: pending(item.material_en) ? "" : cleanText(item.material_en),
    materialCn: pending(item.material_cn) ? "" : chineseSpecification(item.material_cn, item.material_en),
    finish: cleanText(item.finish_en || item.finish),
    finishCn: chineseSpecification(item.finish_cn, item.finish_en || item.finish),
    color: cleanText(item.color_en),
    colorCn: chineseSpecification(item.color_cn, item.color_en),
    images: [...new Set(images)],
    image: images[0] || "",
    price: null,
    currency: "USD"
  };
}

export function deduplicateFurniture(products) {
  const seen = new Map();
  const result = [];
  const merged = [];
  for (const product of products) {
    // Unknown specifications are never enough to establish that two records are the same design.
    const comparable = product.image && product.dimensions && product.material;
    const signature = comparable
      ? [
          product.category,
          product.name,
          product.dimensions,
          product.material,
          product.finish,
          product.color,
          product.image
        ]
          .map(normalized)
          .join("|")
      : product.id;
    const match = seen.get(signature);
    if (match) {
      match.images = [...new Set([...match.images, ...product.images])];
      merged.push({ id: product.id, into: match.id });
    } else {
      seen.set(signature, product);
      result.push(product);
    }
  }
  return { products: result, merged };
}

export function groupFurniture(products) {
  return FURNITURE_CATEGORIES.map((category) => {
    const items = products
      .filter((product) => product.category === category.slug)
      .sort(
        (a, b) =>
          Number(Boolean(b.image)) - Number(Boolean(a.image)) ||
          a.name.localeCompare(b.name) ||
          a.code.localeCompare(b.code)
      );
    return { ...category, image: items.find((item) => item.image)?.image || "", products: items };
  }).filter((category) => category.products.length);
}
