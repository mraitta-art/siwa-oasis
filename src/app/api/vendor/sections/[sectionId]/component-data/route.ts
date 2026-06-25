import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;

    const query = `
      SELECT sc.id, scd.id as data_id, scd.data, scd.status, scd.title
      FROM section_components sc
      LEFT JOIN section_component_data scd ON sc.id = scd.section_component_id
      WHERE sc.section_id = ?
      ORDER BY sc.display_order, scd.display_order
    `;

    const [rows] = await db.query(query, [sectionId]);

    // Group by component_id
    const grouped: Record<string, any[]> = {};
    rows?.forEach((row: any) => {
      if (!grouped[row.id]) {
        grouped[row.id] = [];
      }
      if (row.data_id) {
        grouped[row.id].push({
          id: row.data_id,
          data: JSON.parse(row.data || '{}'),
          status: row.status,
          title: row.title
        });
      }
    });

    return Response.json(grouped);
  } catch (error) {
    console.error('Get component data error:', error);
    return Response.json({ error: 'Failed to load data' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const componentData = await request.json();

    // Get current user business context (simplified - use from auth)
    const businessId = 'placeholder-business-id'; // Would come from auth/context

    // For each component
    for (const [componentId, instances] of Object.entries(componentData)) {
      const dataArray = instances as any[];

      // Delete old data
      await db.query(
        'DELETE FROM section_component_data WHERE section_component_id = ?',
        [componentId]
      );

      // Insert new data
      for (let idx = 0; idx < dataArray.length; idx++) {
        const inst = dataArray[idx];
        if (!inst.data || Object.keys(inst.data).length === 0) continue;

        await db.query(
          `INSERT INTO section_component_data 
           (id, section_component_id, business_id, data, status, display_order, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            uuidv4(),
            componentId,
            businessId,
            JSON.stringify(inst.data),
            'published',
            idx
          ]
        );
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Save component data error:', error);
    return Response.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
