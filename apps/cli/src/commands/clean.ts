import type { Command } from "commander";
import { $ } from "bun";

export function registerClean(program: Command) {
  program
    .command("clean")
    .description("Remove build artifacts, caches, and reinstall")
    .action(async () => {
      console.log("Removing node_modules...");
      await $`rm -rf node_modules`;

      console.log("Removing build artifacts...");
      await $`rm -rf apps/portal/build apps/admin/build`;

      console.log("Removing turbo cache...");
      await $`rm -rf .turbo`;

      console.log("Removing lockfile...");
      await $`rm -f bun.lock`;

      console.log("Reinstalling dependencies...");
      await $`bun install`;

      console.log("Done! Clean slate.");
    });
}
