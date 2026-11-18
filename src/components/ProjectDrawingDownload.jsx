import React, { useEffect, useRef, useState } from "react";

export default function ProjectDrawingDownload({ project, plan, lang }) {
  const active = useRef(null);
  const [progress, setProgress] = useState(null);
  const [notice, setNotice] = useState("");
  const zh = lang === "Cn";
  const loading = project.jobs.some((job) => job.drawingFilesState === "loading");
  const unavailable = project.jobs.some((job) => job.drawingFilesState === "error");
  const hint = loading
    ? zh
      ? "正在載入項目圖紙…"
      : "Loading project drawings…"
    : unavailable
      ? zh
        ? "無法載入完整圖紙清單，請重新整理項目。"
        : "Refresh the project to load its drawing list."
      : !plan.entries.length
        ? zh
          ? "暫無可下載的圖紙"
          : "No drawings available yet"
        : "";
  useEffect(() => () => active.current?.abort(), []);

  async function handleClick() {
    if (active.current || !plan.entries.length) return;
    const controller = new AbortController();
    active.current = controller;
    setNotice("");
    setProgress([0, plan.entries.length]);
    try {
      const { downloadProjectDrawings } = await import("../projectDrawingDownload.js");
      await downloadProjectDrawings({
        project,
        plan,
        lang,
        signal: controller.signal,
        onProgress: (n, total) => setProgress([n, total])
      });
      const pending = plan.pending.length;
      setNotice(
        zh
          ? "已準備 " + plan.entries.length + " 份圖紙。" + (pending ? "另有 " + pending + " 項家具待出圖。" : "")
          : plan.entries.length +
              " drawing" +
              (plan.entries.length === 1 ? "" : "s") +
              " ready." +
              (pending ? " Furniture lines awaiting drawings: " + pending + "." : "")
      );
    } catch (error) {
      if (!controller.signal.aborted) setNotice(error.message);
    } finally {
      if (!controller.signal.aborted) setProgress(null);
      active.current = null;
    }
  }

  return (
    <div className="cho-project-drawing-download">
      <button
        type="button"
        className="client-project-tool"
        onClick={handleClick}
        disabled={!!progress || !!hint}
        aria-busy={!!progress || loading}
      >
        <i className="fa-solid fa-download" aria-hidden="true" />
        {progress
          ? (zh ? "正在打包 " : "Preparing ") + progress.join(" / ")
          : zh
            ? "下載全部圖紙"
            : "Download all drawings"}
      </button>
      <small role="status">{hint || notice}</small>
    </div>
  );
}
