import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { OpeningCard } from "./OpeningCard";
import type { OpeningEntry } from "../types";

const opening: OpeningEntry = {
  eco: "C50",
  name: "Italian Game",
  sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
  uciMoves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5"],
  fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
};

describe("OpeningCard", () => {
  it("shows the opening name and SAN moves", () => {
    const { getByText } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={() => {}} />
    );
    expect(getByText("Italian Game")).toBeInTheDocument();
    expect(getByText(/1\.\s*e4\s*e5/)).toBeInTheDocument();
  });

  it("calls onPick when clicked and not revealed", () => {
    const onPick = vi.fn();
    const { getByRole } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={onPick} />
    );
    fireEvent.click(getByRole("button"));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("shows results only when revealed", () => {
    const { queryByText, rerender, getByText } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={() => {}}
        counts={{ white: 60, draws: 20, black: 20 }} />
    );
    expect(queryByText(/승률/)).toBeNull();
    rerender(
      <OpeningCard opening={opening} perspective="white" revealed={true} onPick={() => {}}
        counts={{ white: 60, draws: 20, black: 20 }} />
    );
    expect(getByText(/승률/)).toBeInTheDocument();
  });
});
