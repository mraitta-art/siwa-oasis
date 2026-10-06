import { queryOne, execute } from '@/lib/db';

// GET component config schema and current values
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(props.params);
    const component = await queryOne<any>(
      'SELECT id, `key`, name, config_schema, component_config, default_props FROM site_components WHERE id = ?',
      [params.id]
    );

    if (!component) {
      return Response.json({ error: 'Component not found' }, { status: 404 });
    }

    return Response.json({
      id: component.id,
      key: component.key,
      name: component.name,
      schema: component.config_schema ? (typeof component.config_schema === 'string' ? JSON.parse(component.config_schema) : component.config_schema) : null,
      currentConfig: component.component_config ? (typeof component.component_config === 'string' ? JSON.parse(component.component_config) : component.component_config) : {},
      defaultProps: component.default_props ? (typeof component.default_props === 'string' ? JSON.parse(component.default_props) : component.default_props) : {}
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT update component configuration
export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(props.params);
    const body = await req.json();
    const { component_config, version, deprecation_notice, tags } = body;

    // Validate component exists
    const component = await queryOne('SELECT id FROM site_components WHERE id = ?', [params.id]);
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
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(props.params);
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
