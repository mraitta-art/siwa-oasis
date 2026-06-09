import { NextRequest, NextResponse } from 'next/server';

// GET /api/business-types - fetch parent or child types
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isParent = searchParams.get('is_parent');
    const parentIds = searchParams.get('parent_ids');

    // This would connect to your database
    // For now, return sample data from your schema
    const businessTypes = [
      {
        id: 'accommodation',
        name: 'Accommodation',
        icon: '🏨',
        is_parent: true,
        children: [
          { id: 'hotel', name: 'Full-Service Hotel', icon: '⭐' },
          { id: 'siwa_lodge', name: 'Traditional Siwan Lodge', icon: '🏛️' },
          { id: 'desert_camp', name: 'Desert Camp', icon: '⛺' },
          { id: 'eco_lodge', name: 'Eco-Lodge', icon: '🌿' },
        ],
      },
      {
        id: 'food',
        name: 'Food & Beverage',
        icon: '🍽️',
        is_parent: true,
        children: [
          { id: 'restaurant', name: 'Standard Restaurant', icon: '🍴' },
          { id: 'siwan_kitchen', name: 'Traditional Siwan Kitchen', icon: '🍲' },
          { id: 'cafe_juice', name: 'Cafe & Juice Bar', icon: '☕' },
        ],
      },
      {
        id: 'adventure',
        name: 'Adventure & Safari',
        icon: '🚙',
        is_parent: true,
        children: [
          { id: 'safari_4x4', name: '4x4 Desert Safari', icon: '🏜️' },
          { id: 'camel_trek', name: 'Camel Trekking', icon: '🐪' },
          { id: 'nature_tour', name: 'Nature & Bird Watching', icon: '🦅' },
          { id: 'heritage_tour', name: 'Historical Heritage Tour', icon: '📜' },
        ],
      },
      {
        id: 'wellness',
        name: 'Health & Wellness',
        icon: '🧘',
        is_parent: true,
        children: [
          { id: 'sand_bath', name: 'Therapeutic Sand Bath', icon: '🏜️' },
          { id: 'salt_therapy', name: 'Salt Cave Therapy', icon: '💎' },
          { id: 'hot_spring', name: 'Hot Spring Experience', icon: '♨️' },
        ],
      },
      {
        id: 'crafts',
        name: 'Crafts & Trade',
        icon: '🎨',
        is_parent: true,
        children: [
          { id: 'embroidery', name: 'Siwan Embroidery & Textile', icon: '🧵' },
          { id: 'date_olive', name: 'Dates & Olives Trade', icon: '🫒' },
          { id: 'artisan_shop', name: 'Handmade Artisan Shop', icon: '🛍️' },
        ],
      },
      {
        id: 'logistics',
        name: 'Logistics & Transport',
        icon: '🚗',
        is_parent: true,
        children: [
          { id: 'tuk_tuk', name: 'Local Tuk-Tuk Service', icon: '🛺' },
          { id: 'equipment_rental', name: 'Equipment Rental', icon: '⚙️' },
        ],
      },
    ];

    if (isParent === 'true') {
      return NextResponse.json(businessTypes);
    }

    if (parentIds) {
      const parentIdArray = parentIds.split(',');
      const children = businessTypes
        .filter((bt) => parentIdArray.includes(bt.id))
        .flatMap((bt) => 
          bt.children.map((child: any) => ({
            ...child,
            parent_id: bt.id,
          }))
        );
      return NextResponse.json(children);
    }

    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch business types' },
      { status: 500 }
    );
  }
}
