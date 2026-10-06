import catalogue from "./projectFurniture.json";

export const CATALOGUE_CATEGORIES = catalogue.categories;
export const CATALOGUE_PRODUCTS = catalogue.categories.flatMap((category) => category.products);
export const CATALOGUE_FEATURED = [
  CATALOGUE_PRODUCTS.find((product) => /large curved sofa/i.test(product.name) && product.image),
  ...catalogue.categories.map((category) => category.products.find((product) => product.image))
].filter((product, index, items) => product && items.findIndex((item) => item?.id === product.id) === index);
