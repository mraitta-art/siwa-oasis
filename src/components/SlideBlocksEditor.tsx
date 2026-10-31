'use client';

import React, { useMemo, useState } from 'react';
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

/**
 * SlideBlocksEditor
 * -----------------
 * Admin-only panel for placing "info blocks" on a hero slide. Supports
 * adding caption / fieldLabels / fieldValues / fieldsValues blocks,
 * choosing a zone from a 9-grid, and picking a preset layout. Approved
 * toggle is admin-controlled — vendor writes never reach this UI.
 *
 * Field name entry: kept as a comma-separated list to stay compatible with
 * any business's section fields without needing to fetch every section
 * here. A tooltip explains the expected keys.
 *
 * Design rule: hidden fields (field_visibility='hide_field') and hidden
 * values ('hide_value') are respected by the renderer, not by this editor.
 * The admin sees what data exists; the body renderer decides what leaks.
 */

interface Props {
  blocks: SlideBlock[];
  onChange: (blocks: SlideBlock[]) => void;
  /** true when the page is Arabic-first (uses BLOCK_*_LABEL.ar). */
  ar?: boolean;
  /** Business id — enables an inline field-name suggestion box when known. */
  availableFields?: Array<{ name: string; label: string }>;
}

const ZONES: BlockZone[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];
const KINDS: BlockKind[] = ['caption', 'fieldLabels', 'fieldValues', 'fieldsValues'];
const LAYOUTS: BlockLayout[] = ['pill', 'minimal', 'card', 'chip-row', 'glass'];

const GOLD = '#D4AF37';
const DARK = '#0f172a';
const MUTED = '#94a3b8';

function newId() {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function SlideBlocksEditor({ blocks, onChange, ar = true, availableFields }: Props) {
  const label = (obj: { ar: string; en: string }) => (ar ? obj.ar : obj.en);

  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const [editingId, setEditingId] = useState<string | null>(null);

  const availableNamesHint = useMemo(() => {
    if (!availableFields?.length) return '';
    return availableFields.map(f => f.name).join(', ');
  }, [availableFields]);

  const update = (next: SlideBlock[]) => onChange(next);

  const addBlock = (kind: BlockKind) => {
    const b: SlideBlock = {
      id: newId(),
      kind,
      zone: 'bottom-center',
      layout: defaultLayoutForKind(kind),
      fieldKeys: kind === 'caption' ? [] : [],
      text: kind === 'caption' ? '' : undefined,
      approved: false, // admin must explicitly tick — safe default
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

                  {/* Caption text OR field keys */}
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
                    <Field
                      label={
                        ar
                          ? 'أسماء الحقول (مفصولة بفواصل أو مسافات)'
                          : 'Field names (comma or space separated)'
                      }
                      hint={
                        availableNamesHint
                          ? (ar ? 'متاح: ' : 'Available: ') + availableNamesHint
                          : (ar
                              ? 'مثال: price, location, area, handover_date'
                              : 'e.g. price, location, area, handover_date')
                      }
                    >
                      <input
                        type="text"
                        value={(b.fieldKeys || []).join(', ')}
                        onChange={e => {
                          const keys = e.target.value
                            .split(/[,\s]+/)
                            .map(s => s.trim())
                            .filter(Boolean)
                            .slice(0, 8);
                          patchBlock(b.id, { fieldKeys: keys });
                        }}
                        style={inputStyle}
                        placeholder="price, location, area"
                      />
                    </Field>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '0.75rem', color: MUTED, fontSize: '0.62rem', fontStyle: 'italic' }}>
        {ar
          ? 'ملاحظة: الحقول المعروضة هنا تختفي تلقائيًا من جسم الصفحة حتى لا تتكرر.'
          : 'Note: fields shown here are automatically hidden from the body grid to avoid duplication.'}
      </div>
    </div>
  );
}

// ─── small primitives ────────────────────────────────────────────────────
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
