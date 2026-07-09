import type { Command } from "commander";
import { select, input, confirm } from "@inquirer/prompts";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export interface RouteScaffoldOptions {
  app: "portal" | "admin";
  routeName: string;
  needsLoader: boolean;
  needsAction: boolean;
  isProtected: boolean;
}

export function generateRouteFileContent({
  app,
  routeName,
  needsLoader,
  needsAction,
  isProtected,
}: RouteScaffoldOptions): string {
  const imports: string[] = [];
  const exports: string[] = [];

  imports.push(`import type { Route } from './+types/${routeName}';`);
  imports.push(`import { PageHeader } from '@repo/ui/page-header';`);

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

  const titleSuffix =
    app === "admin" ? "Stealthy Chicken Admin" : "Stealthy Chicken";
  const pageTitle = routeName
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  const propsArg = needsLoader ? `{ loaderData }: Route.ComponentProps` : "";

  return `${imports.join("\n")}

${exports.join("\n\n")}

export default function ${componentName}(${propsArg}) {
    return (
        <>
            <title>${pageTitle} | ${titleSuffix}</title>
            <PageHeader title="${pageTitle}" className="mb-4" />
        </>
    );
}
`;
}

export function insertProtectedRoute(
  routesContent: string,
  routeEntry: string,
): string | null {
  const protectedPattern =
    /layout\('\.\/routes\/protected-layout\.tsx',\s*\[([\s\S]*?)\]\)/;
  const match = routesContent.match(protectedPattern);

  if (!match) return null;

  const existingRoutes = match[1].trimEnd();
  const updatedRoutes = `${existingRoutes},\n            ${routeEntry}`;
  return routesContent.replace(
    protectedPattern,
    `layout('./routes/protected-layout.tsx', [${updatedRoutes}])`,
  );
}

export function insertPublicRoute(
  routesContent: string,
  routeEntry: string,
): string | null {
  // The site-layout array nests a protected-layout array with its own closing
  // "])", so a lazy regex like /\[([\s\S]*?)\]/ stops at the wrong bracket.
  // Walk bracket depth instead to find the site-layout array's own close.
  const openMarker = "layout('./routes/site-layout.tsx', [";
  const arrayStart = routesContent.indexOf(openMarker);
  if (arrayStart === -1) return null;

  const contentStart = arrayStart + openMarker.length;
  let depth = 1;
  let arrayEnd = -1;
  for (let i = contentStart; i < routesContent.length; i++) {
    if (routesContent[i] === "[") depth++;
    else if (routesContent[i] === "]") {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }
  if (arrayEnd === -1) return null;

  const existingRoutes = routesContent.slice(contentStart, arrayEnd).trimEnd();
  const updatedRoutes = `${existingRoutes},\n        ${routeEntry}`;
  return (
    routesContent.slice(0, contentStart) +
    updatedRoutes +
    "\n    " +
    routesContent.slice(arrayEnd)
  );
}

export function registerAddRoute(program: Command) {
  program
    .command("add:route")
    .description("Scaffold a new route in an app")
    .action(async () => {
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
          /^[a-z][a-z0-9-]*$/.test(v) ||
          "Use lowercase kebab-case (e.g. settings)",
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

      const fileContent = generateRouteFileContent({
        app,
        routeName,
        needsLoader,
        needsAction,
        isProtected,
      });

      const routeFilePath = `apps/${app}/app/routes/${routeName}.tsx`;

      if (existsSync(routeFilePath)) {
        console.error(`File already exists: ${routeFilePath}`);
        process.exit(1);
      }

      writeFileSync(routeFilePath, fileContent);
      console.log(`Created ${routeFilePath}`);

      const routesPath = `apps/${app}/app/routes.ts`;
      const routesContent = readFileSync(routesPath, "utf-8");

      const routeEntry = `route('${urlPath}', './routes/${routeName}.tsx')`;

      if (isProtected) {
        const updatedContent = insertProtectedRoute(routesContent, routeEntry);
        if (updatedContent) {
          writeFileSync(routesPath, updatedContent);
          console.log(`Added protected route '${urlPath}' to ${routesPath}`);
        } else {
          console.log(
            `Could not find protected-layout in ${routesPath}. Add the route manually.`,
          );
        }
      } else {
        const updatedContent = insertPublicRoute(routesContent, routeEntry);
        if (updatedContent) {
          writeFileSync(routesPath, updatedContent);
          console.log(`Added public route '${urlPath}' to ${routesPath}`);
        } else {
          console.log(
            `Could not find site-layout in ${routesPath}. Add the route manually.`,
          );
        }
      }

      console.log("Done!");
    });
}
