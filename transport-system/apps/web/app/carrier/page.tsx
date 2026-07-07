'use client';
import { useState } from 'react';
import { api } from '../../lib/api-client';
import { AuthPanel } from '../../components/AuthPanel';

export default function CarrierPage() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any | null>(null);
  const [verification, setVerification] = useState<any | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function afterAuth(t: string) {
    setToken(t);
    const [meRes, v, js] = await Promise.all([api.me(), api.myVerification(), api.searchJobs('?status=OPEN')]);
    setMe(meRes);
    setVerification(v);
    setVehicles(meRes.carrierProfile?.vehicles ?? []);
    setJobs(js);
  }

  async function placeBid(job: any, vehicleId: string, amount: number, eta: number) {
    setMsg('');
    try {
      await api.placeBid(job.id, { vehicleId, amount, etaMinutes: eta });
      setMsg(`✓ Bid of $${amount} placed on ${job.cropType} — the shipper sees it live.`);
    } catch (e: any) {
      setMsg(`Could not bid: ${e.message}`);
    }
  }

  if (!token)
    return (
      <AuthPanel
        title="Carrier sign-in"
        subtitle="Company or individual driver. Bid on open transport jobs."
        accounts={[
          { label: 'ColdHaul (company)', email: 'carrier@athenagrid.dev' },
          { label: 'ValleyFreight (company)', email: 'carrier2@athenagrid.dev' },
          { label: 'Ravi (individual)', email: 'indie@athenagrid.dev' },
        ]}
        onAuthed={afterAuth}
      />
    );

  const verified = verification?.verificationStatus === 'VERIFIED';
  const type = me?.carrierProfile?.type;

  return (
    <>
      <div className="between" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>{me?.carrierProfile?.companyName ?? me?.fullName}</h1>
          <span className={`badge ${type === 'INDIVIDUAL' ? 'grape' : 'green'}`}>
            {type === 'INDIVIDUAL' ? 'Individual driver' : 'Carrier company'}
          </span>{' '}
          <span className={`badge st-${verification?.verificationStatus}`}>{verification?.verificationStatus}</span>
        </div>
      </div>

      {!verified && (
        <div className="banner warn">
          ⚠ You must be verified before bidding. Required docs: {verification?.requiredDocs?.join(', ')}.
        </div>
      )}
      {msg && <div className="banner">{msg}</div>}

      <h2>Open jobs</h2>
      {jobs.length === 0 && <p className="muted">No open jobs right now. Post one from the Shipper screen.</p>}
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
      <p className="muted" style={{ fontSize: 13, margin: '6px 0 8px' }}>
        📍 {job.pickupAddress} → {job.dropoffAddress}
      </p>
      {job.referencePrice != null && (
        <div className="banner" style={{ margin: '0 0 12px', padding: '8px 12px', fontSize: 13 }}>
          💡 Suggested fair range <strong>${job.floorPrice}–${job.ceilingPrice}</strong> (typical ~${job.referencePrice})
        </div>
      )}

      {eligible.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>
          No eligible vehicle (needs {job.coldChainRequired ? 'refrigerated, ' : ''}≥{job.weightKg}kg capacity).
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
              {inBand ? '✓ Within the fair range' : '⚠ Outside the suggested range — may be flagged'}
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
