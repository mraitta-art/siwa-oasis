import { query, execute } from '@/lib/db';

// GET component config schema and current values
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const component = await query(
      'SELECT id, key, name, config_schema, component_config, default_props FROM site_components WHERE id = ?',
      [params.id]
    );

    if (!component) {
      return Response.json({ error: 'Component not found' }, { status: 404 });
    }

    return Response.json({
      id: component.id,
      key: component.key,
      name: component.name,
      schema: component.config_schema ? JSON.parse(component.config_schema) : null,
      currentConfig: component.component_config ? JSON.parse(component.component_config) : {},
      defaultProps: component.default_props ? JSON.parse(component.default_props) : {}
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT update component configuration
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { component_config, version, deprecation_notice, tags } = body;

    // Validate component exists
    const component = await query('SELECT id FROM site_components WHERE id = ?', [params.id]);
    if (!component) {
      return Response.json({ error: 'Component not found' }, { status: 404 });
    }

    // Update configuration
    await execute(
      `UPDATE site_components 
       SET component_config = ?, version = ?, deprecation_notice = ?, tags = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        JSON.stringify(component_config || {}),
        version || '1.0.0',
        deprecation_notice || null,
        JSON.stringify(tags || []),
        params.id
      ]
    );

    return Response.json({
      success: true,
      message: 'Component configuration updated',
      id: params.id
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE revert to defaults
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await execute(
      'UPDATE site_components SET component_config = NULL, version = "1.0.0", deprecation_notice = NULL WHERE id = ?',
      [params.id]
    );

    return Response.json({
      success: true,
      message: 'Component configuration reset to defaults'
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
