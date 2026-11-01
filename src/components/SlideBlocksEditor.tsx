'use client';

import React, { useState } from 'react';
import {
  SlideBlock,
  BlockKind,
  BlockZone,
  BlockLayout,
  BLOCK_KIND_LABEL,
  BLOCK_LAYOUT_LABEL,
  BLOCK_ZONE_LABEL,
  defaultLayoutForKind,
} from '@/lib/slide-blocks';
import { FIELDS_PER_GROUP_PAGE, groupPageCount } from '@/lib/field-groups';
import {
  LISTING_KINDS,
  LISTING_KIND_SPEC,
  type ListingKind,
} from '@/lib/listing-kind';

/**
 * SlideBlocksEditor
 * -----------------
 * Admin-only panel for placing "info blocks" on a hero slide. Supports
 * adding caption / fieldLabels / fieldValues / fieldsValues blocks,
 * choosing a zone from a 9-grid, and picking a preset layout. Approved
 * toggle is admin-controlled — vendor writes never reach this UI.
 *
 * Field entry: when the caller hands in the business's own sections, the admin
 * picks a section and ticks the questions it asks — each one shown with the
 * vendor's stored answer and whatever visibility the admin already set on it, so
 * a block is never approved blind. Without that payload the panel falls back to
 * the comma-separated key list, which still reads any block saved earlier.
 *
 * Design rule: hidden fields (field_visibility='hide_field') and hidden
 * values ('hide_value') are respected by the renderer, not by this editor.
 * The admin sees what data exists and what will print; the body renderer
 * decides what the visitor gets.
 */

/** One question a section asks, with the answer the minisite would print. */
export interface SlideBlockFieldOption {
  name: string;
  label: string;
  labelAr?: string | null;
  /** Stored answer, stringified for display. Empty means the vendor never filled it. */
  value?: string;
  /** The admin's current visibility for this field in this section. */
  visibility?: 'show' | 'hide_value' | 'hide_field';
  /** The category this question belongs to inside the section (`field_groups.name`). */
  groupKey?: string | null;
}

/** One category the admin named inside a section. */
export interface SlideBlockGroupOption {
  name: string;
  label: string;
  labelAr?: string | null;
  sort_order?: number;
}

/** A section the admin can draw fields from. */
export interface SlideBlockSectionOption {
  id: string;
  name: string;
  fields: SlideBlockFieldOption[];
  /** Absent means the group layer is not applied yet — the picker simply offers no categories. */
  groups?: SlideBlockGroupOption[];
}

interface Props {
  blocks: SlideBlock[];
  onChange: (blocks: SlideBlock[]) => void;
  /** true when the page is Arabic-first (uses BLOCK_*_LABEL.ar). */
  ar?: boolean;
  /**
   * The selected business's sections with their fields and stored values.
   * Absent, the editor keeps the free-text key list.
   */
  sections?: SlideBlockSectionOption[];
  /** Section a newly added block should start in — usually the tab being edited. */
  defaultSectionId?: string;
  /**
   * The minisite's detected specialization. When present, the matching
   * "Quick add" preset is highlighted as the recommended one; the other
   * kinds remain available for admin flexibility (a compound that today
   * sells can add a payment-plan slide for a future rental wing). Absent
   * means no recommendation and all presets are offered equally.
   */
  listingKind?: ListingKind | null;
}

const ZONES: BlockZone[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];
const KINDS: BlockKind[] = ['caption', 'fieldLabels', 'fieldValues', 'fieldsValues'];
const LAYOUTS: BlockLayout[] = ['pill', 'minimal', 'card', 'chip-row', 'glass', 'spec-sheet'];

const GOLD = '#D4AF37';
const DARK = '#0f172a';
const MUTED = '#94a3b8';

function newId() {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function SlideBlocksEditor({ blocks, onChange, ar = true, sections, defaultSectionId, listingKind }: Props) {
  const label = (obj: { ar: string; en: string }) => (ar ? obj.ar : obj.en);

  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const safeSections = Array.isArray(sections) ? sections.filter(s => s && s.id) : [];
  const [editingId, setEditingId] = useState<string | null>(null);

  const update = (next: SlideBlock[]) => onChange(next);

  const addBlock = (kind: BlockKind) => {
    const b: SlideBlock = {
      id: newId(),
      kind,
      zone: 'bottom-center',
      layout: defaultLayoutForKind(kind),
      fieldKeys: [],
      // A block born while the admin edits one tab starts in that tab's section,
      // so the first pick is already the right section instead of a guess.
      ...(kind !== 'caption' && defaultSectionId ? { sectionId: defaultSectionId } : {}),
      text: kind === 'caption' ? '' : undefined,
      approved: false, // admin must explicitly tick — safe default
    };
    update([...safeBlocks, b]);
    setEditingId(b.id);
  };

  /**
   * Adds a preset spec-sheet block seeded from the kind's
   * `recommendedSlideFields`. The preset's key list is intersected with what
   * the chosen section actually asks (when a section is picked) so the block
   * never claims a field the business cannot answer. When the intersection is
   * empty, we keep the raw preset so the admin can widen the scope to
   * "All sections" and the axes-supplied keys (developer.*, unit.*, etc.)
   * resolve through the fallback.
   */
  const addKindPreset = (preset: ListingKind) => {
    const spec = LISTING_KIND_SPEC[preset];
    if (!spec) return;
    const wanted = spec.recommendedSlideFields.filter(Boolean);
    const sec = defaultSectionId
      ? safeSections.find(s => s.id === defaultSectionId)
      : undefined;
    const inScope = sec?.fields?.length
      ? wanted.filter(k => sec.fields.some(f => f.name === k))
      : [];
    const finalKeys = (inScope.length ? inScope : wanted).slice(0, MAX_KEYS);
    const b: SlideBlock = {
      id: newId(),
      kind: 'fieldsValues',
      zone: 'bottom-center',
      layout: 'spec-sheet',
      fieldKeys: finalKeys,
      ...(defaultSectionId ? { sectionId: defaultSectionId } : {}),
      approved: false,
    };
    update([...safeBlocks, b]);
    setEditingId(b.id);
  };

  const patchBlock = (id: string, patch: Partial<SlideBlock>) => {
    update(safeBlocks.map(b => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeBlock = (id: string) => update(safeBlocks.filter(b => b.id !== id));

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = safeBlocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= safeBlocks.length) return;
    const next = [...safeBlocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    update(next);
  };

  return (
    <div style={{ background: DARK, borderRadius: 12, padding: '1rem 1.15rem', border: `1px solid ${GOLD}33` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ color: GOLD, fontWeight: 900, fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
          {ar ? 'شرائح المعلومات على الشريحة' : 'Slide Info Blocks'}
        </div>
        <div style={{ color: MUTED, fontSize: '0.65rem' }}>
          {ar ? 'المسؤول هو من يفعّل العرض' : 'Admin must approve each block'}
        </div>
      </div>

      {/* Add-row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
        {KINDS.map(k => (
          <button
            key={k}
            type="button"
            onClick={() => addBlock(k)}
            disabled={safeBlocks.length >= 6}
            style={{
              background: 'rgba(212,175,55,0.14)',
              border: `1px solid ${GOLD}55`,
              color: '#f8fafc',
              padding: '0.35rem 0.75rem',
              borderRadius: 8,
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              cursor: safeBlocks.length >= 6 ? 'not-allowed' : 'pointer',
              opacity: safeBlocks.length >= 6 ? 0.4 : 1,
            }}
          >
            + {label(BLOCK_KIND_LABEL[k])}
          </button>
        ))}
      </div>

      {/* Quick add by kind — the Egyptian-market presets. Sale defaults to
          "price + down payment + installment years + handover" (the four
          questions every Cairo visitor asks first), rent_month to
          "price + deposit + available from + furnished", rent_night to
          "price + min stay + breakfast + max occupancy". All three presets
          are always offered so a compound mixing sale and short-stay units
          can build one slide for each — the recommended one is only tinted
          with the kind's accent. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <span style={{ color: MUTED, fontSize: '0.62rem', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', marginRight: '0.35rem' }}>
          {ar ? 'اضافة سريعة بالتخصص' : 'Quick add by kind'}
        </span>
        {LISTING_KINDS.map(k => {
          const spec = LISTING_KIND_SPEC[k];
          const recommended = listingKind === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => addKindPreset(k)}
              disabled={safeBlocks.length >= 6}
              title={
                ar
                  ? `${spec.badge.ar} — ${spec.recommendedSlideFields.slice(0, 4).join('، ')}`
                  : `${spec.badge.en} — ${spec.recommendedSlideFields.slice(0, 4).join(', ')}`
              }
              style={{
                background: recommended ? `${spec.accent}26` : 'rgba(15,23,42,0.6)',
                border: `1px solid ${recommended ? spec.accent : 'rgba(255,255,255,0.12)'}`,
                color: recommended ? spec.accent : '#e2e8f0',
                padding: '0.32rem 0.7rem',
                borderRadius: 999,
                fontSize: '0.62rem',
                fontWeight: 900,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                cursor: safeBlocks.length >= 6 ? 'not-allowed' : 'pointer',
                opacity: safeBlocks.length >= 6 ? 0.4 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <i className="fas fa-bolt" aria-hidden="true" style={{ fontSize: '0.6rem' }} />
              {ar ? spec.badge.ar : spec.badge.en}
              {recommended && (
                <span style={{ opacity: 0.75, fontWeight: 800, textTransform: 'none', letterSpacing: 'normal' }}>
                  {ar ? '(موصى به)' : '(recommended)'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {safeBlocks.length === 0 && (
        <div style={{ color: MUTED, fontSize: '0.72rem', fontStyle: 'italic' }}>
          {ar ? 'لا توجد كتل — استخدم الأزرار بالأعلى لإضافة.' : 'No blocks yet — use the buttons above to add one.'}
        </div>
      )}

      {/* Block rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {safeBlocks.map((b, i) => {
          const isOpen = editingId === b.id;
          return (
            <div key={b.id} style={{
              background: 'rgba(15,23,42,0.6)',
              border: `1px solid ${b.approved ? `${GOLD}88` : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10,
              padding: '0.6rem 0.75rem',
            }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#f8fafc', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={b.approved}
                    onChange={(e) => patchBlock(b.id, { approved: e.target.checked })}
                    style={{ accentColor: GOLD }}
                  />
                  {ar ? 'معتمد' : 'Approved'}
                </label>
                <div style={{ color: MUTED, fontSize: '0.62rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {label(BLOCK_KIND_LABEL[b.kind])} · {label(BLOCK_ZONE_LABEL[b.zone])} · {label(BLOCK_LAYOUT_LABEL[b.layout])}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                  <IconBtn title={ar ? 'تحريك لأعلى' : 'Move up'} disabled={i === 0} onClick={() => moveBlock(b.id, -1)}>↑</IconBtn>
                  <IconBtn title={ar ? 'تحريك لأسفل' : 'Move down'} disabled={i === safeBlocks.length - 1} onClick={() => moveBlock(b.id, 1)}>↓</IconBtn>
                  <IconBtn title={ar ? 'تحرير' : 'Edit'} onClick={() => setEditingId(isOpen ? null : b.id)} active={isOpen}>✎</IconBtn>
                  <IconBtn title={ar ? 'حذف' : 'Delete'} onClick={() => removeBlock(b.id)} danger>✕</IconBtn>
                </div>
              </div>

              {/* Expanded editor */}
              {isOpen && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                    <Field label={ar ? 'النوع' : 'Kind'}>
                      <select value={b.kind} onChange={e => {
                        const kind = e.target.value as BlockKind;
                        patchBlock(b.id, {
                          kind,
                          layout: defaultLayoutForKind(kind),
                          fieldKeys: kind === 'caption' ? [] : (b.fieldKeys || []),
                          text: kind === 'caption' ? (b.text || '') : undefined,
                        });
                      }} style={selectStyle}>
                        {KINDS.map(k => <option key={k} value={k}>{label(BLOCK_KIND_LABEL[k])}</option>)}
                      </select>
                    </Field>

                    <Field label={ar ? 'التخطيط' : 'Layout'}>
                      <select value={b.layout} onChange={e => patchBlock(b.id, { layout: e.target.value as BlockLayout })} style={selectStyle}>
                        {LAYOUTS.map(l => <option key={l} value={l}>{label(BLOCK_LAYOUT_LABEL[l])}</option>)}
                      </select>
                    </Field>
                  </div>

                  {/* 9-zone picker */}
                  <Field label={ar ? 'الموضع على الشريحة' : 'Position on slide'}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', maxWidth: 300 }}>
                      {ZONES.map(z => {
                        const active = b.zone === z;
                        return (
                          <button
                            key={z}
                            type="button"
                            onClick={() => patchBlock(b.id, { zone: z })}
                            title={label(BLOCK_ZONE_LABEL[z])}
                            style={{
                              aspectRatio: '1.4 / 1',
                              background: active ? `${GOLD}33` : 'rgba(15,23,42,0.6)',
                              border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`,
                              color: active ? GOLD : MUTED,
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: '0.6rem',
                              fontWeight: 800,
                            }}
                          >
                            {label(BLOCK_ZONE_LABEL[z])}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  {/* Caption text OR the section + field picker */}
                  {b.kind === 'caption' ? (
                    <Field label={ar ? 'نص الكابشن (اختياري؛ يُستخدم كابشن الشريحة إن تُرك فارغًا)' : 'Caption text (optional; slide caption is used when empty)'}>
                      <textarea
                        value={b.text || ''}
                        onChange={e => patchBlock(b.id, { text: e.target.value.slice(0, 240) })}
                        maxLength={240}
                        rows={2}
                        style={inputStyle}
                        placeholder={ar ? 'نصيحة، وسم، أو جملة قصيرة...' : 'A short kicker or tagline...'}
                      />
                    </Field>
                  ) : (
                    <FieldPicker
                      block={b}
                      sections={safeSections}
                      ar={ar}
                      onPatch={patch => patchBlock(b.id, patch)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '0.75rem', color: MUTED, fontSize: '0.62rem', fontStyle: 'italic' }}>
        {ar
          ? 'ملاحظة: السلايدر وجسم الصفحة سطحان مستقلان. الحقل الواحد قد يظهر على الاثنين، أو على احدهما، أو يُخفى، حسب لوحة وجهات الحقول.'
          : 'Note: the carousel and the body are independent surfaces. A field may appear on both, on one, or on neither, controlled from the field destinations panel.'}
      </div>
    </div>
  );
}

// ─── small primitives ────────────────────────────────────────────────────

/** The sanitizer's own cap, so the picker can never offer a pick that gets dropped. */
const MAX_KEYS = 8;

/**
 * Section + field chooser.
 *
 * With the business's sections in hand the admin picks a section and ticks the
 * questions it asks; each chip shows the stored answer and whatever visibility
 * the admin already set on that field, so approving a "values" block is never a
 * guess about what will print. Without them — or on a block saved before the
 * picker existed — the key list stays editable as plain text, because a block
 * may legitimately name a field another section asked.
 */
function FieldPicker({
  block,
  sections,
  ar,
  onPatch,
}: {
  block: SlideBlock;
  sections: SlideBlockSectionOption[];
  ar: boolean;
  onPatch: (patch: Partial<SlideBlock>) => void;
}) {
  const picked = Array.isArray(block.fieldKeys) ? block.fieldKeys : [];
  const section = block.sectionId ? sections.find(s => s.id === block.sectionId) : undefined;
  const knownNames = new Set((section?.fields || []).map(f => f.name));
  // Keys the chosen section never asked stay removable chips, never lost.
  const extraKeys = picked.filter(k => !knownNames.has(k));

  // The admin's own categories for the chosen section. A group is the whole point
  // of the picker: one choice carries every question in the category, in the
  // order the definitions set, under the heading the category already has in both
  // languages — instead of retyping eight keys on every slide of the walk.
  const groups = Array.isArray(section?.groups) ? (section as any).groups as SlideBlockGroupOption[] : [];
  const chosenGroup = block.groupKey ? groups.find(g => g.name === block.groupKey) : undefined;
  const groupFields = block.groupKey
    ? (section?.fields || []).filter(f => (f.groupKey || '') === block.groupKey)
    : [];
  const groupHeading = (group: SlideBlockGroupOption) => (ar && group.labelAr ? group.labelAr : group.label) || group.name;

  const toggle = (name: string) => {
    if (picked.includes(name)) onPatch({ fieldKeys: picked.filter(k => k !== name) });
    else if (picked.length < MAX_KEYS) onPatch({ fieldKeys: [...picked, name] });
  };

  const drop = (name: string) => onPatch({ fieldKeys: picked.filter(k => k !== name) });

  return (
    <>
      {sections.length > 0 && (
        <Field
          label={ar ? 'القسم' : 'Section'}
          hint={
            ar
              ? 'القيم تُقرأ من إجابات هذا القسم وحده؛ التكرار مع جسم الصفحة يحدده لوحة وجهات الحقول'
              : 'Values are read from this section only; whether the same field also appears in the body grid is decided by the field destinations panel'
          }
        >
          <select
            value={block.sectionId || ''}
            onChange={e => onPatch({ sectionId: e.target.value || undefined })}
            style={selectStyle}
          >
            <option value="">{ar ? 'كل الأقسام (بدون تحديد قسم)' : 'All sections (unscoped)'}</option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
      )}

      {section && (groups.length > 0 || Boolean(block.groupKey)) && (
        <Field
          label={ar ? 'التصنيف' : 'Category'}
          hint={
            chosenGroup
              ? (
                groupFields.length === 0
                  ? (ar
                    ? 'لا حقول تحمل هذا التصنيف بعد — عيّن الحقول إليه في نموذج النشاط.'
                    : 'No field carries this category yet — assign its fields in the business form.')
                  : groupPageCount(groupFields.length, FIELDS_PER_GROUP_PAGE) > 1
                    ? (ar
                      ? `${groupFields.length} حقل — يُعرض على ${groupPageCount(groupFields.length, FIELDS_PER_GROUP_PAGE)} شرائح متتالية بنفس الاسم`
                      : `${groupFields.length} fields — shown across ${groupPageCount(groupFields.length, FIELDS_PER_GROUP_PAGE)} consecutive slides under the same heading`)
                    : (ar
                      ? `${groupFields.length} حقل تُعرض كلها مع عنوان التصنيف`
                      : `all ${groupFields.length} fields are shown, with the category name as the heading`)
              )
              : (ar
                ? 'بدون تصنيف: تختار الحقول يدويًا كما كان الحال دائمًا'
                : 'No category: pick the fields by hand, exactly as before')
          }
        >
          <select
            value={block.groupKey || ''}
            onChange={e => {
              const name = e.target.value;
              // Choosing a category clears a hand-picked subset, because an empty
              // list is what tells the renderer "project the whole category".
              // Going back to "no category" leaves the existing picks alone.
              onPatch(name ? { groupKey: name, fieldKeys: [], groupPage: undefined } : { groupKey: undefined, groupPage: undefined });
            }}
            style={selectStyle}
          >
            <option value="">{ar ? 'بدون تصنيف (اختيار يدوي)' : 'No category (hand-pick fields)'}</option>
            {groups.map(g => (
              <option key={g.name} value={g.name}>
                {groupHeading(g)}{` · ${(section.fields || []).filter(f => (f.groupKey || '') === g.name).length}`}
              </option>
            ))}
            {/* A block can name a category its section no longer offers — the
                definitions moved or the group was deleted. It stays selectable and
                removable here rather than vanishing from the editor. */}
            {!chosenGroup && block.groupKey && (
              <option value={block.groupKey}>{`${block.groupKey} · ${ar ? 'تصنيف لم يعد موجودًا' : 'category no longer defined'}`}</option>
            )}
          </select>
        </Field>
      )}

      {/* What the category actually projects, with the vendor's stored answers, so
          approving the block is never a guess about what the slide will print. */}
      {chosenGroup && groupFields.length > 0 && (
        <Field label={ar ? 'سيُعرض على الشريحة' : 'This category will show'}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {groupFields.map(f => (
              <span
                key={f.name}
                title={f.value ? `${f.name} = ${f.value}` : f.name}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '0.28rem 0.55rem',
                  borderRadius: 999,
                  background: f.visibility === 'hide_field' ? 'rgba(239,68,68,0.12)' : 'rgba(212,175,55,0.10)',
                  border: `1px solid ${f.visibility === 'hide_field' ? 'rgba(239,68,68,0.4)' : `${GOLD}44`}`,
                  color: '#e2e8f0',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                }}
              >
                {(ar && f.labelAr ? f.labelAr : f.label) || f.name}
                <span style={{ opacity: 0.7, fontWeight: 700 }}>
                  {f.visibility === 'hide_value' ? '—' : f.visibility === 'hide_field' ? (ar ? 'مخفي' : 'hidden') : (f.value || (ar ? 'بدون إجابة' : 'empty'))}
                </span>
              </span>
            ))}
          </div>
          {picked.length > 0 && (
            <button
              type="button"
              onClick={() => onPatch({ fieldKeys: [] })}
              style={{
                marginTop: '0.4rem',
                background: 'rgba(212,175,55,0.14)',
                border: `1px solid ${GOLD}55`,
                color: '#f8fafc',
                padding: '0.3rem 0.6rem',
                borderRadius: 8,
                fontSize: '0.62rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {ar ? 'اعرض التصنيف كاملًا (ألغِ الاختيار الجزئي)' : 'Show the whole category (clear the partial pick)'}
            </button>
          )}
        </Field>
      )}

      {/* A category bigger than one block is a walk, not a truncation: page 2 lives
          on the next slide under the same heading, and nothing is dropped. */}
      {chosenGroup && groupFields.length > FIELDS_PER_GROUP_PAGE && (
        <Field
          label={ar ? 'صفحة هذا التصنيف على هذه الشريحة' : 'Which page of the category this slide shows'}
          hint={
            ar
              ? 'ضع الشريحة التالية في نفس القسم واختر الصفحة التالية — التصنيف كاملًا يُعرض ولا يُبتَر ذيله'
              : 'Place the next slide in the same section and pick the next page — the whole category is shown, its tail is never cut'
          }
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {Array.from({ length: groupPageCount(groupFields.length, FIELDS_PER_GROUP_PAGE) }, (_, i) => i + 1).map(page => {
              const active = (block.groupPage || 1) === page;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPatch({ groupPage: page > 1 ? page : undefined })}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: active ? `${GOLD}33` : 'rgba(15,23,42,0.6)',
                    border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`,
                    color: active ? GOLD : MUTED,
                    fontSize: '0.65rem',
                    fontWeight: 900,
                  }}
                >
                  {ar ? `صفحة ${page}` : `Page ${page}`}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {section ? (
        <Field
          label={ar ? 'اختر الحقول' : 'Pick the fields'}
          hint={`${ar ? 'محدد' : 'Selected'} ${picked.length}/${MAX_KEYS}`}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {section.fields.length === 0 && (
              <div style={{ color: MUTED, fontSize: '0.68rem', fontStyle: 'italic' }}>
                {ar ? 'لا حقول في هذا القسم لهذه النشاط.' : 'This section asks no fields for this business.'}
              </div>
            )}
            {section.fields.map(f => {
              const on = picked.includes(f.name);
              const hidden = f.visibility === 'hide_field';
              const masked = f.visibility === 'hide_value';
              const title = [f.name, f.value ? `= ${f.value}` : ''].filter(Boolean).join(' ');
              return (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => toggle(f.name)}
                  title={title}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 2,
                    textAlign: 'start',
                    minWidth: 110,
                    padding: '0.4rem 0.6rem',
                    borderRadius: 8,
                    cursor: hidden ? 'not-allowed' : 'pointer',
                    background: on ? `${GOLD}26` : 'rgba(15,23,42,0.6)',
                    border: `1px solid ${on ? GOLD : hidden ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.12)'}`,
                    color: on ? '#f8fafc' : MUTED,
                    opacity: hidden ? 0.55 : 1,
                  }}
                >
                  <span style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.3px' }}>
                    {(ar && f.labelAr ? f.labelAr : f.label) || f.name}
                  </span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.75, maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {masked
                      ? (ar ? 'القيمة مخفية (—)' : 'value hidden (—)')
                      : hidden
                        ? (ar ? 'مخفي بالكامل' : 'fully hidden')
                        : f.value || (ar ? 'بدون إجابة' : 'no answer')}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      ) : (
        <Field
          label={ar ? 'أسماء الحقول (مفصولة بفواصل أو مسافات)' : 'Field names (comma or space separated)'}
          hint={
            ar
              ? 'مثال: price, location, area, handover_date — أو اختر قسمًا بالأعلى لعرض حقوله'
              : 'e.g. price, location, area, handover_date — or choose a section above to list its fields'
          }
        >
          <input
            type="text"
            value={picked.join(', ')}
            onChange={e => {
              const keys = e.target.value
                .split(/[,\s]+/)
                .map(s => s.trim())
                .filter(Boolean)
                .slice(0, MAX_KEYS);
              onPatch({ fieldKeys: keys });
            }}
            style={inputStyle}
            placeholder="price, location, area"
          />
        </Field>
      )}

      {/* Keys outside the chosen section stay visible and removable, never silently dropped. */}
      {section && extraKeys.length > 0 && (
        <Field label={ar ? 'حقول من مكان آخر' : 'Keys from elsewhere'}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {extraKeys.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => drop(k)}
                title={ar ? 'إزالة' : 'Remove'}
                style={{
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#e2e8f0',
                  padding: '0.3rem 0.55rem',
                  borderRadius: 999,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {k} ✕
              </button>
            ))}
          </div>
        </Field>
      )}
    </>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.45rem 0.6rem',
  background: DARK,
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#f8fafc',
  outline: 'none',
  fontSize: '0.75rem',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.45rem 0.6rem',
  background: DARK,
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#f8fafc',
  outline: 'none',
  fontSize: '0.75rem',
  fontFamily: 'inherit',
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', color: MUTED, fontSize: '0.62rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ color: MUTED, fontSize: '0.6rem', marginTop: '0.25rem', opacity: 0.7 }}>{hint}</div>}
    </div>
  );
}

function IconBtn({
  children, onClick, disabled, title, danger, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 26, height: 26, borderRadius: 6,
        background: active ? `${GOLD}33` : 'rgba(15,23,42,0.6)',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
        color: danger ? '#ef4444' : active ? GOLD : '#e2e8f0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.75rem',
        fontWeight: 900,
        opacity: disabled ? 0.35 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}
