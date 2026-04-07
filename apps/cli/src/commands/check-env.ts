import type { Command } from "commander";
import { $ } from "bun";
import { readFileSync, existsSync } from "node:fs";

export function registerCheckEnv(program: Command) {
  program
    .command("check:env")
    .description("Validate environment and dependencies")
    .action(async () => {
      let exitCode = 0;

      function pass(msg: string) {
        console.log(`  + ${msg}`);
      }

      function fail(msg: string) {
        console.log(`  x ${msg}`);
        exitCode = 1;
      }

      const envPath = "packages/database/.env";

      console.log("Environment:");
      if (existsSync(envPath)) {
        pass(`${envPath} exists`);
      } else {
        fail(`${envPath} not found. Create one with DATABASE_URL.`);
      }

      if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, "utf-8");
        const match = envContent.match(/^DATABASE_URL=(.+)/m);
        if (match && match[1].trim()) {
          pass("DATABASE_URL is set");
        } else {
          fail(`DATABASE_URL is missing or empty in ${envPath}`);
        }
      }

      console.log("\nDatabase:");
      try {
        await $`pg_isready -h localhost -p 5432 2>&1`.text();
        pass("PostgreSQL is reachable");
      } catch {
        fail("PostgreSQL is not reachable at localhost:5432. Is it running?");
      }

      console.log("\nPrisma:");
      if (existsSync("node_modules/@prisma/client")) {
        pass("Prisma client is generated");
      } else {
        fail("Prisma client not found. Run: cli db:setup");
      }

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
    });
}
