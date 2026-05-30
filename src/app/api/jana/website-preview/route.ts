import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/jana/website-preview
 * Render a live preview of draft components without publishing
 * Used for real-time preview in the site builder
 * Accepts draft component layout and renders HTML preview
 */
export async function POST(request: NextRequest) {
  try {
    const { header_components, body_components, footer_components, site_settings } = await request.json();

    // Fetch actual component definitions for metadata
    const components = await query(`
      SELECT id, \`key\`, name, icon, zone, category 
      FROM site_components 
      WHERE enabled = true
      ORDER BY sort_order ASC
    `);

    const componentMap = new Map(components.map((c: any) => [c.key, c]));

    // Build HTML preview
    const renderZone = (comps: any[], zone: string) => {
      if (!comps || comps.length === 0) return '';
      
      return comps.map(comp => {
        const def = componentMap.get(comp.type);
        const icon = def?.icon || '📦';
        const name = comp.name || 'Component';
        
        return `
          <div style="
            padding: 1rem;
            margin-bottom: 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
            font-family: system-ui, -apple-system, sans-serif;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 0.5rem;
              margin-bottom: 0.5rem;
              font-weight: bold;
              color: #0f172a;
            ">
              <span style="font-size: 1.5rem;">${icon}</span>
              <span>${name}</span>
              <span style="font-size: 0.75rem; color: #64748b; margin-left: auto;">
                <strong>${zone.toUpperCase()}</strong>
              </span>
            </div>
            <div style="
              font-size: 0.875rem;
              color: #64748b;
              background: #fff;
              padding: 0.75rem;
              border-radius: 4px;
              border-left: 3px solid #10b981;
            ">
              ${JSON.stringify(comp.props || {}, null, 2)}
            </div>
          </div>
        `;
      }).join('');
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview - ${site_settings?.site_name || 'Untitled Page'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            background: #f1f5f9;
            color: #0f172a;
          }
          .preview-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }
          .zone {
            margin-bottom: 3rem;
          }
          .zone-header {
            font-size: 0.875rem;
            font-weight: 900;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
          }
          .empty {
            padding: 2rem;
            text-align: center;
            color: #94a3b8;
            background: #fff;
            border: 2px dashed #e2e8f0;
            border-radius: 8px;
          }
          .info-bar {
            background: linear-gradient(135deg, #0ea5e9, #06b6d4);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .info-bar strong { font-size: 1.25rem; }
          .info-bar span { font-size: 0.875rem; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="preview-container">
          <div class="info-bar">
            <strong>👁️ LIVE PREVIEW</strong>
            <span>Real-time draft preview (changes here don't affect published site until you click PUBLISH)</span>
          </div>

          ${header_components?.length > 0 ? `
            <div class="zone">
              <div class="zone-header">📌 Header Zone</div>
              ${renderZone(header_components, 'header')}
            </div>
          ` : ''}

          ${body_components?.length > 0 ? `
            <div class="zone">
              <div class="zone-header">📄 Body Zone</div>
              ${renderZone(body_components, 'body')}
            </div>
          ` : `<div class="zone"><div class="empty">No body components added yet</div></div>`}

          ${footer_components?.length > 0 ? `
            <div class="zone">
              <div class="zone-header">👣 Footer Zone</div>
              ${renderZone(footer_components, 'footer')}
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (e: any) {
    console.error('Preview rendering error:', e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
