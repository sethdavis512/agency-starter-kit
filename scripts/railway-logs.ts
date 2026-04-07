import { $ } from "bun";
import { select } from "@inquirer/prompts";

// Preflight
try {
    await $`railway status --json`.quiet();
} catch {
    console.log("No linked project. Run: bun scripts/railway-setup.ts");
    process.exit(1);
}

const service = await select({
    message: "Which service?",
    choices: [
        { name: "Portal", value: "portal" },
        { name: "Admin", value: "admin" },
    ],
});

console.log(`Fetching logs for ${service}...\n`);
await $`railway logs --service ${service} --lines 200`;
