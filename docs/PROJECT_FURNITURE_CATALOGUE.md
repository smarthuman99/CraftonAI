# Project furniture catalogue

Set Furniture and the homepage collection preview use `src/data/projectFurniture.json` and optimized images in `public/thecrafton-assets/project-catalogue/`. The existing landing, category grid, detail and project enquiry layouts are retained.

## Publication scope

Only the three explicitly selected projects belonging to Craftonadmin are published: The Portal Amenity, The Portal Apartment and The Bower. The allowlist in `scripts/catalogue/sources.json` checks project IDs, owner, client and project names before reading their intake records. It also records reviewed category corrections and duplicate merges.

The initial publication has 125 products from 129 records: 12 sofas, 49 chairs/benches, 48 tables/desks, 5 beds/mattresses, 6 storage pieces and 5 other furnishings. Four repeated designs are merged. There are 93 products with photos and 32 without photos; missing images have an explicit placeholder, never an unrelated product image. Specifications awaiting confirmation remain labelled accordingly in both languages.

The public data contains only product codes, names, categories, photos, dimensions, materials, finishes and colours. Source prices, quantities, client notes, tracking, revision history, technical drawings and internal identifiers are excluded. Public pricing is by enquiry. Selecting furniture creates an enquiry using the existing project intake flow; it does not publish or change the source projects.

## Updating the collection

Publication is an explicit snapshot, not an automatic database subscription. From the repository root, with the existing Supabase administrator environment in `server/.env`, run:

```sh
npm run catalogue:sync
npm run test:catalogue
npm run lint
npm run build
```

The synchronizer reads the database and storage without modifying them. It uses only item photos in the selected owner's intake job directories, optimizes them to WebP, and generates a public whitelist of fields. Review the resulting data, photo matches, categories and duplicates before committing and deploying. Backend edits appear publicly after another reviewed synchronization and deployment.

The local audit report at `output/catalogue-sync/report.json` maps public products to their sources and lists missing photos, exclusions and merges. That report and the local raw source snapshot are ignored by Git; do not publish either. For a specific source item, an override with `published: false` and a reason excludes it on the next synchronization. There is no new backoffice publication control in this change.

Automated data tests cover field exposure, image scope, classification, conservative deduplication and missing-photo ordering. Browser verification covers desktop/mobile layouts, all categories, search, bilingual details, reference images, cart quantities, obsolete cart entries and the existing enquiry dialog.
