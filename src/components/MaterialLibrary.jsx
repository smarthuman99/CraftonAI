import React, { useState } from "react";

const MAT_DATA = [
  {
    id: "MAT-01",
    category: "leather",
    nameCn: "托斯卡納磨砂皮 (馬鞍棕)",
    nameEn: "Tuscan Nubuck Leather (Saddle Tan)",
    code: "TL-04",
    originCn: "佛羅倫斯，意大利",
    originEn: "Florence, Italy",
    specsCn: "真皮本身耐磨，10萬次 Martindale 測試，自然防滑。物理通過 Crib 5 檢測。",
    specsEn: "Highly durable. 100k+ Martindale cycles, natural grip. Inherently passes Crib 5 flame testing.",
    image: "/mat_TL-04.jpg"
  },
  {
    id: "MAT-02",
    category: "leather",
    nameCn: "頂級全粒面馬鞍皮 (黑曜石)",
    nameEn: "Premium Full-Grain Saddle Leather (Obsidian)",
    code: "TL-09",
    originCn: "佛羅倫斯，意大利",
    originEn: "Florence, Italy",
    specsCn: "3.2mm 厚度，植物鞣製，硬挺有型。表面防潑水防刮擦處理。",
    specsEn: "3.2mm thickness, veg-tanned, ultra-structured. Treated with stain & scratch resistance.",
    image: "/mat_TL-09.jpg"
  },
  {
    id: "MAT-03",
    category: "leather",
    nameCn: "阿尼林柔軟山羊皮 (淺駝色)",
    nameEn: "Aniline Fine Goatskin (Muted Sand)",
    code: "TL-11",
    originCn: "西西里，意大利",
    originEn: "Sicily, Italy",
    specsCn: "親膚細膩，純手工阿尼林透染。⚠️ Crib 5 需做額外環保防火焰噴塗。",
    specsEn: "Soft, hand-finished pure aniline dyed. ⚠️ Crib 5 compliance requires supplementary eco-coating.",
    image: "/mat_TL-11.jpg"
  },
  {
    id: "MAT-04",
    category: "fabrics",
    nameCn: "有機圈圈呢布 (暖沙色)",
    nameEn: "Organic Bouclé (Warm Sand)",
    code: "BF-02",
    originCn: "根特，比利時",
    originEn: "Ghent, Belgium",
    specsCn: "大顆粒凹凸立體質感，80% 羊毛混紡，自然防污，耐磨。可經阻燃處理。",
    specsEn: "High-texture boucle, 80% virgin wool blend, inherently soil-resistant. Crib 5 treatable.",
    image: "/mat_BF-02.jpg"
  },
  {
    id: "MAT-05",
    category: "fabrics",
    nameCn: "比利時高密精梳亞麻 (原麻色)",
    nameEn: "Belgian Combed Linen (Natural Flax)",
    code: "BF-08",
    originCn: "安特衛普，比利時",
    originEn: "Antwerp, Belgium",
    specsCn: "傳統手工紡織，100% 天然有機長纖。透氣性極佳，縮水率小於 1.5%。",
    specsEn: "Traditional hand-spun, 100% natural long-staple organic flax. Max breathability, <1.5% shrinkage.",
    image: "/mat_BF-08.jpg"
  },
  {
    id: "MAT-06",
    category: "fabrics",
    nameCn: "精工重磅棉天鵝絨 (海軍藍)",
    nameEn: "Heavyweight Cotton Velvet (Classic Navy)",
    code: "BF-12",
    originCn: "布魯塞爾，比利時",
    originEn: "Brussels, Belgium",
    specsCn: "重磅 580g/㎡，密實高奢光澤。支持 Crib 5 阻燃處理（處理後手感微硬）。",
    specsEn: "580g/sqm heavy pile, luxurious subtle luster. Crib 5 compatible with standard backing coating.",
    image: "/mat_BF-12.jpg"
  },
  {
    id: "MAT-07",
    category: "wood",
    nameCn: "FAS級美洲黑胡桃木",
    nameEn: "FAS American Black Walnut",
    code: "WD-01",
    originCn: "俄勒岡州，美國",
    originEn: "Oregon, USA",
    specsCn: "烘乾含水率 8%-12% 精控，天然山形木紋。表面採用德國 OSMO 進口木蠟油塗裝。",
    specsEn: "Moisture strictly at 8%-12%. Deep mountain grain. Finished with premium German OSMO wax-oil.",
    image: "/mat_WD-01.jpg"
  },
  {
    id: "MAT-08",
    category: "wood",
    nameCn: "FAS級歐洲白橡木",
    nameEn: "FAS European White Oak",
    code: "WD-04",
    originCn: "勃艮第，法國",
    originEn: "Burgundy, France",
    specsCn: "高硬度抗劃傷，FSC 森林環保認證。本色磨砂水性啞光漆，10% 塗裝光澤度。",
    specsEn: "High density & scratch resistant, FSC certified. Finished with ultra-matte water-based coat.",
    image: "/mat_WD-04.jpg"
  },
  {
    id: "MAT-09",
    category: "wood",
    nameCn: "意式深燻橡木",
    nameEn: "Italian Smoked Charcoal Oak",
    code: "WD-07",
    originCn: "科莫，意大利",
    originEn: "Como, Italy",
    specsCn: "高溫炭化煙燻處理，防蟲防腐。深邃黑炭灰質感，保留實木天然棕眼觸感。",
    specsEn: "Thermal carbonization carbon treatment, anti-decay. Deep charcoal finish with natural pore tactility.",
    image: "/mat_WD-07.jpg"
  },
  {
    id: "MAT-10",
    category: "metal",
    nameCn: "陽極氧化香檳金鋼",
    nameEn: "Anodized Champagne Gold Steel",
    code: "MT-02",
    originCn: "慕尼黑，德國",
    originEn: "Munich, Germany",
    specsCn: "物理陽極表面硬化，永不氧化褪色，防指紋。超啞光緞面微珠光澤。",
    specsEn: "Physical anodized surface hardening, zero oxidation/fade, anti-fingerprint. Satin luster.",
    image: "/mat_MT-02.jpg"
  },
  {
    id: "MAT-11",
    category: "metal",
    nameCn: "精拉絲古銅鋼 (磨砂)",
    nameEn: "Satin Brushed Bronze Steel",
    code: "MT-05",
    originCn: "米蘭，意大利",
    originEn: "Milan, Italy",
    specsCn: "毫米級拉絲物理紋理，手工封油脂防斑點。高雅黃銅褐色調，富有復古工坊質感。",
    specsEn: "Fine-brushed micro-grain, hand-sealed with preservative grease. Historic atelier vintage vibe.",
    image: "/mat_MT-05.jpg"
  },
  {
    id: "MAT-12",
    category: "metal",
    nameCn: "真空 PVD 鍍黑鈦拉絲不銹鋼",
    nameEn: "PVD Dark Gunmetal Steel",
    code: "MT-08",
    originCn: "斯圖加特，德國",
    originEn: "Stuttgart, Germany",
    specsCn: "真空離子 PVD 鍍黑鈦層，硬度可達 4H 以上。防酸鹼耐腐蝕，極簡高冷深灰色調。",
    specsEn: "Physical Vapor Deposition (PVD) titanium plating. Hardness >4H. Anti-corrosive, deep slate tone.",
    image: "/mat_MT-08.jpg"
  },
  {
    id: "MAT-13",
    category: "stone",
    nameCn: "卡拉卡塔天然奢石大理石",
    nameEn: "Calacatta Gold Luxury Marble",
    code: "ST-01",
    originCn: "卡拉拉，意大利",
    originEn: "Carrara, Italy",
    specsCn: "天然奢石。晶瑩乳白底色配以高雅金灰大紋理。五面防滲色納米結晶鍍膜保護。",
    specsEn: "Luxury natural stone. Pristine white with golden-grey veins. Protected with nano-crystallized film.",
    image: "/mat_ST-01.jpg"
  },
  {
    id: "MAT-14",
    category: "stone",
    nameCn: "阿爾卑斯綠奢石大理石",
    nameEn: "Verde Alpi Luxury Marble",
    code: "ST-05",
    originCn: "奧斯塔，意大利",
    originEn: "Aosta, Italy",
    specsCn: "墨綠色底紋搭配白色網狀結晶。結構極其密實。表面拋光度達 95GU 以上。",
    specsEn: "Deep emerald background with white veins. Exceptional density, polished to a 95+ GU sheen.",
    image: "/mat_ST-05.jpg"
  },
  {
    id: "MAT-15",
    category: "stone",
    nameCn: "黑白根高檔大理石",
    nameEn: "Nero Marquina Premium Marble",
    code: "ST-08",
    originCn: "巴斯克，西班牙",
    originEn: "Basque, Spain",
    specsCn: "高飽和深曜黑配以天然白筋，高冷強烈對比。天然碳酸鈣結晶。防油防酸保護。",
    specsEn: "High-saturation rich black with white veins. Pure calcium carbonate. Coated with oil-resistant glaze.",
    image: "/mat_ST-08.jpg"
  }
];

const MaterialLibrary = ({ lang, onProceedToContact }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  // Filter materials based on category & search query
  const filteredMaterials = MAT_DATA.filter((mat) => {
    const matchesCategory = activeCategory === "all" || mat.category === activeCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      mat.nameCn.toLowerCase().includes(query) ||
      mat.nameEn.toLowerCase().includes(query) ||
      mat.code.toLowerCase().includes(query) ||
      mat.originCn.toLowerCase().includes(query) ||
      mat.originEn.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  // Handle add/remove material from inquiry
  const handleToggleMaterial = (mat) => {
    if (selectedMaterials.some((item) => item.id === mat.id)) {
      setSelectedMaterials(selectedMaterials.filter((item) => item.id !== mat.id));
    } else {
      setSelectedMaterials([...selectedMaterials, mat]);
    }
  };

  // Generate inquiry text and send callback
  const handleProceed = () => {
    if (selectedMaterials.length === 0) return;

    let text = "";
    if (lang === "Cn") {
      text = `您好，我對 Crafton 項目感興趣，並在選材庫中挑選了以下 ${selectedMaterials.length} 款優質材質，請為我提供專屬規格的 B2B 報價和可行性諮詢：\n\n`;
      selectedMaterials.forEach((mat, idx) => {
        text += `${idx + 1}. 【${mat.code}】${mat.nameCn} (產地: ${mat.originCn})\n`;
      });
      text += `\n期望項目交付現場: \n期望工期與批量需求: `;
    } else {
      text = `Hi Crafton Team, I have curated the following ${selectedMaterials.length} materials from your Material Library for my contract project. Please provide a formal B2B quotation and delivery assessment:\n\n`;
      selectedMaterials.forEach((mat, idx) => {
        text += `${idx + 1}. [${mat.code}] ${mat.nameEn} (Origin: ${mat.originEn})\n`;
      });
      text += `\nExpected Delivery Site: \nExpected Timeline & Volume: `;
    }

    onProceedToContact(text);
  };

  const categories = [
    { id: "all", cn: "全部材質", en: "ALL MATERIALS" },
    { id: "leather", cn: "頂級皮革", en: "TUSCAN LEATHER" },
    { id: "fabrics", cn: "手織布藝", en: "BELGIAN FABRICS" },
    { id: "wood", cn: "精工實木", en: "FAS SOLID WOOD" },
    { id: "metal", cn: "五金飾面", en: "PREMIUM METALS" },
    { id: "stone", cn: "大理石奢石", en: "NATURAL STONE" }
  ];

  return (
    <div
      className="animate-editorial-slide-up"
      style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem", position: "relative" }}
    >
      {/* SECTION 1: HEADER (Exactly as in user's image) */}
      <div style={{ marginBottom: "4rem", borderBottom: "1px solid rgba(66, 47, 37, 0.08)", paddingBottom: "3rem" }}>
        <span
          style={{
            fontSize: "0.72rem",
            color: "#7C7267",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
            display: "block",
            marginBottom: "0.8rem"
          }}
        >
          {lang === "Cn" ? "材質圖書館" : "MATERIAL LIBRARY"}
        </span>
        <h1
          style={{
            fontSize: "3.6rem",
            fontFamily: "var(--font-tech)",
            color: "var(--accent-primary)",
            fontWeight: "300",
            letterSpacing: "-0.02em",
            lineHeight: "1.1",
            marginBottom: "2rem"
          }}
        >
          {lang === "Cn" ? "經典材質館" : "Material Library"}
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--text-secondary)",
            lineHeight: "1.7",
            maxWidth: "820px",
            fontWeight: "300",
            fontFamily: "var(--font-sans)"
          }}
        >
          {lang === "Cn"
            ? "以下是我們在各個項目中常用且精選的頂級材質系列。從本材質庫開始選材，能有效簡化您的設計與生產流程，減少來回溝通的繁瑣細節，進而使我們能夠提供更精準的高效報價與精工製造。"
            : "Below is a curated selection of materials we regularly work with across our projects. Starting with this material library helps streamline the design and production process, reducing back-and-forth and allowing us to quote and manufacture more efficiently."}
        </p>
      </div>

      {/* SECTION 2: CHOOSING MATERIALS (Exactly as in user's image) */}
      <div style={{ marginBottom: "5.5rem" }}>
        <span
          style={{
            fontSize: "0.72rem",
            color: "#7C7267",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
            display: "block",
            marginBottom: "0.8rem"
          }}
        >
          {lang === "Cn" ? "挑選材質" : "CHOOSING MATERIALS"}
        </span>
        <h2
          style={{
            fontSize: "2.5rem",
            fontFamily: "var(--font-tech)",
            color: "var(--text-primary)",
            fontWeight: "300",
            letterSpacing: "0.01em",
            marginBottom: "2.5rem"
          }}
        >
          {lang === "Cn" ? "三種合作形式。" : "Three ways forward."}
        </h2>

        {/* 3 Columns Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px"
          }}
        >
          {/* Card 01 */}
          <div
            className="material-workflow-card"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid rgba(124, 114, 103, 0.15)",
              borderRadius: "16px",
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem",
              transition: "var(--transition-smooth)"
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-tech)",
                fontSize: "2rem",
                color: "var(--accent-muted)",
                fontWeight: "300"
              }}
            >
              01
            </span>
            <h3
              style={{
                fontFamily: "var(--font-tech)",
                fontSize: "1.4rem",
                fontWeight: "400",
                color: "var(--text-primary)"
              }}
            >
              {lang === "Cn" ? "從我們的選材庫挑選" : "Select from our library"}
            </h3>
            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                fontWeight: "300",
                fontFamily: "var(--font-sans)"
              }}
            >
              {lang === "Cn"
                ? "在此頁面瀏覽我們精心策劃的材質庫，並添加任何適合您需求的材質。您可以按類別進行篩選，以精確縮小您的選擇範圍。"
                : "Browse our curated material library on this page and add anything that fits your enquiry. Filter by category to narrow the view."}
            </p>
          </div>

          {/* Card 02 */}
          <div
            className="material-workflow-card"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid rgba(124, 114, 103, 0.15)",
              borderRadius: "16px",
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem",
              transition: "var(--transition-smooth)"
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-tech)",
                fontSize: "2rem",
                color: "var(--accent-muted)",
                fontWeight: "300"
              }}
            >
              02
            </span>
            <h3
              style={{
                fontFamily: "var(--font-tech)",
                fontSize: "1.4rem",
                fontWeight: "400",
                color: "var(--text-primary)"
              }}
            >
              {lang === "Cn" ? "寄送您自購的原料" : "Ship your own"}
            </h3>
            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                fontWeight: "300",
                fontFamily: "var(--font-sans)"
              }}
            >
              {lang === "Cn"
                ? "您可以自行採購並將您專屬的皮料、面料或五金配件寄送至我們的工廠倉庫。我們將在設計最終確認後，為您計算並建議所需的精確數量。"
                : "You may source and ship your own materials or accessories to our factory warehouse for us to use. We will advise on quantities once designs are confirmed."}
            </p>
          </div>

          {/* Card 03 */}
          <div
            className="material-workflow-card"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid rgba(124, 114, 103, 0.15)",
              borderRadius: "16px",
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem",
              transition: "var(--transition-smooth)"
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-tech)",
                fontSize: "2rem",
                color: "var(--accent-muted)",
                fontWeight: "300"
              }}
            >
              03
            </span>
            <h3
              style={{
                fontFamily: "var(--font-tech)",
                fontSize: "1.4rem",
                fontWeight: "400",
                color: "var(--text-primary)"
              }}
            >
              {lang === "Cn" ? "發送您中意的樣品/照片" : "Send a reference"}
            </h3>
            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                fontWeight: "300",
                fontFamily: "var(--font-sans)"
              }}
            >
              {lang === "Cn"
                ? "只需將您心儀的參考圖片或實物樣照發送給我們，我們的團隊將盡全力在當地為您尋找最匹配的頂級材質。這可能並不總是可行，且可能涉及額外的尋源採購費用。"
                : "Send us reference images and our team will attempt to locate a suitable match locally. This may not always be possible and may be subject to an additional sourcing fee."}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: INTERACTIVE MATERIALS EXPLORER */}
      <div style={{ marginTop: "5rem", marginBottom: "8rem" }} id="explorer-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "3rem",
            borderBottom: "1px dashed rgba(124, 114, 103, 0.15)",
            paddingBottom: "1.5rem"
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                color: "#7C7267",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontFamily: "var(--font-sans)",
                display: "block",
                marginBottom: "0.4rem"
              }}
            >
              {lang === "Cn" ? "實時篩選" : "ONLINE BROWSER"}
            </span>
            <h3
              style={{
                fontFamily: "var(--font-tech)",
                fontSize: "1.8rem",
                color: "var(--accent-primary)",
                fontWeight: "400"
              }}
            >
              {lang === "Cn" ? "官方精選合約材質庫" : "Curated Contract Materials"}
            </h3>
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
            <input
              type="text"
              placeholder={lang === "Cn" ? "搜尋代碼、產地、材質..." : "Search code, origin, name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 1rem 0.6rem 2.5rem",
                borderRadius: "8px",
                border: "1px solid rgba(124, 114, 103, 0.25)",
                background: "var(--bg-secondary)",
                fontSize: "0.82rem",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent-primary)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(124, 114, 103, 0.25)")}
            />
            <svg
              style={{
                width: "15px",
                height: "14px",
                position: "absolute",
                left: "12px",
                top: "11px",
                color: "var(--text-muted)"
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories Tab Row */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "1.2rem",
            marginBottom: "2.5rem",
            scrollbarWidth: "thin"
          }}
          className="no-scrollbar"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "0.5rem 1.2rem",
                borderRadius: "100px",
                border:
                  activeCategory === cat.id ? "1px solid var(--accent-primary)" : "1px solid rgba(124, 114, 103, 0.15)",
                background: activeCategory === cat.id ? "var(--accent-primary)" : "transparent",
                color: activeCategory === cat.id ? "var(--bg-primary)" : "var(--text-secondary)",
                fontSize: "0.75rem",
                fontWeight: "500",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== cat.id) {
                  e.target.style.background = "rgba(66, 47, 37, 0.04)";
                  e.target.style.borderColor = "var(--text-muted)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat.id) {
                  e.target.style.background = "transparent";
                  e.target.style.borderColor = "rgba(124, 114, 103, 0.15)";
                }
              }}
            >
              {lang === "Cn" ? cat.cn : cat.en}
            </button>
          ))}
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.9rem"
            }}
          >
            {lang === "Cn" ? "未找到符合篩選條件的材質。" : "No materials found matching your filter."}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "30px"
            }}
          >
            {filteredMaterials.map((mat) => {
              const isSelected = selectedMaterials.some((item) => item.id === mat.id);
              return (
                <div
                  key={mat.id}
                  className={`material-gallery-card ${isSelected ? "selected" : ""}`}
                  style={{
                    background: "var(--bg-secondary)",
                    border: isSelected ? "1px solid var(--accent-primary)" : "1px solid rgba(124, 114, 103, 0.12)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: isSelected ? "0 10px 30px rgba(66, 47, 37, 0.05)" : "none",
                    transform: isSelected ? "translateY(-4px)" : "none"
                  }}
                >
                  {/* Texture Image Cover */}
                  <div style={{ height: "180px", overflow: "hidden", position: "relative" }}>
                    <img
                      src={mat.image}
                      alt={mat.nameEn}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                      }}
                      className="texture-zoom-img"
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        background: "rgba(26, 25, 24, 0.85)",
                        backdropFilter: "blur(4px)",
                        color: "white",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        fontFamily: "var(--font-sans)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        letterSpacing: "1px"
                      }}
                    >
                      {mat.code}
                    </div>

                    {/* Checkmark overlay */}
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          background: "var(--accent-primary)",
                          color: "var(--bg-primary)",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1.5px solid var(--bg-primary)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                        }}
                      >
                        <svg
                          style={{ width: "12px", height: "12px" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Body Specs */}
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1, gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          fontFamily: "var(--font-sans)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        📍 {lang === "Cn" ? mat.originCn : mat.originEn}
                      </span>
                      <h4
                        style={{
                          fontFamily: "var(--font-tech)",
                          fontSize: "1.25rem",
                          color: "var(--text-primary)",
                          fontWeight: "400",
                          lineHeight: "1.3"
                        }}
                      >
                        {lang === "Cn" ? mat.nameCn : mat.nameEn}
                      </h4>
                    </div>

                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                        fontWeight: "300",
                        fontFamily: "var(--font-sans)",
                        flex: 1
                      }}
                    >
                      {lang === "Cn" ? mat.specsCn : mat.specsEn}
                    </p>

                    <button
                      onClick={() => handleToggleMaterial(mat)}
                      style={{
                        width: "100%",
                        padding: "0.55rem",
                        borderRadius: "6px",
                        border: isSelected ? "1px solid var(--accent-primary)" : "1px solid rgba(124, 114, 103, 0.2)",
                        background: isSelected ? "transparent" : "var(--bg-primary)",
                        color: isSelected ? "var(--accent-primary)" : "var(--text-primary)",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.background = "var(--accent-primary)";
                          e.target.style.color = "var(--bg-primary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.background = "var(--bg-primary)";
                          e.target.style.color = "var(--text-primary)";
                        }
                      }}
                    >
                      {isSelected ? (
                        <>
                          <span>{lang === "Cn" ? "已選擇 / Selected" : "Selected"}</span>
                        </>
                      ) : (
                        <>
                          <svg
                            style={{ width: "13px", height: "13px" }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <span>{lang === "Cn" ? "加入詢價單" : "Add to enquiry"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FLOATING ENQUIRY BASKET DRAWER (Aesthetic frosted panel sliding from bottom) */}
      {selectedMaterials.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 48px)",
            maxWidth: "820px",
            background: "rgba(250, 247, 242, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1.5px solid var(--accent-primary)",
            borderRadius: "16px",
            padding: "1.2rem 1.8rem",
            boxShadow: "0 20px 50px rgba(26, 25, 24, 0.15)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            animation: "editorialSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div
              style={{
                background: "var(--accent-primary)",
                color: "var(--bg-primary)",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: "bold",
                fontFamily: "var(--font-sans)"
              }}
            >
              {selectedMaterials.length}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-tech)",
                  fontSize: "1.1rem",
                  color: "var(--text-primary)",
                  fontWeight: "500"
                }}
              >
                {lang === "Cn" ? "已預選項目材質" : "Selected Project Materials"}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  maxWidth: "450px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {selectedMaterials
                  .map((m) => `[${m.code}] ${lang === "Cn" ? m.nameCn.split(" (")[0] : m.nameEn.split(" (")[0]}`)
                  .join(", ")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={() => setSelectedMaterials([])}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.78rem",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                padding: "0.5rem",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => (e.target.style.color = "#8B5A51")}
              onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
            >
              {lang === "Cn" ? "清空預選" : "Clear All"}
            </button>

            <button
              onClick={handleProceed}
              style={{
                background: "var(--accent-primary)",
                color: "var(--bg-primary)",
                border: "none",
                padding: "0.65rem 1.4rem",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: "600",
                letterSpacing: "0.5px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(66, 47, 37, 0.15)",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#2B1E17";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "var(--accent-primary)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              <span>{lang === "Cn" ? "生成專屬詢價單并聯絡" : "Proceed with Selected Materials"}</span>
              <svg
                style={{ width: "14px", height: "14px" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialLibrary;
