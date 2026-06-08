import { describe, it, expect } from "vitest";
import { fenToBoard } from "./fen";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("fenToBoard", () => {
  it("returns 8 ranks of 8 squares", () => {
    const board = fenToBoard(START);
    expect(board).toHaveLength(8);
    for (const rank of board) expect(rank).toHaveLength(8);
  });

  it("places pieces and empties from the placement field", () => {
    const board = fenToBoard(START);
    expect(board[0][0]).toBe("r");
    expect(board[0][4]).toBe("k");
    expect(board[7][4]).toBe("K");
    expect(board[4][0]).toBeNull(); // empty middle rank
  });

  it("ignores trailing FEN fields", () => {
    const board = fenToBoard("8/8/8/8/8/8/8/8 w - - 0 1");
    expect(board.flat().every((sq) => sq === null)).toBe(true);
  });
});
