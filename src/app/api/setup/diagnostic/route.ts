import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { mkdir, writeFile, access } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const report: any = {
    timestamp: new Date().toISOString(),
    database: { status: 'unknown' },
    storage: { status: 'unknown' },
    counts: {}
  };

  try {
    // 1. Check DB
    const [dbTest] = await query('SELECT 1 as ok');
    report.database.status = (dbTest as any)?.ok === 1 ? 'Healthy' : 'Error';
    
    // Count records
    const [bizCount] = await query('SELECT COUNT(*) as c FROM businesses');
    const [secCount] = await query('SELECT COUNT(*) as c FROM sections');
    const [fieldCount] = await query('SELECT COUNT(*) as c FROM form_fields');
    
    report.counts = {
      businesses: (bizCount as any)?.c || 0,
      sections: (secCount as any)?.c || 0,
      form_fields: (fieldCount as any)?.c || 0
    };

  } catch (e: any) {
    report.database.status = 'Connection Failed';
    report.database.error = e.message;
  }

  try {
    // 2. Check Storage
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Check if directory exists
    try {
      await access(uploadDir);
      report.storage.dir_exists = true;
    } catch (e) {
      report.storage.dir_exists = false;
      // Try to create it
      await mkdir(uploadDir, { recursive: true });
      report.storage.dir_created = true;
    }

    // Try a test write
    const testFile = join(uploadDir, 'diagnostic.txt');
    await writeFile(testFile, 'Diagnostic test write: ' + report.timestamp);
    report.storage.write_test = 'Success';
    report.storage.status = 'Healthy';

  } catch (e: any) {
    report.storage.status = 'Write Failed';
    report.storage.error = e.message;
  }

  // 3. Final Summary
  const isHealthy = report.database.status === 'Healthy' && report.storage.status === 'Healthy';
  report.summary = isHealthy ? 'System is Ready' : 'Issues Detected';

  return NextResponse.json(report);
}
