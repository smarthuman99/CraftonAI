// Dimension labels are typeset from source data, never read back from generated pixels.
const keys = ["width", "depth", "height", "seatDepth", "seatHeight", "armHeight", "diameter"];
const aliases = {
  width: ["width", "w", "length", "l"],
  depth: ["depth", "d"],
  height: ["height", "h"],
  seatDepth: ["seatDepth", "seat_depth", "sd"],
  seatHeight: ["seatHeight", "seat_height", "sh"],
  armHeight: ["armHeight", "arm_height", "ah"],
  diameter: ["diameter", "dia"]
};
const units = { mm: 1, cm: 10, m: 1000, in: 25.4, inch: 25.4, inches: 25.4, '"': 25.4, 毫米: 1, 厘米: 10 };
const unitPattern = '(?:mm|cm|inches|inch|in|m|毫米|厘米|\")';
const numberPattern = "\\d+(?:\\.\\d+)?";
const labels = {
  w: "width",
  width: "width",
  l: "length",
  length: "length",
  d: "depth",
  depth: "depth",
  h: "height",
  height: "height",
  sd: "seatDepth",
  sh: "seatHeight",
  ah: "armHeight",
  dia: "diameter",
  diameter: "diameter",
  ø: "diameter",
  φ: "diameter"
};
const round = (n) => Math.round(n * 100) / 100;

export function drawingDimensions(item = {}) {
  const values = {},
    issues = [];
  let text =
    typeof item.dimensions_text === "string"
      ? item.dimensions_text.trim()
      : typeof item.dimensions === "string"
        ? item.dimensions.trim()
        : "";
  const sourceText = text;
  const add = (key, value, unit = "mm") => {
    const n = round(Number(value) * units[unit.toLowerCase()]);
    if (!(n > 0 && n <= 100000)) {
      issues.push(`invalid_${key}`);
      return;
    }
    if (values[key] !== undefined && values[key] !== n) issues.push(`conflicting_${key}`);
    else values[key] = n;
  };
  if (text) {
    text = text
      .replace(/seat[\s_-]*depth/gi, "SD")
      .replace(/seat[\s_-]*height/gi, "SH")
      .replace(/arm[\s_-]*height/gi, "AH")
      .replace(/座深|坐深/g, "SD ")
      .replace(/座高|坐高/g, "SH ")
      .replace(/扶手高/g, "AH ")
      .replace(/总宽|總寬|宽|寬/g, "W ")
      .replace(/总深|總深|深/g, "D ")
      .replace(/总高|總高|高/g, "H ")
      .replace(/直径|直徑/g, "DIA ")
      .replace(/×|✕/g, " x ");
    // Ranges, estimates and unsupported units must not become precise annotations.
    if (/\d\s*[-–—~～/]\s*\d|\b(?:approx|about|estimated|ft|feet)\b|[约約≈±']|\d,\d/i.test(text)) {
      issues.push("ambiguous_dimensions");
    } else {
      const allUnits = [...text.matchAll(new RegExp(`(${unitPattern})(?=\\s|$|[;,x×])`, "gi"))].map((m) =>
        m[1].toLowerCase()
      );
      const sharedUnit = new Set(allUnits).size === 1 ? allUnits[0] : "mm";
      const pattern = new RegExp(
        `(?:^|[^a-z])(${Object.keys(labels).join("|")})\\s*[:=]?\\s*(${numberPattern})\\s*(${unitPattern})?(?=$|[^a-z0-9.])`,
        "gi"
      );
      for (const m of text.matchAll(pattern)) add(labels[m[1].toLowerCase()], m[2], m[3] || sharedUnit);
      // Native schedules use W x D x H. Do not interpret unlabeled pairs or extra numbers.
      if (!values.width && !values.depth && !values.height && !values.length && !values.diameter) {
        const triplet = text.match(
          new RegExp(
            `^\\s*(${numberPattern})\\s*x\\s*(${numberPattern})\\s*x\\s*(${numberPattern})\\s*(${unitPattern})?\\s*(?=$|[;,])`,
            "i"
          )
        );
        if (triplet) ["width", "depth", "height"].forEach((key, i) => add(key, triplet[i + 1], triplet[4] || "mm"));
      }
      // L x W x H explicitly names two horizontal axes.
      if (values.length && values.width && !values.depth) {
        values.depth = values.width;
        values.width = values.length;
      } else if (values.length && !values.width) values.width = values.length;
      delete values.length;
    }
  } else if (item.dimensions && typeof item.dimensions === "object") {
    const d = item.dimensions;
    for (const key of keys) {
      const name = aliases[key].find((a) => d[a] !== undefined && d[a] !== "");
      if (name) add(key, d[name], String(d.unit || d.units || "mm"));
    }
    if ((d.length || d.l) && (d.width || d.w) && !(d.depth || d.d)) {
      values.depth = values.width;
      delete values.width;
      add("width", d.length || d.l, String(d.unit || d.units || "mm"));
    }
  }
  if (values.diameter) {
    for (const key of ["width", "depth"]) {
      if (values[key] && values[key] !== values.diameter) issues.push(`conflicting_${key}`);
      else values[key] = values.diameter;
    }
  }
  for (const [detail, overall] of [
    ["seatDepth", "depth"],
    ["seatHeight", "height"],
    ["armHeight", "height"]
  ]) {
    if (values[detail] && values[overall] && values[detail] > values[overall]) issues.push(`invalid_${detail}`);
  }
  // A conflict holds the whole annotation set rather than mixing contradictory dimensions.
  if (issues.length) return { values: {}, sourceText, issues, unit: "mm" };
  return { values, sourceText, issues, unit: "mm" };
}

export function dimensionSummary(dimensions) {
  const v = dimensions.values;
  const overall = v.diameter
    ? `Ø ${v.diameter}${v.height ? ` x H ${v.height}` : ""} mm`
    : [
        ["W", v.width],
        ["D", v.depth],
        ["H", v.height]
      ]
        .filter(([, n]) => n)
        .map(([label, n]) => `${label} ${n}`)
        .join(" x ") + (v.width || v.depth || v.height ? " mm" : "");
  const details = [
    ["SD", v.seatDepth],
    ["SH", v.seatHeight],
    ["AH", v.armHeight]
  ]
    .filter(([, n]) => n)
    .map(([label, n]) => `${label} ${n}`)
    .join(" · ");
  return [overall || "TO CONFIRM", details && `${details} mm`].filter(Boolean);
}
