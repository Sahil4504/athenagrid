'use client';
import { useEffect, useState } from 'react';
import { api, getToken } from '../../lib/api-client';
import { useRequireRole } from '../../lib/auth';
import { useRealtime } from '../../lib/useRealtime';
import { TripStepper } from '../../components/TripStepper';

export default function ShipperPage() {
  const { user, ready } = useRequireRole('SHIPPER');
  const token = getToken();
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

  async function open(id: string) {
    const [job, bids] = await Promise.all([api.getJob(id), api.listBids(id)]);
    setSelected(job);
    setBidList(bids);
  }

  useEffect(() => {
    if (ready && user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  useEffect(() => {
    if (selected && events.length) open(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  if (!ready || !user) return <p className="muted" style={{ padding: 40 }}>Loading…</p>;

  const shipperKind = user.shipperType === 'INDUSTRY' ? 'Industry' : 'Farmer';

  // Scored bids: recommended first, then by score.
  const bids = [...bidList].sort(
    (a, b) => (b.assessment?.recommended ? 1 : 0) - (a.assessment?.recommended ? 1 : 0) ||
      (b.assessment?.score ?? 0) - (a.assessment?.score ?? 0),
  );

  return (
    <>
      <h1 style={{ fontSize: 28 }}>{shipperKind} dashboard</h1>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div className="banner" style={{ marginBottom: 14 }}>
            📦 Deliveries from your <a className="link" href="/marketplace">marketplace orders</a> appear here to award and track.
          </div>
          <h2 style={{ marginTop: 4 }}>My delivery jobs</h2>
          {jobs.length === 0 && <p className="muted">No delivery jobs yet — place an order in the marketplace.</p>}
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
