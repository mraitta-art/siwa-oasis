import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'homepages');

const SEED_PAGES = [
  {
    id: '1',
    name: 'Main Homepage',
    slug: '/',
    type: 'main',
    status: 'published',
    lastModified: '2024-01-15',
    title: 'Main Homepage',
    description: 'Welcome to Siwa Oasis',
    theme: 'dark',
    layout: 'standard',
    sections: [
      { id: '1', name: 'Hero Section', type: 'hero', order: 1, enabled: true, images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop'] },
      { id: '2', name: 'Features', type: 'features', order: 2, enabled: true },
      { id: '3', name: 'Testimonials', type: 'testimonials', order: 3, enabled: false },
      { id: '4', name: 'Call to Action', type: 'cta', order: 4, enabled: true }
    ]
  },
  {
    id: '2',
    name: 'Services Page',
    slug: '/services',
    type: 'service',
    status: 'published',
    lastModified: '2024-01-14',
    title: 'Our Services',
    description: 'Discover all services offered in Siwa Oasis',
    theme: 'light',
    layout: 'minimal',
    sections: [
      { id: '1', name: 'Hero Section', type: 'hero', order: 1, enabled: true },
      { id: '2', name: 'Our Services', type: 'features', order: 2, enabled: true },
      { id: '3', name: 'Contact Us', type: 'cta', order: 3, enabled: true }
    ]
  },
  {
    id: '3',
    name: 'Categories Page',
    slug: '/categories',
    type: 'category',
    status: 'published',
    lastModified: '2024-01-13',
    title: 'Business Categories',
    description: 'Explore business directories by category',
    theme: 'golden',
    layout: 'showcase',
    sections: [
      { id: '1', name: 'Hero Section', type: 'hero', order: 1, enabled: true },
      { id: '2', name: 'Business Categories', type: 'gallery', order: 2, enabled: true }
    ]
  }
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function seedIfNeeded() {
  ensureDataDir();
  const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
  if (files.length === 0) {
    for (const page of SEED_PAGES) {
      const filePath = path.join(DATA_DIR, `${page.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(page, null, 2), 'utf-8');
    }
  }
}

export async function GET() {
  try {
    seedIfNeeded();
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
    const pages = files.map(file => {
      const filePath = path.join(DATA_DIR, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        type: data.type,
        status: data.status,
        lastModified: data.lastModified || new Date().toISOString().split('T')[0],
        sections: Array.isArray(data.sections) ? data.sections.length : 0
      };
    });

    return NextResponse.json({ success: true, homepages: pages });
  } catch (err: any) {
    console.error('GET all homepages error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureDataDir();
    const body = await request.json();
    const { name, type, slug } = body;

    if (!name || !type || !slug) {
      return NextResponse.json({ success: false, error: 'Missing name, type, or slug' }, { status: 400 });
    }

    const id = Date.now().toString();
    const newPage = {
      id,
      name,
      slug,
      type,
      status: 'draft',
      lastModified: new Date().toISOString().split('T')[0],
      title: name,
      description: `Description for ${name}`,
      theme: 'light',
      layout: 'standard',
      sections: []
    };

    const filePath = path.join(DATA_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(newPage, null, 2), 'utf-8');

    return NextResponse.json({ success: true, homepage: newPage }, { status: 201 });
  } catch (err: any) {
    console.error('POST homepage error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
