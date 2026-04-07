import { $ } from "bun";
import { select } from "@inquirer/prompts";

// Preflight
try {
    await $`railway status --json`.quiet();
} catch {
    console.log("No linked project. Run: bun scripts/railway-setup.ts");
    process.exit(1);
}

const target = await select({
    message: "What to deploy?",
    choices: [
        { name: "Both apps", value: "both" },
        { name: "Portal only", value: "portal" },
        { name: "Admin only", value: "admin" },
    ],
});

async function deploy(service: string) {
    console.log(`\nDeploying ${service}...`);
    await $`railway up --detach --service ${service} -m "Deploy ${service}"`;
    console.log(`${service} deployment started.`);
}

if (target === "both" || target === "portal") {
    await deploy("portal");
}
if (target === "both" || target === "admin") {
    await deploy("admin");
}

console.log("\nDeployments triggered. Check status with: bun scripts/railway-status.ts");
