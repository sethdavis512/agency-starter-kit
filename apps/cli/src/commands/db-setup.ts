import type { Command } from "commander";
import { $ } from "bun";

export function registerDbSetup(program: Command) {
  program
    .command("db:setup")
    .description("Generate Prisma client, push schema, and seed")
    .action(async () => {
      const cwd = "packages/database";

      console.log("1/3 Generating Prisma client...");
      await $`bunx prisma generate`.cwd(cwd);

      console.log("2/3 Pushing schema to database...");
      await $`bunx prisma db push`.cwd(cwd);

      console.log("3/3 Seeding database...");
      await $`bunx prisma db seed`.cwd(cwd);

      console.log("Done! Database is ready.");
    });
}
