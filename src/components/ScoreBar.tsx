interface Props {
  streak: number;
  best: number;
}

export function ScoreBar({ streak, best }: Props) {
  return (
    <div className="score-bar">
      <span>현재 연속: <strong>{streak}</strong></span>
      <span>최고 기록: <strong>{best}</strong></span>
    </div>
  );
}
