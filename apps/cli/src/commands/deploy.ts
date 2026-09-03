import type { Command } from "commander";
import { existsSync } from "node:fs";
import path from "node:path";
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
        // Each service's build/start/healthcheck config is committed next to
        // the app; the Railway service must point at it (see cli railway:setup).
        const configPath = path.join("apps", service, "railway.json");
        if (!existsSync(configPath)) {
          console.error(
            `Missing ${configPath} — run from the repo root and check the file exists.`,
          );
          process.exit(1);
        }

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

      console.log(
        "\nDeployments triggered. Railway marks each one healthy once GET /health",
      );
      console.log(
        "returns 200 (needs DATABASE_URL set on the service — at build time too).",
      );
      console.log(
        "Run `cli logs` to check progress, `cli status` to probe /health.",
      );
    });
}
