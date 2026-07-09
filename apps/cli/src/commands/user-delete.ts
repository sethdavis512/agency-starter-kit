import type { Command } from "commander";
import { confirm, input } from "@inquirer/prompts";
import { prisma } from "@repo/database";

export function registerUserDelete(program: Command) {
  program
    .command("user:delete")
    .description("Delete a user")
    .argument("[email]", "user email")
    .option("--yes", "skip the confirmation prompt")
    .action(async (emailArg, options) => {
      const email =
        emailArg ??
        (await input({
          message: "User email:",
          validate: (v) => v.includes("@") || "Enter a valid email",
        }));

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!user) {
        console.error(`User ${email} not found.`);
        process.exit(1);
      }

      const yes =
        options.yes ??
        (await confirm({
          message: `Delete ${user.name} (${user.email}, ${user.role})?`,
          default: false,
        }));

      if (!yes) {
        console.log("Cancelled.");
        return;
      }

      // Hard delete is intentional here: User/Session/Account are Better-Auth-managed,
      // and a `deletedAt` soft delete wouldn't be honored by Better Auth's own auth
      // queries without also patching that layer. See CLAUDE.md "Authentication".
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`Deleted user ${email}.`);
    });
}
