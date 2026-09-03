import type { Command } from "commander";
import { $ } from "bun";

export function registerDbMigrate(program: Command) {
  program
    .command("db:migrate")
    .description(
      "Apply pending migrations (prisma migrate deploy) — for CI and release steps, never seeds",
    )
    .action(async () => {
      if (!process.env.DATABASE_URL) {
        console.error(
          "DATABASE_URL is not set. Point it at the target database before running db:migrate.",
        );
        process.exit(1);
      }

      console.log("Applying pending migrations (prisma migrate deploy)...");
      await $`bunx prisma migrate deploy`.cwd("packages/database");
      console.log("Done! Database is up to date.");
    });
}
