import { defineConfig, devices } from '@playwright/test'

const isCI = Boolean(process.env.CI)
const artifactSuffix = process.env.PLAYWRIGHT_ARTIFACT_SUFFIX?.trim()
const htmlOutputFolder = artifactSuffix
  ? `playwright-report/${artifactSuffix}`
  : 'playwright-report'
const outputDir = artifactSuffix ? `test-results/${artifactSuffix}` : 'test-results'
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER !== '0' && !isCI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  maxFailures: isCI ? 10 : undefined,
  outputDir,
  reporter: [['list'], ['html', { open: 'never', outputFolder: htmlOutputFolder }]],
  globalSetup: './e2e/global-setup.mjs',
  use: {
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
        name: 'portal',
        testMatch: /portal\/.*\.spec\.ts/,
        use: {
          ...devices['Desktop Chrome'],
          baseURL: 'http://localhost:5520',
        },
      },
    {
        name: 'admin',
        testMatch: /admin\/.*\.spec\.ts/,
        use: {
          ...devices['Desktop Chrome'],
          baseURL: 'http://localhost:5510',
        },
    },
  ],
  webServer: [
    {
      command:
        'cd apps/portal && bun run dev -- --host localhost --port 5520 --strictPort',
      url: 'http://localhost:5520',
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command:
        'cd apps/admin && bun run dev -- --host localhost --port 5510 --strictPort',
      url: 'http://localhost:5510',
      reuseExistingServer,
      timeout: 120_000,
    },
  ],
})
