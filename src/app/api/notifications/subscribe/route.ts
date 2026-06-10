import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, feature } = await request.json();

    if (!email || !feature) {
      return Response.json({ error: 'Email and feature required' }, { status: 400 });
    }

    // Store subscription in database (create table if needed)
    const query = `
      INSERT INTO feature_subscriptions (email, feature, created_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE updated_at = NOW()
    `;

    await db.query(query, [email, feature]);

    return Response.json({ success: true, message: 'Subscribed to notifications' });
  } catch (error) {
    console.error('Subscription error:', error);
    return Response.json({ error: 'Subscription failed' }, { status: 500 });
  }
}
