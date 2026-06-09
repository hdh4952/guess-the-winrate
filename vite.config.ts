import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// vite-plugin-pwa adds build-only hooks and a virtual module that does not
// resolve under vitest, so skip it during tests (process.env.VITEST is set by
// vitest at config-load time).
const pwa = VitePWA({
  registerType: "prompt",
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
