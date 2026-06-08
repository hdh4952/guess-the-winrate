import type { OpeningEntry, Counts, Perspective, Round } from "../types";
import { higherWinRateIndex } from "./winrate";

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
}

/**
 * Builds a round from the precomputed stats — no network. Picks two distinct
 * openings that both have data for the chosen rating band, in a random
 * perspective, re-rolling on an exact tie.
 */
export function generateRound(
  openings: OpeningEntry[],
  ratingBucket: number,
  opts: GenerateOpts = {}
): Round {
  const { maxAttempts = 50, rng = Math.random } = opts;
  const key = String(ratingBucket);
  const playable = openings.filter((o) => o.counts[key]);
  if (playable.length < 2) {
    throw new Error("Not enough openings with data for this rating band");
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const [a, b] = pickTwoDistinct(playable, rng);
    const perspective: Perspective = rng() < 0.5 ? "white" : "black";
    const countsA = toCounts(a.counts[key]);
    const countsB = toCounts(b.counts[key]);
    if (higherWinRateIndex(countsA, countsB, perspective) === null) continue;
    return { a, b, countsA, countsB, perspective };
  }
  throw new Error("Could not generate a non-tied round");
}
