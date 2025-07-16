import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    exclude: [
      "node_modules/**/*",
      "tests/e2e/**/*",
      "**/*.e2e.spec.ts",
      "**/*.e2e.test.ts",
      "tests/global-teardown.spec.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "tests/e2e/",
        "**/*.d.ts",
        "**/*.config.*",
        "dist/",
        ".astro/",
        "supabase/",
        "docs/",
        "public/",
        "**/*.astro",
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
