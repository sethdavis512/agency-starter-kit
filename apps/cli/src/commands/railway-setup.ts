import type { Command } from "commander";
import { $ } from "bun";
import { confirm, input } from "@inquirer/prompts";

export function registerRailwaySetup(program: Command) {
  program
    .command("railway:setup")
    .description("One-time Railway project setup")
    .action(async () => {
      try {
        await $`command -v railway`.quiet();
      } catch {
        console.error("Railway CLI not found. Install with: brew install railway");
        process.exit(1);
      }

      try {
        await $`railway whoami`.quiet();
      } catch {
        console.error("Not authenticated. Run: railway login");
        process.exit(1);
      }

      try {
        const status = await $`railway status --json`.json();
        console.log(`Already linked to project: ${status.name}`);
        console.log("Use 'cli deploy' to deploy.");
        process.exit(0);
      } catch {
        // Not linked, continue with setup
      }

      const projectName = await input({
        message: "Railway project name:",
        default: "stealthy-chicken",
      });

      console.log(`Creating project "${projectName}"...`);
      await $`railway init --name ${projectName}`;

      const addDb = await confirm({
        message: "Add a PostgreSQL database?",
        default: true,
      });

      if (addDb) {
        console.log("Adding PostgreSQL...");
        await $`railway add --plugin postgresql`;
      }

      console.log("Adding portal service...");
      await $`railway add --service portal`;

      console.log("Adding admin service...");
      await $`railway add --service admin`;

      console.log("\nSetting build config for portal...");
      await $`railway variable set NIXPACKS_BUILD_CMD="bun install --production=false && bunx turbo run build --filter=portal" --service portal`;
      await $`railway variable set NIXPACKS_START_CMD="bun run start" --service portal`;

      console.log("Setting build config for admin...");
      await $`railway variable set NIXPACKS_BUILD_CMD="bun install --production=false && bunx turbo run build --filter=admin" --service admin`;
      await $`railway variable set NIXPACKS_START_CMD="bun run start" --service admin`;

      console.log("\nGenerating domains...");
      await $`railway domain generate --service portal`;
      await $`railway domain generate --service admin`;

      console.log("\nSetup complete! Next steps:");
      console.log("  1. Set BETTER_AUTH_SECRET and BETTER_AUTH_URL for each service");
      console.log("  2. Copy DATABASE_URL from the Postgres plugin to each service");
      console.log("  3. Run: cli deploy");
    });
}
