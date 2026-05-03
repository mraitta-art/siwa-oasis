/**
 * Caching Layer for SIWA OASIS
 * 
 * Provides multi-level caching:
 * 1. React cache() for request deduplication (per-request)
 * 2. In-memory LRU cache with TTL for cross-request caching
 * 3. Cache invalidation hooks for admin mutations
 */

import { cache } from 'react';
import { query, queryOne } from '@/lib/db';

// ==========================================
// Configuration
// ==========================================

const CACHE_TTL = {
  business_types: 5 * 60 * 1000,      // 5 minutes
  sections: 5 * 60 * 1000,             // 5 minutes
  field_definitions: 10 * 60 * 1000,   // 10 minutes
  locations: 15 * 60 * 1000,           // 15 minutes
  website_settings: 2 * 60 * 1000,     // 2 minutes
  website_templates: 2 * 60 * 1000,    // 2 minutes
  form_fields: 5 * 60 * 1000,          // 5 minutes
};

// ==========================================
// In-Memory Cache Store
// ==========================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheStore {
  private store: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidate all cache keys matching pattern
   */
  invalidatePattern(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

// Global cache instance (singleton)
const globalCache = new CacheStore();

export { globalCache };

// ==========================================
// Cached Data Fetching Functions
// ==========================================

/**
 * Get all business types (cached)
 */
export const getBusinessTypes = cache(async (activeOnly: boolean = true) => {
  const cacheKey = `business_types:${activeOnly}`;
  
  // Check in-memory cache first
  const cached = globalCache.get<typeof import('@/lib/db').query>(cacheKey);
  if (cached) return cached;

  // Fetch from database
  const sql = activeOnly 
    ? 'SELECT * FROM business_types WHERE active = TRUE ORDER BY sort_order'
    : 'SELECT * FROM business_types ORDER BY sort_order';
  
  const data = await query(sql);
  
  // Parse JSON fields
  const parsed = data.map((t: any) => ({
    ...t,
    sections: typeof t.sections === 'string' ? JSON.parse(t.sections) : t.sections || [],
    own_sections: typeof t.own_sections === 'string' ? JSON.parse(t.own_sections) : t.own_sections || [],
  }));

  // Store in cache
  globalCache.set(cacheKey, parsed, CACHE_TTL.business_types);

  return parsed;
});

/**
 * Get single business type by ID (cached)
 */
export const getBusinessTypeById = cache(async (id: string) => {
  const cacheKey = `business_type:${id}`;
  
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const data = await queryOne(
    'SELECT * FROM business_types WHERE id = ?',
    [id]
  );

  if (!data) return null;

  const parsed = {
    ...data,
    sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections || [],
    own_sections: typeof data.own_sections === 'string' ? JSON.parse(data.own_sections) : data.own_sections || [],
  };

  globalCache.set(cacheKey, parsed, CACHE_TTL.business_types);

  return parsed;
});

/**
 * Get all sections (cached)
 */
export const getSections = cache(async (activeOnly: boolean = true) => {
  const cacheKey = `sections:${activeOnly}`;
  
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const sql = activeOnly
    ? 'SELECT * FROM sections WHERE active = TRUE ORDER BY sort_order ASC, name ASC'
    : 'SELECT * FROM sections ORDER BY sort_order ASC, name ASC';

  const data = await query(sql);
  globalCache.set(cacheKey, data, CACHE_TTL.sections);

  return data;
});

/**
 * Get all field definitions (cached)
 */
export const getFieldDefinitions = cache(async () => {
  const cacheKey = 'field_definitions';
  
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const data = await query('SELECT * FROM field_definitions ORDER BY category, name');
  globalCache.set(cacheKey, data, CACHE_TTL.field_definitions);

  return data;
});

/**
 * Get all locations (cached)
 */
export const getLocations = cache(async (type?: string) => {
  const cacheKey = `locations:${type || 'all'}`;
  
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const sql = type
    ? 'SELECT * FROM locations WHERE type = ? AND active = TRUE ORDER BY sort_order, name'
    : 'SELECT * FROM locations WHERE active = TRUE ORDER BY sort_order, name';

  const params = type ? [type] : [];
  const data = await query(sql, params);
  globalCache.set(cacheKey, data, CACHE_TTL.locations);

  return data;
});

/**
 * Get location hierarchy (cached)
 */
export const getLocationHierarchy = cache(async () => {
  const cacheKey = 'locations:hierarchy';
  
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const locations = await query('SELECT * FROM locations WHERE active = TRUE ORDER BY sort_order, name');
  
  // Build hierarchy tree
  const hierarchy: any[] = [];
  const locationMap = new Map<string, any>();

  locations.forEach((loc: any) => {
    locationMap.set(loc.id, { ...loc, children: [] });
  });

  locations.forEach((loc: any) => {
    if (loc.parent_id && locationMap.has(loc.parent_id)) {
      locationMap.get(loc.parent_id).children.push(locationMap.get(loc.id));
    } else if (!loc.parent_id) {
      hierarchy.push(locationMap.get(loc.id));
    }
  });

  globalCache.set(cacheKey, hierarchy, CACHE_TTL.locations);

  return hierarchy;
});

/**
 * Get website settings (cached)
 */
export const getWebsiteSettings = cache(async (type: string = 'main') => {
  const cacheKey = `website_settings:${type}`;
  
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const configId = `website_${type}`;
  const data = await query(
    'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
    [configId]
  );

  const config = typeof data[0]?.config === 'string' ? JSON.parse(data[0].config) : data[0]?.config || {};
  const settings = config.site_settings || {};
  globalCache.set(cacheKey, settings, CACHE_TTL.website_settings);

  return settings;
});

/**
 * Get website template (cached)
 */
export const getWebsiteTemplate = cache(async (type: string = 'main') => {
  const cacheKey = `website_template:${type}`;
  
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const configId = `website_${type}`;
  const data = await query('SELECT config FROM website_configs WHERE type = ?', [configId]);
  
  if (data.length === 0) {
    globalCache.set(cacheKey, null, CACHE_TTL.website_templates);
    return null;
  }

  const config = typeof data[0].config === 'string' ? JSON.parse(data[0].config) : data[0].config;

  const template = {
    id: configId,
    ...config,
    header_components: config.header_components || [],
    body_components: config.body_components || [],
    footer_components: config.footer_components || [],
    site_settings: config.site_settings || {},
  };

  globalCache.set(cacheKey, template, CACHE_TTL.website_templates);

  return template;
});

/**
 * Get form fields for a business type and section (cached)
 */
export const getFormFields = cache(async (businessTypeId: string, sectionId?: string) => {
  const cacheKey = `form_fields:${businessTypeId}:${sectionId || 'all'}`;
  
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const sql = sectionId
    ? 'SELECT * FROM form_fields WHERE business_type_id = ? AND section_id = ? ORDER BY sort_order'
    : 'SELECT * FROM form_fields WHERE business_type_id = ? ORDER BY section_id, sort_order';

  const params = sectionId ? [businessTypeId, sectionId] : [businessTypeId];
  const data = await query(sql, params);

  // Parse JSON fields
  const parsed = data.map((f: any) => ({
    ...f,
    options: typeof f.options === 'string' ? JSON.parse(f.options) : f.options || null,
    validation: typeof f.validation === 'string' ? JSON.parse(f.validation) : f.validation || {},
    acl: typeof f.acl === 'string' ? JSON.parse(f.acl) : f.acl || {},
  }));

  globalCache.set(cacheKey, parsed, CACHE_TTL.form_fields);

  return parsed;
});

// ==========================================
// Cache Invalidation Helpers
// ==========================================

/**
 * Invalidate cache after mutation operations
 */
export const invalidateCache = {
  /**
   * Invalidate business types cache
   */
  businessTypes: () => {
    globalCache.invalidatePattern('business_type');
    console.log('[Cache] Invalidated business types cache');
  },

  /**
   * Invalidate sections cache
   */
  sections: () => {
    globalCache.invalidatePattern('section');
    console.log('[Cache] Invalidated sections cache');
  },

  /**
   * Invalidate field definitions cache
   */
  fieldDefinitions: () => {
    globalCache.invalidate('field_definitions');
    console.log('[Cache] Invalidated field definitions cache');
  },

  /**
   * Invalidate locations cache
   */
  locations: () => {
    globalCache.invalidatePattern('location');
    console.log('[Cache] Invalidated locations cache');
  },

  /**
   * Invalidate website settings cache
   */
  websiteSettings: () => {
    globalCache.invalidatePattern('website_settings');
    globalCache.invalidatePattern('website_template');
    console.log('[Cache] Invalidated website settings cache');
  },

  /**
   * Invalidate form fields cache
   */
  formFields: () => {
    globalCache.invalidatePattern('form_fields');
    console.log('[Cache] Invalidated form fields cache');
  },

  /**
   * Invalidate ALL cache (use sparingly)
   */
  all: () => {
    globalCache.clear();
    console.log('[Cache] Cleared all caches');
  },
};

// ==========================================
// Cache Statistics API (for debugging)
// ==========================================

export const getCacheStats = () => {
  return globalCache.getStats();
};

// ==========================================
// Revalidation API (for on-demand refresh)
// ==========================================

export const revalidateCache = {
  businessTypes: async (activeOnly: boolean = true) => {
    const cacheKey = `business_types:${activeOnly}`;
    globalCache.invalidate(cacheKey);
    return await getBusinessTypes(activeOnly);
  },

  sections: async (activeOnly: boolean = true) => {
    const cacheKey = `sections:${activeOnly}`;
    globalCache.invalidate(cacheKey);
    return await getSections(activeOnly);
  },

  fieldDefinitions: async () => {
    globalCache.invalidate('field_definitions');
    return await getFieldDefinitions();
  },

  locations: async (type?: string) => {
    const cacheKey = `locations:${type || 'all'}`;
    globalCache.invalidate(cacheKey);
    return await getLocations(type);
  },

  websiteSettings: async (type: string = 'main') => {
    const cacheKey = `website_settings:${type}`;
    globalCache.invalidate(cacheKey);
    return await getWebsiteSettings(type);
  },

  websiteTemplate: async (type: string = 'main') => {
    const cacheKey = `website_template:${type}`;
    globalCache.invalidate(cacheKey);
    return await getWebsiteTemplate(type);
  },
};
