import { useRef } from "react";
import { Chessboard } from "react-chessboard";
import type { Perspective } from "../types";
import { useElementWidth } from "../hooks/useElementWidth";

interface Props {
  fen: string;
  /** Side shown at the bottom of the board. Defaults to white. */
  orientation?: Perspective;
}

/** Static (non-interactive) board diagram; sizes itself to its container. */
export function ChessBoard({ fen, orientation = "white" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const measured = useElementWidth(ref, 280);
  // Floor 48 lets the small compare-panel thumbnail (~96px) render without overflow; cap 360 for phones.
  const boardWidth = Math.max(48, Math.min(360, measured));

  return (
    <div className="chessboard" ref={ref}>
      <Chessboard
        id={fen}
        position={fen}
        boardOrientation={orientation}
        arePiecesDraggable={false}
        boardWidth={boardWidth}
        customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
        customDarkSquareStyle={{ backgroundColor: "#b58863" }}
      />
    </div>
  );
}
