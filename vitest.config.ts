import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/utils",
      "packages/database",
      "packages/auth",
      "packages/ui",
      "packages/ui-mcp",
      "apps/portal",
      "apps/admin",
      "apps/cli",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [...coverageConfigDefaults.exclude, "**/generated/**"],
    },
  },
});
