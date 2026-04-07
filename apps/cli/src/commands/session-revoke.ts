import type { Command } from "commander";
import { confirm, input } from "@inquirer/prompts";
import { prisma } from "@repo/database";

export function registerSessionRevoke(program: Command) {
  program
    .command("session:revoke")
    .description("Revoke sessions")
    .argument("[session-id]", "specific session ID to revoke")
    .option("--user <email>", "revoke all sessions for a user")
    .action(async (sessionId, options) => {
      if (options.user) {
        const user = await prisma.user.findUnique({ where: { email: options.user } });
        if (!user) {
          console.error(`User ${options.user} not found.`);
          process.exit(1);
        }

        const count = await prisma.session.count({ where: { userId: user.id } });
        if (count === 0) {
          console.log(`No sessions for ${options.user}.`);
          return;
        }

        const yes = await confirm({
          message: `Revoke all ${count} session(s) for ${options.user}?`,
          default: false,
        });

        if (!yes) {
          console.log("Cancelled.");
          return;
        }

        await prisma.session.deleteMany({ where: { userId: user.id } });
        console.log(`Revoked ${count} session(s) for ${options.user}.`);
        return;
      }

      const id =
        sessionId ??
        (await input({ message: "Session ID:", validate: (v) => v.length > 0 || "Session ID is required" }));

      const session = await prisma.session.findUnique({ where: { id } });
      if (!session) {
        console.error(`Session ${id} not found.`);
        process.exit(1);
      }

      await prisma.session.delete({ where: { id } });
      console.log(`Revoked session ${id}.`);
    });
}
