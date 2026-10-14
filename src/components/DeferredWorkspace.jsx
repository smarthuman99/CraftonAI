import React, { lazy, Suspense } from "react";

export function deferredWorkspace(load) {
  const Workspace = lazy(load);
  return function DeferredWorkspace(props) {
    return (
      <Suspense
        fallback={
          <div className="workspace-loading" role="status">
            {props.lang === "Cn" ? "正在打开工作区…" : "Opening workspace…"}
          </div>
        }
      >
        <Workspace {...props} />
      </Suspense>
    );
  };
}
