# PWA + Offline Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "Guess the Winrate" installable as a PWA and fully playable offline, with a toast prompting users to refresh when a new version is deployed.

**Architecture:** Add `vite-plugin-pwa` (Workbox) to generate the web app manifest and a precaching service worker from build output. Because the entire dataset (`openings.json`) is bundled into the JS, precaching build assets yields complete offline play. A thin hook wraps the plugin's `useRegisterSW` and a presentational `UpdateToast` component shows the "new version" prompt.

**Tech Stack:** Vite 5, React, TypeScript, vitest + @testing-library/react, vite-plugin-pwa@^0.21.2 (Workbox), @resvg/resvg-js-cli (icon rasterization).

---

## File Structure

- `scripts/pwa-icon.svg` (new) — 512×512 source for the standard ("any") icon.
- `scripts/pwa-maskable.svg` (new) — 512×512 source for the maskable icon (safe-zone padded).
- `public/pwa-192.png`, `public/pwa-512.png`, `public/pwa-maskable-512.png` (new, generated) — PWA icons.
- `vite.config.ts` (modify) — register `VitePWA` plugin with manifest + Workbox config; excluded under vitest.
- `src/vite-env.d.ts` (modify) — add vite-plugin-pwa virtual-module type references.
- `src/i18n/strings.ts` (modify) — add `updateAvailable` / `refresh` strings (ko + en).
- `src/components/UpdateToast.tsx` (new) — presentational toast; pure, no virtual import.
- `src/components/UpdateToast.test.tsx` (new) — unit tests for the toast.
- `src/pwa/useServiceWorkerUpdate.ts` (new) — thin hook wrapping `virtual:pwa-register/react`.
- `src/App.tsx` (modify) — wire hook + render `UpdateToast`.
- `src/App.test.tsx` (modify) — mock the hook so the virtual import is never evaluated in tests.
- `src/styles.css` (modify) — `.update-toast` styles.

**Why split the toast from the hook:** the hook imports a Vite *virtual module* (`virtual:pwa-register/react`) that does not resolve under vitest. Keeping that import isolated in one file means the presentational component stays trivially testable, and any test rendering `App` simply mocks the one hook module.

---

## Task 1: PWA icons

**Files:**
- Create: `scripts/pwa-icon.svg`
- Create: `scripts/pwa-maskable.svg`
- Create (generated): `public/pwa-192.png`, `public/pwa-512.png`, `public/pwa-maskable-512.png`

- [ ] **Step 1: Create the standard icon source**

Create `scripts/pwa-icon.svg` (chessboard motif, matches existing `public/favicon.svg`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#2a2a2a" />
  <rect x="96"  y="96"  width="160" height="160" fill="#f0d9b5" />
  <rect x="256" y="96"  width="160" height="160" fill="#4a9d6a" />
  <rect x="96"  y="256" width="160" height="160" fill="#4a9d6a" />
  <rect x="256" y="256" width="160" height="160" fill="#f0d9b5" />
</svg>
```

- [ ] **Step 2: Create the maskable icon source**

Create `scripts/pwa-maskable.svg` (full-bleed background, board scaled to the central safe zone so masks don't clip it):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2a2a2a" />
  <rect x="156" y="156" width="100" height="100" fill="#f0d9b5" />
  <rect x="256" y="156" width="100" height="100" fill="#4a9d6a" />
  <rect x="156" y="256" width="100" height="100" fill="#4a9d6a" />
  <rect x="256" y="256" width="100" height="100" fill="#f0d9b5" />
</svg>
```

- [ ] **Step 3: Generate the PNG icons**

Run:
```bash
npx --yes @resvg/resvg-js-cli --fit-width 192 scripts/pwa-icon.svg public/pwa-192.png
npx --yes @resvg/resvg-js-cli --fit-width 512 scripts/pwa-icon.svg public/pwa-512.png
npx --yes @resvg/resvg-js-cli --fit-width 512 scripts/pwa-maskable.svg public/pwa-maskable-512.png
```
Expected: three lines like `I|resvg-js: .../public/pwa-192.png`.

- [ ] **Step 4: Verify dimensions**

Run:
```bash
file public/pwa-192.png public/pwa-512.png public/pwa-maskable-512.png
```
Expected: `PNG image data, 192 x 192 ...`, `512 x 512 ...`, `512 x 512 ...`.

- [ ] **Step 5: Commit**

```bash
git add scripts/pwa-icon.svg scripts/pwa-maskable.svg public/pwa-192.png public/pwa-512.png public/pwa-maskable-512.png
git commit -m "feat(pwa): add PWA app icons (standard + maskable)"
```

---

## Task 2: Add and configure vite-plugin-pwa

**Files:**
- Modify: `package.json` (devDependency, via npm)
- Modify: `vite.config.ts`

- [ ] **Step 1: Install the plugin**

Run:
```bash
npm install -D vite-plugin-pwa@^0.21.2
```
Expected: package added; `npm ls vite-plugin-pwa` shows `vite-plugin-pwa@0.21.x`.

- [ ] **Step 2: Register VitePWA in the Vite config**

Replace the entire contents of `vite.config.ts` with:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// vite-plugin-pwa adds build-only hooks and a virtual module that does not
// resolve under vitest, so skip it during tests (process.env.VITEST is set by
// vitest at config-load time).
const pwa = VitePWA({
  registerType: "prompt",
  includeAssets: ["favicon.svg"],
  manifest: {
    name: "승률 맞히기 — Guess the Winrate",
    short_name: "승률 맞히기",
    description: "두 체스 오프닝 중 승률이 더 높은 쪽을 맞혀보세요.",
    lang: "ko",
    start_url: "/guess-the-winrate/",
    scope: "/guess-the-winrate/",
    display: "standalone",
    background_color: "#2a2a2a",
    theme_color: "#2a2a2a",
    icons: [
      { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,svg,png,json,woff2}"],
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
  },
});

export default defineConfig({
  // Served from https://hdh4952.github.io/guess-the-winrate/ (GitHub project page).
  base: "/guess-the-winrate/",
  plugins: [react(), ...(process.env.VITEST ? [] : [pwa])],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

- [ ] **Step 3: Verify the build emits the SW and manifest**

Run:
```bash
npm run build
ls dist/sw.js dist/manifest.webmanifest dist/workbox-*.js
```
Expected: build succeeds; `dist/sw.js`, `dist/manifest.webmanifest`, and a `dist/workbox-*.js` all exist.

- [ ] **Step 4: Verify the manifest content and base-aware injection**

Run:
```bash
cat dist/manifest.webmanifest
grep -o 'registerSW.js\|manifest.webmanifest' dist/index.html
```
Expected: manifest JSON shows the Korean name, `"start_url":"/guess-the-winrate/"`, and the three icons; `dist/index.html` references the manifest.

- [ ] **Step 5: Confirm existing tests still pass (plugin excluded under vitest)**

Run:
```bash
npm test -- --run
```
Expected: all 72 tests pass (no virtual-module resolution errors).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "feat(pwa): configure vite-plugin-pwa (manifest + precache SW)"
```

---

## Task 3: Virtual-module type references

**Files:**
- Modify: `src/vite-env.d.ts`

- [ ] **Step 1: Add the type references**

Replace the contents of `src/vite-env.d.ts` with:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_LICHESS_TOKEN?: string;
}
```

- [ ] **Step 2: Verify the type-check passes**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors (the `virtual:pwa-register/react` module now has types).

- [ ] **Step 3: Commit**

```bash
git add src/vite-env.d.ts
git commit -m "feat(pwa): add vite-plugin-pwa virtual module types"
```

---

## Task 4: i18n strings for the update prompt

**Files:**
- Modify: `src/i18n/strings.ts`

- [ ] **Step 1: Add the Korean strings**

In `src/i18n/strings.ts`, inside the `const ko = { ... }` object, add these two entries after the `myPick: "내 선택",` line (before the closing `}`):

```ts
  // UpdateToast (PWA)
  updateAvailable: "새 버전이 있어요",
  refresh: "새로고침",
```

- [ ] **Step 2: Add the English strings**

In the same file, inside `const en: Strings = { ... }`, add after the `myPick: "My pick",` line:

```ts
  updateAvailable: "A new version is available",
  refresh: "Refresh",
```

- [ ] **Step 3: Run the strings parity test**

Run:
```bash
npm test -- --run src/i18n/strings.test.ts
```
Expected: PASS — the "ko and en expose the same keys" test confirms both languages gained the keys.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/strings.ts
git commit -m "feat(pwa): add update-prompt i18n strings"
```

---

## Task 5: UpdateToast presentational component (TDD)

**Files:**
- Create: `src/components/UpdateToast.tsx`
- Test: `src/components/UpdateToast.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

Create `src/components/UpdateToast.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LanguageProvider } from "../i18n/LanguageContext";
import { UpdateToast } from "./UpdateToast";

describe("UpdateToast", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <UpdateToast visible={false} onRefresh={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows the Korean message and refresh button when visible", () => {
    const { getByText, getByRole } = render(
      <UpdateToast visible onRefresh={() => {}} />,
    );
    expect(getByText("새 버전이 있어요")).toBeInTheDocument();
    expect(getByRole("button", { name: "새로고침" })).toBeInTheDocument();
  });

  it("calls onRefresh when the button is clicked", () => {
    const onRefresh = vi.fn();
    const { getByRole } = render(
      <UpdateToast visible onRefresh={onRefresh} />,
    );
    fireEvent.click(getByRole("button", { name: "새로고침" }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("renders English copy under an en provider", () => {
    const { getByText, getByRole } = render(
      <LanguageProvider initialLang="en">
        <UpdateToast visible onRefresh={() => {}} />
      </LanguageProvider>,
    );
    expect(getByText("A new version is available")).toBeInTheDocument();
    expect(getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test -- --run src/components/UpdateToast.test.tsx
```
Expected: FAIL — `Failed to resolve import "./UpdateToast"` (component not created yet).

- [ ] **Step 3: Implement the component**

Create `src/components/UpdateToast.tsx`:

```tsx
import { useT } from "../i18n/useT";

interface Props {
  visible: boolean;
  onRefresh: () => void;
}

export function UpdateToast({ visible, onRefresh }: Props) {
  const t = useT();
  if (!visible) return null;
  return (
    <div className="update-toast" role="status">
      <span>{t.updateAvailable}</span>
      <button type="button" onClick={onRefresh}>
        {t.refresh}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test -- --run src/components/UpdateToast.test.tsx
```
Expected: PASS (4 tests).

- [ ] **Step 5: Add the toast styles**

Append to `src/styles.css`:

```css
.update-toast {
  position: fixed;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 200;
}
.update-toast button {
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 8px;
  background: #4a6;
  color: #fff;
  cursor: pointer;
}
.update-toast button:hover {
  background: #3a5a43;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/UpdateToast.tsx src/components/UpdateToast.test.tsx src/styles.css
git commit -m "feat(pwa): add UpdateToast component"
```

---

## Task 6: Service-worker update hook + wire into App

**Files:**
- Create: `src/pwa/useServiceWorkerUpdate.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Create the hook**

Create `src/pwa/useServiceWorkerUpdate.ts`:

```ts
import { useRegisterSW } from "virtual:pwa-register/react";

export interface ServiceWorkerUpdate {
  /** True when a newer service worker is installed and waiting. */
  needRefresh: boolean;
  /** Activate the waiting worker and reload the page. */
  refresh: () => void;
}

export function useServiceWorkerUpdate(): ServiceWorkerUpdate {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  return {
    needRefresh,
    refresh: () => updateServiceWorker(true),
  };
}
```

- [ ] **Step 2: Mock the hook in the existing App test**

In `src/App.test.tsx`:

(a) Add `vi` to the existing vitest import on line 1 — change:

```tsx
import { describe, it, expect } from "vitest";
```
to:
```tsx
import { describe, it, expect, vi } from "vitest";
```

(b) Add this mock immediately after the imports (after line 4), before the `describe(...)` block. This prevents the real hook (and its virtual-module import) from loading under vitest:

```tsx
vi.mock("./pwa/useServiceWorkerUpdate", () => ({
  useServiceWorkerUpdate: () => ({ needRefresh: false, refresh: () => {} }),
}));
```

- [ ] **Step 3: Wire the hook and toast into App**

In `src/App.tsx`:

(a) Add imports after the existing `LanguageToggle` import (line 7):

```tsx
import { UpdateToast } from "./components/UpdateToast";
import { useServiceWorkerUpdate } from "./pwa/useServiceWorkerUpdate";
```

(b) Add the hook call as the first line inside `App()` (before the `useState` for `bucket`, at line 13):

```tsx
  const { needRefresh, refresh } = useServiceWorkerUpdate();
```

(c) Render the toast as the last child of `<main className="app">`, immediately before the closing `</main>` (line 54):

```tsx
      <UpdateToast visible={needRefresh} onRefresh={refresh} />
```

- [ ] **Step 4: Run the App test to verify it passes**

Run:
```bash
npm test -- --run src/App.test.tsx
```
Expected: PASS (2 tests) — the mocked hook returns `needRefresh: false`, so the toast renders nothing and existing assertions are unaffected.

- [ ] **Step 5: Run the full test suite**

Run:
```bash
npm test -- --run
```
Expected: all tests pass (76 total: prior 72 + 4 new UpdateToast tests).

- [ ] **Step 6: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/pwa/useServiceWorkerUpdate.ts src/App.tsx src/App.test.tsx
git commit -m "feat(pwa): register service worker and show update toast"
```

---

## Task 7: Build + manual offline verification

**Files:** none (verification only)

- [ ] **Step 1: Production build**

Run:
```bash
npm run build
```
Expected: succeeds; `dist/` contains `sw.js`, `manifest.webmanifest`, `workbox-*.js`, `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`.

- [ ] **Step 2: Serve the build**

Run:
```bash
npm run preview
```
Note the local URL (e.g. `http://localhost:4173/guess-the-winrate/`).

- [ ] **Step 3: Manual checks in the browser (DevTools › Application)**

Confirm each:
- **Manifest**: recognized, name "승률 맞히기 — Guess the Winrate", 3 icons listed.
- **Service Workers**: a worker is registered and "activated".
- **Offline play**: in the Network tab toggle "Offline", then reload — the game still loads and a round is playable (rating picker → opening comparison). This proves the bundled dataset is served from cache.
- **Install**: the browser shows an install affordance (address-bar icon / "Add to Home Screen").

- [ ] **Step 4: Stop the preview server**

Stop the `npm run preview` process (Ctrl+C).

- [ ] **Step 5: Final full verification**

Run:
```bash
npm test -- --run && npm run build
```
Expected: all tests pass and build succeeds.

---

## Notes for the implementer

- **Update flow in production:** after this ships, the *next* deploy is what exercises the toast — returning users get a waiting SW, `needRefresh` flips true, the toast appears, and clicking it calls `updateServiceWorker(true)` (activate + reload). The first deploy of this feature just installs the SW silently (no toast, since there's no prior version to replace).
- **Do not** add the SW or `devOptions.enabled` for dev mode — the plugin keeps the SW out of `npm run dev` by default, which avoids cache-staleness headaches while developing.
- **Deploy** is unchanged: pushing to `main` runs `.github/workflows/deploy.yml`, which already runs `npm ci && npm run build` and publishes `dist/` (now including the SW, manifest, and icons).
