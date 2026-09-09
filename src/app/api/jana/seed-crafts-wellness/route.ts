import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { CANONICAL_SECTION_IDS } from '@/lib/section-registry';
import { invalidateCache } from '@/lib/cache';

type Field = [string, string, string, string, string];
type Child = { id: string; name: string; icon: string; color: string; order: number; fields: Field[] };
type Blueprint = { id: string; name: string; icon: string; color: string; order: number; children: Child[]; common: Field[] };

const BLUEPRINTS: Blueprint[] = [
  {
    id: 'crafts', name: 'Trade & Crafts', icon: 'fas fa-store', color: '#ef4444', order: 5,
    common: [
      ['sec_1_identity', 'craft_business_name', 'Craft business name', 'text', 'Public name, artisan or cooperative identity.'],
      ['sec_1_identity', 'craft_story', 'Craft story and origin', 'rich_text', 'History, culture and origin of the craft.'],
      ['sec_1_identity', 'craft_location_contact', 'Location and contact', 'textarea', 'Address, phone, email, website and map.'],
      ['sec_2_ambience', 'shop_atmosphere', 'Shop and workshop atmosphere', 'textarea', 'Describe the space and visitor experience.'],
      ['sec_2_ambience', 'cultural_style', 'Cultural style', 'multiselect', 'Traditional, contemporary, local or collaborative.'],
      ['sec_2_ambience', 'craft_gallery', 'Craft gallery', 'gallery', 'Products, workshop and artisan photos.'],
      ['sec_3_facilities', 'workspace_facilities', 'Workspace facilities', 'multiselect', 'Workshop, showroom, storage, parking and accessibility.'],
      ['sec_3_facilities', 'production_capacity', 'Production capacity', 'text', 'Typical production volume and lead time.'],
      ['sec_3_facilities', 'equipment_and_materials', 'Equipment and materials', 'multiselect', 'Tools, materials and production equipment.'],
      ['sec_4_gastronomy', 'product_categories', 'Product categories', 'multiselect', 'Textiles, food products, pottery, jewelry or other crafts.'],
      ['sec_4_gastronomy', 'custom_order_services', 'Custom order services', 'multiselect', 'Custom orders, engraving, tailoring, packaging or wholesale.'],
      ['sec_4_gastronomy', 'product_quality', 'Product quality information', 'textarea', 'Materials, process, authenticity and care.'],
      ['sec_5_experiences', 'workshops_and_demonstrations', 'Workshops and demonstrations', 'textarea', 'Classes, tours and live demonstrations.'],
      ['sec_5_experiences', 'workshop_schedule', 'Workshop schedule', 'textarea', 'Dates, duration, capacity and booking requirements.'],
      ['sec_6_guardian', 'production_practices', 'Production practices', 'rich_text', 'Ethical sourcing, sustainability and quality controls.'],
      ['sec_6_guardian', 'opening_hours', 'Opening hours', 'textarea', 'Shop, workshop and seasonal opening hours.'],
      ['sec_6_guardian', 'return_and_authenticity_policy', 'Return and authenticity policy', 'rich_text', 'Returns, guarantees and handmade authenticity.'],
      ['sec_7_investment', 'wholesale_and_partnerships', 'Wholesale and partnerships', 'boolean', 'Whether wholesale or partnership is available.'],
      ['sec_7_investment', 'growth_opportunity', 'Growth opportunity', 'textarea', 'Export, supplier, cooperative or investment opportunities.'],
      ['sec_8_connector', 'offers_and_bundles', 'Offers and bundles', 'textarea', 'Seasonal offers, gift bundles and wholesale discounts.'],
      ['sec_8_connector', 'order_contact', 'Order contact', 'text', 'WhatsApp, phone, email or online order link.'],
      ['sec_9_marketplace_catalog', 'product_catalog', 'Product catalog', 'gallery', 'Repeatable products with price, image and description.'],
      ['sec_9_marketplace_catalog', 'shipping_and_delivery', 'Shipping and delivery', 'textarea', 'Local, national and international delivery details.'],
      ['sec_10_testimonials_faqs', 'customer_reviews', 'Customer reviews', 'rich_text', 'Reviews and customer stories.'],
      ['sec_10_testimonials_faqs', 'product_faqs', 'Product FAQs', 'rich_text', 'Materials, sizing, care, shipping and custom-order questions.'],
    ],
    children: [
      { id: 'embroidery', name: 'Siwan Embroidery & Textile', icon: 'fas fa-cut', color: '#ef4444', order: 5.1, fields: [
        ['sec_4_gastronomy', 'textile_techniques', 'Textile techniques', 'multiselect', 'Embroidery, weaving, tailoring and textile techniques.'],
        ['sec_9_marketplace_catalog', 'textile_sizes_and_patterns', 'Textile sizes and patterns', 'textarea', 'Sizes, patterns, colors and customization options.'],
        ['sec_5_experiences', 'embroidery_workshop', 'Embroidery workshop', 'rich_text', 'Teaching and live embroidery experience.'],
      ] },
      { id: 'date_olive', name: 'Dates & Olives Trade', icon: 'fas fa-seedling', color: '#27ae60', order: 5.2, fields: [
        ['sec_4_gastronomy', 'crop_varieties', 'Crop varieties', 'multiselect', 'Date, olive and agricultural product varieties.'],
        ['sec_9_marketplace_catalog', 'harvest_and_packaging', 'Harvest and packaging', 'textarea', 'Harvest season, grades, packaging and shelf life.'],
        ['sec_6_guardian', 'food_certifications', 'Food certifications', 'text', 'Food safety, organic or quality certifications.'],
      ] },
      { id: 'artisan_shop', name: 'Handmade Artisan Shop', icon: 'fas fa-store', color: '#ef4444', order: 5.3, fields: [
        ['sec_4_gastronomy', 'artisan_materials', 'Artisan materials', 'multiselect', 'Pottery, salt, palm, leather, jewelry and natural materials.'],
        ['sec_9_marketplace_catalog', 'custom_gift_services', 'Custom gift services', 'multiselect', 'Gift wrapping, engraving, personalization and corporate gifts.'],
        ['sec_5_experiences', 'artisan_visit', 'Artisan visit experience', 'textarea', 'Workshop visits and making demonstrations.'],
      ] },
    ],
  },
  {
    id: 'wellness', name: 'Health & Wellness', icon: 'fas fa-spa', color: '#27ae60', order: 4,
    common: [
      ['sec_1_identity', 'wellness_business_name', 'Wellness business name', 'text', 'Public name of the wellness provider.'],
      ['sec_1_identity', 'wellness_description', 'Wellness description', 'rich_text', 'Therapeutic concept, practitioner and service story.'],
      ['sec_1_identity', 'wellness_contact_location', 'Location and contact', 'textarea', 'Address, phone, email, website and map.'],
      ['sec_2_ambience', 'wellness_atmosphere', 'Wellness atmosphere', 'textarea', 'Privacy, relaxation style, environment and guest experience.'],
      ['sec_2_ambience', 'wellness_setting', 'Wellness setting', 'multiselect', 'Spa, desert, salt cave, spring, clinic or retreat.'],
      ['sec_2_ambience', 'wellness_gallery', 'Wellness gallery', 'gallery', 'Treatment rooms, facilities and natural setting.'],
      ['sec_3_facilities', 'treatment_facilities', 'Treatment facilities', 'multiselect', 'Treatment rooms, changing rooms, showers and accessibility.'],
      ['sec_3_facilities', 'guest_capacity', 'Guest capacity', 'number', 'Maximum guests per session.'],
      ['sec_3_facilities', 'equipment_and_amenities', 'Equipment and amenities', 'multiselect', 'Therapy equipment, pool, sauna, lockers and rest areas.'],
      ['sec_4_gastronomy', 'wellness_services', 'Wellness services', 'multiselect', 'Massage, therapy, bathing, consultation and relaxation services.'],
      ['sec_4_gastronomy', 'session_duration', 'Session duration', 'select', 'Typical service duration.'],
      ['sec_4_gastronomy', 'practitioner_information', 'Practitioner information', 'textarea', 'Qualifications, experience and specialties.'],
      ['sec_5_experiences', 'wellness_programs', 'Wellness programs', 'textarea', 'Retreats, detox, recovery and multi-session programs.'],
      ['sec_5_experiences', 'program_schedule', 'Program schedule', 'textarea', 'Dates, duration, capacity and booking requirements.'],
      ['sec_6_guardian', 'safety_and_hygiene', 'Safety and hygiene', 'rich_text', 'Hygiene, screening, contraindications and emergency procedures.'],
      ['sec_6_guardian', 'opening_hours', 'Opening hours', 'textarea', 'Operating hours and seasonal availability.'],
      ['sec_6_guardian', 'booking_and_cancellation', 'Booking and cancellation policy', 'rich_text', 'Booking, cancellation, late arrival and refund rules.'],
      ['sec_7_investment', 'wellness_partnerships', 'Wellness partnerships', 'boolean', 'Whether hotels, clinics or retreats can partner.'],
      ['sec_7_investment', 'expansion_opportunity', 'Expansion opportunity', 'textarea', 'Investment, referral or wellness partnership details.'],
      ['sec_8_connector', 'wellness_packages', 'Wellness packages', 'textarea', 'Session packages, memberships and seasonal offers.'],
      ['sec_8_connector', 'booking_contact', 'Booking contact', 'text', 'Phone, WhatsApp, email or booking URL.'],
      ['sec_9_marketplace_catalog', 'wellness_catalog', 'Wellness catalog', 'gallery', 'Repeatable treatments, products and packages.'],
      ['sec_9_marketplace_catalog', 'certificates_and_documents', 'Certificates and documents', 'text', 'Qualifications, licenses and downloadable documents.'],
      ['sec_10_testimonials_faqs', 'wellness_reviews', 'Wellness reviews', 'rich_text', 'Client reviews and outcomes.'],
      ['sec_10_testimonials_faqs', 'wellness_faqs', 'Wellness FAQs', 'rich_text', 'Preparation, safety, contraindications and aftercare questions.'],
    ],
    children: [
      { id: 'sand_bath', name: 'Therapeutic Sand Bath', icon: 'fas fa-sun', color: '#f59e0b', order: 4.1, fields: [
        ['sec_4_gastronomy', 'sand_bath_protocol', 'Sand bath protocol', 'rich_text', 'Session preparation, duration and aftercare.'],
        ['sec_6_guardian', 'sand_temperature', 'Sand temperature and safety', 'text', 'Temperature controls and safety requirements.'],
        ['sec_8_connector', 'sand_bath_packages', 'Sand bath packages', 'textarea', 'Single, multi-session and retreat packages.'],
      ] },
      { id: 'salt_therapy', name: 'Salt Cave Therapy', icon: 'fas fa-moon', color: '#3b82f6', order: 4.2, fields: [
        ['sec_3_facilities', 'salt_chamber_type', 'Salt chamber type', 'select', 'Room, cave, halotherapy or salt room format.'],
        ['sec_4_gastronomy', 'salt_therapy_protocol', 'Salt therapy protocol', 'rich_text', 'Session preparation, duration and aftercare.'],
        ['sec_6_guardian', 'respiratory_precautions', 'Respiratory precautions', 'rich_text', 'Contraindications and respiratory safety guidance.'],
      ] },
      { id: 'hot_spring', name: 'Hot Spring Experience', icon: 'fas fa-water', color: '#3b82f6', order: 4.3, fields: [
        ['sec_3_facilities', 'pool_and_spring_facilities', 'Pool and spring facilities', 'multiselect', 'Pools, changing rooms, showers and rest areas.'],
        ['sec_4_gastronomy', 'water_temperature_and_minerals', 'Water temperature and minerals', 'textarea', 'Temperature, mineral composition and water information.'],
        ['sec_6_guardian', 'bathing_safety_rules', 'Bathing safety rules', 'rich_text', 'Health, age, time-limit and supervision rules.'],
      ] },
    ],
  },
];

async function ensureType(id: string, name: string, icon: string, color: string, parentId: string, order: number) {
  await execute(
    `INSERT IGNORE INTO business_types
      (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
     VALUES (?, ?, ?, ?, 0, ?, ?, '[]', 1, ?)`,
    [id, name, icon, color, parentId, JSON.stringify(CANONICAL_SECTION_IDS), order]
  );
  await execute('UPDATE business_types SET parent_id = ?, sections = ?, active = 1 WHERE id = ?', [parentId, JSON.stringify(CANONICAL_SECTION_IDS), id]);
}

async function ensureField(typeId: string, field: Field, origin: string) {
  const [sectionId, name, label, fieldType, helpText] = field;
  await execute(
    `INSERT IGNORE INTO form_fields
      (id, business_type_id, section_id, name, label, field_type, required, vendor_editable,
       searchable, help_text, options, validation, acl, sort_order, section_origin, version_type)
     VALUES (?, ?, ?, ?, ?, ?, 0, 1, 1, ?, NULL, '{}', ?, 0, ?, 'latest')`,
    [`${typeId}_${name}`, typeId, sectionId, name, label, fieldType, helpText,
      JSON.stringify({ read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'content_admin', 'vendor'] }), origin]
  );
}

export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    for (const blueprint of BLUEPRINTS) {
      await execute(
        `INSERT IGNORE INTO business_types
          (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
         VALUES (?, ?, ?, ?, 1, NULL, ?, '[]', 1, ?)`,
        [blueprint.id, blueprint.name, blueprint.icon, blueprint.color, JSON.stringify(CANONICAL_SECTION_IDS), blueprint.order]
      );
      await execute('UPDATE business_types SET sections = ?, active = 1 WHERE id = ?', [JSON.stringify(CANONICAL_SECTION_IDS), blueprint.id]);

      for (const sectionId of CANONICAL_SECTION_IDS) {
        const section = await queryOne('SELECT id FROM sections WHERE id = ?', [sectionId]);
        if (!section) {
          await execute(
            'INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_universal, display_order, active) VALUES (?, ?, ?, 1, 1, 1, 1, ?, 1)',
            [sectionId, sectionId.replace(/^sec_\d+_/, '').replace(/_/g, ' '), 'fa-layer-group', CANONICAL_SECTION_IDS.indexOf(sectionId) + 1]
          );
        }
      }

      for (const field of blueprint.common) await ensureField(blueprint.id, field, 'parent');
      for (const child of blueprint.children) {
        await ensureType(child.id, child.name, child.icon, child.color, blueprint.id, child.order);
        for (const field of child.fields) await ensureField(child.id, field, 'child');
      }
    }

    invalidateCache.businessTypes();
    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({
      success: true,
      parents: BLUEPRINTS.map(blueprint => blueprint.id),
      children: BLUEPRINTS.flatMap(blueprint => blueprint.children.map(child => child.id)),
      commonFields: BLUEPRINTS.reduce((total, blueprint) => total + blueprint.common.length, 0),
      childFields: BLUEPRINTS.reduce((total, blueprint) => total + blueprint.children.reduce((count, child) => count + child.fields.length, 0), 0),
      sections: CANONICAL_SECTION_IDS,
    });
  } catch (error: any) {
    console.error('[CRAFTS WELLNESS SEED ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to seed crafts and wellness blueprints' }, { status: 500 });
  }
}
