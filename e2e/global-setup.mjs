import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const databaseDir = path.join(__dirname, '..', 'packages', 'database')

function runPrisma(...args) {
  const result = spawnSync('bunx', ['prisma', ...args], {
    cwd: databaseDir,
    stdio: 'inherit',
    env: process.env,
  })

  if (result.status !== 0) {
    throw new Error(`Failed: bunx prisma ${args.join(' ')}`)
  }
}

export default async function globalSetup() {
  if (process.env.E2E_SKIP_DB_SETUP === '1') {
    return
  }

  const shouldResetDb =
    process.env.CI || process.env.E2E_DB_RESET !== '0'

  if (shouldResetDb) {
    runPrisma('db', 'push', '--force-reset')
  } else {
    runPrisma('db', 'push')
  }

  runPrisma('db', 'seed')
}
