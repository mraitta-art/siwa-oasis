export function slugifyBusinessName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function getPublicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://siwify.com';
}

export function getPublicMinisiteUrl(slug: string) {
  return `${getPublicAppUrl().replace(/\/$/, '')}/${slug}`;
}
