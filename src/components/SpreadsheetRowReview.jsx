import { useState } from "react";

function ReviewCandidate({ job, entry, command, lang }) {
  const zh = lang === "Cn";
  const text = (cn, en) => (zh ? cn : en);
  const result = job.result_json;
  const rows = result.source_manifest.rows.filter((row) => !entry.row_ids.length || entry.row_ids.includes(row.id));
  const available = rows.filter((row) => !result.items.some((item) => item.source_row_id === row.id));
  const [rowId, selectRow] = useState(available.length === 1 ? available[0].id : "");
  const row = available.find((r) => r.id === rowId);
  const [quantity, setQuantity] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const labels = {
    duplicate_output_row: text("同一来源行有多条候选", "Multiple candidates for one source row"),
    unmatched_output_row: text("未匹配来源行", "Unmatched source row"),
    missing_source_row: text("来源行缺少明细", "Source row missing from the draft"),
    ambiguous_product_row: text("有多个可能的来源行", "Ambiguous source row"),
    merged_product_rows: text("跨行合并的单元格", "Merged cells span rows"),
    source_quantity_total_conflict: text("数量合计不符", "Quantity total mismatch"),
    source_identity_conflict: text("名称或编号不符", "Name or reference mismatch"),
    quantity_mismatch: text("数量不符", "Quantity mismatch"),
    source_quantity_unconfirmed: text("原表数量待确认", "Unconfirmed source quantity"),
    source_value_mismatch: text("提取值与原表不符", "Extracted value differs from source"),
    unconfirmed_recovery: text("补项与未匹配的候选可能重复", "Possible duplicate during row recovery")
  };
  const save = async (decision) => {
    setBusy(true);
    setError("");
    try {
      await command({
        operation: "review_spreadsheet_row",
        jobId: job.id,
        projectId: job.project_id,
        updatedAt: job.updated_at,
        entryKey: String(entry.index ?? entry.row_ids[0]),
        decision,
        rowId,
        quantity: quantity ?? row?.quantity
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const item = entry.item;
  const mismatch = entry.issues.find((i) => i.code === "quantity_mismatch" && i.item_index === entry.index);
  const name =
    entry.issues.find((i) => i.code === "source_identity_conflict" && i.item_index === entry.index)?.reported ||
    item?.item_type_en ||
    rows[0]?.name;
  return (
    <details className="intake-evidence-item">
      <summary>
        {name} · {[...new Set(entry.issues.map((i) => labels[i.code] || i.code))].join(" / ")}
      </summary>
      <div className="intake-evidence-item-body">
        {item && (
          <p>
            {text("识别结果", "Extracted")} · {name} × {mismatch ? (mismatch.reported ?? "?") : (item.quantity ?? "?")}
          </p>
        )}
        {!!entry.row_ids.length &&
          rows.map((r) => (
            <p key={r.id}>
              {r.sheet} · {text("行", "Row")} {r.row} · {r.code} {r.name} × {r.quantity ?? "?"}
            </p>
          ))}
        {entry.issues
          .filter((i) => i.code === "source_quantity_total_conflict")
          .map((i) => (
            <p key={i.row}>
              {i.sheet} · {text("合计行", "Total row")} {i.row} · {text("原表合计", "Stated")} {i.stated} /{" "}
              {text("明细求和", "Calculated")} {i.computed}
            </p>
          ))}
        <label>
          {text("采用的原表行", "Source row to accept")}{" "}
          <select
            value={row?.id || ""}
            onChange={(e) => {
              selectRow(e.target.value);
              setQuantity(null);
            }}
          >
            <option value="">{text("选择来源行", "Select source row")}</option>
            {available.map((r) => (
              <option key={r.id} value={r.id}>
                {r.sheet} · {r.row} · {r.name}
              </option>
            ))}
          </select>
        </label>{" "}
        <label>
          {text("确认数量", "Confirmed quantity")}{" "}
          <input
            type="number"
            min="1"
            max="1000000"
            step="1"
            value={quantity ?? row?.quantity ?? ""}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>{" "}
        <button
          type="button"
          disabled={busy || !row || !(Number(quantity ?? row?.quantity) > 0)}
          onClick={() => save("accept")}
        >
          {text("确认采用", "Accept checked row")}
        </button>{" "}
        <button type="button" disabled={busy} onClick={() => save("exclude")}>
          {text("排除此候选", "Exclude candidate")}
        </button>
        {error && <p role="alert">{error}</p>}
      </div>
    </details>
  );
}

export default function SpreadsheetRowReview({ job, command, lang }) {
  const pending = job.result_json.spreadsheet_row_review.held.filter((entry) => !entry.decision);
  const file = Array.isArray(job.intake_files) ? job.intake_files[0] : job.intake_files;
  return (
    <details className="intake-evidence-notice">
      <summary>
        <strong>
          {lang === "Cn" ? "来源行待核对" : "Source rows awaiting review"} · {pending.length}
        </strong>{" "}
        · {file?.original_name}
      </summary>
      <p>
        {lang === "Cn"
          ? "这些候选已暂停进入 BOM 和生成三视图。请对照原件核对后，采用正确行或排除重复候选。"
          : "These candidates are on hold for BOM and drawings. Compare with the original before accepting a row or excluding a duplicate."}
      </p>
      {pending.map((entry) => (
        <ReviewCandidate key={entry.index ?? entry.row_ids[0]} {...{ job, entry, command, lang }} />
      ))}
    </details>
  );
}
