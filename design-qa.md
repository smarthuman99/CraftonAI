# TheCrafton Client Project Detail - Design QA

## Comparison Target

- Source visual truth: `E:/下载/TheCrafton_Website_Mockups/thecrafton_henley.html`
- Source browser capture: `E:/Crafton AI next branch/scratch/henley-reference-viewport-iab.png`
- Implementation browser capture: `E:/Crafton AI next branch/scratch/henley-project-detail-viewport-iab.png`
- Normalized side-by-side evidence: `E:/Crafton AI next branch/scratch/henley-project-detail-viewport-compare.png`
- Mobile evidence: `E:/Crafton AI next branch/scratch/henley-project-detail-390-iab.png`
- Browser: Codex in-app browser
- State: authenticated demo client, populated project, Regent Grand Hotel detail page

## Viewport And Normalization

- Source capture: 1405 x 790 px at device scale factor 1.
- Implementation capture: 1974 x 1234 px at device scale factor 1.
- Side-by-side comparison normalized both captures to 790 px visible height without cropping or changing aspect ratio.
- Responsive check requested a 346 px browser override; the provider reported a 385 px inner viewport and 373 px document width. Document scroll width equalled client width, so no horizontal overflow was present.

## Findings

- No actionable P0, P1 or P2 mismatch remains.
- Typography: Fraunces italic project and KPI headings, Inter business content, and JetBrains Mono labels match the Cho source roles. Chinese content uses the existing CJK fallbacks without forced italics.
- Spacing and layout: the project hero, five KPI cards, five-stage band, 1.65/0.95 content split, document stack and lower timeline reproduce the source composition and rhythm.
- Colors and tokens: Cream, Paper, Ink, Walnut, Stone, hairlines and the 46 px grid use the canonical Cho values.
- Images: real order and Set Furniture images are used when recorded. Missing project assets are stated as pending rather than fabricated.
- Copy and business logic: supplier trade prices, RFQ comparisons, costs and margin are intentionally omitted. They are replaced with customer-safe quantities, order counts, action count, target delivery, specifications and verified status.

## Interaction And Data Checks

- Project card opens a separate detail-page view.
- Back to Studio returns to the project overview and removes the detail view.
- The former inline `ORDERS & FURNITURE` section count is zero.
- Review action scrolls to the real clarification form.
- Three recorded furniture lines rendered for the selected project.
- No supplier quote, trade total, margin or RFQ comparison label exists in the project page.
- Progress mapping reads `projects.current_stage`, `production_updates`, `inspection_reports`, `shipments` and `handover_reports`; absent records remain pending.
- Project files read only customer-owned `project_files`, `shipment_documents` and intake attachments.
- Desktop document scroll width equalled client width; browser console error count was zero.
- Build, lint, Intake tests (5/5), RFQ tests (4/4), and `git diff --check` passed.

## Comparison History

- Initial source/implementation comparison found no P0/P1/P2 composition, token, typography, image or content mismatch requiring another visual iteration.
- Intentional source deviation: internal trade price, customer margin and supplier-cost columns were removed to preserve commercial confidentiality.
- Intentional product deviation: static Henley dates and approvals were replaced by real database state or explicit pending states.

## Follow-up Polish

- P3: the existing global site navigation remains dense below 420 px. It does not overlap the project page or create horizontal overflow, but a future site-wide mobile menu pass would improve the shared header.

final result: passed

# TheCrafton Order Portfolio Client-Portal Styling - Design QA

## Comparison Target

- Source visual truth: `E:/下载/TheCrafton_Website_Mockups/thecrafton_client.html`.
- Source browser capture: `E:/Crafton AI next branch/scratch/admin-portfolio-reference-thecrafton-client.png` (1761 x 1101 px).
- Browser-rendered implementation: `E:/Crafton AI next branch/scratch/admin-portfolio-client-card-desktop-final.png` (1974 x 1234 px).
- Mobile implementation: `E:/Crafton AI next branch/scratch/admin-portfolio-client-card-mobile-projects-final.png` (469 x 1041 px).
- Full-view same-input comparison: `E:/Crafton AI next branch/scratch/admin-portfolio-qa-side-by-side-final.png` (1422 x 800 px).
- Focused same-input comparison: `E:/Crafton AI next branch/scratch/admin-portfolio-qa-focus-final.png` (1422 x 800 px).
- Browser: Codex in-app browser, authenticated Cho demo-admin state.
- State: English Order portfolio overview, All filter, empty search; mobile evidence covers the selected-client project menu.

## Viewport And Normalization

- Source capture requested a 1600 x 1000 desktop frame; the browser provider rendered the reference at approximately 1778 x 1111 CSS px and produced a 1761 x 1101 raster.
- Implementation desktop viewport was 1778 x 1111 CSS px at reported DPR 0.9; screenshot raster was 1974 x 1234.
- The full-view comparison fits both source and implementation into equal-width panels without changing aspect ratio, neutralizing the provider-density difference.
- The focused comparison displays the KPI and project-card regions at the same visible scale so typography, spacing, borders, radii and progress bars remain readable.
- Mobile override requested 390 x 844; the provider reported 434 x 938 CSS px at DPR 0.9 and produced a 469 x 1041 raster.

## Findings

- No actionable P0, P1 or P2 issue remains.
- Fonts and typography: Fraunces italic is used for the page title, section headings, KPI numerals, selected client and project titles; Inter carries operational copy; JetBrains Mono is reserved for labels, counts, stages and dates. This matches the source hierarchy and optical roles.
- Spacing and layout rhythm: the page uses a restrained 1600 px frame, 18 px card gaps, 26 px KPI padding, 14 px radii, fine hairlines and no decorative elevation. The original large nested containers were replaced by independent Paper cards on the grid.
- Colors and visual tokens: the grid canvas is Cream `#EFE7D6`; cards, search and controls use Paper `#FBF6EC`; Ink, Walnut and Stone remain unchanged. Computed browser styles confirmed the final token mapping.
- Image quality and asset fidelity: the reference project photography is intentionally not copied into this operational client/project directory because the requested hierarchy prioritizes scan speed and disclosure. No placeholder, generated, CSS-drawn or handcrafted image asset was introduced.
- Copy and content: three priority metrics replace the denser reference dashboard inventory; client selection, project metadata, stage, action state and date remain available without repeating full workspace details.
- Icons and controls: the existing Font Awesome search, disclosure and back icons are retained; buttons have clear focus states, 42 px filter targets and semantic tab/button roles.
- Responsiveness: desktop keeps the client index and selected projects visible together; mobile presents the client list first and swaps to the project list after selection, with a visible Clients back action. Cards remain independent at both breakpoints.

## Interaction And Runtime Checks

- Client selection opens the project list on mobile; the Clients back action restores the directory.
- Shipping filter renders the zero-result state; All restores the active portfolio.
- Searching for Westlake hides Regent and leaves the correct project visible; clearing the field restores both projects.
- Project rows remain keyboard-focusable disclosure buttons and show the new four-part progress track.
- Browser-rendered snapshots showed no error overlay. The Vite terminal reported successful HMR updates without runtime errors during the interaction pass.
- Production build passed. The only build note is the pre-existing Vite large-chunk advisory.

## Comparison History

- Iteration 1 found a P2 color-token inversion: the implementation used Cream on the cards and Paper on the page, while the reference uses the opposite relationship. This weakened the requested independent light-card effect.
- Fix: added a local `--admin-portfolio-paper: #FBF6EC`, set the overview canvas to Cream `#EFE7D6`, and applied Paper to KPI cards, filters, search, client directory, mobile selected-client header and project cards.
- Iteration 2 recaptured the desktop implementation and regenerated both the full-view and focused same-input comparisons. The page/card relationship, typography, radius, spacing and segmented progress details now match the reference design language with no remaining P0/P1/P2 issue.
- Intentional product deviation: the source uses a flat list of photographed projects; this page preserves the requested simplified iOS-like client-to-project disclosure structure instead of cloning that information architecture.

## Follow-up Polish

- P3: the shared site navigation remains vertically dense on narrow mobile widths. It is outside this page-scoped styling pass and does not block the portfolio menu or project cards.

final result: passed

# TheCrafton Order Portfolio Hierarchy - Design QA

## Comparison Target

- Source visual truth: `E:/下载/FireShot/FireShot Capture 043 - The Crafton - Contract Furniture - [129.121.98.185].png` (1852 x 1315 px), used as the before-state and content inventory.
- Product style reference: `E:/Crafton AI next branch/scratch/client-dashboard-populated.png` (1600 x 2665 px), used for the approved Client Portal hierarchy, palette, typography and disclosure behavior.
- Browser-rendered implementation: `E:/Crafton AI next branch/scratch/admin-portfolio-hierarchy-desktop-final.png` (1974 x 1234 px).
- Mobile client-menu evidence: `E:/Crafton AI next branch/scratch/admin-portfolio-hierarchy-mobile-clients.png` (469 x 1041 px).
- Mobile project-menu evidence: `E:/Crafton AI next branch/scratch/admin-portfolio-hierarchy-mobile-projects-viewport.png` (469 x 1041 px).
- Browser: Codex in-app browser, authenticated Cho demo-admin state using the real portfolio component.
- State: overview, all projects filter, no search term; mobile evidence also covers the selected-client disclosure state.

## Viewport And Normalization

- Desktop browser CSS viewport: 1778 x 1111 at reported device pixel ratio 0.9; screenshot raster: 1974 x 1234.
- Mobile browser override requested 390 x 844; provider-reported inner viewport was 434 x 938 and the page-level horizontal overflow was 0 px.
- The source and implementation use different fixture datasets, so full-view comparison evaluates hierarchy, density and token fidelity rather than identical rows.
- Focused evidence was required for the mobile disclosure state because the project rows are below the first mobile viewport; the viewport capture verifies the back control, project rows, stage labels, action badges and chevrons together.

## Findings

- No actionable P0, P1 or P2 issue remains.
- Information hierarchy: six metrics, the separate four-stage pipeline and always-expanded next-action copy were reduced to three priority metrics, one compact filter strip and a two-level client/project browser.
- Fonts and typography: Fraunces retains editorial headings and numeric emphasis; Inter remains the operational UI face; JetBrains Mono remains limited to labels, counts, stages and dates. Chinese headings use the existing non-italic CJK fallback behavior.
- Spacing and layout rhythm: the desktop split view provides a stable client index and a quieter project detail pane. Hairlines and modest 12 px surfaces replace dense nested row structures without adding heavy elevation.
- Colors and visual tokens: Cream, Paper, Ink, Walnut, Stone and the 46 px engineering grid match the canonical Cho/Client Portal system. The action state is conveyed by label and border, not color alone.
- Image and icon fidelity: this operational index does not require project imagery. Existing Font Awesome interface icons are used for search, disclosure and back navigation; no placeholder or handcrafted raster/vector asset was introduced.
- Copy and content: the overview now uses short task-oriented copy. Full next-action instructions remain available after a project is opened, avoiding duplicated detail in the portfolio layer.
- Responsiveness: desktop uses simultaneous client and project panes; mobile shows the client list first, replaces it with the selected client’s project list after a tap, and exposes a clear Clients back button. Page-level horizontal overflow is zero.

## Interaction And Data Checks

- Selecting a client opens its project list on mobile and preserves the two-pane view on desktop.
- The Clients back control restores the mobile client directory.
- Selecting Regent Grand Hotel opens the existing S01-S17 project workspace; its portfolio back control returns successfully.
- All, Needs action and Production filters were exercised; the zero-result state renders correctly.
- Searching for Westlake reduces the visible portfolio to one project; clearing search restores both projects.
- Desktop and mobile project rows remain keyboard-focusable buttons with explicit accessible names.
- Browser console errors and warnings: zero.
- Production build passed. Targeted ESLint passed. `git diff --check` passed for `src/app.jsx` and `src/style.css`.

## Comparison History

- Initial comparison found the required hierarchy and density shift was achieved without changing the approved brand tokens or project-opening behavior.
- Mobile verification confirmed the client-to-project disclosure logic, then the project-to-workspace navigation and return path.
- No P0/P1/P2 visual fix was required after the browser-rendered comparison. The differing number of fixture clients and projects is data variance, not visual drift.

## Follow-up Polish

- P3: the shared global mobile header remains vertically dense; it is outside this page’s scoped redesign and does not overlap the portfolio controls.

final result: passed

# TheCrafton Client Studio And FF&E Intake - Design QA

## Comparison Target

- Dashboard source: `C:/Users/huawei/AppData/Local/Temp/codex-clipboard-68b3e3f5-5464-4150-bad8-e367e0f877f0.png`.
- Intake source: `C:/Users/huawei/AppData/Local/Temp/codex-clipboard-885627d8-0b7e-41cb-b7f7-da48121008d9.png`.
- Dashboard implementation: `E:/Crafton AI next branch/scratch/ffe-dashboard-reference-size.png`.
- Intake implementation: `E:/Crafton AI next branch/scratch/ffe-intake-reference-size.png`.
- Side-by-side evidence: `scratch/ffe-dashboard-comparison.png` and `scratch/ffe-intake-comparison.png`.
- Mobile evidence: `scratch/ffe-intake-mobile.png`.
- Browser: Codex in-app browser, authenticated demo client state.

## Findings

- No actionable P0, P1 or P2 visual mismatch remains.
- The client-center entry opens the Cho project studio dashboard by default; it does not expose the legacy intake form first.
- The dashboard retains the source composition: 46 px planning grid, editorial welcome, four project metrics, primary actions and project-led cards.
- The intake page uses the same Cream, Paper, Ink, Walnut and Stone design tokens with Fraunces display type, Inter UI type and mono workflow labels.
- The long manual specification form is replaced by a primary FF&E upload action, a four-stage workflow, optional context and a structured extraction review.
- The existing Crafton Concierge remains available beside the file workflow without competing with the primary upload action.
- Desktop uses a stable main-and-aside layout; mobile collapses to one column, changes the four stages to a two-by-two layout and has no observed horizontal overlap.

## Interaction And Data Checks

- Demo client login followed by Client Center lands on the populated project studio.
- New Project opens the new FF&E intake.
- Back to Project Studio returns to the dashboard.
- Extract action is disabled until a source file exists.
- A source upload uses the authenticated Supabase file flow, creates a queued `FFE_SCHEDULE` intake job and allows the worker to produce the normalized extracted draft.
- The VPS worker extracts worksheet rows from XLSX/XLSM, page text from PDF, document text from DOCX, and text from CSV/TXT before structured analysis. Images remain available to the configured vision path.
- Unsupported or unreadable sources are saved and explicitly routed to manual Cho review instead of silently producing invented specifications.
- Completed extraction is detected from the normalized job result and enters customer review instead of remaining in a processing state.
- Customer confirmation writes `client_confirmed_extraction` back to `intake_jobs`, refreshes workspace data and returns to the project studio.
- Browser console error count was zero.
- Lint, production build and Intake tests (8/8) passed locally; the deployed VPS source-reader tests passed (3/3).

## Intentional Source Changes

- The previous field-heavy intake screen is not cloned literally because the requested workflow makes the FF&E document the primary source of truth.
- Optional project name, destination and notes remain available behind a disclosure for sparse or ambiguous files.
- A future site-wide pass may condense the shared mobile header into a menu; it currently wraps without blocking the project workflow.

final result: passed

# TheCrafton Supplier RFQ Manual Excel Flow - Design QA

## Comparison Target

- Source screenshot: `E:/下载/FireShot/FireShot Capture 027 - The Crafton - Contract Furniture - [129.121.98.185].png` (1579 x 5223 px).
- Implementation desktop capture: `E:/Crafton AI next branch/scratch/design-qa/rfq-manual-desktop-top-final.png` (1430 x 993 px).
- Implementation import-state capture: `E:/Crafton AI next branch/scratch/design-qa/rfq-manual-import-focused.png` (1301 x 130 px).
- Implementation mobile capture: `E:/Crafton AI next branch/scratch/design-qa/rfq-manual-mobile-top.png` (380 x 822 px).
- Normalized side-by-side evidence: `E:/Crafton AI next branch/scratch/design-qa/rfq-source-vs-implementation.png` (1440 x 560 px).
- Browser: Codex in-app browser using the real sourcing components and a deterministic Terra project fixture.

## Findings

- No actionable P0, P1 or P2 mismatch remains.
- Typography retains the existing Fraunces, Inter and mono-label hierarchy, with the established Chinese CJK fallbacks.
- Layout retains the five-step sourcing band, Paper cards, tabular RFQ content and supplier response hierarchy while changing the operating model from system email dispatch to manual Excel exchange.
- Colors use the existing Cream, Paper, Ink, Walnut and Stone tokens. The sourcing header uses a solid warm surface with no gradient.
- Product references use the real Set Furniture catalogue images; no placeholder imagery was introduced.
- Copy now explains the exact sequence: select suppliers, approve RFQ, download Excel, email it externally, upload each returned workbook, record the quote, then run AI comparison.

## Interaction And Data Checks

- Each supplier checkbox has a unique accessible name.
- The RFQ toolbar exposes Save, Approve and Download RFQ Excel; PDF, Resend configuration and in-system email sending controls are removed.
- The downloaded `.xlsx` contains editable quote cells, formulas, product images and a hidden Crafton identity sheet for `project_id`, RFQ batch and version validation.
- A returned Hansen workbook was uploaded through the actual file chooser and parsed as 3/3 item prices with a USD 114,500 total, MOQ 10 and 35-day lead time.
- The returned workbook is rejected when its hidden project or RFQ batch identity does not match the open workspace.
- AI comparison remains disabled at 0/3 responses and becomes available only after every selected supplier is recorded and at least two valid quotes exist.
- Desktop viewport had no page-level horizontal overflow. At 390 x 844 px, the page remained within the viewport and wide commercial tables used their intended internal scroller.
- Browser console errors and warnings: zero.

## Comparison History

- Initial comparison found a P2 nested-label accessibility issue in supplier selection; the supplier group wrapper was changed to a non-label container and the checkboxes were reverified.
- Initial comparison found P2 untranslated static S06/S07 headings in Chinese mode; the sourcing headings and descriptions were added to the admin translation map and reverified.
- Intentional source deviation: the old system-email/PDF workflow was replaced with the requested manual Excel download and supplier-specific return-upload workflow.

final result: passed
