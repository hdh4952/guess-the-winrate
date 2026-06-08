import { Chessboard } from "react-chessboard";
import type { Perspective } from "../types";

interface Props {
  fen: string;
  /** Side shown at the bottom of the board. Defaults to white. */
  orientation?: Perspective;
}

/** Static (non-interactive) board diagram for a position, rendered by react-chessboard. */
export function ChessBoard({ fen, orientation = "white" }: Props) {
  return (
    <div className="chessboard">
      <Chessboard
        id={fen}
        position={fen}
        boardOrientation={orientation}
        arePiecesDraggable={false}
        boardWidth={280}
        customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
        customDarkSquareStyle={{ backgroundColor: "#b58863" }}
      />
    </div>
  );
}
