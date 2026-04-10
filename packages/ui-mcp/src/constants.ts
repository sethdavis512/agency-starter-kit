import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Walk from src/ (or dist/) up to the monorepo root, then into packages/ui
export const UI_PACKAGE_PATH = resolve(__dirname, '..', '..', 'ui');
export const UI_COMPONENTS_PATH = resolve(UI_PACKAGE_PATH, 'components');
export const UI_THEME_PATH = resolve(UI_PACKAGE_PATH, 'theme.css');
export const UI_PACKAGE_JSON_PATH = resolve(UI_PACKAGE_PATH, 'package.json');

export const CHARACTER_LIMIT = 25_000;

export const SERVER_NAME = 'ui-mcp-server';
export const SERVER_VERSION = '0.1.0';
