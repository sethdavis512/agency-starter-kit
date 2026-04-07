import type { Command } from "commander";
import { input, select, password } from "@inquirer/prompts";
import { auth } from "@repo/auth/server";
import { prisma } from "@repo/database";

export function registerUserCreate(program: Command) {
  program
    .command("user:create")
    .description("Create a new user")
    .option("--email <email>", "user email")
    .option("--name <name>", "user name")
    .option("--role <role>", "user role (admin, user)")
    .option("--password <password>", "user password")
    .action(async (options) => {
      const email =
        options.email ??
        (await input({
          message: "Email:",
          validate: (v) => (v.includes("@") ? true : "Enter a valid email"),
        }));

      const name =
        options.name ??
        (await input({ message: "Name:", validate: (v) => v.length > 0 || "Name is required" }));

      const role =
        options.role ??
        (await select({
          message: "Role:",
          choices: [
            { name: "user", value: "user" },
            { name: "admin", value: "admin" },
          ],
        }));

      const pw =
        options.password ??
        (await password({ message: "Password:", mask: "*" }));

      const result = await auth.api.signUpEmail({
        body: { name, email, password: pw },
      });

      if (!result.user) {
        console.error("Failed to create user.");
        process.exit(1);
      }

      if (role !== "user") {
        await prisma.user.update({
          where: { id: result.user.id },
          data: { role },
        });
      }

      console.log(`Created user ${email} with role ${role}.`);
    });
}
