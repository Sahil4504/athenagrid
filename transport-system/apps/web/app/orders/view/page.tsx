'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api-client';
import { useRequireRole } from '../../../lib/auth';
import { orderStatus, type OrderStatus } from '../../../lib/orderStatus';

const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;
const initials = (name?: string) =>
  (name ?? 'Carrier').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function OrderPage() {
  const { user, ready } = useRequireRole('SHIPPER');
  const router = useRouter();
  const [id, setId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [msg, setMsg] = useState('');

  // Client-only: read the order id from the query string (?id=...).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setId(p.get('id') ?? '');
  }, []);

  useEffect(() => {
    if (ready && user && user.shipperType !== 'FARMER') router.replace('/shipper');
  }, [ready, user, router]);

  async function load() {
    if (!id) return;
    try {
      const o = await api.marketplaceOrder(id);
      setOrder(o);
      const st = orderStatus(o);
      if (o.job?.id && (st.key === 'CHOOSE' || st.key === 'COLLECTING')) {
        const b = await api.listBids(o.job.id);
        setBids(Array.isArray(b) ? b : []);
      } else {
        setBids([]);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (ready && user?.shipperType === 'FARMER' && id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, id]);

  if (!ready || !user || user.shipperType !== 'FARMER' || (loading && !notFound))
    return <p className="muted" style={{ padding: 40 }}>Loading…</p>;
  if (notFound || !order)
    return (
      <div className="empty">
        <div className="empty-emoji">📦</div>
        <h3>Order not found</h3>
        <Link className="btn ghost sm" href="/orders">Back to My orders</Link>
      </div>
    );

  const st: OrderStatus = orderStatus(order);
  // Recommended first, then best score (mirrors the carrier-bid ranking).
  const ranked = [...bids].sort(
    (a, b) =>
      (b.assessment?.recommended ? 1 : 0) - (a.assessment?.recommended ? 1 : 0) ||
      (b.assessment?.score ?? 0) - (a.assessment?.score ?? 0),
  );
  const top = ranked.slice(0, 3);

  async function pick(bid: any) {
    setMsg('');
    try {
      await api.award(order.job.id, bid.id);
      setMsg(`✓ ${bid.carrier?.companyName ?? 'Driver'} selected — they'll pick up your order and deliver it. Track it anytime from My dashboard.`);
      await load();
    } catch (e: any) {
      setMsg(`Could not select driver: ${e.message}`);
    }
  }

  const b = order.bill;
  const orderNo = `#${String(order.id).slice(-5).toUpperCase()}`;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link href="/orders" className="link" style={{ fontSize: 13 }}>← My orders</Link>

      {/* Status header */}
      {st.key === 'CHOOSE' || st.key === 'COLLECTING' ? (
        <div className="banner" style={{ marginTop: 12 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <strong>Your delivery job has been placed</strong>
            <div className="muted" style={{ fontSize: 13 }}>
              Order {orderNo} · {order.industry?.name}. {st.key === 'CHOOSE'
                ? 'Pick your driver from the top bids below.'
                : "We're collecting carrier bids now."}
            </div>
          </div>
        </div>
      ) : (
        <div className="banner" style={{ marginTop: 12 }}>
          <span style={{ fontSize: 20 }}>{st.key === 'DELIVERED' ? '📬' : '🚚'}</span>
          <div>
            <strong>{st.key === 'DELIVERED' ? 'Order delivered' : 'Driver on the way'}</strong>
            <div className="muted" style={{ fontSize: 13 }}>Order {orderNo} · {order.industry?.name}</div>
          </div>
        </div>
      )}

      {msg && <div className="banner" style={{ background: 'var(--green-50)' }}>{msg}</div>}

      {/* Bill */}
      <div className="card">
        <div className="between" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8, marginBottom: 6 }}>
          <strong>Order summary</strong>
          <span className={`badge st-${st.badge}`}>{st.label}</span>
        </div>
        {order.items.map((it: any) => (
          <div key={it.id} className="between" style={{ fontSize: 14, padding: '3px 0' }}>
            <span className="muted">{it.name} ×{it.qty}</span>
            <span>{money(it.lineTotal)}</span>
          </div>
        ))}
        <div className="divider" />
        <div className="between" style={{ fontSize: 14 }}><span className="muted">Items subtotal</span><span>{money(b.itemsTotal)}</span></div>
        <div className="between" style={{ fontSize: 14 }}><span className="muted">Marketplace fee (5%)</span><span>{money(b.marketplaceFee)}</span></div>
        <div className="between" style={{ fontSize: 14 }}>
          <span className="muted">Transport {b.transportAwarded ? '' : '(set when you pick a driver)'}</span>
          <span className={b.transportAwarded ? '' : 'muted'}>{b.transportAwarded ? money(b.transportTotal) : 'pending'}</span>
        </div>
        <div className="divider" />
        <div className="between"><strong>{b.transportAwarded ? 'Grand total' : 'Total so far'}</strong>
          <strong style={{ color: 'var(--green-900)', fontSize: 18 }}>{money(b.grandTotal)}</strong></div>
      </div>

      {/* Driver selection */}
      {st.key === 'CHOOSE' && (
        <>
          <div className="between" style={{ margin: '22px 2px 12px' }}>
            <h2 style={{ margin: 0 }}>Choose your driver</h2>
            <button className="chip" onClick={load}>↻ Refresh bids</button>
          </div>
          <p className="muted" style={{ marginTop: -4, fontSize: 13 }}>
            The top {top.length} bid{top.length > 1 ? 's' : ''} for your delivery. We flag the best value as recommended — the choice is yours.
          </p>
          {top.map((bid: any) => {
            const rec = bid.assessment?.recommended;
            return (
              <div key={bid.id} className={`bidrow ${rec ? 'rec' : ''}`}>
                <div className="bidav">{initials(bid.carrier?.companyName)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong>{bid.carrier?.companyName ?? 'Carrier'}</strong>
                    {bid.carrier?.type === 'INDIVIDUAL' && <span className="muted" style={{ fontSize: 12 }}>individual</span>}
                    {rec && <span className="badge">⭐ Recommended</span>}
                  </div>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    🕒 ETA {bid.etaMinutes}m · you'd pay {money(bid.settlementPreview?.farmerTotal ?? 0)} · carrier nets {money(bid.settlementPreview?.driverPayout ?? 0)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800 }}>{money(bid.amount)}</div>
                  <button className="btn sm" style={{ marginTop: 4 }} onClick={() => pick(bid)}>Select</button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {st.key === 'COLLECTING' && (
        <div className="card" style={{ textAlign: 'center', padding: '30px 18px', marginTop: 18 }}>
          <div style={{ fontSize: 30 }}>⏳</div>
          <h3 style={{ margin: '8px 0 4px' }}>Driver selection in progress</h3>
          <p className="muted" style={{ fontSize: 13, maxWidth: 400, margin: '0 auto' }}>
            Carriers are placing bids on your delivery now — this can take a little while. You can safely leave this page; your order will show <strong>Choose driver</strong> under My orders as soon as bids are in.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
            <Link className="btn ghost sm" href="/marketplace">Back to marketplace</Link>
            <button className="btn sm" onClick={load}>↻ Check for bids</button>
          </div>
        </div>
      )}

      {(st.key === 'AWARDED' || st.key === 'TRANSIT' || st.key === 'DELIVERED') && (
        <div className="card" style={{ marginTop: 18 }}>
          <strong>Delivery</strong>
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 10px' }}>
            {st.key === 'DELIVERED'
              ? 'This order has been delivered.'
              : 'A carrier has been selected and is handling your delivery.'}
          </p>
          <Link className="btn ghost sm" href="/shipper">Track delivery →</Link>
        </div>
      )}
    </div>
  );
}
