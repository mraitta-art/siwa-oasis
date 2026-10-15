import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(_req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS vendor_lifecycle_events (
        id VARCHAR(36) PRIMARY KEY,
        vendor_id VARCHAR(36) NOT NULL,
        business_id VARCHAR(36),
        action VARCHAR(50) NOT NULL,
        reason TEXT,
        performed_by VARCHAR(36),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vle_vendor_id (vendor_id)
      )
    `);
    results.push('vendor_lifecycle_events: OK');
  } catch (err: any) {
    results.push(`vendor_lifecycle_events: ERROR — ${err.message}`);
  }

  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS vendor_messages (
        id VARCHAR(36) PRIMARY KEY,
        vendor_id VARCHAR(36) NOT NULL,
        business_id VARCHAR(36),
        subject VARCHAR(255),
        body TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        action_trigger VARCHAR(50),
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vm_vendor_id (vendor_id),
        INDEX idx_vm_business_id (business_id)
      )
    `);
    results.push('vendor_messages: OK');
  } catch (err: any) {
    results.push(`vendor_messages: ERROR — ${err.message}`);
  }

  const hasError = results.some((r) => r.includes('ERROR'));

  return NextResponse.json(
    { success: !hasError, results },
    { status: hasError ? 500 : 200 }
  );
}
