import React from "react";

export default function Footer({ lang, setCurrentStageView, setMarketingTab }) {
  return (
    <footer
      style={{
        backgroundColor: "#1A1918",
        borderTop: "1px solid rgba(250, 247, 242, 0.08)",
        padding: "5rem 2rem 3rem 2rem",
        marginTop: "6rem",
        color: "#FAF7F2",
        fontFamily: "var(--font-sans)",
        fontSize: "0.85rem"
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "4rem",
          textAlign: "left"
        }}
        className="footer-columns"
      >
        {/* Col 1: Brand & Philosophy */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <span
            style={{
              fontFamily: "var(--font-tech)",
              fontSize: "1.6rem",
              fontWeight: "500",
              letterSpacing: "3px",
              color: "#FAF7F2",
              textTransform: "uppercase"
            }}
          >
            THE CRAFTON
          </span>
          <p
            style={{
              color: "#9E958B",
              lineHeight: "1.7",
              fontWeight: "300",
              fontSize: "0.85rem",
              maxWidth: "300px"
            }}
          >
            {lang === "Cn"
              ? "義式極簡合約傢俱設計與精工製造。為全球頂奢酒店、高端住宅及设计事務所提供毫米級工程交付。"
              : "Italian Minimalist contract furniture design and engineering. Delivering millimeter-precision custom products for luxury hotels, residences, and design ateliers globally."}
          </p>
        </div>

        {/* Col 2: Sitemap */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <span
            style={{
              fontFamily: "var(--font-tech)",
              fontSize: "1rem",
              fontWeight: "600",
              letterSpacing: "1px",
              color: "var(--accent-secondary)",
              textTransform: "uppercase"
            }}
          >
            {lang === "Cn" ? "網站導航" : "SITEMAP"}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontWeight: "300" }}>
            {[
              { id: "Overview", cn: "首頁", en: "Home" },
              { id: "HowItWorks", cn: "合作流程", en: "How It Works" },
              { id: "MaterialLibrary", cn: "選材庫", en: "Material Library" },
              { id: "CaseStudies", cn: "經典案例", en: "Case Studies" },
              { id: "BespokeFurniture", cn: "高端定製", en: "Bespoke Furniture" },
              { id: "SetFurniture", cn: "標準套配", en: "Set Furniture" },
              { id: "Contact", cn: "聯絡我們", en: "Contact Us" }
            ].map((link) => (
              <span
                key={link.id}
                onClick={() => {
                  setCurrentStageView("Marketing");
                  setMarketingTab(link.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  color: "#9E958B",
                  cursor: "pointer",
                  transition: "color 0.2s"
                }}
                onMouseEnter={(e) => (e.target.style.color = "#FAF7F2")}
                onMouseLeave={(e) => (e.target.style.color = "#9E958B")}
              >
                {lang === "Cn" ? link.cn : link.en}
              </span>
            ))}
          </div>
        </div>

        {/* Col 3: Compliance */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <span
            style={{
              fontFamily: "var(--font-tech)",
              fontSize: "1rem",
              fontWeight: "600",
              letterSpacing: "1px",
              color: "var(--accent-secondary)",
              textTransform: "uppercase"
            }}
          >
            {lang === "Cn" ? "技術合規" : "COMPLIANCE"}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", color: "#9E958B", fontWeight: "300" }}>
            <span>{lang === "Cn" ? "英國 BS 5852 Crib 5 消防阻燃" : "BS 5852 Crib 5 Fire Rated"}</span>
            <span>{lang === "Cn" ? "FSC® 綠色可持續硬木" : "FSC® Certified Hardwoods"}</span>
            <span>{lang === "Cn" ? "8%-12% H₂O 真空窯幹防裂" : "8%-12% H₂O Kiln Dried"}</span>
            <span>{lang === "Cn" ? "ISO 9001 質量認證工廠" : "ISO 9001 Quality Assured"}</span>
          </div>
        </div>

        {/* Col 4: Contact & Locations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <span
            style={{
              fontFamily: "var(--font-tech)",
              fontSize: "1rem",
              fontWeight: "600",
              letterSpacing: "1px",
              color: "var(--accent-secondary)",
              textTransform: "uppercase"
            }}
          >
            {lang === "Cn" ? "全球聯絡" : "OFFICES"}
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
              color: "#9E958B",
              fontWeight: "300",
              fontSize: "0.8rem"
            }}
          >
            <div>
              <strong style={{ color: "#FAF7F2", display: "block", marginBottom: "2px", fontSize: "0.85rem" }}>
                🇬🇧 LONDON STUDIO
              </strong>
              <span>+44 20 7946 0192</span>
              <br />
              <span>london@crafton.com</span>
            </div>
            <div>
              <strong style={{ color: "#FAF7F2", display: "block", marginBottom: "2px", fontSize: "0.85rem" }}>
                🇨🇳 GUANGDONG MILL HQ
              </strong>
              <span>+86 757 2388 9988</span>
              <br />
              <span>factory@crafton.com</span>
            </div>
            <div>
              <strong style={{ color: "#FAF7F2", display: "block", marginBottom: "2px", fontSize: "0.85rem" }}>
                🇦🇺 MELBOURNE ATELIER
              </strong>
              <span>+61 3 9846 0118</span>
              <br />
              <span>melbourne@crafton.com</span>
            </div>
            <div>
              <strong style={{ color: "#FAF7F2", display: "block", marginBottom: "2px", fontSize: "0.85rem" }}>
                🇺🇸 MIAMI SHOWROOM
              </strong>
              <span>+1 305 555 0143</span>
              <br />
              <span>miami@crafton.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider & Copyright */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "4rem auto 0 auto",
          paddingTop: "2rem",
          borderTop: "1px solid rgba(250, 247, 242, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          color: "#9E958B",
          fontSize: "0.75rem",
          fontWeight: "300"
        }}
      >
        <span>© 2026 THE CRAFTON. {lang === "Cn" ? "保留所有權利。" : "All rights reserved."}</span>
        <span style={{ fontFamily: "var(--font-tech)", fontStyle: "italic", letterSpacing: "0.5px" }}>
          {lang === "Cn" ? "意式極簡 · 匠心製造" : "Fine Contract Furniture of Italian Minimalist Craftsmanship."}
        </span>
      </div>
    </footer>
  );
}
