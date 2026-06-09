import { describe, it, expect } from "vitest";
import { totalGames, winRate, winRateGap, higherWinRateIndex, isCorrect } from "./winrate";
import type { Counts } from "../types";

const a: Counts = { white: 60, draws: 20, black: 20 }; // 100 games
const b: Counts = { white: 40, draws: 20, black: 40 }; // 100 games

describe("winrate helpers", () => {
  it("totalGames sums the three counts", () => {
    expect(totalGames(a)).toBe(100);
  });

  it("winRate computes white and black share", () => {
    expect(winRate(a, "white")).toBeCloseTo(0.6);
    expect(winRate(a, "black")).toBeCloseTo(0.2);
  });

  it("winRate returns 0 for an empty position", () => {
    expect(winRate({ white: 0, draws: 0, black: 0 }, "white")).toBe(0);
  });

  it("winRateGap returns the absolute win-rate difference per perspective", () => {
    expect(winRateGap(a, b, "white")).toBeCloseTo(0.2); // 0.6 vs 0.4
    expect(winRateGap(a, b, "black")).toBeCloseTo(0.2); // 0.2 vs 0.4
    expect(winRateGap(a, a, "white")).toBe(0);
  });

  it("higherWinRateIndex picks the larger side per perspective", () => {
    expect(higherWinRateIndex(a, b, "white")).toBe(0);
    expect(higherWinRateIndex(a, b, "black")).toBe(1);
  });

  it("higherWinRateIndex returns null on a tie", () => {
    expect(higherWinRateIndex(a, a, "white")).toBeNull();
  });

  it("isCorrect compares the chosen index to the higher one", () => {
    expect(isCorrect(0, a, b, "white")).toBe(true);
    expect(isCorrect(1, a, b, "white")).toBe(false);
    expect(isCorrect(1, a, b, "black")).toBe(true);
  });
});
