import sharp from "sharp";
const layoutError = (message) => Object.assign(new Error(message), { code: "DRAWING_LAYOUT_REVIEW" });

// Isolate connected linework, not fixed pixels: image models can move views and
// add captions despite the prompt. Captions are not used as dimension evidence.
export async function prepareDrawingViews(generatedImage, dimensions = { values: {} }) {
  const input = Buffer.from(generatedImage.dataBase64, "base64");
  const width = 1200,
    height = 675;
  const data = await sharp(input)
    .flatten({ background: "#fff" })
    .resize(width, height, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer();
  const ink = Uint8Array.from(data, (value) => (value < 190 ? 1 : 0));
  // A shared drafting floor line can join the two elevations. Remove only long
  // continuous baselines in the lower half, never furniture-sized edges.
  for (let y = Math.floor(height * 0.55); y < height; y++) {
    let run = 0,
      longest = 0;
    for (let x = 0; x < width; x++) {
      run = ink[y * width + x] ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    if (longest > width * 0.6) ink.fill(0, y * width, (y + 1) * width);
  }
  const seen = new Uint8Array(ink.length),
    queue = new Int32Array(ink.length),
    components = [];
  for (let i = 0; i < ink.length; i++) {
    if (!ink[i] || seen[i]) continue;
    let head = 0,
      tail = 1,
      left = width,
      right = 0,
      top = height,
      bottom = 0;
    queue[0] = i;
    seen[i] = 1;
    while (head < tail) {
      const at = queue[head++],
        x = at % width,
        y = Math.floor(at / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy,
            index = ny * width + nx;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height || seen[index] || !ink[index]) continue;
          seen[index] = 1;
          queue[tail++] = index;
        }
    }
    if (tail >= 100 && right - left >= 35 && bottom - top >= 28) components.push({ left, right, top, bottom });
  }
  // Disconnected upholstery outlines can belong to the same view; their bounds
  // overlap. Small glyphs remain excluded rather than being included in the crop.
  for (let changed = true; changed; ) {
    changed = false;
    outer: for (let i = 0; i < components.length; i++)
      for (let j = i + 1; j < components.length; j++) {
        const a = components[i],
          b = components[j];
        if (a.left > b.right + 4 || b.left > a.right + 4 || a.top > b.bottom + 4 || b.top > a.bottom + 4) continue;
        components[i] = {
          left: Math.min(a.left, b.left),
          right: Math.max(a.right, b.right),
          top: Math.min(a.top, b.top),
          bottom: Math.max(a.bottom, b.bottom)
        };
        components.splice(j, 1);
        changed = true;
        break outer;
      }
  }
  if (components.length !== 3)
    throw layoutError("Drawing layout needs review: expected three separate complete views.");
  components.sort((a, b) => a.top - b.top);
  const [topView, ...lower] = components;
  lower.sort((a, b) => a.left - b.left);
  if (
    topView.bottom >= Math.min(...lower.map((b) => b.top)) ||
    lower[0].right >= lower[1].left ||
    Math.abs(lower[0].bottom - lower[1].bottom) > height * 0.15
  )
    throw layoutError("Drawing layout needs review: views overlap or are not orthographic triptych layout.");
  const meta = await sharp(input).metadata(),
    sx = meta.width / width,
    sy = meta.height / height;
  const views = {};
  for (const [name, region] of [
    ["top", topView],
    ["front", lower[0]],
    ["side", lower[1]]
  ]) {
    const { left, right, top, bottom } = region;
    if (left <= 2 || right >= width - 3 || top <= 2 || bottom >= height - 3)
      throw layoutError(`Drawing layout needs review: ${name} view is clipped.`);
    const box = {
      left: Math.floor(left * sx),
      top: Math.floor(top * sy),
      width: Math.ceil((right - left + 1) * sx),
      height: Math.ceil((bottom - top + 1) * sy)
    };
    box.width = Math.min(box.width, meta.width - box.left);
    box.height = Math.min(box.height, meta.height - box.top);
    let flip = false;
    if (name === "side" && dimensions.values.seatHeight && dimensions.values.height > dimensions.values.seatHeight) {
      // Locate the raised backrest in the upper band, then orient it to the left.
      let sum = 0,
        count = 0;
      const bandBottom = Math.min(bottom, top + Math.max(4, Math.floor((bottom - top) * 0.12)));
      for (let y = top; y <= bandBottom; y++)
        for (let x = left; x <= right; x++)
          if (ink[y * width + x]) {
            sum += x;
            count++;
          }
      const relative = count ? (sum / count - left) / (right - left) : 0.5;
      if (relative > 0.56) flip = true;
      else if (relative > 0.44)
        throw layoutError("Drawing layout needs review: seating side orientation is ambiguous.");
    }
    let pipeline = sharp(input).extract(box);
    if (flip) pipeline = pipeline.flop();
    const buffer = await pipeline.png().toBuffer();
    views[name] = {
      mimeType: "image/png",
      dataBase64: buffer.toString("base64"),
      width: box.width,
      height: box.height,
      sourceBox: box,
      mirrored: flip
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
