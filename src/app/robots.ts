import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private/app surfaces — not for indexing.
      disallow: ['/dashboard', '/board', '/api'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
