import type { NextConfig } from 'next';

// Baseline security headers. CSP keeps 'unsafe-inline' for now because Next.js
// hydration scripts/styles need it without a nonce setup; tighten to a nonce
// based policy before launch. connect-src allows wss/https for Liveblocks
// (Phase 3) and the Gemini API (Phase 4). frame-ancestors stays 'self' until
// Phase 5 relaxes it for public board embeds.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
