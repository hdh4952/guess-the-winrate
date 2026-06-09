import type { OpeningEntry, Counts, Perspective, Round } from "../types";
import { higherWinRateIndex, winRateGap } from "./winrate";

/**
 * Minimum win-rate gap (3 percentage points) between the two openings. Below
 * this the answer is effectively a coin flip, so such pairs are skipped. The
 * precomputed samples are large (thousands of games), so a 3%p gap is a real,
 * distinguishable difference rather than noise.
 */
export const MIN_WIN_RATE_GAP = 0.03;

export function pickTwoDistinct(
  openings: OpeningEntry[],
  rng: () => number = Math.random
): [OpeningEntry, OpeningEntry] {
  if (openings.length < 2) throw new Error("Need at least 2 openings");
  const i = Math.floor(rng() * openings.length);
  let j = Math.floor(rng() * (openings.length - 1));
  if (j >= i) j++;
  return [openings[i], openings[j]];
}

function toCounts(t: [number, number, number]): Counts {
  return { white: t[0], draws: t[1], black: t[2] };
}

export interface GenerateOpts {
  maxAttempts?: number;
  rng?: () => number;
  /** Minimum win-rate gap to accept a pair outright. Defaults to MIN_WIN_RATE_GAP. */
  minGap?: number;
}

/**
 * Builds a round from the precomputed stats — no network. Picks two distinct
 * openings that both have data for the chosen rating band, in a random
 * perspective, preferring pairs whose win rates differ by at least `minGap` so
 * the answer isn't a coin flip. Exact ties are always rejected; if no pair
 * clears the gap within `maxAttempts`, the most distinguishable pair seen is
 * used as a fallback.
 */
export function generateRound(
  openings: OpeningEntry[],
  ratingBucket: number,
  opts: GenerateOpts = {}
): Round {
  const { maxAttempts = 50, rng = Math.random, minGap = MIN_WIN_RATE_GAP } = opts;
  const key = String(ratingBucket);
  const playable = openings.filter((o) => o.counts[key]);
  if (playable.length < 2) {
    throw new Error("Not enough openings with data for this rating band");
  }

  let best: { round: Round; gap: number } | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const [a, b] = pickTwoDistinct(playable, rng);
    const perspective: Perspective = rng() < 0.5 ? "white" : "black";
    const countsA = toCounts(a.counts[key]);
    const countsB = toCounts(b.counts[key]);
    // Skip exact ties — they have no correct answer at all.
    if (higherWinRateIndex(countsA, countsB, perspective) === null) continue;
    const round: Round = { a, b, countsA, countsB, perspective };
    const gap = winRateGap(countsA, countsB, perspective);
    if (gap >= minGap) return round;
    if (!best || gap > best.gap) best = { round, gap };
  }
  // No pair cleared the gap — fall back to the most distinguishable one found.
  if (best) return best.round;
  throw new Error("Could not generate a non-tied round");
}
