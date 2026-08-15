const DEFAULT_ITEM_COLORS = ["#a97c73", "#7a8775", "#607d8b", "#8b6f47", "#6f5b7b", "#4d7c78"];

const positiveNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  const match = String(value || "")
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/);
  const parsed = match ? Number(match[0]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const unitMultiplier = (unit) => {
  const normalized = String(unit || "mm")
    .trim()
    .toLowerCase();
  if (
    normalized === "m" ||
    (normalized.includes("米") && !normalized.includes("毫米") && !normalized.includes("厘米"))
  ) {
    return 1000;
  }
  if (normalized === "cm" || normalized.includes("厘米")) return 10;
  return 1;
};

const completeDimensions = (length, width, height, multiplier = 1) => {
  const values = [length, width, height].map(positiveNumber);
  if (values.some((value) => !value)) return null;
  return {
    l: Math.round(values[0] * multiplier),
    w: Math.round(values[1] * multiplier),
    h: Math.round(values[2] * multiplier)
  };
};

const parseDimensionObject = (dimensions) => {
  if (!dimensions || typeof dimensions !== "object" || Array.isArray(dimensions)) return null;

  const multiplier = unitMultiplier(dimensions.unit || dimensions.units || dimensions.dimension_unit);
  const explicitLength = positiveNumber(dimensions.length ?? dimensions.l);
  const explicitWidth = positiveNumber(dimensions.width ?? dimensions.w);
  const depth = positiveNumber(dimensions.depth ?? dimensions.d);
  const height = positiveNumber(dimensions.height ?? dimensions.h);

  // Furniture BOMs commonly use W x D x H. Loading AI uses L x W x H,
  // so product width becomes the box length and product depth becomes box width.
  if (!explicitLength && explicitWidth && depth) {
    return completeDimensions(explicitWidth, depth, height, multiplier);
  }

  return completeDimensions(explicitLength || explicitWidth, explicitWidth || depth, height, multiplier);
};

const findLabelledValue = (text, labels) => {
  const expression = new RegExp(`(?:${labels})\\s*(?:[:=]|is)?\\s*(\\d+(?:\\.\\d+)?)`, "iu");
  return positiveNumber(text.match(expression)?.[1]);
};

export const parseLoadingDimensions = (value) => {
  if (!value) return null;
  if (typeof value === "object") return parseDimensionObject(value);

  const text = String(value).replace(/[×✕*]/g, "x");
  const unit = text.match(/(?:\b(?:mm|cm|m)\b|毫米|厘米|米)/iu)?.[0] || "mm";
  const multiplier = unitMultiplier(unit);
  const length = findLabelledValue(text, "L(?:ength)?|长(?:度)?");
  const width = findLabelledValue(text, "W(?:idth)?|宽(?:度)?");
  const depth = findLabelledValue(text, "D(?:epth)?|深(?:度)?");
  const height = findLabelledValue(text, "H(?:eight)?|高(?:度)?");

  if (width && depth && height && !length) return completeDimensions(width, depth, height, multiplier);
  if (length && width && height) return completeDimensions(length, width, height, multiplier);
  if (length && depth && height) return completeDimensions(length, depth, height, multiplier);

  const generic = text
    .replace(/\d{4}-\d{1,2}-\d{1,2}/g, "")
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((number) => Number.isFinite(number) && number > 0);
  return generic?.length >= 3 ? completeDimensions(generic[0], generic[1], generic[2], multiplier) : null;
};

export const dimensionsForLoadingItem = (item = {}) => {
  const packedCandidates = [
    item.packed_dimensions,
    item.packedDimensions,
    item.packaging_dimensions,
    item.packagingDimensions,
    item.carton_dimensions,
    item.cartonDimensions
  ];
  const productCandidates = [
    item.dimensions,
    item.dimensions_text,
    item.dimensionsText,
    item.size,
    item.notes_en,
    item.notes_cn
  ];

  for (const candidate of [...packedCandidates, ...productCandidates]) {
    const parsed = parseLoadingDimensions(candidate);
    if (parsed) return parsed;
  }

  return parseDimensionObject(item);
};

const itemName = (item, index) =>
  item.sku ||
  item.skuEn ||
  item.item_type_en ||
  item.item_type_cn ||
  item.typeEn ||
  item.typeCn ||
  item.itemType ||
  `Item ${index + 1}`;

export const normalizeProjectItemsForLoading = (sourceItems = []) => {
  const items = [];
  const omittedItems = [];

  (Array.isArray(sourceItems) ? sourceItems : []).forEach((item, index) => {
    const name = itemName(item || {}, index);
    const dimensions = dimensionsForLoadingItem(item || {});
    const quantity = positiveNumber(item?.qty ?? item?.quantity ?? item?.packing_qty ?? item?.packingQty);

    if (!dimensions || !quantity) {
      omittedItems.push({
        id: item?.id || `project-item-${index + 1}`,
        name,
        reason: !dimensions ? "missing_dimensions" : "missing_quantity"
      });
      return;
    }

    const weight =
      positiveNumber(
        item?.packed_weight ?? item?.packedWeight ?? item?.gross_weight ?? item?.grossWeight ?? item?.weight
      ) || 25;

    items.push({
      id: item?.id || `project-item-${index + 1}`,
      sku: item?.typeCn || item?.item_type_cn || name,
      skuEn: item?.typeEn || item?.item_type_en || name,
      ...dimensions,
      qty: Math.max(1, Math.round(quantity)),
      weight,
      stackingGrade: Math.min(3, Math.max(1, Math.round(positiveNumber(item?.stackingGrade) || 2))),
      allowSide: item?.allowSide !== false,
      allowUpsideDown: item?.allowUpsideDown === true,
      color: item?.loadingColor || item?.color_hex || DEFAULT_ITEM_COLORS[index % DEFAULT_ITEM_COLORS.length]
    });
  });

  return { items, omittedItems };
};
