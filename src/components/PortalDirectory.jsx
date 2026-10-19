import React, { useEffect, useRef, useState } from "react";
import PortalImage from "./PortalImage.jsx";
import "./portalDirectory.css";
const copy = (lang, cn, en) => (lang === "Cn" ? cn : en);
const phases = (stage, lang) =>
  stage >= 16
    ? copy(lang, "已交付", "Delivered")
    : stage >= 12
      ? copy(lang, "运输与交付", "Shipping & delivery")
      : stage >= 9
        ? copy(lang, "生产与质检", "Production & inspection")
        : stage >= 6
          ? copy(lang, "询价与比价", "Sourcing")
          : copy(lang, "规格审核", "Specification review");

export default function PortalDirectory({
  client,
  scope = "client",
  lang,
  clientName,
  revision = 0,
  onOpen,
  onNewOrder,
  onBrowseFurniture
}) {
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const [view, setView] = useState("projects"),
    [cursors, setCursors] = useState([null]);
  const [data, setData] = useState(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [opening, setOpening] = useState("");
  const [retry, setRetry] = useState(0);
  const requestId = useRef(0),
    latestOpen = useRef(onOpen);
  latestOpen.current = onOpen;
  const isStaff = scope === "staff",
    cursor = cursors[cursors.length - 1];
  const deepLink = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setCursors([null]);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const params = new window.URLSearchParams(window.location.search);
    if (!isStaff && params.get("view") === "item-tracking" && params.get("tracking") && !deepLink.current) {
      deepLink.current = true;
      setSearch(params.get("tracking"));
    }
  }, [isStaff]);
  useEffect(() => {
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    const started = window.performance.now();
    client
      .rpc("portal_directory", {
        p_scope: scope,
        p_search: query,
        p_filter: filter,
        p_cursor: cursor,
        p_limit: view === "projects" ? 12 : 24,
        p_view: view
      })
      .then(({ data: result, error: failure }) => {
        if (requestId.current !== id) return;
        if (failure) throw failure;
        setData({ ...result, view });
        setBusy(false);
        console.info(
          `[Crafton directory] ${scope}/${view}: ${Math.round(window.performance.now() - started)} ms; ${new window.TextEncoder().encode(JSON.stringify(result)).length} bytes; ${result.rows.length} rows`
        );
        if (
          deepLink.current &&
          query === new window.URLSearchParams(window.location.search).get("tracking") &&
          result.rows.length === 1
        ) {
          deepLink.current = false;
          setOpening(result.rows[0].key);
          return Promise.resolve(latestOpen.current(result.rows[0])).finally(() => setOpening(""));
        }
      })
      .catch(() => {
        if (requestId.current === id) {
          setError(copy(lang, "项目暂时无法加载，请重试。", "Projects could not be loaded. Please retry."));
          setBusy(false);
        }
      });
    return () => {
      requestId.current++;
    };
  }, [client, scope, query, filter, cursor, view, revision, retry, lang]);
  const changeFilter = (value) => {
    setFilter(value);
    setCursors([null]);
  };
  const open = async (row) => {
    setOpening(row.key);
    setError("");
    try {
      await onOpen(row);
    } catch {
      setError(copy(lang, "项目详情加载失败，请重试。", "Project details could not be loaded. Please retry."));
    } finally {
      setOpening("");
    }
  };
  const stats = data?.stats || {};
  const filters = [
    ["all", "全部", "All", stats.projects],
    ["action", isStaff ? "待处理" : "需要您处理", isStaff ? "Needs action" : "Your input needed", stats.action],
    ...(isStaff
      ? [
          ["intake", "订单接入", "Intake", stats.intake],
          ["sourcing", "询价", "Sourcing", stats.sourcing],
          ["production", "生产", "Production", stats.production],
          ["shipping", "交付", "Shipping", stats.shipping]
        ]
      : []),
    ["archived", "已退出", "Retired", stats.archived]
  ];
  return (
    <main className={`portal-directory ${isStaff ? "is-staff" : "is-client"}`} aria-busy={busy}>
      <header>
        <div>
          <span className="portal-kicker">
            {copy(
              lang,
              isStaff ? "管理员后台" : "客户项目工作室",
              isStaff ? "BACKOFFICE CONTROL" : "CLIENT PROJECT STUDIO"
            )}
          </span>
          <h1>
            {isStaff
              ? copy(lang, "订单管理总览", "Order portfolio overview")
              : copy(lang, `${clientName || "客户"}，欢迎回来。`, `Welcome back, ${clientName || "there"}.`)}
          </h1>
          <p>
            {copy(
              lang,
              "查看项目、待确认事项与真实制造进度。",
              "Review projects, decisions and real manufacturing progress."
            )}
          </p>
        </div>
        {!isStaff && (
          <div className="portal-actions">
            <button onClick={onBrowseFurniture}>{copy(lang, "浏览家具", "Browse furniture")}</button>
            <button onClick={onNewOrder}>{copy(lang, "＋ 新建项目", "＋ New project")}</button>
          </div>
        )}
      </header>
      <section className="portal-metrics" aria-label={copy(lang, "项目总数", "Project totals")}>
        {(isStaff
          ? [
              [stats.clients, "客户", "Clients"],
              [stats.projects, "进行中项目", "Live projects"],
              [stats.action, "需要处理", "Needs action"],
              [(stats.production || 0) + (stats.shipping || 0), "生产与交付", "Production & delivery"]
            ]
          : [
              [stats.projects, "项目", "Projects"],
              [stats.orders, "订单", "Orders"],
              [stats.pieces, "家具件数", "Pieces"],
              [stats.action, "需要您处理", "Your input needed"]
            ]
        ).map(([value, cn, en]) => (
          <article key={en}>
            <strong>{value ?? "—"}</strong>
            <span>{copy(lang, cn, en)}</span>
          </article>
        ))}
      </section>
      <section className="portal-directory-list" aria-label={copy(lang, "客户与项目", "Clients and projects")}>
        <div className="portal-toolbar">
          <label>
            {copy(lang, "搜索项目、客户或家具", "Search projects, clients or furniture")}
            <input type="search" value={search} maxLength={200} onChange={(event) => setSearch(event.target.value)} />
          </label>
          {!isStaff && (
            <div className="portal-actions">
              <button
                aria-pressed={view === "projects"}
                onClick={() => {
                  setView("projects");
                  setCursors([null]);
                }}
              >
                {copy(lang, "项目总览", "Projects")}
              </button>
              <button
                aria-pressed={view === "furniture"}
                onClick={() => {
                  setView("furniture");
                  setCursors([null]);
                }}
              >
                {copy(lang, "家具进度", "Furniture progress")}
              </button>
            </div>
          )}
          <button onClick={() => setRetry((n) => n + 1)} disabled={busy}>
            {copy(lang, "刷新", "Refresh")}
          </button>
        </div>
        <div className="portal-filters" role="group" aria-label={copy(lang, "项目筛选", "Project filters")}>
          {filters.map(([id, cn, en, count]) => (
            <button key={id} aria-pressed={filter === id} onClick={() => changeFilter(id)}>
              {copy(lang, cn, en)} <span>{count ?? "—"}</span>
            </button>
          ))}
        </div>
        {error && (
          <p role="alert">
            {error} <button onClick={() => setRetry((n) => n + 1)}>{copy(lang, "重试", "Retry")}</button>
          </p>
        )}
        {opening && <p role="status">{copy(lang, "正在打开完整项目…", "Opening project details…")}</p>}
        {busy || data?.view !== view ? (
          <p role="status">{copy(lang, "正在加载…", "Loading…")}</p>
        ) : (
          <>
            <p className="portal-result-count">
              {copy(
                lang,
                `共 ${data?.total || 0} ${view === "projects" ? "个项目" : "项家具"} · 第 ${cursors.length} 页`,
                `${data?.total || 0} ${view} · Page ${cursors.length}`
              )}
            </p>
            {data?.rows.length ? (
              <div className={view === "projects" ? "portal-project-grid" : "portal-furniture-list"}>
                {data.rows.map((row, index) => (
                  <button
                    className="portal-project-card"
                    key={`${row.key}:${index}`}
                    onClick={() => open(row)}
                    disabled={Boolean(opening)}
                    aria-label={copy(lang, `打开项目 ${row.name}`, `Open project ${row.name}`)}
                  >
                    <div className="portal-project-photo">
                      <PortalImage
                        reference={row.cover}
                        alt={view === "projects" ? row.name : copy(lang, row.item.nameCn, row.item.name)}
                      />
                    </div>
                    <div className="portal-project-copy">
                      {isStaff && <span className="portal-kicker">{row.client_name}</span>}
                      <h2>{view === "projects" ? row.name : copy(lang, row.item.nameCn, row.item.name)}</h2>
                      <p>{view === "projects" ? row.destination : row.name}</p>
                      <span className="portal-stage">{phases(row.stage, lang)}</span>
                      <p>
                        {view === "projects"
                          ? copy(
                              lang,
                              `${row.item_count} 项家具 · ${row.pieces} 件 · ${row.order_count} 个订单`,
                              `${row.item_count} lines · ${row.pieces} pieces · ${row.order_count} orders`
                            )
                          : copy(lang, `数量 ${row.item.quantityText}`, `Quantity ${row.item.quantityText}`)}
                      </p>
                      {(isStaff ? row.needs_action : row.client_action) && (
                        <strong className="portal-action-needed">{copy(lang, "需要处理", "Needs action")}</strong>
                      )}
                      <span className="portal-open">{copy(lang, "查看项目 →", "View project →")}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p>{copy(lang, "没有符合条件的项目。", "No matching projects.")}</p>
            )}
          </>
        )}
        <nav className="portal-pagination" aria-label={copy(lang, "项目分页", "Project pagination")}>
          <button
            disabled={busy || cursors.length === 1}
            onClick={() => {
              setCursors((value) => value.slice(0, -1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {copy(lang, "上一页", "Previous")}
          </button>
          <span>{cursors.length}</span>
          <button
            disabled={busy || !data?.nextCursor}
            onClick={() => {
              setCursors((value) => [...value, data.nextCursor]);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {copy(lang, "下一页", "Next")}
          </button>
        </nav>
      </section>
    </main>
  );
}
