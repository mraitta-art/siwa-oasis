import { queryOne, execute } from '@/lib/db';
import { MinisiteMode, MinisiteComponentType } from './minisite-governance-client';

export const MINISITE_LAYOUT_KEY = (slug: string) => `minisite_layout_${slug.toLowerCase()}`;
export const MINISITE_TEMPLATE_KEY = (typeId: string) => `minisite_template_${typeId.toLowerCase()}`;
export const GOVERNANCE_KEY = 'minisite_governance';

export interface MinisiteLayoutComponent {
  id: string;
  type: MinisiteComponentType;
  props: Record<string, any>;
  order: number;
}

export interface MinisiteSiteSettings {
  primary_color?: string;
  bg_color?: string;
  nav_bg_color?: string;
  text_color?: string;
  logo_override?: string;
  cover_override?: string;
  show_platform_nav?: boolean;
  show_platform_footer?: boolean;
  cta_text?: string;
  cta_link?: string;
}

export interface MinisiteLayout {
  mode: MinisiteMode; // 'replace' (uses vendor custom_data) | 'untied' (pure custom content)
  components: MinisiteLayoutComponent[];
  site_settings?: MinisiteSiteSettings;
  updated_at?: string;
  updated_by?: string;
}

export async function fetchMinisiteLayout(slug: string): Promise<MinisiteLayout | null> {
  if (!slug) return null;
  try {
    const key = MINISITE_LAYOUT_KEY(slug);
    const row = await queryOne<{ config: string | object }>(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      [key]
    );

    if (!row || !row.config) return null;

    const parsed: MinisiteLayout =
      typeof row.config === 'string' ? JSON.parse(row.config) : row.config;

    if (!parsed || !Array.isArray(parsed.components)) return null;

    return {
      mode: parsed.mode === 'untied' ? 'untied' : 'replace',
      components: parsed.components,
      site_settings: parsed.site_settings || {},
      updated_at: parsed.updated_at,
      updated_by: parsed.updated_by,
    };
  } catch (error) {
    console.error(`[MinisiteLayout] Error fetching layout for ${slug}:`, error);
    return null;
  }
}

export async function saveMinisiteLayout(
  slug: string,
  layout: MinisiteLayout,
  adminId: string = 'admin'
): Promise<void> {
  if (!slug) throw new Error('Business slug is required');

  const key = MINISITE_LAYOUT_KEY(slug);
  const payload: MinisiteLayout = {
    mode: layout.mode === 'untied' ? 'untied' : 'replace',
    components: Array.isArray(layout.components) ? layout.components : [],
    site_settings: layout.site_settings || {},
    updated_at: new Date().toISOString(),
    updated_by: adminId,
  };

  const serialized = JSON.stringify(payload);

  await execute(
    `INSERT INTO website_configs (type, config)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE config = VALUES(config)`,
    [key, serialized]
  );
}

export async function deleteMinisiteLayout(slug: string): Promise<void> {
  if (!slug) return;
  const key = MINISITE_LAYOUT_KEY(slug);
  await execute('DELETE FROM website_configs WHERE type = ?', [key]);
}

export async function fetchMinisiteTemplateLayout(typeId: string): Promise<MinisiteLayout | null> {
  if (!typeId) return null;
  try {
    const key = MINISITE_TEMPLATE_KEY(typeId);
    const row = await queryOne<{ config: string | object }>(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      [key]
    );
    if (!row || !row.config) return null;
    const parsed = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveMinisiteTemplateLayout(
  typeId: string,
  layout: MinisiteLayout,
  adminId: string = 'admin'
): Promise<void> {
  if (!typeId) throw new Error('Category typeId is required');
  const key = MINISITE_TEMPLATE_KEY(typeId);
  const payload = {
    ...layout,
    updated_at: new Date().toISOString(),
    updated_by: adminId,
  };
  await execute(
    `INSERT INTO website_configs (type, config)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE config = VALUES(config)`,
    [key, JSON.stringify(payload)]
  );
}
