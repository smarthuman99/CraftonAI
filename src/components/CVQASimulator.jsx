import React, { useState, useEffect, useRef } from "react";
import mockData from "../mockData";

const CVQASimulator = ({ lang, selectedFabric, selectedLeg }) => {
  const [marketingCvQaStatus, setMarketingCvQaStatus] = useState("idle"); // 'idle', 'scanning', 'passed', 'failed'
  const [marketingCvProgress, setMarketingCvProgress] = useState(0);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const handleMarketingCvScan = () => {
    if (marketingCvQaStatus === "scanning") return;
    setMarketingCvQaStatus("scanning");
    setMarketingCvProgress(0);

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      setMarketingCvProgress((prev) => {
        if (prev >= 100) {
          clearInterval(scanIntervalRef.current);
          setMarketingCvQaStatus("passed");
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const activeFabObj = mockData.fabrics.find((f) => f.id === selectedFabric);
  const progressPercent = marketingCvProgress;

  return (
    <div
      className="qa-panel-card animate-fade-in"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--glass-border)",
        borderRadius: "6px",
        padding: "2.5rem",
        marginTop: "3.5rem",
        boxShadow: "var(--glass-shadow)"
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "3rem",
          alignItems: "center"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div
            className="blueprint-overlay-container"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "340px",
              height: "320px",
              background: "#FAF7F2",
              border: "1px solid rgba(124, 114, 103, 0.15)",
              borderRadius: "4px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 0 20px rgba(26,25,24,0.02)"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage:
                  "linear-gradient(rgba(124, 114, 103, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 114, 103, 0.05) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                pointerEvents: "none"
              }}
            ></div>

            <span
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                fontSize: "0.62rem",
                fontFamily: "var(--font-sans)",
                fontWeight: "600",
                letterSpacing: "1px",
                color: "var(--text-muted)",
                textTransform: "uppercase"
              }}
            >
              {lang === "Cn" ? "✓ 实时物理对齐网格" : "✓ REAL-TIME ALIGNMENT GRID"}
            </span>

            <span
              style={{
                position: "absolute",
                bottom: "12px",
                right: "12px",
                fontSize: "0.62rem",
                fontFamily: "var(--font-sans)",
                fontWeight: "600",
                color: "var(--accent-muted)",
                letterSpacing: "0.5px"
              }}
            >
              {marketingCvQaStatus === "passed" ? "ALIGNMENT: 100%" : "ALIGNING..."}
            </span>

            <video
              src="/furniture_scan.mp4"
              loop
              muted
              playsInline
              preload="none"
              autoPlay={marketingCvQaStatus === "scanning"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: marketingCvQaStatus === "scanning" ? 0.95 : 0.85,
                filter:
                  marketingCvQaStatus === "scanning"
                    ? "brightness(1.05) saturate(1.15)"
                    : "brightness(0.9) saturate(1)",
                transition: "var(--transition-smooth)"
              }}
            />

            {marketingCvQaStatus === "scanning" && <div className="laser-scan-line"></div>}

            <div
              className={`radar-alignment-dot ${marketingCvQaStatus === "scanning" ? "active" : ""}`}
              style={{ top: "35%", left: "32%" }}
            ></div>
            <div
              className={`radar-alignment-dot ${marketingCvQaStatus === "scanning" ? "active" : ""}`}
              style={{ top: "65%", left: "26%" }}
            ></div>
            <div
              className={`radar-alignment-dot ${marketingCvQaStatus === "scanning" ? "active" : ""}`}
              style={{ top: "65%", left: "74%" }}
            ></div>
            <div
              className={`radar-alignment-dot ${marketingCvQaStatus === "scanning" ? "active" : ""}`}
              style={{ top: "35%", left: "68%" }}
            ></div>

            {marketingCvQaStatus === "passed" && (
              <div
                className="stamp-reveal-passed animate-fade-in"
                style={{
                  position: "absolute",
                  border: "2px solid var(--accent-green)",
                  borderRadius: "3px",
                  color: "var(--accent-green)",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  padding: "0.4rem 0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  transform: "rotate(-12deg)",
                  background: "rgba(250,247,242,0.9)",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                }}
              >
                {lang === "Cn" ? "✓ 质检合格" : "✓ VISUAL QA PASSED"}
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: "left" }}>
          <span
            style={{
              fontSize: "0.68rem",
              color: "#7C7267",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
              display: "block",
              marginBottom: "0.4rem"
            }}
          >
            {lang === "Cn" ? "智能制造质量大门门禁" : "SMART MANUFACTURING DOOR CHECK"}
          </span>
          <h3
            style={{
              fontFamily: "var(--font-tech)",
              fontSize: "1.8rem",
              fontWeight: "300",
              color: "var(--text-primary)",
              marginBottom: "1.2rem"
            }}
          >
            {lang === "Cn" ? "实物与图纸视觉质检" : "Photo-to-Drawing QA Diagnostics"}
          </h3>

          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
              fontWeight: "300",
              marginBottom: "2rem"
            }}
          >
            {lang === "Cn"
              ? "出厂前，Crafton 系统自动通过车间扫描机抓取实物照片，调用 OpenCV 计算机视觉提取几何边缘，与原始 3D CAD 设计图纸进行精密度重叠比对，拒绝任何形变或缝制色差。"
              : "Before leaving the workshop, Crafton capturing devices scan the physical pieces and employ OpenCV feature-extraction to compare the geometric envelope against the original 3D CAD blueprint. Color consistency and tolerances are audited on the fly."}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              background: "#FAF7F2",
              border: "1px solid rgba(124, 114, 103, 0.1)",
              borderRadius: "3px",
              padding: "1.5rem",
              marginBottom: "2rem"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.8rem",
                borderBottom: "1px solid rgba(124, 114, 103, 0.08)",
                paddingBottom: "0.6rem"
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                {lang === "Cn" ? "📐 几何轮廓匹配重合度" : "📐 Geometric Silhouette Match"}
              </span>
              <span
                style={{
                  fontWeight: "600",
                  fontFamily: "var(--font-sans)",
                  color: marketingCvQaStatus === "passed" ? "var(--accent-green)" : "var(--text-primary)"
                }}
              >
                {marketingCvQaStatus === "idle"
                  ? "95.82% (ALIGNING)"
                  : marketingCvQaStatus === "scanning"
                    ? `${Math.min(95 + Math.floor(marketingCvProgress / 20), 99)}% (ANALYZING...)`
                    : "99.45% (MATCHED & SAFE)"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.8rem",
                borderBottom: "1px solid rgba(124, 114, 103, 0.08)",
                paddingBottom: "0.6rem"
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                {lang === "Cn" ? "🎨 Delta-E 织物色差系数" : "🎨 Delta-E Fabric Color Deviation"}
              </span>
              <span
                style={{
                  fontWeight: "600",
                  fontFamily: "var(--font-sans)",
                  color: marketingCvQaStatus === "passed" ? "var(--accent-green)" : "var(--text-primary)"
                }}
              >
                {marketingCvQaStatus === "idle"
                  ? "---"
                  : marketingCvQaStatus === "scanning"
                    ? "calculating..."
                    : "0.35 dE (PASS)"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.8rem",
                borderBottom: "1px solid rgba(124, 114, 103, 0.08)",
                paddingBottom: "0.6rem"
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                {lang === "Cn" ? "🧵 拉线缝线针脚间距偏差" : "🧵 Stitching Needle pitch Deviation"}
              </span>
              <span style={{ fontWeight: "600", fontFamily: "var(--font-sans)" }}>
                {marketingCvQaStatus === "passed" ? "< 0.15mm (✓ PASS)" : "---"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "0.72rem",
                paddingTop: "0.2rem"
              }}
            >
              <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>
                {lang === "Cn"
                  ? "🔐 加密抗篡改项目归档 SHA-256 哈希签名"
                  : "🔐 Secure Anti-Tamper Project Archive SHA-256"}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: "var(--text-secondary)",
                  background: "rgba(124,114,103,0.06)",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {marketingCvQaStatus === "passed"
                  ? "SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51"
                  : "SHA-256: PENDING DIAGNOSTIC SCAN"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              className="btn-premium"
              style={{
                background: marketingCvQaStatus === "scanning" ? "var(--accent-muted)" : "var(--accent-primary)",
                minWidth: "160px"
              }}
              onClick={handleMarketingCvScan}
              disabled={marketingCvQaStatus === "scanning"}
            >
              {marketingCvQaStatus === "idle"
                ? lang === "Cn"
                  ? "开启视觉对准质检"
                  : "Run Visual QA Check"
                : marketingCvQaStatus === "scanning"
                  ? lang === "Cn"
                    ? `扫描中 ${progressPercent}%`
                    : `Scanning ${progressPercent}%`
                  : lang === "Cn"
                    ? "✓ 重新对准质检"
                    : "✓ Recalibrate Scan"}
            </button>

            {marketingCvQaStatus === "passed" && (
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "600",
                  color: "var(--accent-green)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                ●{" "}
                {lang === "Cn"
                  ? "数据已自动存入该订单的永久后台审计追踪"
                  : "Data securely written to order audit ledger"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVQASimulator;
