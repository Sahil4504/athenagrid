'use client';
import { useEffect, useState } from 'react';
import { TRIP_TRANSITIONS, TripStatus } from '@athenagrid/shared';
import { api } from '../../lib/api-client';
import { useRequireRole } from '../../lib/auth';
import { TripStepper } from '../../components/TripStepper';

export default function CarrierPage() {
  const { user, ready } = useRequireRole('CARRIER');
  const [verification, setVerification] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function loadAll() {
    const [v, js, ts] = await Promise.all([
      api.myVerification(),
      api.searchJobs('?status=OPEN'),
      api.listTrips(),
    ]);
    setVerification(v);
    setJobs(js);
    setTrips(ts);
  }

  useEffect(() => {
    if (ready && user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  if (!ready || !user) return <p className="muted" style={{ padding: 40 }}>Loading…</p>;

  const vehicles = user.carrierProfile?.vehicles ?? [];
  const verified = verification?.verificationStatus === 'VERIFIED';
  const type = user.carrierProfile?.type;
  const label = type === 'INDIVIDUAL' ? 'Individual Driver' : 'Transport Company';

  async function placeBid(job: any, vehicleId: string, amount: number, eta: number) {
    setMsg('');
    try {
      await api.placeBid(job.id, { vehicleId, amount, etaMinutes: eta });
      setMsg(`✓ Bid of $${amount} placed on ${job.cropType} — the shipper sees it live.`);
    } catch (e: any) {
      setMsg(`Could not bid: ${e.message}`);
    }
  }

  async function advance(trip: any) {
    const next = (TRIP_TRANSITIONS[trip.status as TripStatus] ?? [])[0];
    if (!next) return;
    try {
      await api.tripStatus(trip.id, next);
      setTrips(await api.listTrips());
      setMsg(`✓ Delivery advanced to ${next.replace(/_/g, ' ').toLowerCase()}.`);
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function ping(trip: any) {
    const lat = (trip.job.pickupLat + trip.job.dropoffLat) / 2 + (Math.random() - 0.5) * 0.2;
    const lng = (trip.job.pickupLng + trip.job.dropoffLng) / 2 + (Math.random() - 0.5) * 0.2;
    await api.tripLocation(trip.id, lat, lng);
    setMsg(`📍 Location sent — the shipper sees it live.`);
  }

  return (
    <>
      <div className="between" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>{user.carrierProfile?.companyName ?? user.fullName}</h1>
          <span className={`badge ${type === 'INDIVIDUAL' ? 'grape' : 'green'}`}>{label}</span>{' '}
          <span className={`badge st-${verification?.verificationStatus}`}>{verification?.verificationStatus}</span>
        </div>
      </div>

      {!verified && (
        <div className="banner warn">⚠ You must be verified before bidding.</div>
      )}
      {msg && <div className="banner">{msg}</div>}

      {/* MY DELIVERIES — trips this carrier won */}
      {trips.length > 0 && (
        <>
          <h2>My deliveries</h2>
          {trips.map((t) => {
            const next = (TRIP_TRANSITIONS[t.status as TripStatus] ?? [])[0];
            return (
              <div key={t.id} className="card pop">
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
                    💰 Your payout: <strong>&nbsp;${t.job.settlement.driverPayout}</strong>&nbsp;
                    <span className="muted" style={{ fontSize: 12 }}>
                      (bid ${t.job.settlement.transportPrice} − {Math.round(t.job.settlement.carrierCommissionRate * 100)}% commission)
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
      )}

      <h2 style={{ marginTop: trips.length ? 26 : 0 }}>Open jobs to bid on</h2>
      {jobs.length === 0 && <p className="muted">No open jobs right now.</p>}
      <div className="grid">
        {jobs.map((j) => (
          <BidCard key={j.id} job={j} vehicles={vehicles} verified={verified} onBid={placeBid} />
        ))}
      </div>
    </>
  );
}

function BidCard({ job, vehicles, verified, onBid }: any) {
  const eligible = vehicles.filter(
    (v: any) => (!job.coldChainRequired || v.refrigerated) && v.capacityKg >= job.weightKg,
  );
  const [vehicleId, setVehicleId] = useState(eligible[0]?.id ?? '');
  const [amount, setAmount] = useState(Math.round(job.referencePrice ?? 950));
  const [eta, setEta] = useState(180);
  const inBand = job.floorPrice != null && amount >= job.floorPrice && amount <= job.ceilingPrice;

  return (
    <div className="card">
      <div className="between">
        <strong>{job.cropType} · {job.weightKg}kg</strong>
        {job.coldChainRequired && <span className="badge cold">❄ cold-chain</span>}
      </div>
      <p className="muted" style={{ fontSize: 13, margin: '6px 0 8px' }}>📍 {job.pickupAddress} → {job.dropoffAddress}</p>
      {job.referencePrice != null && (
        <div className="banner" style={{ margin: '0 0 12px', padding: '8px 12px', fontSize: 13 }}>
          💡 Suggested <strong>${job.floorPrice}–${job.ceilingPrice}</strong> (typical ~${job.referencePrice})
        </div>
      )}

      {eligible.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>
          No eligible vehicle (needs {job.coldChainRequired ? 'refrigerated, ' : ''}≥{job.weightKg}kg).
        </p>
      ) : (
        <>
          <div className="field">
            <label>Vehicle</label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {eligible.map((v: any) => (
                <option key={v.id} value={v.id}>{v.plate} {v.refrigerated ? '❄' : ''} ({v.capacityKg}kg)</option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>Bid ($)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
            <div className="field" style={{ flex: 1 }}><label>ETA (min)</label>
              <input type="number" value={eta} onChange={(e) => setEta(Number(e.target.value))} /></div>
          </div>
          {job.referencePrice != null && (
            <p style={{ fontSize: 12, margin: '0 0 8px', color: inBand ? 'var(--green-700)' : 'var(--harvest-dark)' }}>
              {inBand ? '✓ Within the fair range' : '⚠ Outside the suggested range'}
            </p>
          )}
          <button className="btn" style={{ width: '100%' }} disabled={!verified} onClick={() => onBid(job, vehicleId, amount, eta)}>
            {verified ? 'Place bid' : 'Verify to bid'}
          </button>
        </>
      )}
    </div>
  );
}
