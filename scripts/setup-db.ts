import { $ } from "bun";

const DB_PACKAGE = "packages/database";

console.log("1/3 Generating Prisma client...");
await $`bunx prisma generate`.cwd(DB_PACKAGE);

console.log("2/3 Pushing schema to database...");
await $`bunx prisma db push`.cwd(DB_PACKAGE);

console.log("3/3 Seeding database...");
await $`bunx prisma db seed`.cwd(DB_PACKAGE);

console.log("Done! Database is ready.");
