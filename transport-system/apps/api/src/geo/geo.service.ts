import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Geo queries. In production (PostGIS present) radius search is an index scan on the
 * generated `pickup_geog` geography column (see prisma/postgis.sql). For local dev
 * without PostGIS, it transparently falls back to an app-side Haversine filter, so
 * the feature works with a plain Postgres and zero extra setup.
 */
@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private postgisAvailable: boolean | null = null;

  constructor(private prisma: PrismaService) {}

  /** Ids of OPEN jobs whose pickup is within radiusKm of (lat,lng), nearest first. */
  async openJobIdsNear(lat: number, lng: number, radiusKm: number): Promise<string[]> {
    if (await this.hasPostgis()) {
      try {
        const rows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
          `SELECT id
             FROM "Job"
            WHERE status = 'OPEN'
              AND ST_DWithin(pickup_geog,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
            ORDER BY ST_Distance(pickup_geog,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)
            LIMIT 200`,
          lng,
          lat,
          radiusKm * 1000,
        );
        return rows.map((r) => r.id);
      } catch (err) {
        this.logger.warn(`PostGIS query failed, using JS fallback: ${err}`);
      }
    }
    return this.haversineFallback(lat, lng, radiusKm);
  }

  /** App-side radius filter — used when PostGIS/geog columns are unavailable. */
  private async haversineFallback(lat: number, lng: number, radiusKm: number) {
    const jobs = await this.prisma.job.findMany({
      where: { status: 'OPEN' },
      select: { id: true, pickupLat: true, pickupLng: true },
      take: 1000,
    });
    return jobs
      .map((j) => ({ id: j.id, d: this.distanceKm(lat, lng, j.pickupLat, j.pickupLng) }))
      .filter((j) => j.d <= radiusKm)
      .sort((a, b) => a.d - b.d)
      .slice(0, 200)
      .map((j) => j.id);
  }

  /** Detect PostGIS + the geog column once, then cache the result. */
  private async hasPostgis(): Promise<boolean> {
    if (this.postgisAvailable !== null) return this.postgisAvailable;
    try {
      const rows = await this.prisma.$queryRawUnsafe<{ ok: boolean }[]>(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'Job' AND column_name = 'pickup_geog'
         ) AS ok`,
      );
      this.postgisAvailable = rows[0]?.ok ?? false;
    } catch {
      this.postgisAvailable = false;
    }
    if (!this.postgisAvailable) this.logger.log('PostGIS not detected — geo uses JS fallback');
    return this.postgisAvailable;
  }

  /** Straight-line distance in km between two points (Haversine). */
  distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
    const R = 6371;
    const dLat = ((bLat - aLat) * Math.PI) / 180;
    const dLng = ((bLng - aLng) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((aLat * Math.PI) / 180) *
        Math.cos((bLat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }
}
