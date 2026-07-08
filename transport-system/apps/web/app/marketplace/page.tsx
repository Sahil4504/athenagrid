'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api-client';
import { useRequireRole } from '../../lib/auth';

// Icons rendered client-side (never stored in the DB — see seed note).
const CAT_ICON: Record<string, string> = {
  SEEDS: '🌱', PESTICIDES: '🧴', FERTILIZER: '🧪', TOOLS: '🛠️',
};

export default function MarketplacePage() {
  const { user, ready } = useRequireRole('SHIPPER');
  const router = useRouter();
  const [industries, setIndustries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<{ industryId: string; name: string; lines: any[] } | null>(null);
  const [msg, setMsg] = useState('');

  // Farmers only.
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

  if (!ready || !user || user.shipperType !== 'FARMER')
    return <p className="muted" style={{ padding: 40 }}>Loading…</p>;

  function addToCart(industry: any, item: any) {
    setMsg('');
    setCart((prev) => {
      if (prev && prev.industryId !== industry.id) {
        // one order = one industry (single pickup location)
        if (!confirm(`Your cart has items from ${prev.name}. Replace with ${industry.name}?`)) return prev;
        prev = null;
      }
      const base = prev ?? { industryId: industry.id, name: industry.name, lines: [] as any[] };
      const existing = base.lines.find((l) => l.catalogItemId === item.id);
      const lines = existing
        ? base.lines.map((l) => (l.catalogItemId === item.id ? { ...l, qty: l.qty + 1 } : l))
        : [...base.lines, { catalogItemId: item.id, name: item.name, price: item.pricePerUnit, unit: item.unit, category: item.category, qty: 1 }];
      return { ...base, lines };
    });
  }
  function setQty(catalogItemId: string, qty: number) {
    setCart((prev) => {
      if (!prev) return prev;
      const lines = prev.lines.map((l) => (l.catalogItemId === catalogItemId ? { ...l, qty } : l)).filter((l) => l.qty > 0);
      return lines.length ? { ...prev, lines } : null;
    });
  }

  const itemsTotal = cart ? cart.lines.reduce((s, l) => s + l.price * l.qty, 0) : 0;
  const fee = Math.round(itemsTotal * 0.05 * 100) / 100;

  async function checkout() {
    if (!cart) return;
    setMsg('');
    try {
      await api.createOrder({
        industryId: cart.industryId,
        items: cart.lines.map((l) => ({ catalogItemId: l.catalogItemId, qty: l.qty })),
      });
      setCart(null);
      setMsg('✓ Order placed! A transport job was posted — drivers can bid now. Award it on your Farmer dashboard.');
      await load();
    } catch (e: any) {
      setMsg(`Could not order: ${e.message}`);
    }
  }

  return (
    <>
      <h1 style={{ fontSize: 28 }}>🛒 Industry Marketplace</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Farming essentials from industries near <strong>{user.address ?? 'you'}</strong>. Checkout auto-posts the delivery for drivers to bid on.
      </p>
      {msg && <div className="banner">{msg}</div>}

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 2, minWidth: 320 }}>
          <h2>Nearby industries</h2>
          {industries.length === 0 && <p className="muted">No industries found near you.</p>}
          {industries.map((ind, i) => (
            <div key={ind.id} className="card">
              <div className="between">
                <strong>{ind.name} {i === 0 && <span className="badge">nearest</span>}</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {ind.city}, {ind.state}{ind.distanceKm != null ? ` · ${ind.distanceKm} km` : ''}
                </span>
              </div>
              <div className="grid" style={{ marginTop: 12 }}>
                {ind.catalog.map((item: any) => (
                  <div key={item.id} className="card" style={{ margin: 0, padding: 12 }}>
                    <div style={{ fontSize: 22 }}>{CAT_ICON[item.category] ?? '📦'}</div>
                    <strong style={{ fontSize: 14 }}>{item.name}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{item.category.toLowerCase()} · per {item.unit}</div>
                    <div className="between" style={{ marginTop: 6 }}>
                      <strong>${item.pricePerUnit}</strong>
                      <button className="btn sm" onClick={() => addToCart(ind, item)}>Add</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <h2>Your cart</h2>
          {!cart ? (
            <div className="card"><p className="muted" style={{ margin: 0 }}>Empty — add items from one industry.</p></div>
          ) : (
            <div className="card pop">
              <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>From {cart.name}</p>
              {cart.lines.map((l) => (
                <div key={l.catalogItemId} className="between" style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 14 }}>{CAT_ICON[l.category] ?? '📦'} {l.name} <span className="muted">${l.price}/{l.unit}</span></div>
                  <input type="number" min={0} value={l.qty} style={{ width: 64 }} onChange={(e) => setQty(l.catalogItemId, Number(e.target.value))} />
                </div>
              ))}
              <div className="divider" />
              <div className="between"><span className="muted">Items</span><span>${Math.round(itemsTotal * 100) / 100}</span></div>
              <div className="between"><span className="muted">Marketplace fee (5%)</span><span>${fee}</span></div>
              <div className="between"><span className="muted" style={{ fontSize: 12 }}>+ transport (after a driver wins)</span><span className="muted">TBD</span></div>
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
              <p className="muted" style={{ fontSize: 13, margin: '6px 0' }}>
                {o.items.map((it: any) => `${it.name} ×${it.qty}`).join(', ')}
              </p>
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
              {!o.bill.transportAwarded && (
                <Link className="btn ghost sm" href="/shipper" style={{ marginTop: 8 }}>Award the delivery →</Link>
              )}
            </div>
          ))}
        </>
      )}
    </>
  );
}
