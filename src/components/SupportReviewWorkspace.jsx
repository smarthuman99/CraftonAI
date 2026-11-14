import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, CheckCheck, Headset, RefreshCw, Search, ShieldCheck, UserRound } from "lucide-react";
import { SupportTurn, supportTime } from "./ProjectSupportWidget.jsx";

export default function SupportReviewWorkspace({ api, lang = "En", demo = false }) {
  const t = (cn, en) => (lang === "Cn" ? cn : en);
  const [sessions, setSessions] = useState([]),
    [selected, setSelected] = useState(null),
    [detail, setDetail] = useState(null);
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [note, setNote] = useState("");
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const epoch = useRef(0),
    locked = useRef(false),
    detailPanel = useRef(null);
  const statusLabel = (s) =>
    s === "needs_human"
      ? t("待人工跟進", "Needs review")
      : s === "reviewed"
        ? t("已復查", "Reviewed")
        : t("待復查", "Unreviewed");
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const r = await api({ action: "concierge_admin_list" });
      setSessions(r.sessions);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    return () => {
      epoch.current++;
    };
  }, [api]);
  useEffect(() => {
    if (selected && window.matchMedia("(max-width: 900px)").matches)
      detailPanel.current?.scrollIntoView({ block: "start" });
  }, [selected]);
  async function choose(id) {
    const current = ++epoch.current;
    setSelected(id);
    setDetail(null);
    setNote("");
    setError("");
    setNotice("");
    try {
      const r = await api({ action: "concierge_admin_detail", sessionId: id });
      if (epoch.current === current) setDetail(r);
    } catch (e) {
      if (epoch.current === current) setError(e.message);
    }
  }
  async function review(status) {
    if (locked.current || !note.trim()) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api({
        action: "concierge_admin_review",
        sessionId: selected,
        expectedUpdatedAt: detail.session.updated_at,
        note,
        status
      });
      await choose(selected);
      await refresh();
      setNotice(t("復查意見已保存。", "Review saved."));
    } catch (e) {
      setError(e.message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const visible = sessions.filter(
    (s) =>
      (filter === "all" || s.status === filter) &&
      `${s.client_name} ${s.company} ${s.project_name}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <section className="support-review" lang={lang === "Cn" ? "zh-Hant" : "en"}>
      <header className="support-review-heading">
        <div>
          <span className="support-kicker">CLIENT CARE / CONVERSATION REVIEW</span>
          <h1>{t("每段對話，都有後續。", "Care, with a clear record.")}</h1>
          <p>
            {t(
              "查看客戶與 AI 的完整對話、參考資料及風險訊號，留下人工復查意見。",
              "Review customer conversations, check the evidence, and leave a human review."
            )}
          </p>
        </div>
        <button className="support-outline-button" disabled={loading || busy} onClick={refresh}>
          <RefreshCw size={16} />
          {t("重新整理", "Refresh")}
        </button>
      </header>
      {demo && (
        <div className="support-demo-notice">
          <ShieldCheck size={15} />
          {t(
            "演示管理員 · 僅包含示例客戶資料 · 復查意見不會顯示給客戶",
            "Demo reviewer · synthetic customer data only · internal notes are never shown to the client"
          )}
        </div>
      )}
      <div className="support-review-metrics">
        {[
          [sessions.length, t("全部對話", "Conversations"), Headset],
          [
            sessions.filter((s) => s.status === "needs_human").length,
            t("待人工跟進", "Need human attention"),
            UserRound
          ],
          [sessions.filter((s) => s.status === "reviewed").length, t("已完成復查", "Reviewed"), CheckCheck]
        ].map(([n, label, Icon]) => (
          <div key={label}>
            <Icon size={20} />
            <strong>{n}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="support-review-filters">
        <label>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("搜尋客戶、公司或項目", "Search client, company or project")}
          />
        </label>
        <select aria-label={t("復查狀態", "Review status")} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">{t("全部狀態", "All statuses")}</option>
          {["needs_human", "open", "reviewed"].map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className="support-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <p role="status" className="support-review-notice">
          <CheckCheck size={16} />
          {notice}
        </p>
      )}
      <div className={`support-review-layout ${selected ? "has-selection" : ""}`}>
        <nav className="support-session-list" aria-label={t("客服對話清單", "Support conversations")}>
          {loading && <p>{t("正在載入…", "Loading…")}</p>}
          {!loading && !visible.length && (
            <div className="support-empty">
              <Headset size={30} />
              <h3>{t("暫無對話", "No conversations yet")}</h3>
              <p>
                {t(
                  "在 Client Portal 發送問題後，記錄會出現在這裡。",
                  "Ask a question in the Client Portal to see the conversation here."
                )}
              </p>
            </div>
          )}
          {visible.map((s) => (
            <button
              key={s.id}
              disabled={busy}
              className={selected === s.id ? "selected" : ""}
              onClick={() => choose(s.id)}
            >
              <div>
                <strong>{s.client_name}</strong>
                <ArrowUpRight size={18} />
              </div>
              <p>{s.project_name}</p>
              <small>{s.company}</small>
              <footer>
                <span className={`support-badge ${s.status}`}>{statusLabel(s.status)}</span>
                <time>{supportTime(s.updated_at, lang)}</time>
              </footer>
            </button>
          ))}
        </nav>
        <section ref={detailPanel} className="support-review-detail" aria-label={t("對話詳情", "Conversation details")}>
          {!selected ? (
            <div className="support-empty support-detail-empty">
              <FileReviewIcon />
              <h3>{t("選擇一段對話", "A conversation, in full.")}</h3>
              <p>
                {t(
                  "原始訊息、AI 回覆及引用資料會顯示在這裡。",
                  "Select a conversation to see the messages, sources and review history."
                )}
              </p>
            </div>
          ) : (
            <>
              <button
                className="support-review-back"
                onClick={() => {
                  epoch.current++;
                  setSelected(null);
                  setDetail(null);
                }}
                disabled={busy}
              >
                <ArrowLeft size={16} />
                {t("返回對話清單", "Back to conversations")}
              </button>
              {!detail ? (
                <p className="support-loading">{t("正在讀取對話…", "Loading conversation…")}</p>
              ) : (
                <>
                  <header className="support-review-detail-header">
                    <span className="support-kicker">{detail.session.id.slice(0, 8)}</span>
                    <h2>{detail.session.project_name}</h2>
                    <p>
                      {detail.session.client_name} · {detail.session.company}
                    </p>
                    <span className={`support-badge ${detail.session.status}`}>
                      {statusLabel(detail.session.status)}
                    </span>
                  </header>
                  <div className="support-review-transcript">
                    {!detail.turns.length && <p>{t("尚無訊息。", "No messages saved yet.")}</p>}
                    {detail.turns.map((turn) => (
                      <div key={turn.id}>
                        <SupportTurn turn={turn} lang={lang} review />
                        <details className="support-evidence">
                          <summary>{t("查看本輪資料快照", "Inspect this turn’s data snapshot")}</summary>
                          <pre>{JSON.stringify(turn.context_snapshot, null, 2)}</pre>
                        </details>
                      </div>
                    ))}
                  </div>
                  <div className="support-review-form">
                    <h3>{t("人工復查", "Human review")}</h3>
                    <p>
                      {t(
                        "意見僅供內部查看；標記復查不會修改原始對話，也不會向客戶發送訊息。",
                        "Notes are internal. A review preserves the original transcript and does not send a message to the client."
                      )}
                    </p>
                    <label htmlFor="support-review-note">{t("復查意見", "Review note")}</label>
                    <textarea
                      id="support-review-note"
                      rows={3}
                      value={note}
                      maxLength={2000}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t("記錄核對結果或需要跟進的事項…", "Record findings or the follow-up needed…")}
                    />
                    <div>
                      <button
                        className="support-outline-button"
                        disabled={busy || !note.trim()}
                        onClick={() => review("needs_human")}
                      >
                        <UserRound size={15} />
                        {t("保留待跟進", "Keep for follow-up")}
                      </button>
                      <button
                        className="support-solid-button"
                        disabled={busy || !note.trim()}
                        onClick={() => review("reviewed")}
                      >
                        <CheckCheck size={16} />
                        {busy ? t("保存中…", "Saving…") : t("標記已復查", "Mark reviewed")}
                      </button>
                    </div>
                  </div>
                  {!!detail.reviews.length && (
                    <div className="support-review-history">
                      <span className="support-kicker">{t("復查歷史", "REVIEW HISTORY")}</span>
                      {detail.reviews.map((r) => (
                        <article key={r.id}>
                          <strong>{statusLabel(r.status)}</strong>
                          <time>{supportTime(r.created_at, lang)}</time>
                          <p>{r.note}</p>
                          <small>
                            {t("復查人：", "Reviewer: ")}
                            {r.reviewer_id}
                          </small>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </section>
  );
}
function FileReviewIcon() {
  return <ShieldCheck size={38} strokeWidth={1.2} />;
}
