import React, { useRef, useState } from "react";
import "./siteNavigation.css";

const pages = [
  ["Overview", "首頁", "Home"],
  ["HowItWorks", "合作流程", "How it works"],
  ["MaterialLibrary", "選材庫", "Material library"],
  ["CaseStudies", "經典案例", "Case study"],
  ["BespokeFurniture", "高端定製", "Bespoke furniture"],
  ["SetFurniture", "标准家具", "Set furniture"],
  ["Contact", "聯絡我們", "Contact"]
];

export default function SiteNavigation({
  lang,
  user,
  currentView,
  marketingTab,
  onLanguageToggle,
  onMarketingNavigate,
  onPortalOpen,
  onBackofficeOpen,
  onSignIn,
  onStartProject,
  onSignOut
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const isChinese = lang === "Cn";
  const portalView = user?.isSupplier ? "SupplierPortal" : "ClientPortal";
  const select = (action) => {
    setMenuOpen(false);
    action();
  };

  return (
    <nav
      className={`site-navigation${menuOpen ? " is-open" : ""}`}
      aria-label={isChinese ? "主導覽" : "Main navigation"}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          setMenuOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <button
        className="site-navigation-brand"
        type="button"
        aria-label={isChinese ? "The Crafton 首頁" : "The Crafton home"}
        onClick={() => select(() => onMarketingNavigate("Overview"))}
      >
        <img src="/thecrafton-assets/thecrafton-logo.png" alt="The Crafton" />
      </button>

      <button
        className="site-navigation-toggle"
        type="button"
        ref={menuButton}
        aria-expanded={menuOpen}
        aria-controls="site-navigation-pages site-navigation-actions"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span>{menuOpen ? (isChinese ? "關閉" : "Close") : isChinese ? "選單" : "Menu"}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d={menuOpen ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"} />
        </svg>
      </button>

      <div className="site-navigation-pages" id="site-navigation-pages">
        {pages.map(([tab, chinese, english]) => (
          <button
            className="site-navigation-link"
            type="button"
            key={tab}
            aria-current={currentView === "Marketing" && marketingTab === tab ? "page" : undefined}
            onClick={() => select(() => onMarketingNavigate(tab))}
          >
            {isChinese ? chinese : english}
          </button>
        ))}
      </div>

      <div className="site-navigation-actions" id="site-navigation-actions">
        <button className="site-navigation-language" type="button" onClick={onLanguageToggle}>
          <svg
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10zM2 12h20" />
          </svg>
          <span>{isChinese ? "English" : "繁體中文"}</span>
        </button>
        {user ? (
          <div className="site-navigation-account">
            <span className="site-navigation-welcome" title={user.name}>
              {isChinese
                ? `歡迎，${String(user.name || "").replace(/\(Manager\)$/i, "(管理员)")}`
                : `Welcome, ${user.name}`}
            </span>
            <button
              className="site-navigation-link"
              type="button"
              aria-current={currentView === portalView ? "page" : undefined}
              onClick={() => select(onPortalOpen)}
            >
              {user.isSupplier
                ? isChinese
                  ? "工厂生产工作台"
                  : "Factory workspace"
                : isChinese
                  ? "客戶中心"
                  : "Client portal"}
            </button>
            {user.isStaff && (
              <button
                className="site-navigation-link"
                type="button"
                aria-current={currentView === "Backoffice" ? "page" : undefined}
                onClick={() => select(onBackofficeOpen)}
              >
                {isChinese ? "管理控制台" : "Backoffice"}
              </button>
            )}
            <button className="site-navigation-signout" type="button" onClick={() => select(onSignOut)}>
              {isChinese ? "登出" : "Sign out"}
            </button>
          </div>
        ) : (
          <>
            <button className="site-navigation-link" type="button" onClick={() => select(onSignIn)}>
              {isChinese ? "登入" : "Sign in"}
            </button>
            <button className="site-navigation-start" type="button" onClick={() => select(onStartProject)}>
              {isChinese ? "啟動項目" : "Start project"}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
