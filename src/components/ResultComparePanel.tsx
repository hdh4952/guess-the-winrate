import type { OpeningEntry, Counts, Perspective } from "../types";
import { ChessBoard } from "./ChessBoard";
import { ResultBars } from "./ResultBars";
import { higherWinRateIndex } from "../lib/winrate";

interface Props {
  a: OpeningEntry;
  b: OpeningEntry;
  countsA: Counts;
  countsB: Counts;
  perspective: Perspective;
  choice: 0 | 1 | null;
  onNext: () => void;
}

/** Mobile reveal view: compact two-row comparison of both openings. */
export function ResultComparePanel({
  a, b, countsA, countsB, perspective, choice, onNext,
}: Props) {
  const correct = higherWinRateIndex(countsA, countsB, perspective);
  const rows = [
    { o: a, counts: countsA, i: 0 as const },
    { o: b, counts: countsB, i: 1 as const },
  ];

  return (
    <div className="compare-panel">
      {rows.map(({ o, counts, i }) => {
        const outcome = i === correct ? "correct" : i === choice ? "wrong" : "";
        return (
          <div key={o.fen} className={["compare-row", outcome].filter(Boolean).join(" ")}>
            <div className="compare-thumb">
              <ChessBoard fen={o.fen} orientation={perspective} />
            </div>
            <div className="compare-info">
              <h3 className="opening-name">
                {o.name}
                {i === correct ? <span className="tag tag-correct">정답</span> : null}
                {i === choice && i !== correct ? (
                  <span className="tag tag-wrong">내 선택</span>
                ) : null}
              </h3>
              <ResultBars counts={counts} perspective={perspective} />
            </div>
          </div>
        );
      })}
      <button className="next" type="button" onClick={onNext}>
        다음 문제
      </button>
    </div>
  );
}
