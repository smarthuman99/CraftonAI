import React, { useState } from "react";

export default function ContactBlock({ lang, contactMessage, setContactMessage }) {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      qCn: "為什麼 The Crafton 平台的項目中心需要註冊登入才能查看？",
      qEn: "Why is the Client Portal gated with account registration?",
      aCn: "作為高端 B2B 合約家具製造商，我們經手的項目圖紙、CAD 三視圖、英國 Crib 5 阻燃檢測報告以及多個工廠的比價定製 BOM，均涉及極度敏感的商業機密與專利設計。為了保障設計師和業主（Hotels & Developers）的利益，我們採取了硬性安全門檻（Hard Gate）。",
      aEn: "As a premium contract furniture specialist, the custom drawings, CAD models, Crib 5 certificates, and competitive mill BOM sheets represent sensitive B2B trade secrets. Gating protects design copyright and pricing confidentiality."
    },
    {
      qCn: "我們的家具如何滿足英國 Crib 5（Source 5）消防阻燃標準？",
      qEn: "How does The Crafton ensure compliance with British Crib 5 fire codes?",
      aCn: "所有大貨面料在選型阶段即通過系統的 Compliance Gate 自動比對資料庫。如 Royal Velvet 或 Navy Linen，出廠前均進行阻燃塗層處理；對於絲綢等天然不合規物料，系統將強行攔截並提供替代建議，成品均出具第三方物理燃燒合格報告。",
      aEn: "All fabrics undergo automated compliance database screening. Approved fabrics (like Royal Velvet) receive fire-retardant coating treatments. Unsuited fabrics (like silk) are auto-blocked, ensuring the final output gets authorized certificates."
    },
    {
      qCn: "如果項目現場發生變更，支持分批送貨和預算劃線重新計算嗎？",
      qEn: "Do you support split delivery and total recalculation on site changes?",
      aCn: "支持。在 Phase VI (S15 階段)，如果因現場裝修變動需要取消部分單品，系統的財務模組（Split Delivery Auditor）將會對已取消項目進行劃線（Strike-through）標註，自動從總帳單中扣除，並重新分配尾款，支持分批靈活交付。",
      aEn: "Yes. During Stage 15, if site changes require item cancellation, the accounting module automatically triggers strike-throughs on canceled pieces, recalculates remaining balances instantly, and schedules split logistics."
    },
    {
      qCn: "我沒有自己的 CAD 圖紙，只有手繪草圖或照片，系統可以工作嗎？",
      qEn: "Can the system work with hand-drawn sketches or simple photos?",
      aCn: "完全可以。您只需在 Start the Project 的 Intake 表單中上傳手繪草圖或實景照片，後台 OpenClaw 多模態 AI 智能體將自動識別線條、拉伸尺寸公差，為您精確生成可用於工廠生產的平面、立面和剖面圖紙。",
      aEn: "Absolutely. Simply upload hand-drawn sketches or reference photos to our Intake Form. The background OpenClaw multimodal engine automatically traces contours and generates factory-ready 3D/2D blueprints."
    }
  ];

  return (
    <div style={{ padding: "60px 0" }} className="animate-fade-in">
      <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", marginBottom: "60px" }}>
        {/* Left Column: Hubs and Form */}
        <div style={{ flex: "1.2", minWidth: "320px" }}>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#1C1B18",
              marginBottom: "20px",
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            {lang === "Cn" ? "聯絡全球工作室" : "Contact Global Hubs"}
          </h3>

          <p style={{ fontSize: "14.5px", color: "#7C7267", lineHeight: "1.6", marginBottom: "30px" }}>
            {lang === "Cn"
              ? "不論您是需要諮詢高端合約家具設計、送審 Crib 5 阻燃資質、或是導入新的 B2B 量產項目，我們的倫敦和中國團隊隨時為您提供支持。"
              : "Whether consult on contract furniture designs, verify Crib 5 flammability certifications, or initialize high-volume B2B manufacturing, our global team is ready to assist."}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "40px" }}>
            <div
              style={{
                background: "#FAF9F6",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid rgba(124, 114, 103, 0.1)"
              }}
            >
              <div style={{ fontSize: "11px", color: "#9C9287", letterSpacing: "0.1em", fontWeight: "bold" }}>
                🇬🇧 UNITED KINGDOM
              </div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1C1B18", margin: "6px 0" }}>
                London Studio
              </div>
              <div style={{ fontSize: "12px", color: "#7C7267", lineHeight: "1.4" }}>
                +44 20 7946 0192
                <br />
                london@crafton.com
              </div>
            </div>
            <div
              style={{
                background: "#FAF9F6",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid rgba(124, 114, 103, 0.1)"
              }}
            >
              <div style={{ fontSize: "11px", color: "#9C9287", letterSpacing: "0.1em", fontWeight: "bold" }}>
                🇨🇳 CHINA
              </div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1C1B18", margin: "6px 0" }}>
                Manufacturing HQ
              </div>
              <div style={{ fontSize: "12px", color: "#7C7267", lineHeight: "1.4" }}>
                +86 757 2388 9988
                <br />
                factory@crafton.com
              </div>
            </div>
          </div>

          {/* Quick Contact Form */}
          <div
            style={{
              background: "#FAF9F6",
              padding: "30px",
              borderRadius: "12px",
              border: "1px solid rgba(124, 114, 103, 0.1)"
            }}
          >
            <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#1C1B18", marginBottom: "15px" }}>
              {lang === "Cn" ? "快速提交諮詢" : "Submit a Quick Inquiry"}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", gap: "15px" }}>
                <input
                  type="text"
                  placeholder={lang === "Cn" ? "姓名" : "Name"}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(124, 114, 103, 0.15)",
                    background: "#FAF9F6"
                  }}
                />
                <input
                  type="email"
                  placeholder={lang === "Cn" ? "郵箱" : "Email"}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(124, 114, 103, 0.15)",
                    background: "#FAF9F6"
                  }}
                />
              </div>
              <textarea
                rows="3"
                placeholder={lang === "Cn" ? "描述您的項目需求..." : "Describe your project requirements..."}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(124, 114, 103, 0.15)",
                  background: "#FAF9F6",
                  resize: "none"
                }}
              ></textarea>
              <button
                onClick={() =>
                  alert(
                    lang === "Cn"
                      ? "諮詢已提交，我們將通過郵件與 WhatsApp 儘速聯繫您！"
                      : "Inquiry submitted! We will reach out via email/WhatsApp shortly."
                  )
                }
                style={{
                  padding: "10px",
                  background: "#7C7267",
                  color: "#FAF9F6",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  letterSpacing: "0.05em"
                }}
              >
                {lang === "Cn" ? "發送訊息" : "Send Message"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: FAQ Accordion */}
        <div style={{ flex: "1", minWidth: "320px" }}>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#1C1B18",
              marginBottom: "25px",
              fontFamily: "'Cormorant Garamond', serif",
              letterSpacing: "0.5px"
            }}
          >
            {lang === "Cn" ? "常見問題 (FAQ)" : "Frequently Asked Questions"}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: "#FAF9F6",
                    borderRadius: "8px",
                    border: "1px solid rgba(124, 114, 103, 0.1)",
                    overflow: "hidden",
                    transition: "border-color 0.3s"
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14.5px",
                      color: "#1C1B18"
                    }}
                  >
                    <span>{lang === "Cn" ? faq.qCn : faq.qEn}</span>
                    <svg
                      style={{
                        width: "16px",
                        height: "16px",
                        transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                        transform: isOpen ? "rotate(180deg)" : "none",
                        color: "#7C7267"
                      }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? "500px" : "0px",
                      opacity: isOpen ? 1 : 0,
                      overflow: "hidden",
                      transition:
                        "max-height 500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 450ms cubic-bezier(0.16, 1, 0.3, 1)",
                      borderTop: isOpen ? "1px solid rgba(124, 114, 103, 0.05)" : "1px solid transparent"
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 20px 20px 20px",
                        fontSize: "13.5px",
                        color: "#7C7267",
                        lineHeight: "1.6"
                      }}
                    >
                      {lang === "Cn" ? faq.aCn : faq.aEn}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
