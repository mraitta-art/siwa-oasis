import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** 
 * EXCEL (CSV) BRIDGE API
 * GET: Export table to CSV
 * POST: Import CSV to table
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    const allowedTables = ['business_types', 'sections', 'form_fields', 'profiles', 'businesses', 'locations', 'subscription_tiers'];
    if (!table || !allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table selection' }, { status: 400 });
    }

    const data = await query(`SELECT * FROM ${table}`);
    if (data.length === 0) {
      // If empty, just return headers
      const columns = await query(`SHOW COLUMNS FROM ${table}`);
      const headers = columns.map((c: any) => c.Field).join(',');
      return new NextResponse(headers, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=${table}_export.csv`
        }
      });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...data.map((row: any) => 
        headers.map(header => {
          const val = row[header];
          if (val === null || val === undefined) return '';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          // Escape quotes and wrap in quotes if contains comma or quote
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    return new NextResponse(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${table}_export.csv`
      }
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const table = formData.get('table') as string;

    const allowedTables = ['business_types', 'sections', 'form_fields', 'profiles', 'businesses', 'locations', 'subscription_tiers'];
    if (!table || !allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table selection' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return NextResponse.json({ error: 'File is empty' }, { status: 400 });

    // Simple CSV parser
    const parseCSVLine = (line: string) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i+1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur);
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur);
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(parseCSVLine);

    // Perform Upsert (Insert or Update)
    // We use REPLACE INTO or INSERT ... ON DUPLICATE KEY UPDATE
    for (const row of rows) {
      if (row.length < headers.length) continue;
      
      const setClause = headers.map((h, i) => `${h} = ?`).join(', ');
      const values = row.map(v => {
        if (v === '') return null;
        // Check if it's JSON
        if ((v.startsWith('{') && v.endsWith('}')) || (v.startsWith('[') && v.endsWith(']'))) {
            try { return JSON.parse(v); } catch { return v; }
        }
        return v;
      });

      // Simple Replace approach (works well for architect data)
      await execute(`REPLACE INTO ${table} (${headers.join(', ')}) VALUES (${headers.map(() => '?').join(', ')})`, values);
    }

    return NextResponse.json({ success: true, count: rows.length });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
