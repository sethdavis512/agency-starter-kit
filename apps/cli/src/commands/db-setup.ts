import type { Command } from "commander";
import { $ } from "bun";
import { decideSeed } from "../lib/seed-gate";

export function registerDbSetup(program: Command) {
  program
    .command("db:setup")
    .description(
      "Generate Prisma client, apply migrations (migrate dev), and seed a local database",
    )
    .option(
      "--seed",
      "seed demo users even when DATABASE_URL is not local (requires SEED_PASSWORD)",
    )
    .action(async (options: { seed?: boolean }) => {
      const cwd = "packages/database";

      console.log("1/3 Generating Prisma client...");
      await $`bunx prisma generate`.cwd(cwd);

      console.log("2/3 Applying migrations (prisma migrate dev)...");
      await $`bunx prisma migrate dev --skip-generate`.cwd(cwd);

      const decision = decideSeed({
        seedFlag: options.seed ?? false,
        databaseUrl: process.env.DATABASE_URL,
        seedPassword: process.env.SEED_PASSWORD,
      });

      if (decision.action === "refuse") {
        console.error(`3/3 Seed aborted: ${decision.reason}`);
        process.exit(1);
      }

      if (decision.action === "skip") {
        console.log(`3/3 Skipping seed: ${decision.reason}`);
        console.log("Done! Database is migrated.");
        return;
      }

      console.log(`3/3 Seeding database (${decision.reason})...`);
      await $`bunx prisma db seed`.cwd(cwd);

      console.log("Done! Database is ready.");
    });
}
