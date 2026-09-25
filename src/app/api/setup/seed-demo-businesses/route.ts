import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * PREMIER SIWA SEEDER: VIRAL EXAMPLES
 * Injecting world-class Siwa businesses with high-fidelity 8-block data.
 */
export async function GET(req: NextRequest) {
  try {
    const demos = [
      {
        id: 'demo_adrere',
        name: 'Adrere Amellal Eco-Lodge',
        type: 'accommodation',
        tier: 'gold',
        data: {
          sec_1_identity: {
            display_name: 'Adrere Amellal Eco-Lodge',
            establishment_info: 'Restored 1990s Heritage Site',
            section_blog: 'The most exclusive eco-lodge in the world, built entirely from salt-rock and palm wood.'
          },
          sec_2_ambience: {
            construction_materials: ['Kershef (Salt Brick)', 'Palm Wood'],
            construction_era: 'Traditional Siwan',
            property_philosophy: 'A dialogue between nature and architecture. No electricity, only beeswax candles.',
            section_gallery: [
              { url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62', caption: 'The Salt-Brick Walls', is_hero: true },
              { url: 'https://images.unsplash.com/photo-1505881502353-a1986add373c', caption: 'Candle-lit Dinners', is_hero: true }
            ]
          },
          sec_3_services: {
            experience_focus: ['Spiritual Retreat', 'Honeymoon'],
            view_types: ['Great Sand Sea Dunes', 'Salt Lake View'],
            section_blog: 'Experience absolute silence under the desert stars.'
          },
          sec_4_facilities: {
            amenities: ['Pool', 'Traditional Breakfast'],
            total_rooms: '40 unique suites'
          },
          sec_8_rates_offers: {
            price_standard: '$600 - $1200 per night',
            active_discounts: ['Long Stay (20%)'],
            special_conditions: 'All-inclusive of organic meals and excursions.'
          }
        }
      },
      {
        id: 'demo_hh',
        name: 'HH Serenity Siwa',
        type: 'travel_agency',
        tier: 'premium',
        data: {
          basic: {
            business_logo: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=800',
            phone: '+201200000000',
            whatsapp: '+201200000000',
            email: 'hello@hhsiwa.com',
            address: 'Siwa Oasis, Egypt',
            description: 'A modern Siwa host experience blending desert luxury, local heritage, and curated day trips.',
            section_labels: {
              sec_1_identity: 'About HH',
              sec_2_ambience: 'The Siwa Vibe',
              sec_5_experiences: 'Signature Experiences',
              sec_9_marketplace_catalog: 'Featured Packages'
            },
            section_labels_ar: {
              sec_1_identity: 'عن HH',
              sec_2_ambience: 'أجواء سيوة',
              sec_5_experiences: 'التجارب المميزة',
              sec_9_marketplace_catalog: 'العروض المختارة'
            }
          },
          sec_1_identity: {
            business_logo: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=800',
            logo: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=800',
            title: 'Modern Siwa hospitality, grounded in local culture',
            description: 'HH Serenity Siwa offers guided desert escapes, wellness stays, and authentic local experiences across the oasis.',
            section_blog: 'Every stay is built around warm hospitality, slow travel, and unforgettable desert nights.',
            section_gallery: [
              { url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200', caption: 'Desert arrival', is_hero: true },
              { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200', caption: 'Oasis sunrise', is_hero: false }
            ]
          },
          sec_2_ambience: {
            description: 'Soft golden light, warm stone textures, and calm desert evenings.',
            experience_focus: ['Sunset dune teas', 'Wellness rituals', 'Slow luxury stays'],
            section_gallery: [
              { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200', caption: 'Golden hour in Siwa', is_hero: true }
            ]
          },
          sec_5_experiences: {
            title: 'Curated experiences for every traveler',
            description: 'Explore local heritage, salt lakes, and private desert adventures designed for groups, couples, and families.',
            section_blog: 'Our tours combine local storytelling, hidden viewpoints, and flexible itineraries with comfortable transportation.'
          },
          sec_9_marketplace_catalog: {
            title: 'Featured packages',
            description: 'Handpicked stays and excursions for short city breaks and full Siwa escapes.',
            items: [
              { name: 'Sunrise Escape', price: 'USD 95', description: 'Half-day tour and local breakfast' },
              { name: 'Weekend Oasis Stay', price: 'USD 220', description: 'Two nights with guided excursions' }
            ]
          }
        }
      },
      {
        id: 'demo_taziry',
        name: 'Taziry Eco-Resort',
        type: 'accommodation',
        tier: 'premium',
        data: {
          sec_1_identity: { display_name: 'Taziry Eco-Resort', establishment_info: 'Contemporary Traditional' },
          sec_2_ambience: {
            construction_materials: ['Mud/Clay', 'Stone'],
            property_philosophy: 'Sustainable luxury focused on the Berber heritage of Siwa.',
            section_gallery: [
              { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23', caption: 'The Red Mountain View', is_hero: true }
            ]
          },
          sec_3_services: {
            experience_focus: ['Desert Adventure', 'Digital Nomad Friendly'],
            view_types: ['Great Sand Sea Dunes', 'Ancient Ruins']
          }
        }
      }
    ];

    for (const d of demos) {
      await execute(
        'INSERT INTO businesses (id, name, type_id, subscription_tier, custom_data, status) VALUES (?, ?, ?, ?, ?, "active") ' +
        'ON DUPLICATE KEY UPDATE custom_data = VALUES(custom_data), subscription_tier = VALUES(subscription_tier)',
        [d.id, d.name, d.type, d.tier, JSON.stringify(d.data)]
      );
    }

    // Seed / Enrich Al Nada Travel Egypt
    const alNadaId = '569bf800-1b62-4289-a8b7-980b3c0287f1';
    const alNadaCustomData = {
      basic: {
        name: 'Al Nada Travel Egypt',
        tagline: 'Premier Desert Safari & Eco-Tour Expeditions in Siwa Oasis',
        description: 'Al Nada Travel Egypt is a licensed premier tour operator and desert expedition specialist based in Siwa Oasis. With over 15 years of desert guiding expertise and a certified fleet of air-conditioned 4x4 Land Cruisers, we craft unforgettable Great Sand Sea safaris, star-gazing Bedouin camps, therapeutic salt lake tours, and bespoke oasis heritage journeys.',
        phone: '+20 100 123 4567',
        whatsapp: '+20 100 123 4567',
        email: 'info@alnadatravel.com',
        website: 'https://alnadatravel.com',
        address: 'Shali Citadel Square, Downtown Siwa Oasis, Matrouh, Egypt',
        logo_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=600',
        cover_image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1600',
        section_labels: {
          sec_1_identity: 'About Al Nada',
          sec_2_ambience: 'The Siwa Desert Vibe',
          sec_3_facilities: 'Fleet & Camp Gear',
          sec_5_experiences: 'Safari Expeditions',
          sec_8_connector: 'Special Offers & Packages',
          sec_9_marketplace_catalog: 'Tour Itineraries',
          sec_10_testimonials_faqs: 'Trust & Reviews'
        },
        section_labels_ar: {
          sec_1_identity: 'عن الندى ترافيل',
          sec_2_ambience: 'أجواء وسحر سيوة',
          sec_3_facilities: 'الأسطول ومعدات التخييم',
          sec_5_experiences: 'رحلات السفاري والمغامرة',
          sec_8_connector: 'العروض والباقات الخاصة',
          sec_9_marketplace_catalog: 'البرامج السياحية',
          sec_10_testimonials_faqs: 'آراء المسافرين والضمان'
        }
      },
      sec_1_identity: {
        title: 'Authentic Siwan Desert Hospitality',
        description: 'Founded by native Siwan desert navigators, Al Nada Travel combines traditional Bedouin hospitality with international safety and expedition standards. We offer private and group travel, specialized photography trips, therapeutic retreats, and custom holiday planning.',
        section_blog: 'Experience the magic of Egypt\'s most remote oasis with certified guides who know every dune, spring, and historic landmark in Siwa.',
        section_blog_title: '15 Years of Desert Exploration',
        established_year: 2009,
        languages_spoken: ['Arabic', 'English', 'Siwi (Berber)', 'Italian'],
        licenses: 'Certified by Egyptian Ministry of Tourism & Siwa Oasis Directorate'
      },
      sec_2_ambience: {
        vibe_title: 'Golden Dunes, Thermal Springs & Starry Nights',
        description: 'From adrenaline-filled 4x4 dune rides across the Great Sand Sea to serene evenings sipping Bedouin lemongrass tea around glowing campfires beneath the Milky Way.',
        highlights: ['Sunset over Great Sand Sea', 'Thermal Sulfuric Springs', 'Salt Crystal Floating Lakes', 'Ancient Kershef Citadel Views']
      },
      sec_3_facilities: {
        title: 'Expedition Fleet & Premium Camping Equipment',
        description: 'Safety and comfort are our top priorities in the deep desert.',
        fleet_details: 'Custom-modified 4x4 Toyota Land Cruisers with heavy-duty desert suspension, air conditioning, and satellite tracking.',
        camp_gear: 'Weather-resistant Bedouin tents, plush wool mattresses, solar charging stations, and mobile desert kitchen setups.'
      },
      sec_5_experiences: {
        title: 'Signature Siwan Desert Experiences',
        description: 'Handcrafted excursions tailored for adventure lovers, families, and cultural explorers.',
        section_blog: 'Discover why Siwa is hailed as the crown jewel of the Western Desert. Our safaris take you deep into the Great Sand Sea to witness prehistoric whale fossils, swim in hidden cold lakes, and watch golden sunsets.'
      },
      sec_9_marketplace_catalog: {
        title: 'Featured Tour Packages & Day Trips',
        description: 'Book our most popular guided tours with instant WhatsApp confirmation.'
      }
    };

    await execute(
      `UPDATE businesses 
       SET custom_data = ?,
           subscription_tier = 'tier_enterprise',
           is_trusted = 1,
           updated_at = NOW()
       WHERE id = ? OR slug = 'al-nada-travel-egypt'`,
      [JSON.stringify(alNadaCustomData), alNadaId]
    );

    // Populate Tour Products
    await execute(`DELETE FROM tour_products WHERE vendor_business_id = ?`, [alNadaId]);
    const packages = [
      {
        id: 'tour_great_sand_sea_sunset',
        title: 'Great Sand Sea 4x4 Sunset Safari & Sandboarding',
        category: 'Desert Safari',
        duration_days: 1,
        price: 45.00,
        currency: 'USD',
        description: 'Adrenaline-packed afternoon 4x4 safari across the Great Sand Sea dunes, sandboarding down 80-meter slopes, thermal spring soak at Bir Wahed, and Bedouin sunset tea with dates.',
        is_featured: 1,
        image_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=800'
      },
      {
        id: 'tour_siwa_heritage_springs',
        title: 'Siwa Historical Citadel & Cleopatra Spring Day Tour',
        category: 'Cultural & Heritage',
        duration_days: 1,
        price: 35.00,
        currency: 'USD',
        description: 'Comprehensive guided tour visiting the 13th-century Shali Fortress, Temple of the Oracle of Amun, Mountain of the Dead (Gebel al-Mawta), and swimming in Cleopatra Spring.',
        is_featured: 1,
        image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800'
      },
      {
        id: 'tour_overnight_bedouin_camp',
        title: '2-Day Overnight Deep Desert Camp & Milky Way Stargazing',
        category: 'Camping & Adventure',
        duration_days: 2,
        price: 120.00,
        currency: 'USD',
        description: 'All-inclusive 2-day expedition including deep dune exploration, fossil valley, authentic Zardah camp dinner, campfire music, telescope stargazing, and private tent accommodation.',
        is_featured: 1,
        image_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800'
      }
    ];

    try {
      const cols: any = await execute(`DESCRIBE tour_products`);
      const colNames = Array.isArray(cols) ? cols.map((c: any) => c.Field) : [];
      const titleCol = colNames.includes('title') ? 'title' : (colNames.includes('name') ? 'name' : null);
      if (titleCol) {
        for (const pkg of packages) {
          const insertSql = `INSERT INTO tour_products (id, vendor_business_id, ${titleCol}, price, currency, description, is_active)
                             VALUES (?, ?, ?, ?, ?, ?, 1)
                             ON DUPLICATE KEY UPDATE ${titleCol} = VALUES(${titleCol}), price = VALUES(price), description = VALUES(description)`;
          await execute(insertSql, [pkg.id, alNadaId, pkg.title, pkg.price, pkg.currency, pkg.description]);
        }
      }
    } catch (e: any) {
      console.warn('tour_products table skipped:', e?.message);
    }

    // Hero Carousel
    const carouselConfig = {
      slides: [
        {
          id: 'slide_alnada_hero_1',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1920',
          title: 'UNFORGETTABLE SIWA DESERT EXPEDITIONS',
          subtitle: 'Great Sand Sea 4x4 Safaris, Star-Gazing Camps & Salt Lake Tours',
          caption: 'AL NADA TRAVEL EGYPT',
          ctaText: 'Explore Safari Packages',
          ctaLink: '#sec_9_marketplace_catalog',
          animation: 'kenburns',
          overlayOpacity: 0.35,
          imageFit: 'cover',
          imagePosition: 'center',
          titleColor: '#FFFFFF',
          bgColor: '#000000',
          displayOrder: 0
        },
        {
          id: 'slide_alnada_hero_2',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1920',
          title: 'SLEEP BENEATH A MILLION STARS',
          subtitle: 'Authentic Bedouin Deep-Desert Camping with Traditional Zardah Banquets',
          caption: 'SIGNATURE EXPEDITIONS',
          ctaText: 'Book Custom Itinerary',
          ctaLink: '#sec_10_testimonials_faqs',
          animation: 'fade',
          overlayOpacity: 0.4,
          imageFit: 'cover',
          imagePosition: 'center',
          titleColor: '#FFFFFF',
          bgColor: '#000000',
          displayOrder: 1
        },
        {
          id: 'slide_alnada_hero_3',
          type: 'youtube',
          mediaUrl: 'https://www.youtube.com/watch?v=ccNOP-xqYFI',
          title: 'EXPERIENCE THE GREAT SAND SEA',
          subtitle: 'Pure Dune Bashing & High-Speed Desert Navigation in Siwa Oasis',
          caption: '4X4 LAND CRUISER FLEET',
          ctaText: 'Watch Full Adventure',
          ctaLink: '#sec_5_experiences',
          animation: 'kenburns',
          overlayOpacity: 0.35,
          displayOrder: 2
        }
      ],
      deletedDynamicIds: [],
      siteId: `biz_${alNadaId}_hero`
    };

    await execute(
      `INSERT INTO website_configs (type, config, updated_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE config = VALUES(config), updated_at = NOW()`,
      [`hero_carousel_biz_${alNadaId}_hero`, JSON.stringify(carouselConfig)]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Viral Demo Examples & Al Nada Travel Egypt Materialized Successfully',
      businesses: [...demos.map(b => b.name), 'Al Nada Travel Egypt'],
      packagesCount: packages.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
