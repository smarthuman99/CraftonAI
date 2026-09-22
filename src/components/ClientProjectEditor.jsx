import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { itemFields, protectedItem } from "../../shared/clientProjectEditing.mjs";
import { customerServiceError } from "../customerServiceCopy.js";
import "./clientProjectEditor.css";

const copy = (lang, cn, en) => (lang === "Cn" ? cn : en);
const fields = [
  ["name", "家具名称", "Furniture name"],
  ["quantity", "数量", "Quantity"],
  ["dimensions", "尺寸及单位", "Dimensions and units"],
  ["material", "材质", "Material"],
  ["color", "颜色", "Colour"],
  ["location", "使用位置", "Location"],
  ["notes", "备注", "Notes"]
];

function ItemFields({ lang, value, onChange, disabled = false }) {
  return (
    <div className="client-edit-fields">
      {fields.map(([key, cn, en]) => (
        <label key={key}>
          <span>
            {copy(lang, cn, en)}
            {["name", "quantity"].includes(key) ? " *" : ""}
          </span>
          {key === "notes" ? (
            <textarea
              value={value[key] || ""}
              maxLength={2000}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            />
          ) : (
            <input
              value={value[key] ?? ""}
              disabled={disabled}
              required={["name", "quantity"].includes(key)}
              type={key === "quantity" ? "number" : "text"}
              min={key === "quantity" ? 1 : undefined}
              step={key === "quantity" ? 1 : undefined}
              max={key === "quantity" ? 1000000 : undefined}
              maxLength={key === "name" ? 200 : 2000}
              placeholder={key === "dimensions" ? "W 625 × D 600 × H 755 mm" : undefined}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            />
          )}
        </label>
      ))}
    </div>
  );
}

export function ChangeRequestList({ lang, jobs = [] }) {
  const requests = jobs.flatMap((job) =>
    (job.result_json?.client_change_requests || []).map((request) => ({
      ...request,
      jobId: job.id,
      fileName: (Array.isArray(job.intake_files) ? job.intake_files[0] : job.intake_files)?.original_name
    }))
  );
  return (
    <div className="client-change-list">
      {requests.length ? (
        requests
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((request) => (
            <article key={request.id}>
              <div className="client-edit-inline">
                <strong>
                  {request.kind === "item"
                    ? itemFields(request.proposed).name
                    : request.fileName || copy(lang, "追加 FF&E 文件", "Additional FF&E file")}
                </strong>
                <span>
                  {request.status === "pending"
                    ? copy(lang, "等待审核", "Awaiting review")
                    : request.status === "in_review"
                      ? copy(lang, "审核中", "Under review")
                      : request.status === "resolved"
                        ? copy(lang, "已完成", "Implemented")
                        : copy(lang, "未采纳", "Declined")}
                </span>
              </div>
              <small>{new Date(request.created_at).toLocaleString(lang === "Cn" ? "zh-HK" : "en-GB")}</small>
              {request.kind === "item" && (
                <dl className="client-change-diff">
                  {fields
                    .filter(([key]) => itemFields(request.before)[key] !== itemFields(request.proposed)[key])
                    .map(([key, cn, en]) => (
                      <div key={key}>
                        <dt>{copy(lang, cn, en)}</dt>
                        <dd>
                          <del>{itemFields(request.before)[key] || "—"}</del>
                          <span> → </span>
                          {itemFields(request.proposed)[key] || "—"}
                        </dd>
                      </div>
                    ))}
                </dl>
              )}
              {request.proposed?.reference_file_id && (
                <p>{copy(lang, "附有新的参考照片", "New reference photo attached")}</p>
              )}
              {request.proposed?.client_reference_preview && (
                <a href={request.proposed.client_reference_preview} target="_blank" rel="noreferrer">
                  <img
                    className="client-edit-reference-preview"
                    src={request.proposed.client_reference_preview}
                    alt={copy(lang, "新的参考照片", "New reference photo")}
                  />
                </a>
              )}
              {request.kind === "import" && (
                <p>
                  {copy(
                    lang,
                    `新增 ${request.additions.length} 项 · 更新 ${request.updates.length} 项`,
                    `${request.additions.length} additions · ${request.updates.length} updates`
                  )}
                </p>
              )}
              {request.response && (
                <p className="client-edit-note">
                  <strong>Crafton</strong>
                  <br />
                  {request.response}
                </p>
              )}
            </article>
          ))
      ) : (
        <p>{copy(lang, "暂无变更申请。", "No change requests yet.")}</p>
      )}
    </div>
  );
}

function ImportPreview({ lang, job, version, requiresReview, busy, onConfirm, onDiscard, onDirty }) {
  const [reviewVersion] = useState(version);
  const [choices, setChoices] = useState(() =>
    job.candidates.map((row) => ({ action: row.matches.length ? "" : "add", fields: row.fields }))
  );
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const openRequest = (job.result_json?.client_change_requests || []).some((r) =>
    ["pending", "in_review"].includes(r.status)
  );
  const added = choices.filter((c) => c.action === "add").length,
    updated = choices.filter((c) => c.action === "update").length;
  const setChoice = (index, next) => {
    onDirty();
    setChoices((current) => current.map((choice, i) => (i === index ? { ...choice, ...next } : choice)));
  };
  return (
    <form
      className="client-import-preview"
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(job.id, choices, reviewVersion);
      }}
    >
      <p>
        {copy(
          lang,
          "请逐项核对。疑似重复的家具需要选择新增、更新原项或跳过。",
          "Review each row. For possible duplicates, choose Add separately, Update existing or Skip."
        )}
      </p>
      {openRequest && (
        <p className="client-edit-note">
          {copy(
            lang,
            "此文件已提交变更申请，正在等待 Crafton 审核。",
            "This file has an open change request awaiting Crafton review."
          )}
        </p>
      )}
      {!job.candidates.length && (
        <p>
          {copy(
            lang,
            "此文件没有读取到家具项目。您可以保留它作为参考文件，或取消本次导入。",
            "No furniture rows were found. Keep the file for reference or discard this import."
          )}
        </p>
      )}
      {job.candidates.map((row, index) => (
        <article className="client-import-row" key={index}>
          <div className="client-edit-inline">
            <strong>
              {index + 1}. {row.fields.name || copy(lang, "名称待填写", "Name needed")}
            </strong>
            <small>{row.itemRef}</small>
          </div>
          {row.matches.length > 0 && (
            <p className="client-edit-note">
              {copy(lang, "疑似重复项：", "Possible duplicate: ")}
              {row.matches.map((m) => `${m.name} ${m.sku}`).join(" / ")}
            </p>
          )}
          {row.missing.length > 0 && (
            <small>
              {copy(lang, "请补充资料：", "Details to check: ")}
              {row.missing
                .map((key) => copy(lang, fields.find((f) => f[0] === key)[1], fields.find((f) => f[0] === key)[2]))
                .join(" · ")}
            </small>
          )}
          <label>
            <span>{copy(lang, "导入方式", "Import action")}</span>
            <select
              required
              disabled={busy || openRequest}
              value={choices[index].action}
              onChange={(e) =>
                setChoice(index, {
                  action: e.target.value,
                  jobId: row.matches[0]?.jobId,
                  itemIndex: row.matches[0]?.itemIndex
                })
              }
            >
              <option value="">{copy(lang, "请选择…", "Choose…")}</option>
              <option value="add">{copy(lang, "作为新家具加入", "Add as a separate item")}</option>
              {row.matches.length > 0 && (
                <option value="update">{copy(lang, "更新原有家具", "Update existing item")}</option>
              )}
              <option value="skip">{copy(lang, "跳过此项", "Skip this row")}</option>
            </select>
          </label>
          {choices[index].action === "update" && (
            <label>
              <span>{copy(lang, "要更新的家具", "Item to update")}</span>
              <select
                disabled={busy || openRequest}
                value={`${choices[index].jobId}:${choices[index].itemIndex}`}
                onChange={(e) => {
                  const match = row.matches.find((m) => `${m.jobId}:${m.itemIndex}` === e.target.value);
                  setChoice(index, match);
                }}
              >
                {row.matches.map((m) => (
                  <option key={`${m.jobId}:${m.itemIndex}`} value={`${m.jobId}:${m.itemIndex}`}>
                    {m.name} · {m.sku || m.jobId.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {choices[index].action !== "skip" && (
            <details open={row.missing.some((key) => ["name", "quantity"].includes(key))}>
              <summary>{copy(lang, "核对与修改资料", "Review and edit details")}</summary>
              <ItemFields
                lang={lang}
                value={choices[index].fields}
                disabled={busy || openRequest}
                onChange={(value) => setChoice(index, { fields: value })}
              />
            </details>
          )}
        </article>
      ))}
      {!openRequest && (
        <div className="client-import-confirm">
          <p>
            {copy(
              lang,
              `将新增 ${added} 项，更新 ${updated} 项。原文件会保留。`,
              `${added} additions · ${updated} updates. Original files will be retained.`
            )}
          </p>
          <div className="client-edit-inline">
            <button
              className="client-edit-primary"
              disabled={busy || !job.candidates.length || (!added && !updated) || choices.some((c) => !c.action)}
            >
              {copy(
                lang,
                requiresReview ? "提交追加变更申请" : "确认加入此项目",
                requiresReview ? "Request project changes" : "Confirm project import"
              )}
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirmDiscard(true)}>
              {copy(lang, "取消本次导入", "Discard import")}
            </button>
          </div>
          {confirmDiscard && (
            <div className="client-edit-note">
              <p>
                {copy(
                  lang,
                  "取消后，家具不会加入项目；原始文件仍会保留在文件记录中。",
                  "Discarding keeps the original document in the file history and adds no furniture."
                )}
              </p>
              <button type="button" disabled={busy} onClick={() => onDiscard(job.id)}>
                {copy(lang, "确认取消导入", "Confirm discard")}
              </button>{" "}
              <button type="button" onClick={() => setConfirmDiscard(false)}>
                {copy(lang, "返回", "Go back")}
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

export default function ClientProjectEditor({ lang, project, target, onCommand, onUpload, onClose, onSaved }) {
  const [workspace, setWorkspace] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [name, setName] = useState(""),
    [notes, setNotes] = useState(""),
    [draft, setDraft] = useState(null);
  const [reference, setReference] = useState(target.file || null),
    [referenceId, setReferenceId] = useState("");
  const [referencePreview, setReferencePreview] = useState("");
  const [uploads, setUploads] = useState([]),
    [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState(false);
  const [selectedImport, setSelectedImport] = useState("");
  const dialogRef = useRef(null),
    busyRef = useRef(false),
    dirtyRef = useRef(false),
    commandRef = useRef(onCommand);
  commandRef.current = onCommand;
  busyRef.current = busy;
  dirtyRef.current = dirty;
  const t = (cn, en) => copy(lang, cn, en);
  const load = useCallback(
    async (reset = false) => {
      try {
        const data = await commandRef.current({ operation: "read", projectId: project.projectId });
        setWorkspace(data);
        if (reset) {
          setSelectedImport("");
          setName(data.project.name);
          setNotes(data.project.client_details?.notes || "");
          const item = data.jobs.find((job) => job.id === target.jobId)?.result_json?.items?.[target.itemIndex];
          setDraft(item ? itemFields(item) : null);
          setDirty(false);
        }
        setError("");
      } catch (err) {
        setError(customerServiceError(err.message, lang));
      } finally {
        setLoading(false);
      }
    },
    [lang, project.projectId, target.jobId, target.itemIndex]
  );

  useEffect(() => {
    load(true);
  }, [load]);
  useEffect(() => {
    if (!reference) return undefined;
    const url = URL.createObjectURL(reference);
    setReferencePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [reference]);
  useEffect(() => {
    if (
      target.mode !== "files" ||
      !workspace?.jobs.some(
        (job) => job.client_import_state === "processing" && ["queued", "processing"].includes(job.status)
      )
    )
      return undefined;
    const timer = setInterval(() => {
      if (!busyRef.current && !dirtyRef.current) load();
    }, 5000);
    return () => clearInterval(timer);
  }, [load, target.mode, workspace]);
  useEffect(() => {
    const previousFocus = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busyRef.current) {
          if (dirtyRef.current) setDiscard(true);
          else onClose();
        }
      }
      if (event.key === "Tab") {
        const nodes = [
          ...dialogRef.current.querySelectorAll(
            "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], summary"
          )
        ].filter((el) => el.getClientRects().length);
        if (!nodes.length) {
          event.preventDefault();
          return;
        }
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, []); // Keep focus/scroll anchored to the opener throughout this editing session.

  const run = async (body, close = false) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await onCommand({
        ...body,
        projectId: project.projectId,
        version: body.version || workspace.version
      });
      const message =
        result.outcome === "requested"
          ? t(
              "变更申请已提交。现行规格保持有效，Crafton 会审核价格及交付影响。",
              "Change request submitted. The current specification remains in effect while Crafton reviews pricing and delivery."
            )
          : t("项目资料已保存。", "Project details saved.");
      setDirty(false);
      onSaved(message);
      if (close) onClose();
      else {
        setNotice(message);
        await load();
      }
    } catch (err) {
      setError(customerServiceError(err.message, lang));
    } finally {
      setBusy(false);
    }
  };
  const saveItem = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      let fileId = referenceId;
      if (reference && (!/\.(jpe?g|png|webp)$/i.test(reference.name) || reference.size > 12 * 1024 * 1024)) {
        throw new Error(
          t("请选择不超过 12MB 的 JPG、PNG 或 WebP 图片。", "Choose a JPG, PNG or WebP image up to 12MB.")
        );
      }
      if (reference && !fileId) {
        const row = await onUpload({ file: reference, fileType: "ITEM_REFERENCE" });
        if (!row?.id) throw new Error(t("请登录后再保存照片。", "Sign in before saving the reference photo."));
        fileId = row.id;
        setReferenceId(fileId);
      }
      await run(
        {
          operation: "edit_item",
          jobId: target.jobId,
          itemIndex: target.itemIndex,
          fields: draft,
          referenceFileId: fileId || undefined
        },
        true
      );
    } catch (err) {
      setError(customerServiceError(err.message, lang));
      setBusy(false);
    }
  };
  const uploadFiles = async () => {
    setBusy(true);
    setError("");
    try {
      for (const entry of uploads.filter((upload) => upload.status !== "queued")) {
        const change = (patch) =>
          setUploads((current) => current.map((row) => (row.key === entry.key ? { ...row, ...patch } : row)));
        change({ status: "uploading", error: "" });
        try {
          const record =
            entry.record ||
            (await onUpload({
              file: entry.file,
              fileType: "PROJECT_ADDITION",
              onProgress: (progress) => change({ progress: Math.round(progress) })
            }));
          if (!record?.id) throw new Error(t("请登录后再上传文件。", "Sign in before uploading files."));
          change({ record });
          await onCommand({ operation: "queue_file", projectId: project.projectId, fileId: record.id });
          change({ status: "queued", progress: 100 });
        } catch (err) {
          change({ status: "error", error: customerServiceError(err.message, lang) });
        }
      }
      await load();
    } finally {
      setBusy(false);
    }
  };
  const rawItem = workspace?.jobs.find((job) => job.id === target.jobId)?.result_json?.items?.[target.itemIndex];
  const requiresReview = workspace?.requiresReview || protectedItem(rawItem);
  const readOnly = workspace?.project.lifecycle_status && workspace.project.lifecycle_status !== "active";
  const importJob = workspace?.imports?.find((job) => job.id === selectedImport);
  const title =
    target.mode === "project"
      ? t("编辑项目", "Edit project")
      : target.mode === "item"
        ? t("编辑家具", "Edit item")
        : target.mode === "requests"
          ? t("变更申请", "Change requests")
          : t("添加 FF&E 文件", "Add FF&E files");
  return createPortal(
    <div className={`client-edit-overlay ${target.mode === "project" ? "is-modal" : ""}`}>
      <section
        ref={dialogRef}
        tabIndex={-1}
        className="client-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-edit-title"
        aria-busy={busy || loading}
      >
        <header>
          <div>
            <small>{project.projectName}</small>
            <h2 id="client-edit-title">{title}</h2>
          </div>
          <button
            type="button"
            aria-label={t("关闭编辑", "Close editor")}
            disabled={busy}
            onClick={() => (dirty ? setDiscard(true) : onClose())}
          >
            ×
          </button>
        </header>
        <div className="client-edit-body">
          {discard && (
            <div className="client-edit-note">
              <p>{t("放弃尚未保存的修改？", "Discard unsaved changes?")}</p>
              <button type="button" onClick={() => setDiscard(false)}>
                {t("继续编辑", "Keep editing")}
              </button>{" "}
              <button type="button" onClick={onClose}>
                {t("放弃修改", "Discard changes")}
              </button>
            </div>
          )}
          {error && (
            <div className="client-edit-error" role="alert">
              <p>{error}</p>
              <button type="button" disabled={busy} onClick={() => load(true)}>
                {dirty
                  ? t("放弃修改并重新读取", "Discard edits and reload")
                  : t("重新读取最新资料", "Reload latest details")}
              </button>
            </div>
          )}
          {notice && (
            <p className="client-edit-note" role="status">
              {notice}
            </p>
          )}
          {loading ? (
            <p role="status">{t("正在读取项目资料…", "Loading project details…")}</p>
          ) : (
            workspace && (
              <>
                {readOnly && (
                  <p className="client-edit-note">
                    {t("此项目已归档或退出，仅供查阅。", "This project is read-only.")}
                  </p>
                )}
                {workspace.isDemo && (
                  <p className="client-edit-note">
                    {t(
                      "这是演示项目。修改仅在当前演示中保留；上传文件请使用已登录的客户账号。",
                      "This is a demo project. Edits last for this demo session; file uploads require a signed-in client account."
                    )}
                  </p>
                )}
                {target.mode === "project" && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      run({ operation: "rename", name, notes }, true);
                    }}
                  >
                    <p>
                      {t(
                        "项目名称便于辨认，不会改变项目编号、SKU 或追踪二维码。",
                        "Rename this project without changing its project ID, SKUs or tracking codes."
                      )}
                    </p>
                    <label>
                      <span>{t("项目名称", "Project name")} *</span>
                      <input
                        required
                        maxLength={160}
                        value={name}
                        disabled={busy || readOnly}
                        onChange={(e) => {
                          setName(e.target.value);
                          setDirty(true);
                        }}
                      />
                    </label>
                    <label>
                      <span>{t("项目备注", "Project notes")}</span>
                      <textarea
                        maxLength={4000}
                        value={notes}
                        disabled={busy || readOnly}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          setDirty(true);
                        }}
                      />
                    </label>
                    <footer>
                      <button type="button" disabled={busy} onClick={() => (dirty ? setDiscard(true) : onClose())}>
                        {t("取消", "Cancel")}
                      </button>
                      <button className="client-edit-primary" disabled={busy || readOnly}>
                        {busy ? t("保存中…", "Saving…") : t("保存修改", "Save changes")}
                      </button>
                    </footer>
                  </form>
                )}
                {target.mode === "item" &&
                  (draft ? (
                    <form onSubmit={saveItem}>
                      <p className="client-edit-note">
                        {requiresReview
                          ? t(
                              "此项目已进入确认流程。修改会作为变更申请提交，审核完成前现行规格保持有效。",
                              "This project is already in the confirmation workflow. Changes will be submitted for review; the current specification remains in effect."
                            )
                          : t(
                              "保存后将更新项目草稿。涉及外观或尺寸的修改会重新准备参考图。",
                              "Saving updates the project draft. Reference drawings will be prepared again when appearance or dimensions change."
                            )}
                      </p>
                      <ItemFields
                        lang={lang}
                        value={draft}
                        disabled={busy || readOnly}
                        onChange={(value) => {
                          setDraft(value);
                          setDirty(true);
                        }}
                      />
                      {(referencePreview || target.imageUrl) && (
                        <img
                          className="client-edit-reference-preview"
                          src={referencePreview || target.imageUrl}
                          alt={t("家具参考照片", "Furniture reference photo")}
                        />
                      )}
                      <label>
                        <span>{t("参考照片（可选）", "Reference photo (optional)")}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={busy || readOnly}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!/\.(jpe?g|png|webp)$/i.test(file.name) || file.size > 12 * 1024 * 1024) {
                              setError(
                                t(
                                  "请选择不超过 12MB 的 JPG、PNG 或 WebP 图片。",
                                  "Choose a JPG, PNG or WebP image up to 12MB."
                                )
                              );
                              return;
                            }
                            setReference(file);
                            setReferenceId("");
                            setDirty(true);
                          }}
                        />
                        <small>
                          {reference?.name || t("JPG、PNG 或 WebP，最大 12MB", "JPG, PNG or WebP, up to 12MB")}
                        </small>
                      </label>
                      <footer>
                        <button type="button" disabled={busy} onClick={() => (dirty ? setDiscard(true) : onClose())}>
                          {t("取消", "Cancel")}
                        </button>
                        <button className="client-edit-primary" disabled={busy || readOnly}>
                          {busy
                            ? t("提交中…", "Saving…")
                            : requiresReview
                              ? t("提交变更申请", "Request change")
                              : t("保存家具修改", "Save item")}
                        </button>
                      </footer>
                    </form>
                  ) : (
                    <p>
                      {t(
                        "这件家具已不在当前项目中，请关闭后重新选择。",
                        "This furniture item is no longer available. Close the editor and select it again."
                      )}
                    </p>
                  ))}
                {target.mode === "requests" && <ChangeRequestList lang={lang} jobs={workspace.jobs} />}
                {target.mode === "files" && (
                  <>
                    <p className="client-edit-note">
                      {t(
                        "文件将添加到上方显示的项目。读取完成后，请先确认清单，再加入项目。",
                        "Files belong to the project shown above. Review the extracted list before adding it to the project."
                      )}
                    </p>
                    {workspace.requiresReview && (
                      <p>
                        {t(
                          "项目已进入确认流程，追加内容将提交 Crafton 审核。",
                          "This project is in the confirmation workflow. Additions will be submitted to Crafton for review."
                        )}
                      </p>
                    )}
                    <label className="client-file-picker">
                      <span>{t("选择一个或多个文件", "Choose one or more files")}</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        disabled={busy || readOnly}
                        onChange={(e) => {
                          const selected = Array.from(e.target.files || []);
                          e.target.value = "";
                          setUploads((current) => [
                            ...current,
                            ...selected.map((file) => ({
                              file,
                              key: window.crypto.randomUUID(),
                              status: "selected",
                              progress: 0
                            }))
                          ]);
                        }}
                      />
                      <small>
                        {t(
                          "PDF、Excel、CSV、Word 或图片，每个文件最大 250MB",
                          "PDF, Excel, CSV, Word or images. Up to 250MB per file."
                        )}
                      </small>
                    </label>
                    {uploads.map((entry) => (
                      <div className="client-upload-row" key={entry.key}>
                        <strong>{entry.file.name}</strong>
                        <span role="status">
                          {entry.status === "queued"
                            ? t("文件已上传。", "File uploaded successfully.")
                            : entry.status === "uploading"
                              ? `${entry.progress}%`
                              : entry.error || t("等待上传", "Ready to upload")}
                        </span>
                        {entry.status !== "queued" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setUploads((current) => current.filter((row) => row.key !== entry.key))}
                          >
                            {t("移除", "Remove")}
                          </button>
                        )}
                      </div>
                    ))}
                    {uploads.some((entry) => entry.status !== "queued") && (
                      <button
                        type="button"
                        className="client-edit-primary"
                        disabled={busy || readOnly}
                        onClick={uploadFiles}
                      >
                        {busy ? t("上传中…", "Uploading…") : t("上传并读取文件", "Upload and check files")}
                      </button>
                    )}
                    <h3>{t("项目文件与导入记录", "Project files and imports")}</h3>
                    {(workspace.documents || []).map((document) => {
                      const job = workspace.jobs.find((j) => j.id === document.id),
                        state = document.state;
                      return (
                        <article className="client-file-history" key={document.id}>
                          <div>
                            <strong>{document.name}</strong>
                            <small>
                              {new Date(document.createdAt).toLocaleDateString()} ·{" "}
                              {state === "original"
                                ? t("原始文件", "Original file")
                                : state === "merged"
                                  ? t("已加入项目", "Added to project")
                                  : state === "discarded"
                                    ? t("已取消导入", "Import discarded")
                                    : job?.status === "failed"
                                      ? t(
                                          "文件读取失败，请重新上传",
                                          "Could not read this file. Please upload it again."
                                        )
                                      : state === "preview"
                                        ? t("等待确认清单", "Ready for review")
                                        : t("正在检查文件…", "We’re checking your file…")}
                            </small>
                          </div>
                          <div className="client-edit-inline">
                            {document.url && (
                              <a href={document.url} target="_blank" rel="noreferrer">
                                {t("查看文件", "View file")}
                              </a>
                            )}
                            {state === "preview" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  if (dirty) {
                                    setError(
                                      t(
                                        "请先确认当前清单，或关闭编辑面板并放弃修改。",
                                        "Confirm the current list, or close the editor and discard your unsaved choices."
                                      )
                                    );
                                    return;
                                  }
                                  setSelectedImport(selectedImport === job.id ? "" : job.id);
                                }}
                              >
                                {selectedImport === job.id
                                  ? t("收起清单", "Close list")
                                  : t("核对清单", "Review items")}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                    {importJob?.client_import_state === "preview" && (
                      <ImportPreview
                        key={`${importJob.id}:${importJob.updated_at}`}
                        lang={lang}
                        job={importJob}
                        version={workspace.version}
                        requiresReview={workspace.requiresReview}
                        busy={busy || readOnly}
                        onDirty={() => setDirty(true)}
                        onConfirm={(jobId, choices, version) =>
                          run({ operation: "confirm_import", jobId, choices, version })
                        }
                        onDiscard={(jobId) => run({ operation: "discard_import", jobId })}
                      />
                    )}
                  </>
                )}
              </>
            )
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
