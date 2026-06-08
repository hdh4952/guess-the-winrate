import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCounts, _clearCache } from "./lichessApi";

beforeEach(() => _clearCache());

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("fetchCounts", () => {
  it("requests the explorer with play, speeds and ratings params", async () => {
    const f = mockFetch({ white: 10, draws: 5, black: 3 });
    const counts = await fetchCounts(["e2e4", "e7e5"], 1600, f);
    expect(counts).toEqual({ white: 10, draws: 5, black: 3 });
    const url = (f.mock.calls[0][0] as string);
    expect(url).toContain("play=e2e4%2Ce7e5");
    expect(url).toContain("ratings=1600");
    expect(url).toContain("speeds=blitz%2Crapid%2Cclassical");
  });

  it("caches by moves+bucket and does not refetch", async () => {
    const f = mockFetch({ white: 1, draws: 1, black: 1 });
    await fetchCounts(["e2e4"], 1000, f);
    await fetchCounts(["e2e4"], 1000, f);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("throws on a non-ok response", async () => {
    const f = mockFetch({}, false, 429);
    await expect(fetchCounts(["e2e4"], 0, f)).rejects.toThrow("429");
  });

  it("sends an Authorization header when VITE_LICHESS_TOKEN is set", async () => {
    vi.stubEnv("VITE_LICHESS_TOKEN", "test-token");
    const f = mockFetch({ white: 1, draws: 1, black: 1 });
    await fetchCounts(["e2e4"], 0, f);
    const init = f.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-token"
    );
    vi.unstubAllEnvs();
  });

  it("omits the Authorization header when no token is set", async () => {
    vi.stubEnv("VITE_LICHESS_TOKEN", "");
    const f = mockFetch({ white: 1, draws: 1, black: 1 });
    await fetchCounts(["e2e4"], 0, f);
    expect(f.mock.calls[0][1]).toBeUndefined();
    vi.unstubAllEnvs();
  });
});
