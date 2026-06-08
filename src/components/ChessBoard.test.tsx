import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChessBoard } from "./ChessBoard";

describe("ChessBoard", () => {
  it("renders a board for the given FEN without crashing", () => {
    const { container } = render(
      <ChessBoard fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />
    );
    const wrapper = container.querySelector(".chessboard");
    expect(wrapper).not.toBeNull();
    // react-chessboard rendered its board inside the wrapper.
    expect(wrapper!.childElementCount).toBeGreaterThan(0);
  });
});
