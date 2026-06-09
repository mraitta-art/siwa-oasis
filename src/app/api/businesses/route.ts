import { NextRequest, NextResponse } from 'next/server';

// GET /api/businesses - fetch businesses by type_id
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeId = searchParams.get('type_id');

    if (!typeId) {
      return NextResponse.json({ error: 'type_id required' }, { status: 400 });
    }

    // Sample businesses data - in production, fetch from your database
    const businessesByType: Record<string, any[]> = {
      // Accommodation
      hotel: [
        {
          id: 'b1',
          name: 'Siwa Paradise Hotel',
          type_id: 'hotel',
          description: 'Luxury 5-star resort with stunning desert views and world-class amenities',
        },
        {
          id: 'b2',
          name: 'Siwa Oasis Resort',
          type_id: 'hotel',
          description: 'Modern comfort in the heart of the oasis with excellent service',
        },
      ],
      siwa_lodge: [
        {
          id: 'b3',
          name: 'Traditional Siwan Heritage Lodge',
          type_id: 'siwa_lodge',
          description: 'Authentic Siwan architecture with traditional hospitality',
        },
        {
          id: 'b4',
          name: 'Kershef Salt Brick Lodge',
          type_id: 'siwa_lodge',
          description: 'Built from traditional salt bricks, unique authentic experience',
        },
      ],
      desert_camp: [
        {
          id: 'b5',
          name: 'Great Sand Sea Nomadic Camp',
          type_id: 'desert_camp',
          description: 'Authentic nomadic experience under the stars',
        },
      ],
      eco_lodge: [
        {
          id: 'b6',
          name: 'Siwa Eco-Sanctuary',
          type_id: 'eco_lodge',
          description: 'Sustainable desert living with minimal environmental impact',
        },
      ],
      // Food & Beverage
      restaurant: [
        {
          id: 'b7',
          name: 'Cleopatra Restaurant',
          type_id: 'restaurant',
          description: 'Authentic Siwan cuisine with panoramic oasis views',
        },
        {
          id: 'b8',
          name: 'Desert Flavors Bistro',
          type_id: 'restaurant',
          description: 'Modern Mediterranean with traditional Siwan touches',
        },
      ],
      siwan_kitchen: [
        {
          id: 'b9',
          name: 'Grandma Fatima\'s Traditional Kitchen',
          type_id: 'siwan_kitchen',
          description: 'Home-cooked Siwan food passed down through generations',
        },
        {
          id: 'b10',
          name: 'Oasis Kitchen Workshop',
          type_id: 'siwan_kitchen',
          description: 'Learn traditional Siwan cooking in an authentic setting',
        },
      ],
      cafe_juice: [
        {
          id: 'b11',
          name: 'Desert Breeze Cafe',
          type_id: 'cafe_juice',
          description: 'Fresh organic juices and traditional Siwan coffee',
        },
      ],
      // Adventure
      safari_4x4: [
        {
          id: 'b12',
          name: 'Great Sand Sea Safari Tours',
          type_id: 'safari_4x4',
          description: 'Professional 4x4 desert expeditions with experienced guides',
        },
        {
          id: 'b13',
          name: 'Siwa Desert Explorer',
          type_id: 'safari_4x4',
          description: 'Custom desert safari packages for all experience levels',
        },
      ],
      camel_trek: [
        {
          id: 'b14',
          name: 'Nomadic Camel Expeditions',
          type_id: 'camel_trek',
          description: 'Traditional camel trekking through the Siwa wilderness',
        },
      ],
      nature_tour: [
        {
          id: 'b15',
          name: 'Siwa Birdwatching Tours',
          type_id: 'nature_tour',
          description: 'Guided nature tours with expert naturalists',
        },
      ],
      heritage_tour: [
        {
          id: 'b16',
          name: 'Siwa Heritage & History Tours',
          type_id: 'heritage_tour',
          description: 'Explore ancient temples, tombs, and cultural sites',
        },
      ],
      // Wellness
      sand_bath: [
        {
          id: 'b17',
          name: 'Siwa Therapeutic Sand Spa',
          type_id: 'sand_bath',
          description: 'Professional sand bath treatments with health benefits',
        },
      ],
      salt_therapy: [
        {
          id: 'b18',
          name: 'Salt Lake Wellness Center',
          type_id: 'salt_therapy',
          description: 'Salt water therapy and mineral treatments',
        },
      ],
      hot_spring: [
        {
          id: 'b19',
          name: 'Natural Hot Springs Resort',
          type_id: 'hot_spring',
          description: 'Therapeutic hot spring immersion experiences',
        },
      ],
      // Crafts
      embroidery: [
        {
          id: 'b20',
          name: 'Siwan Embroidery Workshop',
          type_id: 'embroidery',
          description: 'Learn traditional Siwan embroidery from master artisans',
        },
      ],
      date_olive: [
        {
          id: 'b21',
          name: 'Siwa Date & Olive Cooperative',
          type_id: 'date_olive',
          description: 'Organic date and olive products with farm tours',
        },
      ],
      artisan_shop: [
        {
          id: 'b22',
          name: 'Siwa Artisan Marketplace',
          type_id: 'artisan_shop',
          description: 'Handmade crafts and souvenirs from local artisans',
        },
      ],
      // Logistics
      tuk_tuk: [
        {
          id: 'b23',
          name: 'Local Tuk-Tuk Service',
          type_id: 'tuk_tuk',
          description: 'Authentic local transportation experience',
        },
      ],
      equipment_rental: [
        {
          id: 'b24',
          name: 'Siwa Adventure Equipment Rental',
          type_id: 'equipment_rental',
          description: 'Camping gear, binoculars, and adventure equipment',
        },
      ],
    };

    const businesses = businessesByType[typeId] || [];
    return NextResponse.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}
