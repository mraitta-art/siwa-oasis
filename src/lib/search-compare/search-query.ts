/**
 * Search Query Service
 * Applies dynamic filters from search engine config — MySQL version
 */

import { query as dbQuery, queryOne } from '@/lib/db';
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

  const conditions = buildSearchQuery(se, userFilters);
  let sql = 'SELECT b.*, bt.name as type_name, bt.icon as type_icon FROM businesses b LEFT JOIN business_types bt ON b.type_id = bt.id WHERE b.published = TRUE AND b.status = "active"';
  const params: any[] = [];

  conditions.forEach(c => {
    if (c.operator === 'ilike') {
      sql += ` AND b.${c.field} LIKE ?`;
      params.push(`%${c.value}%`);
    } else if (c.operator === 'eq') {
      sql += ` AND b.${c.field} = ?`;
      params.push(c.value);
    } else if (c.operator === 'gte') {
      sql += ` AND b.${c.field} >= ?`;
      params.push(c.value);
    } else if (c.operator === 'lte') {
      sql += ` AND b.${c.field} <= ?`;
      params.push(c.value);
    }
  });

  const offset = (page - 1) * pageSize;
  sql += ` ORDER BY b.views DESC LIMIT ? OFFSET ?`;
  params.push(pageSize, offset);

  const results = await dbQuery(sql, params);
  const [countResult] = await dbQuery('SELECT COUNT(*) as total FROM businesses WHERE published = TRUE AND status = "active"');

  return {
    results,
    total: (countResult as any)?.total || 0,
    page,
    pageSize,
  };
}
