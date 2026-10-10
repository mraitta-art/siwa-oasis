import { queryStrict } from '@/lib/db';
import { normalizeSitePath } from '@/lib/site-blog-paths';

export { sitePathFromPageId } from '@/lib/site-blog-paths';

export interface SiteBlogLocation {
  path: string;
  title: string;
  hasBlogBlock: boolean;
  isSearch: boolean;
}

function parseConfig(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      throw new Error('Website page configuration contains invalid JSON');
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function siteBlogLocationFromConfig(type: string, rawConfig: unknown): SiteBlogLocation | null {
  const isSearch = type.startsWith('website_search_');
  if (!type.startsWith('website_') || type.startsWith('website_business_')) return null;
  const slug = type.replace(/^website_search_/, '').replace(/^website_/, '');
  if (!slug) return null;
  const config = parseConfig(rawConfig);
  const settings = config.site_settings && typeof config.site_settings === 'object'
    ? config.site_settings as Record<string, unknown>
    : {};
  const configuredPath = config.public_path ?? settings.public_path;
  const path = typeof configuredPath === 'string' && configuredPath.trim()
    ? normalizeSitePath(configuredPath)
    : slug === 'main'
      ? '/'
      : slug === 'blog'
        ? '/blog'
        : `/${slug}`;
  const components = [
    ...(Array.isArray(config.header_components) ? config.header_components : []),
    ...(Array.isArray(config.body_components) ? config.body_components : []),
    ...(Array.isArray(config.footer_components) ? config.footer_components : []),
    ...(Array.isArray(config.components) ? config.components : []),
  ];
  const hasBlogBlock = components.some(component =>
    component && typeof component === 'object' &&
    ['blog', 'storytelling_section'].includes(String((component as Record<string, unknown>).type))
  );
  const configuredTitle = settings.site_name ?? settings.title;
  const title = typeof configuredTitle === 'string' && configuredTitle.trim()
    ? configuredTitle.trim()
    : slug === 'main'
      ? 'Homepage'
      : slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  return { path, title, hasBlogBlock, isSearch };
}

export async function listSiteBlogLocations(): Promise<SiteBlogLocation[]> {
  const rows = await queryStrict<{ type: string; config: unknown }>(
    `SELECT type, config FROM website_configs
     WHERE type LIKE 'website_%'
     ORDER BY type`,
  );
  const locations = rows
    .map(row => siteBlogLocationFromConfig(row.type, row.config))
    .filter((location): location is SiteBlogLocation => location !== null && !location.isSearch);
  return [...new Map(locations.map(location => [location.path, location])).values()]
    .sort((left, right) => left.path.localeCompare(right.path));
}
