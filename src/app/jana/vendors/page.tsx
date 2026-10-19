'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface VendorItem {
  id: string;
  name?: string;
  email?: string;
  owner_name?: string;
  owner_email?: string;
  slug?: string;
  display_name?: string;
  role?: string;
  subscription_tier: string;
  business_id?: string;
  business_name?: string;
  business_slug?: string;
  active?: boolean;
}

const ALL_FEATURES = [
  { key: 'minisite', label: 'الموقع الرقمي (Minisite)', desc: 'عرض وحجز الموقع على النطاق العام' },
  { key: 'social_bio', label: 'رابط بايو السوشيال (Bio Tool)', desc: 'نسخ ومشاركة رابط البايو لإنستغرام وتيك توك' },
  { key: 'profile_editor', label: 'تعديل البيانات الأساسية', desc: 'تحديث أرقام الهاتف والوصف' },
  { key: 'content_creator', label: 'صانع الفيديوهات والريلز', desc: 'أدوات تصميم ستوري وبوستات جاهزة' },
  { key: 'packages_studio', label: 'استوديو الباقات والرحلات', desc: 'إضافة عروض وباقات سياحية متكاملة' },
  { key: 'analytics_dashboard', label: 'إحصائيات ونقرات الزوار', desc: 'متابعة المشاهدات والنقرات' },
  { key: 'journey_planner_listing', label: 'إدراج في مخطط الرحلات', desc: 'ظهور الكارت في Smart Journey Planner' },
  { key: 'verified_badge', label: 'شارة التوثيق الرسمية', desc: 'شارة شريك معتمد خضراء على البطاقة' },
];

export default function VendorsAdminPage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBiz, setSelectedBiz] = useState<{ id: string; name: string; tier: string } | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vendor-permissions');
      if (res.ok) {
        const data = await res.json();
        setVendors(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load vendors', e);
    } finally {
      setLoading(false);
    }
  }

  async function openPermissionsModal(bizId: string, bizName: string, tier: string) {
    setSelectedBiz({ id: bizId, name: bizName, tier });
    try {
      const res = await fetch(`/api/vendor/permissions?businessId=${bizId}`);
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || {});
      }
    } catch (e) {
      console.error('Failed to load permissions', e);
    }
  }

  async function togglePermission(featureKey: string, nextValue: boolean) {
    if (!selectedBiz) return;
    setSavingKey(featureKey);
    try {
      const res = await fetch('/api/vendor/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBiz.id,
          featureKey,
          isEnabled: nextValue,
          adminNote: `Admin override on ${new Date().toLocaleDateString()}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || {});
      }
    } catch (e) {
      console.error('Failed to update permission', e);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Cairo', 'Inter', sans-serif", direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc' }}>
            👥 إدارة حسابات الشركاء والصلاحيات المخصصة
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            التحكم في الميزات النشطة على تطبيق الموبايل (PWA) لكل شريك حسب باقته أو باستثناء مخصص
          </p>
        </div>

        <Link
          href="/jana/whatsapp-outreach"
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '1.5px solid #D4AF37',
            color: '#D4AF37',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>📲 مركز إرسال الدعوات والواتساب</span>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#D4AF37' }}>
          ⏳ جاري تحميل الشركاء والأنشطة...
        </div>
      ) : (
        <div style={{ background: '#0f172a', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                <th style={{ padding: '1rem 1.25rem' }}>اسم النشاط / المورّد</th>
                <th style={{ padding: '1rem 1.25rem' }}>الرابط (Slug)</th>
                <th style={{ padding: '1rem 1.25rem' }}>الباقة الحالية</th>
                <th style={{ padding: '1rem 1.25rem' }}>الحالة</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>التحكم بالصلاحيات</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f8fafc' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 800 }}>{v.business_name || v.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.email || v.owner_email || '—'}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', direction: 'ltr', color: '#D4AF37', fontFamily: 'monospace' }}>
                    /{v.slug || '—'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: v.subscription_tier === 'pro' ? 'rgba(212,175,55,0.15)' : v.subscription_tier === 'verified_partner' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
                      color: v.subscription_tier === 'pro' ? '#D4AF37' : v.subscription_tier === 'verified_partner' ? '#4ade80' : '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      {v.subscription_tier || 'free'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {v.active !== false ? (
                      <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 800 }}>● نشط</span>
                    ) : (
                      <span style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 800 }}>○ معطل</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => openPermissionsModal(v.id, v.business_name || v.name || 'Vendor', v.subscription_tier || 'free')}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                        color: '#070B12',
                        border: 0,
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(212,175,55,0.2)',
                      }}
                    >
                      ⚙️ تعديل الصلاحيات
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── PERMISSIONS MODAL ─────────────────────────────────────── */}
      {selectedBiz && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(7, 11, 18, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
        }}>
          <div style={{
            background: '#0f172a',
            border: '1.5px solid #D4AF37',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(15,23,42,0.9))',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1.5px' }}>
                  تحكم صلاحيات التطبيق (PWA FEATURES)
                </div>
                <h3 style={{ margin: '0.2rem 0 0', color: '#fff', fontSize: '1.15rem', fontWeight: 900 }}>
                  {selectedBiz.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBiz(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 0,
                  color: '#fff',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Features List */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                يمكنك تفعيل أو إيقاف أي ميزة لهذا النشاط بشكل مستقل عن باقته:
              </div>

              {ALL_FEATURES.map((feat) => {
                const isEnabled = Boolean(permissions[feat.key]);
                const isSaving = savingKey === feat.key;

                return (
                  <div
                    key={feat.key}
                    style={{
                      background: isEnabled ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isEnabled ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '14px',
                      padding: '0.85rem 1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isEnabled ? '#f8fafc' : '#94a3b8' }}>
                        {feat.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {feat.desc}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => togglePermission(feat.key, !isEnabled)}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '10px',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        border: 0,
                        cursor: 'pointer',
                        background: isEnabled ? '#22c55e' : '#334155',
                        color: isEnabled ? '#022c22' : '#cbd5e1',
                        minWidth: '85px',
                        boxShadow: isEnabled ? '0 2px 8px rgba(34,197,94,0.3)' : 'none',
                      }}
                    >
                      {isSaving ? '⏳' : isEnabled ? '✓ مفعّلة' : '✕ معطّلة'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={() => setSelectedBiz(null)}
                style={{
                  padding: '0.55rem 1.4rem',
                  borderRadius: '10px',
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
