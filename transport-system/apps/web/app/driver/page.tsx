'use client';
import { useState } from 'react';
import { TRIP_TRANSITIONS, TripStatus } from '@athenagrid/shared';
import { api } from '../../lib/api-client';
import { AuthPanel } from '../../components/AuthPanel';
import { TripStepper } from '../../components/TripStepper';

export default function DriverPage() {
  const [token, setToken] = useState<string | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function afterAuth(t: string) {
    setToken(t);
    setTrips(await api.listTrips());
  }

  async function advance(trip: any) {
    const next = (TRIP_TRANSITIONS[trip.status as TripStatus] ?? [])[0];
    if (!next) return;
    setMsg('');
    try {
      await api.tripStatus(trip.id, next);
      setTrips(await api.listTrips());
      setMsg(`✓ Advanced to ${next.replace(/_/g, ' ').toLowerCase()}.`);
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function ping(trip: any) {
    const lat = (trip.job.pickupLat + trip.job.dropoffLat) / 2 + (Math.random() - 0.5) * 0.2;
    const lng = (trip.job.pickupLng + trip.job.dropoffLng) / 2 + (Math.random() - 0.5) * 0.2;
    await api.tripLocation(trip.id, lat, lng);
    setMsg(`📍 Location sent (${lat.toFixed(3)}, ${lng.toFixed(3)}) — shipper sees it live.`);
  }

  if (!token)
    return (
      <AuthPanel
        title="Driver sign-in"
        subtitle="See your assigned trips and update them on the road."
        accounts={[
          { label: 'Danny (ColdHaul)', email: 'driver@athenagrid.dev' },
          { label: 'Val (ValleyFreight)', email: 'driver2@athenagrid.dev' },
          { label: 'Ravi (individual)', email: 'indie@athenagrid.dev' },
        ]}
        onAuthed={afterAuth}
      />
    );

  return (
    <>
      <h1 style={{ fontSize: 28 }}>My trips</h1>
      {msg && <div className="banner">{msg}</div>}
      {trips.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>
          No trips yet. Win a job first — bid as a carrier, then award it as the shipper.
        </p></div>
      )}
      {trips.map((t) => {
        const next = (TRIP_TRANSITIONS[t.status as TripStatus] ?? [])[0];
        return (
          <div key={t.id} className="card">
            <div className="between">
              <strong>{t.job?.cropType} · {t.job?.weightKg}kg</strong>
              <span className={`badge st-${t.status}`}>{t.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="muted" style={{ fontSize: 13, margin: '6px 0' }}>
              📍 {t.job?.pickupAddress} → {t.job?.dropoffAddress}
            </p>
            <TripStepper status={t.status} />
            {t.job?.settlement && (
              <div className="banner" style={{ marginTop: 10 }}>
                💰 Your payout: <strong>&nbsp;${t.job.settlement.driverPayout}</strong>
                &nbsp;<span className="muted" style={{ fontSize: 12 }}>
                  (bid ${t.job.settlement.transportPrice} − {Math.round(t.job.settlement.carrierCommissionRate * 100)}% commission ${t.job.settlement.carrierCommission})
                </span>
              </div>
            )}
            <div className="row" style={{ marginTop: 10 }}>
              {next ? (
                <button className="btn" onClick={() => advance(t)}>Advance → {next.replace(/_/g, ' ').toLowerCase()}</button>
              ) : (
                <span className="badge st-DELIVERED">✓ Delivered</span>
              )}
              <button className="btn ghost" onClick={() => ping(t)}>📍 Send location</button>
            </div>
          </div>
        );
      })}
    </>
  );
}
