# Cho Craft UI — Design QA

## Scope and source of truth

- Reference: `public/thecrafton_draft_site/index.html` and the related HTML drafts in the same folder.
- Implementation: the existing Crafton React application at `http://127.0.0.1:4173/`.
- State preserved: existing marketing content, authentication roles, client project/order data, backoffice stages, Supabase controls, and navigation destinations.
- Visual intent: translate Cho's craft-led language into the existing product, not replace product workflows with a static landing-page clone.

## Evidence

| Surface | State | Evidence |
| --- | --- | --- |
| Cho source | Homepage, desktop | `scratch/design-qa/cho-home-1440-final.png` |
| Implementation | Homepage, desktop | `scratch/design-qa/current-home-after-1440-final.png` |
| Combined comparison | Source left, implementation right; normalized to a shared 1422 × 800 comparison canvas | `scratch/design-qa/cho-vs-implementation-final.png` |
| Implementation | Homepage, mobile; effective browser capture 469 × 1041 | `scratch/design-qa/current-home-after-390-final.png` |
| Implementation | Client Portal, Sarah Jenkins demo data | `scratch/design-qa/client-portal-final.png` |
| Implementation | Backoffice, Cho administrator, S01 intake | `scratch/design-qa/backoffice-final.png` |

The homepage hero is the full-view and focused-region comparison target because it contains all of the reference's defining surfaces: paper grid, walnut ink, brand mark, display italic, technical mono labels, pill CTA, and editorial furniture photography. Client Portal and Backoffice have no one-to-one source screen in Cho's draft, so they were checked for faithful token and component translation rather than pixel matching.

## Fidelity review

- **Typography:** Fraunces supplies the editorial italic voice; Inter handles UI/body text; JetBrains Mono supplies technical labels, indices, and stage metadata. Chinese copy uses the same high-contrast editorial hierarchy without forcing a Latin-only composition.
- **Spacing and layout:** a 46 px drafting grid, thin rules, large quiet margins, and asymmetrical editorial grouping reproduce the reference rhythm. The existing dense operational screens retain their information hierarchy while using the same grid and surface rules.
- **Colors and surfaces:** warm paper, dark walnut, muted sand, and olive success tones are centralized as tokens. Heavy shadows and generic blue SaaS panels were removed from the redesigned surfaces.
- **Imagery:** the supplied Cho interior and brand artwork are used directly; no placeholder or approximate drawn assets were introduced.
- **Copy and product content:** the product's Chinese/English content and real demo records remain intact. Only hero framing and craft-oriented microcopy were adjusted where required to express the design direction.

## Interaction checks

- Marketing navigation and primary CTA remain interactive.
- Login modal opens and supports the supplied demo roles.
- Sarah Jenkins login → Client Portal works and renders projects, orders, furniture details, tracker, and live-chat controls.
- Cho administrator login → Management Console works and renders S01–S05 intake workflow and stage navigation.
- Browser console errors on the final Backoffice state: none.
- Production build: passed.
- ESLint with zero warnings: passed.

## Responsive comparison history

1. Initial mobile pass showed horizontal overflow at the effective 434 px viewport (`scrollWidth: 442`) caused by desktop inline grid columns and a 1000 px CAD comparison element.
2. Mobile rules now collapse marketing grids to one column and constrain the CAD element to the viewport.
3. Final mobile measurement: `innerWidth: 434`, `scrollWidth: 422`; no horizontal overflow.

## Final assessment

**Passed.** No remaining P0, P1, or P2 visual or functional issues were found in the checked states. The remaining difference from Cho's homepage is intentional product content: the live site keeps bilingual navigation, Supabase status, authentication controls, and operational data while adopting Cho's visual grammar.
