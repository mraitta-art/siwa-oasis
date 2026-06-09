import { NextRequest, NextResponse } from 'next/server';

// POST /api/custom-journey-packages - save a new custom journey package
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      duration_days,
      vibe,
      pace,
      price_usd,
      items,
      is_public = true,
      consultant_id = null,
      consultant_name = 'Anonymous',
    } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Package name is required' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Package must include at least one business' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Insert into custom_journey_packages table
    // 2. Insert each item into custom_journey_items table
    // 3. Return the created package with ID

    // For now, simulate the save and return success
    const packageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const packageData = {
      id: packageId,
      name,
      description,
      duration_days,
      vibe,
      pace,
      price_usd,
      is_public,
      consultant_id,
      consultant_name,
      items: items.map((item: any, idx: number) => ({
        ...item,
        sequence_order: idx,
      })),
      created_at: new Date().toISOString(),
      total_items: items.length,
    };

    // TODO: Save to database
    console.log('Saving custom journey package:', packageData);

    return NextResponse.json(
      {
        success: true,
        message: 'Custom journey package created successfully',
        package: packageData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving custom journey package:', error);
    return NextResponse.json(
      { error: 'Failed to save custom journey package' },
      { status: 500 }
    );
  }
}

// GET /api/custom-journey-packages - fetch custom journey packages
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isPublic = searchParams.get('is_public') === 'true';
    const isFeatured = searchParams.get('is_featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    // TODO: Fetch from database
    // For now, return empty array
    const packages = [];

    return NextResponse.json({
      packages,
      total: packages.length,
    });
  } catch (error) {
    console.error('Error fetching custom journey packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom journey packages' },
      { status: 500 }
    );
  }
}
