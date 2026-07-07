'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api-client';
import { useRealtime } from '../../lib/useRealtime';
import { TripStepper } from '../../components/TripStepper';
import { AuthPanel } from '../../components/AuthPanel';

export default function ShipperPage() {
  const [token, setToken] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [bidList, setBidList] = useState<any[]>([]);
  const { events } = useRealtime('job', selected?.id ?? null, token);

  async function refresh() {
    const [open, awarded, transit] = await Promise.all([
      api.searchJobs('?status=OPEN'),
      api.searchJobs('?status=AWARDED'),
      api.searchJobs('?status=IN_TRANSIT'),
    ]);
    setJobs([...open, ...awarded, ...transit]);
  }

  async function afterAuth(t: string) {
    setToken(t);
    await refresh();
  }

  async function open(id: string) {
    const [job, bids] = await Promise.all([api.getJob(id), api.listBids(id)]);
    setSelected(job);
    setBidList(bids);
  }

  useEffect(() => {
    if (selected && events.length) open(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  if (!token)
    return (
      <AuthPanel
        title="Shipper sign-in"
        subtitle="Post transport jobs and award the best bid."
        accounts={[{ label: 'Fresno Farm Co', email: 'farmer@athenagrid.dev' }]}
        onAuthed={afterAuth}
      />
    );

  // Scored bids: recommended first, then by score.
  const bids = [...bidList].sort(
    (a, b) => (b.assessment?.recommended ? 1 : 0) - (a.assessment?.recommended ? 1 : 0) ||
      (b.assessment?.score ?? 0) - (a.assessment?.score ?? 0),
  );

  return (
    <>
      <h1 style={{ fontSize: 28 }}>Shipper dashboard</h1>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <PostJob onPosted={refresh} />
          <h2 style={{ marginTop: 22 }}>Jobs</h2>
          {jobs.length === 0 && <p className="muted">No jobs yet — post one above.</p>}
          {jobs.map((j) => (
            <div key={j.id} className="card" style={{ borderColor: selected?.id === j.id ? 'var(--green-500)' : undefined }}>
              <div className="between">
                <strong>{j.cropType} · {j.weightKg}kg</strong>
                <span className={`badge st-${j.status}`}>{j.status}</span>
              </div>
              <p className="muted" style={{ fontSize: 13, margin: '6px 0 12px' }}>📍 {j.pickupAddress} → {j.dropoffAddress}</p>
              <button className="btn ghost sm" onClick={() => open(j.id)}>Open</button>
            </div>
          ))}
        </div>

        {selected && (
          <div style={{ flex: 1, minWidth: 300 }}>
            <div className="between">
              <h2 style={{ margin: 0 }}>{selected.cropType}</h2>
              <span className={`badge st-${selected.status}`}>{selected.status}</span>
            </div>

            {selected.referencePrice != null && selected.status === 'OPEN' && (
              <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
                Fair range ${selected.floorPrice}–${selected.ceilingPrice} · typical ~${selected.referencePrice}
              </p>
            )}

            {selected.status === 'OPEN' && (
              <div style={{ marginTop: 6 }}>
                <p className="muted" style={{ fontSize: 13 }}>🟢 Live bid feed — {events.length} update(s)</p>
                {bids.length === 0 && <div className="card"><p className="muted" style={{ margin: 0 }}>No bids yet — they appear here the instant a carrier bids.</p></div>}
                {bids.map((b: any) => {
                  const rec = b.assessment?.recommended;
                  return (
                    <div key={b.id} className="card" style={{ borderColor: rec ? 'var(--green-500)' : undefined, borderWidth: rec ? 2 : 1 }}>
                      <div className="between">
                        <div>
                          <strong style={{ fontSize: 18 }}>${b.amount}</strong>{' '}
                          {rec && <span className="badge">⭐ Recommended</span>}
                          {!b.assessment?.withinBand && <span className="badge amber">out of range</span>}
                          <div className="muted" style={{ fontSize: 13 }}>
                            {b.carrier?.companyName ?? 'Carrier'}
                            {b.carrier?.type === 'INDIVIDUAL' ? ' (individual)' : ''} · ETA {b.etaMinutes}m
                          </div>
                          {b.assessment?.note && <div className="muted" style={{ fontSize: 12 }}>{b.assessment.note}</div>}
                          {b.settlementPreview && (
                            <div style={{ fontSize: 12, color: 'var(--green-700)' }}>
                              You’d pay ${b.settlementPreview.farmerTotal} · carrier nets ${b.settlementPreview.driverPayout}
                            </div>
                          )}
                        </div>
                        <button className="btn" onClick={() => api.award(selected.id, b.id).then(() => { open(selected.id); refresh(); })}>Award</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selected.settlement && <Invoice s={selected.settlement} />}
            {selected.trip && <TripTracker trip={selected.trip} token={token} />}
          </div>
        )}
      </div>
    </>
  );
}

function PostJob({ onPosted }: { onPosted: () => void }) {
  const [cropType, setCrop] = useState('Tomatoes');
  const [weightKg, setWeight] = useState(3000);
  const [pickup, setPickup] = useState('Salinas, CA');
  const [dropoff, setDropoff] = useState('San Francisco, CA');
  const [cold, setCold] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState('');

  async function post() {
    setBusy(true); setOk('');
    try {
      const now = Date.now();
      await api.createJob({
        pickup: { lat: 36.6777, lng: -121.6555, address: pickup },
        dropoff: { lat: 37.7749, lng: -122.4194, address: dropoff },
        cargo: { cropType, weightKg: Number(weightKg), volumeM3: 18, perishabilityIndex: cold ? 0.8 : 0.3, coldChainRequired: cold },
        pickupWindowStart: new Date(now + 6 * 3600_000).toISOString(),
        pickupWindowEnd: new Date(now + 12 * 3600_000).toISOString(),
        biddingClosesAt: new Date(now + 3 * 3600_000).toISOString(),
        budgetCeiling: 1500,
      } as any);
      setOk('✓ Job posted — carriers can bid now.');
      onPosted();
    } finally { setBusy(false); }
  }

  return (
    <div className="card pop">
      <h3>Post a transport job</h3>
      {ok && <div className="banner" style={{ marginTop: 8 }}>{ok}</div>}
      <div className="row">
        <div className="field" style={{ flex: 2 }}><label>Crop</label>
          <input value={cropType} onChange={(e) => setCrop(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Weight (kg)</label>
          <input type="number" value={weightKg} onChange={(e) => setWeight(Number(e.target.value))} /></div>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}><label>Pickup</label>
          <input value={pickup} onChange={(e) => setPickup(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Dropoff</label>
          <input value={dropoff} onChange={(e) => setDropoff(e.target.value)} /></div>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={cold} onChange={(e) => setCold(e.target.checked)} />
        ❄ Requires refrigerated / cold-chain transport
      </label>
      <button className="btn" style={{ marginTop: 12 }} disabled={busy} onClick={post}>{busy ? 'Posting…' : 'Post job'}</button>
    </div>
  );
}

function Invoice({ s }: { s: any }) {
  return (
    <div className="card pop" style={{ marginTop: 14 }}>
      <h3>🧾 Your bill</h3>
      <table style={{ width: '100%', fontSize: 14 }}>
        <tbody>
          <tr><td className="muted" style={{ padding: '4px 0' }}>Transport charge</td><td style={{ textAlign: 'right' }}>${s.transportPrice}</td></tr>
          <tr><td className="muted" style={{ padding: '4px 0' }}>Platform service fee ({Math.round(s.shipperFeeRate * 100)}%)</td><td style={{ textAlign: 'right' }}>${s.shipperFee}</td></tr>
          <tr style={{ borderTop: '1px solid var(--line)' }}>
            <td style={{ padding: '8px 0', fontWeight: 700 }}>Total payable</td>
            <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 18, color: 'var(--green-900)' }}>${s.farmerTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TripTracker({ trip, token }: { trip: any; token: string | null }) {
  const { events } = useRealtime('trip', trip.id, token);
  const statusEvent = events.find((e) => e.type === 'trip:status') as any;
  const status = statusEvent?.status ?? trip.status;
  const loc = events.find((e) => e.type === 'trip:location') as any;

  return (
    <div className="card pop" style={{ marginTop: 14, borderColor: 'var(--green-500)' }}>
      <div className="between"><h3 style={{ margin: 0 }}>🛰 Live tracking</h3>
        <span className={`badge st-${status}`}>{String(status).replace(/_/g, ' ')}</span></div>
      <TripStepper status={status} />
      <p className="muted" style={{ fontSize: 13, margin: '8px 0 0' }}>
        {loc ? `📍 Last location: ${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}` : 'Awaiting first GPS ping from the driver…'}
        {' · '}{events.length} live update(s)
      </p>
    </div>
  );
}
