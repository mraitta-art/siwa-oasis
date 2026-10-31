'use client';

/**
 * PillarPrimitives — kept as the pillar pages' import path, now a thin re-export
 * of the platform's shared HeroUI primitives.
 *
 * The pillar pages and the minisites must not drift apart, so there is exactly
 * one implementation (src/components/ui/HeroPrimitives) and this file only
 * carries the older names the pillar pages already import.
 */

export {
  HeroCardGrid as PillarCardGrid,
  HeroChipRow as PillarChipRow,
  type HeroCardItem as PillarCardItem,
  type HeroChipItem as PillarChipItem,
} from '@/components/ui/HeroPrimitives';
