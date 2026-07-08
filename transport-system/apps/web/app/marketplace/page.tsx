'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api-client';
import { useRequireRole } from '../../lib/auth';

const CAT_ICON: Record<string, string> = { SEEDS: '🌱', PESTICIDES: '🧴', FERTILIZER: '🧪', TOOLS: '🛠️' };
const CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'SEEDS', label: 'Seed' },
  { key: 'PESTICIDES', label: 'Crop protection' },
  { key: 'FERTILIZER', label: 'Crop nutrition' },
  { key: 'TOOLS', label: 'Equipment' },
];

function ProductImg({ src, cat }: { src?: string; cat: string }) {
  const [err, setErr] = useState(false);
  if (err || !src) return <div className="pimg fallback">{CAT_ICON[cat] ?? '📦'}</div>;
  return <img className="pimg" src={src} alt="" loading="lazy" onError={() => setErr(true)} />;
}

export default function MarketplacePage() {
  const { user, ready } = useRequireRole('SHIPPER');
  const router = useRouter();
  const [industries, setIndustries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<{ industryId: string; name: string; lines: any[] } | null>(null);
  const [cat, setCat] = useState('ALL');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (ready && user && user.shipperType !== 'FARMER') router.replace('/shipper');
  }, [ready, user, router]);

  async function load() {
    const [ind, ord] = await Promise.all([api.marketplaceIndustries(), api.marketplaceOrders()]);
    setIndustries(ind);
    setOrders(ord);
  }
  useEffect(() => {
    if (ready && user?.shipperType === 'FARMER') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  // Flatten nearby vendors' catalogs into a searchable product feed.
  const products = useMemo(() => {
    const all: any[] = [];
    for (const ind of industries) {
      for (const it of ind.catalog ?? []) {
        all.push({ ...it, vendorId: ind.id, vendorName: ind.name, vendorCity: `${ind.city}, ${ind.state}`, distanceKm: ind.distanceKm });
      }
    }
    return all
      .filter((p) => (cat === 'ALL' || p.category === cat))
      .filter((p) => !q || `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || a.pricePerUnit - b.pricePerUnit);
  }, [industries, cat, q]);

  if (!ready || !user || user.shipperType !== 'FARMER')
    return <p className="muted" style={{ padding: 40 }}>Loading…</p>;

  function addToCart(p: any) {
    setMsg('');
    setCart((prev) => {
      if (prev && prev.industryId !== p.vendorId) {
        if (!confirm(`Your cart has items from ${prev.name}. Replace with ${p.vendorName}?`)) return prev;
        prev = null;
      }
      const base = prev ?? { industryId: p.vendorId, name: p.vendorName, lines: [] as any[] };
      const existing = base.lines.find((l) => l.catalogItemId === p.id);
      const lines = existing
        ? base.lines.map((l) => (l.catalogItemId === p.id ? { ...l, qty: l.qty + 1 } : l))
        : [...base.lines, { catalogItemId: p.id, name: p.name, price: p.pricePerUnit, unit: p.unit, category: p.category, qty: 1 }];
      return { ...base, lines };
    });
  }
  function setQty(id: string, qty: number) {
    setCart((prev) => {
      if (!prev) return prev;
      const lines = prev.lines.map((l) => (l.catalogItemId === id ? { ...l, qty } : l)).filter((l) => l.qty > 0);
      return lines.length ? { ...prev, lines } : null;
    });
  }

  const itemsTotal = cart ? cart.lines.reduce((s, l) => s + l.price * l.qty, 0) : 0;
  const fee = Math.round(itemsTotal * 0.05 * 100) / 100;

  async function checkout() {
    if (!cart) return;
    setMsg('');
    try {
      await api.createOrder({ industryId: cart.industryId, items: cart.lines.map((l) => ({ catalogItemId: l.catalogItemId, qty: l.qty })) });
      setCart(null);
      setMsg('✓ Order placed! A delivery job was posted — award it on your Farmer dashboard.');
      await load();
    } catch (e: any) {
      setMsg(`Could not order: ${e.message}`);
    }
  }

  return (
    <>
      <h1 style={{ fontSize: 28 }}>🛒 Industry Marketplace</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Farm inputs from vendors near <strong>{user.address ?? 'you'}</strong>. Checkout auto-posts the delivery for drivers to bid on.
      </p>
      {msg && <div className="banner">{msg}</div>}

      <div className="filterbar">
        {CATEGORIES.map((c) => (
          <button key={c.key} className={`fchip ${cat === c.key ? 'on' : ''}`} onClick={() => setCat(c.key)}>{c.label}</button>
        ))}
        <input placeholder="Search products or brands…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
      </div>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 3, minWidth: 320 }}>
          {industries.length === 0 && <p className="muted">No vendors found near you yet.</p>}
          {products.length === 0 && industries.length > 0 && <p className="muted">No products match your filter.</p>}
          <div className="pgrid">
            {products.map((p) => (
              <div key={p.id} className="pcard">
                <ProductImg src={p.imageUrl} cat={p.category} />
                <div className="pbody">
                  {p.brand && <span className="pbrand">{p.brand}</span>}
                  <span className="pname">{p.name}</span>
                  <span className="pvendor">{p.vendorName}{p.distanceKm != null ? ` · ${p.distanceKm} km` : ''}</span>
                  <div className="between" style={{ marginTop: 6 }}>
                    <span className="pprice">${p.pricePerUnit}<span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>/{p.unit}</span></span>
                    <button className="btn sm" onClick={() => addToCart(p)}>Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 250 }}>
          <h2>Your cart</h2>
          {!cart ? (
            <div className="card"><p className="muted" style={{ margin: 0 }}>Empty — add items from one vendor (one delivery per order).</p></div>
          ) : (
            <div className="card pop">
              <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>From {cart.name}</p>
              {cart.lines.map((l) => (
                <div key={l.catalogItemId} className="between" style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13 }}>{CAT_ICON[l.category] ?? '📦'} {l.name} <span className="muted">${l.price}</span></div>
                  <input type="number" min={0} value={l.qty} style={{ width: 60 }} onChange={(e) => setQty(l.catalogItemId, Number(e.target.value))} />
                </div>
              ))}
              <div className="divider" />
              <div className="between"><span className="muted">Items</span><span>${Math.round(itemsTotal * 100) / 100}</span></div>
              <div className="between"><span className="muted">Marketplace fee (5%)</span><span>${fee}</span></div>
              <div className="between"><span className="muted" style={{ fontSize: 12 }}>+ transport after a driver wins</span><span className="muted">TBD</span></div>
              <button className="btn" style={{ width: '100%', marginTop: 12 }} onClick={checkout}>Place order</button>
            </div>
          )}
        </div>
      </div>

      {orders.length > 0 && (
        <>
          <h2 style={{ marginTop: 26 }}>My orders</h2>
          {orders.map((o) => (
            <div key={o.id} className="card">
              <div className="between">
                <strong>{o.industry?.name}</strong>
                <span className={`badge st-${o.job?.status ?? 'PLACED'}`}>{o.job?.status ?? 'PLACED'}</span>
              </div>
              <p className="muted" style={{ fontSize: 13, margin: '6px 0' }}>{o.items.map((it: any) => `${it.name} ×${it.qty}`).join(', ')}</p>
              <table style={{ width: '100%', fontSize: 14 }}>
                <tbody>
                  <tr><td className="muted">Items</td><td style={{ textAlign: 'right' }}>${o.bill.itemsTotal}</td></tr>
                  <tr><td className="muted">Marketplace fee</td><td style={{ textAlign: 'right' }}>${o.bill.marketplaceFee}</td></tr>
                  <tr><td className="muted">Transport {o.bill.transportAwarded ? '' : '(pending — award on Farmer dashboard)'}</td>
                    <td style={{ textAlign: 'right' }}>{o.bill.transportAwarded ? `$${o.bill.transportTotal}` : '—'}</td></tr>
                  <tr style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ fontWeight: 700, paddingTop: 6 }}>{o.bill.transportAwarded ? 'Grand total' : 'So far'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--green-900)', paddingTop: 6 }}>${o.bill.grandTotal}</td></tr>
                </tbody>
              </table>
              {!o.bill.transportAwarded && <Link className="btn ghost sm" href="/shipper" style={{ marginTop: 8 }}>Award the delivery →</Link>}
            </div>
          ))}
        </>
      )}
    </>
  );
}
