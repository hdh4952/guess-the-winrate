/** Parse the piece-placement field of a FEN into an 8x8 grid.
 * Row 0 is rank 8 (Black's back rank); column 0 is file a. */
export function fenToBoard(fen: string): (string | null)[][] {
  const placement = fen.split(" ")[0];
  return placement.split("/").map((row) => {
    const squares: (string | null)[] = [];
    for (const ch of row) {
      if (ch >= "1" && ch <= "8") {
        for (let k = 0; k < Number(ch); k++) squares.push(null);
      } else {
        squares.push(ch);
      }
    }
    return squares;
  });
}

export const PIECE_GLYPHS: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};
