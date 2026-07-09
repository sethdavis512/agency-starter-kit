What wouldn't make sense if you were handed this repo cold

1. Portal and Admin are near-identical clones. The two React Router apps are byte-for-byte identical
   except for a port number, a color variant prop, and one extra user.role line on the admin profile.
   There's no role-based access control, no admin-only routes, no real feature logic in either — both
   are placeholder scaffolds ("This is where your content will live"). A newcomer's first question is
   "why are these the same app twice?" and nothing answers it.

2. The "poultry"/"Stealthy Chicken" branding is unexplained. Landing copy says "your portal for all
   things poultry-adjacent" and the CLI route scaffolder hardcodes "StealthyChicken" titles. Looks like
   demo content nobody told you was demo content.

3. @repo/ui-mcp is not a UI package. The name reads like a UI dependency, but it's a standalone MCP
   server binary that exposes the design system to AI assistants. You can't import it.

4. Several packages are empty or unused. @repo/validation declares exports for
   vehicle/appointment/repair schemas but the schemas/ dir is empty. @repo/test-utils is wired up but
   nothing imports it. @repo/ui exports 52 components but apps use ~12. @repo/database package.json
   points ./models/user.server at a file that doesn't exist. @repo/utils/icons is just export \* from
   'lucide-react'.

5. Tooling looks broken mid-flight. ESLint is half-migrated to flat config (old .eslintrc.js deleted,
   new eslint.config.js untracked). There's ~1.4 MB of untracked speckit machinery (.specify/,
   .claude/skills/speckit-\*, skills-lock.json) that CLAUDE.md never explains. And there are uncommitted
   major version bumps (Vite 7→8, TS 5→6) so a fresh clone gets different versions than your working
   tree.

6. No declarative deploy or Tailwind config. Railway setup lives entirely in CLI commands (no
   railway.json), and Tailwind v4 has no tailwind.config.js (tokens live in theme.css @theme blocks).
   Both are intentional but look "missing."

The biggest one is #1 — the whole portal-vs-admin split is the central organizing idea of the repo
and it's completely unexplained.
