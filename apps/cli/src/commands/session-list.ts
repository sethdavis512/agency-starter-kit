import type { Command } from "commander";
import { prisma } from "@repo/database";

export function registerSessionList(program: Command) {
  program
    .command("session:list")
    .description("List active sessions")
    .option("--user <email>", "filter by user email")
    .action(async (options) => {
      const where: Record<string, unknown> = {
        expiresAt: { gt: new Date() },
      };

      if (options.user) {
        const user = await prisma.user.findUnique({ where: { email: options.user } });
        if (!user) {
          console.error(`User ${options.user} not found.`);
          process.exit(1);
        }
        where.userId = user.id;
      }

      const sessions = await prisma.session.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });

      if (sessions.length === 0) {
        console.log("No active sessions.");
        return;
      }

      console.log(`\n${"User".padEnd(24)} ${"IP".padEnd(18)} ${"Expires".padEnd(24)} ID`);
      console.log("-".repeat(90));

      for (const s of sessions) {
        console.log(
          `${s.user.email.padEnd(24)} ${(s.ipAddress ?? "unknown").padEnd(18)} ${s.expiresAt.toLocaleString().padEnd(24)} ${s.id}`
        );
      }

      console.log(`\n${sessions.length} active session(s).`);
    });
}
