/** Per-rating-band aggregated results: bucket (as string) -> [white, draws, black]. */
export type BandCounts = Record<string, [number, number, number]>;

export interface OpeningEntry {
  eco: string;
  name: string;
  sanMoves: string[];
  uciMoves: string[];
  fen: string;
  /** W/D/L counts per rating band that has enough games (precomputed at build time). */
  counts: BandCounts;
}

export interface Counts {
  white: number;
  draws: number;
  black: number;
}

export type Perspective = "white" | "black";

export interface RatingBand {
  label: string;
  bucket: number;
}

export interface Round {
  a: OpeningEntry;
  b: OpeningEntry;
  countsA: Counts;
  countsB: Counts;
  perspective: Perspective;
}
