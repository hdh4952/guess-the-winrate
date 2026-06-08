import { Chess } from "chess.js";

/**
 * Replays a sequence of UCI moves from the standard start position and returns
 * the FEN after each ply, prefixed with the start position.
 * The returned array has length `uciMoves.length + 1`; index 0 is the start
 * position and index i is the position after i moves.
 */
export function fensForUci(uciMoves: string[]): string[] {
  const chess = new Chess();
  const fens = [chess.fen()];
  for (const uci of uciMoves) {
    chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.slice(4) || undefined,
    });
    fens.push(chess.fen());
  }
  return fens;
}
