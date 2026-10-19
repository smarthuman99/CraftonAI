import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildIntakeEvidenceView, evidenceItemLabel } from "../intakeEvidenceView.mjs";
import "./intakeEvidenceReview.css";

export default function IntakeEvidenceReview({ result, lang }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("pending");
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();
  const view = buildIntakeEvidenceView(result);
  const hasReview = Boolean(view);
  const cn = lang === "Cn";
  const label = (zh, en) => (cn ? zh : en);

  useEffect(() => {
    if (!open || !hasReview || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open, hasReview]);

  if (!view) return null;
  const { gate, review, routing, rows, pendingRows, projectRisks, findings, failures, questions, needsReview } = view;
  const visibleRows = filter === "pending" ? pendingRows : rows;
  const fields = {
    product: label("产品", "Product"),
    quantity: label("数量", "Quantity"),
    dimensions: label("尺寸", "Dimensions"),
    material: label("材质", "Material"),
    image: label("图片", "Image"),
    optional: label("可选属性", "Options")
  };
  const statuses = {
    supported: label("有来源证据", "Evidence found"),
    not_marked_in_source: label("原文未标注可选", "No option marker"),
    missing: label("待查找", "Missing"),
    unverified: label("待核实", "Unverified"),
    partial: label("信息不完整", "Partial"),
    source_partial: label("原文仅有部分资料", "Partial in source"),
    source_missing: label("已复核，原文未提供", "Confirmed source gap")
  };
  const riskLabels = {
    missing_evidence: label("缺少来源证据", "Source evidence missing"),
    unverified_evidence: label("来源证据待核实", "Source evidence needs verification"),
    partial_dimensions: label("尺寸资料不完整", "Dimensions incomplete"),
    invalid_dimensions: label("请核对尺寸及单位", "Check dimensions and units"),
    invalid_quantity: label("请核对数量", "Check quantity"),
    quantity_conflict: label("数量存在冲突", "Conflicting quantities"),
    source_conflict: label("来源资料存在冲突", "Conflicting source details"),
    shared_image_mapping: label("请核对共用图片的家具", "Check shared product photo mapping"),
    small_product_image: label("产品图片清晰度待核实", "Check product photo resolution"),
    duplicate_product: label("可能存在重复家具", "Possible duplicate furniture"),
    complex_table: label("复杂表格需要核对", "Check the table structure"),
    options_or_unknown_source_values: label("可选方案或待定资料需要核对", "Check options and unspecified details"),
    multiple_products: label("多条家具的对应关系需要核对", "Check furniture mapping"),
    quantity_rollup: label("请核对数量汇总", "Check quantity totals"),
    cross_source_context: label("请核对跨页资料", "Check details across source units"),
    unclassified_pages: label("部分来源页面尚未分类", "Some source pages are unclassified"),
    visual_text_ambiguity: label("图片与文字资料需要核对", "Check image and text consistency"),
    low_model_confidence: label("提取资料需要核实", "Extracted details need verification"),
    multiple_variants: label("请核对家具的不同方案", "Check furniture variants"),
    no_products: label("未识别到家具", "No furniture identified"),
    source_read_failure: label("来源文件未能完整读取", "Source could not be fully read"),
    source_text_truncated: label("来源文字未能完整读取", "Source text could not be fully read"),
    missing_source_row: label("来源中有家具尚未提取", "Furniture missing from the extracted list"),
    unmatched_output_row: label("家具尚未匹配到来源行", "Furniture not matched to a source row"),
    duplicate_output_row: label("同一来源行对应多条家具", "Multiple items mapped to one source row"),
    source_field_not_retained: label("来源字段未完整保留", "Source field not fully retained"),
    source_value_mismatch: label("提取值与来源不一致", "Extracted value differs from the source"),
    source_photo_not_verified: label("来源图片尚未核实", "Source photo not yet verified"),
    native_image_storage_failure: label("来源图片尚未完成保存", "Source photo could not be saved")
  };
  const riskText = (risk) => {
    const code = String(risk.code || "").replace(/^spreadsheet_/, "");
    return [
      riskLabels[code] || label("来源资料待核实", "Source details need review"),
      fields[risk.field],
      risk.cell,
      riskLabels[code] ? "" : code
    ]
      .filter(Boolean)
      .join(" · ");
  };
  const routeText =
    routing.route === "client_clarification"
      ? label("待客户补充", "Client details needed")
      : needsReview
        ? label("待内部核对", "Internal review needed")
        : label("资料核对完成", "Document checks complete");
  const close = () => setOpen(false);

  return (
    <>
      <section className="intake-evidence-bar" aria-label={label("资料核对", "Document checks")}>
        <div className="intake-evidence-bar-copy">
          <span className={`intake-evidence-dot${needsReview ? " needs-review" : ""}`} aria-hidden="true" />
          <strong>{label("资料核对", "Document checks")}</strong>
          <span>
            {pendingRows.length
              ? label(`${pendingRows.length} 项家具有待核实资料`, `${pendingRows.length} furniture items need review`)
              : routeText}
          </span>
        </div>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setFilter("pending");
            setOpen(true);
          }}
        >
          {label("查看详情", "View details")} <span aria-hidden="true">↗</span>
        </button>
      </section>
      {open &&
        createPortal(
          <dialog
            ref={dialogRef}
            className="intake-evidence-drawer"
            aria-labelledby={titleId}
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              const rect = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
              )
                close();
            }}
          >
            <header className="intake-evidence-header">
              <div>
                <p>{label("项目资料", "Project documents")}</p>
                <h2 id={titleId}>{label("资料核对详情", "Document check details")}</h2>
                <span>{routeText}</span>
              </div>
              <button
                type="button"
                className="intake-evidence-close"
                onClick={close}
                autoFocus
                aria-label={label("关闭资料核对详情", "Close document check details")}
              >
                ×
              </button>
            </header>
            <div className="intake-evidence-filters" role="group" aria-label={label("显示范围", "Show records")}>
              <button type="button" aria-pressed={filter === "pending"} onClick={() => setFilter("pending")}>
                {label("待处理家具", "Items needing review")} <span>{pendingRows.length}</span>
              </button>
              <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
                {label("全部记录", "All records")} <span>{rows.length}</span>
              </button>
            </div>
            <div className="intake-evidence-content">
              {(projectRisks.length > 0 ||
                findings.length > 0 ||
                failures.length > 0 ||
                review.status === "failed" ||
                questions.length > 0 ||
                (needsReview && !pendingRows.length)) && (
                <section
                  className="intake-evidence-notice"
                  aria-label={label("项目核对提醒", "Project review reminders")}
                >
                  <h3>{label("项目核对提醒", "Project review reminders")}</h3>
                  {needsReview && (
                    <p>
                      {routing.route === "client_clarification"
                        ? label(
                            "仍有资料需要客户补充，请按现有流程跟进。",
                            "Some details still need client clarification. Follow the existing review workflow."
                          )
                        : label(
                            "请按现有审核流程核对以下资料。",
                            "Review these details through the existing approval workflow."
                          )}
                    </p>
                  )}
                  {(projectRisks.length > 0 || findings.length > 0) && (
                    <ul>
                      {projectRisks.map((risk, i) => (
                        <li key={`risk-${i}`}>{riskText(risk)}</li>
                      ))}
                      {findings.map((issue, i) => (
                        <li key={`finding-${i}`}>{issue}</li>
                      ))}
                    </ul>
                  )}
                  {(failures.length > 0 || review.status === "failed") && (
                    <p>
                      {label(
                        "部分来源未能完成复核，请在内部审核中处理。",
                        "Some sources could not be reviewed. Internal review is required."
                      )}
                    </p>
                  )}
                  {questions.length > 0 && (
                    <details>
                      <summary>
                        {label("待内部核对的补充问题", "Clarification questions for internal review")} (
                        {questions.length})
                      </summary>
                      <ul>
                        {questions.map((question, i) => (
                          <li key={i}>{question}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </section>
              )}
              <p className="intake-evidence-list-intro" role="status">
                {filter === "pending"
                  ? label(
                      `显示 ${pendingRows.length} 项待处理家具；已核实字段已隐藏。`,
                      `Showing ${pendingRows.length} furniture items needing review. Verified fields are hidden.`
                    )
                  : label(
                      `显示全部 ${rows.length} 项家具的来源记录。`,
                      `Showing source records for all ${rows.length} furniture items.`
                    )}
              </p>
              {!visibleRows.length && (
                <div className="intake-evidence-empty">
                  <strong>
                    {filter === "pending"
                      ? label("暂无待处理的家具事项", "No furniture items awaiting review")
                      : label("暂无家具来源记录", "No furniture source records available")}
                  </strong>
                  <p>
                    {needsReview
                      ? label(
                          "项目仍有核对事项，请留意上方提醒及现有审批流程。",
                          "Project review is still required. See the reminders above and follow the existing approval workflow."
                        )
                      : label(
                          "可以切换至全部记录查看来源详情。",
                          "Switch to All records to inspect the source details."
                        )}
                  </p>
                </div>
              )}
              {visibleRows.map((row, index) => (
                <details className="intake-evidence-item" key={`${filter}-${row.item_index}-${index}`}>
                  <summary>
                    <span>{evidenceItemLabel(row, lang)}</span>
                    <small>{row.pending ? label("待核对", "Needs review") : label("已核对", "Checked")}</small>
                  </summary>
                  <div className="intake-evidence-item-body">
                    <dl>
                      {(filter === "pending" ? row.pendingFields : row.fields).map((field, i) => (
                        <div key={`${field.field}-${i}`}>
                          <dt>
                            <strong>{fields[field.field] || field.field}</strong>
                            <span>{statuses[field.status] || field.status}</span>
                          </dt>
                          <dd>
                            {field.value ?? "—"}
                            {field.evidence?.source_page
                              ? ` · ${label("来源页/单元", "Source page/unit")} ${field.evidence.source_page}`
                              : ""}
                            {field.evidence?.locator ? ` · ${field.evidence.locator}` : ""}
                            {field.evidence?.quote && <blockquote>{field.evidence.quote}</blockquote>}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {row.risks.length > 0 && (
                      <ul>
                        {row.risks.map((risk, i) => (
                          <li key={i}>{riskText(risk)}</li>
                        ))}
                      </ul>
                    )}
                    {row.conflicts.length > 0 && (
                      <ul>
                        {row.conflicts.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    )}
                    {filter === "all" && (
                      <p className="intake-evidence-source-note">
                        {label("证据覆盖率", "Evidence coverage")}: {row.coverage_percent ?? "—"}%
                      </p>
                    )}
                  </div>
                </details>
              ))}
              <details className="intake-evidence-method">
                <summary>{label("来源记录说明", "About these source records")}</summary>
                <p>
                  {label("证据覆盖率", "Evidence coverage")}: {gate.evidence_coverage_percent ?? "—"}% ·{" "}
                  {review.status === "not_required"
                    ? label("程序校验通过，无需第二次复核", "Program checks passed; no second review needed")
                    : review.status === "completed"
                      ? label("已执行定向复核", "Targeted review performed")
                      : label("复核未完成", "Review incomplete")}
                </p>
                <p>
                  {label(
                    "覆盖率表示字段能否追溯到来源，不代表识别准确率或人工确认。",
                    "Coverage measures source traceability, not extraction accuracy or human approval."
                  )}
                </p>
              </details>
            </div>
          </dialog>,
          document.body
        )}
    </>
  );
}
