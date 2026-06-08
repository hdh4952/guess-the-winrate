import { describe, it, expect } from "vitest";
import { pickTwoDistinct, generateRound } from "./round";
import type { OpeningEntry } from "../types";

function op(name: string, counts: OpeningEntry["counts"]): OpeningEntry {
  return {
    eco: "X",
    name,
    sanMoves: [],
    uciMoves: [name],
    fen: "8/8/8/8/8/8/8/8 w - - 0 1",
    counts,
  };
}

/** Deterministic rng yielding the given values then repeating the last. */
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("pickTwoDistinct", () => {
  it("returns two different openings", () => {
    const list = [op("A", {}), op("B", {}), op("C", {}), op("D", {})];
    const [a, b] = pickTwoDistinct(list, seq([0, 0]));
    expect(a.name).toBe("A");
    expect(b.name).not.toBe("A");
  });

  it("throws when fewer than two openings", () => {
    expect(() => pickTwoDistinct([op("A", {})], Math.random)).toThrow();
  });
});

describe("generateRound", () => {
  const A = op("A", { "1600": [6000, 2000, 2000] }); // white 60%
  const B = op("B", { "1600": [4000, 2000, 4000] }); // white 40%
  const C = op("C", { "0": [500, 200, 300] }); // only band 0

  it("builds a round from openings that have data for the band", () => {
    // rng: pick A (0), pick B (0 -> bumped to 1), perspective white (<0.5)
    const round = generateRound([A, B, C], 1600, { rng: seq([0, 0, 0.1]) });
    expect(round.a.name).toBe("A");
    expect(round.b.name).toBe("B");
    expect(round.perspective).toBe("white");
    expect(round.countsA).toEqual({ white: 6000, draws: 2000, black: 2000 });
  });

  it("ignores openings without data for the chosen band", () => {
    // At band 2500 none of A/B/C have data -> cannot build a round
    expect(() => generateRound([A, B, C], 2500, {})).toThrow();
  });

  it("re-rolls (and ultimately throws) when the only pair ties in every perspective", () => {
    const X = op("X", { "1600": [5000, 0, 5000] }); // 50/50
    const Y = op("Y", { "1600": [5000, 0, 5000] }); // 50/50 -> always tied
    expect(() => generateRound([X, Y], 1600, { rng: () => 0, maxAttempts: 5 })).toThrow();
  });
});
