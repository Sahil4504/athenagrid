'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, dashboardFor } from '../../lib/auth';

// Deliveries now live on the carrier dashboard ("My deliveries"). Redirect old links.
export default function DriverPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (ready) router.replace(dashboardFor(user));
  }, [ready, user, router]);
  return <p className="muted" style={{ padding: 40 }}>Redirecting…</p>;
}
