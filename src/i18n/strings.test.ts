import { describe, it, expect, beforeEach } from "vitest";
import { strings, detectLang } from "./strings";

describe("strings", () => {
  it("ko and en expose the same keys", () => {
    expect(Object.keys(strings.en).sort()).toEqual(Object.keys(strings.ko).sort());
  });

  it("interpolates ply counter per language", () => {
    expect(strings.ko.ply(3, 8)).toBe("수 3/8");
    expect(strings.en.ply(3, 8)).toBe("Move 3/8");
  });

  it("interpolates games sample with locale separators", () => {
    expect(strings.ko.games(12345)).toBe("(12,345판)");
    expect(strings.en.games(12345)).toBe("(12,345 games)");
  });
});

describe("detectLang", () => {
  beforeEach(() => localStorage.clear());

  it("prefers a valid saved value", () => {
    localStorage.setItem("gtw-lang", "en");
    expect(detectLang({ language: "ko-KR" } as Navigator)).toBe("en");
  });

  it("ignores an invalid saved value and falls back to navigator", () => {
    localStorage.setItem("gtw-lang", "fr");
    expect(detectLang({ language: "ko-KR" } as Navigator)).toBe("ko");
  });

  it("detects Korean browsers", () => {
    expect(detectLang({ language: "ko-KR" } as Navigator)).toBe("ko");
  });

  it("defaults non-Korean browsers to English", () => {
    expect(detectLang({ language: "en-US" } as Navigator)).toBe("en");
    expect(detectLang({ language: "de-DE" } as Navigator)).toBe("en");
  });
});
