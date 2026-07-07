'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, setToken } from '../lib/api-client';

type QuickAccount = { label: string; email: string };

export function AuthPanel({
  title,
  subtitle,
  accounts,
  onAuthed,
}: {
  title: string;
  subtitle?: string;
  accounts: QuickAccount[];
  onAuthed: (token: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn(withEmail: string) {
    setErr('');
    setBusy(true);
    try {
      const t = await api.login(withEmail, password);
      setToken(t.accessToken);
      onAuthed(t.accessToken);
    } catch (e: any) {
      setErr(e.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card pop" style={{ maxWidth: 440, margin: '32px auto' }}>
      <h2>{title}</h2>
      {subtitle && <p className="muted" style={{ marginTop: -6 }}>{subtitle}</p>}

      {err && <div className="banner err" style={{ marginTop: 12 }}>{err}</div>}

      <div className="field" style={{ marginTop: 14 }}>
        <label>Email</label>
        <input value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="btn" style={{ width: '100%' }} disabled={busy || !email} onClick={() => signIn(email)}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>

      {accounts.length > 0 && (
        <>
          <div className="divider" />
          <p className="muted" style={{ fontSize: 13, margin: '0 0 4px' }}>Quick demo logins (password123):</p>
          <div className="chips">
            {accounts.map((a) => (
              <button key={a.email} className="chip" disabled={busy} onClick={() => signIn(a.email)}>
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
        New here? <Link className="link" href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
