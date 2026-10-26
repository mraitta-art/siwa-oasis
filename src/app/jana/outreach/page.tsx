'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useLang } from '@/context/LangContext';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */
interface OutreachTemplate {
  id: string;
  business_type_id: string;
  business_type_name: string | null;
  business_type_parent_id: string | null;
  target_scope: 'parent_only' | 'children_only' | 'both';
  template_name: string;
  message_subject_en: string | null;
  message_subject_ar: string | null;
  message_body_en: string | null;
  message_body_ar: string | null;
  included_features: string[];
  cta_type: 'claim_profile' | 'preview_minisite' | 'register';
  minisite_template_id: string | null;
  minisite_template_name: string | null;
  is_active: number;
  times_used: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BizType {
  id: string;
  name: string;
  name_ar?: string | null;
  icon?: string;
  icon_color?: string;
  is_parent: boolean;
  parent_id: string | null;
}

interface MinisiteTemplate {
  id: string;
  name: string;
  category_id?: string | null;
}

interface DryRunResult {
  counts: { eligible: number; skipped_already_outreached: number; audience_types: number };
  template?: {
    id: string;
    name: string;
    target_scope: string;
    inherited_from?: { id: string; name: string } | null;
  } | null;
  audience: { id: string; name: string; type_name: string; slug: string }[];
  preview: {
    business_name: string;
    subject_en: string | null;
    body_en: string;
    body_ar: string | null;
    claim_url: string;
  } | null;
}

interface SendResult {
  campaign_id?: string;
  counts: {
    eligible: number;
    sent: number;
    failed: number;
    skipped_already_outreached: number;
    with_phone?: number;
  };
  errors?: { business_id: string; error: string }[];
  message?: string;
}

const EMPTY_FORM = {
  id: '',
  business_type_id: '',
  target_scope: 'both' as OutreachTemplate['target_scope'],
  template_name: '',
  message_subject_en: '',
  message_subject_ar: '',
  message_body_en: '',
  message_body_ar: '',
  features_text: '',
  cta_type: 'claim_profile' as OutreachTemplate['cta_type'],
  minisite_template_id: '',
  is_active: true,
};

/* ─────────────────────────────────────────────────────────
   Bilingual labels (EN / AR)
   ───────────────────────────────────────────────────────── */
const LABELS = {
  title: { en: 'Template Outreach — Level 1', ar: 'الترشيح بالقوالب — المستوى الأول' },
  subtitle: {
    en: 'Create per-category outreach templates, then batch-send personalized minisite invitations to every unclaimed vendor.',
    ar: 'أنشئ قوالب ترشيح لكل فئة، ثم أرسل دعوات مخصصة لكل المورّدين غير المستلمين دفعة واحدة.',
  },
  templates: { en: 'Outreach Templates', ar: 'قوالب الترشيح' },
  newTemplate: { en: 'New Template', ar: 'قالب جديد' },
  batchSend: { en: 'Batch Send Panel', ar: 'لوحة الإرسال الجماعي' },
  statTemplates: { en: 'Templates', ar: 'قوالب' },
  statActive: { en: 'Active', ar: 'مفعّلة' },
  statTypes: { en: 'Categories Covered', ar: 'فئات مغطاة' },
  statSends: { en: 'Total Sends', ar: 'إجمالي الإرسالات' },
  colType: { en: 'Category', ar: 'الفئة' },
  colName: { en: 'Template', ar: 'القالب' },
  colScope: { en: 'Scope', ar: 'النطاق' },
  colCta: { en: 'CTA', ar: 'الدعوة' },
  colStatus: { en: 'Status', ar: 'الحالة' },
  colLastUsed: { en: 'Last Used', ar: 'آخر استخدام' },
  colActions: { en: 'Actions', ar: 'إجراءات' },
  edit: { en: 'Edit', ar: 'تعديل' },
  deactivate: { en: 'Deactivate', ar: 'إلغاء التنشيط' },
  activate: { en: 'Activate', ar: 'تنشيط' },
  noTemplates: { en: 'No outreach templates yet. Create the first one.', ar: 'لا توجد قوالب بعد. أنشئ أول قالب.' },
  formNew: { en: 'New Outreach Template', ar: 'قالب ترشيح جديد' },
  formEdit: { en: 'Edit Outreach Template', ar: 'تعديل قالب الترشيح' },
  fName: { en: 'Template Name', ar: 'اسم القالب' },
  fType: { en: 'Business Category', ar: 'فئة النشاط' },
  fParentType: { en: 'Parent Category', ar: 'الفئة الرئيسية' },
  fChildType: { en: 'Sub-category', ar: 'الفئة الفرعية' },
  allChildren: { en: 'Whole parent category', ar: 'الفئة الأم بالكامل' },
  noChildren: { en: 'No sub-categories', ar: 'لا توجد فئات فرعية' },
  inheritedFrom: { en: 'inherited from', ar: 'موروثة من' },
  scopeSelfOnly: { en: 'Applies to this category only — it has no sub-categories.', ar: 'تنطبق على هذه الفئة فقط — لا توجد فئات فرعية.' },
  fScope: { en: 'Target Scope', ar: 'نطاق الاستهداف' },
  scopeParentOnly: { en: 'Parent only', ar: 'الفئة الأم فقط' },
  scopeChildrenOnly: { en: 'Children only', ar: 'الفئات الفرعية فقط' },
  scopeBoth: { en: 'Parent + children', ar: 'الأم والفرعية' },
  fSubjectEn: { en: 'Subject (EN)', ar: 'العنوان (إنجليزي)' },
  fSubjectAr: { en: 'Subject (AR)', ar: 'العنوان (عربي)' },
  fBodyEn: { en: 'Message Body (EN)', ar: 'نص الرسالة (إنجليزي)' },
  fBodyAr: { en: 'Message Body (AR)', ar: 'نص الرسالة (عربي)' },
  fFeatures: { en: 'Included Free Features (one per line)', ar: 'المزايا المجانية (كل ميزة في سطر)' },
  fCta: { en: 'Call To Action', ar: 'نوع الدعوة' },
  ctaClaim: { en: 'Claim profile (tokenized invite)', ar: 'استلام الملف (دعوة برمز)' },
  ctaPreview: { en: 'Preview minisite', ar: 'معاينة الموقع المصغر' },
  ctaRegister: { en: 'Register', ar: 'التسجيل' },
  fMinisiteTemplate: { en: 'Linked Minisite Template (optional)', ar: 'قالب الموقع المصغر المرتبط (اختياري)' },
  fActive: { en: 'Active', ar: 'مفعّل' },
  save: { en: 'Save Template', ar: 'حفظ القالب' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  saving: { en: 'Saving…', ar: 'جارٍ الحفظ…' },
  bsType: { en: 'Business Category', ar: 'فئة النشاط' },
  bsTemplate: { en: 'Template', ar: 'القالب' },
  bsAuto: { en: 'Auto (newest active for the category)', ar: 'تلقائي (الأحدث المفعّل للفئة)' },
  bsDryRun: { en: 'Dry Run (preview)', ar: 'تجربة بدون إرسال' },
  bsSend: { en: 'Send Batch Outreach', ar: 'إرسال جماعي' },
  bsSending: { en: 'Sending…', ar: 'جارٍ الإرسال…' },
  bsEligible: { en: 'Eligible vendors', ar: 'مورّدون مؤهلون' },
  bsSkipped: { en: 'Already reached', ar: 'تم الوصول إليهم' },
  bsSent: { en: 'Sent', ar: 'أُرسلت' },
  bsFailed: { en: 'Failed', ar: 'فشلت' },
  bsPreviewTitle: { en: 'Sample message', ar: 'نموذج الرسالة' },
  bsAudience: { en: 'Audience sample', ar: 'عينة من الجمهور' },
  bsResult: { en: 'Batch result', ar: 'نتيجة الإرسال' },
  bsConfirm: { en: 'Send outreach to all eligible unclaimed vendors now?', ar: 'إرسال الترشيح لكل المورّدين المؤهلين الآن؟' },
  selectPlaceholder: { en: '— Select —', ar: '— اختر —' },
  loading: { en: 'Loading…', ar: 'جارٍ التحميل…' },
  level2Tip: {
    en: 'This page sends automated template outreach (Level 1). Hand-built curated packages (Level 2) are tracked on the approval packages board.',
    ar: 'هذه الصفحة للترشيح الآلي بالقوالب (المستوى الأول). الحزم المُنسّقة يدويًا (المستوى الثاني) تُدار من لوحة حزم الموافقة.',
  },
  level2Link: { en: 'Approval packages', ar: 'حزم الموافقة' },
};

/* ─────────────────────────────────────────────────────────
   Shared form styling (module level so the category picker
   and the page render with the exact same controls)
   ───────────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '0.85rem',
  background: '#fff',
  color: '#0f172a',
  boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 800,
  color: '#475569',
  marginBottom: '0.3rem',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

/* ─────────────────────────────────────────────────────────
   Parent-child category hierarchy
   Category selection always walks the real business_types tree:
   a parent category first, then one of its child typologies.
   ───────────────────────────────────────────────────────── */
function useCategoryHierarchy(bizTypes: BizType[], lang: string) {
  const labelOf = useCallback(
    (t: BizType | null) => (!t ? '' : lang === 'ar' && t.name_ar ? t.name_ar : t.name),
    [lang]
  );

  // Trust the flag, but also treat any type that has children as a parent so a
  // mistyped is_parent never hides a branch of the tree.
  const isParent = useCallback((t: BizType) => t.is_parent === true || String(t.is_parent) === '1', []);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, BizType[]>();
    bizTypes.forEach((t) => {
      if (isParent(t) || !t.parent_id || t.parent_id === t.id) return;
      const list = map.get(t.parent_id) || [];
      list.push(t);
      map.set(t.parent_id, list);
    });
    map.forEach((list) => list.sort((a, b) => labelOf(a).localeCompare(labelOf(b))));
    return map;
  }, [bizTypes, isParent, labelOf]);

  const parents = useMemo(
    () =>
      bizTypes
        .filter((t) => isParent(t) || childrenByParent.has(t.id))
        .sort((a, b) => labelOf(a).localeCompare(labelOf(b))),
    [bizTypes, isParent, childrenByParent, labelOf]
  );

  const byId = useMemo(() => new Map(bizTypes.map((t) => [t.id, t])), [bizTypes]);
  const childrenOf = useCallback((parentId: string) => childrenByParent.get(parentId) || [], [childrenByParent]);

  /** Full hierarchy path of a category id, e.g. "Accommodation › Hotel". */
  const pathOf = useCallback(
    (id: string) => {
      const type = byId.get(id) || null;
      if (!type) return id;
      if (isParent(type)) return labelOf(type);
      const parent = type.parent_id ? byId.get(type.parent_id) || null : null;
      if (!parent) return labelOf(type);
      return `${labelOf(parent)} › ${labelOf(type)}`;
    },
    [byId, isParent, labelOf]
  );

  return { parents, childrenOf, pathOf, byId, isParent, labelOf };
}

/**
 * Cascading parent → sub-category picker producing a single business_type_id.
 * Picking the parent itself (or leaving the sub-category on "whole parent")
 * stores the parent id, which is what target_scope then expands over.
 */
function CategoryHierarchyPicker({
  value,
  onChange,
  hierarchy,
  T,
  label,
}: {
  value: string;
  onChange: (businessTypeId: string) => void;
  hierarchy: ReturnType<typeof useCategoryHierarchy>;
  T: (key: keyof typeof LABELS) => string;
  label: string;
}) {
  const current = value ? hierarchy.byId.get(value) || null : null;
  const selectedParentId = current ? (hierarchy.isParent(current) ? current.id : current.parent_id || '') : '';
  const selectedChildId = current && !hierarchy.isParent(current) ? current.id : '';
  const subCategories = selectedParentId ? hierarchy.childrenOf(selectedParentId) : [];
  // A child whose parent row is missing/inactive stays visible instead of resetting.
  const parentMissing = Boolean(selectedParentId) && !hierarchy.parents.some((p) => p.id === selectedParentId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div>
        <label style={labelStyle}>{label}</label>
        <select style={inputStyle} value={selectedParentId} onChange={(e) => onChange(e.target.value)}>
          <option value="">{T('selectPlaceholder')}</option>
          {hierarchy.parents.map((p) => (
            <option key={p.id} value={p.id}>{hierarchy.labelOf(p)}</option>
          ))}
          {parentMissing && <option value={selectedParentId}>{hierarchy.pathOf(selectedParentId)}</option>}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{T('fChildType')}</label>
        <select
          style={{ ...inputStyle, opacity: subCategories.length === 0 ? 0.6 : 1 }}
          value={selectedChildId}
          onChange={(e) => onChange(e.target.value || selectedParentId)}
          disabled={!selectedParentId || subCategories.length === 0}
        >
          <option value="">{subCategories.length === 0 ? T('noChildren') : T('allChildren')}</option>
          {subCategories.map((c) => (
            <option key={c.id} value={c.id}>{hierarchy.labelOf(c)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function TemplateOutreachPage() {
  const { lang, isRTL } = useLang();
  const T = (key: keyof typeof LABELS) => LABELS[key][lang === 'ar' ? 'ar' : 'en'];

  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [bizTypes, setBizTypes] = useState<BizType[]>([]);
  const [minisiteTemplates, setMinisiteTemplates] = useState<MinisiteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Template form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Batch send state
  const [batchTypeId, setBatchTypeId] = useState('');
  const [batchTemplateId, setBatchTemplateId] = useState('');
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const hierarchy = useCategoryHierarchy(bizTypes, lang);
  const typeName = useCallback(
    (id: string) => {
      const t = hierarchy.byId.get(id) || null;
      return t ? hierarchy.labelOf(t) : id;
    },
    [hierarchy]
  );

  useEffect(() => {
    (async () => {
      await Promise.all([loadTemplates(), loadBizTypes(), loadMinisiteTemplates()]);
      setLoading(false);
    })();
  }, []);

  async function loadTemplates() {
    try {
      setAuthError(null);
      const res = await fetch('/api/jana/outreach/templates?include_inactive=1');
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthError(data.error || 'Failed to load templates. Please sign in as admin.');
        return;
      }
      setTemplates(data.templates || []);
    } catch (e: any) {
      setAuthError(e?.message || 'Error loading templates');
    }
  }

  async function loadBizTypes() {
    try {
      // `market=all`: this picker filters an audience, it is not an intake form,
      // so it must keep seeing categories another market owns.
      const res = await fetch('/api/signup/types?market=all');
      if (res.ok) {
        const data = await res.json();
        setBizTypes(Array.isArray(data) ? data : Array.isArray(data?.types) ? data.types : []);
      }
    } catch (e) {
      console.error('Failed to load business types', e);
    }
  }

  async function loadMinisiteTemplates() {
    try {
      const res = await fetch('/api/jana/minisite-templates');
      if (res.ok) {
        const data = await res.json();
        setMinisiteTemplates(Array.isArray(data) ? data : data.templates || []);
      }
    } catch (e) {
      console.error('Failed to load minisite templates', e);
    }
  }

  function openNewForm() {
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
    setPageError(null);
  }

  function openEditForm(t: OutreachTemplate) {
    setForm({
      id: t.id,
      business_type_id: t.business_type_id,
      target_scope: t.target_scope,
      template_name: t.template_name,
      message_subject_en: t.message_subject_en || '',
      message_subject_ar: t.message_subject_ar || '',
      message_body_en: t.message_body_en || '',
      message_body_ar: t.message_body_ar || '',
      features_text: (t.included_features || []).join('\n'),
      cta_type: t.cta_type,
      minisite_template_id: t.minisite_template_id || '',
      is_active: Number(t.is_active) === 1,
    });
    setShowForm(true);
    setPageError(null);
  }

  async function handleSaveTemplate() {
    if (!form.template_name.trim() || !form.business_type_id) {
      setPageError(lang === 'ar' ? 'الاسم والفئة مطلوبان.' : 'Template name and business category are required.');
      return;
    }
    setSaving(true);
    setPageError(null);
    try {
      const payload = {
        id: form.id || undefined,
        business_type_id: form.business_type_id,
        target_scope: form.target_scope,
        template_name: form.template_name,
        message_subject_en: form.message_subject_en,
        message_subject_ar: form.message_subject_ar,
        message_body_en: form.message_body_en,
        message_body_ar: form.message_body_ar,
        included_features: form.features_text,
        cta_type: form.cta_type,
        minisite_template_id: form.minisite_template_id || null,
        is_active: form.is_active ? 1 : 0,
      };
      const res = await fetch('/api/jana/outreach/templates', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPageError(data.error || 'Failed to save template');
        return;
      }
      setShowForm(false);
      setNotice(lang === 'ar' ? 'تم حفظ القالب بنجاح.' : 'Template saved successfully.');
      await loadTemplates();
    } catch (e: any) {
      setPageError(e?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(t: OutreachTemplate) {
    try {
      // Active -> soft-delete (is_active = 0). Inactive -> re-activate via PUT.
      const url = Number(t.is_active) === 1
        ? `/api/jana/outreach/templates?id=${encodeURIComponent(t.id)}`
        : '/api/jana/outreach/templates';
      const res = await fetch(url, {
        method: Number(t.is_active) === 1 ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: Number(t.is_active) === 1 ? undefined : JSON.stringify({ id: t.id, is_active: 1 }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPageError(data.error || 'Failed to update template status');
        return;
      }
      await loadTemplates();
    } catch (e: any) {
      setPageError(e?.message || 'Failed to update template status');
    }
  }

  /**
   * Templates usable for the selected category. A child category may also be sent
   * with its parent's template (inherited copy), which is what batch-send falls back
   * to when the child has no template of its own.
   */
  const templatesForBatch = useMemo(() => {
    if (!batchTypeId) return [] as { template: OutreachTemplate; inheritedFrom: string | null }[];
    const active = templates.filter((t) => Number(t.is_active) === 1);
    const own = active
      .filter((t) => t.business_type_id === batchTypeId)
      .map((template) => ({ template, inheritedFrom: null as string | null }));
    const selected = hierarchy.byId.get(batchTypeId) || null;
    const parentId = selected && !hierarchy.isParent(selected) ? selected.parent_id || null : null;
    if (!parentId) return own;
    const inherited = active
      .filter((t) => t.business_type_id === parentId)
      .map((template) => ({ template, inheritedFrom: parentId }));
    return [...own, ...inherited];
  }, [templates, batchTypeId, hierarchy]);

  async function handleDryRun() {
    if (!batchTypeId) return;
    setBatchBusy(true);
    setPageError(null);
    setSendResult(null);
    try {
      const res = await fetch('/api/jana/outreach/batch-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type_id: batchTypeId,
          template_id: batchTemplateId || undefined,
          dry_run: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPageError(data.error || 'Dry run failed');
        setDryRun(null);
        return;
      }
      setDryRun(data);
    } catch (e: any) {
      setPageError(e?.message || 'Dry run failed');
    } finally {
      setBatchBusy(false);
    }
  }

  async function handleSend() {
    if (!batchTypeId) return;
    if (!window.confirm(T('bsConfirm'))) return;
    setBatchBusy(true);
    setPageError(null);
    try {
      const res = await fetch('/api/jana/outreach/batch-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type_id: batchTypeId,
          template_id: batchTemplateId || undefined,
          dry_run: false,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPageError(data.error || 'Batch send failed');
        return;
      }
      setSendResult(data);
      setDryRun(null);
      await loadTemplates();
    } catch (e: any) {
      setPageError(e?.message || 'Batch send failed');
    } finally {
      setBatchBusy(false);
    }
  }

  const activeCount = templates.filter((t) => Number(t.is_active) === 1).length;
  const coveredTypes = new Set(templates.map((t) => t.business_type_id)).size;
  const totalSends = templates.reduce((sum, t) => sum + Number(t.times_used || 0), 0);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.8rem' }}>✉️</span>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>{T('title')}</h1>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: '#64748b' }}>{T('subtitle')}</p>
        </div>
        <button
          onClick={openNewForm}
          style={{
            padding: '0.6rem 1.15rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #D4AF37, #b8962e)',
            color: '#1a1a2e',
            border: 0,
            fontWeight: 900,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 2px 8px rgba(212,175,55,0.35)',
          }}
        >
          <i className="fas fa-plus" /> {T('newTemplate')}
        </button>
      </div>

      {/* Level 2 cross-link: curated packages are tracked on their own board. */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#475569' }}>
        <i className="fas fa-clipboard-check" style={{ marginInlineEnd: '0.5rem', color: '#6366f1' }} />
        {T('level2Tip')}{' '}
        <Link href="/jana/approval-packages" style={{ color: '#1d4ed8', fontWeight: 900 }}>
          {T('level2Link')}
        </Link>
      </div>

      {authError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.25rem', fontWeight: 700, fontSize: '0.85rem' }}>
          <i className="fas fa-lock" style={{ marginInlineEnd: '0.5rem' }} />{authError}
        </div>
      )}
      {pageError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.25rem', fontWeight: 700, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <span><i className="fas fa-triangle-exclamation" style={{ marginInlineEnd: '0.5rem' }} />{pageError}</span>
          <button onClick={() => setPageError(null)} style={{ background: 'transparent', border: 0, color: '#b91c1c', cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>
      )}
      {notice && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.25rem', fontWeight: 700, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <span><i className="fas fa-circle-check" style={{ marginInlineEnd: '0.5rem' }} />{notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'transparent', border: 0, color: '#15803d', cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>
      )}

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: 'fa-envelope-open-text', color: '#6366f1', value: templates.length, label: T('statTemplates') },
          { icon: 'fa-circle-check', color: '#10b981', value: activeCount, label: T('statActive') },
          { icon: 'fa-folder-tree', color: '#f59e0b', value: coveredTypes, label: T('statTypes') },
          { icon: 'fa-paper-plane', color: '#0ea5e9', value: totalSends, label: T('statSends') },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${s.color}1a`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', flexShrink: 0 }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TEMPLATES TABLE */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-layer-group" style={{ color: '#6366f1' }} /> {T('templates')}
        </h2>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{T('loading')}</div>
        ) : templates.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{T('noTemplates')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {[T('colType'), T('colName'), T('colScope'), T('colCta'), T('colStatus'), T('colLastUsed'), T('colActions')].map((h, i) => (
                    <th key={i} style={{ textAlign: isRTL ? 'right' : 'left', padding: '0.6rem 0.75rem', color: '#64748b', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      <i className="fas fa-folder" style={{ color: '#f59e0b', marginInlineEnd: '0.4rem' }} />
                      {hierarchy.pathOf(t.business_type_id)}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#334155' }}>
                      <div style={{ fontWeight: 800 }}>{t.template_name}</div>
                      {t.minisite_template_name && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                          <i className="fas fa-store" style={{ marginInlineEnd: '0.3rem' }} />{t.minisite_template_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {t.target_scope === 'parent_only' ? T('scopeParentOnly') : t.target_scope === 'children_only' ? T('scopeChildrenOnly') : T('scopeBoth')}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {t.cta_type === 'claim_profile' ? T('ctaClaim') : t.cta_type === 'preview_minisite' ? T('ctaPreview') : T('ctaRegister')}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        background: Number(t.is_active) === 1 ? '#dcfce7' : '#f1f5f9',
                        color: Number(t.is_active) === 1 ? '#15803d' : '#94a3b8',
                      }}>
                        {Number(t.is_active) === 1 ? T('statActive') : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {t.times_used > 0 ? (
                        <>{t.times_used}× {t.last_used_at ? `· ${new Date(t.last_used_at).toLocaleDateString()}` : ''}</>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <button onClick={() => openEditForm(t)} title={T('edit')} style={{ background: '#eff6ff', color: '#1d4ed8', border: 0, borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem', marginInlineEnd: '0.35rem' }}>
                        <i className="fas fa-pen" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(t)}
                        title={Number(t.is_active) === 1 ? T('deactivate') : T('activate')}
                        style={{
                          background: Number(t.is_active) === 1 ? '#fef2f2' : '#f0fdf4',
                          color: Number(t.is_active) === 1 ? '#b91c1c' : '#15803d',
                          border: 0, borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem',
                        }}
                      >
                        <i className={`fas ${Number(t.is_active) === 1 ? 'fa-ban' : 'fa-rotate-right'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BATCH SEND PANEL */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '1.25rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-paper-plane" style={{ color: '#0ea5e9' }} /> {T('batchSend')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <CategoryHierarchyPicker
            value={batchTypeId}
            onChange={(id) => { setBatchTypeId(id); setBatchTemplateId(''); setDryRun(null); setSendResult(null); }}
            hierarchy={hierarchy}
            T={T}
            label={T('bsType')}
          />
          <div>
            <label style={labelStyle}>{T('bsTemplate')}</label>
            <select
              value={batchTemplateId}
              onChange={(e) => { setBatchTemplateId(e.target.value); setDryRun(null); }}
              style={inputStyle}
              disabled={!batchTypeId}
            >
              <option value="">{T('bsAuto')}</option>
              {templatesForBatch.map(({ template, inheritedFrom }) => (
                <option key={template.id} value={template.id}>
                  {template.template_name}{inheritedFrom ? ` · ${T('inheritedFrom')} ${typeName(inheritedFrom)}` : ''}
                </option>
              ))}
            </select>
            {batchTypeId && templatesForBatch.length === 0 && (
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#b45309' }}>
                {T('noTemplates')}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={handleDryRun}
              disabled={!batchTypeId || batchBusy}
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                borderRadius: '12px',
                background: '#f1f5f9',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                fontWeight: 900,
                fontSize: '0.8rem',
                cursor: !batchTypeId || batchBusy ? 'not-allowed' : 'pointer',
                opacity: !batchTypeId || batchBusy ? 0.6 : 1,
              }}
            >
              <i className="fas fa-magnifying-glass" style={{ marginInlineEnd: '0.4rem' }} />{T('bsDryRun')}
            </button>
            <button
              onClick={handleSend}
              disabled={!batchTypeId || batchBusy}
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 0,
                fontWeight: 900,
                fontSize: '0.8rem',
                cursor: !batchTypeId || batchBusy ? 'not-allowed' : 'pointer',
                opacity: !batchTypeId || batchBusy ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
              }}
            >
              <i className="fas fa-paper-plane" style={{ marginInlineEnd: '0.4rem' }} />{batchBusy ? T('bsSending') : T('bsSend')}
            </button>
          </div>
        </div>

        {/* DRY RUN RESULT */}
        {dryRun && (
          <div style={{ marginTop: '1.25rem', border: '1px dashed #cbd5e1', borderRadius: '14px', padding: '1rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
              <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>
                {T('bsEligible')}: <span style={{ color: '#10b981' }}>{dryRun.counts.eligible}</span>
              </div>
              <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>
                {T('bsSkipped')}: <span style={{ color: '#f59e0b' }}>{dryRun.counts.skipped_already_outreached}</span>
              </div>
              {dryRun.template?.inherited_from && (
                <div style={{ fontWeight: 800, color: '#b45309', fontSize: '0.78rem', alignSelf: 'center' }}>
                  <i className="fas fa-sitemap" style={{ marginInlineEnd: '0.35rem' }} />
                  {dryRun.template.name} {T('inheritedFrom')} {hierarchy.pathOf(dryRun.template.inherited_from.id)}
                </div>
              )}
            </div>
            {dryRun.preview && (
              <div style={{ marginBottom: '0.9rem' }}>
                <div style={labelStyle}>{T('bsPreviewTitle')} — {dryRun.preview.business_name}</div>
                <pre style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', fontSize: '0.78rem', whiteSpace: 'pre-wrap', color: '#334155', maxHeight: '220px', overflowY: 'auto', margin: 0, direction: 'ltr', textAlign: 'left' }}>
                  {dryRun.preview.body_en}
                  {dryRun.preview.body_ar ? `\n\n———\n\n${dryRun.preview.body_ar}` : ''}
                </pre>
              </div>
            )}
            {dryRun.audience.length > 0 && (
              <div>
                <div style={labelStyle}>{T('bsAudience')} ({dryRun.audience.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {dryRun.audience.map((a) => (
                    <span key={a.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '0.25rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                      {a.name} <span style={{ color: '#94a3b8' }}>· {a.type_name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEND RESULT */}
        {sendResult && (
          <div style={{ marginTop: '1.25rem', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '1rem', background: '#f0fdf4' }}>
            <div style={{ fontWeight: 900, color: '#15803d', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              <i className="fas fa-circle-check" style={{ marginInlineEnd: '0.4rem' }} />{T('bsResult')}
            </div>
            {sendResult.message && (
              <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '0.5rem', fontWeight: 700 }}>{sendResult.message}</div>
            )}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{T('bsSent')}: <span style={{ color: '#15803d' }}>{sendResult.counts.sent}</span></div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{T('bsFailed')}: <span style={{ color: '#b91c1c' }}>{sendResult.counts.failed}</span></div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{T('bsSkipped')}: <span style={{ color: '#f59e0b' }}>{sendResult.counts.skipped_already_outreached}</span></div>
            </div>
            {sendResult.campaign_id && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#64748b' }}>
                <i className="fas fa-hashtag" style={{ marginInlineEnd: '0.3rem' }} />campaign: {sendResult.campaign_id}
              </div>
            )}
            {sendResult.errors && sendResult.errors.length > 0 && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: '#b91c1c' }}>
                {sendResult.errors.map((e, i) => (
                  <div key={i}>• {e.business_id}: {e.error}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TEMPLATE FORM MODAL */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', zIndex: 300 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 'min(720px, 94vw)', maxHeight: '88vh', overflowY: 'auto',
            background: '#fff', borderRadius: '18px', boxShadow: '0 24px 64px rgba(15,23,42,0.35)', zIndex: 301, padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                {form.id ? T('formEdit') : T('formNew')}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 0, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 900, color: '#475569' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
              <div>
                <label style={labelStyle}>{T('fName')} *</label>
                <input style={inputStyle} value={form.template_name} onChange={(e) => setForm({ ...form, template_name: e.target.value })} />
              </div>
              <CategoryHierarchyPicker
                value={form.business_type_id}
                onChange={(id) => setForm({ ...form, business_type_id: id })}
                hierarchy={hierarchy}
                T={T}
                label={`${T('fType')} *`}
              />
              <div>
                <label style={labelStyle}>{T('fScope')}</label>
                <select style={inputStyle} value={form.target_scope} onChange={(e) => setForm({ ...form, target_scope: e.target.value as OutreachTemplate['target_scope'] })}>
                  <option value="both">{T('scopeBoth')}</option>
                  <option value="parent_only">{T('scopeParentOnly')}</option>
                  <option value="children_only">{T('scopeChildrenOnly')}</option>
                </select>
                {form.business_type_id && hierarchy.childrenOf(form.business_type_id).length === 0 && (
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>{T('scopeSelfOnly')}</p>
                )}
              </div>
              <div>
                <label style={labelStyle}>{T('fCta')}</label>
                <select style={inputStyle} value={form.cta_type} onChange={(e) => setForm({ ...form, cta_type: e.target.value as OutreachTemplate['cta_type'] })}>
                  <option value="claim_profile">{T('ctaClaim')}</option>
                  <option value="preview_minisite">{T('ctaPreview')}</option>
                  <option value="register">{T('ctaRegister')}</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>{T('fSubjectEn')}</label>
                <input style={inputStyle} value={form.message_subject_en} onChange={(e) => setForm({ ...form, message_subject_en: e.target.value })} dir="ltr" />
              </div>
              <div>
                <label style={labelStyle}>{T('fSubjectAr')}</label>
                <input style={inputStyle} value={form.message_subject_ar} onChange={(e) => setForm({ ...form, message_subject_ar: e.target.value })} dir="rtl" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{T('fBodyEn')}</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.message_body_en}
                  onChange={(e) => setForm({ ...form, message_body_en: e.target.value })}
                  dir="ltr"
                  placeholder={'Hello {name}!\nYour free minisite as {childType} is ready:\n{featureList}\nClaim it now: {claimUrl}\nPreview: {minisiteUrl}'}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{T('fBodyAr')}</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.message_body_ar}
                  onChange={(e) => setForm({ ...form, message_body_ar: e.target.value })}
                  dir="rtl"
                  placeholder={'أهلاً {name}!\nموقعك المجاني كـ{childType} جاهز:\n{featureList}\nاستلمه الآن: {claimUrl}'}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{T('fFeatures')}</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.features_text}
                  onChange={(e) => setForm({ ...form, features_text: e.target.value })}
                  placeholder={'Free verified minisite\n0% commission direct booking\nMobile dashboard'}
                />
              </div>
              <div>
                <label style={labelStyle}>{T('fMinisiteTemplate')}</label>
                <select style={inputStyle} value={form.minisite_template_id} onChange={(e) => setForm({ ...form, minisite_template_id: e.target.value })}>
                  <option value="">{T('selectPlaceholder')}</option>
                  {minisiteTemplates.map((mt) => (
                    <option key={mt.id} value={mt.id}>{mt.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.2rem' }}>
                <input
                  type="checkbox"
                  id="tpl-active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#D4AF37' }}
                />
                <label htmlFor="tpl-active" style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>{T('fActive')}</label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem' }}>
              <button
                onClick={() => setShowForm(false)}
                style={{ padding: '0.55rem 1.1rem', borderRadius: '10px', background: '#f1f5f9', color: '#475569', border: 0, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                {T('cancel')}
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving}
                style={{ padding: '0.55rem 1.3rem', borderRadius: '10px', background: 'linear-gradient(135deg, #D4AF37, #b8962e)', color: '#1a1a2e', border: 0, fontWeight: 900, fontSize: '0.8rem', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? T('saving') : T('save')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
