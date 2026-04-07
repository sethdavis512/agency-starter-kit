import type { Command } from "commander";
import { $ } from "bun";
import { select } from "@inquirer/prompts";

export function registerDeploy(program: Command) {
  program
    .command("deploy")
    .description("Deploy to Railway")
    .argument("[target]", "portal, admin, or both")
    .action(async (targetArg) => {
      try {
        await $`railway status --json`.quiet();
      } catch {
        console.error("No linked Railway project. Run: cli railway:setup");
        process.exit(1);
      }

      const target =
        targetArg ??
        (await select({
          message: "What to deploy?",
          choices: [
            { name: "Both apps", value: "both" },
            { name: "Portal only", value: "portal" },
            { name: "Admin only", value: "admin" },
          ],
        }));

      async function deploy(service: string) {
        console.log(`\nDeploying ${service}...`);
        await $`railway up --detach --service ${service} -m "Deploy ${service}"`;
        console.log(`${service} deployment started.`);
      }

      if (target === "both" || target === "portal") {
        await deploy("portal");
      }
      if (target === "both" || target === "admin") {
        await deploy("admin");
      }

      console.log("\nDeployments triggered. Run `cli logs` to check progress.");
    });
}
