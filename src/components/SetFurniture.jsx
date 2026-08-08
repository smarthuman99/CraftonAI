import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const SET_FURNITURE_CART_KEY = "crafton_set_furniture_project_cart";
const SET_FURNITURE_CURRENCY = "USD";

const SET_FURNITURE_PRICES = {
  "SF-101": 2480,
  "SF-102": 2860,
  "SF-103": 3250,
  "AC-201": 980,
  "AC-202": 1120,
  "AC-203": 1060,
  "ST-301": 690,
  "ST-302": 620,
  "ST-303": 580,
  "DC-401": 520,
  "DC-402": 460,
  "DC-403": 390,
  "DT-501": 2360,
  "DT-502": 2980,
  "DT-503": 2680,
  "MU-601": 1840,
  "MU-602": 1760,
  "MU-603": 3950
};

const formatPrice = (value, currency = SET_FURNITURE_CURRENCY) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value || 0);

const parseMinimumQuantity = (minimum) => Math.max(1, Number(String(minimum || "").match(/\d+/)?.[0] || 1));

const readStoredCart = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SET_FURNITURE_CART_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.warn("Set Furniture project cart could not be restored:", error);
    return [];
  }
};

export const SET_FURNITURE_CATEGORIES = [
  {
    slug: "sofa",
    nameEn: "Sofas",
    nameCn: "沙发",
    image: "/set-furniture/sofa.jpg",
    summaryEn: "Contract-grade seating shaped for lobbies, suites and private residences.",
    summaryCn: "适用于酒店大堂、套房与高端住宅的工程级沙发。",
    products: [
      {
        id: "arden-modular",
        code: "SF-101",
        name: "Arden Modular Sofa",
        nameCn: "Arden 模块沙发",
        material: "Performance boucle / kiln-dried hardwood",
        dimensions: "W 2800 x D 980 x H 730 mm",
        lead: "8-10 weeks",
        minimum: "2 pcs",
        compliance: "UK BS 5852 Source 5 available",
        description:
          "A low modular system with deep seats, replaceable covers and concealed connectors for hospitality lounges."
      },
      {
        id: "como-curve",
        code: "SF-102",
        name: "Como Curved Sofa",
        nameCn: "Como 弧形沙发",
        material: "Mohair blend / layered foam",
        dimensions: "W 2600 x D 1050 x H 760 mm",
        lead: "9-11 weeks",
        minimum: "2 pcs",
        compliance: "EU EN 1021-1/2 available",
        description: "A softly curved statement sofa designed for reception areas and conversational seating plans."
      },
      {
        id: "mercer-three-seat",
        code: "SF-103",
        name: "Mercer Three-Seat Sofa",
        nameCn: "Mercer 三人沙发",
        material: "Full-grain leather / walnut plinth",
        dimensions: "W 2240 x D 920 x H 790 mm",
        lead: "8-10 weeks",
        minimum: "3 pcs",
        compliance: "US 16 CFR Part 1640 available",
        description: "A tailored three-seater with a solid walnut base and removable contract-grade seat cushions."
      }
    ]
  },
  {
    slug: "armchair",
    nameEn: "Armchairs",
    nameCn: "扶手椅",
    image: "/set-furniture/armchair.jpg",
    summaryEn: "Sculptural lounge chairs balanced for comfort, durability and specification.",
    summaryCn: "兼顾造型、舒适度与工程耐用性的休闲扶手椅。",
    products: [
      {
        id: "vale-lounge",
        code: "AC-201",
        name: "Vale Lounge Armchair",
        nameCn: "Vale 休闲扶手椅",
        material: "Belgian linen / solid ash",
        dimensions: "W 760 x D 790 x H 780 mm",
        lead: "7-9 weeks",
        minimum: "4 pcs",
        compliance: "UK BS 5852 Source 5 available",
        description: "A compact lounge chair with an embracing back and replaceable upholstery panels."
      },
      {
        id: "regent-wing",
        code: "AC-202",
        name: "Regent Wing Armchair",
        nameCn: "Regent 高背扶手椅",
        material: "Wool velvet / beech frame",
        dimensions: "W 820 x D 880 x H 1040 mm",
        lead: "8-10 weeks",
        minimum: "4 pcs",
        compliance: "EU EN 1021-1/2 available",
        description: "A contemporary wing chair for hotel suites, libraries and quiet lounge corners."
      },
      {
        id: "alba-tub",
        code: "AC-203",
        name: "Alba Tub Chair",
        nameCn: "Alba 环抱椅",
        material: "Leather or boucle / swivel base",
        dimensions: "W 720 x D 740 x H 760 mm",
        lead: "7-9 weeks",
        minimum: "6 pcs",
        compliance: "Multiple regional tests available",
        description: "A space-efficient tub chair with an optional return swivel for guest rooms and club lounges."
      }
    ]
  },
  {
    slug: "side-table",
    nameEn: "Side Tables",
    nameCn: "边几",
    image: "/set-furniture/side-table.jpg",
    summaryEn: "Compact stone, timber and metal tables for layered contract interiors.",
    summaryCn: "以石材、木材与金属打造的精致工程边几。",
    products: [
      {
        id: "lume-travertine",
        code: "ST-301",
        name: "Lume Travertine Side Table",
        nameCn: "Lume 洞石边几",
        material: "Honed travertine / sealed finish",
        dimensions: "Dia 480 x H 520 mm",
        lead: "6-8 weeks",
        minimum: "4 pcs",
        compliance: "Commercial stone sealer",
        description: "A monolithic round side table cut from vein-matched travertine and sealed for hospitality use."
      },
      {
        id: "orbit-brass",
        code: "ST-302",
        name: "Orbit Brass Side Table",
        nameCn: "Orbit 黄铜边几",
        material: "Brushed brass / smoked glass",
        dimensions: "Dia 520 x H 480 mm",
        lead: "6-8 weeks",
        minimum: "4 pcs",
        compliance: "Anti-fingerprint coating",
        description: "A light circular table with a hand-brushed metal frame and inset smoked-glass top."
      },
      {
        id: "noce-walnut",
        code: "ST-303",
        name: "Noce Walnut Side Table",
        nameCn: "Noce 胡桃木边几",
        material: "American walnut / bronze detail",
        dimensions: "W 520 x D 420 x H 510 mm",
        lead: "6-8 weeks",
        minimum: "6 pcs",
        compliance: "FSC timber option",
        description: "A compact drawer table with book-matched walnut veneer and a discreet bronze pull."
      }
    ]
  },
  {
    slug: "dining-chair",
    nameEn: "Dining Chairs",
    nameCn: "餐椅",
    image: "/set-furniture/dining-chair.jpg",
    summaryEn: "Ergonomic dining chairs engineered for restaurants, suites and residences.",
    summaryCn: "为餐厅、套房与住宅打造的人体工学餐椅。",
    products: [
      {
        id: "siena-leather",
        code: "DC-401",
        name: "Siena Leather Dining Chair",
        nameCn: "Siena 皮革餐椅",
        material: "Saddle leather / solid oak",
        dimensions: "W 520 x D 570 x H 820 mm",
        lead: "7-9 weeks",
        minimum: "12 pcs",
        compliance: "UK BS 5852 options available",
        description: "A tailored dining chair with a supportive curved back and reinforced mortise-and-tenon frame."
      },
      {
        id: "elba-upholstered",
        code: "DC-402",
        name: "Elba Upholstered Dining Chair",
        nameCn: "Elba 软包餐椅",
        material: "Performance velvet / beech",
        dimensions: "W 540 x D 590 x H 840 mm",
        lead: "7-9 weeks",
        minimum: "12 pcs",
        compliance: "EU EN 1021-1/2 available",
        description: "A fully upholstered dining chair tuned for long seating periods in restaurants and meeting rooms."
      },
      {
        id: "frame-oak",
        code: "DC-403",
        name: "Frame Oak Dining Chair",
        nameCn: "Frame 白橡木餐椅",
        material: "European oak / leather pad",
        dimensions: "W 500 x D 550 x H 800 mm",
        lead: "6-8 weeks",
        minimum: "16 pcs",
        compliance: "FSC timber option",
        description: "A crisp timber chair with a replaceable leather seat pad and stackable project variant."
      }
    ]
  },
  {
    slug: "dining-table",
    nameEn: "Dining Tables",
    nameCn: "餐桌",
    image: "/set-furniture/dining-table.jpg",
    summaryEn: "Statement tables available in bespoke lengths, finishes and power-ready formats.",
    summaryCn: "支持定制尺寸、饰面与电源系统的工程餐桌。",
    products: [
      {
        id: "atlas-walnut",
        code: "DT-501",
        name: "Atlas Walnut Dining Table",
        nameCn: "Atlas 胡桃木餐桌",
        material: "American walnut / solid edge",
        dimensions: "W 2600 x D 1050 x H 750 mm",
        lead: "8-10 weeks",
        minimum: "2 pcs",
        compliance: "FSC timber option",
        description: "A generous solid-edge table with concealed steel reinforcement for boardrooms and private dining."
      },
      {
        id: "vela-travertine",
        code: "DT-502",
        name: "Vela Travertine Dining Table",
        nameCn: "Vela 洞石餐桌",
        material: "Travertine / bronze base",
        dimensions: "W 2400 x D 1100 x H 750 mm",
        lead: "9-11 weeks",
        minimum: "2 pcs",
        compliance: "Commercial stone sealer",
        description: "A vein-matched stone top balanced on two sculptural bronze-finished pedestals."
      },
      {
        id: "mesa-extendable",
        code: "DT-503",
        name: "Mesa Extendable Dining Table",
        nameCn: "Mesa 延伸餐桌",
        material: "Oak veneer / steel mechanism",
        dimensions: "W 2200-3000 x D 1000 x H 750 mm",
        lead: "9-11 weeks",
        minimum: "2 pcs",
        compliance: "Contract mechanism tested",
        description: "An extendable table with a synchronized leaf mechanism for suites and flexible private rooms."
      }
    ]
  },
  {
    slug: "media-unit",
    nameEn: "Media Units",
    nameCn: "影音柜",
    image: "/set-furniture/media-unit.jpg",
    summaryEn: "Integrated media storage with cable management, ventilation and custom finishes.",
    summaryCn: "整合走线、散热与定制饰面的影音收纳系统。",
    products: [
      {
        id: "linea-low",
        code: "MU-601",
        name: "Linea Low Media Unit",
        nameCn: "Linea 低位影音柜",
        material: "Walnut veneer / bronze plinth",
        dimensions: "W 2400 x D 480 x H 520 mm",
        lead: "8-10 weeks",
        minimum: "2 pcs",
        compliance: "Ventilated equipment bays",
        description: "A low-profile cabinet with slatted ventilation, IR-friendly doors and removable cable panels."
      },
      {
        id: "gallery-console",
        code: "MU-602",
        name: "Gallery Media Console",
        nameCn: "Gallery 影音边柜",
        material: "High-gloss lacquer / brass",
        dimensions: "W 2100 x D 500 x H 620 mm",
        lead: "8-10 weeks",
        minimum: "2 pcs",
        compliance: "Low-VOC finish option",
        description: "A refined console with concealed equipment storage and hand-finished metal reveals."
      },
      {
        id: "frame-wall",
        code: "MU-603",
        name: "Frame Wall Media System",
        nameCn: "Frame 墙面影音系统",
        material: "Oak veneer / powder-coated steel",
        dimensions: "Made to measure",
        lead: "10-12 weeks",
        minimum: "1 set",
        compliance: "Site-specific fixing review",
        description:
          "A made-to-measure wall system combining display shelving, closed storage and integrated media zones."
      }
    ]
  }
].map((category) => ({
  ...category,
  products: category.products.map((product) => ({
    ...product,
    minimum: "10 pcs",
    price: SET_FURNITURE_PRICES[product.code],
    currency: SET_FURNITURE_CURRENCY,
    finish: "Made to project finish schedule",
    warranty: "3-year commercial warranty",
    customisation: "Dimensions, upholstery, finish and regional fire compliance"
  }))
}));

const getCategory = (slug) => SET_FURNITURE_CATEGORIES.find((category) => category.slug === slug);

export function SetFurnitureShowcase({ lang, onSelectCategory }) {
  return (
    <section className="set-furniture-home" aria-labelledby="set-furniture-home-title">
      <div className="set-furniture-home-heading">
        <span>{lang === "Cn" ? "标准家具系列" : "SET FURNITURE"}</span>
        <h2 id="set-furniture-home-title">
          {lang === "Cn" ? "为项目快速选定成熟家具方案。" : "Proven furniture forms, ready to specify."}
        </h2>
        <p>
          {lang === "Cn"
            ? "从成熟款式开始，再按项目调整尺寸、材质、颜色与消防标准。"
            : "Start with an established form, then tailor dimensions, materials, colour and regional compliance."}
        </p>
      </div>
      <div className="set-furniture-category-grid">
        {SET_FURNITURE_CATEGORIES.map((category, index) => (
          <button
            type="button"
            className="set-furniture-category-card"
            onClick={() => onSelectCategory(category.slug)}
            key={category.slug}
          >
            <div className="set-furniture-category-image">
              <img src={category.image} alt={lang === "Cn" ? category.nameCn : category.nameEn} loading="lazy" />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="set-furniture-category-copy">
              <div>
                <h3>{lang === "Cn" ? category.nameCn : category.nameEn}</h3>
                <p>{lang === "Cn" ? category.summaryCn : category.summaryEn}</p>
              </div>
              <span className="set-furniture-arrow" aria-hidden="true">
                →
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function SetFurnitureCatalog({
  lang,
  categorySlug,
  productId,
  onSelectCategory,
  onSelectProduct,
  onBackToCatalog,
  onRequestQuote
}) {
  const category = getCategory(categorySlug) || SET_FURNITURE_CATEGORIES[0];
  const product = category.products.find((item) => item.id === productId);
  const [cart, setCart] = useState(readStoredCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailQuantity, setDetailQuantity] = useState(product ? parseMinimumQuantity(product.minimum) : 10);
  const [addedProductCode, setAddedProductCode] = useState("");

  const cartItems = useMemo(
    () =>
      cart
        .map((entry) => {
          const entryCategory = getCategory(entry.categorySlug);
          const entryProduct = entryCategory?.products.find((item) => item.id === entry.productId);
          return entryCategory && entryProduct
            ? { ...entry, category: entryCategory, product: entryProduct, quantity: Number(entry.quantity || 0) }
            : null;
        })
        .filter(Boolean),
    [cart]
  );
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.quantity * item.product.price, 0);

  useEffect(() => {
    try {
      window.localStorage.setItem(SET_FURNITURE_CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.warn("Set Furniture project cart could not be saved:", error);
    }
  }, [cart]);

  useEffect(() => {
    setDetailQuantity(product ? parseMinimumQuantity(product.minimum) : 10);
    setAddedProductCode("");
  }, [product]);

  const addToProject = (selectedProduct, selectedCategory, quantity) => {
    const safeQuantity = Math.max(parseMinimumQuantity(selectedProduct.minimum), Number(quantity || 0));
    setCart((previous) => {
      const matchingIndex = previous.findIndex(
        (entry) => entry.productId === selectedProduct.id && entry.categorySlug === selectedCategory.slug
      );
      if (matchingIndex === -1) {
        return [
          ...previous,
          { productId: selectedProduct.id, categorySlug: selectedCategory.slug, quantity: safeQuantity }
        ];
      }
      return previous.map((entry, index) =>
        index === matchingIndex ? { ...entry, quantity: entry.quantity + safeQuantity } : entry
      );
    });
    setAddedProductCode(selectedProduct.code);
    setCartOpen(true);
  };

  const updateCartQuantity = (entry, nextQuantity) => {
    const minimum = parseMinimumQuantity(entry.product.minimum);
    setCart((previous) =>
      previous.map((item) =>
        item.productId === entry.product.id && item.categorySlug === entry.category.slug
          ? { ...item, quantity: Math.max(minimum, Number(nextQuantity || minimum)) }
          : item
      )
    );
  };

  const removeCartItem = (entry) => {
    setCart((previous) =>
      previous.filter((item) => !(item.productId === entry.product.id && item.categorySlug === entry.category.slug))
    );
  };

  const submitProjectCart = () => {
    if (!cartItems.length) return;
    onRequestQuote(
      cartItems.map((item) => ({ product: item.product, category: item.category, quantity: item.quantity }))
    );
    setCartOpen(false);
  };

  const projectCart = (
    <>
      <button
        type="button"
        className="set-project-cart-trigger"
        onClick={() => setCartOpen(true)}
        aria-label={
          lang === "Cn"
            ? `打开项目清单，共 ${cartItems.length} 款产品`
            : `Open project list with ${cartItems.length} products`
        }
      >
        <span>{lang === "Cn" ? "项目清单" : "Project list"}</span>
        <strong>{cartItems.length}</strong>
      </button>
      {cartOpen &&
        createPortal(
          <div className="set-project-cart-overlay" role="presentation" onMouseDown={() => setCartOpen(false)}>
            <aside
              className="set-project-cart"
              role="dialog"
              aria-modal="true"
              aria-labelledby="set-project-cart-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <span>{lang === "Cn" ? "SET FURNITURE 项目" : "SET FURNITURE PROJECT"}</span>
                  <h2 id="set-project-cart-title">{lang === "Cn" ? "项目清单" : "Project list"}</h2>
                </div>
                <button type="button" onClick={() => setCartOpen(false)} aria-label={lang === "Cn" ? "关闭" : "Close"}>
                  ×
                </button>
              </header>
              {cartItems.length ? (
                <>
                  <div className="set-project-cart-items">
                    {cartItems.map((entry) => (
                      <article key={`${entry.category.slug}-${entry.product.id}`}>
                        <img src={entry.category.image} alt="" />
                        <div className="set-project-cart-item-copy">
                          <span>{entry.product.code}</span>
                          <h3>{lang === "Cn" ? entry.product.nameCn : entry.product.name}</h3>
                          <p>
                            {formatPrice(entry.product.price, entry.product.currency)} / {lang === "Cn" ? "件" : "unit"}
                          </p>
                          <label>
                            <span>{lang === "Cn" ? "数量" : "Quantity"}</span>
                            <input
                              type="number"
                              min={parseMinimumQuantity(entry.product.minimum)}
                              step="1"
                              value={entry.quantity}
                              onChange={(event) => updateCartQuantity(entry, event.target.value)}
                            />
                          </label>
                        </div>
                        <button type="button" className="set-project-cart-remove" onClick={() => removeCartItem(entry)}>
                          {lang === "Cn" ? "移除" : "Remove"}
                        </button>
                      </article>
                    ))}
                  </div>
                  <footer>
                    <div>
                      <span>
                        {lang === "Cn" ? `共 ${cartCount} 件 · 参考合计` : `${cartCount} pieces · Estimated total`}
                      </span>
                      <strong>{formatPrice(cartTotal)}</strong>
                    </div>
                    <button type="button" className="btn-premium" onClick={submitProjectCart}>
                      {lang === "Cn" ? "创建项目并下单" : "Create project & order"}
                    </button>
                    <small>
                      {lang === "Cn"
                        ? "最终价格会根据饰面、数量、合规与交付地址确认。"
                        : "Final pricing is confirmed against finishes, quantity, compliance and delivery address."}
                    </small>
                  </footer>
                </>
              ) : (
                <div className="set-project-cart-empty">
                  <span>＋</span>
                  <h3>{lang === "Cn" ? "项目清单还是空的" : "Your project list is empty"}</h3>
                  <p>
                    {lang === "Cn"
                      ? "打开产品详情，把喜欢的家具加入项目。"
                      : "Open a product and add furniture you like."}
                  </p>
                </div>
              )}
            </aside>
          </div>,
          document.body
        )}
    </>
  );

  if (product) {
    return (
      <main className="set-product-detail">
        {projectCart}
        <button type="button" className="set-furniture-back" onClick={onBackToCatalog}>
          ← {lang === "Cn" ? "返回产品目录" : "Back to catalogue"}
        </button>
        <div className="set-product-detail-grid">
          <div className="set-product-detail-image">
            <img src={category.image} alt={lang === "Cn" ? product.nameCn : product.name} />
            <span>{product.code}</span>
          </div>
          <div className="set-product-detail-copy">
            <span className="set-product-kicker">{lang === "Cn" ? category.nameCn : category.nameEn}</span>
            <h1>{lang === "Cn" ? product.nameCn : product.name}</h1>
            <p className="set-product-lede">{product.description}</p>
            <div className="set-product-price">
              <span>{lang === "Cn" ? "项目参考单价" : "Project guide price"}</span>
              <strong>{formatPrice(product.price, product.currency)}</strong>
              <small>{lang === "Cn" ? "/ 件 · 未含税" : "/ unit · excl. tax"}</small>
            </div>
            <dl className="set-product-specs">
              <div>
                <dt>{lang === "Cn" ? "产品编号" : "Product code"}</dt>
                <dd>{product.code}</dd>
              </div>
              <div>
                <dt>{lang === "Cn" ? "材质" : "Material"}</dt>
                <dd>{product.material}</dd>
              </div>
              <div>
                <dt>{lang === "Cn" ? "参考尺寸" : "Reference size"}</dt>
                <dd>{product.dimensions}</dd>
              </div>
              <div>
                <dt>{lang === "Cn" ? "生产周期" : "Lead time"}</dt>
                <dd>{product.lead}</dd>
              </div>
              <div>
                <dt>{lang === "Cn" ? "起订量" : "Minimum order"}</dt>
                <dd>{product.minimum}</dd>
              </div>
              <div>
                <dt>{lang === "Cn" ? "合规选项" : "Compliance"}</dt>
                <dd>{product.compliance}</dd>
              </div>
              <div>
                <dt>{lang === "Cn" ? "饰面" : "Finish"}</dt>
                <dd>{product.finish}</dd>
              </div>
              <div>
                <dt>{lang === "Cn" ? "可定制项" : "Customisation"}</dt>
                <dd>{product.customisation}</dd>
              </div>
              <div>
                <dt>{lang === "Cn" ? "商用质保" : "Warranty"}</dt>
                <dd>{product.warranty}</dd>
              </div>
            </dl>
            <div className="set-product-project-actions">
              <label>
                <span>{lang === "Cn" ? "数量" : "Quantity"}</span>
                <input
                  type="number"
                  min={parseMinimumQuantity(product.minimum)}
                  step="1"
                  value={detailQuantity}
                  onChange={(event) => setDetailQuantity(Math.max(1, Number(event.target.value || 1)))}
                />
              </label>
              <button
                type="button"
                className="btn-premium set-product-quote"
                onClick={() => addToProject(product, category, detailQuantity)}
              >
                {addedProductCode === product.code
                  ? lang === "Cn"
                    ? "已加入 · 查看项目清单"
                    : "Added · View project list"
                  : lang === "Cn"
                    ? "加入项目"
                    : "Add to project"}
              </button>
            </div>
            <p className="set-product-note">
              {lang === "Cn"
                ? "图片为目录演示参考，最终材质、颜色与尺寸以项目确认文件为准。"
                : "Catalogue imagery is for reference. Final dimensions, materials and finishes are confirmed per project."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="set-furniture-catalogue">
        {projectCart}
        <header className="set-furniture-catalogue-header">
          <span>{lang === "Cn" ? "THE CRAFTON 标准家具" : "THE CRAFTON SET FURNITURE"}</span>
          <h1>
            {lang === "Cn" ? "选择成熟款式，建立你的家具项目。" : "Choose proven pieces. Build your furniture project."}
          </h1>
          <p>
            {lang === "Cn"
              ? "查看透明参考价格与完整产品参数，把喜欢的家具加入项目清单，再统一提交订单。"
              : "Review guide pricing and complete specifications, add favourites to a project list, then submit one considered order."}
          </p>
        </header>
        <nav className="set-furniture-filters" aria-label="Furniture categories">
          {SET_FURNITURE_CATEGORIES.map((item) => (
            <button
              type="button"
              className={item.slug === category.slug ? "active" : ""}
              onClick={() => onSelectCategory(item.slug)}
              key={item.slug}
            >
              {lang === "Cn" ? item.nameCn : item.nameEn}
            </button>
          ))}
        </nav>
        <section className="set-furniture-product-grid" aria-label={category.nameEn}>
          {category.products.map((item, index) => (
            <article className="set-furniture-product-card" key={item.id}>
              <button type="button" className="set-furniture-product-link" onClick={() => onSelectProduct(item.id)}>
                <div className={`set-furniture-product-image product-tone-${index + 1}`}>
                  <img src={category.image} alt={lang === "Cn" ? item.nameCn : item.name} />
                  <span>{item.code}</span>
                </div>
                <div className="set-furniture-product-copy">
                  <h2>{lang === "Cn" ? item.nameCn : item.name}</h2>
                  <p>{item.material}</p>
                  <strong>{formatPrice(item.price, item.currency)}</strong>
                  <span>{lang === "Cn" ? "查看产品详情" : "View product details"} →</span>
                </div>
              </button>
              <button
                type="button"
                className="set-furniture-card-add"
                onClick={() => addToProject(item, category, parseMinimumQuantity(item.minimum))}
              >
                ＋ {lang === "Cn" ? "加入项目" : "Add to project"}
              </button>
            </article>
          ))}
        </section>
      </main>
    );
  }
}
