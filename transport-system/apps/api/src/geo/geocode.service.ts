import { Injectable, Logger } from '@nestjs/common';

/**
 * Turns a US ZIP / address into coordinates for marketplace proximity ranking.
 * Tries OpenStreetMap Nominatim (free, no key); falls back to a small table of
 * seeded regions if the lookup is unavailable — so it always returns something.
 */
@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  // Seeded demo regions (where our dummy industries live).
  private readonly regions = [
    { zip: 93721, lat: 36.7378, lng: -119.7871 }, // Fresno, CA
    { zip: 93901, lat: 36.6777, lng: -121.6555 }, // Salinas, CA
    { zip: 93301, lat: 35.3733, lng: -119.0187 }, // Bakersfield, CA
    { zip: 95814, lat: 38.5816, lng: -121.4944 }, // Sacramento, CA
    { zip: 90001, lat: 34.0522, lng: -118.2437 }, // Los Angeles, CA
  ];

  async geocode(postalCode?: string, address?: string): Promise<{ lat: number; lng: number }> {
    if (postalCode) {
      try {
        const url =
          `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postalCode)}` +
          `&country=USA&format=json&limit=1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'AthenaGrid/1.0 (demo marketplace)' },
        });
        if (res.ok) {
          const data: any = await res.json();
          if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          }
        }
      } catch (e) {
        this.logger.warn(`Geocode lookup failed, using fallback: ${e}`);
      }
    }
    return this.fallback(postalCode);
  }

  /** Nearest seeded region by numeric ZIP distance (rough proxy). Defaults to Fresno. */
  private fallback(postalCode?: string): { lat: number; lng: number } {
    const zip = Number((postalCode || '').replace(/\D/g, '')) || 93721;
    let best = this.regions[0];
    let bestDiff = Infinity;
    for (const r of this.regions) {
      const diff = Math.abs(r.zip - zip);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = r;
      }
    }
    return { lat: best.lat, lng: best.lng };
  }
}
