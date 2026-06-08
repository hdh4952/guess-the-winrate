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
  counts: { "1600": [60, 20, 20] },
};

describe("OpeningCard", () => {
  it("shows the opening name and SAN moves", () => {
    const { getByText } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={() => {}} />
    );
    expect(getByText("Italian Game")).toBeInTheDocument();
    expect(getByText(/1\.\s*e4\s*e5/)).toBeInTheDocument();
  });

  it("calls onPick when the select button is clicked", () => {
    const onPick = vi.fn();
    const { getByText } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={onPick} />
    );
    fireEvent.click(getByText("이 오프닝 선택"));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("steps through the moves with the arrows", () => {
    const { getByText, getByLabelText } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={() => {}} />
    );
    // starts at the final position (6/6): forward disabled, back enabled
    expect(getByText("수 6/6")).toBeInTheDocument();
    expect(getByLabelText("다음 수")).toBeDisabled();
    expect(getByLabelText("이전 수")).not.toBeDisabled();
    fireEvent.click(getByLabelText("이전 수"));
    expect(getByText("수 5/6")).toBeInTheDocument();
  });

  it("jumps to the start position with the reset button", () => {
    const { getByText, getByLabelText } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={() => {}} />
    );
    fireEvent.click(getByLabelText("처음 포지션"));
    expect(getByText("수 0/6")).toBeInTheDocument();
    expect(getByLabelText("처음 포지션")).toBeDisabled();
    expect(getByLabelText("이전 수")).toBeDisabled();
  });

  it("shows results (and hides the select button) only when revealed", () => {
    const counts = { white: 60, draws: 20, black: 20 };
    const { queryByText, rerender, getByText } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={() => {}} counts={counts} />
    );
    expect(queryByText(/승률/)).toBeNull();
    expect(getByText("이 오프닝 선택")).toBeInTheDocument();
    rerender(
      <OpeningCard opening={opening} perspective="white" revealed={true} onPick={() => {}} counts={counts} />
    );
    expect(getByText(/승률/)).toBeInTheDocument();
    expect(queryByText("이 오프닝 선택")).toBeNull();
  });
});
