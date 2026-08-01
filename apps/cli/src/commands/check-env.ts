import type { Command } from "commander";
import { readFileSync, existsSync } from "node:fs";
import { connect } from "node:net";

/** Default Postgres port used when a DATABASE_URL omits one. */
const DEFAULT_POSTGRES_PORT = 5432;

/** Resolves once a TCP connection to host:port is established, rejects on error/timeout. */
function probeTcp(host: string, port: number, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port });

    const onFailure = (err: Error) => {
      socket.destroy();
      reject(err);
    };

    socket.setTimeout(timeoutMs, () =>
      onFailure(new Error(`timed out after ${timeoutMs}ms`)),
    );
    socket.once("error", onFailure);
    socket.once("connect", () => {
      socket.end();
      resolve();
    });
  });
}

export function registerCheckEnv(program: Command) {
  program
    .command("check:env")
    .description("Validate environment and dependencies")
    .action(async () => {
      let exitCode = 0;

      function pass(msg: string) {
        console.log(`  + ${msg}`);
      }

      function fail(msg: string) {
        console.log(`  x ${msg}`);
        exitCode = 1;
      }

      const envPath = "packages/database/.env";
      let databaseUrl: string | undefined;

      console.log("Environment:");
      if (existsSync(envPath)) {
        pass(`${envPath} exists`);
      } else {
        fail(`${envPath} not found. Create one with DATABASE_URL.`);
      }

      if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, "utf-8");
        const match = envContent.match(/^DATABASE_URL=(.+)/m);
        const rawValue = match?.[1].trim();
        if (rawValue) {
          // Strip a single pair of matching surrounding quotes, if present.
          databaseUrl = rawValue.replace(/^(["'])(.*)\1$/, "$2");
          pass("DATABASE_URL is set");
        } else {
          fail(`DATABASE_URL is missing or empty in ${envPath}`);
        }
      }

      // Probe connectivity against whatever host/port DATABASE_URL actually
      // resolves to (Railway, Neon, local Docker, ...) instead of assuming
      // Postgres is listening on localhost:5432. A plain TCP probe also
      // drops the implicit dependency on the `pg_isready` binary.
      console.log("\nDatabase:");
      if (!databaseUrl) {
        fail(
          `Skipping connectivity check: DATABASE_URL is not set in ${envPath}.`,
        );
      } else {
        let host: string | undefined;
        let port = DEFAULT_POSTGRES_PORT;
        try {
          const parsed = new URL(databaseUrl);
          host = parsed.hostname;
          port = parsed.port ? Number(parsed.port) : DEFAULT_POSTGRES_PORT;
        } catch {
          fail(`DATABASE_URL in ${envPath} is not a valid connection string.`);
        }

        if (host) {
          try {
            await probeTcp(host, port);
            pass(`PostgreSQL is reachable at ${host}:${port}`);
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            fail(`PostgreSQL is not reachable at ${host}:${port}: ${message}`);
          }
        }
      }

      console.log("\nPrisma:");
      if (existsSync("node_modules/@prisma/client")) {
        pass("Prisma client is generated");
      } else {
        fail("Prisma client not found. Run: cli db:setup");
      }

      console.log("\nDependencies:");
      if (existsSync("node_modules")) {
        pass("node_modules installed");
      } else {
        fail("node_modules not found. Run: bun install");
      }

      console.log("");
      if (exitCode === 0) {
        console.log("All checks passed.");
      } else {
        console.log("Some checks failed. Fix the issues above.");
      }

      process.exit(exitCode);
    });
}
