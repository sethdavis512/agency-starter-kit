import { $ } from "bun";
import { confirm } from "@inquirer/prompts";

const DB_PACKAGE = "packages/database";

const confirmed = await confirm({
    message: "This will DROP all tables and re-seed. Continue?",
    default: false,
});

if (!confirmed) {
    console.log("Aborted.");
    process.exit(0);
}

console.log("1/4 Dropping all tables...");
await $`bunx prisma db push --force-reset --accept-data-loss`.cwd(DB_PACKAGE);

console.log("2/4 Generating Prisma client...");
await $`bunx prisma generate`.cwd(DB_PACKAGE);

console.log("3/4 Pushing schema...");
await $`bunx prisma db push`.cwd(DB_PACKAGE);

console.log("4/4 Seeding database...");
await $`bunx prisma db seed`.cwd(DB_PACKAGE);

console.log("Done! Database has been reset.");
