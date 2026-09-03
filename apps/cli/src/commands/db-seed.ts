import type { Command } from "commander";
import { $ } from "bun";
import { confirm } from "@inquirer/prompts";

export function registerDbSeed(program: Command) {
  program
    .command("db:seed")
    .description("Run database seed")
    .option("--reset", "reset the database before seeding")
    .option("--yes", "skip the reset confirmation prompt")
    .action(async (options) => {
      if (options.reset) {
        const yes =
          options.yes ??
          (await confirm({
            message: "This will drop all data and re-seed. Continue?",
            default: false,
          }));

        if (!yes) {
          console.log("Cancelled.");
          return;
        }

        console.log("Resetting database (prisma migrate reset)...");
        await $`bunx prisma migrate reset --force --skip-seed`.cwd(
          "packages/database",
        );
        console.log("Database reset.");
      }

      console.log("Seeding...");
      await $`bunx prisma db seed`.cwd("packages/database");
      console.log("Done.");
    });
}
