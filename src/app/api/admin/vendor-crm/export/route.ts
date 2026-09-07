import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

async function ensureTables() {
  await execute(`CREATE TABLE IF NOT EXISTS vendor_contacts (
    id VARCHAR(36) PRIMARY KEY, vendor_id VARCHAR(36) NOT NULL, full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL, phone VARCHAR(100) DEFAULT NULL, job_title VARCHAR(150) DEFAULT NULL,
    contact_role VARCHAR(100) DEFAULT 'general', is_primary BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE,
    notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vendor_contacts_vendor (vendor_id)
  )`);
  await execute(`CREATE TABLE IF NOT EXISTS vendor_issues (
    id VARCHAR(100) PRIMARY KEY, vendor_id VARCHAR(100) NULL, business_id VARCHAR(100) NULL,
    title VARCHAR(255) NOT NULL, description TEXT NOT NULL, issue_type VARCHAR(100) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'medium', status VARCHAR(20) DEFAULT 'open', created_by VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL, INDEX idx_vendor_issues_vendor (vendor_id)
  )`);
}

function csv(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureTables();
    const format = new URL(request.url).searchParams.get('format') || 'json';
    const vendors = await query<any>(`
      SELECT p.id AS vendor_id, p.display_name AS vendor_name, p.email AS vendor_email, p.phone AS vendor_phone,
        p.role, p.active, p.approval_status, p.verification_status, p.subscription_tier, p.created_at, p.updated_at,
        COUNT(DISTINCT b.id) AS business_count, COUNT(DISTINCT pv.id) AS total_visits,
        COUNT(DISTINCT pv.session_id) AS unique_visitors, COUNT(DISTINCT i.id) AS issue_count,
        SUM(CASE WHEN i.status IN ('open', 'in_progress') THEN 1 ELSE 0 END) AS open_issue_count
      FROM profiles p
      LEFT JOIN businesses b ON b.vendor_id = p.id
      LEFT JOIN page_views pv ON pv.business_id = b.id
      LEFT JOIN vendor_issues i ON i.vendor_id = p.id
      WHERE p.role = 'vendor'
      GROUP BY p.id, p.display_name, p.email, p.phone, p.role, p.active, p.approval_status,
        p.verification_status, p.subscription_tier, p.created_at, p.updated_at
      ORDER BY p.created_at DESC`);
    const vendorIds = vendors.map(vendor => vendor.vendor_id);
    const businesses = vendorIds.length ? await query<any>(`SELECT b.id, b.vendor_id, b.name, b.slug, b.type_id, b.status, b.subscription_tier, b.created_at, b.updated_at FROM businesses b WHERE b.vendor_id IN (${vendorIds.map(() => '?').join(',')})`, vendorIds) : [];
    const contacts = vendorIds.length ? await query<any>(`SELECT id, vendor_id, full_name, email, phone, job_title, contact_role, is_primary, is_active, notes, created_at, updated_at FROM vendor_contacts WHERE vendor_id IN (${vendorIds.map(() => '?').join(',')}) ORDER BY is_primary DESC, full_name`, vendorIds) : [];
    const result = vendors.map(vendor => ({
      ...vendor,
      contacts: contacts.filter(contact => contact.vendor_id === vendor.vendor_id),
      businesses: businesses.filter(business => business.vendor_id === vendor.vendor_id),
    }));
    if (format === 'csv') {
      const headers = ['vendor_id', 'vendor_name', 'vendor_email', 'vendor_phone', 'approval_status', 'verification_status', 'subscription_tier', 'active', 'business_count', 'total_visits', 'unique_visitors', 'issue_count', 'open_issue_count', 'business_id', 'business_name', 'business_slug', 'contact_id', 'contact_name', 'contact_email', 'contact_phone', 'contact_role', 'contact_job_title', 'contact_is_primary'];
      const rows = result.flatMap(vendor => {
        const vendorBusinesses = vendor.businesses.length ? vendor.businesses : [null];
        const vendorContacts = vendor.contacts.length ? vendor.contacts : [null];
        return vendorBusinesses.flatMap((business: any) => vendorContacts.map((contact: any) => [vendor.vendor_id, vendor.vendor_name, vendor.vendor_email, vendor.vendor_phone, vendor.approval_status, vendor.verification_status, vendor.subscription_tier, vendor.active, vendor.business_count, vendor.total_visits, vendor.unique_visitors, vendor.issue_count, vendor.open_issue_count, business?.id, business?.name, business?.slug, contact?.id, contact?.full_name, contact?.email, contact?.phone, contact?.contact_role, contact?.job_title, contact?.is_primary].map(csv).join(',')));
      });
      return new NextResponse([headers.map(csv).join(','), ...rows].join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="siwa-vendor-crm-export.csv"' } });
    }
    return NextResponse.json({ exportedAt: new Date().toISOString(), count: result.length, vendors: result });
  } catch (error: any) {
    const message = error?.message || 'CRM export failed';
    const status = message.includes('Not authenticated') ? 401 : message.includes('Admin access required') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
