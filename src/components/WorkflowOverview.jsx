import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

// Reuse the approved intake/sourcing surfaces and type roles across operations.
export function WorkflowDisclosure({ title, detail, children, defaultOpen = false, className = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => setOpen(defaultOpen), [defaultOpen]);
  return (
    <details
      className={`workflow-disclosure ${className}`}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span>
          <strong>{title}</strong>
          {detail && <small>{detail}</small>}
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div className="workflow-disclosure-body">{children}</div>
    </details>
  );
}

export default function WorkflowOverview({
  lang,
  project,
  kicker,
  description,
  metrics,
  phases,
  view,
  onViewChange,
  action,
  onRefresh,
  loading,
  panelPrefix,
  children
}) {
  const id = useId();
  const tabs = useRef([]);
  const zh = lang === "Cn";
  const focusPhase = (index) => {
    const next = (index + phases.length) % phases.length;
    onViewChange(phases[next].id);
    tabs.current[next]?.focus();
  };
  return (
    <>
      <section className="sourcing-next-hero" aria-labelledby={`${id}-title`} aria-busy={loading}>
        <div className="sourcing-next-hero-copy">
          <span className="sourcing-next-kicker">{kicker}</span>
          <h2 id={`${id}-title`}>{project?.orderId || project?.projectName}</h2>
          <p className="workflow-project-meta">
            {[project?.clientName, project?.projectLocation].filter(Boolean).join(" · ")}
          </p>
          <p>{description}</p>
        </div>
        <div className="sourcing-next-hero-action">
          <span className="sourcing-next-status">
            {loading ? (zh ? "正在读取" : "LOADING") : zh ? "下一行动" : "NEXT ACTION"}
          </span>
          <strong>{loading ? (zh ? "正在读取项目记录" : "Loading project records") : action.title}</strong>
          <small>{action.detail}</small>
          <button
            type="button"
            className="sourcing-next-primary"
            disabled={loading || !action.onClick}
            onClick={action.onClick}
          >
            {action.label}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="sourcing-next-metrics" aria-label={zh ? "项目摘要" : "Project summary"}>
          {metrics.map((metric) => (
            <div key={metric.label}>
              <strong className={metric.compact ? "workflow-metric-text" : ""}>{loading ? "—" : metric.value}</strong>
              <span>{metric.label}</span>
              {metric.detail && <small>{metric.detail}</small>}
            </div>
          ))}
        </div>
      </section>
      <section className="sourcing-next-stage-card" aria-labelledby={`${id}-stages`}>
        <div className="sourcing-next-section-title">
          <div>
            <span>{zh ? "项目流程" : "WORKFLOW"}</span>
            <h3 id={`${id}-stages`}>{zh ? "项目阶段" : "Project stage"}</h3>
          </div>
          <div className="sourcing-next-secondary-actions">
            <button type="button" onClick={onRefresh} disabled={loading}>
              {zh ? "刷新" : "Refresh"}
            </button>
          </div>
        </div>
        <div className="sourcing-next-stage-track" role="tablist" aria-label={zh ? "工作区阶段" : "Workspace phases"}>
          {phases.map((phase, index) => (
            <button
              ref={(node) => {
                tabs.current[index] = node;
              }}
              key={phase.id}
              type="button"
              role="tab"
              id={`${panelPrefix}-tab-${phase.id}`}
              aria-controls={`${panelPrefix}-${phase.id}`}
              aria-selected={view === phase.id}
              tabIndex={view === phase.id ? 0 : -1}
              className={`${phase.done ? "complete" : ""} ${view === phase.id ? "current" : ""}`}
              onClick={() => onViewChange(phase.id)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                focusPhase(
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? phases.length - 1
                      : index + (event.key === "ArrowRight" ? 1 : -1)
                );
              }}
            >
              <span className="sourcing-next-stage-line" />
              <small>{phase.stage}</small>
              <strong>{phase.label}</strong>
              <p>{phase.detail}</p>
            </button>
          ))}
        </div>
      </section>
      {children}
    </>
  );
}
