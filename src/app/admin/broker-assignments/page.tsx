'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Assignment {
  id: string;
  broker_id: string;
  broker_name: string | null;
  broker_email: string;
  developer_id: string | null;
  developer_name: string | null;
  developer_slug: string | null;
  development_id: string | null;
  development_name: string | null;
  development_slug: string | null;
  unit_business_id: string | null;
  unit_name: string | null;
  unit_slug: string | null;
  assignment_level: 'developer' | 'development' | 'unit';
  commission_rate: number;
  broker_slug: string;
  custom_phone: string | null;
  custom_whatsapp: string | null;
  status: 'active' | 'paused' | 'revoked';
  notes: string | null;
  created_at: string;
}

interface Options {
  brokers: Array<{ id: string; email: string; display_name: string | null; role: string }>;
  developers: Array<{ id: string; slug: string; name: string; name_ar: string | null }>;
  developments: Array<{ id: string; slug: string; name: string; developer_id: string; developer_name: string }>;
  units: Array<{ id: string; slug: string; name: string; development_id: string }>;
}

export default function BrokerAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [options, setOptions] = useState<Options>({ brokers: [], developers: [], developments: [], units: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isArabic, setIsArabic] = useState(true);

  // Form state
  const [form, setForm] = useState({
    id: '',
    broker_id: '',
    developer_id: '',
    development_id: '',
    unit_business_id: '',
    assignment_level: 'development' as 'developer' | 'development' | 'unit',
    commission_rate: 2.5,
    broker_slug: '',
    custom_phone: '',
    custom_whatsapp: '',
    status: 'active' as 'active' | 'paused' | 'revoked',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/broker-assignments');
      const data = await res.json();
      if (data.assignments) setAssignments(data.assignments);
      if (data.options) setOptions(data.options);
    } catch {
      setMsg({ text: isArabic ? 'فشل تحميل بيانات الإسناد' : 'Failed to load assignments', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNew = () => {
    setForm({
      id: '',
      broker_id: options.brokers[0]?.id || '',
      developer_id: '',
      development_id: options.developments[0]?.id || '',
      unit_business_id: '',
      assignment_level: 'development',
      commission_rate: 2.5,
      broker_slug: '',
      custom_phone: '',
      custom_whatsapp: '',
      status: 'active',
      notes: '',
    });
    setShowModal(true);
  };

  const openEdit = (a: Assignment) => {
    setForm({
      id: a.id,
      broker_id: a.broker_id,
      developer_id: a.developer_id || '',
      development_id: a.development_id || '',
      unit_business_id: a.unit_business_id || '',
      assignment_level: a.assignment_level,
      commission_rate: a.commission_rate,
      broker_slug: a.broker_slug,
      custom_phone: a.custom_phone || '',
      custom_whatsapp: a.custom_whatsapp || '',
      status: a.status,
      notes: a.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/broker-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMsg({ text: isArabic ? 'تم حفظ التخصيص بنجاح!' : 'Assignment saved successfully!', type: 'success' });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setMsg({ text: err.message || (isArabic ? 'حدث خطأ أثناء الحفظ' : 'Save failed'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من رغبتك في إلغاء هذا التخصيص؟' : 'Are you sure you want to revoke this broker assignment?')) return;
    try {
      const res = await fetch(`/api/admin/broker-assignments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg({ text: isArabic ? 'تم إلغاء التخصيص بنجاح' : 'Assignment revoked successfully', type: 'success' });
        loadData();
      }
    } catch {
      setMsg({ text: isArabic ? 'فشل الحذف' : 'Delete failed', type: 'error' });
    }
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '2rem 1.5rem',
        fontFamily: isArabic ? "'Cairo', 'Segoe UI', system-ui, sans-serif" : "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/admin" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 800 }}>
              {isArabic ? '← لوحة الإدارة' : '← Admin'}
            </Link>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
              {isArabic ? 'توزيع المخزون العقاري للوسطاء' : 'Real Estate Syndication'}
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
            {isArabic ? 'تخصيص المشروعات والوحدات للوسطاء العقاريين' : 'Broker Inventory & Minisite Assignments'}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
            {isArabic
              ? 'منح الوسطاء والمسوقين حقوق تسويق المطورين والكمبوندات أو وحدات محددة مع إسناد الاتصال ونسب العمولات آلياً.'
              : 'Grant brokers marketing rights to developers, compounds, or individual unit minisites with white-label attribution.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setIsArabic(!isArabic)}
            style={{
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#92702a',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {isArabic ? 'English' : 'عربي'}
          </button>

          <button
            onClick={openNew}
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #f0c842)',
              color: '#1a1000',
              border: 'none',
              borderRadius: '12px',
              padding: '0.85rem 1.5rem',
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(212,175,55,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="fas fa-plus" /> {isArabic ? '+ تخصيص مخزون لوسيط' : '+ Assign Inventory to Broker'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '0.9rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontSize: '0.82rem',
          fontWeight: 700,
          background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: msg.type === 'success' ? '#166534' : '#991b1b'
        }}>
          {msg.text}
        </div>
      )}

      {/* Grid of Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', border: '1px solid #eef0f5', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            {isArabic ? 'التخصيصات النشطة' : 'Active Assignments'}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
            {assignments.filter(a => a.status === 'active').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
            {isArabic ? 'قنوات تسويق وتوزيع فعالة' : 'Live syndication channels'}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #eef0f5', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            {isArabic ? 'المطورون المتاحون' : 'Connected Developers'}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#D4AF37', margin: '4px 0' }}>
            {options.developers.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
            {isArabic ? 'إعمار، بالم هيلز، سوديك، وغيرها' : 'Emaar, Palm Hills, SODIC, etc.'}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #eef0f5', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            {isArabic ? 'المشروعات والكمبوندات' : 'Available Compounds'}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#3b82f6', margin: '4px 0' }}>
            {options.developments.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
            {isArabic ? 'الساحل الشمالي والقاهرة الجديدة والعلمين' : 'North Coast & Cairo compounds'}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div style={{ background: '#fff', border: '1px solid #eef0f5', borderRadius: '22px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
          {isArabic ? 'حقوق الوسطاء والروابط التسويقية المخصصة' : 'Broker Rights & Minisite Links'}
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37', marginBottom: '0.5rem' }} />
            <div>{isArabic ? 'جاري تحميل قائمة الإسنادات...' : 'Loading broker assignments...'}</div>
          </div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '16px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🤝</div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
              {isArabic ? 'لا توجد تخصيصات مخزون للوسطاء حتى الآن' : 'No broker inventory assignments yet'}
            </h4>
            <p style={{ margin: '6px 0 1.25rem', color: '#64748b', fontSize: '0.8rem' }}>
              {isArabic
                ? 'قم بإسناد مطور أو كمبوند أو وحدة لوسيط لتوليد روابط إحالة مخصصة مع إسناد التواصل المباشر.'
                : 'Assign a developer, compound, or unit to a broker to generate personalized minisite referral links.'}
            </p>
            <button
              onClick={openNew}
              style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {isArabic ? '+ إنشاء أول تخصيص' : '+ Create First Assignment'}
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isArabic ? 'right' : 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>{isArabic ? 'الوسيط / المسوق' : 'Broker'}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{isArabic ? 'المستوى والهدف' : 'Level & Target'}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{isArabic ? 'العمولة' : 'Commission'}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{isArabic ? 'رابط الموقع المصغر للوسيط' : 'Broker Minisite Link'}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{isArabic ? 'وسيلة الاتصال المباشرة' : 'Direct Contact'}</th>
                  <th style={{ padding: '0.75rem 1rem' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: isArabic ? 'left' : 'right' }}>{isArabic ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => {
                  let targetName = isArabic ? 'كل المخزون' : 'All Inventory';
                  let targetBadge = isArabic ? 'مطور' : 'DEVELOPER';
                  let sampleUrl = `/?broker=${a.broker_slug}`;

                  if (a.assignment_level === 'developer' && a.developer_name) {
                    targetName = a.developer_name;
                    targetBadge = isArabic ? 'مطور بالكامل' : 'DEVELOPER';
                    sampleUrl = `/${a.developer_slug || 'developer'}?broker=${a.broker_slug}`;
                  } else if (a.assignment_level === 'development' && a.development_name) {
                    targetName = `${a.development_name} (${a.developer_name || (isArabic ? 'مشروع' : 'Compound')})`;
                    targetBadge = isArabic ? 'مشروع / كمبوند' : 'COMPOUND';
                    sampleUrl = `/${a.development_slug || 'project'}?broker=${a.broker_slug}`;
                  } else if (a.assignment_level === 'unit' && a.unit_name) {
                    targetName = a.unit_name;
                    targetBadge = isArabic ? 'وحدة مخصصة' : 'UNIT MINISITE';
                    sampleUrl = `/${a.unit_slug || 'unit'}?broker=${a.broker_slug}`;
                  }

                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{a.broker_name || (isArabic ? 'وسيط معتمد' : 'Broker')}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', direction: 'ltr', textAlign: isArabic ? 'right' : 'left' }}>{a.broker_email}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 900, background: a.assignment_level === 'unit' ? '#fdf2f8' : a.assignment_level === 'development' ? '#eff6ff' : '#fefce8', color: a.assignment_level === 'unit' ? '#db2777' : a.assignment_level === 'development' ? '#2563eb' : '#ca8a04', marginBottom: '4px' }}>
                          {targetBadge}
                        </div>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{targetName}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px' }}>
                          {a.commission_rate}%
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', direction: 'ltr' }}>
                          <code style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 6px', borderRadius: '6px', color: '#D4AF37', fontWeight: 700, fontSize: '0.75rem' }}>
                            ?broker={a.broker_slug}
                          </code>
                          <button
                            title={isArabic ? 'نسخ الرابط' : 'Copy link'}
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}${sampleUrl}`);
                              alert(isArabic ? `تم نسخ الرابط:\n${window.location.origin}${sampleUrl}` : `Copied link:\n${window.location.origin}${sampleUrl}`);
                            }}
                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
                          >
                            <i className="fas fa-copy" />
                          </button>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                          {isArabic ? 'تتحول طلبات الحجز إلى واتساب الوسيط' : 'Leads route to broker WhatsApp'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {a.custom_whatsapp ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontWeight: 700, fontSize: '0.75rem', direction: 'ltr', justifyContent: isArabic ? 'flex-end' : 'flex-start' }}>
                            <i className="fab fa-whatsapp" /> {a.custom_whatsapp}
                          </div>
                        ) : a.custom_phone ? (
                          <div style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600, direction: 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
                            <i className="fas fa-phone" /> {a.custom_phone}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            {isArabic ? 'بيانات الاتصال الافتراضية' : 'Default account contact'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: a.status === 'active' ? '#dcfce7' : a.status === 'paused' ? '#fef3c7' : '#fee2e2',
                          color: a.status === 'active' ? '#166534' : a.status === 'paused' ? '#92400e' : '#991b1b'
                        }}>
                          {a.status === 'active' ? (isArabic ? 'نشط' : 'Active') : a.status === 'paused' ? (isArabic ? 'موقوف مؤقتاً' : 'Paused') : (isArabic ? 'ملغي' : 'Revoked')}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: isArabic ? 'left' : 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: isArabic ? 'flex-start' : 'flex-end' }}>
                          <button
                            onClick={() => openEdit(a)}
                            style={{ background: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}
                          >
                            {isArabic ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            style={{ background: '#fef2f2', border: 'none', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}
                          >
                            {isArabic ? 'إلغاء' : 'Revoke'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: 580, padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  {form.id
                    ? (isArabic ? 'تعديل تخصيص الوسيط' : 'Edit Broker Assignment')
                    : (isArabic ? 'تخصيص مخزون لمسوق / وسيط' : 'Assign Inventory to Broker')}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  {isArabic
                    ? 'حدد نطاق المطور أو الكمبوند، ومعرف الإحالة، ورقم الواتساب لاستقبال العملاء.'
                    : 'Configure developer inventory scope, referral slug, and direct lead routing.'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Select Broker */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {isArabic ? 'اختر حساب الوسيط *' : 'Select Broker Account *'}
                </label>
                <select
                  value={form.broker_id}
                  onChange={e => {
                    const selBroker = options.brokers.find(b => b.id === e.target.value);
                    const defaultSlug = selBroker ? (selBroker.display_name || selBroker.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '-') : '';
                    setForm({ ...form, broker_id: e.target.value, broker_slug: form.broker_slug || defaultSlug });
                  }}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  <option value="">{isArabic ? '-- اختر حساب الوسيط --' : '-- Choose Broker Profile --'}</option>
                  {options.brokers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.display_name ? `${b.display_name} (${b.email})` : b.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Level */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {isArabic ? 'نطاق الإسناد والتخصيص *' : 'Assignment Scope / Level *'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    { id: 'development', label: isArabic ? 'كمبوند / مشروع' : 'Compound / Project', icon: 'fa-city' },
                    { id: 'developer', label: isArabic ? 'مطور بالكامل' : 'Entire Developer', icon: 'fa-building' },
                    { id: 'unit', label: isArabic ? 'وحدة معينة' : 'Specific Unit', icon: 'fa-door-open' },
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setForm({ ...form, assignment_level: lvl.id as any })}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '10px',
                        border: form.assignment_level === lvl.id ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                        background: form.assignment_level === lvl.id ? 'rgba(212,175,55,0.08)' : '#fff',
                        color: form.assignment_level === lvl.id ? '#92400e' : '#64748b',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <i className={`fas ${lvl.icon}`} />
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Dropdown based on Level */}
              {form.assignment_level === 'developer' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {isArabic ? 'اختر المطور العقاري *' : 'Select Developer *'}
                  </label>
                  <select
                    value={form.developer_id}
                    onChange={e => setForm({ ...form, developer_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <option value="">{isArabic ? '-- اختر المطور --' : '-- Choose Developer --'}</option>
                    {options.developers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} {d.name_ar ? `(${d.name_ar})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.assignment_level === 'development' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {isArabic ? 'اختر الكمبوند / المشروع *' : 'Select Compound / Project *'}
                  </label>
                  <select
                    value={form.development_id}
                    onChange={e => setForm({ ...form, development_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <option value="">{isArabic ? '-- اختر المشروع --' : '-- Choose Compound --'}</option>
                    {options.developments.map(dev => (
                      <option key={dev.id} value={dev.id}>{dev.name} ({dev.developer_name})</option>
                    ))}
                  </select>
                </div>
              )}

              {form.assignment_level === 'unit' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {isArabic ? 'اختر موقع الوحدة المصغر *' : 'Select Unit Minisite *'}
                  </label>
                  <select
                    value={form.unit_business_id}
                    onChange={e => setForm({ ...form, unit_business_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <option value="">{isArabic ? '-- اختر الوحدة --' : '-- Choose Unit --'}</option>
                    {options.units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} (/{u.slug})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Broker Slug & Commission */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {isArabic ? 'معرف الوسيط في الرابط (?broker=...) *' : 'Broker Referral Slug (?broker=...) *'}
                  </label>
                  <input
                    value={form.broker_slug}
                    onChange={e => setForm({ ...form, broker_slug: e.target.value })}
                    placeholder="e.g. ahmed-realty"
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, direction: 'ltr' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {isArabic ? 'نسبة العمولة (%)' : 'Commission Rate (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={form.commission_rate}
                    onChange={e => setForm({ ...form, commission_rate: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Direct Broker Contacts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {isArabic ? 'واتساب الوسيط المباشر (لتحويل العملاء)' : 'Broker WhatsApp (Direct Lead CTA)'}
                  </label>
                  <input
                    value={form.custom_whatsapp}
                    onChange={e => setForm({ ...form, custom_whatsapp: e.target.value })}
                    placeholder="+201012345678"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, direction: 'ltr' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {isArabic ? 'هاتف الاتصال المباشر' : 'Direct Phone Call'}
                  </label>
                  <input
                    value={form.custom_phone}
                    onChange={e => setForm({ ...form, custom_phone: e.target.value })}
                    placeholder="+201012345678"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, direction: 'ltr' }}
                  />
                </div>
              </div>

              {/* Status & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {isArabic ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <option value="active">{isArabic ? 'نشط (مفعل)' : 'Active (Live)'}</option>
                    <option value="paused">{isArabic ? 'موقوف مؤقتاً' : 'Paused'}</option>
                    <option value="revoked">{isArabic ? 'ملغي' : 'Revoked'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {isArabic ? 'ملاحظات داخلية' : 'Internal Notes'}
                  </label>
                  <input
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder={isArabic ? 'مثال: اتفاقية حصرية لإطلاق المرحلة الأولى' : 'e.g. Exclusive launch agreement'}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #f0c842)', border: 'none', color: '#1a1000', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.85rem', cursor: saving ? 'wait' : 'pointer' }}
                >
                  {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : form.id ? (isArabic ? 'حفظ التعديلات' : 'Save Changes') : (isArabic ? 'إنشاء التخصيص' : 'Create Assignment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
