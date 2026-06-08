import { describe, it, expect } from "vitest";
import { RATING_BANDS } from "./ratings";

describe("RATING_BANDS", () => {
  it("has 9 bands in ascending bucket order", () => {
    expect(RATING_BANDS).toHaveLength(9);
    const buckets = RATING_BANDS.map((b) => b.bucket);
    expect(buckets).toEqual([0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500]);
  });

  it("maps the top band label to bucket 2500", () => {
    const top = RATING_BANDS[RATING_BANDS.length - 1];
    expect(top.label).toBe("2500+");
    expect(top.bucket).toBe(2500);
  });
});
