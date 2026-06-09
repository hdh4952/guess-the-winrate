import { describe, it, expect } from "vitest";
import { resolveInstallMode } from "./installMode";

describe("resolveInstallMode", () => {
  it("returns none when already installed (standalone), even with a prompt", () => {
    expect(resolveInstallMode({ isStandalone: true, isIOS: false, hasPrompt: true })).toBe("none");
    expect(resolveInstallMode({ isStandalone: true, isIOS: true, hasPrompt: false })).toBe("none");
  });

  it("returns native when a beforeinstallprompt was captured", () => {
    expect(resolveInstallMode({ isStandalone: false, isIOS: false, hasPrompt: true })).toBe("native");
    // iOS + a captured prompt (impossible on real devices, but the prompt wins)
    expect(resolveInstallMode({ isStandalone: false, isIOS: true, hasPrompt: true })).toBe("native");
  });

  it("returns ios on iOS with no prompt and not installed", () => {
    expect(resolveInstallMode({ isStandalone: false, isIOS: true, hasPrompt: false })).toBe("ios");
  });

  it("returns none when not installable and not iOS", () => {
    expect(resolveInstallMode({ isStandalone: false, isIOS: false, hasPrompt: false })).toBe("none");
  });
});
