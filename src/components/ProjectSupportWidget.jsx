import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Headset,
  X,
  ArrowUp,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Plus,
  History,
  FileText,
  UserRound,
  ChevronDown,
  LoaderCircle
} from "lucide-react";
import "./projectSupport.css";

const copy = (lang, cn, en) => (lang === "Cn" ? cn : en);
export const supportTime = (date, lang) =>
  new Intl.DateTimeFormat(lang === "Cn" ? "zh-HK" : "en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
export function SupportTurn({ turn, lang, review = false }) {
  return (
    <div className="support-turn">
      <div className="support-user-message">
        <span>{copy(lang, "您", "You")}</span>
        <p>{turn.question}</p>
      </div>
      <div className="support-ai-message">
        <div className="support-message-byline">
          <Headset size={17} />
          <strong>Crafton Concierge</strong>
          <span>AI</span>
        </div>
        <p>
          {turn.answer ||
            copy(
              lang,
              "訊息已保存，回覆尚未完成。您可申請人工跟進。",
              "Message saved; the reply has not completed. You can request human follow-up."
            )}
        </p>
        {!!turn.sources?.length && (
          <details className="support-sources">
            <summary>
              <FileText size={13} />
              {copy(lang, `參考 ${turn.sources.length} 項資料`, `${turn.sources.length} sources consulted`)}
              <ChevronDown size={13} />
            </summary>
            {turn.sources.map((s) => (
              <div key={s.id}>
                <strong>{s.label}</strong>
                <span>{s.detail}</span>
                <small>
                  {copy(lang, "讀取於 ", "Retrieved ")}
                  {supportTime(s.retrievedAt, lang)}
                </small>
              </div>
            ))}
          </details>
        )}
        <div className="support-message-meta">
          <Check size={12} />
          {copy(lang, "已保存", "Saved")} · {supportTime(turn.created_at, lang)}
          {turn.engine === "fallback"
            ? copy(lang, " · 記錄摘要（AI 離線）", " · Record summary (AI offline)")
            : turn.engine === "demo_rules"
              ? copy(lang, " · 規則演示", " · Rule-based demo")
              : turn.engine === "guardrail"
                ? copy(lang, " · 安全回覆", " · Safety response")
                : ""}
        </div>
        {review && !!turn.flags?.length && (
          <div className="support-risk">
            <ShieldCheck size={15} />
            {copy(lang, "待檢查訊號：", "Signals to review: ")}
            {turn.flags.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectSupportWidget({ api, lang = "En", demo = false }) {
  const t = (cn, en) => copy(lang, cn, en);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [session, setSession] = useState(null);
  const [turns, setTurns] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [pending, setPending] = useState("");
  const panel = useRef(null),
    launcher = useRef(null),
    scroll = useRef(null),
    composer = useRef(null);
  const lock = useRef(false),
    retry = useRef(null),
    generation = useRef(0);

  async function loadHistory(id) {
    const epoch = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await api({ action: "concierge_history", sessionId: id });
      if (epoch !== generation.current) return;
      setSession(result.session);
      setTurns(result.turns);
    } catch (e) {
      if (epoch === generation.current) setError(e.message);
    } finally {
      if (epoch === generation.current) setLoading(false);
    }
  }
  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await api({ action: "concierge_bootstrap" });
      setProjects(result.projects);
      setSessions(result.sessions);
      if (!projectId) {
        const latest = result.sessions.find((s) => result.projects.some((p) => p.id === s.project_id));
        setProjectId(latest?.project_id || result.projects[0]?.id || "");
        if (latest) await loadHistory(latest.id);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (open) void load();
  }, [open]);
  function finishClose() {
    setOpen(false);
    setClosing(false);
    setEntered(false);
  }
  function closeSupport() {
    setEntered(false);
    setClosing(true);
  }
  useEffect(() => {
    if (!open || closing) return;
    // Paint the mounted drawer offscreen before transitioning it into view.
    let nextFrame;
    const firstFrame = window.requestAnimationFrame(() => {
      nextFrame = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(nextFrame);
    };
  }, [open, closing]);
  useEffect(() => {
    if (!closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishClose();
      return;
    }
    // Keep the dialog mounted, focus trapped and page locked through its exit.
    // The timeout also handles interrupted or disabled CSS transitions.
    const timeout = window.setTimeout(finishClose, 350);
    return () => window.clearTimeout(timeout);
  }, [closing]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector("button")?.focus();
    const keyboard = (event) => {
      if (event.key === "Escape") closeSupport();
      if (event.key !== "Tab") return;
      const targets = [
        ...panel.current.querySelectorAll(
          'button:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]'
        )
      ].filter((el) => el.getClientRects().length);
      const first = targets[0],
        last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keyboard);
      launcher.current?.focus();
    };
  }, [open]);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [turns, busy, open]);
  useEffect(
    () => () => {
      generation.current++;
    },
    []
  );

  function newChat(nextProject = projectId) {
    generation.current++;
    retry.current = null;
    setProjectId(nextProject);
    setSession(null);
    setTurns([]);
    setInput("");
    setError("");
    setShowHistory(false);
  }
  async function send(text = input) {
    const message = text.trim();
    if (lock.current || loading || !message || !projectId || message.length > 2000) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setPending(message);
    setInput("");
    const request =
      retry.current?.message === message && retry.current?.projectId === projectId
        ? retry.current
        : {
            action: "concierge_send",
            message,
            projectId,
            sessionId: session?.id,
            requestId: window.crypto.randomUUID(),
            lang
          };
    retry.current = request;
    try {
      const result = await api(request);
      setSession(result.session);
      setTurns((old) => [...old.filter((t) => t.id !== result.turn.id), result.turn]);
      setSessions((old) => [result.session, ...old.filter((s) => s.id !== result.session.id)]);
      retry.current = null;
    } catch (e) {
      setError(e.message);
      setInput(message);
    } finally {
      lock.current = false;
      setBusy(false);
      setPending("");
      composer.current?.focus();
    }
  }
  async function handoff() {
    if (lock.current || !session) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await api({ action: "concierge_handoff", sessionId: session.id });
      setSession((s) => ({ ...s, status: "needs_human" }));
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <button
        ref={launcher}
        className="support-launcher"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="project-support-panel"
        onClick={() => {
          setClosing(false);
          setOpen(true);
        }}
      >
        <span>
          <Headset size={25} strokeWidth={1.7} />
          <span className="support-launcher-dot" />
        </span>
        <span>
          <strong>{t("項目客服", "Project support")}</strong>
          <small>CRAFTON CONCIERGE · AI</small>
        </span>
      </button>
      {open &&
        createPortal(
          <div
            className={`support-overlay${entered ? " is-open" : ""}${closing ? " is-closing" : ""}`}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeSupport();
            }}
          >
            <section
              className="support-panel"
              onTransitionEnd={(event) => {
                if (closing && event.target === event.currentTarget && event.propertyName === "transform") {
                  finishClose();
                }
              }}
              lang={lang === "Cn" ? "zh-Hant" : "en"}
              ref={panel}
              id="project-support-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="support-title"
            >
              <header className="support-panel-header">
                <div className="support-avatar">
                  <Headset size={25} />
                </div>
                <div>
                  <h2 id="support-title">Crafton Concierge</h2>
                  <p>{t("您的 AI 項目客服", "Your AI project assistant")}</p>
                </div>
                <button
                  className="support-icon-button"
                  onClick={closeSupport}
                  aria-label={t("關閉客服", "Close support")}
                >
                  <X size={21} />
                </button>
              </header>
              <div className="support-project-bar">
                <label htmlFor="support-project">{t("正在討論的項目", "PROJECT IN FOCUS")}</label>
                <div>
                  <select
                    id="support-project"
                    value={projectId}
                    disabled={busy || loading}
                    onChange={(e) => newChat(e.target.value)}
                  >
                    {!projects.length && <option value="">{t("暫無可查詢的項目", "No projects available")}</option>}
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="support-tools">
                <span>
                  <ShieldCheck size={14} />
                  {t("僅查詢您的項目", "Your projects, privately")}
                </span>
                <button
                  disabled={busy || loading}
                  onClick={() => setShowHistory(!showHistory)}
                  aria-expanded={showHistory}
                >
                  <History size={15} />
                  {t("記錄", "History")}
                </button>
                <button
                  disabled={busy || loading}
                  onClick={() => newChat()}
                  aria-label={t("新對話", "New conversation")}
                >
                  <Plus size={17} />
                </button>
              </div>
              {showHistory && (
                <div className="support-history">
                  {sessions.filter((s) => s.project_id === projectId).length ? (
                    sessions
                      .filter((s) => s.project_id === projectId)
                      .map((s) => (
                        <button
                          disabled={busy || loading}
                          key={s.id}
                          onClick={() => {
                            setShowHistory(false);
                            void loadHistory(s.id);
                          }}
                        >
                          {supportTime(s.created_at, lang)}
                          <span>
                            {s.id.slice(0, 8)} <ArrowUpRight size={14} />
                          </span>
                        </button>
                      ))
                  ) : (
                    <p>{t("此項目還沒有對話記錄。", "No conversations for this project yet.")}</p>
                  )}
                </div>
              )}
              <div
                className="support-conversation"
                ref={scroll}
                role="log"
                aria-live="polite"
                aria-busy={busy || loading}
              >
                {loading ? (
                  <div className="support-loading">
                    <LoaderCircle className="support-spin" size={20} />
                    {t("正在讀取已保存的資料…", "Loading your saved records…")}
                  </div>
                ) : (
                  !turns.length && (
                    <div className="support-welcome">
                      <span className="support-kicker">A LITTLE CLOSER TO YOUR PROJECT</span>
                      <h3>
                        {t("每個細節，", "Every detail.")}
                        <br />
                        {t("隨時為您解答。", "One conversation.")}
                      </h3>
                      <p>
                        {t(
                          "您好，我是 Crafton AI 客服。從產品材質到製作進度，我會根據您帳戶內的項目記錄回答，並標示參考資料。",
                          "Hello, I’m your Crafton AI assistant. From materials to production milestones, I’ll help you make sense of your project—with sources you can check."
                        )}
                      </p>
                      <div className="support-suggestions">
                        {[
                          t("我的項目目前進度如何？", "How is my project progressing?"),
                          t("可以確認產品數量和材質嗎？", "Check my quantities and materials"),
                          t("目前有確認的交付日期嗎？", "Is my delivery date confirmed?")
                        ].map((q) => (
                          <button key={q} disabled={busy || !projectId} onClick={() => send(q)}>
                            {q}
                            <ArrowUpRight size={17} />
                          </button>
                        ))}
                      </div>
                      <div className="support-welcome-note">
                        <FileText size={15} />
                        <span>
                          {t(
                            "對話會保存，供 Crafton 管理員人工復查。",
                            "Conversations are saved for review by the Crafton team."
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
                {turns.map((turn) => (
                  <SupportTurn key={turn.id} turn={turn} lang={lang} />
                ))}
                {pending && (
                  <div className="support-turn">
                    <div className="support-user-message">
                      <span>{t("您", "You")}</span>
                      <p>{pending}</p>
                    </div>
                    <div className="support-typing">
                      <LoaderCircle className="support-spin" size={17} />
                      {t("正在核對項目資料…", "Checking your project records…")}
                    </div>
                  </div>
                )}
              </div>
              {session?.status === "needs_human" && (
                <div className="support-handoff-status" role="status">
                  <UserRound size={16} />
                  {t(
                    "已列入人工跟進清單，團隊尚未接入此對話。",
                    "Queued for human review. A team member has not joined this chat."
                  )}
                </div>
              )}
              <footer className="support-composer">
                {error && (
                  <div className="support-error" role="alert">
                    {error}
                    <button
                      disabled={busy || loading}
                      onClick={() => {
                        if (input.trim()) void send();
                        else void load();
                      }}
                    >
                      {t("重試", "Retry")}
                    </button>
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send();
                  }}
                >
                  <label className="support-sr-only" htmlFor="support-message">
                    {t("輸入項目問題", "Ask about your project")}
                  </label>
                  <textarea
                    id="support-message"
                    ref={composer}
                    value={input}
                    maxLength={2000}
                    disabled={busy || loading || !projectId}
                    onChange={(e) => {
                      setInput(e.target.value);
                    }}
                    placeholder={t("問問您的項目…", "Ask about your project…")}
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={busy || loading || !input.trim() || !projectId}
                    aria-label={t("發送訊息", "Send message")}
                  >
                    <ArrowUp size={21} />
                  </button>
                </form>
                <div className="support-composer-bottom">
                  <button disabled={!session || busy || loading} onClick={handoff}>
                    <UserRound size={14} />
                    {t("申請人工跟進", "Request human follow-up")}
                  </button>
                  <span>{input.length}/2000</span>
                </div>
                <p>
                  {demo
                    ? t("演示資料 · 對話保存於本機服務", "Demo data · conversations saved on this device’s server")
                    : t(
                        "AI 回覆僅供參考；價格與交期以團隊確認為準。",
                        "AI assistance. Prices and dates require team confirmation."
                      )}
                </p>
              </footer>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}
