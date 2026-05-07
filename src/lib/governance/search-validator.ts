import { query } from '@/lib/db';

export interface ValidationReport {
  isValid: boolean;
  brokenFields: string[];
  missingSections: string[];
}

/**
 * Verifies if a search engine's configuration is consistent with the current database schema.
 */
export async function validateSearchEngine(allowedFields: string[]): Promise<ValidationReport> {
  try {
    // 1. Get all active fields and their section IDs from the database
    const dbFields = await query('SELECT name, section_id FROM form_fields');
    const dbSections = await query('SELECT id FROM sections');
    
    const validFieldNames = dbFields.map((f: any) => f.name);
    const validSectionIds = dbSections.map((s: any) => s.id);

    // 2. Identify broken fields (fields that exist in search engine but not in form_fields table)
    const brokenFields = allowedFields.filter(f => !validFieldNames.includes(f));

    // 3. Identify missing sections (sections related to chosen fields that might be missing)
    const selectedFieldData = dbFields.filter((f: any) => allowedFields.includes(f.name));
    const usedSectionIds = Array.from(new Set(selectedFieldData.map((f: any) => f.section_id)));
    const missingSections = usedSectionIds.filter(id => id && !validSectionIds.includes(id));

    return {
      isValid: brokenFields.length === 0 && missingSections.length === 0,
      brokenFields,
      missingSections: missingSections as string[]
    };
  } catch (e) {
    console.error('Validation Failure:', e);
    return { isValid: false, brokenFields: [], missingSections: [] };
  }
}
