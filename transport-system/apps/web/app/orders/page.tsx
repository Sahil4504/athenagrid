'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api-client';
import { useRequireRole } from '../../lib/auth';
import { orderStatus } from '../../lib/orderStatus';

const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;
const STATUS_ICON: Record<string, string> = {
  COLLECTING: '⏳', CHOOSE: '📦', AWARDED: '🚚', TRANSIT: '🚚', DELIVERED: '📬', PLACED: '⏳',
};

export default function OrdersPage() {
  const { user, ready } = useRequireRole('SHIPPER');
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && user && user.shipperType !== 'FARMER') router.replace('/shipper');
  }, [ready, user, router]);

  async function load() {
    setLoading(true);
    try {
      setOrders(await api.marketplaceOrders());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (ready && user?.shipperType === 'FARMER') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  if (!ready || !user || user.shipperType !== 'FARMER')
    return <p className="muted" style={{ padding: 40 }}>Loading…</p>;

  const needsAction = orders.filter((o) => orderStatus(o).key === 'CHOOSE').length;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="between" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 2 }}>📦 My orders</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            {needsAction > 0
              ? `${needsAction} order${needsAction > 1 ? 's' : ''} ready for you to choose a driver.`
              : 'Track your marketplace orders and pick drivers here.'}
          </p>
        </div>
        <button className="chip" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? (
        <p className="muted">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">🛒</div>
          <h3>No orders yet</h3>
          <p className="muted">Order farm inputs from the marketplace and they'll show up here.</p>
          <Link className="btn ghost sm" href="/marketplace">Go to marketplace</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          {orders.map((o) => {
            const st = orderStatus(o);
            const choose = st.key === 'CHOOSE';
            const orderNo = `#${String(o.id).slice(-5).toUpperCase()}`;
            return (
              <Link
                key={o.id}
                href={`/orders/view?id=${o.id}`}
                className={`card orow ${choose ? 'orow-hot' : ''}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <span style={{ fontSize: 22 }}>{STATUS_ICON[st.key] ?? '📦'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong>Order {orderNo}</strong>
                    <span className={`badge st-${st.badge}`}>{st.label}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.industry?.name} · {o.items.map((it: any) => `${it.name} ×${it.qty}`).join(', ')}
                  </div>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    {st.key === 'COLLECTING' && "We'll show drivers here as soon as bids arrive"}
                    {choose && `${o.job?.bids?.length ?? 0} bid(s) in — pick your driver`}
                    {(st.key === 'AWARDED' || st.key === 'TRANSIT') && 'Driver selected · delivery underway'}
                    {st.key === 'DELIVERED' && 'Delivered'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: 'var(--green-900)' }}>
                    {money(o.bill.grandTotal)}
                  </div>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {o.bill.transportAwarded ? 'total' : 'so far'}
                  </span>
                  <div className={`btn sm ${choose ? '' : 'ghost'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                    {choose ? 'Choose driver' : 'View'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
