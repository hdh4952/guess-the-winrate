import type { OpeningEntry, Counts, Perspective, Round } from "../types";
import { fetchCounts as defaultFetchCounts } from "./lichessApi";
import { totalGames } from "./winrate";

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

export interface GenerateOpts {
  minGames?: number;
  maxAttempts?: number;
  rng?: () => number;
  fetchCounts?: (uci: string[], bucket: number) => Promise<Counts>;
}

export async function generateRound(
  openings: OpeningEntry[],
  ratingBucket: number,
  opts: GenerateOpts = {}
): Promise<Round> {
  const {
    minGames = 1000,
    maxAttempts = 20,
    rng = Math.random,
    fetchCounts = defaultFetchCounts,
  } = opts;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const [a, b] = pickTwoDistinct(openings, rng);
    const perspective: Perspective = rng() < 0.5 ? "white" : "black";
    const [countsA, countsB] = await Promise.all([
      fetchCounts(a.uciMoves, ratingBucket),
      fetchCounts(b.uciMoves, ratingBucket),
    ]);
    if (totalGames(countsA) < minGames || totalGames(countsB) < minGames) continue;
    return { a, b, countsA, countsB, perspective };
  }
  throw new Error("Could not generate a valid round");
}
