import type { Command } from "commander";
import { $ } from "bun";

export function registerRailwayStatus(program: Command) {
  program
    .command("status")
    .description("Show Railway project and service status")
    .action(async () => {
      try {
        await $`railway status --json`.quiet();
      } catch {
        console.error("No linked Railway project. Run: cli railway:setup");
        process.exit(1);
      }

      console.log("=== Project Status ===\n");
      await $`railway status`;

      console.log("\n=== Services ===\n");
      await $`railway service status --all`;
    });
}
