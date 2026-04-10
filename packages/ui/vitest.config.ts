import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'ui',
    environment: 'happy-dom',
    setupFiles: ['./test-setup.ts'],
  },
})
