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
