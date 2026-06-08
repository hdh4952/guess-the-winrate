import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { OpeningCarousel } from "./OpeningCarousel";
import type { OpeningEntry } from "../types";

function op(name: string, fen: string): OpeningEntry {
  return { eco: "X", name, sanMoves: ["e4"], uciMoves: ["e2e4"], fen, counts: {} };
}
const A = op("Italian Game", "fen-a");
const B = op("Sicilian Defense", "fen-b");

describe("OpeningCarousel", () => {
  it("shows only the first opening initially", () => {
    const { getByText, queryByText } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={() => {}} />
    );
    expect(getByText("Italian Game")).toBeInTheDocument();
    expect(queryByText("Sicilian Defense")).toBeNull();
  });

  it("renders 1/2 switch buttons", () => {
    const { getByRole } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={() => {}} />
    );
    expect(getByRole("tab", { name: "오프닝 1/2" })).toHaveTextContent("1");
    expect(getByRole("tab", { name: "오프닝 2/2" })).toHaveTextContent("2");
  });

  it("switches to the second opening when the second tab is tapped", () => {
    const { getByLabelText, getByText, queryByText } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={() => {}} />
    );
    fireEvent.click(getByLabelText("오프닝 2/2"));
    expect(getByText("Sicilian Defense")).toBeInTheDocument();
    expect(queryByText("Italian Game")).toBeNull();
  });

  it("swipes left to the second opening past the threshold", () => {
    const { container, getByText } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={() => {}} />
    );
    const carousel = container.querySelector(".carousel") as HTMLElement;
    fireEvent.touchStart(carousel, { changedTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 100 }] });
    expect(getByText("Sicilian Defense")).toBeInTheDocument();
  });

  it("ignores a swipe shorter than the threshold", () => {
    const { container, getByText } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={() => {}} />
    );
    const carousel = container.querySelector(".carousel") as HTMLElement;
    fireEvent.touchStart(carousel, { changedTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 180 }] });
    expect(getByText("Italian Game")).toBeInTheDocument();
  });

  it("calls onPick with the active index", () => {
    const onPick = vi.fn();
    const { getByText, getByLabelText } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={onPick} />
    );
    fireEvent.click(getByText("이 오프닝 선택"));
    expect(onPick).toHaveBeenLastCalledWith(0);
    fireEvent.click(getByLabelText("오프닝 2/2"));
    fireEvent.click(getByText("이 오프닝 선택"));
    expect(onPick).toHaveBeenLastCalledWith(1);
  });
});
