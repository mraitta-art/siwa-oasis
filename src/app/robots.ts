import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/jana/', '/api/'],
      },
      {
        userAgent: 'Googlebot-Favicon',
        allow: ['/', '/favicon-48x48.png', '/favicon-96x96.png', '/favicon.ico', '/icon.svg', '/icons/'],
      },
    ],
    sitemap: 'https://siwify.com/sitemap.xml',
    host: 'https://siwify.com',
  };
}
