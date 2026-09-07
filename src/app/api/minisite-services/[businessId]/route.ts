import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const { businessId } = await params;
    const control = await queryOne<any>(
      'SELECT qr_enabled, minisite_status, services_expires_at FROM vendor_service_controls WHERE business_id = ?',
      [businessId]
    );

    const expired = control?.services_expires_at && new Date(control.services_expires_at) < new Date();
    return NextResponse.json({
      qrEnabled: control ? !!control.qr_enabled && control.minisite_status === 'active' && !expired : true,
      minisiteStatus: expired ? 'expired' : (control?.minisite_status || 'active'),
    });
  } catch {
    return NextResponse.json({ qrEnabled: true, minisiteStatus: 'active' });
  }
}
