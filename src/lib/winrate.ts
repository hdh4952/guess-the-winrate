import type { Counts, Perspective } from "../types";

export function totalGames(c: Counts): number {
  return c.white + c.draws + c.black;
}

export function winRate(c: Counts, p: Perspective): number {
  const total = totalGames(c);
  if (total === 0) return 0;
  return (p === "white" ? c.white : c.black) / total;
}

/** Absolute difference between the two win rates, for the given perspective. */
export function winRateGap(a: Counts, b: Counts, p: Perspective): number {
  return Math.abs(winRate(a, p) - winRate(b, p));
}

/** Index (0 or 1) of the counts with the higher win rate, or null if tied. */
export function higherWinRateIndex(
  a: Counts,
  b: Counts,
  p: Perspective
): 0 | 1 | null {
  const ra = winRate(a, p);
  const rb = winRate(b, p);
  if (ra === rb) return null;
  return ra > rb ? 0 : 1;
}

export function isCorrect(
  choice: 0 | 1,
  a: Counts,
  b: Counts,
  p: Perspective
): boolean {
  return higherWinRateIndex(a, b, p) === choice;
}
