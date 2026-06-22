# 💻 Implementation Guide: Section-Based Core (Step-by-Step)

## Phase 1: Database & Foundation

### Step 1: Create Migration Files

**File: `src/db/migrations/001_add_inheritance.ts`**

```typescript
import db from '@/lib/db';

export async function up() {
  console.log('Migration 001: Adding inheritance system...');

  // 1. Add parent_id to businesses
  await db.query(`
    ALTER TABLE businesses 
    ADD COLUMN parent_id INT,
    ADD COLUMN inherit_sections BOOLEAN DEFAULT FALSE,
    ADD FOREIGN KEY (parent_id) REFERENCES businesses(id)
  `);

  // 2. Create inheritance table
  await db.query(`
    CREATE TABLE business_section_inheritance (
      id INT PRIMARY KEY AUTO_INCREMENT,
      business_id INT NOT NULL,
      parent_business_id INT NOT NULL,
      section_id INT NOT NULL,
      override_level INT DEFAULT 0,
      inherited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (parent_business_id) REFERENCES businesses(id),
      FOREIGN KEY (section_id) REFERENCES sections(id),
      INDEX idx_business (business_id),
      INDEX idx_parent (parent_business_id),
      UNIQUE KEY unique_inheritance (business_id, section_id)
    )
  `);

  // 3. Add searchable/comparable flags to components
  await db.query(`
    ALTER TABLE section_components 
    ADD COLUMN is_searchable BOOLEAN DEFAULT FALSE,
    ADD COLUMN is_comparable BOOLEAN DEFAULT FALSE,
    ADD INDEX idx_searchable (is_searchable),
    ADD INDEX idx_comparable (is_comparable)
  `);

  // 4. Add category to sections
  await db.query(`
    ALTER TABLE sections 
    ADD COLUMN section_category VARCHAR(100),
    ADD COLUMN is_searchable BOOLEAN DEFAULT FALSE,
    ADD COLUMN is_comparable BOOLEAN DEFAULT FALSE,
    ADD INDEX idx_category (section_category)
  `);

  // 5. Add inheritance flag to component data
  await db.query(`
    ALTER TABLE section_component_data 
    ADD COLUMN inherited_from_parent BOOLEAN DEFAULT FALSE
  `);

  console.log('✅ Migration 001 complete');
}

export async function down() {
  console.log('Rollback migration 001...');
  await db.query('DROP TABLE IF EXISTS business_section_inheritance');
  await db.query('ALTER TABLE businesses DROP COLUMN parent_id, DROP COLUMN inherit_sections');
  await db.query('ALTER TABLE section_components DROP COLUMN is_searchable, DROP COLUMN is_comparable');
  await db.query('ALTER TABLE sections DROP COLUMN section_category, DROP COLUMN is_searchable, DROP COLUMN is_comparable');
  await db.query('ALTER TABLE section_component_data DROP COLUMN inherited_from_parent');
  console.log('✅ Rollback complete');
}
```

### Step 2: Create Inheritance Service

**File: `src/lib/inheritance-service.ts`**

```typescript
import db from '@/lib/db';

/**
 * Get all sections for a business (inherited + custom)
 */
export async function getBusinessSections(businessId: number) {
  // First check if business has a parent
  const business = await db.query<any>(
    'SELECT parent_id, inherit_sections FROM businesses WHERE id = ?',
    [businessId]
  );

  if (!business || !business.parent_id || !business.inherit_sections) {
    // No inheritance - get only business's own sections
    return await db.query<any[]>(
      `SELECT s.* FROM sections s
       WHERE s.id IN (
         SELECT section_id FROM business_section_inheritance
         WHERE business_id = ? AND override_level > 0
       )`,
      [businessId]
    );
  }

  // Get inherited sections (override_level = 0)
  const inheritedSections = await db.query<any[]>(
    `SELECT s.*, bsi.override_level FROM sections s
     INNER JOIN business_section_inheritance bsi ON s.id = bsi.section_id
     WHERE bsi.business_id = ? AND bsi.override_level = 0`,
    [businessId]
  );

  // Get custom sections (override_level > 0)
  const customSections = await db.query<any[]>(
    `SELECT s.*, bsi.override_level FROM sections s
     INNER JOIN business_section_inheritance bsi ON s.id = bsi.section_id
     WHERE bsi.business_id = ? AND bsi.override_level > 0`,
    [businessId]
  );

  return [...inheritedSections, ...customSections];
}

/**
 * Get component data for business (checking parent if inherited)
 */
export async function getComponentData(
  businessId: number,
  componentId: number
) {
  // Try to get from this business
  let data = await db.query<any>(
    `SELECT * FROM section_component_data
     WHERE business_id = ? AND section_component_id = ?`,
    [businessId, componentId]
  );

  if (data) {
    return data;
  }

  // Not found - check parent business
  const business = await db.query<any>(
    'SELECT parent_id FROM businesses WHERE id = ?',
    [businessId]
  );

  if (business?.parent_id) {
    data = await getComponentData(business.parent_id, componentId);
    if (data) {
      return { ...data, inherited_from_parent: true };
    }
  }

  return null;
}

/**
 * Setup inheritance for child business
 */
export async function setupInheritance(
  childBusinessId: number,
  parentBusinessId: number
) {
  // Update business record
  await db.query(
    'UPDATE businesses SET parent_id = ?, inherit_sections = TRUE WHERE id = ?',
    [parentBusinessId, childBusinessId]
  );

  // Get parent sections
  const parentSections = await getBusinessSections(parentBusinessId);

  // Create inheritance records for all parent sections
  for (const section of parentSections) {
    await db.query(
      `INSERT INTO business_section_inheritance 
       (business_id, parent_business_id, section_id, override_level)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE override_level = 0`,
      [childBusinessId, parentBusinessId, section.id, 0]
    );
  }

  return { success: true, sectionsInherited: parentSections.length };
}

/**
 * Override a parent section in child business
 */
export async function overrideSection(
  childBusinessId: number,
  sectionId: number
) {
  await db.query(
    `UPDATE business_section_inheritance 
     SET override_level = 1
     WHERE business_id = ? AND section_id = ?`,
    [childBusinessId, sectionId]
  );
}

/**
 * Use parent data (revert to inherited)
 */
export async function useParentData(
  childBusinessId: number,
  sectionId: number
) {
  await db.query(
    `UPDATE business_section_inheritance 
     SET override_level = 0
     WHERE business_id = ? AND section_id = ?`,
    [childBusinessId, sectionId]
  );

  // Clear custom data
  await db.query(
    `DELETE FROM section_component_data
     WHERE business_id = ? 
     AND section_component_id IN (
       SELECT id FROM section_components WHERE section_id = ?
     )`,
    [childBusinessId, sectionId]
  );
}
```

### Step 3: Create Search Service

**File: `src/lib/search-service.ts`**

```typescript
import db from '@/lib/db';

export interface SearchFilter {
  componentId: number;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: any;
}

/**
 * Search businesses by section component values
 */
export async function searchByComponents(filters: SearchFilter[]) {
  if (filters.length === 0) {
    // No filters - return all businesses
    return await db.query<any[]>(
      'SELECT * FROM businesses WHERE active = TRUE'
    );
  }

  let query = `
    SELECT DISTINCT b.* FROM businesses b
  `;

  // Add joins for each filter
  filters.forEach((_, idx) => {
    query += `
      LEFT JOIN section_component_data scd${idx}
        ON b.id = scd${idx}.business_id
        AND scd${idx}.section_component_id = ${filters[idx].componentId}
    `;
  });

  query += ` WHERE b.active = TRUE AND (1=0`;

  // Add WHERE conditions for each filter
  filters.forEach((filter, idx) => {
    query += ` OR (`;

    switch (filter.operator) {
      case 'equals':
        query += `JSON_EXTRACT(scd${idx}.data, '$.value') = '${filter.value}'`;
        break;

      case 'contains':
        query += `JSON_EXTRACT(scd${idx}.data, '$.value') LIKE '%${filter.value}%'`;
        break;

      case 'greater':
        query += `CAST(JSON_EXTRACT(scd${idx}.data, '$.value') AS DECIMAL) > ${filter.value}`;
        break;

      case 'less':
        query += `CAST(JSON_EXTRACT(scd${idx}.data, '$.value') AS DECIMAL) < ${filter.value}`;
        break;

      case 'between':
        query += `CAST(JSON_EXTRACT(scd${idx}.data, '$.value') AS DECIMAL) 
                  BETWEEN ${filter.value.min} AND ${filter.value.max}`;
        break;

      case 'in':
        const values = filter.value.map(v => `'${v}'`).join(',');
        query += `JSON_EXTRACT(scd${idx}.data, '$.value') IN (${values})`;
        break;
    }

    query += `)`;
  });

  query += `)`;

  return await db.query<any[]>(query);
}

/**
 * Get searchable components for a section
 */
export async function getSearchableComponents(sectionId: number) {
  return await db.query<any[]>(
    `SELECT id, label, component_type, data_type, config
     FROM section_components
     WHERE section_id = ? AND is_searchable = TRUE
     ORDER BY display_order`,
    [sectionId]
  );
}

/**
 * Get all searchable sections
 */
export async function getSearchableSections() {
  return await db.query<any[]>(
    `SELECT id, name, icon, section_category
     FROM sections
     WHERE is_searchable = TRUE AND active = TRUE
     ORDER BY section_category, sort_order`
  );
}
```

### Step 4: Create Comparison Service

**File: `src/lib/comparison-service.ts`**

```typescript
import db from '@/lib/db';
import { getComponentData } from './inheritance-service';

/**
 * Compare multiple businesses
 */
export async function compareBusinesses(
  businessIds: number[],
  sectionIds?: number[]
) {
  const comparison: Record<number, any> = {};

  for (const businessId of businessIds) {
    comparison[businessId] = {
      name: '',
      sections: {}
    };

    // Get business info
    const business = await db.query<any>(
      'SELECT id, name FROM businesses WHERE id = ?',
      [businessId]
    );

    if (!business) continue;
    comparison[businessId].name = business.name;

    // Get sections to compare
    let sectionsToCompare = sectionIds;
    if (!sectionsToCompare) {
      // Get all comparable sections
      const sections = await db.query<any[]>(
        'SELECT id FROM sections WHERE is_comparable = TRUE'
      );
      sectionsToCompare = sections.map(s => s.id);
    }

    // For each section
    for (const sectionId of sectionsToCompare) {
      const section = await db.query<any>(
        'SELECT name FROM sections WHERE id = ?',
        [sectionId]
      );

      if (!section) continue;

      comparison[businessId].sections[section.name] = {};

      // Get comparable components in this section
      const components = await db.query<any[]>(
        `SELECT id, label FROM section_components
         WHERE section_id = ? AND is_comparable = TRUE`,
        [sectionId]
      );

      for (const component of components) {
        const data = await getComponentData(businessId, component.id);
        comparison[businessId].sections[section.name][component.label] =
          data?.data?.value || null;
      }
    }
  }

  return comparison;
}

/**
 * Format comparison for display
 */
export function formatComparison(comparison: Record<number, any>) {
  const businessIds = Object.keys(comparison).map(Number);
  const firstBusiness = comparison[businessIds[0]];

  const result = {
    businesses: businessIds.map(id => ({
      id,
      name: comparison[id].name
    })),
    sections: {} as Record<string, any>
  };

  for (const sectionName of Object.keys(firstBusiness.sections)) {
    result.sections[sectionName] = {};

    const fields = Object.keys(firstBusiness.sections[sectionName]);

    for (const field of fields) {
      result.sections[sectionName][field] = businessIds.map(id => ({
        businessId: id,
        value: comparison[id].sections[sectionName]?.[field]
      }));
    }
  }

  return result;
}
```

---

## Phase 2: API Endpoints

### Step 1: Inheritance API

**File: `src/app/api/businesses/[id]/sections/route.ts`**

```typescript
import { getBusinessSections } from '@/lib/inheritance-service';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = parseInt(params.id);
    const sections = await getBusinessSections(businessId);

    return Response.json({ success: true, data: sections });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**File: `src/app/api/business-inheritance/[businessId]/route.ts`**

```typescript
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { setupInheritance, overrideSection, useParentData } from '@/lib/inheritance-service';

export async function GET(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = parseInt(params.businessId);

    const inheritance = await db.query<any[]>(
      `SELECT * FROM business_section_inheritance WHERE business_id = ?`,
      [businessId]
    );

    return Response.json({ success: true, data: inheritance });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  await requireAdmin();

  try {
    const businessId = parseInt(params.businessId);
    const { action, parentBusinessId, sectionId } = await request.json();

    if (action === 'setup') {
      const result = await setupInheritance(businessId, parentBusinessId);
      return Response.json({ success: true, data: result });
    }

    if (action === 'override') {
      await overrideSection(businessId, sectionId);
      return Response.json({ success: true });
    }

    if (action === 'useParent') {
      await useParentData(businessId, sectionId);
      return Response.json({ success: true });
    }

    return Response.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Step 2: Search API

**File: `src/app/api/search/by-sections/route.ts`**

```typescript
import { searchByComponents, getSearchableSections } from '@/lib/search-service';

export async function GET() {
  try {
    // Return searchable sections metadata
    const sections = await getSearchableSections();
    return Response.json({ success: true, data: sections });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { filters } = await request.json();

    const results = await searchByComponents(filters);

    return Response.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Step 3: Comparison API

**File: `src/app/api/compare/businesses/route.ts`**

```typescript
import { compareBusinesses, formatComparison } from '@/lib/comparison-service';

export async function POST(request: Request) {
  try {
    const { businessIds, sectionIds } = await request.json();

    if (!Array.isArray(businessIds) || businessIds.length < 2) {
      return Response.json(
        { success: false, error: 'At least 2 businesses required' },
        { status: 400 }
      );
    }

    const comparison = await compareBusinesses(businessIds, sectionIds);
    const formatted = formatComparison(comparison);

    return Response.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

---

## Phase 3: Frontend Components

### Step 1: Advanced Search Component

**File: `src/components/AdvancedSectionSearch.tsx`**

```typescript
'use client';

import React, { useState, useEffect } from 'react';

interface SearchableSection {
  id: number;
  name: string;
  icon: string;
  section_category: string;
}

interface SearchableComponent {
  id: number;
  label: string;
  component_type: string;
  data_type: string;
}

export default function AdvancedSectionSearch() {
  const [sections, setSections] = useState<SearchableSection[]>([]);
  const [components, setComponents] = useState<Record<number, SearchableComponent[]>>({});
  const [filters, setFilters] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load searchable sections
  useEffect(() => {
    fetch('/api/search/by-sections')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSections(data.data);
          // Load components for each section
          data.data.forEach(section => loadComponents(section.id));
        }
      });
  }, []);

  async function loadComponents(sectionId: number) {
    const res = await fetch(`/api/sections/${sectionId}/components`);
    const data = await res.json();
    if (data.success) {
      setComponents(prev => ({
        ...prev,
        [sectionId]: data.data.filter(c => c.is_searchable)
      }));
    }
  }

  function addFilter(componentId: number) {
    setFilters(prev => [...prev, { componentId, operator: 'equals', value: '' }]);
  }

  function removeFilter(index: number) {
    setFilters(prev => prev.filter((_, i) => i !== index));
  }

  function updateFilter(index: number, field: string, value: any) {
    setFilters(prev =>
      prev.map((f, i) => i === index ? { ...f, [field]: value } : f)
    );
  }

  async function performSearch() {
    setLoading(true);
    try {
      const res = await fetch('/api/search/by-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="advanced-search">
      <h2>Advanced Search</h2>

      {/* Search Filters */}
      <div className="search-filters">
        {sections.map(section => (
          <div key={section.id} className="section-group">
            <h3>{section.name}</h3>
            <div className="components-grid">
              {(components[section.id] || []).map(component => (
                <button
                  key={component.id}
                  onClick={() => addFilter(component.id)}
                  className="component-btn"
                >
                  {component.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Active Filters */}
      <div className="active-filters">
        {filters.map((filter, idx) => (
          <div key={idx} className="filter-row">
            <select
              value={filter.operator}
              onChange={(e) => updateFilter(idx, 'operator', e.target.value)}
            >
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
              <option value="greater">Greater than</option>
              <option value="less">Less than</option>
              <option value="between">Between</option>
            </select>

            <input
              type="text"
              placeholder="Value"
              value={filter.value}
              onChange={(e) => updateFilter(idx, 'value', e.target.value)}
            />

            <button onClick={() => removeFilter(idx)}>Remove</button>
          </div>
        ))}
      </div>

      {/* Search Button */}
      <button
        onClick={performSearch}
        disabled={loading || filters.length === 0}
        className="search-btn"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      {/* Results */}
      <div className="search-results">
        <h3>Results ({results.length})</h3>
        {results.map(business => (
          <div key={business.id} className="result-item">
            <h4>{business.name}</h4>
            <p className="result-type">{business.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 2: Comparison Component

**File: `src/components/BusinessComparison.tsx`**

```typescript
'use client';

import React, { useState } from 'react';

interface ComparisonProps {
  businessIds: number[];
  sectionIds?: number[];
}

export default function BusinessComparison({
  businessIds,
  sectionIds
}: ComparisonProps) {
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadComparison();
  }, [businessIds]);

  async function loadComparison() {
    setLoading(true);
    try {
      const res = await fetch('/api/compare/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIds, sectionIds })
      });
      const data = await res.json();
      if (data.success) {
        setComparison(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading comparison...</div>;
  if (!comparison) return <div>Failed to load comparison</div>;

  return (
    <div className="business-comparison">
      <h2>Business Comparison</h2>

      <table className="comparison-table">
        <thead>
          <tr>
            <th>Criterion</th>
            {comparison.businesses.map(business => (
              <th key={business.id}>{business.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(comparison.sections).map(([sectionName, fields]) => (
            <React.Fragment key={sectionName}>
              <tr className="section-header">
                <td colSpan={comparison.businesses.length + 1}>
                  <strong>{sectionName}</strong>
                </td>
              </tr>
              {Object.entries(fields).map(([fieldName, values]: [string, any]) => (
                <tr key={`${sectionName}-${fieldName}`}>
                  <td className="field-name">{fieldName}</td>
                  {(values as any[]).map(v => (
                    <td key={`${sectionName}-${fieldName}-${v.businessId}`}>
                      {v.value ? String(v.value) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Step 3: Inheritance Management Component

**File: `src/app/admin/business-inheritance/page.tsx`**

```typescript
'use client';

import React, { useState, useEffect } from 'react';

interface Business {
  id: number;
  name: string;
  parent_id: number | null;
}

export default function BusinessInheritanceManager() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedParent, setSelectedParent] = useState<number | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    const res = await fetch('/api/businesses');
    const data = await res.json();
    if (data.success) {
      setBusinesses(data.data);
    }
  }

  async function setupInheritance() {
    if (!selectedParent || selectedChildren.length === 0) return;

    setSaving(true);
    try {
      for (const childId of selectedChildren) {
        await fetch(`/api/business-inheritance/${childId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'setup',
            parentBusinessId: selectedParent
          })
        });
      }

      // Reload
      await loadBusinesses();
      setSelectedChildren([]);
      setSelectedParent(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inheritance-manager">
      <h2>Setup Business Inheritance</h2>

      <div className="setup-form">
        <div className="form-group">
          <label>Parent Business:</label>
          <select
            value={selectedParent || ''}
            onChange={(e) => setSelectedParent(parseInt(e.target.value))}
          >
            <option value="">Select parent...</option>
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Child Businesses:</label>
          <div className="checkbox-list">
            {businesses
              .filter(b => b.id !== selectedParent)
              .map(b => (
                <label key={b.id}>
                  <input
                    type="checkbox"
                    checked={selectedChildren.includes(b.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChildren([...selectedChildren, b.id]);
                      } else {
                        setSelectedChildren(
                          selectedChildren.filter(id => id !== b.id)
                        );
                      }
                    }}
                  />
                  {b.name}
                </label>
              ))}
          </div>
        </div>

        <button
          onClick={setupInheritance}
          disabled={saving || !selectedParent || selectedChildren.length === 0}
        >
          {saving ? 'Setting up...' : 'Setup Inheritance'}
        </button>
      </div>

      {/* Current Inheritance Structure */}
      <div className="inheritance-tree">
        <h3>Current Inheritance Structure</h3>
        {businesses
          .filter(b => !b.parent_id)
          .map(parent => (
            <div key={parent.id} className="parent-node">
              <div className="parent-name">🏢 {parent.name}</div>
              <div className="children">
                {businesses
                  .filter(b => b.parent_id === parent.id)
                  .map(child => (
                    <div key={child.id} className="child-node">
                      📍 {child.name}
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
```

---

## Phase 4: Testing

### Step 1: Unit Tests

**File: `src/lib/__tests__/inheritance-service.test.ts`**

```typescript
import { getBusinessSections, getComponentData, setupInheritance } from '../inheritance-service';
import db from '@/lib/db';

// Mock database
jest.mock('@/lib/db');

describe('Inheritance Service', () => {
  describe('getBusinessSections', () => {
    it('should return only own sections if no parent', async () => {
      // Mock queries
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ parent_id: null }) // First call: get business
        .mockResolvedValueOnce([]); // Second call: get sections

      const sections = await getBusinessSections(1);

      expect(sections).toEqual([]);
    });

    it('should return inherited + custom sections', async () => {
      const inherited = [{ id: 1, name: 'Basic Data' }];
      const custom = [{ id: 2, name: 'Custom Section' }];

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ parent_id: 2, inherit_sections: true })
        .mockResolvedValueOnce(inherited)
        .mockResolvedValueOnce(custom);

      const sections = await getBusinessSections(1);

      expect(sections).toHaveLength(2);
      expect(sections).toContainEqual(inherited[0]);
      expect(sections).toContainEqual(custom[0]);
    });
  });

  describe('getComponentData', () => {
    it('should get data from business', async () => {
      const data = { id: 1, data: { value: 'test' } };
      (db.query as jest.Mock).mockResolvedValueOnce(data);

      const result = await getComponentData(1, 1);

      expect(result).toEqual(data);
    });

    it('should check parent if not found', async () => {
      const parentData = { id: 1, data: { value: 'parent value' } };

      (db.query as jest.Mock)
        .mockResolvedValueOnce(null) // Not in child
        .mockResolvedValueOnce({ parent_id: 2 }) // Get parent
        .mockResolvedValueOnce(parentData); // Found in parent

      const result = await getComponentData(1, 1);

      expect(result).toEqual({ ...parentData, inherited_from_parent: true });
    });
  });
});
```

---

## Summary

This guide provides:

✅ **Database schema** - Foundation tables for inheritance
✅ **Services** - Business logic for inheritance, search, comparison
✅ **APIs** - RESTful endpoints for all operations
✅ **UI Components** - React components for admin & customer features
✅ **Tests** - Unit tests for core functionality

**Next steps:**
1. Run migrations
2. Deploy services
3. Test APIs
4. Build frontend components
5. Train admins & vendors

Ready to implement! 🚀
