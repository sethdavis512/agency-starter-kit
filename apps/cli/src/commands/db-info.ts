import type { Command } from "commander";
import { prisma } from "@repo/database";

export function registerDbInfo(program: Command) {
  program
    .command("db:info")
    .description("Show database record counts")
    .action(async () => {
      const [users, sessions, accounts, verifications] = await Promise.all([
        prisma.user.count(),
        prisma.session.count(),
        prisma.account.count(),
        prisma.verification.count(),
      ]);

      console.log("\nTable             Count");
      console.log("-".repeat(30));
      console.log(`user              ${users}`);
      console.log(`session           ${sessions}`);
      console.log(`account           ${accounts}`);
      console.log(`verification      ${verifications}`);
      console.log(`${"".padEnd(18)}${"-".repeat(5)}`);
      console.log(`total             ${users + sessions + accounts + verifications}`);
    });
}
