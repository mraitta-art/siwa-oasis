'use client';

import React from 'react';
import {
  SlideBlock,
  ZONE_GRID,
  BlockZone,
  BLOCK_HIDDEN_LEGEND,
  asFieldsIndex,
  resolveBlockEntries,
  groupLabelFor,
  type FlatFieldsIndex,
  type ResolvedField,
  type SlideFieldsIndex,
} from '@/lib/slide-blocks';
import {
  maybeFormatPriceField,
  specFor,
  type ListingKind,
} from '@/lib/listing-kind';

/**
 * SlideInfoBlocksOverlay
 * ---------------------
 * Renders the admin-approved info blocks on top of a hero slide. Absolutely
 * positioned inside a full-bleed parent (which must be `position: relative`).
 *
 * Positioning: each block occupies one of nine zones; multiple blocks in the
 * same zone stack vertically inside that zone.
 *
 * Resilience: only blocks with `approved === true` render. If a field key
 * is missing from the resolved data set, the block silently drops that row
 * (never renders "undefined" or a broken pill).
 */

// Re-export for consumers that imported it from here before the library split.
export type { ResolvedField };

export interface SlideInfoBlocksOverlayProps {
  blocks?: SlideBlock[] | unknown;
  /**
   * Resolved presentation for the current minisite. The section-aware shape lets
   * a block read its own section's answer; a plain field-name map still works and
   * resolves every block across all sections, exactly as it did before.
   */
  fieldsIndex?: SlideFieldsIndex | FlatFieldsIndex;
  /** Slide's own caption — used when a block has kind='caption' and no per-block text. */
  slideCaption?: string;
  /** Accent color for glass/card borders. Falls back to the platform gold. */
  accent?: string;
  /** Whether the parent's dir is RTL — for correct logical-property orientation. */
  rtl?: boolean;
  /** Arabic-first wording for the masked-value footnote. */
  ar?: boolean;
  /**
   * The minisite's specialization. When present, a `spec-sheet` block formats
   * price-bearing fields through `formatPrice` with this kind's basis (/night,
   * /month, or total). Absent means no kind formatting — the raw value prints
   * as it always did.
   */
  listingKind?: ListingKind | null;
  /** The units' currency, defaulting to EGP when the caller has no signal. */
  currency?: string;
}

const GOLD = '#D4AF37';
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function groupByZone(blocks: SlideBlock[]): Map<BlockZone, SlideBlock[]> {
  const map = new Map<BlockZone, SlideBlock[]>();
  for (const b of blocks) {
    if (!b.approved) continue;
    const arr = map.get(b.zone) || [];
    arr.push(b);
    map.set(b.zone, arr);
  }
  return map;
}

/**
 * One value, presented for the surface that's about to print it.
 *
 * A masked value always becomes `—` regardless of kind. A price-bearing field
 * is passed through `maybeFormatPriceField` so a stored `4250000` prints as
 * "EGP 4.25M" on a sale minisite, "EGP 25,000 /month" on a lease, and
 * "EGP 1,200 /night" on a stay — the same number, three different characters.
 * A no-kind context preserves the legacy behavior of printing the raw string,
 * so a business with no units and no specialization still shows admin-typed
 * prose verbatim.
 */
function displayValueFor(
  entry: { key: string; resolved: ResolvedField },
  kindCtx: { kind: ListingKind | null; currency: string },
  ar: boolean,
): string {
  if (entry.resolved.valueHidden) return '—';
  const raw = entry.resolved.value;
  if (!raw) return '';
  if (!kindCtx.kind) return raw;
  return maybeFormatPriceField(entry.key, raw, {
    kind: kindCtx.kind,
    currency: kindCtx.currency,
    ar,
  });
}

function Chip({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.35rem 0.75rem',
      background: 'rgba(9,14,23,0.55)',
      border: `1px solid ${accent}40`,
      color: '#f8fafc',
      borderRadius: 999,
      fontSize: '0.72rem',
      fontWeight: 800,
      letterSpacing: '0.02em',
      backdropFilter: 'blur(6px)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

/** Renders one block using its layout. Missing data → returns null (silent skip). */
function renderBlockBody(
  b: SlideBlock,
  index: SlideFieldsIndex,
  slideCaption: string | undefined,
  accent: string,
  ar: boolean,
  kindCtx: { kind: ListingKind | null; currency: string },
): React.ReactNode {
  // A block that names its section reads that section first, then the union — so
  // a `price` claimed from Facilities can never print the Identity answer.

  // Caption block: text override > slide.caption > null
  if (b.kind === 'caption') {
    const text = (b.text || slideCaption || '').trim();
    if (!text) return null;
    if (b.layout === 'minimal') {
      return (
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
          {text}
        </div>
      );
    }
    if (b.layout === 'glass') {
      return (
        <div style={{
          padding: '0.6rem 1rem', borderRadius: 10, maxWidth: 320,
          background: 'rgba(9,14,23,0.6)', border: `1px solid ${accent}55`,
          backdropFilter: 'blur(10px)', fontSize: '0.75rem', color: '#f8fafc', fontWeight: 700,
        }}>{text}</div>
      );
    }
    // default: pill
    return (
      <div style={{
        display: 'inline-block',
        background: `${accent}22`,
        color: '#f8fafc',
        padding: '0.4rem 0.85rem',
        borderRadius: 999,
        fontSize: '0.68rem',
        fontWeight: 800,
        letterSpacing: '1.8px',
        textTransform: 'uppercase',
        border: `1px solid ${accent}66`,
        backdropFilter: 'blur(8px)',
      }}>{text}</div>
    );
  }

  // Fields-ish blocks
  const entries = resolveBlockEntries(b, index);
  if (entries.length === 0) return null;
  const safeEntries = entries.slice(0, 8);

  // Field LABELS only
  if (b.kind === 'fieldLabels') {
    const labels = safeEntries.map(e => e.resolved.label).filter(Boolean);
    if (labels.length === 0) return null;
    if (b.layout === 'chip-row') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {labels.map((l, i) => <Chip key={i} accent={accent}>{l}</Chip>)}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 0.9rem', fontSize: '0.72rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '1.4px' }}>
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
    );
  }

  // Field VALUES only
  if (b.kind === 'fieldValues') {
    const values = safeEntries
      .map(e => displayValueFor(e, kindCtx, ar))
      .filter(Boolean);
    if (values.length === 0) return null;
    if (b.layout === 'card' || b.layout === 'spec-sheet') {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: 260,
          ...(b.layout === 'spec-sheet' ? {
            padding: '0.55rem 0.8rem',
            borderRadius: 10,
            background: 'rgba(9,14,23,0.55)',
            borderInlineStart: `3px solid ${accent}`,
            backdropFilter: 'blur(10px)',
          } : {}),
        }}>
          {values.map((v, i) => (
            <div key={i} style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.01em' }}>{v}</div>
          ))}
        </div>
      );
    }
    // default (chip-row / glass / minimal for values): horizontal chips
    const containerStyle: React.CSSProperties =
      b.layout === 'glass'
        ? { padding: '0.6rem 0.85rem', borderRadius: 12, background: 'rgba(9,14,23,0.55)', border: `1px solid ${accent}40`, backdropFilter: 'blur(12px)' }
        : { display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem' };
    const inner = (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {values.map((v, i) => <Chip key={i} accent={accent}>{v}</Chip>)}
      </div>
    );
    return b.layout === 'glass' ? <div style={containerStyle}>{inner}</div> : inner;
  }

  // LABEL + VALUES (fieldsValues)
  if (b.kind === 'fieldsValues') {
    const hasHidden = safeEntries.some(e => e.resolved.valueHidden);
    const list = safeEntries.map((e, i) => (
      <div
        key={i}
        style={{
          display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'baseline',
          padding: '0.35rem 0', borderBottom: i < safeEntries.length - 1 ? '1px solid rgba(255,255,255,0.12)' : undefined,
          minWidth: 180,
        }}
      >
        <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', opacity: 0.72 }}>
          {e.resolved.label}
        </span>
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 800,
          color: e.resolved.valueHidden ? 'rgba(248,250,252,0.35)' : '#f8fafc',
        }}>
          {displayValueFor(e, kindCtx, ar)}
        </span>
      </div>
    ));

    if (b.layout === 'chip-row') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {safeEntries.map((e, i) => (
            <Chip key={i} accent={accent}>
              <span style={{ opacity: 0.7, marginRight: 4 }}>{e.resolved.label}:</span>
              <span style={{ fontWeight: 900, color: e.resolved.valueHidden ? 'rgba(248,250,252,0.35)' : '#f8fafc' }}>
                {displayValueFor(e, kindCtx, ar)}
              </span>
            </Chip>
          ))}
        </div>
      );
    }
    if (b.layout === 'minimal') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxWidth: 240 }}>
          {safeEntries.map((e, i) => (
            <div key={i} style={{ fontSize: '0.72rem', color: '#f8fafc' }}>
              <span style={{ opacity: 0.7 }}>{e.resolved.label}: </span>
              <span style={{ fontWeight: 800, color: e.resolved.valueHidden ? 'rgba(248,250,252,0.35)' : '#f8fafc' }}>
                {displayValueFor(e, kindCtx, ar)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    // spec-sheet: a table with kind-tinted accent stripe and large values.
    // Differentiator for public visitors: same number, three characters.
    if (b.layout === 'spec-sheet') {
      const kindSpec = specFor(kindCtx.kind);
      const sheetAccent = kindSpec?.accent || accent;
      return (
        <div style={{
          display: 'flex', flexDirection: 'column',
          maxWidth: 340,
          padding: '0.75rem 1rem 0.85rem',
          borderRadius: 12,
          background: 'rgba(9,14,23,0.68)',
          border: `1px solid ${sheetAccent}40`,
          borderInlineStart: `4px solid ${sheetAccent}`,
          backdropFilter: 'blur(14px)',
          boxShadow: '0 12px 34px rgba(0,0,0,0.38)',
        }}>
          {kindSpec && (
            <div style={{
              fontSize: '0.6rem',
              fontWeight: 900,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: sheetAccent,
              marginBottom: '0.4rem',
            }}>
              {ar ? kindSpec.badge.ar : kindSpec.badge.en}
            </div>
          )}
          {safeEntries.map((e, i) => {
            const shown = displayValueFor(e, kindCtx, ar);
            const hidden = e.resolved.valueHidden;
            return (
              <div
                key={i}
                style={{
                  display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline',
                  padding: '0.4rem 0',
                  borderBottom: i < safeEntries.length - 1 ? `1px dashed ${sheetAccent}30` : undefined,
                  minWidth: 220,
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase', opacity: 0.68 }}>
                  {e.resolved.label}
                </span>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  color: hidden ? 'rgba(248,250,252,0.35)' : '#f8fafc',
                }}>
                  {shown}
                </span>
              </div>
            );
          })}
          {hasHidden && (
            <div style={{ marginTop: '0.4rem', fontSize: '0.6rem', opacity: 0.55, fontStyle: 'italic' }}>
              {ar ? BLOCK_HIDDEN_LEGEND.ar : BLOCK_HIDDEN_LEGEND.en}
            </div>
          )}
        </div>
      );
    }
    // default layout for fieldsValues = 'card'
    const isGlass = b.layout === 'glass';
    const maxWidth = clamp(200 + safeEntries.length * 20, 200, 320);
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        maxWidth,
        padding: isGlass ? '0.75rem 1rem' : '0.65rem 0.85rem',
        borderRadius: 12,
        background: isGlass ? 'rgba(9,14,23,0.62)' : 'rgba(15,23,42,0.55)',
        border: `1px solid ${isGlass ? `${accent}55` : 'rgba(255,255,255,0.2)'}`,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }}>
        {list}
        {hasHidden && (
          <div style={{ marginTop: '0.35rem', fontSize: '0.6rem', opacity: 0.55, fontStyle: 'italic' }}>
            {ar ? BLOCK_HIDDEN_LEGEND.ar : BLOCK_HIDDEN_LEGEND.en}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function SlideInfoBlocksOverlay({
  blocks,
  fieldsIndex,
  slideCaption,
  accent = GOLD,
  rtl = false,
  ar = true,
  listingKind = null,
  currency = 'EGP',
}: SlideInfoBlocksOverlayProps) {
  const safeBlocks = Array.isArray(blocks) ? (blocks as SlideBlock[]) : [];
  const approved = safeBlocks.filter(b => b && b.approved);
  if (approved.length === 0) return null;

  const index = asFieldsIndex(fieldsIndex);
  const grouped = groupByZone(approved);
  const kindCtx = { kind: listingKind, currency };

  return (
    <div
      aria-hidden={false}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none', // overlay itself doesn't intercept CTA clicks
        zIndex: 12,
      }}
    >
      {Array.from(grouped.entries()).map(([zone, zblocks]) => {
        const g = ZONE_GRID[zone];
        const edgeV = 'clamp(1.25rem, 4vh, 2.5rem)';
        const edgeH = 'clamp(1.25rem, 4vw, 3rem)';
        const pos: React.CSSProperties = {};
        // Vertical
        if (g.align === 'flex-start') pos.top = edgeV;
        else if (g.align === 'flex-end') pos.bottom = edgeV;
        else { pos.top = '50%'; }
        // Horizontal — a zone names a side of the page, not a pixel: on an Arabic
        // minisite "start" is the right edge, so the band the admin picked is the
        // band the visitor sees.
        if (g.justify === 'flex-start') {
          if (rtl) pos.right = edgeH; else pos.left = edgeH;
        } else if (g.justify === 'flex-end') {
          if (rtl) pos.left = edgeH; else pos.right = edgeH;
        } else {
          pos.left = '50%';
        }
        // Transform combination for centered rows/columns
        const tx = g.justify === 'center' ? '-50%' : '0';
        const ty = g.align === 'center' ? '-50%' : '0';
        if (tx !== '0' || ty !== '0') {
          pos.transform = `translate(${tx}, ${ty})`;
        }
        return (
          <div
            key={zone}
            style={{
              position: 'absolute',
              ...pos,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              alignItems: g.justify === 'flex-start' ? 'flex-start' : g.justify === 'flex-end' ? 'flex-end' : 'center',
              pointerEvents: 'none',
            }}
          >
            {zblocks.map(b => {
              // The category name the admin chose for this bundle of fields, from
              // `field_groups` — not retyped on the slide, so the same category says
              // the same thing on every page and in both languages.
              const heading = b.kind === 'caption' ? null : groupLabelFor(b.groupKey || '', b.sectionId, index, ar);
              return (
                <div key={b.id} style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'inherit' }}>
                  {heading && (
                    <div style={{
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      letterSpacing: '1.6px',
                      textTransform: 'uppercase',
                      color: accent,
                      textShadow: '0 1px 6px rgba(0,0,0,0.55)',
                    }}>{heading}</div>
                  )}
                  {renderBlockBody(b, index, slideCaption, accent, ar, kindCtx)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
