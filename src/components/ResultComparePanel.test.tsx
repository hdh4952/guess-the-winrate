import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ResultComparePanel } from "./ResultComparePanel";
import type { OpeningEntry } from "../types";

function op(name: string, fen: string): OpeningEntry {
  return { eco: "X", name, sanMoves: ["e4"], uciMoves: ["e2e4"], fen, counts: {} };
}
const A = op("Italian Game", "fen-a"); // white 60%
const B = op("Sicilian Defense", "fen-b"); // white 40%
const countsA = { white: 60, draws: 20, black: 20 };
const countsB = { white: 40, draws: 20, black: 40 };

describe("ResultComparePanel", () => {
  it("renders both openings", () => {
    const { getByText } = render(
      <ResultComparePanel a={A} b={B} countsA={countsA} countsB={countsB}
        perspective="white" choice={0} onNext={() => {}} />
    );
    expect(getByText("Italian Game")).toBeInTheDocument();
    expect(getByText("Sicilian Defense")).toBeInTheDocument();
  });

  it("marks the correct (higher win rate) side with a tag", () => {
    const { getAllByText } = render(
      <ResultComparePanel a={A} b={B} countsA={countsA} countsB={countsB}
        perspective="white" choice={1} onNext={() => {}} />
    );
    // A has the higher white win rate -> "정답" appears once.
    expect(getAllByText("정답")).toHaveLength(1);
  });

  it("tags the player's wrong pick", () => {
    const { getByText } = render(
      <ResultComparePanel a={A} b={B} countsA={countsA} countsB={countsB}
        perspective="white" choice={1} onNext={() => {}} />
    );
    expect(getByText("내 선택")).toBeInTheDocument();
  });

  it("calls onNext when 다음 문제 is clicked", () => {
    const onNext = vi.fn();
    const { getByText } = render(
      <ResultComparePanel a={A} b={B} countsA={countsA} countsB={countsB}
        perspective="white" choice={0} onNext={onNext} />
    );
    fireEvent.click(getByText("다음 문제"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
