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
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      // tldraw (Phase 2) spins up web workers from blob: URLs for canvas work.
      "worker-src 'self' blob:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // tldraw is a DOM-only package; keep it out of the server bundle so the RSC
  // build never tries to evaluate it on the server.
  serverExternalPackages: ['tldraw'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
