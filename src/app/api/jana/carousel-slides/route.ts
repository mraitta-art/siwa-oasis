import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

interface CarouselSlide {
  id?: string;
  title: string;
  description?: string;
  image: string;
  youtubeUrl?: string;
  link?: string;
  displayOrder: number;
}

// GET all slides
export async function GET() {
  try {
    const slides = await query('SELECT * FROM carousel_slides ORDER BY displayOrder ASC');
    return NextResponse.json({ slides });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST create new slide
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, image, youtubeUrl, link, displayOrder } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!image && !youtubeUrl) {
      return NextResponse.json({ error: 'Either image URL or YouTube URL is required' }, { status: 400 });
    }

    const id = `slide_${Date.now()}`;
    await execute(
      'INSERT INTO carousel_slides (id, title, description, image, youtubeUrl, link, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title || null, description || null, image || null, youtubeUrl || null, link || null, displayOrder || 0]
    );

    return NextResponse.json({ id, message: 'Slide created successfully' }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error creating slide';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT update existing slide
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, image, youtubeUrl, link, displayOrder } = body;

    if (!id) {
      return NextResponse.json({ error: 'Slide ID is required' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!image && !youtubeUrl) {
      return NextResponse.json({ error: 'Either image URL or YouTube URL is required' }, { status: 400 });
    }

    await execute(
      'UPDATE carousel_slides SET title = ?, description = ?, image = ?, youtubeUrl = ?, link = ?, displayOrder = ? WHERE id = ?',
      [title, description || null, image || null, youtubeUrl || null, link || null, displayOrder || 0, id]
    );

    return NextResponse.json({ message: 'Slide updated successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating slide';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE slide
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Slide ID is required' }, { status: 400 });
    }

    await execute('DELETE FROM carousel_slides WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Slide deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting slide';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
