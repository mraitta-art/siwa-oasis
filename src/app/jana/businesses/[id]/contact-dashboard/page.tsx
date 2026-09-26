'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

function getValue(data: any, paths: string[]) {
  for (const path of paths) {
    const parts = path.split('.');
    let current = data;
    let found = true;

    for (const part of parts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        found = false;
        break;
      }
      current = current[part];
    }

    if (found && current !== undefined && current !== null && String(current).trim() !== '') {
      return String(current).trim();
    }
  }

  return '';
}

export default function ContactDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [biz, setBiz] = useState<any>(null);
  const [sectionControls, setSectionControls] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      try {
        const [bizRes, controlRes, sectionsRes] = await Promise.all([
          fetch(`/api/jana/businesses?id=${id}`),
          fetch(`/api/admin/businesses/${id}/section-controls`),
          fetch('/api/jana/sections')
        ]);

        const business = bizRes.ok ? await bizRes.json() : null;
        const controls = controlRes.ok ? await controlRes.json() : { controls: [] };
        const allSections = sectionsRes.ok ? await sectionsRes.json() : [];

        setBiz(business);
        setSectionControls(Array.isArray(controls.controls) ? controls.controls : []);
        setSections(Array.isArray(allSections) ? allSections : []);
      } catch (error) {
        console.error('Failed to load business contact dashboard', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const mainPhone = useMemo(() => {
    if (!biz) return '';
    return getValue(biz, [
      'vendor_phone',
      'phone',
      'custom_data.basic.phone',
      'custom_data.business_info.phone',
      'custom_data.sec_1_identity.phone',
      'custom_data.phone'
    ]);
  }, [biz]);

  const whatsapp = useMemo(() => {
    if (!biz) return '';
    return getValue(biz, [
      'custom_data.basic.whatsapp',
      'custom_data.business_info.whatsapp',
      'custom_data.sec_1_identity.whatsapp',
      'custom_data.whatsapp',
      'custom_data.basic.whatsapp_number',
      'custom_data.sec_1_identity.whatsapp_number',
      'vendor_phone'
    ]);
  }, [biz]);

  const email = useMemo(() => {
    if (!biz) return '';
    return getValue(biz, [
      'vendor_email',
      'email',
      'custom_data.basic.email',
      'custom_data.business_info.email',
      'custom_data.sec_1_identity.email',
      'custom_data.email'
    ]);
  }, [biz]);

  const website = useMemo(() => {
    if (!biz) return '';
    return getValue(biz, [
      'website',
      'custom_data.basic.website',
      'custom_data.business_info.website',
      'custom_data.sec_1_identity.website',
      'custom_data.website'
    ]);
  }, [biz]);

  const logoUrl = useMemo(() => {
    if (!biz) return '';
    return getValue(biz, [
      'logo_url',
      'custom_data.basic.business_logo',
      'custom_data.basic.logo',
      'custom_data.business_info.business_logo',
      'custom_data.business_info.logo',
      'custom_data.sec_1_identity.business_logo',
      'custom_data.sec_1_identity.logo',
      'custom_data.business_logo',
      'custom_data.logo'
    ]);
  }, [biz]);

  const directCtaOverrides = useMemo(() => {
    return sectionControls
      .filter((control: any) => control && control.cta_phone && String(control.cta_phone).trim())
      .map((control: any) => {
        const section = sections.find((s: any) => s.id === control.section_id);
        return {
          sectionId: control.section_id,
          sectionName: section?.name || control.section_id,
          ctaPhone: control.cta_phone,
          isActive: true,
        };
      });
  }, [sectionControls, sections]);

  if (loading || !biz) {
    return (
      <main style={{ background: '#f8fafc', minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center', color: '#1e293b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
          <div style={{ fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>Loading contact dashboard</div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <Link href={`/jana/businesses/${id}`} style={{ display: 'inline-block', color: '#64748b', textDecoration: 'none', fontWeight: 800, marginBottom: '0.8rem' }}>
                ← Back to business dashboard
              </Link>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>
                Business Contact Dashboard
              </h1>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 700 }}>
                {biz.name} · {biz.slug || 'slug pending'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href={`/jana/businesses/${id}/orchestrate`} className="btn btn-outline">
                Business content
              </Link>
              <Link href={`/${biz.slug}`} target="_blank" className="btn btn-premium">
                View minisite
              </Link>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '2rem' }}>
          <div style={{ background: '#fff', borderRadius: '22px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 10px 30px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1.5px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>Business identity</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.5rem' }}>🏢</span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>{biz.name || 'Business name'}</div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>Slug: /{biz.slug || 'not-set'}</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '22px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 10px 30px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1.5px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>Main business contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <FieldRow label="Main business phone" value={mainPhone || 'Not set'} />
              <FieldRow label="Email" value={email || 'Not set'} />
              <FieldRow label="Website" value={website || 'Not set'} />
              <FieldRow label="WhatsApp" value={whatsapp || 'Not set'} />
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '22px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 10px 30px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1.5px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>Direct CTA override</div>
            <div style={{ padding: '0.9rem 1rem', background: 'rgba(16,185,129,0.08)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.25)', color: '#065f46', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.6 }}>
              This value is not the same as the main business phone. It is a section-specific direct-call override used for the clickable call button on the public minisite.
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <FieldRow label="Override active" value={directCtaOverrides.length ? 'Yes' : 'No'} />
              <FieldRow label="Current CTA phone" value={directCtaOverrides[0]?.ctaPhone || 'No override set'} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 900, letterSpacing: '1.2px', color: '#1e293b', textTransform: 'uppercase' }}>
            Section direct-call overrides
          </div>

          {directCtaOverrides.length === 0 ? (
            <div style={{ padding: '2rem 1.5rem', color: '#64748b', fontWeight: 700 }}>
              No section CTA override is active yet. The minisite will use the main business phone unless an override is added from the section controls.
            </div>
          ) : (
            <div style={{ display: 'grid' }}>
              {directCtaOverrides.map((item) => (
                <div key={item.sectionId} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8', textTransform: 'uppercase' }}>Section</div>
                    <div style={{ fontWeight: 800 }}>{item.sectionName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8', textTransform: 'uppercase' }}>CTA phone</div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.ctaPhone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8', textTransform: 'uppercase' }}>Status</div>
                    <div style={{ fontWeight: 800, color: '#10b981' }}>ACTIVE</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem', background: '#fff', borderRadius: '22px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 10px 30px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1.5px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>Important guidance</div>
          <div style={{ display: 'grid', gap: '0.8rem', color: '#334155', lineHeight: 1.7, fontWeight: 600 }}>
            <div><strong style={{ color: '#0f172a' }}>Main business phone:</strong> this is the general business contact number shown in the public business identity/contact data.</div>
            <div><strong style={{ color: '#0f172a' }}>Direct CTA phone override:</strong> this is for the clickable call button on a specific section. If an override exists, it takes priority for that direct CTA action.</div>
            <div><strong style={{ color: '#0f172a' }}>Logo/media:</strong> the uploaded business logo and identity media are stored and synced for the minisite header and brand identity.</div>
            <div><strong style={{ color: '#0f172a' }}>Admin workflow:</strong> use the section controls to adjust CTA overrides individually, and use this dashboard to review everything in one place.</div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
      <div style={{ color: '#64748b', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ textAlign: 'right', color: '#0f172a', fontWeight: 800, fontSize: '0.75rem', maxWidth: '60%' }}>{value}</div>
    </div>
  );
}
