import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Actions sets GITHUB_REPOSITORY. Project Pages are served from /<repo>/.
// A user or organisation site (*.github.io) stays at /. Local builds stay at /.
function siteBase(): string {
  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (!repository || repository.endsWith(".github.io")) {
    return "/";
  }
  return `/${repository}/`;
}

export default defineConfig({
  base: siteBase(),
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Staple Price Watch",
        short_name: "Staples",
        description: "Personal staple grocery prices.",
        display: "standalone",
        background_color: "#f6f4ef",
        theme_color: "#1c1915",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest,wasm,gz}"],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
      },
    }),
  ],
});
