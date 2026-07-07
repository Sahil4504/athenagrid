'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, setToken } from './api-client';

type User = any;

type AuthValue = {
  user: User;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (dto: Record<string, unknown>) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthCtx = createContext<AuthValue>({
  user: null,
  ready: false,
  login: async () => null,
  register: async () => null,
  logout: () => {},
  refreshUser: async () => {},
});

/** Where each role belongs. */
export function dashboardFor(user: User): string {
  if (!user) return '/login';
  if (user.role === 'SHIPPER') return '/shipper';
  if (user.role === 'CARRIER') return '/carrier';
  return '/';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (t) {
      api.me().then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  async function login(email: string, password: string) {
    const tok = await api.login(email, password);
    setToken(tok.accessToken);
    const me = await api.me();
    setUser(me);
    return me;
  }

  async function register(dto: Record<string, unknown>) {
    const tok = await api.register(dto);
    setToken(tok.accessToken);
    const me = await api.me();
    setUser(me);
    return me;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    setUser(await api.me());
  }

  return (
    <AuthCtx.Provider value={{ user, ready, login, register, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

/** Redirect if not signed in, or signed in with the wrong role. */
export function useRequireRole(role: 'SHIPPER' | 'CARRIER') {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
    else if (user.role !== role) router.replace(dashboardFor(user));
  }, [ready, user, role, router]);
  return { user, ready };
}
