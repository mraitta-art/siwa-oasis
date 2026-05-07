import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

/**
 * ESSENTIALS TEMPLATE SEEDER
 * Creates the universal "Essentials" free template in `minisite_templates`
 * and links it to the Free tier via `default_template_id`.
 * This ensures every free-tier vendor gets a functional minisite out of the box.
 */
export async function GET() {
  try {
    const steps: string[] = [];

    // 1. Ensure `default_template_id` column exists on subscription_tiers
    try {
      await execute(`
        ALTER TABLE subscription_tiers 
        ADD COLUMN IF NOT EXISTS default_template_id VARCHAR(100) DEFAULT NULL
      `);
      steps.push('✅ Ensured default_template_id column on subscription_tiers');
    } catch (e: any) {
      if (e.message.includes('Duplicate column')) {
        steps.push('⏩ default_template_id column already exists');
      } else {
        throw e;
      }
    }

    // 2. Ensure `template_id` column exists on businesses
    try {
      await execute(`
        ALTER TABLE businesses 
        ADD COLUMN IF NOT EXISTS template_id VARCHAR(100) DEFAULT NULL
      `);
      steps.push('✅ Ensured template_id column on businesses');
    } catch (e: any) {
      if (e.message.includes('Duplicate column')) {
        steps.push('⏩ template_id column already exists on businesses');
      } else {
        throw e;
      }
    }

    // 3. Create the Essentials template in minisite_templates
    const essentialsComponents = JSON.stringify([
      { id: 'comp_essentials_hero', type: 'hero_carousel', props: { carouselName: 'main_hero', maxSlides: 2 } },
      { id: 'comp_essentials_identity', type: 'section_block', props: { sectionId: 'sec_1_identity', title: 'About' } },
      { id: 'comp_essentials_gallery', type: 'gallery', props: { maxImages: 5, layout: 'grid' } },
      { id: 'comp_essentials_contact', type: 'section_block', props: { sectionId: 'sec_5_connectivity', title: 'Contact' } }
    ]);

    const essentialsSettings = JSON.stringify({
      description: 'The free starter template for all vendors. Includes identity section, basic gallery, and contact information.',
      primaryColor: '#D4AF37',
      font: 'system-ui',
      maxSlides: 2,
      maxImages: 5,
      remove_watermark: false,
      allow_custom_logo: false,
      allow_youtube_story: false,
      show_verified_badge: false,
      allow_direct_contact: false,
      is_universal: true,
      tier_locked: 'free'
    });

    await execute(`
      INSERT INTO minisite_templates (id, name, category_id, tier, components, settings)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        tier = VALUES(tier),
        components = VALUES(components),
        settings = VALUES(settings)
    `, ['essentials_free', 'Essentials', null, 'free', essentialsComponents, essentialsSettings]);
    steps.push('✅ Essentials template created/updated in minisite_templates');

    // 4. Link the Essentials template as the default for the Free tier
    await execute(`
      UPDATE subscription_tiers 
      SET default_template_id = ? 
      WHERE id = 'free'
    `, ['essentials_free']);
    steps.push('✅ Linked Essentials as default template for Free tier');

    // 5. Backfill: assign Essentials template to any businesses on 'free' tier that have no template
    const backfilled = await execute(`
      UPDATE businesses 
      SET template_id = 'essentials_free' 
      WHERE subscription_tier = 'free' AND (template_id IS NULL OR template_id = '')
    `);
    steps.push(`✅ Backfilled ${(backfilled as any)?.affectedRows || 0} free businesses with Essentials template`);

    // 6. Verify the result
    const verification = await query('SELECT id, name, default_template_id FROM subscription_tiers WHERE id = ?', ['free']) as any[];
    steps.push(`✅ Verification: Free tier default_template_id = ${verification[0]?.default_template_id || 'NULL'}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Essentials Template Pipeline Complete',
      steps
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
