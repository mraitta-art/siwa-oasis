'use client';

import React from 'react';
import {
  SlideBlock,
  ZONE_GRID,
  BlockZone,
  type ResolvedField,
} from '@/lib/slide-blocks';

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
  /** Field-name → resolved presentation. Caller builds this from sections + custom_data. */
  fieldsIndex?: Record<string, ResolvedField>;
  /** Slide's own caption — used when a block has kind='caption' and no per-block text. */
  slideCaption?: string;
  /** Accent color for glass/card borders. Falls back to the platform gold. */
  accent?: string;
  /** Whether the parent's dir is RTL — for correct logical-property orientation. */
  rtl?: boolean;
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
  fieldsIndex: Record<string, ResolvedField>,
  slideCaption: string | undefined,
  accent: string,
): React.ReactNode {
  const keys = (b.fieldKeys || []).filter(Boolean);

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
  const entries = keys
    .map(k => ({ key: k, resolved: fieldsIndex[k] }))
    .filter((e): e is { key: string; resolved: ResolvedField } => Boolean(e.resolved && (e.resolved.label || e.resolved.value)));
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
    const values = safeEntries.map(e => (e.resolved.valueHidden ? '—' : e.resolved.value)).filter(Boolean);
    if (values.length === 0) return null;
    if (b.layout === 'card') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: 240 }}>
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
          {e.resolved.valueHidden ? '—' : e.resolved.value}
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
                {e.resolved.valueHidden ? '—' : e.resolved.value}
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
                {e.resolved.valueHidden ? '—' : e.resolved.value}
              </span>
            </div>
          ))}
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
          <div style={{ marginTop: '0.35rem', fontSize: '0.6rem', opacity: 0.55, fontStyle: 'italic' }}>— = hidden by admin</div>
        )}
      </div>
    );
  }

  return null;
}

export default function SlideInfoBlocksOverlay({
  blocks,
  fieldsIndex = {},
  slideCaption,
  accent = GOLD,
}: SlideInfoBlocksOverlayProps) {
  const safeBlocks = Array.isArray(blocks) ? (blocks as SlideBlock[]) : [];
  const approved = safeBlocks.filter(b => b && b.approved);
  if (approved.length === 0) return null;

  const grouped = groupByZone(approved);

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
        // Horizontal
        if (g.justify === 'flex-start') pos.left = edgeH;
        else if (g.justify === 'flex-end') pos.right = edgeH;
        else { pos.left = '50%'; }
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
            {zblocks.map(b => (
              <div key={b.id} style={{ pointerEvents: 'auto' }}>
                {renderBlockBody(b, fieldsIndex, slideCaption, accent)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
