-- Run AFTER `prisma migrate` to add index-backed geo radius search.
-- Adds generated geography(Point,4326) columns to Job + a GiST index so
-- "jobs near me" and "pickups within N km" are index scans, not table scans.

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS pickup_geog geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("pickupLng", "pickupLat"), 4326)::geography) STORED;

ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS dropoff_geog geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("dropoffLng", "dropoffLat"), 4326)::geography) STORED;

CREATE INDEX IF NOT EXISTS job_pickup_geog_gix ON "Job" USING GIST (pickup_geog);
CREATE INDEX IF NOT EXISTS job_dropoff_geog_gix ON "Job" USING GIST (dropoff_geog);
