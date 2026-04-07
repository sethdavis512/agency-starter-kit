import { $ } from "bun";
import { select, input, confirm } from "@inquirer/prompts";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const app = await select({
    message: "Which app?",
    choices: [
        { name: "portal", value: "portal" },
        { name: "admin", value: "admin" },
    ],
});

const routeName = await input({
    message: "Route name (kebab-case, e.g. settings):",
    validate: (v) =>
        /^[a-z][a-z0-9-]*$/.test(v) || "Use lowercase kebab-case (e.g. settings)",
});

const urlPath = await input({
    message: "URL path:",
    default: routeName,
});

const needsLoader = await confirm({
    message: "Add a loader?",
    default: true,
});

const needsAction = await confirm({
    message: "Add an action?",
    default: false,
});

const isProtected = await confirm({
    message: "Protected (requires auth)?",
    default: true,
});

// Build the route file content
const imports: string[] = [];
const exports: string[] = [];

imports.push(`import type { Route } from './+types/${routeName}';`);
imports.push(`import { Heading } from '@repo/ui/heading';`);

if (needsLoader) {
    const loaderBody = isProtected
        ? `    // const sessionUser = context.get(userContext);
    return {};`
        : `    return {};`;

    const loaderArgs = isProtected ? `{ request, context }` : `{ request }`;

    exports.push(`export async function loader(${loaderArgs}: Route.LoaderArgs) {
${loaderBody}
}`);
}

if (needsAction) {
    exports.push(`export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    return {};
}`);
}

const componentName =
    routeName
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("") + "Route";

const titleSuffix = app === "admin" ? "Stealthy Chicken Admin" : "Stealthy Chicken";
const pageTitle = routeName
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

const propsArg = needsLoader ? `{ loaderData }: Route.ComponentProps` : "";

const fileContent = `${imports.join("\n")}

${exports.join("\n\n")}

export default function ${componentName}(${propsArg}) {
    return (
        <>
            <title>${pageTitle} | ${titleSuffix}</title>
            <Heading size="xl" bold className="mb-4">
                ${pageTitle}
            </Heading>
        </>
    );
}
`;

// Write the route file
const routeFilePath = `apps/${app}/app/routes/${routeName}.tsx`;

if (existsSync(routeFilePath)) {
    console.log(`File already exists: ${routeFilePath}`);
    process.exit(1);
}

writeFileSync(routeFilePath, fileContent);
console.log(`Created ${routeFilePath}`);

// Update routes.ts
const routesPath = `apps/${app}/app/routes.ts`;
const routesContent = readFileSync(routesPath, "utf-8");

const routeEntry = `route('${urlPath}', './routes/${routeName}.tsx')`;

// Insert into the correct layout group
if (isProtected) {
    // Add inside the protected-layout children array
    const protectedPattern = /layout\('\.\/routes\/protected-layout\.tsx',\s*\[([\s\S]*?)\]\)/;
    const match = routesContent.match(protectedPattern);

    if (match) {
        const existingRoutes = match[1].trimEnd();
        const updatedRoutes = `${existingRoutes},\n            ${routeEntry}`;
        const updatedContent = routesContent.replace(
            protectedPattern,
            `layout('./routes/protected-layout.tsx', [${updatedRoutes}])`
        );
        writeFileSync(routesPath, updatedContent);
        console.log(`Added protected route '${urlPath}' to ${routesPath}`);
    } else {
        console.log(`Could not find protected-layout in ${routesPath}. Add the route manually.`);
    }
} else {
    // Add inside the site-layout children array, after the last route before the closing bracket
    const siteLayoutPattern = /layout\('\.\/routes\/site-layout\.tsx',\s*\[([\s\S]*?)\]\s*\)/;
    const match = routesContent.match(siteLayoutPattern);

    if (match) {
        const lastRoutePattern = /(route\('[^']+',\s*'[^']+'\))\s*\n\s*\]\s*\)/;
        const updatedContent = routesContent.replace(
            lastRoutePattern,
            `$1,\n        ${routeEntry}\n    ])`
        );
        writeFileSync(routesPath, updatedContent);
        console.log(`Added public route '${urlPath}' to ${routesPath}`);
    } else {
        console.log(`Could not find site-layout in ${routesPath}. Add the route manually.`);
    }
}

console.log("Done!");
