// Self-contained US ZIP -> state + coordinates resolver.
//
// Why this exists: marketplace proximity ranking needs a farmer's coordinates.
// The primary path is OpenStreetMap Nominatim, but it is frequently slow or
// blocked (free hosting, rate limits, no outbound network). The OLD fallback
// only knew about five California ZIPs, so ANY farmer whose live lookup failed
// was dropped into Fresno, CA — which is exactly why a Michigan signup saw only
// California vendors. This table covers every US ZIP prefix, so an offline
// lookup still lands in the correct state.

export type LatLng = { lat: number; lng: number };

/** Agricultural-ish centroid for each state (matches our seeded vendor cities). */
export const STATE_CENTROIDS: Record<string, LatLng> = {
  AL: { lat: 33.5186, lng: -86.8104 }, AK: { lat: 61.2181, lng: -149.9003 },
  AZ: { lat: 33.4484, lng: -112.074 }, AR: { lat: 34.7465, lng: -92.2896 },
  CA: { lat: 36.7378, lng: -119.7871 }, CO: { lat: 39.7392, lng: -104.9903 },
  CT: { lat: 41.7658, lng: -72.6734 }, DE: { lat: 39.1582, lng: -75.5244 },
  FL: { lat: 28.5383, lng: -81.3792 }, GA: { lat: 33.749, lng: -84.388 },
  HI: { lat: 21.3069, lng: -157.8583 }, ID: { lat: 43.615, lng: -116.2023 },
  IL: { lat: 39.7817, lng: -89.6501 }, IN: { lat: 39.7684, lng: -86.1581 },
  IA: { lat: 41.5868, lng: -93.625 }, KS: { lat: 37.6872, lng: -97.3301 },
  KY: { lat: 38.2527, lng: -85.7585 }, LA: { lat: 30.4515, lng: -91.1871 },
  ME: { lat: 43.6591, lng: -70.2568 }, MD: { lat: 39.2904, lng: -76.6122 },
  MA: { lat: 42.2626, lng: -71.8023 }, MI: { lat: 42.7325, lng: -84.5555 },
  MN: { lat: 44.0121, lng: -92.4802 }, MS: { lat: 32.2988, lng: -90.1848 },
  MO: { lat: 38.9517, lng: -92.3341 }, MT: { lat: 45.7833, lng: -108.5007 },
  NE: { lat: 40.8136, lng: -96.7026 }, NV: { lat: 39.5296, lng: -119.8138 },
  NH: { lat: 43.2081, lng: -71.5376 }, NJ: { lat: 40.2171, lng: -74.7429 },
  NM: { lat: 35.0844, lng: -106.6504 }, NY: { lat: 43.0481, lng: -76.1474 },
  NC: { lat: 35.7796, lng: -78.6382 }, ND: { lat: 46.8772, lng: -96.7898 },
  OH: { lat: 39.9612, lng: -82.9988 }, OK: { lat: 35.4676, lng: -97.5164 },
  OR: { lat: 44.9429, lng: -123.0351 }, PA: { lat: 40.2732, lng: -76.8867 },
  RI: { lat: 41.824, lng: -71.4128 }, SC: { lat: 34.0007, lng: -81.0348 },
  SD: { lat: 43.5446, lng: -96.7311 }, TN: { lat: 36.1627, lng: -86.7816 },
  TX: { lat: 33.5779, lng: -101.8552 }, UT: { lat: 40.7608, lng: -111.891 },
  VT: { lat: 44.4759, lng: -73.2121 }, VA: { lat: 37.5407, lng: -77.436 },
  WA: { lat: 46.6021, lng: -120.5059 }, WV: { lat: 38.3498, lng: -81.6326 },
  WI: { lat: 43.0731, lng: -89.4012 }, WY: { lat: 41.14, lng: -104.8202 },
  DC: { lat: 38.9072, lng: -77.0369 },
};

/**
 * 3-digit ZIP prefix ranges -> state. Based on the USPS geographic assignment
 * of ZIP prefixes (each entry is [lowPrefix, highPrefix, state], inclusive).
 */
const ZIP3_RANGES: Array<[number, number, string]> = [
  [5, 5, 'NY'], [10, 27, 'MA'], [28, 29, 'RI'], [30, 38, 'NH'], [39, 49, 'ME'],
  [50, 59, 'VT'], [60, 69, 'CT'], [70, 89, 'NJ'], [100, 149, 'NY'],
  [150, 196, 'PA'], [197, 199, 'DE'], [200, 205, 'DC'], [206, 219, 'MD'],
  [220, 246, 'VA'], [247, 268, 'WV'], [270, 289, 'NC'], [290, 299, 'SC'],
  [300, 319, 'GA'], [320, 349, 'FL'], [350, 369, 'AL'], [370, 385, 'TN'],
  [386, 397, 'MS'], [398, 399, 'GA'], [400, 427, 'KY'], [430, 459, 'OH'],
  [460, 479, 'IN'], [480, 499, 'MI'], [500, 528, 'IA'], [530, 549, 'WI'],
  [550, 567, 'MN'], [570, 577, 'SD'], [580, 588, 'ND'], [590, 599, 'MT'],
  [600, 629, 'IL'], [630, 658, 'MO'], [660, 679, 'KS'], [680, 693, 'NE'],
  [700, 714, 'LA'], [716, 729, 'AR'], [730, 749, 'OK'], [750, 799, 'TX'],
  [800, 816, 'CO'], [820, 831, 'WY'], [832, 838, 'ID'], [840, 847, 'UT'],
  [850, 865, 'AZ'], [870, 884, 'NM'], [885, 885, 'TX'], [889, 898, 'NV'],
  [900, 961, 'CA'], [967, 968, 'HI'], [970, 979, 'OR'], [980, 994, 'WA'],
  [995, 999, 'AK'],
];

/** Resolve a US ZIP (any format) to its state's centroid. Null if unresolvable. */
export function zipToLatLng(postalCode?: string): (LatLng & { state: string }) | null {
  const digits = (postalCode || '').replace(/\D/g, '');
  if (digits.length < 3) return null;
  const prefix = Number(digits.slice(0, 3));
  for (const [lo, hi, st] of ZIP3_RANGES) {
    if (prefix >= lo && prefix <= hi) {
      const c = STATE_CENTROIDS[st];
      if (c) return { ...c, state: st };
    }
  }
  return null;
}
