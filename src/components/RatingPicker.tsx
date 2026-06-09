import { RATING_BANDS } from "../lib/ratings";
import { useT } from "../i18n/useT";

interface Props {
  onSelect: (bucket: number) => void;
}

export function RatingPicker({ onSelect }: Props) {
  const t = useT();
  return (
    <div className="rating-picker">
      <h2>{t.pickRating}</h2>
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
