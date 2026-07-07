import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BidAssessment,
  DEFAULT_CARRIER_COMMISSION_RATE,
  DEFAULT_SHIPPER_FEE_RATE,
  FairBand,
  Settlement,
  computeSettlement,
} from '@athenagrid/shared';
import { GeoService } from '../geo/geo.service';

// Tunable rate card (move to DB/admin config later).
const BASE_DISPATCH = 40; // fixed per job
const RATE_PER_KM = 1.1; // $/km
const RATE_PER_TONNE_KM = 0.35; // $ per tonne per km
const COLD_CHAIN_SURCHARGE = 0.18; // +18%
const FLOOR_FACTOR = 0.8; // floor = reference * 0.8
const CEILING_FACTOR = 1.25; // ceiling = reference * 1.25

type JobLike = {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  weightKg: number;
  coldChainRequired: boolean;
  perishabilityIndex: number;
  budgetCeiling?: number | null;
};

@Injectable()
export class PricingService {
  constructor(
    private geo: GeoService,
    private config: ConfigService,
  ) {}

  get carrierRate(): number {
    return Number(this.config.get('CARRIER_COMMISSION_RATE', DEFAULT_CARRIER_COMMISSION_RATE));
  }
  get shipperRate(): number {
    return Number(this.config.get('SHIPPER_FEE_RATE', DEFAULT_SHIPPER_FEE_RATE));
  }

  /** Reference / floor / ceiling for a job — the fair-price band. */
  computeBand(job: JobLike): FairBand {
    const distanceKm = this.geo.distanceKm(
      job.pickupLat,
      job.pickupLng,
      job.dropoffLat,
      job.dropoffLng,
    );
    let reference =
      BASE_DISPATCH + RATE_PER_KM * distanceKm + RATE_PER_TONNE_KM * (job.weightKg / 1000) * distanceKm;
    if (job.coldChainRequired) reference *= 1 + COLD_CHAIN_SURCHARGE;
    // Urgency premium scales with how perishable the cargo is (0..10%).
    reference *= 1 + 0.1 * Math.min(1, Math.max(0, job.perishabilityIndex));

    const round2 = (n: number) => Math.round(n * 100) / 100;
    return {
      reference: round2(reference),
      floor: round2(reference * FLOOR_FACTOR),
      ceiling: round2(reference * CEILING_FACTOR),
    };
  }

  /**
   * Score a bid against the band. Peaks in the lower-middle (fair to both sides),
   * penalizes below-floor (unsustainable → flake risk) and above-ceiling (unfair to farmer).
   */
  assessBid(amount: number, band: FairBand): BidAssessment {
    const withinBand = amount >= band.floor && amount <= band.ceiling;
    const target = (band.floor + band.reference) / 2;
    const spread = Math.max(1, band.ceiling - band.floor);
    let score = 1 - Math.abs(amount - target) / spread;
    let note = 'Fair price';
    if (amount < band.floor) {
      score *= 0.4;
      note = 'Below sustainable floor — delivery risk';
    } else if (amount > band.ceiling) {
      score *= 0.5;
      note = 'Above fair ceiling — pricey for the farmer';
    }
    return { score: Math.max(0, Math.min(1, score)), recommended: false, withinBand, note };
  }

  /** Given all bids on a job, return per-bid assessments with the single best flagged. */
  rankBids<T extends { id: string; amount: number }>(
    bids: T[],
    band: FairBand,
  ): Array<T & { assessment: BidAssessment }> {
    const scored = bids.map((b) => ({ ...b, assessment: this.assessBid(b.amount, band) }));
    let bestIdx = -1;
    let bestScore = -1;
    scored.forEach((b, i) => {
      if (b.assessment.withinBand && b.assessment.score > bestScore) {
        bestScore = b.assessment.score;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0) scored[bestIdx].assessment.recommended = true;
    return scored;
  }

  /** The money split for an awarded amount (stored at award time). */
  settle(amount: number): Settlement {
    return computeSettlement(amount, this.carrierRate, this.shipperRate);
  }
}
