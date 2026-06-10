'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';

const S = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(135deg, #556B2F 0%, #1a1a2e 100%)', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  container: { maxWidth: '900px', width: '100%' },
  card: { background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '3rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header: { textAlign: 'center' as const, marginBottom: '3rem' },
  title: { fontSize: '2.5rem', fontWeight: 900, color: '#1a1a2e', marginBottom: '1rem' },
  subtitle: { fontSize: '1.1rem', color: '#64748b', marginBottom: '0.5rem' },
  badge: { display: 'inline-block', background: '#D4AF37', color: '#1a1a2e', padding: '0.5rem 1.5rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '1rem' },
  features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  feature: { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' as const },
  featureIcon: { fontSize: '2rem', marginBottom: '1rem' },
  featureTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '0.5rem' },
  featureDesc: { fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 },
  timeline: { marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e2e8f0' },
  timelineTitle: { fontSize: '1.3rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '1.5rem' },
  phases: { display: 'grid', gap: '1rem' },
  phase: { display: 'flex', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #D4AF37' },
  phaseNumber: { fontWeight: 'bold', color: '#D4AF37', minWidth: '60px', fontSize: '1.1rem' },
  phaseContent: {},
  phaseName: { fontWeight: 'bold', color: '#1a1a2e', marginBottom: '0.25rem' },
  phaseItems: { fontSize: '0.9rem', color: '#64748b' },
  cta: { marginTop: '2rem', textAlign: 'center' as const },
  button: { display: 'inline-block', background: '#556B2F', color: '#D4AF37', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', textDecoration: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }
};

export default function VendorCommunicationComingSoon() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, feature: 'vendor-communication' })
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
        setEmail('');
      }
    } catch (err) {
      console.error('Subscription error:', err);
    }
  };

  return (
    <div style={S.wrap}>
      <div style={S.container}>
        <div style={S.card}>
          {/* Header */}
          <div style={S.header}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📱💬</div>
            <h1 style={S.title}>Multi-Channel Communication Platform</h1>
            <p style={S.subtitle}>Connecting Vendors & Visitors Across 8+ Channels</p>
            <span style={S.badge}>🚀 Coming Soon</span>
          </div>

          {/* Features */}
          <div style={S.features}>
            <div style={S.feature}>
              <div style={S.featureIcon}>📧</div>
              <div style={S.featureTitle}>Email Notifications</div>
              <div style={S.featureDesc}>Automated vendor forwarding with open/click tracking</div>
            </div>

            <div style={S.feature}>
              <div style={S.featureIcon}>📱</div>
              <div style={S.featureTitle}>WhatsApp Integration</div>
              <div style={S.featureDesc}>Direct WhatsApp messaging with rich media & buttons</div>
            </div>

            <div style={S.feature}>
              <div style={S.featureIcon}>💬</div>
              <div style={S.featureTitle}>SMS/Text Alerts</div>
              <div style={S.featureDesc}>Quick 2-minute delivery for urgent notifications</div>
            </div>

            <div style={S.feature}>
              <div style={S.featureIcon}>🇨🇳</div>
              <div style={S.featureTitle}>WeChat Support</div>
              <div style={S.featureDesc}>Asia-Pacific vendor reach with templates & menus</div>
            </div>

            <div style={S.feature}>
              <div style={S.featureIcon}>🔐</div>
              <div style={S.featureTitle}>Privacy Controls</div>
              <div style={S.featureDesc}>5-level contact data sharing (GDPR compliant)</div>
            </div>

            <div style={S.feature}>
              <div style={S.featureIcon}>📊</div>
              <div style={S.featureTitle}>Tracking & Analytics</div>
              <div style={S.featureDesc}>Monitor opens, clicks, responses in real-time</div>
            </div>
          </div>

          {/* Timeline */}
          <div style={S.timeline}>
            <h2 style={S.timelineTitle}>Rollout Timeline</h2>
            <div style={S.phases}>
              <div style={S.phase}>
                <div style={S.phaseNumber}>Phase 1</div>
                <div style={S.phaseContent}>
                  <div style={S.phaseName}>Email Service Integration (June 2026)</div>
                  <div style={S.phaseItems}>✓ SendGrid, Mailgun, AWS SES support<br/>✓ Vendor notification engine<br/>✓ Email templates & tracking</div>
                </div>
              </div>

              <div style={S.phase}>
                <div style={S.phaseNumber}>Phase 2</div>
                <div style={S.phaseContent}>
                  <div style={S.phaseName}>Admin Management (July 2026)</div>
                  <div style={S.phaseItems}>✓ Admin request review dashboard<br/>✓ Contact data sharing controls<br/>✓ Dispatch to vendors</div>
                </div>
              </div>

              <div style={S.phase}>
                <div style={S.phaseNumber}>Phase 3</div>
                <div style={S.phaseContent}>
                  <div style={S.phaseName}>Customer Tracking (July 2026)</div>
                  <div style={S.phaseItems}>✓ Customer request dashboard<br/>✓ Offer comparison interface<br/>✓ Accept/reject offers</div>
                </div>
              </div>

              <div style={S.phase}>
                <div style={S.phaseNumber}>Phase 4</div>
                <div style={S.phaseContent}>
                  <div style={S.phaseName}>WhatsApp & SMS (August 2026)</div>
                  <div style={S.phaseItems}>✓ WhatsApp Business API integration<br/>✓ SMS delivery service<br/>✓ Interactive buttons & media</div>
                </div>
              </div>

              <div style={S.phase}>
                <div style={S.phaseNumber}>Phase 5</div>
                <div style={S.phaseContent}>
                  <div style={S.phaseName}>WeChat & Payment (August 2026)</div>
                  <div style={S.phaseItems}>✓ WeChat Official Accounts API<br/>✓ Payment notifications (Alipay, PayPal)<br/>✓ Multi-language support</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={S.cta}>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Be notified when these features launch</p>
            <form onSubmit={handleNotify} style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px', margin: '0 auto' }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem' }}
              />
              <button type="submit" style={{...S.button, background: '#D4AF37', color: '#1a1a2e'}}>
                Notify Me
              </button>
            </form>
            {submitted && (
              <p style={{ color: '#10b981', marginTop: '1rem', fontWeight: 'bold' }}>✓ You'll be notified when it launches!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
