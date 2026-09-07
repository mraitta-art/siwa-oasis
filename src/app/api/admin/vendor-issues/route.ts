import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS vendor_issues (
      id VARCHAR(100) PRIMARY KEY,
      vendor_id VARCHAR(100) NULL,
      business_id VARCHAR(100) NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      issue_type VARCHAR(100) DEFAULT 'general',
      priority VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(20) DEFAULT 'open',
      created_by VARCHAR(100) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      resolved_at DATETIME NULL,
      INDEX idx_vendor_issues_vendor (vendor_id),
      INDEX idx_vendor_issues_business (business_id),
      INDEX idx_vendor_issues_status (status)
    )
  `);
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const businessId = searchParams.get('businessId');

    let sql = `
      SELECT i.*, b.name AS business_name, p.display_name AS vendor_name
      FROM vendor_issues i
      LEFT JOIN businesses b ON i.business_id = b.id
      LEFT JOIN profiles p ON i.vendor_id = p.id
    `;
    const params: string[] = [];
    const clauses: string[] = [];

    if (vendorId) {
      clauses.push('i.vendor_id = ?');
      params.push(vendorId);
    }
    if (businessId) {
      clauses.push('i.business_id = ?');
      params.push(businessId);
    }
    if (clauses.length) {
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }
    sql += ' ORDER BY i.created_at DESC';

    const rows = await query(sql, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load vendor issues' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureTable();

    const body = await request.json();
    const {
      vendorId,
      businessId,
      title,
      description,
      issueType = 'general',
      priority = 'medium',
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const user = await requireAdmin();
    let resolvedVendorId = vendorId || null;
    let resolvedBusinessId = businessId || null;

    if (!resolvedVendorId && resolvedBusinessId) {
      const businessRows = await query<{ vendor_id: string | null }>('SELECT vendor_id FROM businesses WHERE id = ? LIMIT 1', [resolvedBusinessId]);
      resolvedVendorId = businessRows[0]?.vendor_id || null;
    }

    if (!resolvedVendorId && !resolvedBusinessId) {
      return NextResponse.json({ error: 'Vendor or business is required' }, { status: 400 });
    }

    const issueId = `issue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await execute(
      `INSERT INTO vendor_issues (id, vendor_id, business_id, title, description, issue_type, priority, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, NOW())`,
      [issueId, resolvedVendorId, resolvedBusinessId, String(title).slice(0, 255), String(description), String(issueType).slice(0, 100), String(priority).slice(0, 20), user.id]
    );

    return NextResponse.json({ success: true, issueId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create vendor issue' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureTable();

    const body = await request.json();
    const { id, status, priority, resolutionNote } = body;

    if (!id) {
      return NextResponse.json({ error: 'Issue id is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'resolved' || status === 'closed') {
        updates.push('resolved_at = NOW()');
      }
    }
    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (resolutionNote) {
      updates.push('description = CONCAT(COALESCE(description, ""), "\n\nAdmin update: ", ?)');
      params.push(String(resolutionNote).slice(0, 1000));
    }

    if (!updates.length) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    params.push(id);
    await execute(`UPDATE vendor_issues SET ${updates.join(', ')} WHERE id = ?`, params);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update vendor issue' }, { status: 500 });
  }
}
