import { execute, query } from '../src/lib/db';

async function seedAdminCarousel() {
  console.log('Seeding Admin Hero Carousel...');
  
  try {
    // 1. Fetch businesses to create slides from
    const vendors = await query(
      `SELECT id, name, slug, custom_data FROM businesses WHERE subscription_tier != 'free' LIMIT 10`
    );
    
    const adminSlides: any[] = [];
    
    (vendors as any[]).forEach((biz: any) => {
      const data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;
      if (!data) return;

      Object.entries(data).forEach(([secId, secData]: [string, any]) => {
        if (!secData || !secData.section_gallery) return;
        const photos = Array.isArray(secData.section_gallery) ? secData.section_gallery : [];
        
        photos.forEach((photo: any, idx: number) => {
          if (photo && photo.is_hero) {
            adminSlides.push({
              id: `admin_curated_${biz.id}_${idx}`,
              type: (photo.url && photo.url.includes('/video/')) ? 'video' : 'image',
              mediaUrl: photo.url,
              title: biz.name.toUpperCase(),
              subtitle: `Customize your request and send it directly to ${biz.name}`,
              caption: "ADMIN VERIFIED PARTNER",
              ctaText: "VIEW PAGE & REQUEST",
              ctaLink: `/p/${biz.slug}`,
              animation: 'kenburns',
              overlayOpacity: 0.5,
              displayOrder: adminSlides.length
            });
          }
        });
      });
    });

    if (adminSlides.length === 0) {
      console.log('No hero photos found in vendors to seed. Creating some placeholder slides...');
      adminSlides.push(
        {
          id: 'admin_slide_1',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1542382156909-92f8087aa09b?q=80&w=2000&auto=format&fit=crop',
          title: 'LUXURY SIWA EXPERIENCE',
          subtitle: 'Exclusive partner services curated by our admin team',
          caption: 'FEATURED SERVICE',
          ctaText: 'EXPLORE SERVICES',
          ctaLink: '/search/vibe',
          animation: 'kenburns',
          overlayOpacity: 0.5,
          displayOrder: 0
        },
        {
          id: 'admin_slide_2',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=2000&auto=format&fit=crop',
          title: 'DESERT ADVENTURES',
          subtitle: 'Customize your request and connect directly with local guides',
          caption: 'VERIFIED PARTNER',
          ctaText: 'SEND REQUEST',
          ctaLink: '/search/vibe',
          animation: 'kenburns',
          overlayOpacity: 0.5,
          displayOrder: 1
        }
      );
    } else {
      // Limit to max 6 slides for the homepage
      adminSlides.length = Math.min(adminSlides.length, 6);
    }

    const configString = JSON.stringify({ slides: adminSlides, siteId: 'discovery' });

    await execute(
      `INSERT INTO website_configs (type, config, updated_at) 
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       config = VALUES(config),
       updated_at = VALUES(updated_at)`,
      ['hero_carousel_discovery', configString]
    );

    console.log(`Successfully saved ${adminSlides.length} curated slides to 'discovery' carousel in DB!`);
    console.log('The admin can now manage these in /jana/hero-carousel');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding carousel:', error);
    process.exit(1);
  }
}

seedAdminCarousel();
