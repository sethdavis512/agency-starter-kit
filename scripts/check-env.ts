import { $ } from "bun";
import { readFileSync, existsSync } from "node:fs";

const ENV_PATH = "packages/database/.env";
let exitCode = 0;

function pass(msg: string) {
    console.log(`  ✓ ${msg}`);
}

function fail(msg: string) {
    console.log(`  ✗ ${msg}`);
    exitCode = 1;
}

// 1. Check .env file exists
console.log("Environment:");
if (existsSync(ENV_PATH)) {
    pass(`${ENV_PATH} exists`);
} else {
    fail(`${ENV_PATH} not found. Copy from .env.example or create one with DATABASE_URL.`);
}

// 2. Check required env vars
const requiredVars = ["DATABASE_URL"];

if (existsSync(ENV_PATH)) {
    const envContent = readFileSync(ENV_PATH, "utf-8");
    for (const varName of requiredVars) {
        const match = envContent.match(new RegExp(`^${varName}=(.+)`, "m"));
        if (match && match[1].trim()) {
            pass(`${varName} is set`);
        } else {
            fail(`${varName} is missing or empty in ${ENV_PATH}`);
        }
    }
}

// 3. Check Postgres is reachable
console.log("\nDatabase:");
try {
    const result =
        await $`pg_isready -h localhost -p 5432 2>&1`.text();
    pass(`PostgreSQL is reachable`);
} catch {
    fail("PostgreSQL is not reachable at localhost:5432. Is it running?");
}

// 4. Check Prisma client is generated
console.log("\nPrisma:");
try {
    const clientPath = "node_modules/@prisma/client";
    if (existsSync(clientPath)) {
        pass("Prisma client is generated");
    } else {
        fail("Prisma client not found. Run: bun scripts/setup-db.ts");
    }
} catch {
    fail("Could not check Prisma client");
}

// 5. Check node_modules exist
console.log("\nDependencies:");
if (existsSync("node_modules")) {
    pass("node_modules installed");
} else {
    fail("node_modules not found. Run: bun install");
}

console.log("");
if (exitCode === 0) {
    console.log("All checks passed.");
} else {
    console.log("Some checks failed. Fix the issues above.");
}

process.exit(exitCode);
