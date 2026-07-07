'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, dashboardFor } from '../../lib/auth';

const DEMO = [
  { label: 'Farmer', email: 'farmer@athenagrid.dev' },
  { label: 'Transport Co.', email: 'carrier@athenagrid.dev' },
  { label: 'Individual', email: 'indie@athenagrid.dev' },
];

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(dashboardFor(user));
  }, [ready, user, router]);

  async function signIn(withEmail: string) {
    setErr('');
    setBusy(true);
    try {
      const me = await login(withEmail, password);
      router.replace(dashboardFor(me));
    } catch (e: any) {
      setErr(e.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card pop" style={{ maxWidth: 440, margin: '40px auto' }}>
      <h2>Welcome back</h2>
      <p className="muted" style={{ marginTop: -6 }}>
        One login for everyone — we'll take you to your dashboard automatically.
      </p>

      {err && <div className="banner err" style={{ marginTop: 12 }}>{err}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          signIn(email);
        }}
      >
        <div className="field" style={{ marginTop: 14 }}>
          <label>Email</label>
          <input value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn" style={{ width: '100%' }} disabled={busy || !email} type="submit">
          {busy ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <div className="divider" />
      <p className="muted" style={{ fontSize: 13, margin: '0 0 4px' }}>Quick demo logins (password123):</p>
      <div className="chips">
        {DEMO.map((a) => (
          <button key={a.email} className="chip" disabled={busy} onClick={() => signIn(a.email)}>
            {a.label}
          </button>
        ))}
      </div>

      <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
        New here? <Link className="link" href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
