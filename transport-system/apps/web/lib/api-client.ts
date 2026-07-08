import type { AuthTokens, CreateJobDto, PlaceBidDto } from '@athenagrid/shared';
import { demoApi, DEMO } from './demo';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * Typed API client. Request/response shapes come from @athenagrid/shared, so a
 * backend contract change surfaces here as a compile error, not a runtime bug.
 * In-memory token store (swap for cookies/secure storage in production).
 */
const TOKEN_KEY = 'ag_token';
let accessToken: string | null =
  typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;

export const getToken = () => accessToken;
export const setToken = (t: string | null) => {
  accessToken = t;
  if (typeof window !== 'undefined') {
    if (t) window.localStorage.setItem(TOKEN_KEY, t);
    else window.localStorage.removeItem(TOKEN_KEY);
  }
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message ?? res.statusText);
  return res.status === 204 ? (undefined as T) : res.json();
}

// When NEXT_PUBLIC_DEMO=true the client serves in-memory seed data (no backend),
// so the UI is fully clickable while the real API/DB come together in parallel.
export const api = DEMO
  ? demoApi
  : {
      login: (email: string, password: string) =>
        request<AuthTokens>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }),

      register: (dto: Record<string, unknown>) =>
        request<AuthTokens>('/auth/register', { method: 'POST', body: JSON.stringify(dto) }),

      createJob: (dto: CreateJobDto) =>
        request('/jobs', { method: 'POST', body: JSON.stringify(dto) }),

      searchJobs: (query = '') => request<any[]>(`/jobs${query}`),

      getJob: (id: string) => request<any>(`/jobs/${id}`),

      listBids: (jobId: string) => request<any[]>(`/jobs/${jobId}/bids`),

      marketplaceIndustries: (zip?: string) =>
        request<any[]>(`/marketplace/industries${zip ? `?zip=${encodeURIComponent(zip)}` : ''}`),
      marketplaceOrders: () => request<any[]>('/marketplace/orders'),
      createOrder: (dto: {
        industryId: string;
        items: { catalogItemId: string; qty: number }[];
        deliverPostalCode?: string;
        deliverAddress?: string;
      }) => request('/marketplace/orders', { method: 'POST', body: JSON.stringify(dto) }),

      placeBid: (jobId: string, dto: PlaceBidDto) =>
        request(`/jobs/${jobId}/bids`, { method: 'POST', body: JSON.stringify(dto) }),

      award: (jobId: string, bidId: string, driverId?: string) =>
        request(`/jobs/${jobId}/award`, {
          method: 'POST',
          body: JSON.stringify({ bidId, driverId }),
        }),

      requestVerificationUpload: (type: string, contentType: string) =>
        request<{ documentId: string; uploadUrl: string; key: string }>(
          '/verification/documents',
          { method: 'POST', body: JSON.stringify({ type, contentType }) },
        ),

      myVerification: () => request<any>('/verification/me'),

      me: () => request<any>('/users/me'),

      getTrip: (id: string) => request<any>(`/trips/${id}`),

      listTrips: () => request<any[]>('/trips'),

      tripStatus: (id: string, status: string) =>
        request(`/trips/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),

      tripLocation: (id: string, lat: number, lng: number) =>
        request(`/trips/${id}/location`, { method: 'POST', body: JSON.stringify({ lat, lng }) }),
    };
