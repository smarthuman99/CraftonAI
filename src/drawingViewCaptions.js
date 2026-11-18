/* global document, URL, window */
import { createWorker, OEM, PSM } from "tesseract.js";
import workerPath from "tesseract.js/dist/worker.min.js?url";
import corePath from "tesseract.js-core/tesseract-core-lstm.wasm.js?url";
import modelPath from "@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz?url";

// Older generated artwork sometimes contains English view captions inside the
// linework itself. Only replace a line if the entire line is a known caption.
const views = [
  [/^(?:PLAN|TOP)(?: (?:TOP|PLAN))?(?: VIEW)?$/, "俯視圖"],
  [/^(?:FRONT(?: VIEW)?(?: ELEVATION)?|FRONT ELEVATION VIEW|ELEVATION FRONT)$/, "正視圖"],
  [/^RIGHT SIDE(?: ELEVATION)? SECTION(?: VIEW)?$/, "右側視／剖面圖"],
  [/^RIGHT SIDE(?: ELEVATION)?(?: VIEW)?$/, "右側視圖"],
  [/^SIDE(?: ELEVATION)?(?: SECTION)?(?: VIEW)?$/, "側視圖"],
  [/^LEFT SIDE(?: ELEVATION)?(?: SECTION)?(?: VIEW)?$/, "左側視圖"],
  [/^(?:REAR|BACK)(?: VIEW| ELEVATION)?$/, "背視圖"],
  [/^(?:CROSS )?SECTION(?: VIEW)?$/, "剖視圖"]
];

// Isolate letter-sized marks before recognition. Drawing outlines immediately
// above a caption otherwise merge with the text and hide the entire line.
function captionMask(canvas) {
  const { width, height } = canvas;
  const { data } = canvas.getContext("2d").getImageData(0, 0, width, height);
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const ctx = mask.getContext("2d");
  const pixels = ctx.createImageData(width, height);
  pixels.data.fill(255);
  const ink = new Uint8Array(width * height);
  for (let p = 0; p < ink.length; p++) ink[p] = data[p * 4] < 175 && data[p * 4 + 1] < 175 && data[p * 4 + 2] < 175;
  const queue = new Int32Array(ink.length);
  for (let p = 0; p < ink.length; p++) {
    if (!ink[p]) continue;
    let x0 = width,
      x1 = 0,
      y0 = height,
      y1 = 0,
      end = 1;
    queue[0] = p;
    ink[p] = 0;
    for (let i = 0; i < end; i++) {
      const index = queue[i],
        x = index % width,
        y = Math.floor(index / width);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny++) {
        for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx++) {
          const next = ny * width + nx;
          if (ink[next]) {
            ink[next] = 0;
            queue[end++] = next;
          }
        }
      }
    }
    if (y1 - y0 < 4 || y1 - y0 > 38 || x1 - x0 > Math.max(18, (y1 - y0) * 2.2) || end < 6) continue;
    for (let i = 0; i < end; i++) {
      const offset = queue[i] * 4;
      pixels.data.fill(0, offset, offset + 3);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return mask;
}

export async function createCaptionReader(signal) {
  signal.throwIfAborted();
  const langPath = new URL(".", new URL(modelPath, window.location.href)).href;
  const worker = await new Promise((resolve, reject) => {
    createWorker("eng", OEM.LSTM_ONLY, {
      workerPath,
      corePath,
      langPath,
      workerBlobURL: false,
      errorHandler: reject
    }).then(resolve, reject);
  });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
  } catch (error) {
    await worker.terminate();
    throw error;
  }
  return {
    close: () => worker.terminate(),
    async translate(canvas) {
      const {
        data: { blocks }
      } = await worker.recognize(captionMask(canvas), {}, { blocks: true, text: false });
      const ctx = canvas.getContext("2d");
      for (const block of blocks || [])
        for (const paragraph of block.paragraphs)
          for (const line of paragraph.lines) {
            const normalized = line.text
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, " ")
              .trim()
              .replace(/ (?:I|1|L) /g, " ");
            const label = views.find(([pattern]) => pattern.test(normalized))?.[1];
            // Slashes in "PLAN / TOP" often score poorly despite both words
            // being exact. Require higher confidence for a single-word caption.
            if (!label || line.confidence < (normalized.includes(" ") ? 15 : 65)) continue;
            const { x0, y0, x1, y1 } = line.bbox;
            ctx.fillStyle = "#fff";
            ctx.fillRect(x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2);
            ctx.fillStyle = "#211f1b";
            ctx.font = "500 " + Math.max(10, y1 - y0) + "px sans-serif";
            ctx.fillText(label, x0, y1, x1 - x0 + 2);
          }
    }
  };
}
