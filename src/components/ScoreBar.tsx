import { useT } from "../i18n/useT";

interface Props {
  streak: number;
  best: number;
}

export function ScoreBar({ streak, best }: Props) {
  const t = useT();
  return (
    <div className="score-bar">
      <span>{t.streak}: <strong>{streak}</strong></span>
      <span>{t.best}: <strong>{best}</strong></span>
    </div>
  );
}
