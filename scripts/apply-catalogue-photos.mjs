import fs from "node:fs/promises";
import { applyCataloguePhotos } from "../shared/cataloguePhotos.mjs";
import { groupFurniture } from "../shared/publishedFurniture.mjs";

const file = new URL("../src/data/projectFurniture.json", import.meta.url);
const catalogue = JSON.parse(await fs.readFile(file, "utf8"));
const overrides = JSON.parse(await fs.readFile(new URL("./catalogue/photo-overrides.json", import.meta.url), "utf8"));
const products = applyCataloguePhotos(
  catalogue.categories.flatMap((category) => category.products),
  overrides
);
for (const image of new Set(products.flatMap((product) => product.images))) {
  await fs.access(new URL(`../public${image}`, import.meta.url));
}
catalogue.categories = groupFurniture(products);
await fs.writeFile(file, `${JSON.stringify(catalogue, null, 2)}\n`);
console.log(
  JSON.stringify({ products: products.length, withPhotos: products.filter((product) => product.image).length })
);
