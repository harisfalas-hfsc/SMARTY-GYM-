// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const APP_BUILD_ID = `${Date.now()}`;

export default defineConfig({
  vite: {
    plugins: [
      {
        name: "smarty-build-version",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "build-version.json",
            source: JSON.stringify({ buildId: APP_BUILD_ID }),
          });
        },
      },
    ],
    build: {
      // The native shell builder reads this manifest to find the hashed entry
      // instead of scanning minified bundles for `createRoot`.
      manifest: true,
    },
    define: {
      __APP_BUILD_ID__: JSON.stringify(APP_BUILD_ID),
    },
  },
  tanstackStart: {
    // The custom entry hydrates the website normally and mounts the bundled
    // native shell as a client-rendered app when Capacitor loads index.html.
    client: { entry: "client" },
    // The submitted phone apps wait for this URL before showing the website.
    // Emit the homepage as a ready-to-paint file so the WebView receives the
    // black SMARTYGYM frame without waiting for a server render.
    prerender: {
      enabled: true,
      autoStaticPathsDiscovery: false,
      crawlLinks: false,
      failOnError: true,
    },
    pages: [{ path: "/" }],
  },
});
