import type { RatingBand } from "../types";

export const RATING_BANDS: RatingBand[] = [
  { label: "0-1000", bucket: 0 },
  { label: "1000-1200", bucket: 1000 },
  { label: "1200-1400", bucket: 1200 },
  { label: "1400-1600", bucket: 1400 },
  { label: "1600-1800", bucket: 1600 },
  { label: "1800-2000", bucket: 1800 },
  { label: "2000-2200", bucket: 2000 },
  { label: "2200-2500", bucket: 2200 },
  { label: "2500+", bucket: 2500 },
];

/** Display label for a rating bucket, falling back to the number if unknown. */
export function bandLabel(bucket: number): string {
  return RATING_BANDS.find((b) => b.bucket === bucket)?.label ?? String(bucket);
}
