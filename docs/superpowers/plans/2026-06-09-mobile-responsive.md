# Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the game usable on phones (≤600px) with a swipe carousel for play and a compact compare panel for reveal, leaving the desktop two-up layout unchanged.

**Architecture:** Game logic/state stays in `GameScreen`; only the render branch differs by viewport. A `useMediaQuery` hook selects desktop vs mobile. `ChessBoard` measures its container (`useElementWidth` + ResizeObserver) for a dynamic `boardWidth`, so CSS sizes the board per context. Two new mobile-only components: `OpeningCarousel` (swipe + dots) and `ResultComparePanel`.

**Tech Stack:** React 18, TypeScript, Vite, react-chessboard, Vitest + React Testing Library.

Spec: [docs/superpowers/specs/2026-06-09-mobile-responsive-design.md](../specs/2026-06-09-mobile-responsive-design.md)

---

## File Structure

- Create: `src/hooks/useMediaQuery.ts` — matchMedia subscription hook
- Create: `src/hooks/useMediaQuery.test.ts`
- Create: `src/hooks/useElementWidth.ts` — ResizeObserver width hook
- Create: `src/hooks/useElementWidth.test.tsx`
- Modify: `src/test-setup.ts` — add `matchMedia` stub (default non-mobile)
- Modify: `src/components/ChessBoard.tsx` — container-driven `boardWidth`
- Create: `src/components/OpeningCarousel.tsx` — mobile play carousel
- Create: `src/components/OpeningCarousel.test.tsx`
- Create: `src/components/ResultComparePanel.tsx` — mobile reveal panel
- Create: `src/components/ResultComparePanel.test.tsx`
- Modify: `src/components/GameScreen.tsx` — branch on `isMobile`
- Create: `src/components/GameScreen.test.tsx`
- Modify: `src/styles.css` — carousel/dots/compare styles + `@media (max-width: 600px)`

---

## Task 1: `useMediaQuery` hook + matchMedia test stub

**Files:**
- Create: `src/hooks/useMediaQuery.ts`
- Create: `src/hooks/useMediaQuery.test.ts`
- Modify: `src/test-setup.ts`

- [ ] **Step 1: Add a `matchMedia` stub to test-setup** (so other component tests that reach `useMediaQuery` don't crash; defaults to non-mobile).

In `src/test-setup.ts`, append:

```ts
// jsdom lacks matchMedia; default to non-mobile (desktop) for component tests.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
```

- [ ] **Step 2: Write the failing test**

Create `src/hooks/useMediaQuery.test.ts`:

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/hooks/useMediaQuery.test.ts`
Expected: FAIL — cannot find module `./useMediaQuery`.

- [ ] **Step 4: Write minimal implementation**

Create `src/hooks/useMediaQuery.ts`:

```ts
import { useEffect, useState } from "react";

/** Subscribes to a CSS media query and returns whether it currently matches. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(query).matches
      : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/hooks/useMediaQuery.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Run the full suite to confirm the stub didn't break anything**

Run: `npm test`
Expected: PASS (all existing tests + the 3 new ones).

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useMediaQuery.ts src/hooks/useMediaQuery.test.ts src/test-setup.ts
git commit -m "feat: add useMediaQuery hook + matchMedia test stub"
```

---

## Task 2: `useElementWidth` hook

**Files:**
- Create: `src/hooks/useElementWidth.ts`
- Create: `src/hooks/useElementWidth.test.tsx`

- [ ] **Step 1: Write the failing test**

In jsdom, `getBoundingClientRect().width` is 0 and the ResizeObserver stub never fires, so the hook must return the fallback.

Create `src/hooks/useElementWidth.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { useRef } from "react";
import { render } from "@testing-library/react";
import { useElementWidth } from "./useElementWidth";

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref, 280);
  return (
    <div ref={ref} data-testid="probe">
      {width}
    </div>
  );
}

describe("useElementWidth", () => {
  it("returns the fallback when the element has no measurable width (jsdom)", () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("probe").textContent).toBe("280");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useElementWidth.test.tsx`
Expected: FAIL — cannot find module `./useElementWidth`.

- [ ] **Step 3: Write minimal implementation**

Create `src/hooks/useElementWidth.ts`:

```ts
import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Measures the referenced element's width (px) via ResizeObserver.
 * Returns `fallback` until a non-zero width is measured (e.g. in jsdom).
 */
export function useElementWidth(
  ref: RefObject<HTMLElement>,
  fallback = 0
): number {
  const [width, setWidth] = useState<number>(fallback);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setWidth(w > 0 ? w : fallback);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fallback]);

  return width;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useElementWidth.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useElementWidth.ts src/hooks/useElementWidth.test.tsx
git commit -m "feat: add useElementWidth hook"
```

---

## Task 3: Make `ChessBoard` container-driven

**Files:**
- Modify: `src/components/ChessBoard.tsx`

The board width becomes the measured container width (fallback 280), clamped to [120, 360]. The existing `ChessBoard.test.tsx` must still pass (DOM is unchanged: same `.chessboard` wrapper).

- [ ] **Step 1: Replace the component body**

Replace the entire contents of `src/components/ChessBoard.tsx` with:

```tsx
import { useRef } from "react";
import { Chessboard } from "react-chessboard";
import type { Perspective } from "../types";
import { useElementWidth } from "../hooks/useElementWidth";

interface Props {
  fen: string;
  /** Side shown at the bottom of the board. Defaults to white. */
  orientation?: Perspective;
}

/** Static (non-interactive) board diagram; sizes itself to its container. */
export function ChessBoard({ fen, orientation = "white" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const measured = useElementWidth(ref, 280);
  const boardWidth = Math.max(120, Math.min(360, measured));

  return (
    <div className="chessboard" ref={ref}>
      <Chessboard
        id={fen}
        position={fen}
        boardOrientation={orientation}
        arePiecesDraggable={false}
        boardWidth={boardWidth}
        customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
        customDarkSquareStyle={{ backgroundColor: "#b58863" }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run the board + card tests to verify no regression**

Run: `npx vitest run src/components/ChessBoard.test.tsx src/components/OpeningCard.test.tsx`
Expected: PASS (boards still render; fallback width 280 used in jsdom).

- [ ] **Step 3: Commit**

```bash
git add src/components/ChessBoard.tsx
git commit -m "refactor: size ChessBoard to its container (responsive boardWidth)"
```

---

## Task 4: `OpeningCarousel` component

**Files:**
- Create: `src/components/OpeningCarousel.tsx`
- Create: `src/components/OpeningCarousel.test.tsx`

Shows one `OpeningCard` at a time; switches via touch swipe (threshold 40px) or dot taps. No arrows (distinct from the move-stepper `←/→`).

- [ ] **Step 1: Write the failing test**

Create `src/components/OpeningCarousel.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { OpeningCarousel } from "./OpeningCarousel";
import type { OpeningEntry } from "../types";

function op(name: string, fen: string): OpeningEntry {
  return { eco: "X", name, sanMoves: ["e4"], uciMoves: ["e2e4"], fen, counts: {} };
}
const A = op("Italian Game", "fen-a");
const B = op("Sicilian Defense", "fen-b");

describe("OpeningCarousel", () => {
  it("shows only the first opening initially", () => {
    const { getByText, queryByText } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={() => {}} />
    );
    expect(getByText("Italian Game")).toBeInTheDocument();
    expect(queryByText("Sicilian Defense")).toBeNull();
  });

  it("switches to the second opening when the second dot is tapped", () => {
    const { getByLabelText, getByText, queryByText } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={() => {}} />
    );
    fireEvent.click(getByLabelText("오프닝 2/2"));
    expect(getByText("Sicilian Defense")).toBeInTheDocument();
    expect(queryByText("Italian Game")).toBeNull();
  });

  it("swipes left to the second opening past the threshold", () => {
    const { container, getByText } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={() => {}} />
    );
    const carousel = container.querySelector(".carousel") as HTMLElement;
    fireEvent.touchStart(carousel, { changedTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 100 }] });
    expect(getByText("Sicilian Defense")).toBeInTheDocument();
  });

  it("ignores a swipe shorter than the threshold", () => {
    const { container, getByText } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={() => {}} />
    );
    const carousel = container.querySelector(".carousel") as HTMLElement;
    fireEvent.touchStart(carousel, { changedTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 180 }] });
    expect(getByText("Italian Game")).toBeInTheDocument();
  });

  it("calls onPick with the active index", () => {
    const onPick = vi.fn();
    const { getByText, getByLabelText } = render(
      <OpeningCarousel a={A} b={B} perspective="white" onPick={onPick} />
    );
    fireEvent.click(getByText("이 오프닝 선택"));
    expect(onPick).toHaveBeenLastCalledWith(0);
    fireEvent.click(getByLabelText("오프닝 2/2"));
    fireEvent.click(getByText("이 오프닝 선택"));
    expect(onPick).toHaveBeenLastCalledWith(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/OpeningCarousel.test.tsx`
Expected: FAIL — cannot find module `./OpeningCarousel`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/OpeningCarousel.tsx`:

```tsx
import { useRef, useState } from "react";
import type { OpeningEntry, Perspective } from "../types";
import { OpeningCard } from "./OpeningCard";

interface Props {
  a: OpeningEntry;
  b: OpeningEntry;
  perspective: Perspective;
  onPick: (index: 0 | 1) => void;
}

const SWIPE_THRESHOLD = 40;

/** Mobile play view: one opening at a time, switched by swipe or dots. */
export function OpeningCarousel({ a, b, perspective, onPick }: Props) {
  const [active, setActive] = useState<0 | 1>(0);
  const startX = useRef(0);
  const openings = [a, b] as const;

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    setActive(dx < 0 ? 1 : 0);
  };

  return (
    <div className="carousel" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <OpeningCard
        key={openings[active].fen}
        opening={openings[active]}
        perspective={perspective}
        revealed={false}
        onPick={() => onPick(active)}
      />
      <div className="dots" role="tablist">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-label={`오프닝 ${i + 1}/2`}
            aria-selected={active === i}
            className={"dot" + (active === i ? " active" : "")}
            onClick={() => setActive(i as 0 | 1)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/OpeningCarousel.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/OpeningCarousel.tsx src/components/OpeningCarousel.test.tsx
git commit -m "feat: add OpeningCarousel (mobile swipe + dots)"
```

---

## Task 5: `ResultComparePanel` component

**Files:**
- Create: `src/components/ResultComparePanel.tsx`
- Create: `src/components/ResultComparePanel.test.tsx`

Two rows (small board thumbnail + name + `ResultBars`); correct row highlighted, player's wrong pick tagged, "다음 문제" button.

- [ ] **Step 1: Write the failing test**

Create `src/components/ResultComparePanel.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ResultComparePanel } from "./ResultComparePanel";
import type { OpeningEntry } from "../types";

function op(name: string, fen: string): OpeningEntry {
  return { eco: "X", name, sanMoves: ["e4"], uciMoves: ["e2e4"], fen, counts: {} };
}
const A = op("Italian Game", "fen-a"); // white 60%
const B = op("Sicilian Defense", "fen-b"); // white 40%
const countsA = { white: 60, draws: 20, black: 20 };
const countsB = { white: 40, draws: 20, black: 40 };

describe("ResultComparePanel", () => {
  it("renders both openings", () => {
    const { getByText } = render(
      <ResultComparePanel a={A} b={B} countsA={countsA} countsB={countsB}
        perspective="white" choice={0} onNext={() => {}} />
    );
    expect(getByText("Italian Game")).toBeInTheDocument();
    expect(getByText("Sicilian Defense")).toBeInTheDocument();
  });

  it("marks the correct (higher win rate) side with a tag", () => {
    const { getAllByText } = render(
      <ResultComparePanel a={A} b={B} countsA={countsA} countsB={countsB}
        perspective="white" choice={1} onNext={() => {}} />
    );
    // A has the higher white win rate -> "정답" appears once.
    expect(getAllByText("정답")).toHaveLength(1);
  });

  it("tags the player's wrong pick", () => {
    const { getByText } = render(
      <ResultComparePanel a={A} b={B} countsA={countsA} countsB={countsB}
        perspective="white" choice={1} onNext={() => {}} />
    );
    expect(getByText("내 선택")).toBeInTheDocument();
  });

  it("calls onNext when 다음 문제 is clicked", () => {
    const onNext = vi.fn();
    const { getByText } = render(
      <ResultComparePanel a={A} b={B} countsA={countsA} countsB={countsB}
        perspective="white" choice={0} onNext={onNext} />
    );
    fireEvent.click(getByText("다음 문제"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ResultComparePanel.test.tsx`
Expected: FAIL — cannot find module `./ResultComparePanel`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/ResultComparePanel.tsx`:

```tsx
import type { OpeningEntry, Counts, Perspective } from "../types";
import { ChessBoard } from "./ChessBoard";
import { ResultBars } from "./ResultBars";
import { higherWinRateIndex } from "../lib/winrate";

interface Props {
  a: OpeningEntry;
  b: OpeningEntry;
  countsA: Counts;
  countsB: Counts;
  perspective: Perspective;
  choice: 0 | 1 | null;
  onNext: () => void;
}

/** Mobile reveal view: compact two-row comparison of both openings. */
export function ResultComparePanel({
  a, b, countsA, countsB, perspective, choice, onNext,
}: Props) {
  const correct = higherWinRateIndex(countsA, countsB, perspective);
  const rows = [
    { o: a, counts: countsA, i: 0 as const },
    { o: b, counts: countsB, i: 1 as const },
  ];

  return (
    <div className="compare-panel">
      {rows.map(({ o, counts, i }) => {
        const outcome = i === correct ? "correct" : i === choice ? "wrong" : "";
        return (
          <div key={o.fen} className={["compare-row", outcome].filter(Boolean).join(" ")}>
            <div className="compare-thumb">
              <ChessBoard fen={o.fen} orientation={perspective} />
            </div>
            <div className="compare-info">
              <h3 className="opening-name">
                {o.name}
                {i === correct ? <span className="tag tag-correct">정답</span> : null}
                {i === choice && i !== correct ? (
                  <span className="tag tag-wrong">내 선택</span>
                ) : null}
              </h3>
              <ResultBars counts={counts} perspective={perspective} />
            </div>
          </div>
        );
      })}
      <button className="next" type="button" onClick={onNext}>
        다음 문제
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ResultComparePanel.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultComparePanel.tsx src/components/ResultComparePanel.test.tsx
git commit -m "feat: add ResultComparePanel (mobile reveal comparison)"
```

---

## Task 6: Branch `GameScreen` on viewport

**Files:**
- Modify: `src/components/GameScreen.tsx`
- Create: `src/components/GameScreen.test.tsx`

Mobile (≤600px): carousel while playing, compare panel while revealed. Desktop: existing two-up cards. Logic/state unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/components/GameScreen.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { GameScreen } from "./GameScreen";
import type { OpeningEntry } from "../types";

function op(name: string, fen: string, counts: OpeningEntry["counts"]): OpeningEntry {
  return { eco: "X", name, sanMoves: ["e4", "e5"], uciMoves: ["e2e4", "e7e5"], fen, counts };
}
// Distinct win rates so generateRound never ties (which would throw -> "empty").
const openings = [
  op("Italian Game", "fen-a", { "1600": [60, 20, 20] }),
  op("Sicilian Defense", "fen-b", { "1600": [40, 20, 40] }),
];

function setMobile(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  vi.restoreAllMocks();
  // restore the default non-mobile stub from test-setup
  setMobile(false);
});

const props = {
  openings, ratingBucket: 1600, streak: 0, best: 0,
  onAnswer: () => {}, onHome: () => {},
};

describe("GameScreen layout", () => {
  it("renders two cards side-by-side on desktop", () => {
    setMobile(false);
    const { container } = render(<GameScreen {...props} />);
    expect(container.querySelectorAll(".opening-card")).toHaveLength(2);
    expect(container.querySelector(".carousel")).toBeNull();
  });

  it("renders a single-card carousel with dots on mobile", () => {
    setMobile(true);
    const { container, getAllByRole } = render(<GameScreen {...props} />);
    expect(container.querySelector(".carousel")).not.toBeNull();
    expect(container.querySelectorAll(".opening-card")).toHaveLength(1);
    expect(getAllByRole("tab")).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/GameScreen.test.tsx`
Expected: FAIL — no `.carousel` (mobile branch not implemented yet).

- [ ] **Step 3: Edit GameScreen imports**

In `src/components/GameScreen.tsx`, add these imports after the existing import block (below the `ScoreBar` import):

```tsx
import { useMediaQuery } from "../hooks/useMediaQuery";
import { OpeningCarousel } from "./OpeningCarousel";
import { ResultComparePanel } from "./ResultComparePanel";
```

- [ ] **Step 4: Add the mobile flag**

In `GameScreen`, immediately after the `const [choice, setChoice] = useState<0 | 1 | null>(null);` line, add:

```tsx
  const isMobile = useMediaQuery("(max-width: 600px)");
```

- [ ] **Step 5: Replace the cards region of the returned JSX**

Replace this block (the `.cards` div plus the trailing "다음 문제" button):

```tsx
      <div className="cards">
        <OpeningCard
          key={round.a.fen}
          opening={round.a}
          perspective={round.perspective}
          revealed={status === "revealed"}
          onPick={() => pick(0)}
          counts={round.countsA}
          outcome={outcomeFor(0)}
        />
        <OpeningCard
          key={round.b.fen}
          opening={round.b}
          perspective={round.perspective}
          revealed={status === "revealed"}
          onPick={() => pick(1)}
          counts={round.countsB}
          outcome={outcomeFor(1)}
        />
      </div>
      {status === "revealed" ? (
        <button className="next" type="button" onClick={newRound}>다음 문제</button>
      ) : null}
```

with:

```tsx
      {isMobile ? (
        status === "revealed" ? (
          <ResultComparePanel
            a={round.a}
            b={round.b}
            countsA={round.countsA}
            countsB={round.countsB}
            perspective={round.perspective}
            choice={choice}
            onNext={newRound}
          />
        ) : (
          <OpeningCarousel
            a={round.a}
            b={round.b}
            perspective={round.perspective}
            onPick={pick}
          />
        )
      ) : (
        <>
          <div className="cards">
            <OpeningCard
              key={round.a.fen}
              opening={round.a}
              perspective={round.perspective}
              revealed={status === "revealed"}
              onPick={() => pick(0)}
              counts={round.countsA}
              outcome={outcomeFor(0)}
            />
            <OpeningCard
              key={round.b.fen}
              opening={round.b}
              perspective={round.perspective}
              revealed={status === "revealed"}
              onPick={() => pick(1)}
              counts={round.countsB}
              outcome={outcomeFor(1)}
            />
          </div>
          {status === "revealed" ? (
            <button className="next" type="button" onClick={newRound}>다음 문제</button>
          ) : null}
        </>
      )}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/GameScreen.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS (all tests).

- [ ] **Step 8: Commit**

```bash
git add src/components/GameScreen.tsx src/components/GameScreen.test.tsx
git commit -m "feat: branch GameScreen layout by viewport (mobile carousel/compare)"
```

---

## Task 7: Responsive styles

**Files:**
- Modify: `src/styles.css`

Add component styles for carousel/dots/compare panel, plus a `≤600px` media block. No unit test (CSS); verify with a build.

- [ ] **Step 1: Append the new styles**

Append to the end of `src/styles.css`:

```css
/* --- Mobile carousel (play) --- */
.carousel { touch-action: pan-y; }
.dots { display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.75rem; }
.dot {
  width: 12px; height: 12px; padding: 0; border: none; border-radius: 50%;
  background: #555; cursor: pointer;
}
.dot.active { background: #ccc; }

/* --- Mobile compare panel (reveal) --- */
.compare-panel { display: flex; flex-direction: column; gap: 0.75rem; }
.compare-row {
  display: flex; align-items: center; gap: 0.6rem;
  border: 2px solid #444; border-radius: 8px; padding: 0.5rem;
}
.compare-row.correct { border-color: var(--correct); }
.compare-row.wrong { border-color: var(--wrong); }
.compare-thumb { flex: 0 0 auto; width: 72px; }
.compare-info { flex: 1; text-align: left; }
.tag { font-size: 0.7rem; padding: 1px 6px; border-radius: 4px; margin-left: 6px; }
.tag-correct { background: #2f4636; color: #8f8; }
.tag-wrong { background: #4a2a2a; color: #f99; }

/* --- Phone breakpoint --- */
@media (max-width: 600px) {
  .app { padding: 0.75rem; }
  .title { font-size: 1.4rem; }
  .question { font-size: 1rem; }
  .top-bar { flex-wrap: wrap; gap: 0.5rem; }
  .rating-grid button { padding: 0.6rem; font-size: 0.85rem; }
  .chessboard { width: 100%; max-width: 360px; }
}
```

- [ ] **Step 2: Verify the build succeeds (CSS is valid, no type errors)**

Run: `npm run build`
Expected: `✓ built` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style: responsive layout for phones (carousel, compare panel, ≤600px)"
```

---

## Task 8: Final verification

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: PASS (all tests).

- [ ] **Step 2: Types + build**

Run: `npx tsc -b && npm run build`
Expected: no type errors; `✓ built`.

- [ ] **Step 3: Live-verify on a narrow viewport**

Run `npm run dev`, open the app, and using browser devtools device emulation at ~375px width, confirm:
- Rating picker fits (3 columns, no overflow).
- Playing: one large board, swipe and dots switch openings, move-stepper still works, "이 오프닝 선택" picks the shown opening.
- Reveal: compact two-row compare panel, correct side highlighted, your wrong pick tagged, "다음 문제" advances.
- Desktop width (>600px) still shows the two-up layout unchanged.

(Use the project's `verify` skill / browser driving for evidence if desired.)

---

## Self-Review Notes

- **Spec coverage:** useMediaQuery (T1), useElementWidth (T2), container-driven ChessBoard (T3), OpeningCarousel swipe+dots (T4), ResultComparePanel (T5), GameScreen 600px branch (T6), minor CSS polish + rating-grid + breakpoint (T7), live-verify (T8). All spec sections covered.
- **matchMedia/jsdom risk** handled in T1 (global stub) so existing tests stay green.
- **ResizeObserver/jsdom** handled in T2 (fallback path) — consistent with the existing no-op stub.
- **Type consistency:** `OpeningCarousel` and `ResultComparePanel` both take `a`/`b` (+ `countsA`/`countsB` for the panel); `onPick(index: 0 | 1)` matches `GameScreen`'s `pick`; `choice: 0 | 1 | null` matches `GameScreen` state; `higherWinRateIndex` returns `0 | 1 | null` (real rounds never tie, so `correct` is `0`/`1`).
