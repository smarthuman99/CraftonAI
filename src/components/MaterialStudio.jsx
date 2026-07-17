import React from "react";
import mockData from "../mockData";
import ChairSVG from "./ChairSVG";

const MaterialStudio = ({
  lang,
  selectedFabric,
  selectedLeg,
  configuratorCrib5Blocked,
  handleFabricSelect,
  handleLegSelect,
  submittedProject,
  submittedPreviewUrl
}) => {
  const selectedFabObj = mockData.fabrics.find((f) => f.id === selectedFabric);

  return (
    <div className="material-studio-card animate-fade-in">
      <div className="material-studio-headline">
        MATERIALS · {lang === "Cn" ? "Crafton 高端面料與金屬工藝定製工坊" : "Crafton Bespoke Project Workshop"}
      </div>

      {submittedProject ? (
        <SubmittedProjectWorkshop
          lang={lang}
          submittedProject={submittedProject}
          submittedPreviewUrl={submittedPreviewUrl}
        />
      ) : (
        <DemoMaterialConfigurator
          lang={lang}
          selectedFabric={selectedFabric}
          selectedLeg={selectedLeg}
          selectedFabObj={selectedFabObj}
          configuratorCrib5Blocked={configuratorCrib5Blocked}
          handleFabricSelect={handleFabricSelect}
          handleLegSelect={handleLegSelect}
        />
      )}
    </div>
  );
};

function SubmittedProjectWorkshop({ lang, submittedProject, submittedPreviewUrl }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: submittedPreviewUrl ? "170px 1fr" : "1fr",
          gap: "1rem",
          alignItems: "stretch",
          padding: "1rem",
          background: "rgba(124, 114, 103, 0.045)",
          border: "1px solid rgba(124, 114, 103, 0.16)",
          borderRadius: "4px"
        }}
      >
        {submittedPreviewUrl && (
          <div
            style={{
              minHeight: "150px",
              background: "#F4F2EE",
              border: "1px solid rgba(124, 114, 103, 0.16)",
              borderRadius: "4px",
              overflow: "hidden"
            }}
          >
            <img
              src={submittedPreviewUrl}
              alt={submittedProject.fileName || "Submitted product reference"}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", justifyContent: "center" }}>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--accent-primary)",
              fontWeight: "700",
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
          >
            {lang === "Cn" ? "已提交项目资料" : "Submitted Project Brief"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-tech)",
              fontSize: "1rem",
              color: "var(--text-primary)",
              lineHeight: "1.35"
            }}
          >
            {submittedProject.projectName || (lang === "Cn" ? "客户定制项目" : "Bespoke project")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.45rem 0.8rem" }}>
            <ProjectField
              label={lang === "Cn" ? "数量/描述：" : "Quantity: "}
              value={submittedProject.quantityText || "-"}
            />
            <ProjectField
              label={lang === "Cn" ? "交付地：" : "Destination: "}
              value={submittedProject.destination || "-"}
            />
            <ProjectField
              label={lang === "Cn" ? "附件：" : "File: "}
              value={submittedProject.fileName || (lang === "Cn" ? "暂无附件" : "No attachment")}
            />
            <ProjectField
              label={lang === "Cn" ? "状态：" : "Status: "}
              value={lang === "Cn" ? "已接收，等待供应商报价" : "Received, supplier quote pending"}
            />
          </div>
          {submittedProject.jobId && (
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
              {lang === "Cn" ? "后台任务：" : "Job: "}
              {submittedProject.jobId}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          minHeight: "260px",
          padding: "1rem",
          border: "1px dashed rgba(124, 114, 103, 0.22)",
          borderRadius: "4px",
          background: "rgba(255, 255, 255, 0.35)"
        }}
      >
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>
          {lang === "Cn" ? "其他家具资料" : "Additional Furniture Items"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.8rem" }}>
          {[2, 3].map((itemNo) => (
            <div
              key={itemNo}
              style={{
                minHeight: "180px",
                border: "1px dashed rgba(124, 114, 103, 0.2)",
                borderRadius: "4px",
                background: "rgba(244, 242, 238, 0.65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.78rem",
                lineHeight: "1.5",
                padding: "1rem"
              }}
            >
              {lang === "Cn"
                ? `家具 ${String(itemNo).padStart(2, "0")}：等待客户补充照片与规格`
                : `Item ${String(itemNo).padStart(2, "0")}: awaiting photos and specifications`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectField({ label, value }) {
  return (
    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.45", wordBreak: "break-word" }}>
      <strong style={{ color: "var(--text-primary)" }}>{label}</strong>
      {value}
    </div>
  );
}

function DemoMaterialConfigurator({
  lang,
  selectedFabric,
  selectedLeg,
  selectedFabObj,
  configuratorCrib5Blocked,
  handleFabricSelect,
  handleLegSelect
}) {
  return (
    <div className="swatch-configurator-box">
      <div className="blueprint-board" style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            fontFamily: "var(--font-serif), var(--font-sans)",
            fontSize: "0.62rem",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "2px",
            color: "var(--accent-primary)",
            opacity: "0.7",
            pointerEvents: "none",
            zIndex: 5
          }}
        >
          {lang === "Cn" ? "CRAFTON 定製工坊" : "CRAFTON BESPOKE STUDIO"}
        </span>

        <ChairSVG
          fabricId={selectedFabric}
          legId={selectedLeg}
          animateStyle={configuratorCrib5Blocked ? { boxShadow: "inset 0 0 20px rgba(166, 114, 110, 0.15)" } : {}}
        />

        {configuratorCrib5Blocked && (
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              background: "rgba(166, 114, 110, 0.95)",
              backdropFilter: "blur(8px)",
              color: "#FAF9F6",
              padding: "0.35rem 0.75rem",
              fontSize: "0.62rem",
              fontWeight: "600",
              letterSpacing: "1px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "3px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              textTransform: "uppercase",
              zIndex: 5
            }}
          >
            {lang === "Cn" ? "CRIB 5 法规禁用" : "CRIB 5 NON-COMPLIANT"}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div>
          <label
            style={{
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}
          >
            {lang === "Cn" ? "1. 精选低饱和度面料库" : "1. Select Low-Saturation Fabric"}
          </label>
          <div className="fabric-swatches-grid" style={{ marginTop: "0.4rem" }}>
            {mockData.fabrics.map((fab) => {
              let textureClass = "texture-linen";
              if (fab.id === "FAB-01") textureClass = "texture-velvet";
              if (fab.id === "FAB-03") textureClass = "texture-silk";
              if (fab.id === "FAB-04") textureClass = "texture-leather";

              return (
                <div
                  key={fab.id}
                  className={`fabric-card-option ${selectedFabric === fab.id ? "selected" : ""}`}
                  onClick={() => handleFabricSelect(fab.id)}
                  title={lang === "Cn" ? fab.notesCn : fab.notesEn}
                >
                  <div className={`swatch-preview-circle ${textureClass}`}></div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: "500",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {fab.name.split(" (")[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label
            style={{
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}
          >
            {lang === "Cn" ? "2. 椅腿五金 / 实木饰面" : "2. Chair Leg Finish"}
          </label>
          <div className="finishes-row">
            <button
              className={`finish-circle-btn ${selectedLeg === "matte-black" ? "selected" : ""}`}
              style={{ background: "#1C1B18" }}
              onClick={() => handleLegSelect("matte-black")}
              title="Matte Basalt Black Steel"
            ></button>
            <button
              className={`finish-circle-btn ${selectedLeg === "bronze" ? "selected" : ""}`}
              style={{ background: "#A88F80" }}
              onClick={() => handleLegSelect("bronze")}
              title="Brushed Walnut Bronze"
            ></button>
            <button
              className={`finish-circle-btn ${selectedLeg === "white-oak" ? "selected" : ""}`}
              style={{ background: "#D2C9B1" }}
              onClick={() => handleLegSelect("white-oak")}
              title="Natural White Oak Wood"
            ></button>
          </div>
        </div>

        {selectedFabObj && (
          <div
            style={{
              marginTop: "0.2rem",
              padding: "0.6rem 0.8rem",
              background: "#F4F2EE",
              border: "1px solid var(--glass-border)",
              borderRadius: "2px",
              fontSize: "0.72rem"
            }}
          >
            <div
              style={{
                fontWeight: "600",
                color: "var(--text-primary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "4px"
              }}
            >
              <span>
                {lang === "Cn" ? `当前材质: ${selectedFabObj.name}` : `Active Swatch: ${selectedFabObj.name}`}
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: "500",
                  color: "var(--accent-primary)",
                  background: "rgba(197, 180, 165, 0.15)",
                  padding: "1px 6px",
                  borderRadius: "2px"
                }}
              >
                {lang === "Cn"
                  ? `椅腿: ${selectedLeg === "matte-black" ? "玄武黑钢" : selectedLeg === "bronze" ? "胡桃青铜" : "白橡木"}`
                  : `Legs: ${selectedLeg === "matte-black" ? "Basalt Black" : selectedLeg === "bronze" ? "Walnut Bronze" : "White Oak"}`}
              </span>
            </div>
            <div style={{ color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.4" }}>
              {lang === "Cn" ? selectedFabObj.notesCn : selectedFabObj.notesEn}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginTop: "6px",
                fontWeight: "600",
                color: selectedFabObj.crib5Compatible ? "var(--accent-green)" : "var(--accent-red)"
              }}
            >
              <span
                className={`stage-badge-dot dot-${selectedFabObj.crib5Compatible ? "completed" : "add-log"}`}
                style={{ width: "6px", height: "6px" }}
              ></span>
              {selectedFabObj.crib5Compatible
                ? lang === "Cn"
                  ? "✓ 符合英国 Crib 5 消防阻燃法规"
                  : "✓ UK Crib 5 Compliance Pass"
                : lang === "Cn"
                  ? "警告：面料禁用，不符合 Crib 5 法规"
                  : "BANNED: Fails Crib 5 Regulation"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialStudio;
