import React from "react";

export default function ProjectDetailModal({
  lang,
  selectedProject,
  setSelectedProject,
  setContactMessage,
  setMarketingTab
}) {
  if (!selectedProject) return null;

  const getSwatchBgColor = (code) => {
    switch (code) {
      case "WD-01":
        return "#3a2d24"; // American Walnut
      case "WD-04":
        return "#d2b48c"; // White Oak
      case "WD-07":
        return "#2c2520"; // Smoked Eucalyptus
      case "BF-02":
        return "#f0ebd8"; // Organic Bouclé
      case "BF-08":
        return "#e1d5c2"; // Belgian Linen
      case "BF-12":
        return "#58111a"; // Royal Velvet / Chili
      case "MT-02":
        return "#d4af37"; // Champagne Gold
      case "TL-09":
        return "#592c18"; // Saddle Leather
      case "ST-01":
        return "#4c2e43"; // Calacatta Viola
      default:
        return "#7c7267";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(26, 25, 24, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1500,
        padding: "2rem"
      }}
      onClick={() => setSelectedProject(null)}
    >
      <div
        style={{
          position: "relative",
          backgroundColor: "#FAF9F6",
          color: "#1C1B18",
          maxWidth: "1100px",
          width: "100%",
          maxHeight: "90vh",
          borderRadius: "12px",
          border: "1px solid rgba(124, 114, 103, 0.2)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          overflow: "hidden",
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedProject(null)}
          style={{
            position: "absolute",
            top: "1.5rem",
            right: "1.5rem",
            background: "rgba(26, 25, 24, 0.05)",
            border: "none",
            color: "#1C1B18",
            cursor: "pointer",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            zIndex: 10,
            lineHeight: "1"
          }}
        >
          ✕
        </button>

        {/* Left Column: Image */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FAF9F6" }}>
          <div style={{ flex: 1, position: "relative", minHeight: "380px", overflow: "hidden" }}>
            <img
              src={selectedProject.img}
              alt={selectedProject.titleEn}
              loading="lazy"
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block"
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(26,25,24,0.4) 100%)"
              }}
            ></div>
            <span
              style={{
                position: "absolute",
                left: "2rem",
                bottom: "1.5rem",
                fontFamily: "var(--font-tech)",
                color: "#FAF7F2",
                fontSize: "2rem",
                fontWeight: "300",
                letterSpacing: "2px",
                textShadow: "0 2px 4px rgba(0,0,0,0.4)"
              }}
            >
              {selectedProject.initials}
            </span>
          </div>

          {/* Quick Specs Metadata Bar */}
          <div
            style={{
              padding: "1.5rem 2rem",
              borderTop: "1px solid rgba(124, 114, 103, 0.15)",
              background: "rgba(124, 114, 103, 0.03)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem"
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "#7C7267",
                  fontFamily: "var(--font-tech)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "3px"
                }}
              >
                {lang === "Cn" ? "項目地點 / LOCATION" : "PROJECT LOCATION"}
              </span>
              <strong style={{ fontSize: "0.88rem", color: "#1C1B18", fontWeight: "500" }}>
                {lang === "Cn" ? selectedProject.locationCn : selectedProject.locationEn}
              </strong>
            </div>
            <div>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "#7C7267",
                  fontFamily: "var(--font-tech)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "3px"
                }}
              >
                {lang === "Cn" ? "工藝標準 / COMPLIANCE" : "QUALITY REGULATION"}
              </span>
              <strong style={{ fontSize: "0.88rem", color: "#1C1B18", fontWeight: "500" }}>
                {selectedProject.specsEn.split("/")[0].replace("Specs:", "").trim()}
              </strong>
            </div>
          </div>
        </div>

        {/* Right Column: Descriptions & Swatches */}
        <div
          style={{
            padding: "3rem",
            overflowY: "auto",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#FAF9F6"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
              <span
                style={{
                  background: "rgba(28, 27, 24, 0.08)",
                  color: "var(--accent-primary)",
                  padding: "0.3rem 0.6rem",
                  fontSize: "0.7rem",
                  borderRadius: "3px",
                  fontFamily: "var(--font-tech)",
                  textTransform: "uppercase",
                  fontWeight: "600"
                }}
              >
                {lang === "Cn" ? selectedProject.tagCn : selectedProject.tagEn}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#7C7267", fontFamily: "var(--font-tech)" }}>
                ID: {selectedProject.id}
              </span>
            </div>

            <h2
              style={{
                fontSize: "2rem",
                color: "#1C1B18",
                fontFamily: "'Cormorant Garamond', 'Georgia', serif",
                fontWeight: "300",
                margin: "0 0 1.5rem 0",
                lineHeight: "1.2",
                textAlign: "left"
              }}
            >
              {lang === "Cn" ? selectedProject.titleCn : selectedProject.titleEn}
            </h2>

            <div
              style={{ width: "40px", height: "1px", backgroundColor: "var(--accent-primary)", marginBottom: "1.5rem" }}
            ></div>

            {/* Detailed Narrative Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              <p
                style={{
                  fontSize: "0.92rem",
                  color: "#4A453F",
                  lineHeight: "1.75",
                  margin: 0,
                  textAlign: "justify",
                  fontFamily: lang === "Cn" ? "var(--font-sans)" : "'Georgia', serif"
                }}
              >
                {lang === "Cn" ? selectedProject.detailDescCn : selectedProject.detailDescEn}
              </p>
            </div>

            {/* Swatches Ribbon */}
            <div style={{ marginBottom: "2rem", textAlign: "left" }}>
              <h4
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-tech)",
                  color: "#7C7267",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                  borderBottom: "1px solid rgba(124, 114, 103, 0.15)",
                  paddingBottom: "0.5rem"
                }}
              >
                {lang === "Cn"
                  ? "本案精選定制材質 (FEATURED CUSTOM SWATCHES)"
                  : "FEATURED CUSTOM MATERIALS IN THIS PROJECT"}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {selectedProject.materials &&
                  selectedProject.materials.map((mat) => (
                    <div
                      key={mat.code}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "0.6rem 1rem",
                        background: "rgba(124, 114, 103, 0.05)",
                        border: "1px solid rgba(124, 114, 103, 0.1)",
                        borderRadius: "4px"
                      }}
                    >
                      {/* Swatch color bubble */}
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: getSwatchBgColor(mat.code),
                          border: "1px solid rgba(0,0,0,0.1)",
                          flexShrink: 0
                        }}
                      ></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "500", color: "#1C1B18" }}>
                            {lang === "Cn" ? mat.nameCn : mat.nameEn}
                          </span>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontFamily: "var(--font-tech)",
                              color: "var(--accent-primary)",
                              fontWeight: "600"
                            }}
                          >
                            {mat.code}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              className="btn-premium"
              style={{
                flex: 1,
                padding: "0.9rem 1.5rem",
                fontSize: "0.85rem",
                letterSpacing: "1px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onClick={() => {
                setContactMessage(
                  lang === "Cn"
                    ? `您好，我對「${selectedProject.titleCn}（${selectedProject.locationCn}）」經典案例非常感興趣。我想索取該項目的定製方案概念包及商業合約報價。`
                    : `Hello, I am highly interested in the "${selectedProject.titleEn} (${selectedProject.locationEn})" case study. Please send me the custom concept package and estimated contract bid for this project.`
                );
                setMarketingTab("Contact");
                setSelectedProject(null);
                setTimeout(() => {
                  const el = document.getElementById("contact-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
            >
              <svg
                style={{ width: "16px", height: "16px" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{lang === "Cn" ? "索取本案定制方案" : "REQUEST CONCEPT PACKAGE"}</span>
            </button>

            <button
              className="btn-secondary"
              style={{
                padding: "0.9rem 1.5rem",
                fontSize: "0.85rem",
                letterSpacing: "1px",
                borderColor: "rgba(124, 114, 103, 0.3)",
                color: "#1C1B18"
              }}
              onClick={() => setSelectedProject(null)}
            >
              {lang === "Cn" ? "關閉" : "CLOSE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
