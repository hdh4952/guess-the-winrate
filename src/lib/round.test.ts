import { describe, it, expect, vi } from "vitest";
import { pickTwoDistinct, generateRound } from "./round";
import type { OpeningEntry, Counts } from "../types";

function op(name: string): OpeningEntry {
  return { eco: "X", name, sanMoves: [], uciMoves: [name], fen: "8/8/8/8/8/8/8/8 w - - 0 1" };
}

const openings = [op("A"), op("B"), op("C"), op("D")];

/** Deterministic rng yielding the given values then repeating the last. */
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("pickTwoDistinct", () => {
  it("returns two different openings", () => {
    const [a, b] = pickTwoDistinct(openings, seq([0, 0]));
    expect(a.name).toBe("A");
    expect(b.name).not.toBe("A");
  });

  it("throws when fewer than two openings", () => {
    expect(() => pickTwoDistinct([op("A")], Math.random)).toThrow();
  });
});

describe("generateRound", () => {
  it("returns a valid round when samples are sufficient and not tied", async () => {
    const fc = vi.fn(async (uci: string[]): Promise<Counts> => {
      if (uci[0] === "A") return { white: 6000, draws: 2000, black: 2000 };
      return { white: 4000, draws: 2000, black: 4000 };
    });
    // rng: pick A (0), pick B (0 -> bumped to index 1), perspective white (<0.5)
    const round = await generateRound(openings, 1600, {
      rng: seq([0, 0, 0.1]),
      fetchCounts: fc,
      minGames: 1000,
    });
    expect(round.a.name).toBe("A");
    expect(round.b.name).toBe("B");
    expect(round.perspective).toBe("white");
    expect(round.countsA.white).toBe(6000);
  });

  it("retries when a sample is below the minimum", async () => {
    const calls: string[][] = [];
    const fc = vi.fn(async (uci: string[]): Promise<Counts> => {
      calls.push(uci);
      // First attempt's openings are tiny; later attempts are large and NOT tied.
      if (calls.length <= 2) return { white: 1, draws: 1, black: 1 };
      return uci[0] === "A"
        ? { white: 5000, draws: 1000, black: 2000 }
        : { white: 3000, draws: 1000, black: 4000 };
    });
    const round = await generateRound(openings, 0, {
      rng: seq([0, 0, 0.1]),
      fetchCounts: fc,
      minGames: 1000,
    });
    expect(fc.mock.calls.length).toBeGreaterThan(2);
    expect(round).toBeTruthy();
  });

  it("throws after maxAttempts when no valid round is found", async () => {
    const fc = vi.fn(async (): Promise<Counts> => ({ white: 1, draws: 1, black: 1 }));
    await expect(
      generateRound(openings, 0, { rng: seq([0, 0, 0.1]), fetchCounts: fc, minGames: 1000, maxAttempts: 3 })
    ).rejects.toThrow();
  });
});
