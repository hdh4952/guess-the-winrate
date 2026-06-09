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
    // reloadPage arg is ignored since vite-plugin-pwa 0.13.2; the reload is
    // driven by the new SW activating. onRegisterError is not forwarded, so SW
    // registration failures are currently silent.
    refresh: () => updateServiceWorker(true),
  };
}
