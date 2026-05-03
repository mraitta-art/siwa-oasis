import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export async function GET(request: NextRequest) {
  let step = 'Initializing';
  try {
    console.log('🏁 --- STARTING ENHANCED DUAL-LAYER MASTER FLOW ---');

    // 1. TYPOLOGY: Luxury Eco-Retreat
    step = 'Creating Sections';
    const sections = [
      { id: 'nature_dna', name: 'Nature & Sustainability', icon: 'fa-seedling' },
      { id: 'heritage_dna', name: 'Heritage & Design', icon: 'fa-fort-awesome' },
      { id: 'experience_dna', name: 'Experiences', icon: 'fa-skating' },
      { id: 'location_dna', name: 'Location & Landmarks', icon: 'fa-map-marked-alt' }
    ];
    for (const s of sections) {
      await execute("INSERT IGNORE INTO sections (id, name, icon) VALUES (?, ?, ?)", [s.id, s.name, s.icon]);
    }

    step = 'Provisioning Master DNA Archetypes';
    const masterFields = [
      { id: 'master_title', name: 'title', label: 'Display Title', type: 'text', sid: 'SECTION_TEMPLATE' },
      { id: 'master_subtitle', name: 'subtitle', label: 'Subtitle/Tagline', type: 'text', sid: 'SECTION_TEMPLATE' },
      { id: 'master_description', name: 'description', label: 'Description', type: 'textarea', sid: 'SECTION_TEMPLATE' }
    ];
    for (const f of masterFields) {
      await execute(`
        INSERT IGNORE INTO form_fields (id, business_type_id, section_id, name, label, field_type, sort_order)
        VALUES (?, 'SECTION_TEMPLATE', 'SECTION_TEMPLATE', ?, ?, ?, 0)
      `, [f.id, f.name, f.label, f.type]);
    }
    
    await execute("UPDATE business_types SET sections = ?, own_sections = ? WHERE id = ?", [
      JSON.stringify(sections.map(s => s.id)), 
      JSON.stringify(sections.map(s => s.id)), 
      'eco_retreat'
    ]);

    // 2. SEED DUAL-LAYER DATA (Teaser vs Master Blog)
    step = 'Seeding Dual-Layer DNA';
    const sampleDNA = {
      nature_dna: {
        feature_on_main: true,
        section_news: "Experience a life in harmony with the Great Sand Sea.", // CAROUSEL TEASER
        section_blog: "<h3 style='color:#D4AF37'>The Salt Brick Philosophy</h3><p>Our retreat is built entirely from <b>sun-dried salt-bricks</b> and palm timber. This ancient technique provides natural insulation and a unique thermal mass.</p><p><a href='#'>Learn more about our heritage materials →</a></p>", // MASTER RICH BLOG
        section_gallery: [{ url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200' }]
      },
      heritage_dna: {
        feature_on_main: true,
        section_news: "Inspired by the ancient fortress of Shali.",
        section_blog: "<h3 style='color:#D4AF37'>Architectural Echoes</h3><p>Our design blends <i>traditional Siwan techniques</i> with modern minimalism. The result is a sanctuary that feels both ancient and state-of-the-art.</p>",
        youtube_story: "https://www.youtube.com/watch?v=ScMzIvxBSi4"
      },
      experience_dna: {
        section_news: "Join our expert guides for therapeutic salt-lake floating.",
        section_blog: "<h3 style='color:#D4AF37'>Curated Siwan Moments</h3><p>From stargazing in the deep desert to <b>therapeutic salt-lake floating sessions</b>, every moment is designed to reconnect you with the essence of life.</p>",
        section_gallery: [{ url: 'https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=1200' }]
      }
    };

    await execute(`
      INSERT INTO businesses (id, name, type_id, status, subscription_tier, custom_data)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE custom_data = VALUES(custom_data), status = 'active'
    `, [
      'siwa_dream_001', 
      'Siwa Dream Eco-Retreat', 
      'eco_retreat', 
      'active', 
      'platinum', 
      JSON.stringify(sampleDNA)
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Enhanced Dual-Layer Master Flow Executed',
      typology: 'eco_retreat',
      sections_seeded: sections.length,
      master_templates: masterFields.length,
      business_id: 'siwa_dream_001'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, step, error: err.message }, { status: 500 });
  }
}
