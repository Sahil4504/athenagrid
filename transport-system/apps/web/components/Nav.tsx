'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, dashboardFor } from '../lib/auth';

export function Nav() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="nav">
      <Link href="/" className="brand" style={{ textDecoration: 'none' }}>
        <span className="logo">🌾</span>
        <span>AthenaGrid <small>TRANSPORT</small></span>
      </Link>
      <div className="nav-spacer" />
      <div className="nav-links">
        {ready && user ? (
          <>
            <Link href={dashboardFor(user)}>My dashboard</Link>
            <a
              style={{ cursor: 'pointer' }}
              onClick={() => {
                logout();
                router.push('/');
              }}
            >
              Log out
            </a>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
