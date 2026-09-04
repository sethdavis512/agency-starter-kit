import { defineConfig, devices } from "@playwright/test";
import { EMAIL_OUTBOX_FILE } from "./e2e/helpers/email";

const isCI = Boolean(process.env.CI);
const artifactSuffix = process.env.PLAYWRIGHT_ARTIFACT_SUFFIX?.trim();
const htmlOutputFolder = artifactSuffix
  ? `playwright-report/${artifactSuffix}`
  : "playwright-report";
const outputDir = artifactSuffix
  ? `test-results/${artifactSuffix}`
  : "test-results";
const reuseExistingServer =
  process.env.PLAYWRIGHT_REUSE_SERVER === "1" && !isCI;

// Force the console email transport (no real mail, even if a developer has
// RESEND_API_KEY in their shell), mirror each message to the outbox file the
// specs read, and keep sign-in free of the verification gate.
const emailEnv = {
  RESEND_API_KEY: "",
  EMAIL_OUTBOX_FILE,
  REQUIRE_EMAIL_VERIFICATION: "0",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  maxFailures: isCI ? 10 : undefined,
  outputDir,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: htmlOutputFolder }],
  ],
  globalSetup: "./e2e/global-setup.mjs",
  use: {
    trace: isCI ? "on-first-retry" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "portal",
      testMatch: /portal\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:5520",
      },
    },
    {
      name: "admin",
      testMatch: /admin\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:5510",
      },
    },
  ],
  webServer: [
    {
      command:
        "cd apps/portal && bun run dev -- --host localhost --port 5520 --strictPort",
      url: "http://localhost:5520",
      reuseExistingServer,
      timeout: 120_000,
      env: {
        ...emailEnv,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:5520",
      },
    },
    {
      command:
        "cd apps/admin && bun run dev -- --host localhost --port 5510 --strictPort",
      url: "http://localhost:5510",
      reuseExistingServer,
      timeout: 120_000,
      env: {
        ...emailEnv,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:5510",
      },
    },
  ],
});
