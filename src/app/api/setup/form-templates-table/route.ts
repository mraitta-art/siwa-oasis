import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    await execute(`
      CREATE TABLE IF NOT EXISTS form_templates (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        purpose VARCHAR(80) NOT NULL DEFAULT 'onboarding',
        type_id VARCHAR(100) DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        version INT NOT NULL DEFAULT 1,
        is_default BOOLEAN NOT NULL DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_form_templates_type (type_id),
        INDEX idx_form_templates_status (status),
        FOREIGN KEY (type_id) REFERENCES business_types(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await execute(`
      CREATE TABLE IF NOT EXISTS form_template_sections (
        form_template_id VARCHAR(100) NOT NULL,
        section_id VARCHAR(100) NOT NULL,
        required BOOLEAN NOT NULL DEFAULT 0,
        sort_order INT NOT NULL DEFAULT 0,
        PRIMARY KEY (form_template_id, section_id),
        FOREIGN KEY (form_template_id) REFERENCES form_templates(id) ON DELETE CASCADE,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    try {
      await execute(`ALTER TABLE minisite_templates ADD COLUMN recommended_form_template_id VARCHAR(100) NULL`);
    } catch (error: any) {
      if (!/duplicate|exists/i.test(error?.message || '')) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    const tables = await query(`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('form_templates', 'form_template_sections')
    `) as any[];
    return NextResponse.json({ exists: tables.length === 2 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
