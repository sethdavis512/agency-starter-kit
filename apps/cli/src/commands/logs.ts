import type { Command } from "commander";
import { $ } from "bun";
import { select } from "@inquirer/prompts";

export function registerLogs(program: Command) {
  program
    .command("logs")
    .description("View Railway service logs")
    .argument("[service]", "portal or admin")
    .option("-n, --lines <count>", "number of lines", "200")
    .action(async (serviceArg, options) => {
      try {
        await $`railway status --json`.quiet();
      } catch {
        console.error("No linked Railway project. Run: cli railway:setup");
        process.exit(1);
      }

      const service =
        serviceArg ??
        (await select({
          message: "Which service?",
          choices: [
            { name: "Portal", value: "portal" },
            { name: "Admin", value: "admin" },
          ],
        }));

      console.log(`Fetching logs for ${service}...\n`);
      await $`railway logs --service ${service} --lines ${options.lines}`;
    });
}
