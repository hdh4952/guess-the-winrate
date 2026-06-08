import type { OpeningEntry, Counts, Perspective } from "../types";
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
  const className = ["opening-card", revealed ? "revealed" : "clickable", outcome ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={className} onClick={onPick} disabled={revealed} type="button">
      <ChessBoard fen={opening.fen} />
      <h3 className="opening-name">{opening.name}</h3>
      <p className="opening-moves">{formatMoves(opening.sanMoves)}</p>
      {revealed && counts ? <ResultBars counts={counts} perspective={perspective} /> : null}
    </button>
  );
}
