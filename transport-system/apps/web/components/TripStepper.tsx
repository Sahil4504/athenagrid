'use client';
import { TripStatus } from '@athenagrid/shared';

const STAGES: { key: TripStatus; label: string }[] = [
  { key: TripStatus.ASSIGNED, label: 'Assigned' },
  { key: TripStatus.EN_ROUTE_TO_PICKUP, label: 'To pickup' },
  { key: TripStatus.AT_PICKUP, label: 'At pickup' },
  { key: TripStatus.LOADED, label: 'Loaded' },
  { key: TripStatus.IN_TRANSIT, label: 'In transit' },
  { key: TripStatus.AT_DROPOFF, label: 'At dropoff' },
  { key: TripStatus.DELIVERED, label: 'Delivered' },
];

export function TripStepper({ status }: { status: string }) {
  const currentIdx = STAGES.findIndex((s) => s.key === status);
  return (
    <div className="stepper">
      {STAGES.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className={`step ${i <= currentIdx ? 'done' : ''}`}>
            <span className="dot">{i <= currentIdx ? '✓' : i + 1}</span>
            {s.label}
          </div>
          {i < STAGES.length - 1 && <span className="bar" />}
        </div>
      ))}
    </div>
  );
}
