'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api-client';
import { useRequireRole } from '../../lib/auth';
import { ProductArt } from '../../lib/productArt';
import { photoFor } from '../../lib/productPhotos';

const CATEGORIES = [
  { key: 'ALL', label: 'All products', icon: '🛒' },
  { key: 'SEEDS', label: 'Seed', icon: '🌱' },
  { key: 'PESTICIDES', label: 'Crop protection', icon: '🧴' },
  { key: 'FERTILIZER', label: 'Crop nutrition', icon: '🧪' },
  { key: 'TOOLS', label: 'Equipment', icon: '🛠️' },
];
const SORTS = [
  { key: 'near', label: 'Nearest vendor' },
  { key: 'priceLow', label: 'Price: low to high' },
  { key: 'priceHigh', label: 'Price: high to low' },
  { key: 'rating', label: 'Top rated' },
];

function Stars({ rating = 0, reviews }: { rating?: number; reviews?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="stars" title={`${rating} out of 5`}>
      <span className="starfill" aria-hidden>
        {'★★★★★'.split('').map((_, i) => (
          <span key={i} className={i < full ? 'on' : i === full && half ? 'half' : ''}>★</span>
        ))}
      </span>
      {reviews != null && <span className="rcount">{rating?.toFixed(1)} ({reviews})</span>}
    </span>
  );
}

// Real photo if we have a reliable one; otherwise the in-app illustration (never broken).
function ProductImg({ src, imageKey, category }: { src?: string; imageKey?: string; category: string }) {
  const [err, setErr] = useState(false);
  const photo = photoFor(src, imageKey);
  if (photo && !err) return <img className="pimg" src={photo} alt="" loading="lazy" onError={() => setErr(true)} />;
  return <ProductArt className="pimg" imageKey={imageKey} category={category} />;
}

export default function MarketplacePage() {
  const { user, ready } = useRequireRole('SHIPPER');
  const router = useRouter();
  const [industries, setIndustries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<{ industryId: string; name: string; city: string; lines: any[] } | null>(null);
  const [cat, setCat] = useState('ALL');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('near');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && user && user.shipperType !== 'FARMER') router.replace('/shipper');
  }, [ready, user, router]);

  async function load() {
    setLoading(true);
    try {
      const [ind, ord] = await Promise.all([api.marketplaceIndustries(), api.marketplaceOrders()]);
      setIndustries(ind);
      setOrders(ord);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (ready && user?.shipperType === 'FARMER') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  const vendorStates = useMemo(
    () => Array.from(new Set(industries.map((i) => i.state).filter(Boolean))),
    [industries],
  );

  // Flatten nearby vendors' catalogs into one searchable product feed.
  const products = useMemo(() => {
    const all: any[] = [];
    for (const ind of industries) {
      for (const it of ind.catalog ?? []) {
        all.push({ ...it, vendorId: ind.id, vendorName: ind.name, vendorCity: `${ind.city}, ${ind.state}`, distanceKm: ind.distanceKm });
      }
    }
    const filtered = all
      .filter((p) => cat === 'ALL' || p.category === cat)
      .filter((p) => !q || `${p.name} ${p.brand} ${p.description ?? ''}`.toLowerCase().includes(q.toLowerCase()));
    filtered.sort((a, b) => {
      if (sort === 'priceLow') return a.pricePerUnit - b.pricePerUnit;
      if (sort === 'priceHigh') return b.pricePerUnit - a.pricePerUnit;
      if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      return (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9) || a.pricePerUnit - b.pricePerUnit;
    });
    return filtered;
  }, [industries, cat, q, sort]);

  if (!ready || !user || user.shipperType !== 'FARMER')
    return <p className="muted" style={{ padding: 40 }}>Loading…</p>;

  const qtyOf = (id: string) => cart?.lines.find((l) => l.catalogItemId === id)?.qty ?? 0;

  function addToCart(p: any) {
    setMsg('');
    setCart((prev) => {
      if (prev && prev.industryId !== p.vendorId) {
        if (!confirm(`Your cart has items from ${prev.name}. One order ships from one vendor. Replace with ${p.vendorName}?`)) return prev;
        prev = null;
      }
      const base = prev ?? { industryId: p.vendorId, name: p.vendorName, city: p.vendorCity, lines: [] as any[] };
      const existing = base.lines.find((l) => l.catalogItemId === p.id);
      const lines = existing
        ? base.lines.map((l) => (l.catalogItemId === p.id ? { ...l, qty: l.qty + 1 } : l))
        : [...base.lines, { catalogItemId: p.id, name: p.name, price: p.pricePerUnit, unit: p.unit, category: p.category, imageKey: p.imageKey, qty: 1 }];
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
  const cartCount = cart ? cart.lines.reduce((s, l) => s + l.qty, 0) : 0;

  async function checkout() {
    if (!cart) return;
    setMsg('');
    try {
      await api.createOrder({ industryId: cart.industryId, items: cart.lines.map((l) => ({ catalogItemId: l.catalogItemId, qty: l.qty })) });
      setCart(null);
      setMsg('✓ Order placed! A delivery job was posted — award a carrier on your Farmer dashboard to complete it.');
      await load();
    } catch (e: any) {
      setMsg(`Could not place order: ${e.message}`);
    }
  }

  return (
    <div className="mkt">
      {/* Hero */}
      <section className="mkt-hero">
        <div className="mkt-hero-in">
          <span className="mkt-eyebrow">AthenaGrid Marketplace</span>
          <h1>Everything your farm needs — delivered.</h1>
          <p>Seed, crop protection, nutrition and equipment from verified suppliers near you. Order in a click; a local carrier bids to deliver it to your gate.</p>
          <div className="mkt-search">
            <span aria-hidden>🔎</span>
            <input placeholder="Search seed, fertilizer, sprayers, brands…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="mkt-trust">
            <span>📍 Delivering to <strong>{user.address ?? 'your farm'}</strong></span>
            {industries.length > 0 && <span>🏬 {industries.length} suppliers nearby{vendorStates.length ? ` · ${vendorStates.join(', ')}` : ''}</span>}
          </div>
        </div>
      </section>

      {msg && <div className="banner" style={{ marginTop: 18 }}>{msg}</div>}

      {/* Category + sort bar */}
      <div className="mkt-bar">
        <div className="mkt-cats">
          {CATEGORIES.map((c) => (
            <button key={c.key} className={`catchip ${cat === c.key ? 'on' : ''}`} onClick={() => setCat(c.key)}>
              <span aria-hidden>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>
        <label className="mkt-sort">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mkt-grid-wrap">
        {/* Products */}
        <div className="mkt-main">
          {loading ? (
            <div className="pgrid">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="pcard skeleton" />)}
            </div>
          ) : industries.length === 0 ? (
            <div className="empty">
              <div className="empty-emoji">🌾</div>
              <h3>No suppliers found near you yet</h3>
              <p className="muted">Make sure your farm address is set on your profile so we can match nearby vendors.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty">
              <div className="empty-emoji">🔍</div>
              <h3>No products match “{q || CATEGORIES.find((c) => c.key === cat)?.label}”</h3>
              <button className="btn ghost sm" onClick={() => { setQ(''); setCat('ALL'); }}>Clear filters</button>
            </div>
          ) : (
            <>
              <p className="mkt-count muted">{products.length} products from {new Set(products.map((p) => p.vendorId)).size} suppliers</p>
              <div className="pgrid">
                {products.map((p) => {
                  const inCart = qtyOf(p.id);
                  return (
                    <div key={p.id} className="pcard">
                      <div className="pimg-wrap">
                        <ProductImg src={p.imageUrl} imageKey={p.imageKey} category={p.category} />
                        {p.distanceKm != null && <span className="pdist">{Math.round(p.distanceKm)} km</span>}
                      </div>
                      <div className="pbody">
                        {p.brand && <span className="pbrand">{p.brand}</span>}
                        <span className="pname">{p.name}</span>
                        <Stars rating={p.rating} reviews={p.reviews} />
                        {p.description && <span className="pdesc">{p.description}</span>}
                        <span className="pvendor">🏬 {p.vendorName}</span>
                        <div className="pfoot">
                          <span className="pprice">${p.pricePerUnit}<span className="punit">/{p.unit}</span></span>
                          {inCart ? (
                            <div className="qstep">
                              <button onClick={() => setQty(p.id, inCart - 1)} aria-label="decrease">−</button>
                              <span>{inCart}</span>
                              <button onClick={() => addToCart(p)} aria-label="increase">+</button>
                            </div>
                          ) : (
                            <button className="btn sm" onClick={() => addToCart(p)}>Add</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sticky cart */}
        <aside className="mkt-cart">
          <div className="cartcard">
            <div className="between">
              <h2 style={{ margin: 0 }}>Your cart</h2>
              {cartCount > 0 && <span className="cartpill">{cartCount}</span>}
            </div>
            {!cart ? (
              <p className="muted" style={{ fontSize: 13 }}>Your cart is empty. Add items from one supplier — each order is a single delivery.</p>
            ) : (
              <>
                <p className="muted cartfrom">From <strong>{cart.name}</strong> · {cart.city}</p>
                <div className="cartlines">
                  {cart.lines.map((l) => (
                    <div key={l.catalogItemId} className="cartline">
                      <ProductArt className="cartthumb" imageKey={l.imageKey} category={l.category} />
                      <div className="cartline-mid">
                        <span className="cartline-name">{l.name}</span>
                        <span className="muted" style={{ fontSize: 12 }}>${l.price}/{l.unit}</span>
                      </div>
                      <div className="qstep sm">
                        <button onClick={() => setQty(l.catalogItemId, l.qty - 1)}>−</button>
                        <span>{l.qty}</span>
                        <button onClick={() => setQty(l.catalogItemId, l.qty + 1)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="divider" />
                <div className="between"><span className="muted">Items</span><span>${Math.round(itemsTotal * 100) / 100}</span></div>
                <div className="between"><span className="muted">Marketplace fee (5%)</span><span>${fee}</span></div>
                <div className="between"><span className="muted" style={{ fontSize: 12 }}>Transport (after a carrier wins)</span><span className="muted">TBD</span></div>
                <div className="divider" />
                <div className="between" style={{ fontWeight: 800 }}><span>Subtotal</span><span style={{ color: 'var(--green-900)' }}>${Math.round((itemsTotal + fee) * 100) / 100}</span></div>
                <button className="btn" style={{ width: '100%', marginTop: 12 }} onClick={checkout}>Place order →</button>
                <p className="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>Checkout posts a delivery job for carriers to bid on.</p>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Orders */}
      {orders.length > 0 && (
        <section style={{ marginTop: 34 }}>
          <h2>My orders</h2>
          <div className="orders">
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
          </div>
        </section>
      )}
    </div>
  );
}
