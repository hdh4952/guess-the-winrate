export interface OpeningEntry {
  eco: string;
  name: string;
  sanMoves: string[];
  uciMoves: string[];
  fen: string;
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
