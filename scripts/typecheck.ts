import { $ } from "bun";

console.log("Running typegen for portal...");
await $`bunx react-router typegen`.cwd("apps/portal").quiet();

console.log("Running typegen for admin...");
await $`bunx react-router typegen`.cwd("apps/admin").quiet();

console.log("Typechecking all workspaces...\n");
await $`bunx turbo run typecheck`;
