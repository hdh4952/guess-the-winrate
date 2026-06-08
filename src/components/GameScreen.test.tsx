import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { GameScreen } from "./GameScreen";
import type { OpeningEntry } from "../types";

function op(name: string, fen: string, counts: OpeningEntry["counts"]): OpeningEntry {
  return { eco: "X", name, sanMoves: ["e4", "e5"], uciMoves: ["e2e4", "e7e5"], fen, counts };
}
// Distinct win rates so generateRound never ties (which would throw -> "empty").
const openings = [
  op("Italian Game", "fen-a", { "1600": [60, 20, 20] }),
  op("Sicilian Defense", "fen-b", { "1600": [40, 20, 40] }),
];

function setMobile(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  vi.restoreAllMocks();
  // restore the default non-mobile stub from test-setup
  setMobile(false);
});

const props = {
  openings, ratingBucket: 1600, streak: 0, best: 0,
  onAnswer: () => {}, onHome: () => {},
};

describe("GameScreen layout", () => {
  it("renders two cards side-by-side on desktop", () => {
    setMobile(false);
    const { container } = render(<GameScreen {...props} />);
    expect(container.querySelectorAll(".opening-card")).toHaveLength(2);
    expect(container.querySelector(".carousel")).toBeNull();
  });

  it("renders a single-card carousel with dots on mobile", () => {
    setMobile(true);
    const { container, getAllByRole } = render(<GameScreen {...props} />);
    expect(container.querySelector(".carousel")).not.toBeNull();
    expect(container.querySelectorAll(".opening-card")).toHaveLength(1);
    expect(getAllByRole("tab")).toHaveLength(2);
  });
});
