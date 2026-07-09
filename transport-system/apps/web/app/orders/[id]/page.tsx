// Inert route. The order detail/driver-selection page lives at `/orders/view?id=`
// (a static route, so it works on the exported static site for both client
// navigation and direct links). This dynamic route is kept only because the
// folder can't be removed in this environment; `generateStaticParams` returning
// an empty list keeps `output: 'export'` builds passing. Nothing links here.
export function generateStaticParams() {
  return [] as { id: string }[];
}

export default function DeprecatedOrderRoute() {
  return null;
}
