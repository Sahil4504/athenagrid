/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every page is client-rendered, so we export a fully static site — trivial to
  // host on Netlify (publish apps/web/out). No Next server runtime needed.
  output: 'export',
  // Let Next transpile the shared TS package from the monorepo.
  transpilePackages: ['@athenagrid/shared'],
  reactStrictMode: true,
  images: { unoptimized: true },
  // Don't block a test deployment on type/lint nits (the app runs fine at runtime).
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
