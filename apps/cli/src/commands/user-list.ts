import type { Command } from "commander";
import { prisma } from "@repo/database";

export function registerUserList(program: Command) {
  program
    .command("user:list")
    .description("List all users")
    .option("--role <role>", "filter by role (admin, user)")
    .action(async (options) => {
      const where = options.role ? { role: options.role } : {};

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      if (users.length === 0) {
        console.log("No users found.");
        return;
      }

      console.log(`\n${"Name".padEnd(24)} ${"Email".padEnd(32)} ${"Role".padEnd(8)} ${"Verified".padEnd(10)} Created`);
      console.log("-".repeat(100));

      for (const user of users) {
        console.log(
          `${user.name.padEnd(24)} ${user.email.padEnd(32)} ${user.role.padEnd(8)} ${String(user.emailVerified).padEnd(10)} ${user.createdAt.toLocaleDateString()}`
        );
      }

      console.log(`\n${users.length} user(s) total.`);
    });
}
