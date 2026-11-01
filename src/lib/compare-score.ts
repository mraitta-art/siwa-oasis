/**
 * The value score, and the limits of what it claims.
 *
 * A buyer wants one number to sort the table by. Four facts make any such number
 * a claim rather than a measurement: the figures come from different sources on
 * different dates, a project may simply not publish one of them, "better" flips
 * direction per metric (a low price wins, a long term wins), and a set of three
 * projects is not a market. So this scores *relative to the compared set only* —
 * min-max inside the rows on screen — and the UI says so in every language.
 *
 * Deliberately pure: no database, no React, no formatting. The engine builds the
 * rows, this ranks them, and both are testable under `node --test`.
 */

import { DEV_COMPARE_COPY } from '@/lib/dev-compare-copy';

export interface ScoreWeights {
  /** EGP per m² — lower is better. */
  price: number;
  /** Down payment as a percentage of the price — lower is better. */
  downPayment: number;
  /** Instalment term in years — longer is better. */
  years: number;
  /** Handover year — earlier is better. */
  delivery: number;
}

/** The default weighting: price first, then the three commitment measures. */
export const DEFAULT_WEIGHTS: ScoreWeights = { price: 5, downPayment: 3, years: 3, delivery: 3 };

/** Every slider tops out here, so a buyer cannot drown the other metrics out. */
export const WEIGHT_MAX = 5;

export type ScoreMetricKey = keyof ScoreWeights;

/** `lower` rewards the smallest value in the set; `higher` rewards the largest. */
export type ScoreDirection = 'lower' | 'higher';

export interface ScoreRow {
  id: string;
  /** An offer matched the selection, so this project is in the ranking at all. */
  comparable: boolean;
  pricePerSqm?: number | null;
  downPaymentPct?: number | null;
  installmentYears?: number | null;
  deliveryYear?: number | null;
}

export interface ScoreLine {
  key: ScoreMetricKey;
  direction: ScoreDirection;
  /** The weight used, after clamping. */
  weight: number;
  /** The figure scored, null when the project does not publish it. */
  value: number | null;
  documented: boolean;
  /** 0–1 within the compared set. null when there was nothing to normalise. */
  normalized: number | null;
  /** `weight × normalized`, the numerator this line contributes. */
  points: number;
}

export interface ScoreResult {
  weights: ScoreWeights;
  /** id → 0–100. Only projects that are in the ranking appear here. */
  scores: Record<string, number>;
  breakdown: Record<string, ScoreLine[]>;
  /** Projects dropped for having no matching offer — never scored as 0. */
  excludedIds: string[];
  /** The set the min-max was taken over, for the "of N projects" line. */
  comparedIds: string[];
  /** True when every slider is at 0, so no score could be produced. */
  allWeightsZero: boolean;
  relativeNote: string;
}

const METRICS: { key: ScoreMetricKey; field: keyof ScoreRow; direction: ScoreDirection }[] = [
  { key: 'price', field: 'pricePerSqm', direction: 'lower' },
  { key: 'downPayment', field: 'downPaymentPct', direction: 'lower' },
  { key: 'years', field: 'installmentYears', direction: 'higher' },
  { key: 'delivery', field: 'deliveryYear', direction: 'lower' },
];

function clampWeight(value: number | null | undefined): number {
  const weight = Number(value);
  if (!Number.isFinite(weight) || weight < 0) return 0;
  return Math.min(weight, WEIGHT_MAX);
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** A delivery year in the far future is a promise, not a fact; ignore dust. */
function isSaneYear(value: number | null): boolean {
  return value !== null && value >= 1900 && value <= 2100;
}

/**
 * min-max over the compared set only.
 *
 * A single value — or a set where everyone published the same figure — normalises
 * to 0.5. Not 1 and not 0: with nothing to separate, "best" would be an invented
 * distinction, and "worst" would be an accusation about a project we simply have
 * no comparison for.
 */
function normalize(value: number, min: number, max: number, direction: ScoreDirection): number {
  if (min === max) return 0.5;
  const span = max - min;
  const raw = direction === 'lower' ? (max - value) / span : (value - min) / span;
  return Math.min(Math.max(raw, 0), 1);
}

export function scoreComparisons(
  rows: ScoreRow[],
  options: { weights?: Partial<ScoreWeights>; ar?: boolean } = {}
): ScoreResult {
  const incoming = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };
  const weights: ScoreWeights = {
    price: clampWeight(incoming.price),
    downPayment: clampWeight(incoming.downPayment),
    years: clampWeight(incoming.years),
    delivery: clampWeight(incoming.delivery),
  };

  const pool = rows || [];
  const compared = pool.filter((row) => row && row.comparable);
  const excludedIds = pool.filter((row) => row && !row.comparable).map((row) => row.id);

  // Range per metric, taken across the compared set — not the whole database.
  const ranges: Record<ScoreMetricKey, { min: number; max: number } | null> = {
    price: null,
    downPayment: null,
    years: null,
    delivery: null,
  };
  for (const metric of METRICS) {
    const values = compared
      .map((row) => toNumber(row[metric.field]))
      .filter((v): v is number => v !== null && v > 0)
      .filter((v) => (metric.key === 'delivery' ? isSaneYear(v) : true));
    if (values.length === 0) continue;
    ranges[metric.key] = { min: Math.min(...values), max: Math.max(...values) };
  }

  const scores: Record<string, number> = {};
  const breakdown: Record<string, ScoreLine[]> = {};

  for (const row of compared) {
    const lines: ScoreLine[] = METRICS.map((metric) => {
      const weight = weights[metric.key];
      const raw = toNumber(row[metric.field]);
      const value =
        raw !== null && raw > 0 && (metric.key !== 'delivery' || isSaneYear(raw)) ? raw : null;
      const range = ranges[metric.key];

      if (value === null || !range || weight === 0) {
        return {
          key: metric.key,
          direction: metric.direction,
          weight,
          value,
          documented: value !== null,
          normalized: null,
          points: 0,
        };
      }

      const normalized = normalize(value, range.min, range.max, metric.direction);
      return {
        key: metric.key,
        direction: metric.direction,
        weight,
        value,
        documented: true,
        normalized,
        points: weight * normalized,
      };
    });

    // The denominator is the weight this project can actually be judged on. An
    // undocumented metric costs it points rather than costing it the ranking: a
    // project that publishes no handover year is not a worse project, it is a
    // less documented one, and inventing a zero for it would be our failure.
    const judged = lines.filter((line) => line.normalized !== null && line.weight > 0);
    const weightSum = judged.reduce((sum, line) => sum + line.weight, 0);
    const points = judged.reduce((sum, line) => sum + line.points, 0);

    scores[row.id] = weightSum > 0 ? Math.round((points / weightSum) * 100) : 0;
    breakdown[row.id] = lines;
  }

  const allWeightsZero = METRICS.every((metric) => weights[metric.key] === 0);

  return {
    weights,
    scores,
    breakdown,
    excludedIds,
    comparedIds: compared.map((row) => row.id),
    allWeightsZero,
    relativeNote: options.ar ? DEV_COMPARE_COPY.relativeNote.ar : DEV_COMPARE_COPY.relativeNote.en,
  };
}

/**
 * The best score per metric, as ids, so the table can flag a row the same way it
 * already flags best-value and earliest-handover.
 *
 * Only one id wins a row; a tie is left unflagged rather than shared, because
 * `الأفضل في هذه المقارنة` beside two identical figures reads like a tie and
 * beside one of many reads like a claim.
 */
export function bestPerMetric(result: ScoreResult): Record<ScoreMetricKey, string | null> {
  const best: Record<ScoreMetricKey, string | null> = {
    price: null,
    downPayment: null,
    years: null,
    delivery: null,
  };

  for (const metric of METRICS) {
    let winner: string | null = null;
    let winningValue: number | null = null;
    let tied = false;

    for (const id of result.comparedIds) {
      const line = (result.breakdown[id] || []).find((l) => l.key === metric.key);
      if (!line || line.value === null) continue;
      const better =
        winningValue === null ||
        (metric.direction === 'lower' ? line.value < winningValue : line.value > winningValue);
      if (better) {
        winner = id;
        winningValue = line.value;
        tied = false;
      } else if (line.value === winningValue) {
        tied = true;
      }
    }

    best[metric.key] = tied ? null : winner;
  }

  return best;
}

/** How many of the four questions a project answered, for the completeness row. */
export function documentationCount(result: ScoreResult, id: string): { documented: number; of: number } {
  const lines = result.breakdown[id] || [];
  return { documented: lines.filter((line) => line.documented).length, of: lines.length };
}
