import { execute, query } from '@/lib/db';

export async function POST(req: Request) {
  const mode = process.env.NODE_ENV;
  
  try {
    // Add new columns to site_components for advanced configuration
    await execute(`
      ALTER TABLE site_components
      ADD COLUMN IF NOT EXISTS config_schema JSON COMMENT 'Defines editable fields for this component',
      ADD COLUMN IF NOT EXISTS component_config JSON COMMENT 'Current component behavior configuration',
      ADD COLUMN IF NOT EXISTS usage_tracking JSON COMMENT 'Tracks where component is used',
      ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT '1.0.0' COMMENT 'Component semantic version',
      ADD COLUMN IF NOT EXISTS deprecation_notice TEXT COMMENT 'Deprecation warning if any',
      ADD COLUMN IF NOT EXISTS tags JSON COMMENT 'Component tags for categorization'
    `);

    // Update existing components with default config schema
    const components = await query('SELECT id, key, category FROM site_components');
    
    for (const comp of components) {
      const schema = generateDefaultSchema(comp.key, comp.category);
      await execute('UPDATE site_components SET config_schema = ? WHERE id = ?', 
        [JSON.stringify(schema), comp.id]
      );
    }

    return Response.json({
      success: true,
      message: 'Schema extended with config management columns',
      componentsUpdated: components.length,
      nextStep: 'Use /jana/component-library to manage component configurations'
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
      hint: mode === 'production' ? 'Schema migration failed in production' : 'Check database connection'
    }, { status: 500 });
  }
}

function generateDefaultSchema(key: string, category: string) {
  // Generate appropriate config schema based on component type
  const schemas: Record<string, any> = {
    hero_carousel: {
      fields: [
        { name: 'animation_type', type: 'select', label: 'Animation', options: ['fade', 'slide', 'zoom'], default: 'fade' },
        { name: 'autoplay_delay', type: 'number', label: 'Autoplay Delay (ms)', default: 5000, min: 1000, max: 10000 },
        { name: 'show_navigation', type: 'boolean', label: 'Show Navigation Dots', default: true },
        { name: 'height_mobile', type: 'number', label: 'Mobile Height (px)', default: 300, min: 200, max: 600 },
        { name: 'height_desktop', type: 'number', label: 'Desktop Height (px)', default: 500, min: 300, max: 800 }
      ]
    },
    search_bar: {
      fields: [
        { name: 'placeholder', type: 'text', label: 'Placeholder Text', default: 'Search experiences...' },
        { name: 'show_filters', type: 'boolean', label: 'Show Quick Filters', default: true },
        { name: 'auto_suggestions', type: 'boolean', label: 'Auto Suggestions', default: true },
        { name: 'max_results', type: 'number', label: 'Max Results', default: 10, min: 5, max: 50 }
      ]
    },
    blog: {
      fields: [
        { name: 'posts_per_page', type: 'number', label: 'Posts Per Page', default: 6, min: 1, max: 20 },
        { name: 'featured_count', type: 'number', label: 'Featured Posts', default: 3, min: 1, max: 10 },
        { name: 'show_categories', type: 'boolean', label: 'Show Categories', default: true },
        { name: 'show_authors', type: 'boolean', label: 'Show Authors', default: true },
        { name: 'excerpt_length', type: 'number', label: 'Excerpt Length (chars)', default: 160, min: 80, max: 300 }
      ]
    },
    testimonials: {
      fields: [
        { name: 'items_per_row', type: 'number', label: 'Items Per Row', default: 3, min: 1, max: 4 },
        { name: 'autoplay', type: 'boolean', label: 'Autoplay', default: false },
        { name: 'show_ratings', type: 'boolean', label: 'Show Star Ratings', default: true },
        { name: 'layout_style', type: 'select', label: 'Layout Style', options: ['grid', 'carousel', 'masonry'], default: 'grid' }
      ]
    },
    newsletter: {
      fields: [
        { name: 'button_text', type: 'text', label: 'Button Text', default: 'Subscribe' },
        { name: 'placeholder_text', type: 'text', label: 'Email Placeholder', default: 'Enter your email...' },
        { name: 'double_opt_in', type: 'boolean', label: 'Double Opt-In', default: true },
        { name: 'success_message', type: 'text', label: 'Success Message', default: 'Thank you for subscribing!' }
      ]
    }
  };

  return schemas[key] || {
    fields: [
      { name: 'custom_title', type: 'text', label: 'Component Title', default: '' },
      { name: 'visibility', type: 'select', label: 'Visibility', options: ['all', 'authenticated', 'premium'], default: 'all' }
    ]
  };
}
