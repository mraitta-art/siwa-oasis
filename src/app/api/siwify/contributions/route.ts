import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

// Ensure table exists on first request
async function ensureContributionsTable() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS minisite_contributions (
        id VARCHAR(100) PRIMARY KEY,
        business_id VARCHAR(100) NOT NULL,
        author_name VARCHAR(150) NOT NULL,
        author_origin VARCHAR(100) DEFAULT NULL,
        contribution_type ENUM('review', 'tip', 'road_alert', 'photo_story') DEFAULT 'review',
        rating INT DEFAULT 5,
        title VARCHAR(255) DEFAULT NULL,
        content TEXT NOT NULL,
        media_url VARCHAR(500) DEFAULT NULL,
        status ENUM('approved', 'pending', 'rejected') DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_biz (business_id),
        INDEX idx_status (status)
      )
    `);
  } catch (err) {
    console.error('Failed to verify minisite_contributions table:', err);
  }
}

// GET contributions for a business
export async function GET(request: NextRequest) {
  try {
    await ensureContributionsTable();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const slug = searchParams.get('slug');

    let targetBizId = businessId;
    if (!targetBizId && slug) {
      const biz = await queryOne<any>(`SELECT id FROM businesses WHERE slug = ? LIMIT 1`, [slug]);
      targetBizId = biz?.id;
    }

    if (!targetBizId) {
      return NextResponse.json({ error: 'Missing business identifier' }, { status: 400 });
    }

    const contributions = await query(
      `SELECT * FROM minisite_contributions 
       WHERE business_id = ? AND status = 'approved' 
       ORDER BY created_at DESC LIMIT 50`,
      [targetBizId]
    );

    return NextResponse.json(contributions || []);
  } catch (error: any) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch contributions' }, { status: 500 });
  }
}

// POST new contribution
export async function POST(request: NextRequest) {
  try {
    await ensureContributionsTable();
    const body = await request.json();
    const { businessId, slug, authorName, authorOrigin, contributionType, rating, title, content, mediaUrl } = body;

    let targetBizId = businessId;
    if (!targetBizId && slug) {
      const biz = await queryOne<any>(`SELECT id FROM businesses WHERE slug = ? LIMIT 1`, [slug]);
      targetBizId = biz?.id;
    }

    if (!targetBizId) {
      return NextResponse.json({ error: 'Missing business identifier' }, { status: 400 });
    }

    if (!authorName || !content) {
      return NextResponse.json({ error: 'Author name and content are required' }, { status: 400 });
    }

    const id = `contrib_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const parsedRating = Math.max(1, Math.min(5, Number(rating) || 5));

    await execute(
      `INSERT INTO minisite_contributions (
        id, business_id, author_name, author_origin, contribution_type, rating, title, content, media_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [
        id,
        targetBizId,
        authorName.trim(),
        authorOrigin || 'Verified Traveler',
        contributionType || 'review',
        parsedRating,
        title || null,
        content.trim(),
        mediaUrl || null
      ]
    );

    return NextResponse.json({
      success: true,
      contribution: {
        id,
        business_id: targetBizId,
        author_name: authorName,
        rating: parsedRating,
        title,
        content,
        created_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error submitting contribution:', error);
    return NextResponse.json({ error: error?.message || 'Failed to submit contribution' }, { status: 500 });
  }
}
