import type { Counts, Perspective } from "../types";
import { totalGames, winRate } from "../lib/winrate";
import { useT } from "../i18n/useT";

interface Props {
  counts: Counts;
  perspective: Perspective;
}

export function ResultBars({ counts, perspective }: Props) {
  const t = useT();
  const total = totalGames(counts);
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  const rate = winRate(counts, perspective) * 100;
  const side = perspective === "white" ? t.white : t.black;

  return (
    <div className="result-bars">
      <div className="bar">
        <span className="seg white" style={{ width: `${pct(counts.white)}%` }} />
        <span className="seg draw" style={{ width: `${pct(counts.draws)}%` }} />
        <span className="seg black" style={{ width: `${pct(counts.black)}%` }} />
      </div>
      <div className="bar-legend">
        <span>{t.white} {pct(counts.white).toFixed(1)}%</span>
        <span>{t.draw} {pct(counts.draws).toFixed(1)}%</span>
        <span>{t.black} {pct(counts.black).toFixed(1)}%</span>
      </div>
      <div className="rate">
        {t.winRateLabel(side)} <strong>{rate.toFixed(1)}%</strong>
        <span className="sample"> {t.games(total)}</span>
      </div>
    </div>
  );
}
