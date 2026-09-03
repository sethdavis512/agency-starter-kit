import type { Command } from "commander";
import { $ } from "bun";

const SERVICES = ["portal", "admin"] as const;

async function probeHealth(service: string) {
  let domain: string | undefined;

  try {
    const variables: Record<string, string> =
      await $`railway variables --service ${service} --json`.quiet().json();
    domain = variables.RAILWAY_PUBLIC_DOMAIN;
  } catch {
    // Service missing or CLI too old for --json; fall through to the message below.
  }

  if (!domain) {
    console.log(
      `  ${service}: no public domain (run: railway domain --service ${service})`,
    );
    return;
  }

  const url = `https://${domain}/health`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const body = (await response.text()).trim();
    console.log(`  ${service}: ${response.status} ${body} (${url})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  ${service}: unreachable — ${message} (${url})`);
  }
}

export function registerRailwayStatus(program: Command) {
  program
    .command("status")
    .description("Show Railway project, service, and /health status")
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
      await $`railway service status`;

      console.log("\n=== Health (GET /health) ===\n");
      for (const service of SERVICES) {
        await probeHealth(service);
      }
    });
}
