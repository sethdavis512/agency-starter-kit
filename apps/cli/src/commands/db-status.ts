import type { Command } from "commander";
import { prisma } from "@repo/database";

export function registerDbStatus(program: Command) {
  program
    .command("db:status")
    .description("Check database connectivity")
    .action(async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log("Database is reachable.");
      } catch (e) {
        console.error("Cannot reach database:", (e as Error).message);
        process.exit(1);
      }
    });
}
