import { useSyncExternalStore } from "react";
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

// beforeinstallprompt is a one-shot event that fires shortly after page load —
// before the install button (which lives on the result screen) ever mounts. So
// capture it at module load and expose it through an external store, rather than
// in a component effect that would register too late and miss it.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Suppress Chrome's default mini-infobar; we trigger the prompt from our button.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit();
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export interface InstallPrompt {
  mode: InstallMode;
  promptInstall: () => void;
}

export function useInstallPrompt(): InstallPrompt {
  const prompt = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const mode = resolveInstallMode({
    isStandalone: isStandaloneDisplay(),
    isIOS: isIOSDevice(),
    hasPrompt: prompt !== null,
  });

  const promptInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt = null;
      emit();
    }
  };

  return { mode, promptInstall };
}
