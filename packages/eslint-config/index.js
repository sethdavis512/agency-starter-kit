const js = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const prettier = require("eslint-config-prettier");
const globals = require("globals");

/**
 * Shared flat ESLint config for the monorepo.
 * Each workspace discovers this via its own eslint.config file or by
 * walking up to the repo-root eslint.config.js.
 */
module.exports = [
  {
    // Generated/build output is never hand-written; nothing here should be
    // linted regardless of which glob a workspace's `lint` script passes.
    ignores: [
      "**/.react-router/**",
      "**/build/**",
      "**/dist/**",
      "**/dist-ssr/**",
      "**/generated/**",
      "**/.turbo/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "@typescript-eslint": tsPlugin },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-non-null-assertion": "off",
      // TypeScript's own compiler already catches undefined references, and
      // no-undef false-positives on ambient lib types (e.g. RequestInit).
      "no-undef": "off",
    },
  },
  {
    // Test mocks routinely need to bypass strict typing (fake loader args,
    // partial mock return values); relax only here, not for real source.
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier,
];
