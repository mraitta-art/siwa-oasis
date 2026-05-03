import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const schemaPath = path.join(process.cwd(), 'master-schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json({ error: 'master-schema.sql not found' }, { status: 404 });
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    const commands = sql.split(';').map(cmd => cmd.trim()).filter(cmd => cmd.length > 0);

    console.log(`🚀 Executing ${commands.length} schema commands...`);
    
    const results = [];
    for (const cmd of commands) {
      try {
        await execute(cmd);
        results.push({ cmd: cmd.substring(0, 50) + '...', status: 'success' });
      } catch (e: any) {
        results.push({ cmd: cmd.substring(0, 50) + '...', status: 'error', error: e.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database schema execution completed', 
      total: commands.length,
      details: results 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
