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
  // Known false-positive: Intel Mac + external touch display; accepted industry-wide limitation.
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

export function isStandaloneDisplay(): boolean {
  const byMedia = window.matchMedia("(display-mode: standalone)").matches;
  const byIOS = (navigator as { standalone?: boolean }).standalone === true;
  return byMedia || byIOS;
}
