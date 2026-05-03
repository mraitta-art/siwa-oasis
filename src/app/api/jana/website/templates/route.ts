import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    
    // Standard Minisite Templates available in the system
    const templates = [
      {
        id: 'desert_luxury_v1',
        name: 'Desert Luxury (Primary)',
        description: 'Ultra-Premium glassmorphism design with gold accents and cinematic backgrounds.',
        preview_image: '/templates/previews/desert_luxury.jpg'
      },
      {
        id: 'siwan_heritage_v1',
        name: 'Siwan Heritage',
        description: 'Cultural-focused layout using earth tones and traditional mud-brick textures.',
        preview_image: '/templates/previews/siwan_heritage.jpg'
      }
    ];

    return NextResponse.json(templates);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
