# Set Furniture — Design QA

## Scope and visual truth

- Source: `E:\下载\TheCrafton_Website_Mockups\thecrafton_set_furniture.html`
- Implementation: the existing Crafton React application at `http://127.0.0.1:4180/`, after selecting `Set Furniture` / `标准家具` in the global navigation.
- Product constraint: the existing site-wide navigation, language, login, project controls, footer, authentication, and product-detail flow remain intact. The destination-page design, copy, and photography are matched to the supplied HTML.

## Comparison evidence

| Surface                     | State                                                                                | Evidence                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Source                      | Desktop first viewport                                                               | `scratch/design-qa/set-furniture-reference-desktop-viewport-v2.png`      |
| Implementation              | Desktop first viewport                                                               | `scratch/design-qa/set-furniture-implementation-desktop-viewport-v2.png` |
| Combined desktop comparison | Source left, implementation right; density-normalized to a shared 1600 × 1111 canvas | `scratch/design-qa/set-furniture-desktop-comparison-v2.png`              |
| Source                      | Mobile first viewport, 417 × 902 CSS viewport                                        | `scratch/design-qa/set-furniture-reference-mobile-viewport-v2.png`       |
| Implementation              | Mobile first viewport, 417 × 902 CSS viewport                                        | `scratch/design-qa/set-furniture-implementation-mobile-viewport-v2.png`  |
| Combined mobile comparison  | Source left, implementation right                                                    | `scratch/design-qa/set-furniture-mobile-comparison-v2.png`               |
| Combined focused comparison | Featured collection body at `scrollY: 720`; source left, implementation right        | `scratch/design-qa/set-furniture-mobile-focus-comparison-v2.png`         |

## Fidelity review

- Typography: Fraunces, Inter, and JetBrains Mono match the reference hierarchy and weights.
- Colors: cream `#EFE7D6`, paper `#FBF6EC`, ink `#232220`, walnut `#4A3525`, and stone `#8F8064` match the supplied design tokens.
- Spacing: desktop content starts at 64 px. The featured card measures 523 px high, matching the source. Mobile retains the source's 64 px page inset and the feature image's native 1500:937 ratio.
- Copy: all destination-page headings, descriptions, metadata, collection status, CTA, and footer note are reproduced verbatim.
- Imagery: all seven furniture photographs are byte-for-byte extracted from the supplied HTML rather than approximated or replaced.
- Structure: hero, collection rule, featured split card, preview thumbnails, upcoming collection grid, and page note follow the source order and proportions.

## Interaction and responsive checks

- Global `Set Furniture` navigation opens the new page.
- `Explore the collection →` opens the existing Arden product-detail flow.
- `← 返回产品目录` returns to the new collection landing page.
- Desktop and mobile layouts were checked visually against the source.
- Mobile overflow check: `scrollWidth: 405`, `innerWidth: 417`; no horizontal overflow.
- Browser console errors: none.
- ESLint with zero warnings: passed.
- Production build: passed.

## Comparison history and findings

1. Desktop v1 rendered the feature card at 537 px versus the source's 523 px. It was corrected to 523 px and recaptured.
2. Mobile v1 introduced smaller typography and narrow margins that were not present in Cho's source. Those overrides were removed; mobile v2 now preserves the source's 64 px inset, 68 px display title, and native feature-image ratio.
3. No P0, P1, or P2 visual or functional issues remain. P3 differences are limited to the existing global product shell and the source's decorative corner crosses, which were not recreated without an approved icon asset.

final result: passed
