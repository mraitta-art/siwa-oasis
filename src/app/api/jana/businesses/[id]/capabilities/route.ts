import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const ALL_MODULES = [
  { id: 'accommodation', label_en: 'Accommodation & Ecolodges', label_ar: 'الإقامة والنزل البيئية', icon: 'fa-bed' },
  { id: 'tours_safari', label_en: 'Desert Safaris & 4x4 Tours', label_ar: 'رحلات السفاري والبراري', icon: 'fa-compass' },
  { id: 'activities_wellness', label_en: 'Activities, Salt Lakes & Wellness', label_ar: 'الأنشطة والاستشفاء وبحيرات الملح', icon: 'fa-spa' },
  { id: 'transportation', label_en: 'Transfers & Logistics', label_ar: 'المواصلات والنقل السياحي', icon: 'fa-car' },
  { id: 'dining', label_en: 'Dining & Bedouin Feasts', label_ar: 'المطاعم والولائم البدوية', icon: 'fa-utensils' },
];

function inferDefaultModules(parentTypeId: string | null): string[] {
  if (!parentTypeId) return ['tours_safari'];
  const lower = parentTypeId.toLowerCase();
  if (lower.includes('accom') || lower.includes('hotel') || lower.includes('camp')) {
    return ['accommodation'];
  }
  if (lower.includes('advent') || lower.includes('tour') || lower.includes('safari')) {
    return ['tours_safari'];
  }
  if (lower.includes('well') || lower.includes('health') || lower.includes('spa')) {
    return ['activities_wellness'];
  }
  if (lower.includes('logis') || lower.includes('trans') || lower.includes('move')) {
    return ['transportation'];
  }
  if (lower.includes('food') || lower.includes('rest') || lower.includes('dine')) {
    return ['dining'];
  }
  return ['tours_safari'];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = await queryOne<any>(`
      SELECT b.id, b.name, b.type_id, bt.name as type_name, bt.parent_id as parent_type_id,
             b.custom_data
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.id = ? OR b.slug = ?
    `, [id, id]);

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let customData: any = {};
    if (business.custom_data) {
      customData = typeof business.custom_data === 'string' ? JSON.parse(business.custom_data) : business.custom_data;
    }

    const enabledModules: string[] = Array.isArray(customData?.journey_modules) && customData.journey_modules.length > 0
      ? customData.journey_modules
      : inferDefaultModules(business.parent_type_id);

    return NextResponse.json({
      success: true,
      business_id: business.id,
      name: business.name,
      parent_type_id: business.parent_type_id,
      all_available_modules: ALL_MODULES,
      enabled_modules: enabledModules,
    });
  } catch (error: any) {
    console.error('Error fetching vendor capabilities:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { enabled_modules } = body;

    if (!Array.isArray(enabled_modules)) {
      return NextResponse.json({ error: 'enabled_modules must be an array' }, { status: 400 });
    }

    const business = await queryOne<any>(`
      SELECT id, custom_data FROM businesses WHERE id = ? OR slug = ?
    `, [id, id]);

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let customData: any = {};
    if (business.custom_data) {
      customData = typeof business.custom_data === 'string' ? JSON.parse(business.custom_data) : business.custom_data;
    }

    customData.journey_modules = enabled_modules;

    await execute(
      `UPDATE businesses SET custom_data = ? WHERE id = ?`,
      [JSON.stringify(customData), business.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Vendor journey capabilities updated successfully',
      enabled_modules,
    });
  } catch (error: any) {
    console.error('Error updating vendor capabilities:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
