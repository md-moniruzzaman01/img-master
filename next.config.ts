import type { NextConfig } from 'next';

// Fully static site: every page is pre-rendered to HTML in `out/`.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
