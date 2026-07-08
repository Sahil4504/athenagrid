/**
 * Demo mode — in-memory seed data so the web app runs with NO backend.
 * Enable by setting NEXT_PUBLIC_DEMO=true (see .env.example). Great for the UI team
 * to build and style screens before/while the API + DB are wired up. It mirrors the
 * real api-client surface, so switching back to the live backend is just the flag.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true';

type Bid = { id: string; amount: number; etaMinutes: number; status: string; carrier?: any };

const job = {
  id: 'demo-job-1',
  status: 'OPEN',
  cropType: 'Strawberries',
  weightKg: 4200,
  volumeM3: 22,
  coldChainRequired: true,
  pickupAddress: 'Fresno, CA',
  dropoffAddress: 'Los Angeles, CA',
  bids: [
    { id: 'demo-bid-1', amount: 950, etaMinutes: 180, status: 'ACTIVE', carrier: { companyName: 'ColdHaul Logistics' } },
    { id: 'demo-bid-2', amount: 1080, etaMinutes: 210, status: 'ACTIVE', carrier: { companyName: 'ValleyFreight' } },
  ] as Bid[],
  trip: null as any,
};

const wait = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 150));

export const demoApi = {
  login: (_email: string, _password: string) => wait({ accessToken: 'demo', refreshToken: 'demo' }),
  register: (_dto: Record<string, unknown>) => wait({ accessToken: 'demo', refreshToken: 'demo' }),
  createJob: (dto: any) => wait({ id: 'demo-job-2', ...dto, status: 'OPEN' }),
  searchJobs: (_q = '') => wait([job]),
  getJob: (_id: string) => wait({ ...job, bids: [...job.bids].sort((a, b) => a.amount - b.amount) }),
  listBids: (_jobId: string) =>
    wait(
      [...job.bids]
        .sort((a, b) => a.amount - b.amount)
        .map((b, i) => ({
          ...b,
          assessment: { score: 1 - i * 0.1, recommended: i === 0, withinBand: true, note: 'Fair price' },
          settlementPreview: { farmerTotal: Math.round(b.amount * 1.04 * 100) / 100, driverPayout: Math.round(b.amount * 0.92 * 100) / 100 },
        })),
    ),
  placeBid: (_jobId: string, dto: any) => {
    const bid = { id: `demo-bid-${job.bids.length + 1}`, status: 'ACTIVE', ...dto };
    job.bids.push(bid);
    return wait(bid);
  },
  award: (_jobId: string, bidId: string) => {
    job.status = 'AWARDED';
    job.bids = job.bids.map((b) => ({ ...b, status: b.id === bidId ? 'WON' : 'REJECTED' }));
    return wait({ tripId: 'demo-trip-1', awardedBidId: bidId });
  },
  requestVerificationUpload: (_type: string, _ct: string) =>
    wait({ documentId: 'demo-doc-1', uploadUrl: 'local://demo', key: 'demo' }),
  myVerification: () =>
    wait({
      verificationStatus: 'VERIFIED',
      requiredDocs: ['DRIVING_LICENCE', 'VEHICLE_REGISTRATION', 'INSURANCE'],
      documents: [],
    }),
  me: () =>
    wait({
      carrierProfile: {
        vehicles: [{ id: 'demo-veh-1', plate: 'CA-COLD-1', refrigerated: true, capacityKg: 5000 }],
      },
    }),
  getTrip: (_id: string) => wait({ id: 'demo-trip-1', status: 'ASSIGNED', events: [] }),
  listTrips: () => wait([{ id: 'demo-trip-1', status: 'ASSIGNED', job: job }]),
  tripStatus: (_id: string, status: string) => wait({ ok: true, status }),
  tripLocation: (_id: string, _lat: number, _lng: number) => wait({ ok: true }),
  marketplaceIndustries: () => wait([] as any[]),
  marketplaceOrders: () => wait([] as any[]),
  createOrder: (_dto: { industryId: string; items: { catalogItemId: string; qty: number }[] }) =>
    wait({ id: 'demo-order-1' }),
};
