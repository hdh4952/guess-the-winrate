import { RATING_BANDS } from "../lib/ratings";

interface Props {
  onSelect: (bucket: number) => void;
}

export function RatingPicker({ onSelect }: Props) {
  return (
    <div className="rating-picker">
      <h2>레이팅 구간을 선택하세요</h2>
      <div className="rating-grid">
        {RATING_BANDS.map((band) => (
          <button key={band.bucket} type="button" onClick={() => onSelect(band.bucket)}>
            {band.label}
          </button>
        ))}
      </div>
    </div>
  );
}
