import { Injectable, Logger } from '@nestjs/common';
import { STATE_CENTROIDS, zipToLatLng } from './us-zip';

/**
 * Turns a US ZIP / address into coordinates for marketplace proximity ranking.
 * Tries OpenStreetMap Nominatim (free, no key) with a short timeout; if that is
 * unavailable it resolves the ZIP to the correct US state via a self-contained
 * prefix table (see us-zip.ts) — so a Michigan ZIP lands in Michigan, not CA.
 */
@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  async geocode(postalCode?: string, address?: string): Promise<{ lat: number; lng: number }> {
    if (postalCode) {
      try {
        const url =
          `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postalCode)}` +
          `&country=USA&format=json&limit=1`;
        // Short timeout so a slow/blocked Nominatim doesn't stall signup.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
          headers: { 'User-Agent': 'AthenaGrid/1.0 (demo marketplace)' },
          signal: controller.signal,
        }).finally(() => clearTimeout(timer));
        if (res.ok) {
          const data: any = await res.json();
          if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          }
        }
      } catch (e) {
        this.logger.warn(`Geocode lookup failed, using ZIP-state fallback: ${e}`);
      }
    }
    return this.fallback(postalCode);
  }

  /** Resolve to the correct state's centroid via the ZIP prefix table. */
  private fallback(postalCode?: string): { lat: number; lng: number } {
    const hit = zipToLatLng(postalCode);
    if (hit) return { lat: hit.lat, lng: hit.lng };
    // Unparseable ZIP: fall back to a neutral central-US point (Kansas), not CA.
    return STATE_CENTROIDS.KS;
  }
}
