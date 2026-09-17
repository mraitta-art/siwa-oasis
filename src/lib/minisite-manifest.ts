import { query, queryOne, transaction } from '@/lib/db';
import { normalizeCustomData } from '@/lib/db';

export type ManifestStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export interface MinisiteManifestSection {
  id: string;
  order: number;
  enabled: boolean;
  label: string;
  content: Record<string, unknown>;
  approval_status: 'draft' | 'pending' | 'approved' | 'published' | 'suspended';
  components: Array<Record<string, unknown>>;
}

export interface MinisiteManifest {
  schema_version: 1;
  business_id: string;
  revision: number;
  status: ManifestStatus;
  template_id: string | null;
  sections: MinisiteManifestSection[];
  pages: Array<{ id: string; slug: string; order: number; components: Array<Record<string, unknown>> }>;
  metadata: { source: string; updated_at: string };
}

function parseJson(value: unknown, fallback: any = {}) {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function validateManifest(manifest: MinisiteManifest): string[] {
  const errors: string[] = [];
  if (manifest.schema_version !== 1) errors.push('Unsupported manifest schema version.');
  if (!manifest.business_id) errors.push('Manifest business_id is required.');
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const section of manifest.sections || []) {
    if (!section.id) errors.push('Every section requires an id.');
    if (ids.has(section.id)) errors.push(`Duplicate section id: ${section.id}`);
    if (orders.has(section.order)) errors.push(`Duplicate section order: ${section.order}`);
    ids.add(section.id);
    orders.add(section.order);
  }
  for (const page of manifest.pages || []) {
    if (!page.id || !page.slug) errors.push('Every page requires id and slug.');
  }
  return errors;
}

function normalizeManifest(manifest: MinisiteManifest, revision: number, status: ManifestStatus): MinisiteManifest {
  const sections = [...(manifest.sections || [])]
    .map((section, index) => ({
      id: String(section.id),
      order: Number.isInteger(section.order) ? section.order : index,
      enabled: section.enabled !== false,
      label: String(section.label || section.id),
      content: section.content && typeof section.content === 'object' ? section.content : {},
      approval_status: section.approval_status || 'draft',
      components: Array.isArray(section.components) ? section.components : [],
    }))
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));

  return {
    schema_version: 1,
    business_id: manifest.business_id,
    revision,
    status,
    template_id: manifest.template_id || null,
    sections,
    pages: Array.isArray(manifest.pages) ? manifest.pages : [],
    metadata: {
      source: manifest.metadata?.source || 'manifest',
      updated_at: new Date().toISOString(),
    },
  };
}

export async function buildManifestFromLegacy(businessId: string): Promise<MinisiteManifest> {
  const business = await queryOne<any>(
    `SELECT b.id, b.type_id, b.template_id, b.custom_data, b.curation_data,
            bt.sections AS type_sections, bt.own_sections AS type_own_sections
     FROM businesses b LEFT JOIN business_types bt ON bt.id = b.type_id WHERE b.id = ?`,
    [businessId]
  );
  if (!business) throw new Error('Business not found.');

  const customData = normalizeCustomData(business.custom_data);
  const controls = await query<any>(
    'SELECT section_id, custom_label, admin_hidden, admin_disabled FROM business_section_controls WHERE business_id = ?',
    [businessId]
  );
  const controlMap = Object.fromEntries(controls.map(control => [control.section_id, control]));
  const rawIds = [
    ...parseJson(business.type_sections, []),
    ...parseJson(business.type_own_sections, []),
  ].filter((value, index, values) => typeof value === 'string' && values.indexOf(value) === index);
  const rows = rawIds.length
    ? await query<any>(`SELECT id, name, sort_order FROM sections WHERE id IN (${rawIds.map(() => '?').join(',')}) ORDER BY sort_order, name`, rawIds)
    : [];
  const sections = rows.map((row, index) => {
    const control = controlMap[row.id] || {};
    const content = customData[row.id] && typeof customData[row.id] === 'object' ? customData[row.id] : {};
    return {
      id: row.id,
      order: index,
      enabled: !control.admin_hidden && !control.admin_disabled,
      label: control.custom_label || customData.section_labels?.[row.id] || row.name,
      content,
      approval_status: content.approval_status || 'draft',
      components: [],
    };
  });

  return normalizeManifest({
    schema_version: 1,
    business_id: businessId,
    revision: 1,
    status: 'draft',
    template_id: business.template_id || null,
    sections,
    pages: [],
    metadata: { source: 'legacy-bootstrap', updated_at: new Date().toISOString() },
  }, 1, 'draft');
}

export async function getOrCreateManifest(businessId: string, actorId?: string): Promise<MinisiteManifest> {
  const current = await queryOne<any>('SELECT draft_manifest FROM minisite_manifests WHERE business_id = ?', [businessId]);
  if (current) return parseJson(current.draft_manifest) as MinisiteManifest;
  const manifest = await buildManifestFromLegacy(businessId);
  await transaction(async connection => {
    await connection.query(
      `INSERT INTO minisite_manifests (business_id, draft_revision, draft_manifest, draft_status)
       VALUES (?, ?, ?, 'draft') ON DUPLICATE KEY UPDATE business_id = business_id`,
      [businessId, manifest.revision, JSON.stringify(manifest)]
    );
    await connection.query(
      `INSERT INTO minisite_manifest_revisions (business_id, revision, status, manifest, event_type, actor_id)
       VALUES (?, ?, 'draft', ?, 'bootstrap', ?)`,
      [businessId, manifest.revision, JSON.stringify(manifest), actorId || null]
    );
  });
  return manifest;
}

export async function saveDraftManifest(businessId: string, input: MinisiteManifest, eventType: string, actorId?: string) {
  const current = await queryOne<any>('SELECT draft_revision FROM minisite_manifests WHERE business_id = ?', [businessId]);
  const revision = Number(current?.draft_revision || 0) + 1;
  const manifest = normalizeManifest({ ...input, business_id: businessId }, revision, 'draft');
  const errors = validateManifest(manifest);
  if (errors.length) throw new Error(errors.join(' '));
  await transaction(async connection => {
    await connection.query(
      `INSERT INTO minisite_manifests (business_id, draft_revision, draft_manifest, draft_status)
       VALUES (?, ?, ?, 'draft')
       ON DUPLICATE KEY UPDATE draft_revision = VALUES(draft_revision), draft_manifest = VALUES(draft_manifest), draft_status = 'draft'`,
      [businessId, revision, JSON.stringify(manifest)]
    );
    await connection.query(
      `INSERT INTO minisite_manifest_revisions (business_id, revision, status, manifest, event_type, actor_id)
       VALUES (?, ?, 'draft', ?, ?, ?)`,
      [businessId, revision, JSON.stringify(manifest), eventType, actorId || null]
    );
    await connection.query(
      `INSERT INTO minisite_manifest_events (business_id, revision, event_type, payload, actor_id)
       VALUES (?, ?, ?, ?, ?)`,
      [businessId, revision, eventType, JSON.stringify({ sections: manifest.sections.length }), actorId || null]
    );
  });
  return manifest;
}

export async function getPublishedManifest(businessId: string): Promise<MinisiteManifest | null> {
  try {
    const row = await queryOne<any>('SELECT published_manifest FROM minisite_manifests WHERE business_id = ?', [businessId]);
    if (!row?.published_manifest) return null;
    const manifest = parseJson(row.published_manifest, null);
    if (!manifest || validateManifest(manifest).length > 0) return null;
    return manifest as MinisiteManifest;
  } catch {
    return null;
  }
}

export async function publishManifest(businessId: string, actorId?: string) {
  const row = await queryOne<any>(
    'SELECT draft_revision, draft_manifest FROM minisite_manifests WHERE business_id = ?',
    [businessId]
  );
  if (!row) throw new Error('Create or save a draft manifest before publishing.');
  const draft = parseJson(row.draft_manifest, null) as MinisiteManifest | null;
  if (!draft) throw new Error('Draft manifest is invalid JSON.');
  const errors = validateManifest(draft);
  if (errors.length) throw new Error(errors.join(' '));

  const published = normalizeManifest(draft, Number(row.draft_revision), 'published');
  await transaction(async connection => {
    await connection.query(
      `UPDATE minisite_manifests
       SET published_revision = ?, published_manifest = ?, draft_status = 'published', published_at = CURRENT_TIMESTAMP
       WHERE business_id = ?`,
      [published.revision, JSON.stringify(published), businessId]
    );
    await connection.query(
      `INSERT INTO minisite_manifest_revisions (business_id, revision, status, manifest, event_type, actor_id)
       VALUES (?, ?, 'published', ?, 'publish', ?)`,
      [businessId, published.revision, JSON.stringify(published), actorId || null]
    );
    await connection.query(
      `INSERT INTO minisite_manifest_events (business_id, revision, event_type, payload, actor_id)
       VALUES (?, ?, 'publish', ?, ?)`,
      [businessId, published.revision, JSON.stringify({ published_revision: published.revision }), actorId || null]
    );
  });
  return published;
}

export async function syncManifestFromLegacyData(businessId: string, eventType: string, actorId?: string) {
  const manifest = await getOrCreateManifest(businessId, actorId);
  const business = await queryOne<any>('SELECT custom_data FROM businesses WHERE id = ?', [businessId]);
  const controls = await query<any>(
    'SELECT section_id, custom_label, admin_hidden, admin_disabled FROM business_section_controls WHERE business_id = ?',
    [businessId]
  );
  const controlMap = Object.fromEntries(controls.map(control => [control.section_id, control]));
  const customData = normalizeCustomData(business?.custom_data);
  const nextManifest: MinisiteManifest = {
    ...manifest,
    sections: manifest.sections.map(section => {
      const control = controlMap[section.id] || {};
      const content = customData[section.id] && typeof customData[section.id] === 'object'
        ? customData[section.id]
        : section.content;
      return {
        ...section,
        enabled: !control.admin_hidden && !control.admin_disabled,
        label: control.custom_label || customData.section_labels?.[section.id] || section.label,
        content,
        approval_status: content.approval_status || section.approval_status,
      };
    }),
  };
  return saveDraftManifest(businessId, nextManifest, eventType, actorId);
}

export function validateMinisiteManifest(manifest: MinisiteManifest) {
  return validateManifest(manifest);
}