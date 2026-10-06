// Reviewed source photos override thumbnails on every catalogue publication.
// Provenance stays in the build-time manifest and is not copied into public data.
export function applyCataloguePhotos(products, overrides) {
  return products.map((product) => {
    const replacement = overrides[product.id];
    if (!replacement) return product;
    if (replacement.code !== product.code) throw new Error(`Photo source identity changed: ${product.id}`);
    if (
      !Array.isArray(replacement.images) ||
      !replacement.images.length ||
      replacement.images.some((image) => !/^\/thecrafton-assets\/project-catalogue\/[a-f0-9]{24}\.webp$/.test(image))
    )
      throw new Error(`Invalid reviewed photos: ${product.id}`);
    const images = [...new Set(replacement.images)];
    return { ...product, images, image: images[0] };
  });
}
