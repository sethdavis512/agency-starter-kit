import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/utils',
      'packages/validation',
      'packages/database',
      'packages/auth',
      'packages/ui',
      'packages/ui-mcp',
      'apps/portal',
      'apps/admin',
      'apps/cli',
    ],
  },
})
