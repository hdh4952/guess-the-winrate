import { Chessboard } from "react-chessboard";

interface Props {
  fen: string;
}

/** Static (non-interactive) board diagram for a position, rendered by react-chessboard. */
export function ChessBoard({ fen }: Props) {
  return (
    <div className="chessboard">
      <Chessboard
        id={fen}
        position={fen}
        arePiecesDraggable={false}
        boardWidth={280}
        customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
        customDarkSquareStyle={{ backgroundColor: "#b58863" }}
      />
    </div>
  );
}
