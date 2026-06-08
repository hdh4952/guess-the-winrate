import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "./useMediaQuery";

function mockMatchMedia(initial: boolean) {
  let cb: (() => void) | null = null;
  const mql = {
    matches: initial,
    media: "",
    addEventListener: (_: string, fn: () => void) => {
      cb = fn;
    },
    removeEventListener: () => {
      cb = null;
    },
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    fire(next: boolean) {
      mql.matches = next;
      act(() => cb?.());
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMediaQuery", () => {
  it("returns true when the query matches", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 600px)"));
    expect(result.current).toBe(true);
  });

  it("returns false when the query does not match", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 600px)"));
    expect(result.current).toBe(false);
  });

  it("updates when the media query changes", () => {
    const m = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 600px)"));
    expect(result.current).toBe(false);
    m.fire(true);
    expect(result.current).toBe(true);
  });
});
