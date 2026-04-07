import type { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import { prisma } from "@repo/database";

export function registerUserUpdate(program: Command) {
  program
    .command("user:update")
    .description("Update a user")
    .argument("[email]", "user email")
    .option("--name <name>", "new name")
    .option("--role <role>", "new role (admin, user)")
    .action(async (emailArg, options) => {
      const email =
        emailArg ??
        (await input({ message: "User email:", validate: (v) => v.includes("@") || "Enter a valid email" }));

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        console.error(`User ${email} not found.`);
        process.exit(1);
      }

      const name =
        options.name ??
        (await input({ message: "Name:", default: user.name }));

      const role =
        options.role ??
        (await select({
          message: "Role:",
          default: user.role,
          choices: [
            { name: "user", value: "user" },
            { name: "admin", value: "admin" },
          ],
        }));

      await prisma.user.update({
        where: { email },
        data: { name, role },
      });

      console.log(`Updated user ${email}.`);
    });
}
