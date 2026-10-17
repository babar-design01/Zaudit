/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-only packages that must not be bundled: jsdom pulls in optional
  // native deps it can live without, and @sparticuz/chromium resolves a
  // compressed browser next to its own file — rewriting its paths breaks it.
  serverExternalPackages: ['jsdom', 'playwright-core', 'sharp', 'axe-core', '@sparticuz/chromium'],

  // The browser is 60MB of brotli archives that nothing imports by name, so
  // tracing leaves them out and the function has no Chromium to launch. Only
  // the audit route needs them.
  outputFileTracingIncludes: {
    '/api/audit': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;
