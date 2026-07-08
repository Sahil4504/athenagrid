// Real product photography, keyed by a product's `imageKey`.
//
// Source: Wikimedia Commons via `Special:FilePath` — permanent, CORS-open and
// hotlink-friendly URLs that only need a real filename (no fragile hashed paths).
// Every filename below was verified to exist on Commons. Any key not listed here
// (or any image that fails to load) falls back to the in-app SVG illustration in
// `productArt.tsx`, so a card is never broken — it just shows the illustration.
//
// For a unique, relevant real photo on *every* product, the reliable route is a
// free Pexels/Unsplash API key: we'd fetch one photo per product and bake the
// stable CDN URL into the seed. This map is the no-key, launch-safe baseline.

const filePath = (name: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=640`;

const CROP_SPRAYER = filePath('Hardi Alpha VariTrack 3000i crop sprayer.jpg');

export const PRODUCT_PHOTOS: Record<string, string> = {
  // Crops (seed)
  corn: filePath('A Maize Crop with beautiful Corn.jpg'),
  wheat: filePath('Golden wheat field 2.jpg'),
  alfalfa: filePath('Alfalfa round bales.jpg'),
  // Crop protection — real field sprayer photo
  herbicide: CROP_SPRAYER,
  insecticide: CROP_SPRAYER,
  fungicide: CROP_SPRAYER,
  adjuvant: CROP_SPRAYER,
};

/** Best available image src for a product: explicit DB image → keyed real photo → undefined (SVG). */
export function photoFor(imageUrl?: string, imageKey?: string): string | undefined {
  if (imageUrl) return imageUrl;
  if (imageKey && PRODUCT_PHOTOS[imageKey]) return PRODUCT_PHOTOS[imageKey];
  return undefined;
}
