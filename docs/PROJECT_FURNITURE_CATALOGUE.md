# Project furniture catalogue

Set Furniture and the homepage collection preview use `src/data/projectFurniture.json` and optimized images in `public/thecrafton-assets/project-catalogue/`. The existing landing, category grid, detail and project enquiry layouts are retained.

## Publication scope

Only the three explicitly selected projects belonging to Craftonadmin are published: The Portal Amenity, The Portal Apartment and The Bower. The allowlist in `scripts/catalogue/sources.json` checks project IDs, owner, client and project names before reading their intake records. It also records reviewed category corrections and duplicate merges.

The catalogue has 125 products from 129 records: 12 sofas, 49 chairs/benches, 48 tables/desks, 5 beds/mattresses, 6 storage pieces and 5 other furnishings. Four repeated designs are merged. Specifications awaiting confirmation remain labelled accordingly in both languages.

The 2026-10-06 source photo review updated 104 products, including 29 previously missing photos. There are now 122 products with photos. The two Apartment mattresses are marked IMG TBC in the source PDF; Bower's stackable chairs also have no source photo. These three retain explicit placeholders. Fourteen other main images remain below 300 pixels on their longest side because higher-resolution originals were not available in the supplied files.

Photo sources were the two Henley PDFs, `Henley_FFE_Schedule20260902_updated.xlsx`, and `4684d006-555b-4d9a-af33-149557cd92dc.xlsx`. Apartment photos are extracted embedded images rather than page screenshots. Bower PDF soft masks preserve original transparency. Amenity extraction includes both floating drawings and Excel in-cell rich images, resolving the missing-photo import issue. Matching was checked against source rows, names, dimensions and PDF product labels. Existing higher-quality manual photos remain for Amenity's first two items.

`scripts/catalogue/photo-overrides.json` records reviewed product IDs, codes, published images and source locators/native dimensions. It is build-time data, not bundled into the frontend. Original images are exported as WebP (quality 92, maximum 1600px, no upscaling). Transparent empty borders and reviewed white margins are removed without generating new furniture details; the frontend applies a consistent inset and contains the full product outline.

The public data contains only product codes, names, categories, photos, dimensions, materials, finishes and colours. Source prices, quantities, client notes, tracking, revision history, technical drawings and internal identifiers are excluded. Public pricing is by enquiry. Selecting furniture creates an enquiry using the existing project intake flow; it does not publish or change the source projects.

## Updating the collection

Publication is an explicit snapshot, not an automatic database subscription. From the repository root, with the existing Supabase administrator environment in `server/.env`, run:

```sh
npm run catalogue:sync
npm run catalogue:photos
npm run test:catalogue
npm run lint
npm run build
```

The synchronizer reads the database and storage without modifying them. It uses only item photos in the selected owner's intake job directories, then applies the reviewed photo manifest so later synchronizations do not revert to low-resolution thumbnails. It checks product identity and image existence before publication. `catalogue:photos` reapplies the manifest locally without database access; it is optional after `catalogue:sync`, which already applies the same overrides. Review the resulting data, photo matches, categories and duplicates before committing and deploying. Backend edits appear publicly after another reviewed synchronization and deployment.

The local audit report at `output/catalogue-sync/report.json` maps public products to their sources and lists missing photos, exclusions and merges. That report and the local raw source snapshot are ignored by Git; do not publish either. For a specific source item, an override with `published: false` and a reason excludes it on the next synchronization. There is no new backoffice publication control in this change.

Automated data tests cover field exposure, image scope, classification, conservative deduplication and missing-photo ordering. Browser verification covers desktop/mobile layouts, all categories, search, bilingual details, reference images, cart quantities, obsolete cart entries and the existing enquiry dialog.
