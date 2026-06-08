import { fenToBoard, PIECE_GLYPHS } from "../lib/fen";

interface Props {
  fen: string;
}

export function ChessBoard({ fen }: Props) {
  const board = fenToBoard(fen);
  return (
    <div className="chessboard">
      {board.map((rank, r) =>
        rank.map((piece, c) => {
          const dark = (r + c) % 2 === 1;
          return (
            <div key={`${r}-${c}`} className={`square ${dark ? "dark" : "light"}`}>
              {piece ? (
                <span className={piece === piece.toUpperCase() ? "white-piece" : "black-piece"}>
                  {PIECE_GLYPHS[piece]}
                </span>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
