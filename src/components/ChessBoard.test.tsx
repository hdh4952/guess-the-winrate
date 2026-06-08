import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChessBoard } from "./ChessBoard";

describe("ChessBoard", () => {
  it("renders 64 squares", () => {
    const { container } = render(
      <ChessBoard fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />
    );
    expect(container.querySelectorAll(".square")).toHaveLength(64);
  });

  it("renders piece glyphs for occupied squares", () => {
    const { getAllByText } = render(
      <ChessBoard fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />
    );
    expect(getAllByText("♙").length).toBe(8); // white pawns
  });
});
