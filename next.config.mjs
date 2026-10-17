/** @type {import('next').NextConfig} */
const nextConfig = {
  // jsdom is server-only and pulls in optional native deps it can live without.
  serverExternalPackages: ['jsdom', 'playwright-core', 'sharp', 'axe-core'],
};

export default nextConfig;
