import Link from 'next/link';

export default function Home() {
  return (
    <>
      <section className="hero">
        <span className="pill">🌱 Farm-to-market logistics</span>
        <h1>Move the harvest.<br />Bid, win, deliver — in real time.</h1>
        <p className="lead">
          Shippers post a load, verified carriers and drivers compete with live bids, the best
          offer wins, and every delivery is tracked to the doorstep.
        </p>
        <div className="row" style={{ marginTop: 20 }}>
          <Link className="btn" href="/shipper">Post a job</Link>
          <Link className="btn amber" href="/carrier">Bid on jobs</Link>
          <Link className="btn ghost" href="/signup">Create account</Link>
        </div>
      </section>

      <h2 style={{ marginTop: 34 }}>Pick your role</h2>
      <div className="grid">
        <Link className="card tile" href="/shipper">
          <div className="ico">🌾</div>
          <h3>Shipper</h3>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>Post a job, watch bids arrive live, award the best, track delivery.</p>
        </Link>
        <Link className="card tile" href="/carrier">
          <div className="ico">🚚</div>
          <h3>Carrier</h3>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>Company or individual — get verified, browse jobs, place competitive bids.</p>
        </Link>
        <Link className="card tile" href="/driver">
          <div className="ico">🧑‍✈️</div>
          <h3>Driver</h3>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>See assigned trips, advance each stage, stream live location.</p>
        </Link>
      </div>

      <div className="card" style={{ marginTop: 24, background: 'var(--green-50)', borderColor: 'var(--green-100)' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><div className="kpi">Live</div><p className="muted" style={{ margin: 0, fontSize: 13 }}>Real-time bid feed</p></div>
          <div><div className="kpi">Verified</div><p className="muted" style={{ margin: 0, fontSize: 13 }}>Carrier gating</p></div>
          <div><div className="kpi">Tracked</div><p className="muted" style={{ margin: 0, fontSize: 13 }}>Every delivery</p></div>
          <div><div className="kpi">Cold-chain</div><p className="muted" style={{ margin: 0, fontSize: 13 }}>Perishable-aware</p></div>
        </div>
      </div>
    </>
  );
}
