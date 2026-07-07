'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';

type Kind = 'SHIPPER' | 'COMPANY' | 'INDIVIDUAL';

const KINDS: { key: Kind; ico: string; title: string; blurb: string }[] = [
  { key: 'SHIPPER', ico: '🌾', title: 'Shipper', blurb: 'Farm, industry or shop that posts transport jobs.' },
  { key: 'COMPANY', ico: '🚚', title: 'Carrier company', blurb: 'Fleet operator that bids and assigns drivers.' },
  { key: 'INDIVIDUAL', ico: '🧑‍✈️', title: 'Individual driver', blurb: 'Owner-operator who bids and drives themselves.' },
];

export default function SignupPage() {
  const [kind, setKind] = useState<Kind>('COMPANY');
  const [form, setForm] = useState<any>({
    fullName: '', email: '', password: '', companyName: '',
    licenceNo: '', vehiclePlate: '', vehicleCapacityKg: 3000, vehicleRefrigerated: false,
  });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  async function submit() {
    setErr(''); setBusy(true);
    try {
      const dto: any = {
        role: kind === 'SHIPPER' ? 'SHIPPER' : 'CARRIER',
        email: form.email,
        password: form.password,
        fullName: form.fullName,
      };
      if (kind === 'COMPANY') { dto.carrierType = 'COMPANY'; dto.companyName = form.companyName || form.fullName; }
      if (kind === 'INDIVIDUAL') {
        dto.carrierType = 'INDIVIDUAL';
        dto.licenceNo = form.licenceNo;
        dto.vehiclePlate = form.vehiclePlate;
        dto.vehicleCapacityKg = Number(form.vehicleCapacityKg);
        dto.vehicleRefrigerated = !!form.vehicleRefrigerated;
      }
      await api.register(dto);
      setDone(true);
    } catch (e: any) {
      setErr(e.message || 'Could not create account');
    } finally { setBusy(false); }
  }

  if (done)
    return (
      <div className="card pop" style={{ maxWidth: 460, margin: '32px auto' }}>
        <h2>Account created 🎉</h2>
        <p className="muted">
          Welcome to AthenaGrid. {kind === 'SHIPPER'
            ? 'Head to the Shipper screen to post your first job.'
            : 'Carriers must be verified before bidding — sign in and complete verification.'}
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          {kind === 'SHIPPER'
            ? <Link className="btn" href="/shipper">Go to Shipper</Link>
            : <Link className="btn" href="/carrier">Go to Carrier</Link>}
          <Link className="btn ghost" href="/">Home</Link>
        </div>
      </div>
    );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1>Create your account</h1>
      <p className="lead">Join the marketplace as a shipper, a carrier company, or an individual driver.</p>

      <div className="grid" style={{ margin: '18px 0' }}>
        {KINDS.map((k) => (
          <div
            key={k.key}
            className="card"
            onClick={() => setKind(k.key)}
            style={{ cursor: 'pointer', borderColor: kind === k.key ? 'var(--green-500)' : undefined, borderWidth: kind === k.key ? 2 : 1 }}
          >
            <div className="ico" style={{ fontSize: 28 }}>{k.ico}</div>
            <h3>{k.title}</h3>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>{k.blurb}</p>
          </div>
        ))}
      </div>

      <div className="card">
        {err && <div className="banner err">{err}</div>}
        <div className="field"><label>Full name</label>
          <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} /></div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Email</label>
            <input value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="field" style={{ flex: 1 }}><label>Password (min 8)</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} /></div>
        </div>

        {kind === 'COMPANY' && (
          <div className="field"><label>Company name</label>
            <input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} /></div>
        )}

        {kind === 'INDIVIDUAL' && (
          <>
            <div className="field"><label>Driving licence no.</label>
              <input value={form.licenceNo} onChange={(e) => set('licenceNo', e.target.value)} /></div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}><label>Vehicle plate</label>
                <input value={form.vehiclePlate} onChange={(e) => set('vehiclePlate', e.target.value)} /></div>
              <div className="field" style={{ flex: 1 }}><label>Capacity (kg)</label>
                <input type="number" value={form.vehicleCapacityKg} onChange={(e) => set('vehicleCapacityKg', e.target.value)} /></div>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={form.vehicleRefrigerated}
                onChange={(e) => set('vehicleRefrigerated', e.target.checked)} />
              Refrigerated / cold-chain capable
            </label>
          </>
        )}

        <button className="btn" style={{ marginTop: 14 }} disabled={busy || !form.email || !form.fullName} onClick={submit}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </div>
    </div>
  );
}
