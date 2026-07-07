import Link from 'next/link';

export default function Home() {
  return (
    <>
      <section className="landing-hero">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span className="pill">🌱 Farm-to-market logistics</span>
          <h1>From the field to the market —<br />every load, bid and mile in one place.</h1>
          <p className="lead2">
            AthenaGrid connects <strong>farmers and industries</strong> with <strong>transport
            companies and independent drivers</strong>. Post a load, get live competitive bids,
            award the fairest price, and track every delivery to the doorstep.
          </p>
          <div className="row" style={{ marginTop: 22 }}>
            <Link className="btn amber" href="/signup">Get started</Link>
            <Link
              className="btn"
              href="/login"
              style={{ background: 'rgba(255,255,255,0.16)', boxShadow: 'none', border: '1.5px solid rgba(255,255,255,0.5)' }}
            >
              Log in
            </Link>
          </div>
        </div>
        <svg className="hero-hills" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,64 C240,110 480,20 720,52 C960,84 1200,120 1440,72 L1440,120 L0,120 Z" fill="#f7f6f1" opacity="0.35" />
          <path d="M0,86 C260,120 520,54 780,80 C1040,106 1240,120 1440,96 L1440,120 L0,120 Z" fill="#f7f6f1" />
        </svg>
      </section>

      <p className="section-tag">Who posts the loads</p>
      <div className="grid">
        <Link className="card tile" href="/signup">
          <div className="ico">🌾</div>
          <h3>Farmer</h3>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>Ship your harvest to buyers — post a job, compare live bids, track it to delivery.</p>
        </Link>
        <Link className="card tile" href="/signup">
          <div className="ico">🏭</div>
          <h3>Industry</h3>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>Move farming essentials to growers, or bring crops in — post transport jobs the same way.</p>
        </Link>
      </div>

      <p className="section-tag">Who moves them</p>
      <div className="grid">
        <Link className="card tile" href="/signup">
          <div className="ico">🚚</div>
          <h3>Transport Company</h3>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>Bid with your fleet and run the deliveries — verified, cold-chain aware.</p>
        </Link>
        <Link className="card tile" href="/signup">
          <div className="ico">🧑‍✈️</div>
          <h3>Individual Driver</h3>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>Owner-operator? Bid on nearby loads and drive them yourself.</p>
        </Link>
      </div>

      <div className="about">
        <h2 style={{ marginTop: 0 }}>Why AthenaGrid</h2>
        <p className="muted" style={{ maxWidth: 760 }}>
          Getting food from a farm to a shelf is a logistics problem, and middlemen make it costly
          and opaque. We put the whole trip on one live marketplace: a <strong>fair-price band</strong>
          keeps offers honest for both sides, a transparent <strong>commission split</strong> means
          no surprises, and <strong>real-time tracking</strong> follows every load. Fewer middlemen,
          fairer prices, fresher produce.
        </p>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 18 }}>
          <div><div className="kpi">Live</div><p className="muted" style={{ margin: 0, fontSize: 13 }}>Real-time bidding</p></div>
          <div><div className="kpi">Fair</div><p className="muted" style={{ margin: 0, fontSize: 13 }}>Price band + scoring</p></div>
          <div><div className="kpi">Tracked</div><p className="muted" style={{ margin: 0, fontSize: 13 }}>Every delivery</p></div>
          <div><div className="kpi">Cold-chain</div><p className="muted" style={{ margin: 0, fontSize: 13 }}>Perishable-aware</p></div>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '30px 0 10px' }}>
        <Link className="btn" href="/signup">Create your free account</Link>
      </div>
    </>
  );
}
