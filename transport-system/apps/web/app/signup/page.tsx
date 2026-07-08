'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, dashboardFor } from '../../lib/auth';

type Kind = 'FARMER' | 'INDUSTRY' | 'COMPANY' | 'INDIVIDUAL';

const KINDS: { key: Kind; ico: string; title: string; blurb: string }[] = [
  { key: 'FARMER', ico: '🌾', title: 'Farmer', blurb: 'Grow produce and ship it to market — post transport jobs.' },
  { key: 'INDUSTRY', ico: '🏭', title: 'Industry', blurb: 'Sell farming essentials or buy crops — post transport jobs.' },
  { key: 'COMPANY', ico: '🚚', title: 'Transport Company', blurb: 'Fleet operator — bid on jobs and run the deliveries.' },
  { key: 'INDIVIDUAL', ico: '🧑‍✈️', title: 'Individual Driver', blurb: 'Owner-operator — bid and drive the load yourself.' },
];

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [kind, setKind] = useState<Kind>('FARMER');
  const [form, setForm] = useState<any>({
    fullName: '', email: '', password: '', companyName: '',
    address: '', postalCode: '',
    licenceNo: '', vehiclePlate: '', vehicleCapacityKg: 3000, vehicleRefrigerated: false,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  async function submit() {
    setErr(''); setBusy(true);
    try {
      const dto: any = { email: form.email, password: form.password, fullName: form.fullName };
      if (kind === 'FARMER' || kind === 'INDUSTRY') {
        dto.role = 'SHIPPER';
        dto.shipperType = kind;
        if (kind === 'FARMER') {
          dto.address = form.address;
          dto.postalCode = form.postalCode;
        }
      } else {
        dto.role = 'CARRIER';
        dto.carrierType = kind === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL';
        if (kind === 'COMPANY') dto.companyName = form.companyName || form.fullName;
        if (kind === 'INDIVIDUAL') {
          dto.licenceNo = form.licenceNo;
          dto.vehiclePlate = form.vehiclePlate;
          dto.vehicleCapacityKg = Number(form.vehicleCapacityKg);
          dto.vehicleRefrigerated = !!form.vehicleRefrigerated;
        }
      }
      const me = await register(dto);
      router.replace(dashboardFor(me));
    } catch (e: any) {
      setErr(e.message || 'Could not create account');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h1>Create your account</h1>
      <p className="lead">Join AthenaGrid — pick what you are. You choose this only once.</p>

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
        <div className="field"><label>Full name / business name</label>
          <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} /></div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Email</label>
            <input value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="field" style={{ flex: 1 }}><label>Password (min 8)</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} /></div>
        </div>

        {kind === 'FARMER' && (
          <div className="row">
            <div className="field" style={{ flex: 2 }}><label>Farm address</label>
              <input value={form.address} placeholder="123 Orchard Rd, Fresno, CA" onChange={(e) => set('address', e.target.value)} /></div>
            <div className="field" style={{ flex: 1 }}><label>ZIP code</label>
              <input value={form.postalCode} placeholder="93721" onChange={(e) => set('postalCode', e.target.value)} /></div>
          </div>
        )}

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
