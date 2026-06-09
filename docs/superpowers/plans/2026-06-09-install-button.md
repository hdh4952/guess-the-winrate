# In-App Install Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a platform-aware "install app" button on the result screen after a wrong answer (game over), hidden once the app is installed.

**Architecture:** A pure `resolveInstallMode` function decides one of three modes (`none`/`native`/`ios`) from three booleans. A `useInstallPrompt` hook captures the `beforeinstallprompt` event and detects standalone/iOS, returning `{ mode, promptInstall }`. A presentational `IosInstallModal` and an orchestrating `InstallButton` render the UI; `GameScreen` renders the button only on a wrong reveal.

**Tech Stack:** React, TypeScript, vitest + @testing-library/react. No new dependencies.

---

## File Structure

- `src/pwa/installMode.ts` (new) — pure mode resolution + `isIOSDevice()` / `isStandaloneDisplay()` detection. One responsibility: decide installability mode.
- `src/pwa/installMode.test.ts` (new) — unit tests for `resolveInstallMode`.
- `src/pwa/useInstallPrompt.ts` (new) — React hook: capture `beforeinstallprompt`, expose `{ mode, promptInstall }`.
- `src/components/IosInstallModal.tsx` (new) — pure modal with the iOS Add-to-Home-Screen steps.
- `src/components/IosInstallModal.test.tsx` (new) — modal tests.
- `src/components/InstallButton.tsx` (new) — orchestrator: uses the hook, renders button + (iOS) modal.
- `src/components/InstallButton.test.tsx` (new) — button tests (hook mocked).
- `src/i18n/strings.ts` (modify) — 5 new keys in `ko` + `en`.
- `src/components/GameScreen.tsx` (modify) — render `<InstallButton />` on wrong reveal.
- `src/styles.css` (modify) — `.install-button`, `.install-modal-overlay`, `.install-modal`.

---

## Task 1: installMode pure module

**Files:**
- Create: `src/pwa/installMode.ts`
- Test: `src/pwa/installMode.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/pwa/installMode.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveInstallMode } from "./installMode";

describe("resolveInstallMode", () => {
  it("returns none when already installed (standalone), even with a prompt", () => {
    expect(resolveInstallMode({ isStandalone: true, isIOS: false, hasPrompt: true })).toBe("none");
    expect(resolveInstallMode({ isStandalone: true, isIOS: true, hasPrompt: false })).toBe("none");
  });

  it("returns native when a beforeinstallprompt was captured", () => {
    expect(resolveInstallMode({ isStandalone: false, isIOS: false, hasPrompt: true })).toBe("native");
  });

  it("returns ios on iOS with no prompt and not installed", () => {
    expect(resolveInstallMode({ isStandalone: false, isIOS: true, hasPrompt: false })).toBe("ios");
  });

  it("returns none when not installable and not iOS", () => {
    expect(resolveInstallMode({ isStandalone: false, isIOS: false, hasPrompt: false })).toBe("none");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/pwa/installMode.test.ts`
Expected: FAIL — `Failed to resolve import "./installMode"`.

- [ ] **Step 3: Implement the module**

Create `src/pwa/installMode.ts`:

```ts
export type InstallMode = "none" | "native" | "ios";

interface ModeInputs {
  isStandalone: boolean;
  isIOS: boolean;
  hasPrompt: boolean;
}

/** Pure decision: which install affordance (if any) applies. */
export function resolveInstallMode({ isStandalone, isIOS, hasPrompt }: ModeInputs): InstallMode {
  if (isStandalone) return "none";
  if (hasPrompt) return "native";
  if (isIOS) return "ios";
  return "none";
}

export function isIOSDevice(): boolean {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as "Macintosh" but is touch-capable.
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

export function isStandaloneDisplay(): boolean {
  const byMedia = window.matchMedia("(display-mode: standalone)").matches;
  const byIOS = (navigator as { standalone?: boolean }).standalone === true;
  return byMedia || byIOS;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --run src/pwa/installMode.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pwa/installMode.ts src/pwa/installMode.test.ts
git commit -m "feat(install): add pure install-mode resolution + platform detection"
```

---

## Task 2: useInstallPrompt hook

**Files:**
- Create: `src/pwa/useInstallPrompt.ts`

- [ ] **Step 1: Implement the hook**

Create `src/pwa/useInstallPrompt.ts`:

```ts
import { useEffect, useState } from "react";
import {
  isIOSDevice,
  isStandaloneDisplay,
  resolveInstallMode,
  type InstallMode,
} from "./installMode";

/** The beforeinstallprompt event is not yet in lib.dom typings. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export interface InstallPrompt {
  mode: InstallMode;
  promptInstall: () => void;
}

export function useInstallPrompt(): InstallPrompt {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      // Stop Chrome's default mini-infobar; we trigger the prompt from our button.
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const mode = resolveInstallMode({
    isStandalone: isStandaloneDisplay(),
    isIOS: isIOSDevice(),
    hasPrompt: promptEvent !== null,
  });

  const promptInstall = () => {
    if (promptEvent) {
      promptEvent.prompt();
      setPromptEvent(null);
    }
  };

  return { mode, promptInstall };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pwa/useInstallPrompt.ts
git commit -m "feat(install): add useInstallPrompt hook"
```

---

## Task 3: i18n strings

**Files:**
- Modify: `src/i18n/strings.ts`

The `ko` object currently ends with `refresh: "새로고침",` (added in a prior feature) just before its closing `};`. The `en` object ends with `refresh: "Refresh",`.

- [ ] **Step 1: Add the Korean strings**

In `src/i18n/strings.ts`, inside `const ko = { ... }`, add immediately after the `refresh: "새로고침",` line:

```ts
  // InstallButton / IosInstallModal
  installApp: "📲 앱 설치",
  iosInstallTitle: "홈 화면에 추가",
  iosInstallStep1: "하단 공유 버튼을 누르세요",
  iosInstallStep2: "'홈 화면에 추가'를 선택하세요",
  close: "닫기",
```

- [ ] **Step 2: Add the English strings**

In `const en: Strings = { ... }`, add immediately after the `refresh: "Refresh",` line:

```ts
  installApp: "📲 Install app",
  iosInstallTitle: "Add to Home Screen",
  iosInstallStep1: "Tap the Share button below",
  iosInstallStep2: "Choose 'Add to Home Screen'",
  close: "Close",
```

- [ ] **Step 3: Run the strings parity test**

Run: `npm test -- --run src/i18n/strings.test.ts`
Expected: PASS — "ko and en expose the same keys" confirms parity.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/strings.ts
git commit -m "feat(install): add install-button i18n strings"
```

---

## Task 4: IosInstallModal component (TDD)

**Files:**
- Create: `src/components/IosInstallModal.tsx`
- Test: `src/components/IosInstallModal.test.tsx`
- Modify: `src/styles.css` (append modal styles)

- [ ] **Step 1: Write the failing test**

Create `src/components/IosInstallModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LanguageProvider } from "../i18n/LanguageContext";
import { IosInstallModal } from "./IosInstallModal";

describe("IosInstallModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<IosInstallModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the title and both steps when open (Korean)", () => {
    const { getByText, getByRole } = render(<IosInstallModal open onClose={() => {}} />);
    expect(getByRole("dialog")).toBeInTheDocument();
    expect(getByText("홈 화면에 추가")).toBeInTheDocument();
    expect(getByText("하단 공유 버튼을 누르세요")).toBeInTheDocument();
    expect(getByText("'홈 화면에 추가'를 선택하세요")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    const { getByRole } = render(<IosInstallModal open onClose={onClose} />);
    fireEvent.click(getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders English copy under an en provider", () => {
    const { getByText, getByRole } = render(
      <LanguageProvider initialLang="en">
        <IosInstallModal open onClose={() => {}} />
      </LanguageProvider>,
    );
    expect(getByText("Add to Home Screen")).toBeInTheDocument();
    expect(getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/components/IosInstallModal.test.tsx`
Expected: FAIL — `Failed to resolve import "./IosInstallModal"`.

- [ ] **Step 3: Implement the component**

Create `src/components/IosInstallModal.tsx`:

```tsx
import { useT } from "../i18n/useT";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function IosInstallModal({ open, onClose }: Props) {
  const t = useT();
  if (!open) return null;
  return (
    <div className="install-modal-overlay" onClick={onClose}>
      <div
        className="install-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{t.iosInstallTitle}</h2>
        <ol>
          <li>{t.iosInstallStep1}</li>
          <li>{t.iosInstallStep2}</li>
        </ol>
        <button type="button" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --run src/components/IosInstallModal.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Append the modal styles**

Append to `src/styles.css`:

```css
.install-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  z-index: 300;
}
.install-modal {
  max-width: 320px;
  margin: 1rem;
  padding: 1.25rem 1.5rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
.install-modal h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}
.install-modal ol {
  margin: 0 0 1rem;
  padding-left: 1.25rem;
  line-height: 1.6;
}
.install-modal button {
  display: block;
  margin-left: auto;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  border: none;
  border-radius: 8px;
  background: #4a6;
  color: #fff;
  cursor: pointer;
}
.install-modal button:hover {
  background: #3a5a43;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/IosInstallModal.tsx src/components/IosInstallModal.test.tsx src/styles.css
git commit -m "feat(install): add iOS add-to-home-screen instructions modal"
```

---

## Task 5: InstallButton component (TDD)

**Files:**
- Create: `src/components/InstallButton.tsx`
- Test: `src/components/InstallButton.test.tsx`
- Modify: `src/styles.css` (append button styles)

- [ ] **Step 1: Write the failing test**

Create `src/components/InstallButton.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { InstallButton } from "./InstallButton";

// Variables referenced inside vi.mock factories MUST start with "mock".
const mockPromptInstall = vi.fn();
let mockMode: "none" | "native" | "ios" = "none";

vi.mock("../pwa/useInstallPrompt", () => ({
  useInstallPrompt: () => ({ mode: mockMode, promptInstall: mockPromptInstall }),
}));

describe("InstallButton", () => {
  beforeEach(() => {
    mockMode = "none";
    mockPromptInstall.mockClear();
  });

  it("renders nothing when mode is none", () => {
    const { container } = render(<InstallButton />);
    expect(container.firstChild).toBeNull();
  });

  it("calls promptInstall when clicked in native mode", () => {
    mockMode = "native";
    const { getByRole } = render(<InstallButton />);
    fireEvent.click(getByRole("button", { name: /앱 설치/ }));
    expect(mockPromptInstall).toHaveBeenCalledOnce();
  });

  it("opens the iOS instructions modal when clicked in ios mode", () => {
    mockMode = "ios";
    const { getByRole, getByText, queryByRole } = render(<InstallButton />);
    expect(queryByRole("dialog")).toBeNull();
    fireEvent.click(getByRole("button", { name: /앱 설치/ }));
    expect(getByRole("dialog")).toBeInTheDocument();
    expect(getByText("홈 화면에 추가")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/components/InstallButton.test.tsx`
Expected: FAIL — `Failed to resolve import "./InstallButton"`.

- [ ] **Step 3: Implement the component**

Create `src/components/InstallButton.tsx`:

```tsx
import { useState } from "react";
import { useInstallPrompt } from "../pwa/useInstallPrompt";
import { IosInstallModal } from "./IosInstallModal";
import { useT } from "../i18n/useT";

export function InstallButton() {
  const t = useT();
  const { mode, promptInstall } = useInstallPrompt();
  const [modalOpen, setModalOpen] = useState(false);

  if (mode === "none") return null;

  const handleClick = () => {
    if (mode === "native") {
      promptInstall();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <button type="button" className="install-button" onClick={handleClick}>
        {t.installApp}
      </button>
      <IosInstallModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --run src/components/InstallButton.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Append the button styles**

Append to `src/styles.css`:

```css
.install-button {
  display: block;
  margin: 0.75rem auto 0;
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #4a6;
  background: transparent;
  color: #5b7;
}
.install-button:hover {
  background: #2f4636;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/InstallButton.tsx src/components/InstallButton.test.tsx src/styles.css
git commit -m "feat(install): add InstallButton orchestrator component"
```

---

## Task 6: Wire InstallButton into GameScreen

**Files:**
- Modify: `src/components/GameScreen.tsx`

Context: `GameScreen` (src/components/GameScreen.tsx) has `status: "playing" | "revealed" | "empty"`, `choice: 0 | 1 | null`, and computes `correctIndex` after the empty-state early return. The final `return (...)` renders `<div className="screen game">` containing `topBar`, `ScoreBar`, the question, then a `{isMobile ? (...) : (...)}` block, then closes the div.

- [ ] **Step 1: Add the import**

In `src/components/GameScreen.tsx`, add after the existing `ResultComparePanel` import (line 10):

```tsx
import { InstallButton } from "./InstallButton";
```

- [ ] **Step 2: Compute the wrong-answer flag**

In `src/components/GameScreen.tsx`, immediately after the existing line `const correctIndex = isCorrect(0, round.countsA, round.countsB, round.perspective) ? 0 : 1;`, add:

```tsx
  const wasWrong = status === "revealed" && choice !== correctIndex;
```

- [ ] **Step 3: Render the button on a wrong reveal**

In the final `return`, add `{wasWrong && <InstallButton />}` as the LAST child of `<div className="screen game">`, immediately after the closing `)}` of the `{isMobile ? (...) : (...)}` block and before the closing `</div>`. The end of the JSX becomes:

```tsx
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
            <button className="next" type="button" onClick={newRound}>{t.next}</button>
          ) : null}
        </>
      )}
      {wasWrong && <InstallButton />}
    </div>
  );
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test -- --run`
Expected: all tests pass (87 total: 76 prior + 4 installMode + 4 IosInstallModal + 3 InstallButton). GameScreen tests are unaffected: in jsdom the install mode resolves to `none` (matchMedia `matches:false`, non-iOS UA, no `beforeinstallprompt`), so `InstallButton` renders nothing even when `wasWrong` is true.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/GameScreen.tsx
git commit -m "feat(install): show install button on wrong-answer result"
```

---

## Task 7: Build + verification

**Files:** none (verification only)

- [ ] **Step 1: Full suite + type-check + build**

Run:
```bash
npm test -- --run && npx tsc --noEmit && npm run build
```
Expected: 87 tests pass, no type errors, build succeeds.

- [ ] **Step 2: Manual sanity check (optional, desktop browser)**

Run `npm run preview`, open the app, play and answer a question **wrong**. On the result screen:
- Desktop Chrome with a captured install prompt → an "📲 Install app" button appears; clicking opens the browser install dialog.
- If no prompt is available and not iOS → no button (expected; `mode: none`).
- To simulate iOS UX you can't easily do so on desktop — that path is covered by unit tests and verified on a real device after deploy.

Stop the preview server (Ctrl+C) when done.

---

## Notes for the implementer

- **No new dependencies.** This is all first-party code plus the existing vite-plugin-pwa SW from the previous feature.
- **iOS reality:** iOS Safari never fires `beforeinstallprompt`, so the iOS path can only *instruct* (Share → Add to Home Screen); it cannot trigger an automatic install. That is why `mode: "ios"` opens a modal rather than calling `promptInstall`.
- **Why the button hides after install:** an installed PWA launches in `standalone` display mode, so `isStandaloneDisplay()` is true → `mode: "none"` → the button never renders.
- **Deploy** is unchanged: pushing to `main` runs `.github/workflows/deploy.yml`.
