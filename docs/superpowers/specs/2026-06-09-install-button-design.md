# In-App Install Button — Design

**Date:** 2026-06-09
**Status:** Approved (pending spec review)

## Goal

Add a discoverable "install app" button that appears on the result screen after
the player answers **wrong** (game over), prompting them to install the PWA. The
button must work across platforms and must NOT appear once the app is already
installed (running standalone).

Motivation: the browser's native install affordance is hard to find on mobile —
and on iOS Safari there is no automatic prompt at all (only a manual Share →
"Add to Home Screen" flow). An in-app button makes installing discoverable.

## Behaviour

- **Where it shows:** in the revealed result, only when the answer was wrong
  (`status === "revealed"` and the player's choice was not the correct one), and
  only when the app is installable-and-not-yet-installed. Rendered once, below
  the result content, shared by the mobile and desktop layouts.
- **Platform modes** (resolved by a pure function from three inputs):
  - `'native'` — a `beforeinstallprompt` event was captured (Android/desktop
    Chromium). Clicking calls the stored event's `.prompt()`.
  - `'ios'` — iOS device, not standalone (Safari has no `beforeinstallprompt`).
    Clicking opens a modal explaining Share → "Add to Home Screen".
  - `'none'` — already installed (standalone display mode / `navigator.standalone`)
    OR not installable. The button renders nothing.
- **After install:** when launched as an installed PWA, display-mode is
  `standalone`, so mode is `'none'` and the button never renders. (Requirement met.)
- **No dismiss / persistence** (YAGNI): the button only appears on wrong-answer
  results and disappears permanently once installed.

## Components / Files

1. `src/pwa/installMode.ts` (new, pure)
   - `type InstallMode = "none" | "native" | "ios"`
   - `resolveInstallMode({ isStandalone, isIOS, hasPrompt }): InstallMode`
     — `isStandalone` → `"none"`; else `hasPrompt` → `"native"`; else `isIOS` →
     `"ios"`; else `"none"`.
   - `isIOSDevice(): boolean` — UA test for iPhone/iPad/iPod, including iPadOS 13+
     (reports as Mac but has touch points).
   - `isStandaloneDisplay(): boolean` — `matchMedia("(display-mode: standalone)").matches`
     OR `navigator.standalone === true`.
2. `src/pwa/useInstallPrompt.ts` (new, hook)
   - On mount: listen for `beforeinstallprompt`, `preventDefault()`, store the
     event in state; also listen for `appinstalled` to clear it. Clean up
     listeners on unmount.
   - Returns `{ mode: InstallMode; promptInstall: () => void }`.
   - `mode` computed via `resolveInstallMode` from `isStandaloneDisplay()`,
     `isIOSDevice()`, and whether a prompt event is held.
   - `promptInstall()` calls the stored event's `.prompt()` when present (native);
     no-op otherwise.
3. `src/components/IosInstallModal.tsx` (new, pure)
   - Props `{ open: boolean; onClose: () => void }`. Renders null when closed.
   - When open: overlay + centered card with title, two numbered steps, a close
     button. All copy via `useT()`.
4. `src/components/InstallButton.tsx` (new, orchestrator)
   - Uses `useInstallPrompt()`. If `mode === "none"` → render null.
   - Renders the install button (`t.installApp`). On click: `"native"` →
     `promptInstall()`; `"ios"` → open the `IosInstallModal` (local `useState`).
5. `src/components/GameScreen.tsx` (modify)
   - Compute `wasWrong = status === "revealed" && choice !== correctIndex`.
   - Render `{wasWrong && <InstallButton />}` once, after the mobile/desktop
     result block, as the last child of `.screen.game`.
6. `src/i18n/strings.ts` (modify) — add keys to both `ko` and `en`:
   - `installApp` — "📲 앱 설치" / "📲 Install app"
   - `iosInstallTitle` — "홈 화면에 추가" / "Add to Home Screen"
   - `iosInstallStep1` — "하단 공유 버튼을 누르세요" / "Tap the Share button below"
   - `iosInstallStep2` — "'홈 화면에 추가'를 선택하세요" / "Choose 'Add to Home Screen'"
   - `close` — "닫기" / "Close"
7. `src/styles.css` (modify) — `.install-button` (outlined secondary action,
   distinct from the green `.next`), `.install-modal-overlay`, `.install-modal`.

## Data Flow

`beforeinstallprompt` (browser) → captured by `useInstallPrompt` →
`mode`/`promptInstall` → `InstallButton` decides render + click action →
GameScreen gates render on `wasWrong`. The pure `resolveInstallMode` is the
single source of truth for which mode applies.

## Testing

- `src/pwa/installMode.test.ts` — `resolveInstallMode` truth table: standalone →
  none; hasPrompt → native; iOS (no prompt, not standalone) → ios; none of the
  above → none.
- `src/components/IosInstallModal.test.tsx` — closed → renders nothing; open →
  shows title + both steps; clicking close calls `onClose`; English copy under
  an `en` provider.
- `src/components/InstallButton.test.tsx` — mock `../pwa/useInstallPrompt`:
  mode `none` → renders nothing; mode `native` → clicking calls `promptInstall`;
  mode `ios` → clicking renders the modal.
- Existing 76 tests must still pass. GameScreen tests are unaffected because in
  jsdom (test-setup `matchMedia` returns `matches:false`, UA is not iOS, no
  `beforeinstallprompt`) the mode resolves to `none`, so `InstallButton` renders
  nothing.

## Out of Scope

- Dismiss / "don't show again" persistence
- Showing the button on correct-answer results or outside the result screen
- Custom install UI for browsers without `beforeinstallprompt` that also aren't
  iOS (they fall to `'none'` — users use the browser's own menu)
- Tracking install conversions in analytics
