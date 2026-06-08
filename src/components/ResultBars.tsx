import type { Counts, Perspective } from "../types";
import { totalGames, winRate } from "../lib/winrate";

interface Props {
  counts: Counts;
  perspective: Perspective;
}

export function ResultBars({ counts, perspective }: Props) {
  const total = totalGames(counts);
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  const rate = winRate(counts, perspective) * 100;

  return (
    <div className="result-bars">
      <div className="bar">
        <span className="seg white" style={{ width: `${pct(counts.white)}%` }} />
        <span className="seg draw" style={{ width: `${pct(counts.draws)}%` }} />
        <span className="seg black" style={{ width: `${pct(counts.black)}%` }} />
      </div>
      <div className="bar-legend">
        <span>백 {pct(counts.white).toFixed(1)}%</span>
        <span>무 {pct(counts.draws).toFixed(1)}%</span>
        <span>흑 {pct(counts.black).toFixed(1)}%</span>
      </div>
      <div className="rate">
        {perspective === "white" ? "백" : "흑"} 승률 <strong>{rate.toFixed(1)}%</strong>
        <span className="sample"> ({total.toLocaleString()}판)</span>
      </div>
    </div>
  );
}
