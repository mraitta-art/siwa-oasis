export function normalizeSitePath(value: string): string {
  const path = value.trim();
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

export function sitePathFromPageId(pageId?: string): string {
  if (!pageId) return '/';
  if (pageId.startsWith('p:')) return normalizeSitePath(pageId.replace(/^p:/, '/p/'));
  const slug = pageId.replace(/^website_/, '').replace(/^\/+|\/+$/g, '');
  return slug === 'main' ? '/' : `/${slug}`;
}
