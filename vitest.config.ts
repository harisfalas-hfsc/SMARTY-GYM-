import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests run plain modules, not Vite's application/RPC transforms.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});