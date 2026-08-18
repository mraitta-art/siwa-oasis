import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { saveUploadedBuffer } from '@/lib/media-storage';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const row = await queryOne<any>(
      `SELECT verification_status, trust_rejection_note, id_doc_front_url, id_doc_back_url, ownership_doc_url 
       FROM profiles WHERE id = ?`,
      [user.id]
    );

    if (!row) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      verificationStatus: row.verification_status,
      trustRejectionNote: row.trust_rejection_note,
      idDocFrontUrl: row.id_doc_front_url,
      idDocBackUrl: row.id_doc_back_url,
      ownershipDocUrl: row.ownership_doc_url
    });
  } catch (error: any) {
    console.error('[VERIFICATION GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to retrieve verification details' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const idFront = formData.get('idFront') as File | null;
    const idBack = formData.get('idBack') as File | null;
    const ownershipDoc = formData.get('ownershipDoc') as File | null;

    // We need all 3 docs for submission unless they already uploaded them previously
    const current = await queryOne<any>(
      `SELECT id_doc_front_url, id_doc_back_url, ownership_doc_url FROM profiles WHERE id = ?`,
      [user.id]
    );

    const idFrontUrl = idFront
      ? saveUploadedBuffer(Buffer.from(await idFront.arrayBuffer()), `${Date.now()}-id-front-${idFront.name}`, `vendor/${user.id}/verification`).url
      : current?.id_doc_front_url;

    const idBackUrl = idBack
      ? saveUploadedBuffer(Buffer.from(await idBack.arrayBuffer()), `${Date.now()}-id-back-${idBack.name}`, `vendor/${user.id}/verification`).url
      : current?.id_doc_back_url;

    const ownershipDocUrl = ownershipDoc
      ? saveUploadedBuffer(Buffer.from(await ownershipDoc.arrayBuffer()), `${Date.now()}-ownership-${ownershipDoc.name}`, `vendor/${user.id}/verification`).url
      : current?.ownership_doc_url;

    if (!idFrontUrl || !idBackUrl || !ownershipDocUrl) {
      return NextResponse.json({ error: 'All three documents (ID Front, ID Back, and Ownership Proof) are required.' }, { status: 400 });
    }

    // Update profile verification state to pending review
    await execute(
      `UPDATE profiles 
       SET id_doc_front_url = ?, id_doc_back_url = ?, ownership_doc_url = ?, verification_status = 'pending', trust_rejection_note = NULL, updated_at = NOW() 
       WHERE id = ?`,
      [idFrontUrl, idBackUrl, ownershipDocUrl, user.id]
    );

    return NextResponse.json({ success: true, message: 'Verification application submitted successfully' });
  } catch (error: any) {
    console.error('[VERIFICATION POST ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to submit verification' }, { status: 500 });
  }
}
