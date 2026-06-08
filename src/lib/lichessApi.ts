import type { Counts } from "../types";

const BASE = "https://explorer.lichess.ovh/lichess";
const cache = new Map<string, Counts>();

type FetchImpl = (input: string) => Promise<Response>;

export async function fetchCounts(
  uciMoves: string[],
  ratingBucket: number,
  fetchImpl: FetchImpl = fetch
): Promise<Counts> {
  const key = `${ratingBucket}:${uciMoves.join(",")}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    variant: "standard",
    play: uciMoves.join(","),
    speeds: "blitz,rapid,classical",
    ratings: String(ratingBucket),
  });
  const res = await fetchImpl(`${BASE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Lichess API error: ${res.status}`);
  }
  const data = (await res.json()) as { white: number; draws: number; black: number };
  const counts: Counts = { white: data.white, draws: data.draws, black: data.black };
  cache.set(key, counts);
  return counts;
}

/** Test-only: clear the in-memory cache. */
export function _clearCache(): void {
  cache.clear();
}
