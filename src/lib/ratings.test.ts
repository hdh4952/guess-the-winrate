import { describe, it, expect } from "vitest";
import { RATING_BANDS, bandLabel } from "./ratings";

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

describe("bandLabel", () => {
  it("returns the label for a known bucket", () => {
    expect(bandLabel(1600)).toBe("1600-1800");
    expect(bandLabel(0)).toBe("0-1000");
    expect(bandLabel(2500)).toBe("2500+");
  });

  it("falls back to the bucket number for an unknown bucket", () => {
    expect(bandLabel(1234)).toBe("1234");
  });
});
