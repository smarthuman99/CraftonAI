import React, { useState } from "react";
import { ArrowUpRight, Globe2, Headset, ShieldCheck } from "lucide-react";
import ProjectSupportWidget from "./components/ProjectSupportWidget.jsx";
import SupportReviewWorkspace from "./components/SupportReviewWorkspace.jsx";
import "./supportDemo.css";

const request = (review) => async (body) => {
  const res = await fetch("/api/support-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Demo-View": review ? "review" : "client" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Demo service unavailable.");
  return data;
};
const clientApi = request(false),
  reviewApi = request(true);

export default function SupportDemo() {
  const [view, setView] = useState("client"),
    [lang, setLang] = useState("En"),
    [expanded, setExpanded] = useState(null);
  const t = (cn, en) => (lang === "Cn" ? cn : en);
  return (
    <div className="support-demo-shell">
      <div className="support-demo-ribbon">
        <span>
          <ShieldCheck size={13} />
          {t("AI 客服互動 Demo · 示例帳戶與項目", "AI SUPPORT DEMO · SAMPLE ACCOUNT & PROJECTS")}
        </span>
        <span>{t("對話會保存 · 可切換 Backoffice 復查", "Saved conversations · switch to Backoffice to review")}</span>
      </div>
      <header className="support-demo-header">
        <img src="/thecrafton-assets/thecrafton-logo.png" alt="The Crafton" />
        <nav>
          <button onClick={() => setLang(lang === "Cn" ? "En" : "Cn")}>
            <Globe2 size={15} />
            {lang === "Cn" ? "English" : "繁體中文"}
          </button>
          <span>Welcome, Sarah</span>
          <button className={view === "client" ? "active" : ""} onClick={() => setView("client")}>
            Client portal
          </button>
          <button className={view === "review" ? "active" : ""} onClick={() => setView("review")}>
            Backoffice <span className="support-demo-count">DEMO</span>
          </button>
        </nav>
      </header>
      {view === "client" ? (
        <>
          <main className="support-demo-dashboard">
            <section className="support-demo-hero">
              <span className="support-kicker">CLIENT PROJECT STUDIO</span>
              <h1>
                {t("歡迎回來，", "Welcome back,")}
                <br />
                <em>Sarah.</em>
              </h1>
              <div>
                <p>
                  {t(
                    "項目、決策與製作進度，都在這個專屬空間。",
                    "Projects, decisions and production updates in one considered workspace."
                  )}
                </p>
                <span>
                  <Headset size={18} />
                  {t("右下角客服，隨時為您解答", "A little help, just a conversation away")}
                </span>
              </div>
            </section>
            <div className="support-demo-stats">
              {[
                ["2", t("進行中的項目", "Active projects"), "GROUPED BY PROJECT"],
                ["2", t("訂單", "Orders"), "ALL RECORDED ORDERS"],
                ["36", t("製作中的產品", "Pieces in production"), "45 PIECES RECORDED"],
                ["1", t("需要您確認", "Action needed"), "FABRIC SAMPLE PENDING"]
              ].map(([n, label, meta], i) => (
                <article key={label}>
                  <span>0{i + 1}</span>
                  <strong>{n}</strong>
                  <h2>{label}</h2>
                  <small>{meta}</small>
                </article>
              ))}
            </div>
            <div className="support-demo-project-heading">
              <span className="support-kicker">PROJECT OVERVIEW</span>
              <span>{t("2 個項目 · 示例資料", "2 projects · sample records")}</span>
            </div>
            <div className="support-demo-projects">
              {[
                [
                  "01",
                  "The Henley",
                  "Riverside Suites · London, UK",
                  "S09",
                  t("生產中", "In production"),
                  "24 lounge armchairs · 12 side tables",
                  2
                ],
                [
                  "02",
                  "Mayfair",
                  "Private Residence · London, UK",
                  "S05",
                  t("規格確認中", "Specification review"),
                  "9 bespoke sofas · fabric sample pending",
                  1
                ]
              ].map(([id, name, sub, stage, status, desc, step]) => (
                <article key={id}>
                  <div className="support-demo-project-top">
                    <span className="support-kicker">PROJECT / {id}</span>
                    <span className="support-badge">
                      {stage} · {status}
                    </span>
                  </div>
                  <h2>{name}</h2>
                  <p>{sub}</p>
                  <div className="support-demo-track">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <i key={n} className={n <= step ? "done" : ""} />
                    ))}
                  </div>
                  <div className="support-demo-track-labels">
                    <span>{t("需求", "Brief")}</span>
                    <span>{t("製作", "Production")}</span>
                    <span>{t("交付", "Delivery")}</span>
                  </div>
                  <footer>
                    <span>{desc}</span>
                    <button onClick={() => setExpanded(expanded === id ? null : id)} aria-expanded={expanded === id}>
                      {t("項目摘要", "Project summary")}
                      <ArrowUpRight size={15} />
                    </button>
                  </footer>
                  {expanded === id && (
                    <div className="support-demo-project-expanded">
                      {id === "01"
                        ? t(
                            "扶手椅：實心橡木框架、燕麥色亞麻；框架製作回報 75%。邊桌：胡桃木飾面、拉絲黃銅底座；表面處理回報 40%。交付日期尚未確認。",
                            "Armchairs: solid oak frames, oatmeal linen; frame assembly reported at 75%. Side tables: walnut veneer, brushed brass bases; finishing reported at 40%. Delivery date not yet confirmed."
                          )
                        : t(
                            "9 張訂製沙發：圈圈絨面料、橡木椅腳。正在確認色樣，尚未進入生產，交付日期待確認。",
                            "9 bespoke sofas: bouclé upholstery and oak legs. Fabric sample confirmation is pending. Production has not started; delivery date is unconfirmed."
                          )}
                    </div>
                  )}
                </article>
              ))}
            </div>
            <p className="support-demo-footnote">
              {t(
                "以上為虛構演示資料。點擊右下角客服，試問進度、產品明細或交期，再切換 Backoffice 查看保存的對話。",
                "These are fictional demo records. Ask the assistant about progress, product details or delivery, then open Backoffice to review the saved conversation."
              )}
            </p>
          </main>
          <ProjectSupportWidget api={clientApi} lang={lang} demo />
        </>
      ) : (
        <SupportReviewWorkspace api={reviewApi} lang={lang} demo />
      )}
    </div>
  );
}
