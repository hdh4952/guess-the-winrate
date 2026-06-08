import { describe, it, expect } from "vitest";
import { fensForUci } from "./positions";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("fensForUci", () => {
  it("returns just the start position for no moves", () => {
    const fens = fensForUci([]);
    expect(fens).toHaveLength(1);
    expect(fens[0]).toBe(START);
  });

  it("returns one FEN per ply plus the start position", () => {
    const fens = fensForUci(["e2e4", "e7e5", "g1f3"]);
    expect(fens).toHaveLength(4);
    expect(fens[0]).toBe(START);
    // after 1.e4 the pawn sits on e4 -> rank 4 placement is "4P3"
    expect(fens[1].split(" ")[0]).toContain("4P3");
    expect(fens[3]).not.toBe(START);
  });

  it("handles captures without throwing", () => {
    const fens = fensForUci(["e2e4", "d7d5", "e4d5"]); // 3.exd5 capture
    expect(fens).toHaveLength(4);
    expect(fens[3]).not.toBe(fens[2]);
  });
});
