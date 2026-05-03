import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    console.log('--- STARTING ACCOMMODATION STANDARDIZATION SEED ---');

    // 1. HARD RESET
    const tables = ['form_fields', 'businesses', 'business_types', 'sections', 'minisite_templates', 'upgrade_requests'];
    for (const table of tables) {
      try { await execute(`DELETE FROM ${table}`); } catch (e) {}
    }
    await execute("DELETE FROM profiles WHERE email = 'demo_vendor@siwa.com'");

    // 2. DEFINE GLOBAL SECTIONS (Origin Modules)
    console.log('Seeding Master Sections...');
    const masterSections = [
      { id: 'basic', name: 'Core Identity', icon: 'fa-id-card', required: 1 },
      { id: 'media', name: 'Visual Assets', icon: 'fa-images', required: 1 },
      { id: 'location', name: 'Geographic Context', icon: 'fa-map-marker-alt', required: 1 },
      { id: 'facilities', name: 'Standard Amenities', icon: 'fa-concierge-bell', required: 0 },
      { id: 'governance', name: 'Administration & Approval', icon: 'fa-shield-alt', required: 1 }
    ];

    for (const s of masterSections) {
      await execute(
        'INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public) VALUES (?, ?, ?, ?, ?, ?)',
        [s.id, s.name, s.icon, s.required, 1, 1]
      );
    }

    // 2.5 GLOBAL TEMPLATE ANCHOR
    await execute(
      'INSERT INTO business_types (id, name, icon, is_parent, active) VALUES (?, ?, ?, ?, ?)',
      ['SECTION_TEMPLATE', 'Global Section Blueprints', 'fa-drafting-compass', 0, 0]
    );

    // 3. MASTER PARENT: Accommodation
    const accommodationSections = ['basic', 'media', 'location', 'facilities', 'governance'];
    await execute(
      'INSERT INTO business_types (id, name, parent_id, icon, sections, is_parent) VALUES (?, ?, ?, ?, ?, ?)',
      ['accommodation', 'Accommodation Master', null, 'fa-bed', JSON.stringify(accommodationSections), 1]
    );

    // 4. THE CHILDREN (Exact User Requirements)
    const children = [
      { id: 'hotel', name: 'Hotel', icon: 'fa-hotel' },
      { id: 'lodge', name: 'Lodge', icon: 'fa-archway' },
      { id: 'eco_lodge', name: 'Eco Lodge', icon: 'fa-leaf' },
      { id: 'camping', name: 'Camping', icon: 'fa-campground' },
      { id: 'apartments', name: 'Apartments', icon: 'fa-building' },
      { id: 'siwian_house', name: 'Siwian Traditional House', icon: 'fa-home' },
      { id: 'modern_house', name: 'Modern House', icon: 'fa-house-user' }
    ];

    for (const child of children) {
      await execute(
        'INSERT INTO business_types (id, name, parent_id, icon, sections, is_parent) VALUES (?, ?, ?, ?, ?, ?)',
        [child.id, child.name, 'accommodation', child.icon, JSON.stringify(accommodationSections), 0]
      );
    }

    // 5. UNIFIED BASELINE DNA (Global Section Blueprints)
    // These fields are automatically injected into any blueprint that uses these sections.
    const unifiedBaseline = [
      // Section: basic (Identity & Contact)
      { section: 'basic', name: 'the_name', label: 'The Name', type: 'text', required: 1, acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','vendor'] }, sort: 1 },
      { section: 'basic', name: 'legal_name', label: 'OFFICIAL LEGAL NAME', type: 'text', required: 1, acl: { read: ['super_admin','content_admin','vendor'], write: ['super_admin'] }, sort: 5 },
      { section: 'basic', name: 'display_name', label: 'MARKETPLACE BRAND NAME', type: 'text', required: 1, acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','vendor'] }, sort: 10 },
      { section: 'basic', name: 'description', label: 'BRAND STORY / BIO', type: 'textarea', required: 1, acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','vendor'] }, sort: 20 },
      { section: 'basic', name: 'contact_email', label: 'PRIMARY CONTACT EMAIL', type: 'text', required: 1, acl: { read: ['super_admin','vendor'], write: ['super_admin','vendor'] }, sort: 30 },
      { section: 'basic', name: 'contact_phone', label: 'WHATSAPP / PHONE', type: 'text', required: 1, acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','vendor'] }, sort: 40 },
      
      // Section: location (Geography)
      { section: 'location', name: 'address', label: 'DETAILED PHYSICAL ADDRESS', type: 'text', required: 1, acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','vendor'] }, sort: 10 },
      { section: 'location', name: 'google_maps_link', label: 'GOOGLE MAPS URL', type: 'link', required: 0, acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','vendor'] }, sort: 20 },
      
      // Section: media (Visuals)
      { section: 'media', name: 'logo', label: 'BRAND LOGO / AVATAR', type: 'file', required: 1, acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','vendor'] }, sort: 10 },
      { section: 'media', name: 'gallery', label: 'PROPERTY GALLERY', type: 'gallery', required: 0, acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','vendor'] }, sort: 20 },
      
      // Section: governance (Audit & Control)
      { section: 'governance', name: 'registry_id', label: 'GOVERNMENT REGISTRY ID', type: 'text', required: 1, acl: { read: ['super_admin','content_admin'], write: ['super_admin'] }, sort: 10 },
      { section: 'governance', name: 'license_file', label: 'OFFICIAL LICENSE UPLOAD', type: 'file', required: 1, acl: { read: ['super_admin','content_admin'], write: ['super_admin','vendor'] }, sort: 20 },
      { section: 'governance', name: 'commission_rate', label: 'COMMISSION RATE (%)', type: 'number', required: 1, acl: { read: ['super_admin','content_admin'], write: ['super_admin'] }, sort: 30 },
      { section: 'governance', name: 'verification_status', label: 'VERIFICATION STATUS', type: 'radio_group', options: ['Pending Review', 'Verified & Published', 'Suspended'], required: 1, acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin'] }, sort: 40 }
    ];

    console.log('Injecting Unified Baseline DNA...');
    for (const f of unifiedBaseline) {
      // 1. Seed into Global Origin (SECTION_TEMPLATE)
      await execute(
        'INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, acl, options, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), 'SECTION_TEMPLATE', f.section, f.name, f.label, f.type, f.required, JSON.stringify(f.acl), f.options ? JSON.stringify(f.options) : null, f.sort]
      );
      
      // 2. Automatically propagate to Accommodation Master Parent
      await execute(
        'INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, acl, options, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), 'accommodation', f.section, f.name, f.label, f.type, f.required, JSON.stringify(f.acl), f.options ? JSON.stringify(f.options) : null, f.sort]
      );
    }

    // 6. SUPPLEMENTARY FACTORY BLOCKS (Optional Master Blocks)
    console.log('Seeding Supplementary Factory Blocks...');
    await execute(
      'INSERT IGNORE INTO business_types (id, name, icon, is_parent, active) VALUES (?, ?, ?, ?, ?)',
      ['FACTORY', 'Component Laboratory', 'fa-microchip', 0, 0]
    );

    const factoryBlocks = [
       { section: 'basic', name: 'the_name_master', label: 'The Name', type: 'text', required: 1, acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','vendor'] } },
       { section: 'facilities', name: 'master_wifi', label: 'HIGH-SPEED WI-FI', type: 'checkbox', required: 0, acl: { read: ['super_admin','public'], write: ['vendor'] } },
       { section: 'facilities', name: 'master_pool', label: 'SWIMMING POOL ACCESS', type: 'checkbox', required: 0, acl: { read: ['super_admin','public'], write: ['vendor'] } },
       { section: 'basic', name: 'master_internal_audit', label: 'ADMIN INTERNAL NOTES', type: 'textarea', required: 0, acl: { read: ['super_admin','content_admin'], write: ['super_admin','content_admin'] } }
    ];

    for (const b of factoryBlocks) {
      await execute(
        'INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, acl, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), 'FACTORY', b.section, b.name, b.label, b.type, b.required, JSON.stringify(b.acl), 0]
      );
    }

    // 7. MINISITE TEMPLATES (For Step 3: Ambience)
    const minisiteTemplates = [
      { id: 'standard_v1', name: 'Standard Hospitality Template', components: [{ type: 'hero' }, { type: 'gallery' }, { type: 'amenities' }] },
      { id: 'luxury_v1', name: 'Luxury Desert Retreat', components: [{ type: 'cinematic_hero' }, { type: 'immersive_gallery' }, { type: 'exclusive_offers' }] }
    ];

    for (const mt of minisiteTemplates) {
      await execute(
        'INSERT INTO minisite_templates (id, name, components, settings, tier) VALUES (?, ?, ?, ?, ?)',
        [mt.id, mt.name, JSON.stringify(mt.components), JSON.stringify({}), 'free']
      );
    }

    // 8. ENSURE DEMO VENDOR
    await execute(
      "INSERT IGNORE INTO profiles (id, email, password_hash, role, display_name, active) VALUES (?, ?, ?, ?, ?, ?)",
      ['v1', 'demo_vendor@siwa.com', 'hashed_pass', 'vendor', 'Demo Vendor', 1]
    );

    return NextResponse.json({ success: true, message: 'Essential Factory Library & Accommodation Architecture Seeded Successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
