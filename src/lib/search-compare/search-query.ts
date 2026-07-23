/**
 * Search Query Service
 * Applies dynamic filters from search engine config — MySQL version
 */

import { query as safeQuery, queryOne } from '@/lib/db';
import type { SearchEngine } from '@/lib/governance/types';

interface QueryCondition {
  field: string;
  operator: 'eq' | 'ilike' | 'gte' | 'lte' | 'in';
  value: any;
}

interface SearchFilters {
  [fieldPath: string]: any;
}

/** Build MySQL WHERE conditions from search filters */
export function buildSearchQuery(searchEngine: SearchEngine, userFilters: SearchFilters): QueryCondition[] {
  const conditions: QueryCondition[] = [];

  Object.entries(userFilters).forEach(([fieldPath, value]) => {
    if (!searchEngine.allowed_fields.includes(fieldPath)) return;
    if (!value || value === '') return;
    const operator = inferOperator(fieldPath, value);
    const dbColumn = mapFieldPathToColumn(fieldPath);
    conditions.push({ field: dbColumn, operator, value });
  });

  return conditions;
}

function inferOperator(fieldPath: string, value: any): QueryCondition['operator'] {
  if (fieldPath.includes('email') || fieldPath.includes('url') || fieldPath.includes('phone') || fieldPath.includes('address') || fieldPath.includes('name') || fieldPath.includes('description')) return 'ilike';
  if (fieldPath.includes('city') || fieldPath.includes('country')) return 'eq';
  if (typeof value === 'number') return 'gte';
  return 'eq';
}

function mapFieldPathToColumn(fieldPath: string): string {
  const mapping: Record<string, string> = {
    'basic_info.name': 'name',
    'location.city': 'location_id',
  };
  return mapping[fieldPath] || fieldPath;
}

/** Execute a search against MySQL */
export async function executeSearch(
  searchEngineId: string,
  userFilters: SearchFilters,
  page: number = 1,
  pageSize: number = 10
) {
  const engine = await queryOne<any>('SELECT * FROM search_engines WHERE id = ?', [searchEngineId]);
  if (!engine) throw new Error(`Search engine not found: ${searchEngineId}`);

  const se: SearchEngine = {
    ...engine,
    allowed_fields: typeof engine.allowed_fields === 'string' ? JSON.parse(engine.allowed_fields) : engine.allowed_fields,
    filters: typeof engine.filters === 'string' ? JSON.parse(engine.filters) : engine.filters,
  };

  // 1. Fetch field-to-section mapping for deep-scan
  const dbFields = await safeQuery('SELECT name, section_id FROM form_fields');
  const fieldToSection: Record<string, string> = {};
  dbFields.forEach((f: any) => {
    if (f.section_id) fieldToSection[f.name] = f.section_id;
  });

  const conditions = buildSearchQuery(se, userFilters);
  let sql = 'SELECT b.*, bt.name as type_name, bt.icon as type_icon FROM businesses b LEFT JOIN business_types bt ON b.type_id = bt.id WHERE b.published = TRUE AND b.status = "active"';
  const params: any[] = [];

  conditions.forEach(c => {
    // If it's a standard column, use it directly. Otherwise, check if it's a section field.
    const standardColumns = ['name', 'slug', 'type_id', 'status', 'subscription_tier'];
    let columnRef = `b.${c.field}`;
    
    if (!standardColumns.includes(c.field)) {
      const sectionId = fieldToSection[c.field];
      if (sectionId) {
        // Use JSON_EXTRACT for section-based fields
        columnRef = `JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.${sectionId}.${c.field}'))`;
      }
    }

    // Handle Promotion Flags
    const promotionFlags = ['is_recommended', 'is_trusted', 'is_featured'];
    if (promotionFlags.includes(c.field)) {
      sql += ` AND b.${c.field} = ?`;
      params.push(c.value === true || c.value === 1 ? 1 : 0);
      return;
    }

    // Special: Offers Search (Deep Scan across offer-related custom_data sections)
    if (c.field === 'offers') {
      const term = `%${c.value}%`;
      sql += ` AND (
        b.custom_data LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-packages".offer_title')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-packages".offer_title_2')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-packages".offer_title_3')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-promotions".offer_title')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-promotions".offer_title_2')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-promotions".offer_title_3')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."package".offer_title')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."package".offer_title_2')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."package".offer_title_3')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.offers_packages.offers_packages_offer_title')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.offers_packages.offer_title')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."sec_8_rates_offers".offer_title')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."sec_8_rates_offers".title')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."sec_8_rates_offers".price_standard')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."sec_8_rates_offers".avg_meal_price')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."sec_8_rates_offers".group_discounts')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."sec_8_rates_offers".shipping_info')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."sec_8_rates_offers".special_conditions')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."discount".discount_name')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."discount".discount_description')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."discount".discount_type')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."discount".promo_code')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."discounts-promotions".discount_name')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."discounts-promotions".discount_description')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."discounts-promotions".discount_type')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."discounts-promotions".promo_code')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-packages".offer_description')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-packages".offer_description_2')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-packages".offer_description_3')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-promotions".offer_description')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-promotions".offer_description_2')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-promotions".offer_description_3')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."package".offer_description')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."package".offer_description_2')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."package".offer_description_3')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-packages".offer_inclusions')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-packages".offer_inclusions_2')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-packages".offer_inclusions_3')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-promotions".offer_inclusions')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-promotions".offer_inclusions_2')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."offers-promotions".offer_inclusions_3')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."package".offer_inclusions')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."package".offer_inclusions_2')) LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."package".offer_inclusions_3')) LIKE ?
      )`;
      params.push(term, term, term, term, term, term, term, term, term, term, term, term, term, term, term, term, term, term, term, term, term, term, term, term);
      return;
    }

    if (c.operator === 'ilike') {
      sql += ` AND ${columnRef} LIKE ?`;
      params.push(`%${c.value}%`);
    } else if (c.operator === 'eq') {
      sql += ` AND ${columnRef} = ?`;
      params.push(c.value);
    } else if (c.operator === 'gte') {
      sql += ` AND ${columnRef} >= ?`;
      params.push(c.value);
    } else if (c.operator === 'lte') {
      sql += ` AND ${columnRef} <= ?`;
      params.push(c.value);
    }
  });

  const offset = (page - 1) * pageSize;
  sql += ` ORDER BY b.views DESC LIMIT ? OFFSET ?`;
  params.push(pageSize, offset);

  const results = await safeQuery(sql, params);
  const [countResult] = await safeQuery('SELECT COUNT(*) as total FROM businesses WHERE published = TRUE AND status = "active"');

  return {
    results,
    total: (countResult as any)?.total || 0,
    page,
    pageSize,
  };
}
