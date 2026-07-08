import { describe, expect, it } from "vitest";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateRouteFileContent } from "./add-route";

const uiPackageJsonPath = fileURLToPath(
  new URL("../../../../packages/ui/package.json", import.meta.url)
);
const uiExports = Object.keys(
  JSON.parse(readFileSync(uiPackageJsonPath, "utf-8")).exports
);

const optionCombos = [
  { app: "portal", routeName: "settings", needsLoader: true, needsAction: false, isProtected: true },
  { app: "admin", routeName: "team-members", needsLoader: true, needsAction: true, isProtected: true },
  { app: "portal", routeName: "pricing", needsLoader: false, needsAction: false, isProtected: false },
  { app: "admin", routeName: "audit-log", needsLoader: false, needsAction: true, isProtected: false },
] as const;

describe("generateRouteFileContent", () => {
  it.each(optionCombos)(
    "generates syntactically valid TSX that only imports real @repo/ui exports (%o)",
    (options) => {
      const content = generateRouteFileContent(options);

      // Every `@repo/ui/<subpath>` import must correspond to a real export.
      const uiImportPattern = /from ['"]@repo\/ui\/([^'"]+)['"]/g;
      const importedSubpaths = [...content.matchAll(uiImportPattern)].map(
        (match) => `./${match[1]}`
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
    }
  );
});
