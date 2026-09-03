import type { Command } from "commander";
import { $ } from "bun";
import { confirm, input } from "@inquirer/prompts";

const SERVICES = ["portal", "admin"] as const;

export function registerRailwaySetup(program: Command) {
  program
    .command("railway:setup")
    .description("One-time Railway project setup")
    .action(async () => {
      try {
        await $`command -v railway`.quiet();
      } catch {
        console.error(
          "Railway CLI not found. Install with: brew install railway",
        );
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
        await $`railway add --database postgres`;
      }

      for (const service of SERVICES) {
        console.log(`Adding ${service} service...`);
        await $`railway add --service ${service}`;
      }

      // Build, start, health-check, and restart config is committed in
      // apps/<service>/railway.json (Railpack builder). Railway's default
      // builder is Railpack, which ignores the NIXPACKS_* variables this
      // command used to set, so nothing is configured through variables.

      console.log("\nGenerating domains...");
      for (const service of SERVICES) {
        await $`railway domain --service ${service}`;
      }

      console.log("\nSetup complete! Next steps:");
      console.log(
        "  1. Point each service at its committed config: Service → Settings →",
      );
      console.log(
        "     Config-as-code → file path `apps/<service>/railway.json`",
      );
      console.log("     (build/start command, /health check, restart policy).");
      console.log(
        "  2. Set DATABASE_URL on each service BEFORE the first deploy — it is",
      );
      console.log(
        "     required at BUILD time (prisma generate reads it), not only at",
      );
      console.log(
        "     runtime. Reference the Postgres plugin: ${{Postgres.DATABASE_URL}}",
      );
      console.log(
        "  3. Set BETTER_AUTH_SECRET and BETTER_AUTH_URL for each service",
      );
      console.log("  4. Run: cli deploy");
    });
}
