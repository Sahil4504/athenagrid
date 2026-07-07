import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'AthenaGrid Transport',
  description: 'Farm-to-market transport marketplace',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <Link href="/" className="brand" style={{ textDecoration: 'none' }}>
            <span className="logo">🌾</span>
            <span>AthenaGrid <small>TRANSPORT</small></span>
          </Link>
          <div className="nav-links">
            <Link href="/shipper">Shipper</Link>
            <Link href="/carrier">Carrier</Link>
            <Link href="/driver">Driver</Link>
          </div>
          <div className="nav-spacer" />
          <div className="nav-links">
            <Link href="/signup">Sign up</Link>
          </div>
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
