import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { CATALOGUE_CATEGORIES, CATALOGUE_PRODUCTS, CATALOGUE_FEATURED } from "../data/projectFurniture.js";
import "./projectFurniture.css";

const SET_FURNITURE_CART_KEY = "crafton_set_furniture_project_cart";
export const SET_FURNITURE_CATEGORIES = CATALOGUE_CATEGORIES;
const allCategory = { slug: "all", nameEn: "All furniture", nameCn: "全部家具", products: CATALOGUE_PRODUCTS };
const getCategory = (slug) =>
  slug === "all" ? allCategory : CATALOGUE_CATEGORIES.find((category) => category.slug === slug);
const validQuantity = (value) => (Number.isFinite(Number(value)) ? Math.max(1, Math.floor(Number(value))) : 1);
const readStoredCart = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SET_FURNITURE_CART_KEY) || "[]");
    return Array.isArray(stored)
      ? stored
          .filter(
            (entry) => entry && getCategory(entry.categorySlug)?.products.some((item) => item.id === entry.productId)
          )
          .map((entry) => ({
            productId: entry.productId,
            categorySlug: entry.categorySlug,
            quantity: validQuantity(entry.quantity)
          }))
      : [];
  } catch {
    return [];
  }
};
const productName = (product, isChinese) => (isChinese ? product.nameCn || product.name : product.name);
const productMaterial = (product, isChinese) =>
  (isChinese ? product.materialCn || product.material : product.material) ||
  (isChinese ? "材质待确认" : "Material to confirm");
const productSize = (product, isChinese) => product.dimensions || (isChinese ? "尺寸待确认" : "Dimensions to confirm");

function ProductPhoto({ product, isChinese, image, ...props }) {
  const src = image || product.image;
  return src ? (
    <img src={src} alt={productName(product, isChinese)} {...props} />
  ) : (
    <div className="set-photo-pending">
      <span>{isChinese ? "图片待补充" : "Photo to follow"}</span>
      <small>{product.code}</small>
    </div>
  );
}

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
  const category = getCategory(categorySlug) || allCategory;
  const product = CATALOGUE_PRODUCTS.find((item) => item.id === productId);
  const productCategory = product ? getCategory(product.category) : category;
  const [search, setSearch] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [collectionOpen, setCollectionOpen] = useState(Boolean(productId));
  const [cart, setCart] = useState(readStoredCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [addedProductCode, setAddedProductCode] = useState("");
  const isChinese = lang === "Cn";

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
  const visibleProducts = category.products.filter((item) =>
    [item.name, item.nameCn, item.code, item.material, item.materialCn, item.dimensions]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(SET_FURNITURE_CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.warn("Set Furniture project cart could not be saved:", error);
    }
  }, [cart]);

  useEffect(() => {
    setDetailQuantity(1);
    setAddedProductCode("");
    setActiveImage(0);
    if (product) setCollectionOpen(true);
  }, [product]);

  const addToProject = (selectedProduct, selectedCategory, quantity) => {
    const safeQuantity = validQuantity(quantity);
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
    setCart((previous) =>
      previous.map((item) =>
        item.productId === entry.product.id && item.categorySlug === entry.category.slug
          ? { ...item, quantity: validQuantity(nextQuantity) }
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

  const openCollection = (slug = "all") => {
    setCollectionOpen(true);
    setSearch("");
    onSelectCategory(slug);
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
                  <span>{isChinese ? "SET FURNITURE 项目" : "SET FURNITURE PROJECT"}</span>
                  <h2 id="set-project-cart-title">{isChinese ? "项目清单" : "Project list"}</h2>
                </div>
                <button type="button" onClick={() => setCartOpen(false)} aria-label={isChinese ? "关闭" : "Close"}>
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              </header>
              {cartItems.length ? (
                <>
                  <div className="set-project-cart-items">
                    {cartItems.map((entry) => (
                      <article key={`${entry.category.slug}-${entry.product.id}`}>
                        <div className="set-cart-photo">
                          <ProductPhoto product={entry.product} isChinese={isChinese} />
                        </div>
                        <div className="set-project-cart-item-copy">
                          <span>{entry.product.code}</span>
                          <h3>{isChinese ? entry.product.nameCn : entry.product.name}</h3>
                          <p>{productSize(entry.product, isChinese)}</p>
                          <label>
                            <span>{isChinese ? "数量" : "Quantity"}</span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={entry.quantity}
                              onChange={(event) => updateCartQuantity(entry, event.target.value)}
                            />
                          </label>
                        </div>
                        <button type="button" className="set-project-cart-remove" onClick={() => removeCartItem(entry)}>
                          {isChinese ? "移除" : "Remove"}
                        </button>
                      </article>
                    ))}
                  </div>
                  <footer>
                    <div>
                      <span>{isChinese ? `共 ${cartCount} 件` : `${cartCount} pieces`}</span>
                      <strong>{isChinese ? "按项目报价" : "Quote on request"}</strong>
                    </div>
                    <button type="button" className="btn-premium" onClick={submitProjectCart}>
                      {isChinese ? "创建项目并询价" : "Create project & request quote"}
                    </button>
                    <small>
                      {isChinese
                        ? "最终价格会根据饰面、数量、合规与交付地址确认。"
                        : "Final pricing is confirmed against finishes, quantity, compliance and delivery address."}
                    </small>
                  </footer>
                </>
              ) : (
                <div className="set-project-cart-empty">
                  <span>
                    <i className="fa-solid fa-plus" aria-hidden="true" />
                  </span>
                  <h3>{isChinese ? "项目清单还是空的" : "Your project list is empty"}</h3>
                  <p>
                    {isChinese ? "打开产品详情，把喜欢的家具加入项目。" : "Open a product and add furniture you like."}
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
      <main
        className={`set-product-detail set-furniture-cho-page set-project-catalogue${isChinese ? " set-furniture-cn" : ""}`}
      >
        {projectCart}
        <div className="set-furniture-cho-wrap">
          <button type="button" className="set-furniture-back" onClick={onBackToCatalog}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            {isChinese ? "返回家具目录" : "Back to furniture"}
          </button>
          <div className="set-product-detail-grid">
            <div className="set-product-detail-gallery">
              <div className="set-product-detail-image">
                <ProductPhoto product={product} isChinese={isChinese} image={product.images[activeImage]} />
                <span>{product.code}</span>
              </div>
              {product.images.length > 1 && (
                <div className="set-product-gallery-thumbs" aria-label={isChinese ? "参考图片" : "Reference images"}>
                  {product.images.map((src, index) => (
                    <button
                      type="button"
                      key={src}
                      aria-label={isChinese ? `参考图 ${index + 1}` : `Reference ${index + 1}`}
                      aria-pressed={activeImage === index}
                      onClick={() => setActiveImage(index)}
                    >
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
              <div className="set-product-image-caption">
                <span>{isChinese ? "目录图像" : "CATALOGUE IMAGE"}</span>
                <p>
                  {isChinese
                    ? "饰面与软包颜色可按项目调整。"
                    : "Finish and upholstery colour can be tailored to the project."}
                </p>
              </div>
            </div>
            <section className="set-product-detail-copy" aria-labelledby="set-product-title">
              <span className="set-product-kicker">THE CRAFTON COLLECTION · {product.code}</span>
              <h1 id="set-product-title">{isChinese ? product.nameCn : product.name}</h1>
              <p className="set-product-lede">{isChinese ? productCategory.nameCn : productCategory.nameEn}</p>
              <div className="set-product-price">
                <span>{isChinese ? "项目报价" : "Project pricing"}</span>
                <strong>{isChinese ? "欢迎询价" : "Quote on request"}</strong>
              </div>
              <div className="set-product-spec-heading">
                <span>{isChinese ? "产品参数" : "PRODUCT SPECIFICATION"}</span>
                <span>{isChinese ? "参考规格" : "REFERENCE DETAILS"}</span>
              </div>
              <dl className="set-product-specs">
                {[
                  [isChinese ? "产品编号" : "Product code", product.code],
                  [isChinese ? "分类" : "Category", isChinese ? productCategory.nameCn : productCategory.nameEn],
                  [isChinese ? "材质" : "Material", productMaterial(product, isChinese)],
                  [isChinese ? "参考尺寸" : "Reference size", productSize(product, isChinese)],
                  [isChinese ? "饰面" : "Finish", isChinese ? product.finishCn || product.finish : product.finish],
                  [isChinese ? "颜色" : "Colour", isChinese ? product.colorCn || product.color : product.color]
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
              </dl>
              <div className="set-product-project-actions">
                <label>
                  <span>{isChinese ? "数量" : "Quantity"}</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={detailQuantity}
                    onChange={(event) => setDetailQuantity(validQuantity(event.target.value))}
                  />
                </label>
                <button
                  type="button"
                  className="set-product-add-button"
                  onClick={() => addToProject(product, productCategory, detailQuantity)}
                >
                  <i className="fa-solid fa-plus" aria-hidden="true" />
                  {addedProductCode === product.code
                    ? isChinese
                      ? "已加入 · 查看项目清单"
                      : "Added · View project list"
                    : isChinese
                      ? "加入项目"
                      : "Add to project"}
                </button>
              </div>
              <p className="set-product-note" aria-live="polite">
                {addedProductCode === product.code
                  ? isChinese
                    ? `${product.nameCn} 已加入项目清单。`
                    : `${product.name} has been added to the project list.`
                  : isChinese
                    ? "最终价格会根据饰面、数量、合规与交付地址确认。"
                    : "Final pricing is confirmed against finish, quantity, compliance and delivery address."}
              </p>
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (!collectionOpen) {
    const hero = CATALOGUE_FEATURED[0];
    return (
      <main className="set-furniture-reference set-project-catalogue">
        {projectCart}
        <header className="set-furniture-reference-header">
          {["tl", "tr", "bl", "br"].map((corner) => (
            <i
              key={corner}
              className={`fa-solid fa-plus set-furniture-reference-mark set-furniture-reference-mark-${corner}`}
              aria-hidden="true"
            />
          ))}
          <div className="set-furniture-reference-wrap">
            <div className="set-furniture-reference-kicker">Set Furniture — The Crafton Collection</div>
            <h1>Set Furniture</h1>
            <p>
              {isChinese
                ? "探索我们的家具系列，按类别查看实物参考图片、尺寸与材质。选择合适的款式加入项目清单，我们会按您的数量、饰面和交付要求提供报价。"
                : "Explore our furniture collection by category, with reference photographs, dimensions and materials. Select the pieces for your project and request a quote tailored to your quantities, finishes and delivery requirements."}
            </p>
            <div className="set-furniture-reference-rule">
              <span>{isChinese ? "家具系列" : "The Collection"}</span>
              <span>{isChinese ? "按分类浏览 · 按项目报价" : "Browse by category · Quote by project"}</span>
            </div>
          </div>
        </header>
        <div className="set-furniture-reference-wrap">
          <article className="set-furniture-reference-feature">
            <button
              type="button"
              className="set-furniture-reference-feature-action"
              onClick={() => openCollection()}
              aria-label={isChinese ? "浏览全部家具" : "Explore The Crafton Collection"}
            />
            <div className="set-furniture-reference-cover">
              <span className="set-furniture-reference-live">
                {CATALOGUE_PRODUCTS.length} {isChinese ? "款家具与配套" : "pieces"}
              </span>
              <ProductPhoto product={hero} isChinese={isChinese} />
            </div>
            <div className="set-furniture-reference-body">
              <div className="set-furniture-reference-collection-kicker">The Crafton</div>
              <h2>The Crafton Collection</h2>
              <p>
                {isChinese
                  ? "从沙发和餐椅，到餐桌、床具及储物家具。按类型查找参考款式，逐件查看规格，建立您的家具清单。"
                  : "From sofas and dining chairs to tables, beds and storage. Find the right forms by furniture type, explore their specifications and build your project list."}
              </p>
              <div className="set-furniture-reference-thumbs" aria-hidden="true">
                {CATALOGUE_FEATURED.slice(1, 4).map((item) => (
                  <img key={item.id} src={item.image} alt="" />
                ))}
              </div>
              <span className="set-furniture-reference-go">
                {isChinese ? "浏览全部家具" : "Explore the collection"}{" "}
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </span>
              <div className="set-furniture-reference-meta">
                {isChinese
                  ? "沙发 · 椅凳 · 桌类 · 床类 · 柜类 · 配套"
                  : "Sofas · Seating · Tables · Beds · Storage · Furnishings"}
              </div>
            </div>
          </article>
          <div className="set-furniture-reference-upcoming">
            {isChinese ? "按家具类别浏览" : "Browse by furniture type"}
          </div>
          <section
            className="set-furniture-reference-grid"
            aria-label={isChinese ? "家具分类" : "Furniture categories"}
          >
            {CATALOGUE_CATEGORIES.map((item) => (
              <article className="set-furniture-reference-card" key={item.slug}>
                <button type="button" className="set-category-link" onClick={() => openCollection(item.slug)}>
                  <div className="set-furniture-reference-card-image">
                    <span>
                      {item.products.length} {isChinese ? "款" : "pieces"}
                    </span>
                    <img src={item.image} alt={isChinese ? item.nameCn : item.nameEn} loading="lazy" />
                  </div>
                  <h3>{isChinese ? item.nameCn : item.nameEn}</h3>
                  <p>{isChinese ? item.summaryCn : item.summaryEn}</p>
                </button>
              </article>
            ))}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`set-furniture-catalogue set-furniture-cho-page set-project-catalogue${isChinese ? " set-furniture-cn" : ""}`}
    >
      {projectCart}
      <div className="set-furniture-cho-wrap">
        <button type="button" className="set-furniture-back" onClick={() => setCollectionOpen(false)}>
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          {isChinese ? "返回家具系列" : "Back to the collection"}
        </button>
        <header className="set-furniture-catalogue-header">
          <div>
            <span>THE CRAFTON COLLECTION</span>
            <h1>{isChinese ? category.nameCn : category.nameEn}</h1>
          </div>
          <p>
            {isChinese
              ? "按类别浏览家具，查看照片、尺寸及材质，然后加入项目清单询价。标注待确认的规格将在报价时与您核实。"
              : "Browse furniture by type, explore photographs, dimensions and materials, then add your selections to a project. Details marked to confirm will be checked with you when quoting."}
          </p>
        </header>
        <div className="set-catalogue-tools">
          <div
            className="set-catalogue-filters"
            role="group"
            aria-label={isChinese ? "家具分类" : "Furniture categories"}
          >
            {[allCategory, ...CATALOGUE_CATEGORIES].map((entry) => (
              <button
                type="button"
                key={entry.slug}
                aria-pressed={category.slug === entry.slug}
                onClick={() => openCollection(entry.slug)}
              >
                {isChinese ? entry.nameCn : entry.nameEn} <span>{entry.products.length}</span>
              </button>
            ))}
          </div>
          <label className="set-catalogue-search">
            <span>{isChinese ? "搜索家具" : "Search furniture"}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isChinese ? "名称、编号、尺寸或材质" : "Name, code, dimensions or material"}
            />
          </label>
        </div>
        <div className="set-furniture-collection-rule">
          <span role="status">
            {visibleProducts.length} {isChinese ? "款产品" : "PIECES"}
          </span>
          <span>{isChinese ? "按项目报价" : "QUOTE ON REQUEST"}</span>
        </div>
        <section className="set-furniture-product-grid" aria-label={isChinese ? "家具产品" : "Furniture products"}>
          {visibleProducts.map((item, index) => (
            <article className="set-furniture-product-card" key={item.id}>
              <button type="button" className="set-furniture-product-link" onClick={() => onSelectProduct(item.id)}>
                <div className="set-furniture-product-image">
                  <ProductPhoto product={item} isChinese={isChinese} loading="lazy" />
                  <span>{item.code}</span>
                </div>
                <div className="set-furniture-product-copy">
                  <div className="set-furniture-product-index">{String(index + 1).padStart(2, "0")}</div>
                  <h2>{productName(item, isChinese)}</h2>
                  <p>{productMaterial(item, isChinese)}</p>
                  <strong className="set-product-card-size">{productSize(item, isChinese)}</strong>
                  <span>
                    {isChinese ? "查看产品详情" : "View product details"}
                    <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </span>
                </div>
              </button>
              <button
                type="button"
                className="set-furniture-card-add"
                onClick={() => addToProject(item, getCategory(item.category), 1)}
              >
                <i className="fa-solid fa-plus" aria-hidden="true" />
                {isChinese ? "加入项目" : "Add to project"}
              </button>
            </article>
          ))}
        </section>
        {!visibleProducts.length && (
          <div className="set-catalogue-empty">
            <p>
              {isChinese
                ? "没有找到符合条件的家具，请尝试其他关键词或分类。"
                : "No furniture matches your search. Try another keyword or category."}
            </p>
            <button type="button" className="btn-secondary" onClick={() => openCollection()}>
              {isChinese ? "查看全部家具" : "View all furniture"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
