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
    },
  },
  prettier,
];
