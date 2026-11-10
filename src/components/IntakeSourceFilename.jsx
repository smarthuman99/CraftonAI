import React, { useState } from "react";

export default function IntakeSourceFilename({ asset, client, lang }) {
  const [status, setStatus] = useState("idle");
  const { file, name } = asset;
  if (!client || !file?.storage_bucket || !file.storage_path) return <strong>{name}</strong>;

  const label = lang === "Cn" ? `下载客户源文件：${name}` : `Download original file: ${name}`;
  const download = async () => {
    setStatus("preparing");
    try {
      const { data, error } = await client.storage.from(file.storage_bucket).createSignedUrl(file.storage_path, 120);
      if (error || !data?.signedUrl) throw error || new Error("Missing download URL");
      const url = new URL(data.signedUrl);
      url.searchParams.set("download", name);
      const link = document.createElement("a");
      link.href = url.href;
      link.download = name;
      link.referrerPolicy = "no-referrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <strong>
        <button
          type="button"
          className="intake-source-download"
          onClick={download}
          disabled={status === "preparing"}
          aria-busy={status === "preparing"}
          aria-label={label}
          title={label}
        >
          {name}
        </button>
      </strong>
      {status === "error" && (
        <small role="alert">
          {lang === "Cn"
            ? "无法下载原件。请确认账号有权访问此文件，再点击文件名重试。"
            : "Could not download the original. Check your access and click the filename to retry."}
        </small>
      )}
    </>
  );
}
