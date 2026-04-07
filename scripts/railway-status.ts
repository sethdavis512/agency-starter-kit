import { $ } from "bun";

// Preflight
try {
    await $`railway status --json`.quiet();
} catch {
    console.log("No linked project. Run: bun scripts/railway-setup.ts");
    process.exit(1);
}

console.log("=== Project Status ===\n");
await $`railway status`;

console.log("\n=== Services ===\n");
await $`railway service status --all`;
