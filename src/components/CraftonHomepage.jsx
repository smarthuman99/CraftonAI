import React, { useState } from "react";

const products = [
  { name: "Bower", price: "from £1,240", type: "Swivel lounge chair", category: "seating", image: "bower.jpg" },
  { name: "Viano", price: "from £420", type: "Dining chair", category: "seating", image: "viano.jpg" },
  { name: "Marne", price: "from £1,460", type: "Sideboard", category: "storage", image: "marne.jpg" },
  { name: "Raz", price: "from £340", type: "Barrel dining chair", category: "seating", image: "raz.jpg" },
  { name: "Crate", price: "from £980", type: "Dining table", category: "tables", image: "crate.jpg" },
  { name: "Tell", price: "from £360", type: "Carver armchair", category: "seating", image: "tell.jpg" },
  { name: "Fold", price: "from £480", type: "Accent chair", category: "seating", image: "fold.jpg" }
];

const faqItems = [
  {
    question: "What does landed DDP mean?",
    answer:
      "We deliver the furniture to your site with all freight, duty, customs and delivery handled and paid. The price you are quoted is the price you pay, at the door."
  },
  {
    question: "Can I order bespoke, or only the catalogue?",
    answer:
      "Both. Order a Stand piece as it is, or send a specification and we build to order through the same vetted network."
  },
  {
    question: "How do you control quality overseas?",
    answer:
      "Every order is inspected against its specification with AI-assisted checks (dimensions, finish, fire compliance) before it ships. Nothing leaves the factory unchecked."
  },
  {
    question: "Which markets do you deliver to?",
    answer: "UK, Europe, India, the USA, Australia and Thailand today, with more markets opening."
  },
  {
    question: "I run a factory. How do I join?",
    answer:
      "Apply through the partner section. Orders arrive complete and quality standards are agreed before production, so you build with certainty."
  }
];

const assetPath = (name) => `/thecrafton-assets/home-reference/${name}`;

function CraftonHomepage({ onStartOrder, onOpenCollection, onFactoryApply }) {
  const [mode, setMode] = useState("trade");
  const [filter, setFilter] = useState("all");
  const [openFaqs, setOpenFaqs] = useState([]);

  const isTrade = mode === "trade";
  const toggleFaq = (index) => {
    setOpenFaqs((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );
  };

  return (
    <div className="home-reference-page">
      <header id="home" className="home-reference-hero">
        <div className="home-reference-wrap home-reference-hero-grid">
          <div>
            <div className="home-reference-kicker">Contract furniture, made simple</div>
            <h1>Manufacturing made easy.</h1>
            <div className="home-reference-segment" aria-label="Audience">
              <button className={isTrade ? "is-active" : ""} type="button" onClick={() => setMode("trade")}>
                For the trade
              </button>
              <button className={!isTrade ? "is-active" : ""} type="button" onClick={() => setMode("factory")}>
                For factories
              </button>
            </div>
            <p className="home-reference-lead">
              {isTrade
                ? "Spec it, and we make it and land it at your door. One partner from factory to installed, landed and duty-paid, for design studios and trade buyers."
                : "Steady orders, clean specifications, fair terms. Join a vetted network that brings you qualified contract furniture work, with quality agreed up front."}
            </p>
            <div className="home-reference-cta">
              {isTrade ? (
                <>
                  <button className="home-reference-btn home-reference-btn-fill" type="button" onClick={onStartOrder}>
                    Start an order
                  </button>
                  <a className="home-reference-btn home-reference-btn-ghost" href="#collection">
                    See the collection
                  </a>
                </>
              ) : (
                <>
                  <a className="home-reference-btn home-reference-btn-fill" href="#factory-deep">
                    Become a partner
                  </a>
                  <a className="home-reference-btn home-reference-btn-ghost" href="#how">
                    How it works
                  </a>
                </>
              )}
            </div>
          </div>
          <div className="home-reference-hero-frame">
            <img src={assetPath("hero-bower.jpg")} alt="Bower swivel lounge chair" />
            <div className="home-reference-hero-chip">
              Bower swivel · <b>QC passed</b>
            </div>
          </div>
        </div>
      </header>

      <div className="home-reference-statbar">
        <div className="home-reference-wrap home-reference-stats">
          <div className="home-reference-stat">
            <div className="number">6 markets</div>
            <div className="label">UK, Europe, India, USA, Australia, Thailand</div>
          </div>
          <div className="home-reference-stat">
            <div className="number">Landed DDP</div>
            <div className="label">Freight, duty and delivery, all handled</div>
          </div>
          <div className="home-reference-stat">
            <div className="number">AI-inspected</div>
            <div className="label">Every piece checked before it ships</div>
          </div>
          <div className="home-reference-stat">
            <div className="number">Catalogue + bespoke</div>
            <div className="label">Order a Stand piece or build to spec</div>
          </div>
        </div>
      </div>

      <section id="about">
        <div className="home-reference-wrap">
          <div className="home-reference-section-head">
            <div className="home-reference-kicker">What we do</div>
            <h2>One partner, from the factory floor to your door.</h2>
            <p>
              The Crafton makes contract furniture through a vetted network of factories, then lands it fully finished
              and duty-paid, wherever the project is. Catalogue or bespoke, checked before it ships.
            </p>
          </div>
          <div className="home-reference-value-grid">
            {[
              [
                "01",
                "Landed to your door",
                "Freight, customs, duty and install, all handled. Most suppliers stop at the factory gate. We do not."
              ],
              [
                "02",
                "AI quality control",
                "Every piece is inspected against the spec with AI-driven checks before anything is shipped."
              ],
              [
                "03",
                "Vetted factory network",
                "One hub, many makers. Consistent quality and compliance across every partner factory."
              ],
              [
                "04",
                "Catalogue and bespoke",
                "Order a piece from The Stand collection, or send a spec and we build it to order."
              ]
            ].map(([number, title, copy]) => (
              <article className="home-reference-value-card" key={number}>
                <div className="number">{number}</div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="collection" className="home-reference-paper-section">
        <div className="home-reference-wrap">
          <div className="home-reference-section-head">
            <div className="home-reference-kicker">The Stand collection</div>
            <h2>Ready-made, made properly.</h2>
            <p>
              Contract-grade pieces you can order directly, made through the same network and landed the same way. A
              selection below.
            </p>
          </div>
          <div className="home-reference-filters" aria-label="Collection filters">
            {["all", "seating", "tables", "storage"].map((item) => (
              <button
                className={filter === item ? "is-active" : ""}
                type="button"
                onClick={() => setFilter(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="home-reference-product-grid">
            {products
              .filter((product) => filter === "all" || product.category === filter)
              .map((product) => (
                <article className="home-reference-product" key={product.name}>
                  <div className="photo">
                    <img src={assetPath(product.image)} alt={product.name} />
                  </div>
                  <div className="info">
                    <div className="row">
                      <span className="name">{product.name}</span>
                      <span className="price">{product.price}</span>
                    </div>
                    <div className="type">{product.type}</div>
                  </div>
                </article>
              ))}
          </div>
          <div className="home-reference-collection-more">
            <button className="home-reference-btn home-reference-btn-ghost" type="button" onClick={onOpenCollection}>
              Browse the full collection
            </button>
          </div>
        </div>
      </section>

      <section id="landed">
        <div className="home-reference-wrap">
          <div className="home-reference-section-head">
            <div className="home-reference-kicker">What landed DDP means</div>
            <h2>The price you see is the price at your door.</h2>
            <p>
              Most overseas suppliers quote at the factory gate and leave you to arrange the rest. Crafton owns the
              whole journey and quotes it as one landed, duty-paid price.
            </p>
          </div>
          <div className="home-reference-ddp">
            {[
              ["01", "Factory", "Made and finished by a vetted partner factory."],
              ["02", "Freight", "Sea or air freight, booked and tracked."],
              ["03", "Duty & customs", "Cleared and paid, no surprise bills."],
              ["04", "Delivery", "To the site, on the date you need."],
              ["05", "Install", "Placed and set up, ready for handover."]
            ].map(([number, title, copy], index) => (
              <div className={`home-reference-ddp-step ${index === 4 ? "is-crafton" : ""}`} key={number}>
                <div className="number">{number}</div>
                <h4>{title}</h4>
                <p>{copy}</p>
              </div>
            ))}
          </div>
          <div className="home-reference-ddp-note">
            <span>Most suppliers stop at step 01</span>
            <span>The Crafton takes it to step 05</span>
          </div>
        </div>
      </section>

      <section id="order" className="home-reference-compact-section">
        <div className="home-reference-wrap">
          <div className="home-reference-two">
            <div className="home-reference-side is-trade">
              <div className="tag">For designers & the trade</div>
              <h3>You design it. We make and land it.</h3>
              <ul>
                <li>Submit a spec or schedule, or pick from the catalogue.</li>
                <li>One price, landed and duty-paid to the door.</li>
                <li>Track every stage, from production to install, in your studio portal.</li>
                <li>No factories, freight forwarders or brokers to manage.</li>
              </ul>
              <button className="home-reference-btn home-reference-btn-fill" type="button" onClick={onStartOrder}>
                Start an order
              </button>
            </div>
            <div id="factories" className="home-reference-side is-factory">
              <div className="tag">For factories</div>
              <h3>Make with us. We bring the work.</h3>
              <ul>
                <li>Qualified contract furniture orders, ready to build.</li>
                <li>Clean, complete specifications every time.</li>
                <li>Quality and compliance agreed up front.</li>
                <li>Reliable terms and reliable payment.</li>
              </ul>
              <a className="home-reference-btn" href="#factory-deep">
                Apply to make
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="how">
        <div className="home-reference-wrap">
          <div className="home-reference-section-head">
            <div className="home-reference-kicker">How it works</div>
            <h2>Five steps, one partner.</h2>
          </div>
          <div className="home-reference-steps">
            {[
              ["01", "Submit", "Send a spec, a schedule, or choose from the catalogue."],
              ["02", "Price & match", "We price it and match it to the right factory."],
              ["03", "Make", "The factory builds it; we manage the run stage by stage."],
              ["04", "Inspect", "AI-driven quality and compliance checks before it ships."],
              ["05", "Land", "Freight, customs and delivery to the door, DDP."]
            ].map(([number, title, copy]) => (
              <div className="home-reference-step" key={number}>
                <div className="number">{number}</div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="factory-deep" className="home-reference-paper-section">
        <div className="home-reference-wrap">
          <div className="home-reference-two">
            <div className="home-reference-side is-factory">
              <div className="tag">Become a partner factory</div>
              <h3>Steady work. Clear specs. Fair terms.</h3>
              <ul>
                <li>Orders arrive complete: dimensions, materials, finishes, compliance.</li>
                <li>Quality standards agreed before production starts.</li>
                <li>One point of contact for the whole run.</li>
                <li>Consistent volume as we open new markets.</li>
              </ul>
              <button className="home-reference-btn" type="button" onClick={onFactoryApply}>
                Apply to make with us
              </button>
            </div>
            <div className="home-reference-side is-trade">
              <div className="tag">What we look for</div>
              <h3>Contract-grade makers, ready to scale.</h3>
              <ul>
                <li>Proven quality in seating, casegoods or upholstery.</li>
                <li>Capacity for repeat, project-sized runs.</li>
                <li>Willingness to work to agreed QC and compliance.</li>
                <li>Export experience is a plus, not a must.</li>
              </ul>
              <button className="home-reference-btn home-reference-btn-ghost" type="button" onClick={onFactoryApply}>
                See partnership terms
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="markets">
        <div className="home-reference-wrap">
          <div className="home-reference-section-head">
            <div className="home-reference-kicker">Markets</div>
            <h2>Landed, wherever the project is.</h2>
          </div>
          <div className="home-reference-market-grid">
            {[
              ["Home", "United Kingdom", "Our first operator market and design-led trade base."],
              ["Live", "Europe", "Design-led hospitality and contract projects."],
              ["Growth", "India", "One of the fastest hotel pipelines in the world."],
              ["Gateway", "USA · NY & Miami", "Two of the busiest hospitality and design markets."],
              ["High value", "Australia", "Premium hotel and resort development."],
              ["Make + sell", "Thailand", "Resort demand, close to the factory network."]
            ].map(([tag, title, copy]) => (
              <div className="home-reference-market" key={title}>
                <span className="tag">{tag}</span>
                <h4>{title}</h4>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="home-reference-paper-section">
        <div className="home-reference-wrap">
          <div className="home-reference-section-head">
            <div className="home-reference-kicker">FAQ</div>
            <h2>Good questions.</h2>
          </div>
          <div className="home-reference-faq">
            {faqItems.map((item, index) => {
              const open = openFaqs.includes(index);
              return (
                <div className={`home-reference-question ${open ? "is-open" : ""}`} key={item.question}>
                  <button type="button" onClick={() => toggleFaq(index)} aria-expanded={open}>
                    {item.question}
                    <i className={`fa-solid ${open ? "fa-minus" : "fa-plus"}`} aria-hidden="true" />
                  </button>
                  <div className="answer">
                    <p>{item.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-reference-compact-section">
        <div className="home-reference-wrap">
          <div className="home-reference-band">
            <div>
              <h3>Ready to order?</h3>
              <p>Tell us what the project needs. We will price it and land it.</p>
              <button className="home-reference-btn home-reference-btn-fill" type="button" onClick={onStartOrder}>
                Start an order
              </button>
            </div>
            <div>
              <h3>Ready to make?</h3>
              <p>Join the factory network and receive qualified, spec-complete orders.</p>
              <a className="home-reference-btn home-reference-btn-ghost" href="#factory-deep">
                Become a partner
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CraftonHomepage;
