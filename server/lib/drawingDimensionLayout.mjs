import sharp from "sharp";

// The generator supplies unlabelled views in three isolated slots. White gutters
// are verified before cropping: a misplaced view must not receive misleading arrows.
export async function prepareDrawingViews(generatedImage) {
  const input = Buffer.from(generatedImage.dataBase64, "base64");
  const { data, info } = await sharp(input)
    .flatten({ background: "#fff" })
    .resize(1200, 675, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const dark = (x, y) => data[y * info.width + x] < 190;
  const count = (x0, y0, x1, y1) => {
    let n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (dark(x, y)) n++;
    return n;
  };
  if (count(0, 325, 1200, 350) > 12 || count(588, 350, 612, 675) > 12) {
    throw new Error("Drawing layout needs review: generated views overlap the required white gutters.");
  }
  const regions = { top: [0, 0, 1200, 325], front: [0, 350, 588, 675], side: [612, 350, 1200, 675] };
  const views = {};
  for (const [name, [x0, y0, x1, y1]] of Object.entries(regions)) {
    let left = x1,
      right = x0,
      top = y1,
      bottom = y0,
      ink = 0;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        if (!dark(x, y)) continue;
        ink++;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    if (
      ink < 100 ||
      right - left < 35 ||
      bottom - top < 25 ||
      left <= x0 + 2 ||
      right >= x1 - 3 ||
      top <= y0 + 2 ||
      bottom >= y1 - 3
    ) {
      throw new Error(`Drawing layout needs review: ${name} view is missing or clipped.`);
    }
    // Crop the full-resolution source using the measured ink bounds.
    const meta = await sharp(input).metadata();
    const sx = meta.width / 1200,
      sy = meta.height / 675;
    const box = {
      left: Math.floor(left * sx),
      top: Math.floor(top * sy),
      width: Math.ceil((right - left + 1) * sx),
      height: Math.ceil((bottom - top + 1) * sy)
    };
    box.width = Math.min(box.width, meta.width - box.left);
    box.height = Math.min(box.height, meta.height - box.top);
    const buffer = await sharp(input).extract(box).png().toBuffer();
    views[name] = {
      mimeType: "image/png",
      dataBase64: buffer.toString("base64"),
      width: box.width,
      height: box.height
    };
  }
  return views;
}

const n = (value) => Math.round(value * 100) / 100;
const line = (x1, y1, x2, y2, extra = "") => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${extra}/>`;
function horizontal(x1, x2, objectY, y, label, key) {
  if (!(x2 > x1)) return "";
  return `<g data-dimension="${key}">${line(x1, objectY, x1, y + (y > objectY ? 10 : -10))}${line(x2, objectY, x2, y + (y > objectY ? 10 : -10))}${line(x1, y, x2, y, 'marker-start="url(#dim-arrow)" marker-end="url(#dim-arrow)"')}<text x="${n((x1 + x2) / 2)}" y="${n(y - 10)}">${label} mm</text></g>`;
}
function vertical(y1, y2, objectX, x, label, key) {
  if (!(y2 > y1)) return "";
  return `<g data-dimension="${key}">${line(objectX, y1, x + (x > objectX ? 10 : -10), y1)}${line(objectX, y2, x + (x > objectX ? 10 : -10), y2)}${line(x, y1, x, y2, 'marker-start="url(#dim-arrow)" marker-end="url(#dim-arrow)"')}<text transform="translate(${n(x - 11)} ${n((y1 + y2) / 2)}) rotate(-90)">${label} mm</text></g>`;
}

export function dimensionedViewsSvg(views, dimensions) {
  const v = dimensions.values;
  const scale =
    v.width && v.depth && v.height ? Math.min(420 / v.width, 360 / v.depth, 285 / v.height, 270 / v.depth) : null;
  const defs = `<defs><marker id="dim-arrow" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="9" markerHeight="7" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M10 4L0 0L0 8Z" fill="#211f1b"/></marker></defs>`;
  const boxes = {};
  let svg = defs;
  for (const [name, cx, baseline, a, b, maxW, maxH, label] of [
    ["top", 710, 505, v.width, v.depth, 500, 270, "PLAN / TOP"],
    ["front", 410, 912, v.width, v.height, 420, 285, "FRONT / ELEVATION"],
    ["side", 1070, 912, v.depth, v.height, 360, 285, "RIGHT SIDE / SECTION"]
  ]) {
    const view = views[name];
    if (!view) throw new Error(`Missing ${name} drawing view.`);
    const ratio = a && b ? a / b : view.width / view.height;
    const w = scale ? a * scale : Math.min(maxW, maxH * ratio);
    const h = scale ? b * scale : w / ratio;
    const x = cx - w / 2,
      y = baseline - h;
    boxes[name] = { x, y, w, h, right: x + w, bottom: baseline };
    svg += `<image href="data:${view.mimeType};base64,${view.dataBase64}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" preserveAspectRatio="none"/><text x="${cx}" y="${baseline + (name === "front" ? 75 : 40)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#211f1b">${label}</text>`;
  }
  const t = boxes.top,
    f = boxes.front,
    s = boxes.side;
  svg +=
    '<g fill="none" stroke="#211f1b" stroke-width="1.5" class="dimension-lines"><style>.dimension-lines text{fill:#211f1b;stroke:#fff;stroke-width:5px;paint-order:stroke;stroke-linejoin:round;font:22px Arial,sans-serif;text-anchor:middle}</style>';
  if (v.width)
    svg +=
      horizontal(t.x, t.right, t.y - 4, t.y - 32, v.diameter ? `Ø ${v.diameter}` : v.width, "top-width") +
      horizontal(f.x, f.right, f.bottom + 4, f.bottom + 33, v.width, "front-width");
  if (v.depth)
    svg +=
      vertical(t.y, t.bottom, t.x - 4, t.x - 40, v.depth, "top-depth") +
      horizontal(s.x, s.right, s.y - 4, s.y - 40, v.depth, "side-depth");
  if (v.height)
    svg +=
      vertical(f.y, f.bottom, f.x - 4, f.x - 42, v.height, "front-height") +
      vertical(s.y, s.bottom, s.x - 4, s.x - 42, v.height, "side-height");
  if (v.seatHeight && v.height) {
    svg += vertical(
      f.bottom - (f.h * v.seatHeight) / v.height,
      f.bottom,
      f.right + 4,
      f.right + 44,
      `SH ${v.seatHeight}`,
      "front-seat-height"
    );
    svg += vertical(
      s.bottom - (s.h * v.seatHeight) / v.height,
      s.bottom,
      s.right + 4,
      s.right + 44,
      `SH ${v.seatHeight}`,
      "side-seat-height"
    );
  }
  // Seat depth is explicitly supplied; never reuse it as seat width in the plan.
  if (v.seatDepth && v.depth && v.seatHeight && v.height) {
    const seatY = s.bottom - (s.h * v.seatHeight) / v.height;
    svg += horizontal(
      s.right - (s.w * v.seatDepth) / v.depth,
      s.right,
      seatY - 4,
      seatY - 30,
      `SD ${v.seatDepth}`,
      "side-seat-depth"
    );
  }
  if (v.armHeight && v.height)
    svg += vertical(
      f.bottom - (f.h * v.armHeight) / v.height,
      f.bottom,
      f.x - 4,
      f.x - 88,
      `AH ${v.armHeight}`,
      "front-arm-height"
    );
  return svg + "</g>";
}
