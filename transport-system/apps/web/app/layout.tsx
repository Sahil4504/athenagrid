import type { ReactNode } from 'react';
import './globals.css';
import { AuthProvider } from '../lib/auth';
import { Nav } from '../components/Nav';

export const metadata = {
  title: 'AthenaGrid Transport',
  description: 'Farm-to-market transport marketplace',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Nav />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
