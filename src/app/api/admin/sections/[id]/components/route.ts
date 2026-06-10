import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: sectionId } = params;
    const { components } = await request.json();

    if (!Array.isArray(components) || components.length === 0) {
      return Response.json({ error: 'No components provided' }, { status: 400 });
    }

    // Get template configs
    const templateIds = components.map(c => c.templateId);
    const templatesQuery = `
      SELECT id, fields
      FROM component_templates
      WHERE id IN (${templateIds.map(() => '?').join(',')})
    `;

    const templates = await db.query(templatesQuery, templateIds);
    const templateMap = new Map(templates.map((t: any) => [t.id, t]));

    // Insert components
    let orderIndex = 0;
    for (const comp of components) {
      const template = templateMap.get(comp.templateId);
      if (!template) continue;

      const query = `
        INSERT INTO section_components (
          id, section_id, component_type, label, is_required,
          is_repeatable, max_items, config, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const config = {
        fields: template.fields || [],
        repeatable: comp.isRepeatable
      };

      await db.query(query, [
        uuidv4(),
        sectionId,
        comp.templateId,
        comp.label,
        comp.isRequired ? 1 : 0,
        comp.isRepeatable ? 1 : 0,
        comp.maxItems || 1,
        JSON.stringify(config),
        orderIndex++
      ]);
    }

    return Response.json({ success: true, count: components.length });
  } catch (error) {
    console.error('Add components error:', error);
    return Response.json({ error: 'Failed to add components' }, { status: 500 });
  }
}
