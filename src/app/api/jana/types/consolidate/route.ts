import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

/**
 * POST /api/jana/types/consolidate
 * Merge duplicate types under a parent type and update all dependencies
 * 
 * Body:
 * {
 *   parentTypeId: string,  // The parent to keep
 *   childTypeIds: string[],  // Duplicate/child types to merge under parent
 *   action: 'merge' | 'create_parent'  // merge: use existing parent, create_parent: create new parent
 *   newParentName?: string  // (only for create_parent action)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    const {
      parentTypeId,
      childTypeIds,
      action,
      newParentName
    } = body;

    if (!parentTypeId || !childTypeIds || !Array.isArray(childTypeIds) || childTypeIds.length === 0) {
      return NextResponse.json(
        { error: 'parentTypeId and childTypeIds array required' },
        { status: 400 }
      );
    }

    // Verify parent exists
    const parentType = await query('SELECT * FROM business_types WHERE id = ?', [parentTypeId]);
    if (parentType.length === 0) {
      return NextResponse.json(
        { error: `Parent type "${parentTypeId}" not found` },
        { status: 404 }
      );
    }

    const affectedTypes = [parentTypeId, ...childTypeIds];
    let actualParentId = parentTypeId;

    // If action is create_parent, create a new parent first
    if (action === 'create_parent') {
      if (!newParentName) {
        return NextResponse.json(
          { error: 'newParentName required for create_parent action' },
          { status: 400 }
        );
      }

      const newParentId = newParentName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      // Check if new parent already exists
      const existing = await query('SELECT id FROM business_types WHERE id = ?', [newParentId]);
      if (existing.length > 0) {
        return NextResponse.json(
          { error: `Parent type with ID "${newParentId}" already exists` },
          { status: 400 }
        );
      }

      // Create the new parent type
      await execute(
        `INSERT INTO business_types (id, name, icon, icon_color, is_parent, parent_id, sections, sort_order) 
         VALUES (?, ?, ?, ?, 1, NULL, ?, ?)`,
        [
          newParentId,
          newParentName,
          'fas fa-folder',
          '#8b5cf6',
          JSON.stringify(['basic', 'location', 'contact']),
          999
        ]
      );

      actualParentId = newParentId;
    }

    // Step 1: Update all duplicate types to be children of the parent
    for (const childId of childTypeIds) {
      // Check if type exists
      const childType = await query('SELECT * FROM business_types WHERE id = ?', [childId]);
      if (childType.length === 0) {
        console.warn(`Type ${childId} not found, skipping...`);
        continue;
      }

      // Update the type to be a child of the parent
      await execute(
        `UPDATE business_types 
         SET parent_id = ?, is_parent = 0 
         WHERE id = ?`,
        [actualParentId, childId]
      );
    }

    // Step 2: Update all businesses using old types to use the parent
    const typeIdList = childTypeIds.map(id => `'${id}'`).join(',');
    await execute(
      `UPDATE businesses 
       SET type_id = ? 
       WHERE type_id IN (${typeIdList})`,
      [actualParentId]
    );

    // Step 3: Update form field references
    await execute(
      `UPDATE form_fields 
       SET business_type_id = ? 
       WHERE business_type_id IN (${typeIdList})`,
      [actualParentId]
    );

    // Step 4: Update card template references
    await execute(
      `UPDATE card_templates 
       SET business_type_id = ? 
       WHERE business_type_id IN (${typeIdList})`,
      [actualParentId]
    );

    // Step 5: Update orchestrator page references (if any components reference old type IDs)
    // This handles cases where pages have dynamic components that filter by type
    const orchestratorPages = await query(
      `SELECT id, components FROM orchestrator_pages 
       WHERE components IS NOT NULL LIMIT 1000`
    );

    let orchestratorUpdated = 0;
    for (const page of orchestratorPages) {
      try {
        let components = typeof page.components === 'string' 
          ? JSON.parse(page.components) 
          : page.components;
        
        if (!components || typeof components !== 'object') continue;

        // Recursively search and replace old type IDs with parent type ID
        const stringified = JSON.stringify(components);
        let updated = false;
        
        for (const oldTypeId of childTypeIds) {
          if (stringified.includes(oldTypeId)) {
            components = JSON.parse(
              stringified.replaceAll(`"${oldTypeId}"`, `"${actualParentId}"`)
            );
            updated = true;
          }
        }

        if (updated) {
          await execute(
            `UPDATE orchestrator_pages SET components = ? WHERE id = ?`,
            [JSON.stringify(components), page.id]
          );
          orchestratorUpdated++;
        }
      } catch (e) {
        console.warn(`Failed to update orchestrator page ${page.id}:`, e);
      }
    }

    // Step 6: Invalidate caches
    invalidateCache.businessTypes();

    // Log the consolidation
    const summary = {
      action: 'consolidate_types',
      parentTypeId: actualParentId,
      mergedTypes: childTypeIds,
      totalTypes: affectedTypes.length,
      orchestratorPagesUpdated: orchestratorUpdated,
      timestamp: new Date().toISOString()
    };

    await execute(
      'INSERT INTO activity_log (message, user_email) VALUES (?, ?)',
      [
        `Type Consolidation: Merged ${childTypeIds.length} types under "${actualParentId}". ` +
        `Orchestrator pages updated: ${orchestratorUpdated}. ` +
        `Total affected: ${affectedTypes.length}`,
        user.email
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Successfully consolidated ${childTypeIds.length} types under "${actualParentId}". Orchestrator synchronized.`,
      summary,
      newParentId: actualParentId
    });
  } catch (e: any) {
    const errorMsg = e.message || String(e);
    console.error('[CONSOLIDATE ERROR]', errorMsg);

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
