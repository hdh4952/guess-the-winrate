# Guess the Winrate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser game that shows two named chess openings and asks the player to guess which one has the higher win rate (from a randomly chosen white/black perspective) in a selected rating band, using Lichess Opening Explorer data.

**Architecture:** Pure client-side React SPA. A build-time script converts the Lichess opening dictionary (TSV) into a bundled `openings.json` (≥6 ply, named). At runtime the app picks two distinct openings, fetches win/draw/loss counts from the Lichess Opening Explorer API for the chosen rating band, and runs a streak-based guessing loop. The chessboard is rendered from a precomputed FEN with no runtime chess dependency.

**Tech Stack:** React + Vite + TypeScript, Vitest + @testing-library/react for tests, chess.js (build script only) for PGN→FEN/UCI conversion.

---

## File Structure

- `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html` — project scaffold + Vitest config
- `src/main.tsx` — React entry
- `src/types.ts` — shared types (`OpeningEntry`, `Counts`, `Perspective`, `Round`, `RatingBand`)
- `src/lib/ratings.ts` — rating band → Lichess bucket mapping
- `src/lib/fen.ts` — FEN board-part parsing for rendering
- `src/lib/winrate.ts` — pure win-rate math + answer judging
- `src/lib/lichessApi.ts` — Explorer API fetch + in-memory cache
- `src/lib/round.ts` — opening selection + round generation (retry on low sample / tie)
- `src/data/openings.json` — generated opening dictionary
- `scripts/build-openings.ts` — generates `openings.json` from Lichess TSVs
- `src/components/ChessBoard.tsx` — static board from FEN
- `src/components/ResultBars.tsx` — W/D/L bar + win-rate % + sample count
- `src/components/OpeningCard.tsx` — board + name + SAN moves (+ result when revealed)
- `src/components/ScoreBar.tsx` — current streak / best
- `src/components/RatingPicker.tsx` — start screen band selector
- `src/components/GameScreen.tsx` — round lifecycle (uses `round.ts`)
- `src/App.tsx` — top-level state (screen routing, best streak via localStorage)
- `src/styles.css` — styling

---

## Task 1: Project scaffold + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/lib/sanity.test.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "guess-the-winrate",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "build:openings": "tsx scripts/build-openings.ts"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "chess.js": "^1.0.0-beta.8",
    "jsdom": "^25.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "scripts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

- [ ] **Step 5: Create `src/test-setup.ts`**

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 6: Create `index.html`**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Guess the Winrate</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `src/App.tsx` (temporary stub)**

```tsx
export default function App() {
  return <h1>Guess the Winrate</h1>;
}
```

- [ ] **Step 8: Create `src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 9: Write a sanity test `src/lib/sanity.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 10: Install dependencies**

Run: `npm install`
Expected: completes without error, creates `node_modules/`.

- [ ] **Step 11: Run the sanity test**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Vitest project"
```

---

## Task 2: Shared types + rating bands

**Files:**
- Create: `src/types.ts`, `src/lib/ratings.ts`, `src/lib/ratings.test.ts`

- [ ] **Step 1: Create `src/types.ts`**

```ts
export interface OpeningEntry {
  eco: string;
  name: string;
  sanMoves: string[];
  uciMoves: string[];
  fen: string;
}

export interface Counts {
  white: number;
  draws: number;
  black: number;
}

export type Perspective = "white" | "black";

export interface RatingBand {
  label: string;
  bucket: number;
}

export interface Round {
  a: OpeningEntry;
  b: OpeningEntry;
  countsA: Counts;
  countsB: Counts;
  perspective: Perspective;
}
```

- [ ] **Step 2: Write failing test `src/lib/ratings.test.ts`**

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/ratings.test.ts`
Expected: FAIL ("Failed to resolve import './ratings'").

- [ ] **Step 4: Create `src/lib/ratings.ts`**

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/ratings.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add shared types and rating bands"
```

---

## Task 3: FEN board parsing

**Files:**
- Create: `src/lib/fen.ts`, `src/lib/fen.test.ts`

- [ ] **Step 1: Write failing test `src/lib/fen.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { fenToBoard } from "./fen";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("fenToBoard", () => {
  it("returns 8 ranks of 8 squares", () => {
    const board = fenToBoard(START);
    expect(board).toHaveLength(8);
    for (const rank of board) expect(rank).toHaveLength(8);
  });

  it("places pieces and empties from the placement field", () => {
    const board = fenToBoard(START);
    expect(board[0][0]).toBe("r");
    expect(board[0][4]).toBe("k");
    expect(board[7][4]).toBe("K");
    expect(board[4][0]).toBeNull(); // empty middle rank
  });

  it("ignores trailing FEN fields", () => {
    const board = fenToBoard("8/8/8/8/8/8/8/8 w - - 0 1");
    expect(board.flat().every((sq) => sq === null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/fen.test.ts`
Expected: FAIL ("Failed to resolve import './fen'").

- [ ] **Step 3: Create `src/lib/fen.ts`**

```ts
/** Parse the piece-placement field of a FEN into an 8x8 grid.
 * Row 0 is rank 8 (Black's back rank); column 0 is file a. */
export function fenToBoard(fen: string): (string | null)[][] {
  const placement = fen.split(" ")[0];
  return placement.split("/").map((row) => {
    const squares: (string | null)[] = [];
    for (const ch of row) {
      if (ch >= "1" && ch <= "8") {
        for (let k = 0; k < Number(ch); k++) squares.push(null);
      } else {
        squares.push(ch);
      }
    }
    return squares;
  });
}

export const PIECE_GLYPHS: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/fen.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add FEN board parsing"
```

---

## Task 4: Win-rate math + answer judging

**Files:**
- Create: `src/lib/winrate.ts`, `src/lib/winrate.test.ts`

- [ ] **Step 1: Write failing test `src/lib/winrate.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { totalGames, winRate, higherWinRateIndex, isCorrect } from "./winrate";
import type { Counts } from "../types";

const a: Counts = { white: 60, draws: 20, black: 20 }; // 100 games
const b: Counts = { white: 40, draws: 20, black: 40 }; // 100 games

describe("winrate helpers", () => {
  it("totalGames sums the three counts", () => {
    expect(totalGames(a)).toBe(100);
  });

  it("winRate computes white and black share", () => {
    expect(winRate(a, "white")).toBeCloseTo(0.6);
    expect(winRate(a, "black")).toBeCloseTo(0.2);
  });

  it("winRate returns 0 for an empty position", () => {
    expect(winRate({ white: 0, draws: 0, black: 0 }, "white")).toBe(0);
  });

  it("higherWinRateIndex picks the larger side per perspective", () => {
    expect(higherWinRateIndex(a, b, "white")).toBe(0);
    expect(higherWinRateIndex(a, b, "black")).toBe(1);
  });

  it("higherWinRateIndex returns null on a tie", () => {
    expect(higherWinRateIndex(a, a, "white")).toBeNull();
  });

  it("isCorrect compares the chosen index to the higher one", () => {
    expect(isCorrect(0, a, b, "white")).toBe(true);
    expect(isCorrect(1, a, b, "white")).toBe(false);
    expect(isCorrect(1, a, b, "black")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/winrate.test.ts`
Expected: FAIL ("Failed to resolve import './winrate'").

- [ ] **Step 3: Create `src/lib/winrate.ts`**

```ts
import type { Counts, Perspective } from "../types";

export function totalGames(c: Counts): number {
  return c.white + c.draws + c.black;
}

export function winRate(c: Counts, p: Perspective): number {
  const total = totalGames(c);
  if (total === 0) return 0;
  return (p === "white" ? c.white : c.black) / total;
}

/** Index (0 or 1) of the counts with the higher win rate, or null if tied. */
export function higherWinRateIndex(
  a: Counts,
  b: Counts,
  p: Perspective
): 0 | 1 | null {
  const ra = winRate(a, p);
  const rb = winRate(b, p);
  if (ra === rb) return null;
  return ra > rb ? 0 : 1;
}

export function isCorrect(
  choice: 0 | 1,
  a: Counts,
  b: Counts,
  p: Perspective
): boolean {
  return higherWinRateIndex(a, b, p) === choice;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/winrate.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add win-rate math and answer judging"
```

---

## Task 5: Lichess Explorer API client

**Files:**
- Create: `src/lib/lichessApi.ts`, `src/lib/lichessApi.test.ts`

- [ ] **Step 1: Write failing test `src/lib/lichessApi.test.ts`**

```ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lichessApi.test.ts`
Expected: FAIL ("Failed to resolve import './lichessApi'").

- [ ] **Step 3: Create `src/lib/lichessApi.ts`**

```ts
import type { Counts } from "../types";

const BASE = "https://explorer.lichess.ovh/lichess";
const cache = new Map<string, Counts>();

type FetchImpl = (input: string) => Promise<Response>;

export async function fetchCounts(
  uciMoves: string[],
  ratingBucket: number,
  fetchImpl: FetchImpl = fetch
): Promise<Counts> {
  const key = `${ratingBucket}:${uciMoves.join(",")}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    variant: "standard",
    play: uciMoves.join(","),
    speeds: "blitz,rapid,classical",
    ratings: String(ratingBucket),
  });
  const res = await fetchImpl(`${BASE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Lichess API error: ${res.status}`);
  }
  const data = (await res.json()) as { white: number; draws: number; black: number };
  const counts: Counts = { white: data.white, draws: data.draws, black: data.black };
  cache.set(key, counts);
  return counts;
}

/** Test-only: clear the in-memory cache. */
export function _clearCache(): void {
  cache.clear();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lichessApi.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Lichess Explorer API client with cache"
```

---

## Task 6: Opening selection + round generation

**Files:**
- Create: `src/lib/round.ts`, `src/lib/round.test.ts`

- [ ] **Step 1: Write failing test `src/lib/round.test.ts`**

```ts
import { describe, it, expect, vi } from "vitest";
import { pickTwoDistinct, generateRound } from "./round";
import type { OpeningEntry, Counts } from "../types";

function op(name: string): OpeningEntry {
  return { eco: "X", name, sanMoves: [], uciMoves: [name], fen: "8/8/8/8/8/8/8/8 w - - 0 1" };
}

const openings = [op("A"), op("B"), op("C"), op("D")];

/** Deterministic rng yielding the given values then repeating the last. */
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("pickTwoDistinct", () => {
  it("returns two different openings", () => {
    const [a, b] = pickTwoDistinct(openings, seq([0, 0]));
    expect(a.name).toBe("A");
    expect(b.name).not.toBe("A");
  });

  it("throws when fewer than two openings", () => {
    expect(() => pickTwoDistinct([op("A")], Math.random)).toThrow();
  });
});

describe("generateRound", () => {
  it("returns a valid round when samples are sufficient and not tied", async () => {
    const fc = vi.fn(async (uci: string[]): Promise<Counts> => {
      if (uci[0] === "A") return { white: 6000, draws: 2000, black: 2000 };
      return { white: 4000, draws: 2000, black: 4000 };
    });
    // rng: pick A (0), pick B (0 -> bumped to index 1), perspective white (<0.5)
    const round = await generateRound(openings, 1600, {
      rng: seq([0, 0, 0.1]),
      fetchCounts: fc,
      minGames: 1000,
    });
    expect(round.a.name).toBe("A");
    expect(round.b.name).toBe("B");
    expect(round.perspective).toBe("white");
    expect(round.countsA.white).toBe(6000);
  });

  it("retries when a sample is below the minimum", async () => {
    const calls: string[][] = [];
    const fc = vi.fn(async (uci: string[]): Promise<Counts> => {
      calls.push(uci);
      // First attempt's openings are tiny; later attempts are large.
      return calls.length <= 2
        ? { white: 1, draws: 1, black: 1 }
        : { white: 5000, draws: 1000, black: 2000 };
    });
    const round = await generateRound(openings, 0, {
      rng: seq([0, 0, 0.1]),
      fetchCounts: fc,
      minGames: 1000,
    });
    expect(fc.mock.calls.length).toBeGreaterThan(2);
    expect(round).toBeTruthy();
  });

  it("throws after maxAttempts when no valid round is found", async () => {
    const fc = vi.fn(async (): Promise<Counts> => ({ white: 1, draws: 1, black: 1 }));
    await expect(
      generateRound(openings, 0, { rng: seq([0, 0, 0.1]), fetchCounts: fc, minGames: 1000, maxAttempts: 3 })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/round.test.ts`
Expected: FAIL ("Failed to resolve import './round'").

- [ ] **Step 3: Create `src/lib/round.ts`**

```ts
import type { OpeningEntry, Counts, Perspective, Round } from "../types";
import { fetchCounts as defaultFetchCounts } from "./lichessApi";
import { totalGames, higherWinRateIndex } from "./winrate";

export function pickTwoDistinct(
  openings: OpeningEntry[],
  rng: () => number = Math.random
): [OpeningEntry, OpeningEntry] {
  if (openings.length < 2) throw new Error("Need at least 2 openings");
  const i = Math.floor(rng() * openings.length);
  let j = Math.floor(rng() * (openings.length - 1));
  if (j >= i) j++;
  return [openings[i], openings[j]];
}

export interface GenerateOpts {
  minGames?: number;
  maxAttempts?: number;
  rng?: () => number;
  fetchCounts?: (uci: string[], bucket: number) => Promise<Counts>;
}

export async function generateRound(
  openings: OpeningEntry[],
  ratingBucket: number,
  opts: GenerateOpts = {}
): Promise<Round> {
  const {
    minGames = 1000,
    maxAttempts = 20,
    rng = Math.random,
    fetchCounts = defaultFetchCounts,
  } = opts;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const [a, b] = pickTwoDistinct(openings, rng);
    const perspective: Perspective = rng() < 0.5 ? "white" : "black";
    const [countsA, countsB] = await Promise.all([
      fetchCounts(a.uciMoves, ratingBucket),
      fetchCounts(b.uciMoves, ratingBucket),
    ]);
    if (totalGames(countsA) < minGames || totalGames(countsB) < minGames) continue;
    if (higherWinRateIndex(countsA, countsB, perspective) === null) continue;
    return { a, b, countsA, countsB, perspective };
  }
  throw new Error("Could not generate a valid round");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/round.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add opening selection and round generation"
```

---

## Task 7: Opening dictionary build script

**Files:**
- Create: `scripts/build-openings.ts`
- Generate: `src/data/openings.json`

- [ ] **Step 1: Create `scripts/build-openings.ts`**

```ts
/**
 * Builds src/data/openings.json from the Lichess opening dictionary TSVs.
 * Keeps only openings with >= 6 plies and precomputes SAN, UCI and final FEN.
 * Run with: npm run build:openings
 */
import { Chess } from "chess.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface OpeningEntry {
  eco: string;
  name: string;
  sanMoves: string[];
  uciMoves: string[];
  fen: string;
}

const FILES = ["a", "b", "c", "d", "e"];
const BASE =
  "https://raw.githubusercontent.com/lichess-org/chess-openings/master";
const MIN_PLIES = 6;

async function fetchTsv(letter: string): Promise<string> {
  const res = await fetch(`${BASE}/${letter}.tsv`);
  if (!res.ok) throw new Error(`Failed to fetch ${letter}.tsv: ${res.status}`);
  return res.text();
}

function parseRow(line: string): OpeningEntry | null {
  const [eco, name, pgn] = line.split("\t");
  if (!eco || !name || !pgn) return null;
  const chess = new Chess();
  chess.loadPgn(pgn);
  const verbose = chess.history({ verbose: true });
  if (verbose.length < MIN_PLIES) return null;
  const sanMoves = chess.history();
  const uciMoves = verbose.map((m) => m.from + m.to + (m.promotion ?? ""));
  return { eco, name, sanMoves, uciMoves, fen: chess.fen() };
}

async function main() {
  const entries: OpeningEntry[] = [];
  for (const letter of FILES) {
    const tsv = await fetchTsv(letter);
    const lines = tsv.split("\n").slice(1); // drop header
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = parseRow(line);
        if (entry) entries.push(entry);
      } catch {
        // skip malformed rows
      }
    }
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(here, "../src/data/openings.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(entries));
  console.log(`Wrote ${entries.length} openings to ${outPath}`);
}

main();
```

- [ ] **Step 2: Run the build script**

Run: `npm run build:openings`
Expected: prints `Wrote <N> openings to .../src/data/openings.json` with N in the low thousands (≈3000+).

- [ ] **Step 3: Sanity-check the output**

Run: `node -e "const d=require('./src/data/openings.json'); console.log(d.length, d[0]); console.log('min plies', Math.min(...d.map(o=>o.uciMoves.length)))"`
Expected: length > 1000; every entry has `uciMoves.length >= 6`; first entry has `eco`, `name`, `sanMoves`, `uciMoves`, `fen`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add opening dictionary build script and generated data"
```

---

## Task 8: ChessBoard component

**Files:**
- Create: `src/components/ChessBoard.tsx`, `src/components/ChessBoard.test.tsx`

- [ ] **Step 1: Write failing test `src/components/ChessBoard.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChessBoard } from "./ChessBoard";

describe("ChessBoard", () => {
  it("renders 64 squares", () => {
    const { container } = render(
      <ChessBoard fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />
    );
    expect(container.querySelectorAll(".square")).toHaveLength(64);
  });

  it("renders piece glyphs for occupied squares", () => {
    const { getAllByText } = render(
      <ChessBoard fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />
    );
    expect(getAllByText("♙").length).toBe(8); // white pawns
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ChessBoard.test.tsx`
Expected: FAIL ("Failed to resolve import './ChessBoard'").

- [ ] **Step 3: Create `src/components/ChessBoard.tsx`**

```tsx
import { fenToBoard, PIECE_GLYPHS } from "../lib/fen";

interface Props {
  fen: string;
}

export function ChessBoard({ fen }: Props) {
  const board = fenToBoard(fen);
  return (
    <div className="chessboard">
      {board.map((rank, r) =>
        rank.map((piece, c) => {
          const dark = (r + c) % 2 === 1;
          return (
            <div key={`${r}-${c}`} className={`square ${dark ? "dark" : "light"}`}>
              {piece ? (
                <span className={piece === piece.toUpperCase() ? "white-piece" : "black-piece"}>
                  {PIECE_GLYPHS[piece]}
                </span>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ChessBoard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add ChessBoard component"
```

---

## Task 9: ResultBars component

**Files:**
- Create: `src/components/ResultBars.tsx`, `src/components/ResultBars.test.tsx`

- [ ] **Step 1: Write failing test `src/components/ResultBars.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ResultBars } from "./ResultBars";

describe("ResultBars", () => {
  it("shows the perspective win-rate percentage and sample count", () => {
    const { getByText } = render(
      <ResultBars counts={{ white: 60, draws: 20, black: 20 }} perspective="white" />
    );
    expect(getByText(/60(\.0)?%/)).toBeInTheDocument();
    expect(getByText(/100/)).toBeInTheDocument(); // total games
  });

  it("uses the black share when perspective is black", () => {
    const { getByText } = render(
      <ResultBars counts={{ white: 60, draws: 20, black: 20 }} perspective="black" />
    );
    expect(getByText(/20(\.0)?%/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ResultBars.test.tsx`
Expected: FAIL ("Failed to resolve import './ResultBars'").

- [ ] **Step 3: Create `src/components/ResultBars.tsx`**

```tsx
import type { Counts, Perspective } from "../types";
import { totalGames, winRate } from "../lib/winrate";

interface Props {
  counts: Counts;
  perspective: Perspective;
}

export function ResultBars({ counts, perspective }: Props) {
  const total = totalGames(counts);
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  const rate = winRate(counts, perspective) * 100;

  return (
    <div className="result-bars">
      <div className="bar">
        <span className="seg white" style={{ width: `${pct(counts.white)}%` }} />
        <span className="seg draw" style={{ width: `${pct(counts.draws)}%` }} />
        <span className="seg black" style={{ width: `${pct(counts.black)}%` }} />
      </div>
      <div className="bar-legend">
        <span>백 {pct(counts.white).toFixed(1)}%</span>
        <span>무 {pct(counts.draws).toFixed(1)}%</span>
        <span>흑 {pct(counts.black).toFixed(1)}%</span>
      </div>
      <div className="rate">
        {perspective === "white" ? "백" : "흑"} 승률 <strong>{rate.toFixed(1)}%</strong>
        <span className="sample"> ({total.toLocaleString()}판)</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ResultBars.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add ResultBars component"
```

---

## Task 10: OpeningCard component

**Files:**
- Create: `src/components/OpeningCard.tsx`, `src/components/OpeningCard.test.tsx`

- [ ] **Step 1: Write failing test `src/components/OpeningCard.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { OpeningCard } from "./OpeningCard";
import type { OpeningEntry } from "../types";

const opening: OpeningEntry = {
  eco: "C50",
  name: "Italian Game",
  sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
  uciMoves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5"],
  fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
};

describe("OpeningCard", () => {
  it("shows the opening name and SAN moves", () => {
    const { getByText } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={() => {}} />
    );
    expect(getByText("Italian Game")).toBeInTheDocument();
    expect(getByText(/1\.\s*e4\s*e5/)).toBeInTheDocument();
  });

  it("calls onPick when clicked and not revealed", () => {
    const onPick = vi.fn();
    const { getByRole } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={onPick} />
    );
    fireEvent.click(getByRole("button"));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("shows results only when revealed", () => {
    const { queryByText, rerender, getByText } = render(
      <OpeningCard opening={opening} perspective="white" revealed={false} onPick={() => {}}
        counts={{ white: 60, draws: 20, black: 20 }} />
    );
    expect(queryByText(/승률/)).toBeNull();
    rerender(
      <OpeningCard opening={opening} perspective="white" revealed={true} onPick={() => {}}
        counts={{ white: 60, draws: 20, black: 20 }} />
    );
    expect(getByText(/승률/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/OpeningCard.test.tsx`
Expected: FAIL ("Failed to resolve import './OpeningCard'").

- [ ] **Step 3: Create `src/components/OpeningCard.tsx`**

```tsx
import type { OpeningEntry, Counts, Perspective } from "../types";
import { ChessBoard } from "./ChessBoard";
import { ResultBars } from "./ResultBars";

interface Props {
  opening: OpeningEntry;
  perspective: Perspective;
  revealed: boolean;
  onPick: () => void;
  counts?: Counts;
  outcome?: "correct" | "wrong";
}

function formatMoves(san: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < san.length; i += 2) {
    const num = i / 2 + 1;
    const white = san[i];
    const black = san[i + 1] ?? "";
    parts.push(`${num}. ${white}${black ? " " + black : ""}`);
  }
  return parts.join("  ");
}

export function OpeningCard({ opening, perspective, revealed, onPick, counts, outcome }: Props) {
  const className = ["opening-card", revealed ? "revealed" : "clickable", outcome ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={className} onClick={onPick} disabled={revealed} type="button">
      <ChessBoard fen={opening.fen} />
      <h3 className="opening-name">{opening.name}</h3>
      <p className="opening-moves">{formatMoves(opening.sanMoves)}</p>
      {revealed && counts ? <ResultBars counts={counts} perspective={perspective} /> : null}
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/OpeningCard.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add OpeningCard component"
```

---

## Task 11: ScoreBar + RatingPicker components

**Files:**
- Create: `src/components/ScoreBar.tsx`, `src/components/RatingPicker.tsx`, `src/components/RatingPicker.test.tsx`

- [ ] **Step 1: Write failing test `src/components/RatingPicker.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RatingPicker } from "./RatingPicker";

describe("RatingPicker", () => {
  it("renders all 9 bands and reports the chosen bucket", () => {
    const onSelect = vi.fn();
    const { getByText, container } = render(<RatingPicker onSelect={onSelect} />);
    expect(container.querySelectorAll("button")).toHaveLength(9);
    fireEvent.click(getByText("1600-1800"));
    expect(onSelect).toHaveBeenCalledWith(1600);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/RatingPicker.test.tsx`
Expected: FAIL ("Failed to resolve import './RatingPicker'").

- [ ] **Step 3: Create `src/components/RatingPicker.tsx`**

```tsx
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
```

- [ ] **Step 4: Create `src/components/ScoreBar.tsx`**

```tsx
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/RatingPicker.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add ScoreBar and RatingPicker components"
```

---

## Task 12: GameScreen + App wiring

**Files:**
- Create: `src/components/GameScreen.tsx`
- Modify: `src/App.tsx` (replace stub)

- [ ] **Step 1: Create `src/components/GameScreen.tsx`**

```tsx
import { useCallback, useEffect, useState } from "react";
import type { OpeningEntry, Round } from "../types";
import { generateRound } from "../lib/round";
import { isCorrect } from "../lib/winrate";
import { OpeningCard } from "./OpeningCard";
import { ScoreBar } from "./ScoreBar";

interface Props {
  openings: OpeningEntry[];
  ratingBucket: number;
  streak: number;
  best: number;
  onAnswer: (correct: boolean) => void;
}

type Status = "loading" | "ready" | "revealed" | "error";

export function GameScreen({ openings, ratingBucket, streak, best, onAnswer }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [round, setRound] = useState<Round | null>(null);
  const [choice, setChoice] = useState<0 | 1 | null>(null);

  const loadRound = useCallback(async () => {
    setStatus("loading");
    setChoice(null);
    setRound(null);
    try {
      const r = await generateRound(openings, ratingBucket);
      setRound(r);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [openings, ratingBucket]);

  useEffect(() => {
    loadRound();
  }, [loadRound]);

  const pick = (index: 0 | 1) => {
    if (status !== "ready" || !round) return;
    setChoice(index);
    setStatus("revealed");
    onAnswer(isCorrect(index, round.countsA, round.countsB, round.perspective));
  };

  if (status === "loading") return <div className="screen center">불러오는 중…</div>;
  if (status === "error")
    return (
      <div className="screen center">
        <p>문제를 불러오지 못했어요.</p>
        <button type="button" onClick={loadRound}>다시 시도</button>
      </div>
    );
  if (!round) return null;

  const correctIndex = isCorrect(0, round.countsA, round.countsB, round.perspective) ? 0 : 1;
  const outcomeFor = (i: 0 | 1): "correct" | "wrong" | undefined => {
    if (status !== "revealed") return undefined;
    if (i === correctIndex) return "correct";
    if (i === choice) return "wrong";
    return undefined;
  };

  return (
    <div className="screen game">
      <ScoreBar streak={streak} best={best} />
      <h2 className="question">
        어느 쪽이 <strong>{round.perspective === "white" ? "백" : "흑"}</strong> 승률이 더 높을까요?
      </h2>
      <div className="cards">
        <OpeningCard
          opening={round.a}
          perspective={round.perspective}
          revealed={status === "revealed"}
          onPick={() => pick(0)}
          counts={round.countsA}
          outcome={outcomeFor(0)}
        />
        <OpeningCard
          opening={round.b}
          perspective={round.perspective}
          revealed={status === "revealed"}
          onPick={() => pick(1)}
          counts={round.countsB}
          outcome={outcomeFor(1)}
        />
      </div>
      {status === "revealed" ? (
        <button className="next" type="button" onClick={loadRound}>다음 문제</button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { useState } from "react";
import openingsData from "./data/openings.json";
import type { OpeningEntry } from "./types";
import { RatingPicker } from "./components/RatingPicker";
import { GameScreen } from "./components/GameScreen";
import "./styles.css";

const openings = openingsData as OpeningEntry[];
const BEST_KEY = "gtw-best-streak";

export default function App() {
  const [bucket, setBucket] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState<number>(() => {
    const saved = localStorage.getItem(BEST_KEY);
    return saved ? Number(saved) : 0;
  });

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      const next = streak + 1;
      setStreak(next);
      if (next > best) {
        setBest(next);
        localStorage.setItem(BEST_KEY, String(next));
      }
    } else {
      setStreak(0);
    }
  };

  return (
    <main className="app">
      <h1 className="title">Guess the Winrate</h1>
      {bucket === null ? (
        <RatingPicker onSelect={setBucket} />
      ) : (
        <GameScreen
          openings={openings}
          ratingBucket={bucket}
          streak={streak}
          best={best}
          onAnswer={handleAnswer}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 4: Type-check the app**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire GameScreen and App with streak tracking"
```

---

## Task 13: Styling + manual verification

**Files:**
- Create: `src/styles.css`

- [ ] **Step 1: Create `src/styles.css`**

```css
:root {
  --light: #f0d9b5;
  --dark: #b58863;
  --bg: #1a1a1a;
  --fg: #f5f5f5;
  --correct: #4caf50;
  --wrong: #e53935;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, sans-serif;
}

.app { max-width: 900px; margin: 0 auto; padding: 1.5rem; }
.title { text-align: center; }
.screen.center { text-align: center; padding: 3rem; }

.rating-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
.rating-grid button {
  padding: 1rem;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #444;
  background: #2a2a2a;
  color: var(--fg);
}
.rating-grid button:hover { background: #3a3a3a; }

.score-bar { display: flex; justify-content: space-between; margin-bottom: 1rem; }
.question { text-align: center; }

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.opening-card {
  background: #2a2a2a;
  border: 2px solid #444;
  border-radius: 10px;
  padding: 0.75rem;
  color: var(--fg);
  text-align: center;
  cursor: pointer;
  font: inherit;
}
.opening-card.clickable:hover { border-color: #888; }
.opening-card.revealed { cursor: default; }
.opening-card.correct { border-color: var(--correct); }
.opening-card.wrong { border-color: var(--wrong); }
.opening-name { margin: 0.5rem 0 0.25rem; font-size: 1rem; }
.opening-moves { margin: 0; font-size: 0.85rem; color: #bbb; }

.chessboard {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  aspect-ratio: 1 / 1;
  border: 1px solid #000;
}
.square {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(14px, 4.2vw, 26px);
  line-height: 1;
}
.square.light { background: var(--light); }
.square.dark { background: var(--dark); }
.white-piece { color: #fff; text-shadow: 0 0 2px #000; }
.black-piece { color: #000; }

.result-bars { margin-top: 0.75rem; }
.bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; }
.seg.white { background: #eee; }
.seg.draw { background: #999; }
.seg.black { background: #333; }
.bar-legend { display: flex; justify-content: space-between; font-size: 0.7rem; color: #bbb; margin-top: 2px; }
.rate { margin-top: 0.4rem; font-size: 0.9rem; }
.sample { color: #aaa; }

.next { display: block; margin: 1.5rem auto 0; padding: 0.75rem 2rem; font-size: 1rem; cursor: pointer; border-radius: 8px; border: none; background: #4a6; color: #fff; }
```

- [ ] **Step 2: Run the dev server and verify manually**

Run: `npm run dev`
Then open the printed local URL in a browser and confirm:
- The rating picker shows 9 bands.
- Selecting a band loads a round with two boards, names, and moves.
- Clicking a card reveals both W/D/L bars, win-rate %, sample counts, and marks correct/wrong.
- The streak increments on a correct answer and resets on a wrong one; best streak persists across reloads.
- "다음 문제" loads a new round.

Expected: all behaviors work; the Lichess API returns real data (check the Network tab for `explorer.lichess.ovh` 200 responses).

- [ ] **Step 3: Run the full suite once more**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add styling and finalize game UI"
```

---

## Self-Review Notes

- **Spec coverage:** data source (Task 5), rating bands incl. 2500+ (Task 2), opening dictionary ≥6 ply named (Task 7), random per-round perspective (Task 6/12), min-sample re-roll + tie re-roll (Task 6), board diagram + name + moves (Tasks 8/10), W/D/L bars + win-rate % + sample count (Task 9), streak + localStorage best (Task 12), loading/error/retry (Task 12), CORS note (below).
- **CORS fallback:** if `explorer.lichess.ovh` blocks the browser origin during Task 13, add a Vite dev proxy in `vite.config.ts` (`server.proxy["/explorer"] → https://explorer.lichess.ovh`) and switch `BASE` in `lichessApi.ts` to the proxied path. Not expected to be needed (the endpoint sends `Access-Control-Allow-Origin: *`).
- **Type consistency:** `Counts`, `Perspective`, `OpeningEntry`, `Round` defined once in `types.ts`; `fetchCounts(uci, bucket)` signature consistent across `lichessApi.ts`, `round.ts`, and tests.
```
