import type { Command } from "commander";
import { $ } from "bun";
import { confirm } from "@inquirer/prompts";

export function registerDbSeed(program: Command) {
  program
    .command("db:seed")
    .description("Run database seed")
    .option("--reset", "reset the database before seeding")
    .action(async (options) => {
      if (options.reset) {
        const yes = await confirm({
          message: "This will drop all data and re-seed. Continue?",
          default: false,
        });

        if (!yes) {
          console.log("Cancelled.");
          return;
        }

        console.log("Resetting database...");
        await $`bunx prisma db push --force-reset`.cwd("packages/database");
        console.log("Database reset.");
      }

      console.log("Seeding...");
      await $`bunx prisma db seed`.cwd("packages/database");
      console.log("Done.");
    });
}
