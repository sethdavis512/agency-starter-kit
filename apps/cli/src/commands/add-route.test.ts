import { describe, expect, it } from "vitest";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  generateRouteFileContent,
  insertProtectedRoute,
  insertPublicRoute,
} from "./add-route";

const uiPackageJsonPath = fileURLToPath(
  new URL("../../../../packages/ui/package.json", import.meta.url),
);
const uiExports = Object.keys(
  JSON.parse(readFileSync(uiPackageJsonPath, "utf-8")).exports,
);

const optionCombos = [
  {
    app: "portal",
    routeName: "settings",
    needsLoader: true,
    needsAction: false,
    isProtected: true,
  },
  {
    app: "admin",
    routeName: "team-members",
    needsLoader: true,
    needsAction: true,
    isProtected: true,
  },
  {
    app: "portal",
    routeName: "pricing",
    needsLoader: false,
    needsAction: false,
    isProtected: false,
  },
  {
    app: "admin",
    routeName: "audit-log",
    needsLoader: false,
    needsAction: true,
    isProtected: false,
  },
] as const;

describe("generateRouteFileContent", () => {
  it.each(optionCombos)(
    "generates syntactically valid TSX that only imports real @repo/ui exports (%o)",
    (options) => {
      const content = generateRouteFileContent(options);

      // Every `@repo/ui/<subpath>` import must correspond to a real export.
      const uiImportPattern = /from ['"]@repo\/ui\/([^'"]+)['"]/g;
      const importedSubpaths = [...content.matchAll(uiImportPattern)].map(
        (match) => `./${match[1]}`,
      );
      expect(importedSubpaths.length).toBeGreaterThan(0);
      for (const subpath of importedSubpaths) {
        expect(uiExports).toContain(subpath);
      }

      // The old, nonexistent Heading import/component must never reappear.
      expect(content).not.toMatch(/@repo\/ui\/heading/);
      expect(content).not.toMatch(/<Heading/);

      const { diagnostics } = ts.transpileModule(content, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ESNext,
        },
        reportDiagnostics: true,
      });

      expect(diagnostics ?? []).toHaveLength(0);
    },
  );
});

const ROUTES_FIXTURE = `import {
    type RouteConfig,
    index,
    layout,
    route
} from '@react-router/dev/routes';

export default [
    route('api/auth/*', './routes/api-auth.tsx'),
    layout('./routes/site-layout.tsx', [
        index('routes/landing.tsx'),
        layout('./routes/protected-layout.tsx', [
            route('dashboard', './routes/dashboard.tsx'),
            route('profile', './routes/profile.tsx')
        ]),
        route('sign-in', './routes/sign-in.tsx'),
        route('sign-up', './routes/sign-up.tsx'),
        route('sign-out', './routes/sign-out.tsx')
    ])
] satisfies RouteConfig;
`;

describe("insertPublicRoute", () => {
  it("adds the new route as a sibling of sign-in/sign-out, not a child of protected-layout", () => {
    const updated = insertPublicRoute(
      ROUTES_FIXTURE,
      "route('settings', './routes/settings.tsx')",
    );

    expect(updated).not.toBeNull();

    // The protected-layout array itself is untouched by a public-route insert.
    const protectedBlock = updated!.match(
      /layout\('\.\/routes\/protected-layout\.tsx',\s*\[([\s\S]*?)\]\)/,
    )?.[1];
    expect(protectedBlock).not.toContain("settings");

    // The new route must land as a sibling of sign-in/sign-out, after the
    // protected-layout array closes — not inside it.
    const protectedCloseIndex = updated!.indexOf(
      "]),",
      updated!.indexOf("protected-layout"),
    );
    const settingsIndex = updated!.indexOf(
      "route('settings', './routes/settings.tsx')",
    );
    expect(settingsIndex).toBeGreaterThan(protectedCloseIndex);
    expect(updated).toContain(
      "route('sign-out', './routes/sign-out.tsx'),\n        route('settings', './routes/settings.tsx')",
    );
  });

  it("preserves the existing routes", () => {
    const updated = insertPublicRoute(
      ROUTES_FIXTURE,
      "route('settings', './routes/settings.tsx')",
    );

    expect(updated).toContain("route('sign-in', './routes/sign-in.tsx')");
    expect(updated).toContain("route('dashboard', './routes/dashboard.tsx')");
  });
});

describe("insertProtectedRoute", () => {
  it("adds the new route inside protected-layout", () => {
    const updated = insertProtectedRoute(
      ROUTES_FIXTURE,
      "route('billing', './routes/billing.tsx')",
    );

    const protectedBlock = updated!.match(
      /layout\('\.\/routes\/protected-layout\.tsx',\s*\[([\s\S]*?)\]\)/,
    )?.[1];
    expect(protectedBlock).toContain(
      "route('billing', './routes/billing.tsx')",
    );
  });
});
