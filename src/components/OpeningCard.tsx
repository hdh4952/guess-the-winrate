import { useMemo, useState } from "react";
import type { OpeningEntry, Counts, Perspective } from "../types";
import { fensForUci } from "../lib/positions";
import { ChessBoard } from "./ChessBoard";
import { ResultBars } from "./ResultBars";

interface Props {
  opening: OpeningEntry;
  perspective: Perspective;
  revealed: boolean;
  onPick: () => void;
  counts?: Counts;
  outcome?: "correct" | "wrong";
}

function formatMoves(san: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < san.length; i += 2) {
    const num = i / 2 + 1;
    const white = san[i];
    const black = san[i + 1] ?? "";
    parts.push(`${num}. ${white}${black ? " " + black : ""}`);
  }
  return parts.join("  ");
}

export function OpeningCard({ opening, perspective, revealed, onPick, counts, outcome }: Props) {
  // FEN after every ply (index 0 = start position, last = final position).
  const fens = useMemo(() => fensForUci(opening.uciMoves), [opening.uciMoves]);
  const total = opening.uciMoves.length;
  // Start showing the full (final) position; the arrows scrub backward/forward.
  const [ply, setPly] = useState(total);

  const className = ["opening-card", revealed ? "revealed" : "", outcome ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <ChessBoard fen={fens[ply]} orientation={perspective} />
      <div className="board-controls">
        <button
          type="button"
          className="step"
          onClick={() => setPly(0)}
          disabled={ply === 0}
          aria-label="처음 포지션"
        >
          ⏮
        </button>
        <button
          type="button"
          className="step"
          onClick={() => setPly((p) => Math.max(0, p - 1))}
          disabled={ply === 0}
          aria-label="이전 수"
        >
          ←
        </button>
        <span className="ply-counter">
          수 {ply}/{total}
        </span>
        <button
          type="button"
          className="step"
          onClick={() => setPly((p) => Math.min(total, p + 1))}
          disabled={ply === total}
          aria-label="다음 수"
        >
          →
        </button>
      </div>
      <h3 className="opening-name">{opening.name}</h3>
      <p className="opening-moves">{formatMoves(opening.sanMoves)}</p>
      {revealed && counts ? (
        <ResultBars counts={counts} perspective={perspective} />
      ) : (
        <button
          type="button"
          className="pick-button"
          onClick={onPick}
          disabled={revealed}
        >
          이 오프닝 선택
        </button>
      )}
    </div>
  );
}
