# Mobile Responsive Design — Guess the Winrate

Date: 2026-06-09

## Problem

The game renders the two opening cards in a fixed two-column grid
(`.cards { grid-template-columns: 1fr 1fr }`), each holding a 280px
chess board. Two 280px boards plus padding need ~600px of width, so on a
phone (~375px) they overflow or squish. `ChessBoard` also hardcodes
`boardWidth={280}`, and react-chessboard requires an explicit pixel
width, so the board cannot shrink to fit its container via CSS alone.

Goal: a usable phone layout while leaving the existing desktop layout
unchanged.

## Decisions (from brainstorming)

- **Mobile play layout:** swipe carousel — one board at a time, full
  phone width, switch between the two openings by **touch swipe + dots**
  (no extra arrows, to avoid confusion with the move-stepper `←/→`).
- **Mobile reveal layout:** compact compare panel — two rows, each a
  small board thumbnail + name + win-rate bar + win %, correct side
  highlighted, the player's pick marked, "다음 문제" below.
- **Scope/breakpoint:** the new mobile layout applies at `≤ 600px`.
  Above 600px (tablet/desktop) keeps the current two-up layout, both for
  play and reveal.
- **Implementation approach:** JS-driven responsive components, no new
  dependencies. The board self-measures its container for a dynamic
  `boardWidth`; a media-query hook branches desktop vs mobile rendering;
  the 2-item swipe carousel is hand-rolled.

## Architecture

Game logic and state (`playing | revealed | empty`, scoring, round
generation) stay in `GameScreen` and are shared across layouts. Only the
**rendering branch** differs by viewport.

### New hooks

New hooks live in `src/hooks/` (new directory; existing non-React logic
stays in `src/lib/`).

- `useMediaQuery(query: string): boolean` — subscribes to
  `window.matchMedia(query)`, returns current match, updates on change.
  Used as `isMobile = useMediaQuery('(max-width: 600px)')`.
- `useElementWidth(ref): number` — measures the referenced element's
  width via `ResizeObserver`, returns px.

### `ChessBoard` — container-driven sizing

- Replace hardcoded `boardWidth={280}` with a measured width: wrap the
  board in a `ref`'d div, feed `useElementWidth` into `boardWidth`.
- CSS controls the container size per context (large in the carousel,
  thumbnail in the compare panel); the board follows.
- First render (before measurement) uses a fallback (280). Clamp the
  measured width to a sane range (min ~120, max ~360) to avoid
  degenerate sizes.

### `GameScreen` — render branch

`isMobile` selects the layout; everything else is shared:

- **Desktop (> 600px):** existing `.cards` two-up `OpeningCard`s for
  both play and reveal. Effectively unchanged.
- **Mobile (≤ 600px), playing:** `<OpeningCarousel>`.
- **Mobile (≤ 600px), revealed:** `<ResultComparePanel>`.

`OpeningCard` is reused as-is inside the carousel slides.

### `<OpeningCarousel>` (mobile, playing)

- Props: the two `OpeningEntry`s, `perspective`, `onPick(index: 0 | 1)`.
  Internal `active: 0 | 1` state.
- Renders one `OpeningCard` at a time at full phone width, keeping the
  existing move-stepper (`⏮ ← →`) and "이 오프닝 선택" button.
- Switching openings:
  1. **Touch swipe** — on `touchstart`/`touchend`, if horizontal delta
     exceeds a threshold (~40px), toggle `active`.
  2. **Dots** (`● ○`) — tap to switch; also the current-position
     indicator.
  - No `◀ ▶` arrows, so card-switching is visually distinct from the
    move-stepper `← →`.
- The move-stepper buttons consume their own touch events so stepping
  through moves does not trigger a card swipe.
- Accessibility: dots use `role="tab"` / `aria-label` ("오프닝 1/2");
  dot taps are an equivalent alternative to swiping for environments
  without touch.

### `<ResultComparePanel>` (mobile, revealed)

- Two rows; each row = small board thumbnail (final position, no
  stepper) + opening name + win-rate bar (reuse/compact `ResultBars`) +
  win %.
- Correct side (higher win rate) gets a green border; the player's pick
  is marked (✗ / "내 선택" tag). "다음 문제" button below.

### Minor responsive polish (CSS, ≤ 600px)

- `.app` padding 1.5rem → 0.75rem.
- `.rating-grid`: keep 3 columns; reduce button padding to ~0.6rem and
  font to ~0.85rem so labels (e.g. "1000-1200") fit without wrapping.
- Reduce `.title` / `.question` font sizes.
- Allow `.top-bar` to wrap.
- Ensure touch targets are ~40px minimum (stepper buttons, dots).

## Testing (Vitest + React Testing Library, TDD)

- `useMediaQuery`: mock `matchMedia`; verify returned boolean and update
  on change events.
- `OpeningCarousel`: only slide 1 visible initially; dot tap switches to
  slide 2; selecting calls `onPick` with the correct index; simulated
  touch swipe switches slides.
- `ResultComparePanel`: renders both openings; highlights the correct
  side; marks the player's wrong pick; "다음 문제" callback fires.
- `ChessBoard` / `useElementWidth`: mock `ResizeObserver`; verify
  measured width reaches `boardWidth` and clamping works.
- Existing desktop tests keep passing unchanged — jsdom's default width
  drives the desktop branch, so the media query resolves to non-mobile.

## Out of scope (YAGNI)

- Landscape-specific layout.
- Tablet-specific design (tablet uses the desktop layout).
- Pinch-zoom on the board.
- Slide transition animations (possible follow-up).
