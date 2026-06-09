# 영어 지원 추가 (KO/EN i18n) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한국어로 하드코딩된 UI 문자열을 KO/EN 두 언어로 제공하고, 브라우저 언어 자동 감지 + 우측 상단 수동 토글로 전환할 수 있게 한다.

**Architecture:** 외부 라이브러리 없이 가벼운 자체 구현. `src/i18n/`에 번역 사전(`strings.ts`), React Context Provider(`LanguageContext.tsx`), `useT` 훅을 둔다. Context 기본값은 `ko` — provider 없이 렌더되는 기존 컴포넌트 테스트는 한국어로 그대로 통과하고, 실제 언어 감지/저장/전환은 `main.tsx`가 감싸는 `LanguageProvider`에서만 일어난다. 각 컴포넌트는 하드코딩 문자열을 `useT()` 호출로 교체한다.

**Tech Stack:** React 18 + TypeScript + Vite + Vitest + @testing-library/react

---

## File Structure

신규:
- `src/i18n/strings.ts` — `Lang` 타입, `ko`/`en` 번역 사전, `strings` 맵, `detectLang()`
- `src/i18n/LanguageContext.tsx` — `LanguageProvider`, `useLanguage()`
- `src/i18n/useT.ts` — `useT()` 훅
- `src/components/LanguageToggle.tsx` — KO/EN 토글 버튼
- `src/i18n/strings.test.ts`, `src/i18n/LanguageContext.test.tsx`, `src/components/LanguageToggle.test.tsx`

수정:
- `src/main.tsx` — `<LanguageProvider>`로 `<App>` 감싸기
- `src/App.tsx` — 토글 렌더 + 제목은 그대로(브랜드명)
- `src/components/{RatingPicker,ScoreBar,GameScreen,OpeningCarousel,OpeningCard,ResultBars,ResultComparePanel}.tsx` — `useT()` 적용
- `src/styles.css` — 토글 스타일
- 기존 테스트는 영어 렌더 검증 케이스만 **추가**(기존 한국어 케이스는 수정 불필요)

---

## Task 1: 번역 사전 + 언어 감지 (strings.ts)

**Files:**
- Create: `src/i18n/strings.ts`
- Test: `src/i18n/strings.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/i18n/strings.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/i18n/strings.test.ts`
Expected: FAIL — "Cannot find module './strings'"

- [ ] **Step 3: 최소 구현 작성**

Create `src/i18n/strings.ts`:

```ts
export type Lang = "ko" | "en";

export const LANG_KEY = "gtw-lang";

const ko = {
  // App / RatingPicker
  pickRating: "레이팅 구간을 선택하세요",
  // ScoreBar
  streak: "현재 연속",
  best: "최고 기록",
  // GameScreen top bar + question
  home: "← 처음으로",
  ratingLabel: (label: string) => `레이팅 ${label}`,
  emptyBucket: "이 레이팅 구간은 데이터가 부족해요.",
  pickAnotherRange: "다른 구간 선택",
  questionBefore: "어느 쪽이 ",
  questionAfter: " 승률이 더 높을까요?",
  white: "백",
  black: "흑",
  draw: "무",
  next: "다음 문제",
  // OpeningCarousel
  openingAria: (n: number) => `오프닝 ${n}/2`,
  // OpeningCard
  firstPosition: "처음 포지션",
  prevMove: "이전 수",
  nextMove: "다음 수",
  ply: (ply: number, total: number) => `수 ${ply}/${total}`,
  pickThis: "이 오프닝 선택",
  // ResultBars
  winRateLabel: (side: string) => `${side} 승률`,
  games: (n: number) => `(${n.toLocaleString()}판)`,
  // ResultComparePanel
  correct: "정답",
  myPick: "내 선택",
};

export type Strings = typeof ko;

const en: Strings = {
  pickRating: "Pick a rating range",
  streak: "Streak",
  best: "Best",
  home: "← Home",
  ratingLabel: (label: string) => `Rating ${label}`,
  emptyBucket: "Not enough data for this rating range.",
  pickAnotherRange: "Pick another range",
  questionBefore: "Which side has a higher ",
  questionAfter: " win rate?",
  white: "White",
  black: "Black",
  draw: "Draw",
  next: "Next",
  openingAria: (n: number) => `Opening ${n}/2`,
  firstPosition: "First position",
  prevMove: "Previous move",
  nextMove: "Next move",
  ply: (ply: number, total: number) => `Move ${ply}/${total}`,
  pickThis: "Pick this opening",
  winRateLabel: (side: string) => `${side} win rate`,
  games: (n: number) => `(${n.toLocaleString()} games)`,
  correct: "Correct",
  myPick: "My pick",
};

export const strings: Record<Lang, Strings> = { ko, en };

/** Saved choice wins; otherwise Korean browsers get `ko`, everyone else `en`. */
export function detectLang(nav: { language?: string } = navigator): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ko" || saved === "en") return saved;
  } catch {
    /* localStorage unavailable (private mode) — fall through to navigator */
  }
  return nav.language?.toLowerCase().startsWith("ko") ? "ko" : "en";
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/i18n/strings.test.ts`
Expected: PASS (all cases)

- [ ] **Step 5: 커밋**

```bash
git add src/i18n/strings.ts src/i18n/strings.test.ts
git commit -m "feat(i18n): add ko/en string dictionary and language detection"
```

---

## Task 2: LanguageProvider + useLanguage (Context)

**Files:**
- Create: `src/i18n/LanguageContext.tsx`
- Test: `src/i18n/LanguageContext.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/i18n/LanguageContext.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./LanguageContext";

function Probe() {
  const { lang, setLang } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <button onClick={() => setLang("en")}>to-en</button>
    </div>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => localStorage.clear());

  it("uses initialLang when provided", () => {
    const { getByTestId } = render(
      <LanguageProvider initialLang="en">
        <Probe />
      </LanguageProvider>,
    );
    expect(getByTestId("lang").textContent).toBe("en");
  });

  it("setLang updates context and persists to localStorage", () => {
    const { getByTestId, getByText } = render(
      <LanguageProvider initialLang="ko">
        <Probe />
      </LanguageProvider>,
    );
    fireEvent.click(getByText("to-en"));
    expect(getByTestId("lang").textContent).toBe("en");
    expect(localStorage.getItem("gtw-lang")).toBe("en");
  });

  it("defaults to ko when used without a provider", () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("lang").textContent).toBe("ko");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/i18n/LanguageContext.test.tsx`
Expected: FAIL — "Cannot find module './LanguageContext'"

- [ ] **Step 3: 최소 구현 작성**

Create `src/i18n/LanguageContext.tsx`:

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import { detectLang, LANG_KEY, type Lang } from "./strings";

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

// Default ko so components rendered without a provider (e.g. unit tests) are stable.
const LanguageContext = createContext<LanguageValue>({ lang: "ko", setLang: () => {} });

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(() => initialLang ?? detectLang());

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore persistence failures (private mode) */
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageValue {
  return useContext(LanguageContext);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/i18n/LanguageContext.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/i18n/LanguageContext.tsx src/i18n/LanguageContext.test.tsx
git commit -m "feat(i18n): add LanguageProvider and useLanguage hook"
```

---

## Task 3: useT 훅

**Files:**
- Create: `src/i18n/useT.ts`
- Test: 없음 (Task 2의 Context + Task 1의 strings 위에서 동작; 컴포넌트 테스트에서 간접 검증)

- [ ] **Step 1: 구현 작성**

Create `src/i18n/useT.ts`:

```ts
import { strings, type Strings } from "./strings";
import { useLanguage } from "./LanguageContext";

/** Returns the active-language string table. Usage: const t = useT(); t.next */
export function useT(): Strings {
  const { lang } = useLanguage();
  return strings[lang];
}
```

- [ ] **Step 2: 타입 체크 통과 확인**

Run: `npx tsc -b`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/i18n/useT.ts
git commit -m "feat(i18n): add useT hook"
```

---

## Task 4: LanguageToggle 컴포넌트 + 스타일

**Files:**
- Create: `src/components/LanguageToggle.tsx`
- Test: `src/components/LanguageToggle.test.tsx`
- Modify: `src/styles.css` (파일 끝에 추가)

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/components/LanguageToggle.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LanguageProvider } from "../i18n/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

describe("LanguageToggle", () => {
  beforeEach(() => localStorage.clear());

  it("marks the active language as pressed", () => {
    const { getByRole } = render(
      <LanguageProvider initialLang="ko">
        <LanguageToggle />
      </LanguageProvider>,
    );
    expect(getByRole("button", { name: "KO" })).toHaveAttribute("aria-pressed", "true");
    expect(getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "false");
  });

  it("switches language and persists on click", () => {
    const { getByRole } = render(
      <LanguageProvider initialLang="ko">
        <LanguageToggle />
      </LanguageProvider>,
    );
    fireEvent.click(getByRole("button", { name: "EN" }));
    expect(getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("gtw-lang")).toBe("en");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/LanguageToggle.test.tsx`
Expected: FAIL — "Cannot find module './LanguageToggle'"

- [ ] **Step 3: 최소 구현 작성**

Create `src/components/LanguageToggle.tsx`:

```tsx
import { useLanguage } from "../i18n/LanguageContext";
import type { Lang } from "../i18n/strings";

const LANGS: Lang[] = ["ko", "en"];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="lang-toggle">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={"lang-btn" + (lang === l ? " active" : "")}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 스타일 추가**

Append to `src/styles.css`:

```css
.lang-toggle {
  position: fixed;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 2px;
  z-index: 100;
}
.lang-btn {
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #555;
  background: transparent;
  color: #888;
  cursor: pointer;
  border-radius: 4px;
}
.lang-btn.active {
  color: #fff;
  border-color: #fff;
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- src/components/LanguageToggle.test.tsx`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add src/components/LanguageToggle.tsx src/components/LanguageToggle.test.tsx src/styles.css
git commit -m "feat(i18n): add LanguageToggle component with fixed top-right placement"
```

---

## Task 5: 앱 배선 (main.tsx provider + App 토글)

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx` (영어 케이스 추가)

- [ ] **Step 1: 실패하는 테스트 추가**

`src/App.test.tsx`에 케이스 추가 (기존 케이스는 그대로 둔다). 파일 상단 import에 `LanguageProvider` 추가:

```tsx
import { LanguageProvider } from "./i18n/LanguageContext";
```

그리고 describe 블록 안에 추가:

```tsx
it("renders English copy and a language toggle under an en provider", () => {
  const { getByText, getByRole } = render(
    <LanguageProvider initialLang="en">
      <App />
    </LanguageProvider>,
  );
  expect(getByText("Pick a rating range")).toBeInTheDocument();
  expect(getByRole("button", { name: "EN" })).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL — "Pick a rating range" / "EN" 버튼을 찾지 못함

- [ ] **Step 3: App.tsx 수정**

`src/App.tsx`에서 `import "./styles.css";` 아래에 import 추가:

```tsx
import { LanguageToggle } from "./components/LanguageToggle";
```

`return` 의 `<main className="app">` 바로 뒤에 토글을 추가:

```tsx
  return (
    <main className="app">
      <LanguageToggle />
      <h1 className="title">Guess the Winrate</h1>
```

(제목 "Guess the Winrate" 는 브랜드명이므로 두 언어 공통 — 변경하지 않는다.)

- [ ] **Step 4: main.tsx 수정**

Replace `src/main.tsx` 내용:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- src/App.test.tsx`
Expected: PASS (기존 한국어 케이스 + 새 영어 케이스 모두)

- [ ] **Step 6: 커밋**

```bash
git add src/main.tsx src/App.tsx src/App.test.tsx
git commit -m "feat(i18n): wrap app in LanguageProvider and render LanguageToggle"
```

---

## Task 6: RatingPicker + ScoreBar 적용

**Files:**
- Modify: `src/components/RatingPicker.tsx`, `src/components/ScoreBar.tsx`
- Test: `src/components/RatingPicker.test.tsx` (영어 케이스 추가)

- [ ] **Step 1: 실패하는 테스트 추가**

`src/components/RatingPicker.test.tsx` 상단 import에 추가:

```tsx
import { LanguageProvider } from "../i18n/LanguageContext";
```

케이스 추가:

```tsx
it("renders the English heading under an en provider", () => {
  const { getByText } = render(
    <LanguageProvider initialLang="en">
      <RatingPicker onSelect={() => {}} />
    </LanguageProvider>,
  );
  expect(getByText("Pick a rating range")).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/RatingPicker.test.tsx`
Expected: FAIL — "Pick a rating range" 없음

- [ ] **Step 3: RatingPicker 구현**

Replace `src/components/RatingPicker.tsx`:

```tsx
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
```

- [ ] **Step 4: ScoreBar 구현**

Replace `src/components/ScoreBar.tsx`:

```tsx
import { useT } from "../i18n/useT";

interface Props {
  streak: number;
  best: number;
}

export function ScoreBar({ streak, best }: Props) {
  const t = useT();
  return (
    <div className="score-bar">
      <span>{t.streak}: <strong>{streak}</strong></span>
      <span>{t.best}: <strong>{best}</strong></span>
    </div>
  );
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- src/components/RatingPicker.test.tsx`
Expected: PASS (한국어 + 영어 케이스)

- [ ] **Step 6: 커밋**

```bash
git add src/components/RatingPicker.tsx src/components/ScoreBar.tsx src/components/RatingPicker.test.tsx
git commit -m "feat(i18n): localize RatingPicker and ScoreBar"
```

---

## Task 7: GameScreen 적용

**Files:**
- Modify: `src/components/GameScreen.tsx`
- Test: `src/components/GameScreen.test.tsx` (영어 케이스 추가)

- [ ] **Step 1: 실패하는 테스트 추가**

`src/components/GameScreen.test.tsx` 상단 import에 추가:

```tsx
import { LanguageProvider } from "../i18n/LanguageContext";
```

케이스 추가 (기존 props 헬퍼 재사용; 파일에 정의된 `props`/`makeProps` 패턴을 그대로 사용한다):

```tsx
it("renders the English question and Next button under an en provider", () => {
  const { getByText } = render(
    <LanguageProvider initialLang="en">
      <GameScreen {...props} />
    </LanguageProvider>,
  );
  // question wraps the bolded side word
  expect(getByText(/win rate\?/)).toBeInTheDocument();
  fireEvent.click(getByText("Pick this opening"));
  expect(getByText("Next")).toBeInTheDocument();
});
```

> 참고: 기존 테스트가 `props` 변수명을 다르게 쓰면(예: 헬퍼 함수) 그 이름에 맞춘다. import에 `fireEvent`가 없으면 추가한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/GameScreen.test.tsx`
Expected: FAIL — 영어 문구 없음

- [ ] **Step 3: GameScreen 구현**

`src/components/GameScreen.tsx` 수정:

import 블록 끝에 추가:

```tsx
import { useT } from "../i18n/useT";
```

함수 본문 첫 줄(`const [round, ...]` 위)에 추가:

```tsx
  const t = useT();
```

`topBar`의 home 버튼/라벨 교체:

```tsx
  const topBar = (
    <div className="top-bar">
      <button type="button" className="home-button" onClick={onHome}>
        {t.home}
      </button>
      <span className="rating-label">{t.ratingLabel(bandLabel(ratingBucket))}</span>
    </div>
  );
```

empty 분기 교체:

```tsx
        <div className="center">
          <p>{t.emptyBucket}</p>
          <button type="button" onClick={onHome}>{t.pickAnotherRange}</button>
        </div>
```

질문 헤더 교체 (`<strong>`로 감싼 side 단어는 t.white/t.black 사용):

```tsx
      <h2 className="question">
        {t.questionBefore}
        <strong>{round.perspective === "white" ? t.white : t.black}</strong>
        {t.questionAfter}
      </h2>
```

데스크톱 next 버튼 교체:

```tsx
            <button className="next" type="button" onClick={newRound}>{t.next}</button>
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/components/GameScreen.test.tsx`
Expected: PASS (한국어 + 영어 케이스)

- [ ] **Step 5: 커밋**

```bash
git add src/components/GameScreen.tsx src/components/GameScreen.test.tsx
git commit -m "feat(i18n): localize GameScreen top bar, question and controls"
```

---

## Task 8: OpeningCard + OpeningCarousel 적용

**Files:**
- Modify: `src/components/OpeningCard.tsx`, `src/components/OpeningCarousel.tsx`
- Test: `src/components/OpeningCard.test.tsx`, `src/components/OpeningCarousel.test.tsx` (영어 케이스 추가)

- [ ] **Step 1: 실패하는 테스트 추가**

`src/components/OpeningCard.test.tsx` 상단 import에 추가:

```tsx
import { LanguageProvider } from "../i18n/LanguageContext";
```

케이스 추가 (기존 테스트의 props 패턴을 그대로 사용):

```tsx
it("renders English ply counter and pick button under an en provider", () => {
  const { getByText } = render(
    <LanguageProvider initialLang="en">
      <OpeningCard opening={italian} perspective="white" revealed={false} onPick={() => {}} />
    </LanguageProvider>,
  );
  expect(getByText("Move 6/6")).toBeInTheDocument();
  expect(getByText("Pick this opening")).toBeInTheDocument();
});
```

> `italian` 등 기존 테스트가 쓰는 오프닝 픽스처 변수명을 그대로 사용한다. 수가 6수가 아니면 해당 오프닝의 실제 ply 수에 맞춘다(예: `Move 4/4`).

`src/components/OpeningCarousel.test.tsx` 상단 import에 추가:

```tsx
import { LanguageProvider } from "../i18n/LanguageContext";
```

케이스 추가:

```tsx
it("uses English tab aria-labels under an en provider", () => {
  const { getByRole } = render(
    <LanguageProvider initialLang="en">
      <OpeningCarousel a={italian} b={sicilian} perspective="white" onPick={() => {}} />
    </LanguageProvider>,
  );
  expect(getByRole("tab", { name: "Opening 1/2" })).toBeInTheDocument();
  expect(getByRole("tab", { name: "Opening 2/2" })).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/OpeningCard.test.tsx src/components/OpeningCarousel.test.tsx`
Expected: FAIL — 영어 문구 없음

- [ ] **Step 3: OpeningCard 구현**

`src/components/OpeningCard.tsx` 수정:

import 끝에 추가:

```tsx
import { useT } from "../i18n/useT";
```

`OpeningCard` 함수 본문 첫 줄에 추가:

```tsx
  const t = useT();
```

aria-label 3개와 ply counter, pick 버튼 텍스트 교체:

```tsx
          aria-label={t.firstPosition}
```
```tsx
          aria-label={t.prevMove}
```
```tsx
        <span className="ply-counter">
          {t.ply(ply, total)}
        </span>
```
```tsx
          aria-label={t.nextMove}
```
```tsx
          {t.pickThis}
```

(각각 기존의 "처음 포지션" / "이전 수" / `수 {ply}/{total}` / "다음 수" / "이 오프닝 선택" 자리)

- [ ] **Step 4: OpeningCarousel 구현**

`src/components/OpeningCarousel.tsx` 수정:

import 끝에 추가:

```tsx
import { useT } from "../i18n/useT";
```

`OpeningCarousel` 함수 본문 첫 줄(`const [active, ...]` 위)에 추가:

```tsx
  const t = useT();
```

aria-label 교체:

```tsx
            aria-label={t.openingAria(i + 1)}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- src/components/OpeningCard.test.tsx src/components/OpeningCarousel.test.tsx`
Expected: PASS (한국어 + 영어 케이스)

- [ ] **Step 6: 커밋**

```bash
git add src/components/OpeningCard.tsx src/components/OpeningCarousel.tsx src/components/OpeningCard.test.tsx src/components/OpeningCarousel.test.tsx
git commit -m "feat(i18n): localize OpeningCard and OpeningCarousel"
```

---

## Task 9: ResultBars 적용

**Files:**
- Modify: `src/components/ResultBars.tsx`
- Test: `src/components/ResultBars.test.tsx` (영어 케이스 추가)

- [ ] **Step 1: 실패하는 테스트 추가**

`src/components/ResultBars.test.tsx` 상단 import에 추가:

```tsx
import { LanguageProvider } from "../i18n/LanguageContext";
```

케이스 추가 (기존 테스트의 counts 픽스처를 그대로 사용; 아래 `counts`는 기존 변수명에 맞춘다):

```tsx
it("renders English legend, win-rate label and games sample under an en provider", () => {
  const { container } = render(
    <LanguageProvider initialLang="en">
      <ResultBars counts={{ white: 60, draws: 10, black: 30 }} perspective="white" />
    </LanguageProvider>,
  );
  expect(container.textContent).toContain("White 60.0%");
  expect(container.textContent).toContain("Draw 10.0%");
  expect(container.textContent).toContain("Black 30.0%");
  expect(container.textContent).toContain("White win rate");
  expect(container.textContent).toContain("(100 games)");
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/ResultBars.test.tsx`
Expected: FAIL — 영어 문구 없음

- [ ] **Step 3: ResultBars 구현**

Replace `src/components/ResultBars.tsx`:

```tsx
import type { Counts, Perspective } from "../types";
import { totalGames, winRate } from "../lib/winrate";
import { useT } from "../i18n/useT";

interface Props {
  counts: Counts;
  perspective: Perspective;
}

export function ResultBars({ counts, perspective }: Props) {
  const t = useT();
  const total = totalGames(counts);
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  const rate = winRate(counts, perspective) * 100;
  const side = perspective === "white" ? t.white : t.black;

  return (
    <div className="result-bars">
      <div className="bar">
        <span className="seg white" style={{ width: `${pct(counts.white)}%` }} />
        <span className="seg draw" style={{ width: `${pct(counts.draws)}%` }} />
        <span className="seg black" style={{ width: `${pct(counts.black)}%` }} />
      </div>
      <div className="bar-legend">
        <span>{t.white} {pct(counts.white).toFixed(1)}%</span>
        <span>{t.draw} {pct(counts.draws).toFixed(1)}%</span>
        <span>{t.black} {pct(counts.black).toFixed(1)}%</span>
      </div>
      <div className="rate">
        {t.winRateLabel(side)} <strong>{rate.toFixed(1)}%</strong>
        <span className="sample"> {t.games(total)}</span>
      </div>
    </div>
  );
}
```

> 참고: 기존에는 `({total}판)` 앞에 별도 공백이 없었지만 sample 앞 공백은 `<span className="sample"> {t.games(total)}</span>` 의 선행 공백으로 유지된다. `t.games`는 자체적으로 괄호를 포함한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/components/ResultBars.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/ResultBars.tsx src/components/ResultBars.test.tsx
git commit -m "feat(i18n): localize ResultBars legend and win-rate label"
```

---

## Task 10: ResultComparePanel 적용

**Files:**
- Modify: `src/components/ResultComparePanel.tsx`
- Test: `src/components/ResultComparePanel.test.tsx` (영어 케이스 추가)

- [ ] **Step 1: 실패하는 테스트 추가**

`src/components/ResultComparePanel.test.tsx` 상단 import에 추가:

```tsx
import { LanguageProvider } from "../i18n/LanguageContext";
```

케이스 추가 (기존 테스트가 쓰는 props/픽스처를 그대로 사용; 아래 `compareProps`는 그 패턴에 맞춰 대체한다):

```tsx
it("renders English tags and Next button under an en provider", () => {
  const { getByText, getAllByText } = render(
    <LanguageProvider initialLang="en">
      <ResultComparePanel {...compareProps} />
    </LanguageProvider>,
  );
  expect(getAllByText("Correct")).toHaveLength(1);
  expect(getByText("My pick")).toBeInTheDocument();
  expect(getByText("Next")).toBeInTheDocument();
});
```

> `compareProps`는 기존 테스트에서 "정답"이 1개 나오고 "내 선택"이 보이도록 구성된 props(choice 포함)와 동일하게 맞춘다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/ResultComparePanel.test.tsx`
Expected: FAIL — 영어 문구 없음

- [ ] **Step 3: ResultComparePanel 구현**

`src/components/ResultComparePanel.tsx` 수정:

import 끝에 추가:

```tsx
import { useT } from "../i18n/useT";
```

함수 본문 첫 줄(`const correct = ...` 위)에 추가:

```tsx
  const t = useT();
```

태그/버튼 텍스트 교체:

```tsx
                {i === correct ? <span className="tag tag-correct">{t.correct}</span> : null}
```
```tsx
                  <span className={"tag " + (i === correct ? "tag-correct" : "tag-wrong")}>
                    {t.myPick}
                  </span>
```
```tsx
      <button className="next" type="button" onClick={onNext}>
        {t.next}
      </button>
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/components/ResultComparePanel.test.tsx`
Expected: PASS (한국어 + 영어 케이스)

- [ ] **Step 5: 커밋**

```bash
git add src/components/ResultComparePanel.tsx src/components/ResultComparePanel.test.tsx
git commit -m "feat(i18n): localize ResultComparePanel tags and Next button"
```

---

## Task 11: 전체 검증 (타입 + 전체 테스트 + 빌드)

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 테스트 실행**

Run: `npm test`
Expected: 모든 테스트 PASS (기존 한국어 케이스 + 추가된 영어 케이스)

- [ ] **Step 2: 타입체크 + 프로덕션 빌드**

Run: `npm run build`
Expected: tsc 에러 없음, vite 빌드 성공

- [ ] **Step 3: 잔여 한국어 하드코딩 스캔**

Run: `git grep -nE "[가-힣]" -- src/ ":!src/**/*.test.*"`
Expected: 결과 없음 (모든 UI 한국어가 `src/i18n/strings.ts`로 이동했는지 확인). `strings.ts` 안의 ko 사전 라인은 제외 대상이 아니므로, 위 명령에서 `strings.ts`가 나오면 정상(사전이므로 OK). 그 외 컴포넌트 파일에서 한국어가 나오면 누락이므로 해당 컴포넌트를 마저 교체한다.

- [ ] **Step 4: 최종 커밋 (필요 시)**

스캔에서 누락을 고쳤다면:

```bash
git add -A
git commit -m "fix(i18n): localize remaining hardcoded strings"
```

누락이 없으면 별도 커밋 불필요.

---

## 완료 기준

- [ ] `npm test` 전부 통과
- [ ] `npm run build` 성공
- [ ] 영어권 브라우저에서 앱이 영어로 시작, 한국어 브라우저에서 한국어로 시작
- [ ] 우측 상단 KO/EN 토글로 즉시 전환되고 새로고침 후에도 선택 유지(localStorage)
- [ ] 컴포넌트 외부에 하드코딩된 한국어 UI 문자열 없음 (사전 `strings.ts` 제외)
