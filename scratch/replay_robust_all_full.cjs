const fs = require('fs');

const appJsPath = "e:\\CraftonAI\\src\\app.jsx";
let content = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');
console.log(`Loaded app.jsx: ${content.length} chars, ${content.split('\n').length} lines.`);

let successCount = 0;
let failCount = 0;

function cleanValue(val) {
  if (typeof val !== 'string') return val;
  let s = val.trim();
  while (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    try {
      const parsed = JSON.parse(s);
      if (typeof parsed === 'string') {
        s = parsed.trim();
      } else {
        break;
      }
    } catch (e) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

function applyReplace(name, target, replacement) {
  if (typeof target !== 'string' || typeof replacement !== 'string') {
    console.log(`  [FAIL] ${name}: Target or replacement is not a string.`);
    failCount++;
    return false;
  }
  
  target = target.replace(/\r\n/g, '\n');
  replacement = replacement.replace(/\r\n/g, '\n');
  
  const occurrences = content.split(target).length - 1;
  if (occurrences === 0) {
    console.log(`  [FAIL] ${name}: Target not found!`);
    console.log(`  Target snippet (first 150 chars):\n${target.substring(0, 150)}`);
    return false;
  } else if (occurrences > 1) {
    console.log(`  [FAIL] ${name}: Multiple occurrences found (${occurrences})!`);
    failCount++;
    return false;
  } else {
    content = content.split(target).join(replacement);
    console.log(`  [SUCCESS] ${name} applied.`);
    successCount++;
    return true;
  }
}

// 1. Step 6027
console.log("\n--- Applying Step 6027 (Navigation Links) ---");
const step6027Args = JSON.parse(fs.readFileSync("scratch/step_6027_tc_0_args_full.json", "utf8"));
applyReplace("Step 6027", cleanValue(step6027Args.TargetContent), cleanValue(step6027Args.ReplacementContent));

// 2. Step 6051
console.log("\n--- Applying Step 6051 (How It Works, Bespoke Furniture, Set Furniture Tabs) ---");
const step6051Args = JSON.parse(fs.readFileSync("scratch/step_6051_tc_0_args_full.json", "utf8"));
applyReplace("Step 6051", cleanValue(step6051Args.TargetContent), cleanValue(step6051Args.ReplacementContent));

// 3. Step 86
console.log("\n--- Applying Step 86 (CV-QA and Client Teaser Simulator) ---");
const step86Raw = fs.readFileSync("scratch/extracted_step_86.json", "utf8");
const step86Obj = JSON.parse(step86Raw);
let step86Args = step86Obj.tool_calls[0].args || step86Obj.tool_calls[0].arguments;
if (typeof step86Args === 'string') {
  step86Args = JSON.parse(step86Args);
}
let step86Chunks = step86Args.ReplacementChunks || step86Args.replacementChunks;
if (typeof step86Chunks === 'string') {
  step86Chunks = JSON.parse(step86Chunks);
}

// Chunk 0: State variables
const chunk0Target = `  const [showVolumetricSimulation, setShowVolumetricSimulation] = useState(false);`;
const chunk0Replacement = `  const [showVolumetricSimulation, setShowVolumetricSimulation] = useState(false);

  // WOW effect state variables for homepage V1.2 enhancements
  const [activeSwatch, setActiveSwatch] = useState("nubuck"); // nubuck, linen, gold, walnut
  const [blueprintSliderPos, setBlueprintSliderPos] = useState(50);
  const [demoMilestone, setDemoMilestone] = useState("S01");

  // V1.3 Marketing Bespoke Simulation States
  const [marketingCvQaStatus, setMarketingCvQaStatus] = useState("idle"); // 'idle', 'scanning', 'passed', 'failed'
  const [marketingCvProgress, setMarketingCvProgress] = useState(0);
  const [marketingTeaserTab, setMarketingTeaserTab] = useState("order"); // 'order', 'packing', 'shipping'
  const [marketingPackingProgress, setMarketingPackingProgress] = useState(0);
  const [marketingPackingBoxes, setMarketingPackingBoxes] = useState([]);
  const [marketingPackingRunning, setMarketingPackingRunning] = useState(false);`;

applyReplace("Step 86 Chunk 0 (States)", chunk0Target, chunk0Replacement);

// Chunk 1: Helper functions and renderers
const chunk1Target = `  const handleStartCrib5Test = () => {`;
const chunk1Replacement = cleanValue(step86Chunks[1].ReplacementContent) + "\n\n  const handleStartCrib5Test = () => {";
applyReplace("Step 86 Chunk 1 (Helper functions & renderers)", chunk1Target, chunk1Replacement);

// Chunk 2: Embedding simulators in Bespoke tab below renderMaterialStudio
const chunk2Target = `              {/* Material Configurator Section */}
              <div style={{ borderTop: '1px solid rgba(124, 114, 103, 0.15)', paddingTop: '5rem' }}>
                <div style={{ textAlign: 'left', marginBottom: '3rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.8rem', fontWeight: '300', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {lang === "Cn" ? "面料與飾面定製工坊" : "Interactive Material Studio"}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '300' }}>
                    {lang === "Cn" ? "實時探索不同的面料組合、椅腿飾面，並即時查看 Crib 5 消防安全性預審結果。" : "Explore rich fabric selections, metal leg profiles, and run a live British Crib 5 flammability pre-audit."}
                  </p>
                </div>
                {renderMaterialStudio()}
              </div>`;

const chunk2Replacement = `              {/* Material Configurator Section */}
              <div style={{ borderTop: '1px solid rgba(124, 114, 103, 0.15)', paddingTop: '5rem' }}>
                <div style={{ textAlign: 'left', marginBottom: '3rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-tech)', fontSize: '1.8rem', fontWeight: '300', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {lang === "Cn" ? "面料與飾面定製工坊" : "Interactive Material Studio"}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '300' }}>
                    {lang === "Cn" ? "實時探索不同的面料組合、椅腿飾面，並即時查看 Crib 5 消防安全性預審結果。" : "Explore rich fabric selections, metal leg profiles, and run a live British Crib 5 flammability pre-audit."}
                  </p>
                </div>
                {renderMaterialStudio()}
                {renderCVQASimulator()}
                {renderClientPortalTeaser()}
              </div>`;

applyReplace("Step 86 Chunk 2 (Embedding simulators in Bespoke tab)", chunk2Target, chunk2Replacement);

// 4. Step 158
console.log("\n--- Applying Step 158 (MP4 Scanner Integration) ---");
const step158Raw = fs.readFileSync("scratch/extracted_step_158.json", "utf8");
const step158Obj = JSON.parse(step158Raw);
let step158Args = step158Obj.tool_calls[0].args || step158Obj.tool_calls[0].arguments;
if (typeof step158Args === 'string') {
  step158Args = JSON.parse(step158Args);
}
applyReplace("Step 158", cleanValue(step158Args.TargetContent || step158Args.targetContent), cleanValue(step158Args.ReplacementContent || step158Args.replacementContent));

// 5. Step 188
console.log("\n--- Applying Step 188 (Asynchronous Closure Safety Fix) ---");
const step188Raw = fs.readFileSync("scratch/extracted_step_188.json", "utf8");
const step188Obj = JSON.parse(step188Raw);
let step188Args = step188Obj.tool_calls[0].args || step188Obj.tool_calls[0].arguments;
if (typeof step188Args === 'string') {
  step188Args = JSON.parse(step188Args);
}
applyReplace("Step 188", cleanValue(step188Args.TargetContent || step188Args.targetContent), cleanValue(step188Args.ReplacementContent || step188Args.replacementContent));

// 6. Step 226
console.log("\n--- Applying Step 226 (Spacing Teaser adjustment) ---");
const step226Raw = fs.readFileSync("scratch/extracted_step_226.json", "utf8");
const step226Obj = JSON.parse(step226Raw);
let step226Args = step226Obj.tool_calls[0].args || step226Obj.tool_calls[0].arguments;
if (typeof step226Args === 'string') {
  step226Args = JSON.parse(step226Args);
}
applyReplace("Step 226", cleanValue(step226Args.TargetContent || step226Args.targetContent), cleanValue(step226Args.ReplacementContent || step226Args.replacementContent));

// 7. Step 230
console.log("\n--- Applying Step 230 (Tab Layout Reordering & Studio deletion) ---");
const step230Raw = fs.readFileSync("scratch/extracted_step_230.json", "utf8");
const step230Obj = JSON.parse(step230Raw);
let step230Args = step230Obj.tool_calls[0].args || step230Obj.tool_calls[0].arguments;
if (typeof step230Args === 'string') {
  step230Args = JSON.parse(step230Args);
}

let target230 = cleanValue(step230Args.TargetContent || step230Args.targetContent);
let replacement230 = cleanValue(step230Args.ReplacementContent || step230Args.replacementContent);

let ok = applyReplace("Step 230", target230, replacement230);
if (!ok) {
  console.log("  [RETRY] Attempting Step 230 with character variation adjustment (无 vs 無)...");
  // Try replacing traditional '無瑕疵' with simplified '无瑕疵' in target230
  const target230Alt1 = target230.split("無瑕疵").join("无瑕疵");
  ok = applyReplace("Step 230 (Alt 1)", target230Alt1, replacement230);
  if (!ok) {
    // Also try replacing simplified '无瑕疵' with traditional '無瑕疵' in target230 just in case
    const target230Alt2 = target230.split("无瑕疵").join("無瑕疵");
    ok = applyReplace("Step 230 (Alt 2)", target230Alt2, replacement230);
  }
}

if (!ok) {
  failCount++; // Mark it as failed since even retry failed
}

console.log(`\n========================================`);
console.log(`Reconstruction complete: Successes: ${successCount}, Failures: ${failCount}`);

if (failCount === 0) {
  fs.writeFileSync(appJsPath, content.replace(/\n/g, '\r\n'));
  console.log(`\n[SUCCESS] Saved perfectly reconstructed app.jsx to ${appJsPath}`);
} else {
  console.log(`\n[FAIL] Some steps failed. Output file was NOT overwritten.`);
}
