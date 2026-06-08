import { useRef } from "react";
import { Chessboard } from "react-chessboard";
import type { Perspective } from "../types";
import { useElementSize } from "../hooks/useElementSize";

interface Props {
  fen: string;
  /** Side shown at the bottom of the board. Defaults to white. */
  orientation?: Perspective;
  /**
   * "width" (default): board fills the container width.
   * "contain": board fits inside the container box (min of width/height),
   * so a height-constrained slot keeps the whole screen scroll-free.
   */
  fit?: "width" | "contain";
}

/** Static (non-interactive) board diagram; sizes itself to its container. */
export function ChessBoard({ fen, orientation = "white", fit = "width" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(ref, { width: 280, height: 280 });
  const basis = fit === "contain" ? Math.min(width, height) : width;
  // Floor 48 lets the small compare-panel thumbnail (~96px) render without overflow; cap 360 for phones.
  const boardWidth = Math.max(48, Math.min(360, basis));

  return (
    <div className="chessboard" ref={ref}>
      {/* Inner box is exactly boardWidth and centered, so the board stays
         centered even when the measured slot is wider than the board. */}
      <div className="chessboard-board" style={{ width: boardWidth, height: boardWidth, margin: "0 auto" }}>
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
    </div>
  );
}
