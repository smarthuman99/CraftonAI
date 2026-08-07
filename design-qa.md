# Homepage — Design QA

## Scope and visual truth

- Source: `E:\下载\TheCrafton_Website_Mockups\thecrafton_site.html`
- Implementation: the existing Crafton React homepage at `http://127.0.0.1:4180/`.
- Product constraint: the supplied homepage body design, copy, photography, and responsive behavior are reproduced while the website's original Header, Footer, authentication, client portal, set-furniture catalogue, contact flow, and Supabase logic remain in place.

## Comparison evidence

| Surface | State | Evidence |
| --- | --- | --- |
| Source | Desktop first viewport, 1600 × 1111 CSS viewport | `scratch/design-qa/home-reference-desktop-matched.png` |
| Implementation | Desktop first viewport, 1600 × 1111 CSS viewport | `scratch/design-qa/home-implementation-desktop.png` |
| Combined desktop comparison | Source left, implementation right; browser-density normalized | `scratch/design-qa/home-desktop-comparison.png` |
| Source | Mobile first viewport, 417 × 902 CSS viewport | `scratch/design-qa/home-reference-mobile.png` |
| Implementation | Mobile first viewport, 417 × 902 CSS viewport | `scratch/design-qa/home-implementation-mobile.png` |
| Combined mobile comparison | Source left, implementation right; browser-density normalized | `scratch/design-qa/home-mobile-comparison.png` |
| Implementation | Original Header joined to the redesigned body | `scratch/design-qa/home-original-shell-desktop.png` |
| Implementation | Original Footer at the bottom of the redesigned body | `scratch/design-qa/home-original-footer.png` |

## Fidelity review

- Typography: Fraunces italic display type, Inter body type, and JetBrains Mono labels match the reference hierarchy and sizing.
- Colors: cream `#EFE7D6`, paper `#FBF6EC`, ink `#232220`, walnut `#4A3525`, stone `#8F8064`, and green QC accent `#4A6B4F` match the supplied tokens.
- Layout: the 1200 px desktop frame, two-column hero, 520 px hero image, four-column stats/value/catalogue layouts, and the 920 px responsive collapse follow the source below the existing product Header.
- Copy: hero, stats, service cards, catalogue, landed DDP explanation, trade/factory panels, process, markets, FAQ, and CTA-band copy are reproduced from the supplied HTML. Header and Footer copy remain the website originals.
- Imagery: the logo, hero photograph, and seven catalogue photographs were extracted byte-for-byte from the supplied HTML.
- Responsive behavior: mobile navigation, edge-to-edge hero layout, 46 px display title, stacked sections, and 340 px hero image match the source.

## Interaction and integration checks

- Trade/factory hero switch updates copy and CTAs: passed.
- Collection filters update the visible catalogue; `Storage` resolves to the Marne sideboard: passed.
- FAQ accordion expands and reports `aria-expanded="true"`: passed.
- `Studio login` opens the existing Crafton login interface: passed.
- Original website Header is rendered once and the supplied replacement Header is absent: passed.
- Original website Footer is rendered once and the supplied replacement Footer is absent: passed.
- Homepage primary order actions remain connected to the existing signup/client-intake flow.
- Full-collection and factory-application actions remain connected to the existing Crafton pages.
- Browser console errors: none.
- ESLint with zero warnings: passed.
- Production build: passed.

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: the Header and Footer intentionally differ from the supplied standalone HTML because the product's existing site shell is preserved by request. Minor 2–4 px body differences also occur because the two origins retain different browser zoom/device-pixel-density settings.

final result: passed
