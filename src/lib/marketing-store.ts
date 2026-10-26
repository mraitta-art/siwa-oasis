/**
 * Persistence + data loading for the per-business marketing pack.
 *
 * Kept separate from `marketing-content.ts` so generation stays pure and this
 * file owns only SQL: read a business's market/typology context, then save the
 * generated pack back as a reviewable draft (never auto-published).
 *
 * A pack is stored as ONE row per business in `business_posts`:
 *   category = 'ai_marketing_pack', published = 0, body = the whole pack as JSON.
 * That makes "Generate" idempotent (regenerate overwrites the same row) and lets
 * the marketing desk reload exactly what was produced for each business.
 */

import crypto from 'crypto';
import { execute, query, queryOne } from '@/lib/db';
import type { MarketingPack } from '@/lib/marketing-content';

export interface MarketingContext {
  id: string;
  businessName: string;
  businessNameAr: string;
  market: string;
  marketNameEn: string;
  marketNameAr: string;
  currency: string;
  typeId: string;
  typologyLabel: string;
  location: string;
}

/** Read everything the pack generator needs for one business, in a single join. */
export async function loadBusinessForMarketing(id: string): Promise<MarketingContext | null> {
  const row = (await queryOne(
    `SELECT b.id, b.name, b.name_ar, b.type_id, b.market_id,
            bt.name AS type_name,
            m.name_en AS market_name_en, m.name_ar AS market_name_ar, m.currency,
            l.name_en AS location_name_en, l.name_ar AS location_name_ar
       FROM businesses b
       LEFT JOIN business_types bt ON bt.id = b.type_id
       LEFT JOIN markets m ON m.id = b.market_id
       LEFT JOIN locations l ON l.id = b.location_id
      WHERE b.id = ?
      LIMIT 1`,
    [String(id || '').trim()]
  )) as any;
  if (!row) return null;
  return {
    id: String(row.id),
    businessName: String(row.name || ''),
    businessNameAr: String(row.name_ar || row.name || ''),
    market: String(row.market_id || 'siwa'),
    marketNameEn: String(row.market_name_en || row.market_id || 'Siwa'),
    marketNameAr: String(row.market_name_ar || row.market_id || ''),
    currency: String(row.currency || 'EGP'),
    typeId: String(row.type_id || ''),
    typologyLabel: String(row.type_name || ''),
    location: String(row.location_name_en || row.location_name_ar || ''),
  };
}

/** Businesses in one market, newest first, capped — for the bulk run. */
export async function listMarketBusinessesForMarketing(market: string, limit: number): Promise<MarketingContext[]> {
  const cap = Math.min(Math.max(Number(limit) || 10, 1), 25);
  const rows = (await query(
    `SELECT b.id, b.name, b.name_ar, b.type_id, b.market_id,
            bt.name AS type_name,
            m.name_en AS market_name_en, m.name_ar AS market_name_ar, m.currency,
            l.name_en AS location_name_en, l.name_ar AS location_name_ar
       FROM businesses b
       LEFT JOIN business_types bt ON bt.id = b.type_id
       LEFT JOIN markets m ON m.id = b.market_id
       LEFT JOIN locations l ON l.id = b.location_id
      WHERE b.market_id = ?
      ORDER BY b.published DESC, b.created_at DESC
      LIMIT ${cap}`,
    [String(market || '').trim().toLowerCase()]
  )) as any[];
  return (rows || []).map((row) => ({
    id: String(row.id),
    businessName: String(row.name || ''),
    businessNameAr: String(row.name_ar || row.name || ''),
    market: String(row.market_id || 'siwa'),
    marketNameEn: String(row.market_name_en || row.market_id || ''),
    marketNameAr: String(row.market_name_ar || row.market_id || ''),
    currency: String(row.currency || 'EGP'),
    typeId: String(row.type_id || ''),
    typologyLabel: String(row.type_name || ''),
    location: String(row.location_name_en || row.location_name_ar || ''),
  }));
}

/** Upsert the pack as a single draft row. Returns the post id. */
export async function saveMarketingPack(businessId: string, pack: MarketingPack): Promise<string> {
  const title = `Marketing Pack — ${pack.business_name || businessId}`;
  const body = JSON.stringify(pack);
  const existing = (await queryOne(
    `SELECT id FROM business_posts WHERE business_id = ? AND category = 'ai_marketing_pack' LIMIT 1`,
    [businessId]
  )) as any;
  if (existing?.id) {
    await execute(
      `UPDATE business_posts SET title = ?, body = ?, updated_at = NOW() WHERE id = ?`,
      [title, body, String(existing.id)]
    );
    return String(existing.id);
  }
  const id = crypto.randomUUID();
  await execute(
    `INSERT INTO business_posts (id, business_id, title, body, category, published)
     VALUES (?, ?, ?, ?, 'ai_marketing_pack', 0)`,
    [id, businessId, title, body]
  );
  return id;
}

/** Read a stored pack for a business, if one exists. */
export async function getStoredPack(businessId: string): Promise<MarketingPack | null> {
  const row = (await queryOne(
    `SELECT body FROM business_posts WHERE business_id = ? AND category = 'ai_marketing_pack' LIMIT 1`,
    [businessId]
  )) as any;
  if (!row?.body) return null;
  try {
    const parsed = typeof row.body === 'string' ? JSON.parse(row.body) : row.body;
    return Buffer.isBuffer(parsed) ? JSON.parse(parsed.toString('utf8')) : (parsed as MarketingPack);
  } catch {
    return null;
  }
}

/**
 * Push the pack's social captions into the business blog as unpublished drafts,
 * so they can be edited and published individually. Returns how many were added.
 */
export async function publishCaptionsAsDrafts(businessId: string, pack: MarketingPack): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < (pack.social_captions || []).length; i++) {
    const cap = pack.social_captions[i];
    const body = `${cap.en || ''}\n\n${cap.ar || ''}\n\n${cap.hashtags_en || ''} ${cap.hashtags_ar || ''}`.trim();
    if (!body) continue;
    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO business_posts (id, business_id, title, body, category, published)
       VALUES (?, ?, ?, ?, 'ai_social_caption', 0)`,
      [id, businessId, `Social caption ${i + 1} — ${pack.business_name || ''}`.trim(), body]
    );
    inserted += 1;
  }
  return inserted;
}
