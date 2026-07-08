---
name: linear-to-pr
description: Drive a Linear issue to an open GitHub pull request in any repo. Fetches the issue, branches using Linear's suggested branch name, implements the change, runs the project's own checks (typecheck, lint, tests), captures screenshots of UI changes and links them from the PR body, opens the PR with gh, and moves the issue to a review status. Use when the user says "work on ABC-123" (any Linear issue identifier), "take this Linear issue to a PR", "implement this ticket", "linear to pr", or pastes a linear.app issue URL to be implemented. Not for creating or triaging Linear issues, and not for reviewing or merging existing PRs.
---

# Linear to PR

Take a Linear issue to an open, reviewable GitHub pull request. This skill is
project-agnostic: it discovers each repo's own conventions and tooling
rather than assuming a stack.

## Running this across many issues at once

This skill drives ONE issue to a PR. To clear a batch in parallel (e.g. a
cycle's worth of tickets), an orchestrator fans out one agent per issue, each
running this skill end to end, each in its own git worktree (see "Isolate in
a worktree" in step 2) so their branches and working trees never collide.

- From the Agent tool: spawn one agent per identifier with
  `isolation: "worktree"` and a prompt like "Run the linear-to-pr skill for
  ABC-123". The harness gives each its own worktree.
- From a Workflow script: map the identifiers through `parallel()` or
  `pipeline()`, one `agent(..., { isolation: 'worktree' })` per issue.

Keep each agent scoped to a single issue; do not let one agent try to handle
several. Concurrency is bounded by the orchestrator, not this skill. Each run
opens its own PR, moves its own Linear issue to review, and (for cleanliness)
removes its worktree when done.

## Workflow checklist

Work through every step. Skip a step only when its "when" condition does not
apply, and say so in the final summary.

- [ ]   1. Load Linear tools and fetch the issue
- [ ]   2. Mark In Progress and create the branch
- [ ]   3. Learn the project's conventions
- [ ]   4. Implement
- [ ]   5. Validate (the project's checks)
- [ ]   6. Capture visual documentation (when UI changed)
- [ ]   7. Commit, push, open the PR
- [ ]   8. Update the Linear issue (review status + comment)

## 1. Fetch the issue

Linear access comes from whatever Linear MCP server is connected to the
session. Tool names vary by setup (`mcp__linear__*`, `mcp__claude_ai_Linear__*`,
etc.), and the tools may be deferred. Find them first:

ToolSearch query: `linear issue` (then load `get_issue`, `save_issue`,
`save_comment`, `list_comments`, `list_issue_statuses`, `list_projects`,
`list_issues` or their equivalents).

If no Linear tools are available, say so and ask the user to paste the issue
title and description; skip the Linear status updates (steps 2.1 and 8) and
do everything else.

Then:

1. Get the issue identifier.

   - If the user gave an explicit identifier (`ABC-123`) or pasted a
     `linear.app/...` URL (identifier is in the path), use it directly.
   - **If the user did NOT name a specific ticket** (e.g. "work on one of the
     tickets", "grab the next issue"), do NOT run a bare
     `list_issues --assignee me` and take whatever floats to the top. First
     resolve the Linear project that maps to THIS repo, then list issues
     filtered to it:
       1. Check the repo for an explicit mapping (a "Linear" section in
          `CLAUDE.md` / `AGENTS.md` naming the project). Honor it if present.
       2. Otherwise search projects by the repo's own name
          (`list_projects` with the repo/product name as `query`) and match
          on name. Confirm the match with the user if it's not exact.
       3. List issues with `project: "<matched project>"` and pick from
          those. A team key prefix (`ABC-*`) is NOT a project — one team
          often holds several projects (including stale template/fork
          projects with unrelated tickets), so filtering by assignee or team
          alone will surface the wrong ticket. Filter by project.
2. Fetch its comments. Comments often carry decisions and constraints that
   the description lacks.
3. If the issue description is empty or too vague to act on, stop and ask
   the user for scope before writing code.

## 2. Start work

1. List the team's issue statuses and move the issue to the `started`-type
   status that represents active work (typically named "In Progress").
   Assign it to `me` if unassigned.
2. Branch from the repo's fresh default branch (detect it; it may be `main`,
   `master`, `develop`) using the issue's `gitBranchName` field verbatim
   (Linear generates it from the user and issue title):

    ```sh
    git checkout <default-branch> && git pull && git checkout -b <gitBranchName>
    ```

    Linear's GitHub integration links the branch to the issue automatically
    because the branch name contains the identifier. Do not invent your own
    branch name. If `gitBranchName` is missing, use
    `<identifier-lowercased>-<kebab-title>`.

### Isolate in a worktree for parallel / multi-agent runs

When this skill runs as one of several agents working concurrently in the
same clone (a multi-agent workflow, or any time another agent may be on a
different branch in this repo), do NOT check out in place: a shared working
tree means agents clobber each other's branch and uncommitted files. Give
each agent its own worktree instead.

Create the branch in its own worktree rather than switching the main
checkout, and do all work from there:

```sh
git fetch origin
git worktree add -b <gitBranchName> "../<repo>-<identifier>" <default-branch>
cd "../<repo>-<identifier>"
```

Run implement, validate, PR, and Linear-update steps from inside that
worktree directory. The branch still carries the Linear identifier, so the
GitHub integration links it the same way.

A solo, foreground run can skip this and use the in-place `git checkout -b`
above. When in doubt in an agent context, prefer the worktree: it is the
safe default and the only thing that makes N tickets-to-PRs runnable at once.

After the PR is open and pushed, remove the worktree to keep the clone clean
(the branch and PR survive on the remote):

```sh
git worktree remove "../<repo>-<identifier>"   # add --force only if you are sure
```

## 3. Learn the project's conventions

Before writing code, read what the repo tells you about itself so the change
matches house style:

- `CLAUDE.md` / `AGENTS.md` / `.cursorrules` / `CONTRIBUTING.md` for
  conventions, architecture notes, and commands.
- `README.md` for setup and the run/test story.
- The package manifest for the actual script names and package manager:
  `package.json` (`scripts`), or the equivalent (`Makefile`, `Justfile`,
  `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.). Detect the package
  manager from the lockfile (`bun.lock`, `pnpm-lock.yaml`,
  `package-lock.json`, `yarn.lock`).
- Nearby code in the area you're touching, to copy its patterns (imports,
  file layout, naming).

Keep the diff scoped to the issue; unrelated cleanup goes in a separate
commit or gets mentioned, not mixed in.

## 4. Implement

Follow the conventions you found in step 3. Match the surrounding code's
idioms instead of importing patterns from other projects.

## 5. Validate

Run the project's own checks, fix, and re-run until green. Use the script
names you found in the manifest. Typical shapes, in order of preference (use
whatever the repo actually defines):

- A single aggregate check if one exists (e.g. `validate`, `check`, `ci`,
  `precommit`, `make check`).
- Otherwise the individual checks: typecheck/build, lint, format check, and
  the test suite.
- The targeted test(s) covering the surface you touched, not just the full
  suite, for a fast inner loop.

Run them through the repo's package manager / task runner (`bun run`,
`pnpm`, `npm run`, `make`, `just`, `cargo`, `go test`, `pytest`, etc.). If
the change adds user-visible behavior with no existing test coverage and the
project has a test suite, add or extend a test. Run the full suite (including
any e2e/integration layer) when the change is cross-cutting (layout, auth,
routing, shared utilities).

If you cannot determine how to run checks, say so in the summary rather than
claiming the change is validated.

## 6. Visual documentation

When the change affects anything user-visible, capture screenshots and get
them in front of reviewers. Skip only for pure server/infra/library changes,
and say "No UI changes" in the PR body instead.

1. Prefer the project's existing screenshot/visual tooling if it has any
   (a visual-test suite, a Storybook, a screenshot script). Run it and use
   its output.
2. Otherwise capture shots yourself against the running app using whatever
   browser-automation skill or tool the session provides (e.g. a
   Playwright/agent-browser skill). Start the app the way the README
   describes, then capture each meaningful state, not just the happy path:
   default, empty, filled, error, and mobile where relevant.
3. Publish the images using whatever the session provides, in this order:
    1. An image-hosting skill or tool available in the session (CDN
       uploader, asset bucket); embed the returned URLs in the PR body.
    2. The Linear MCP attachment-upload tools; attach the images to the
       issue and link them from the PR body.
    3. Neither available: save the shots to a temp/ignored location, list
       the local paths in the PR body, and tell the author to drag the
       images into the PR description on GitHub, which hosts them.
4. Never commit screenshots. Put them under a gitignored path (e.g.
   `test-results/`, `tmp/`) and delete any throwaway capture script before
   committing.

## 7. Open the PR

1. Commit with a conventional message (`feat:`, `fix:`, `chore:`) and the
   identifier in the body, e.g. `feat: bulk-archive items (ABC-123)`.
2. Push and create the PR:

    ```sh
    git push -u origin <branch>
    gh pr create --title "<type>: <summary> (ABC-123)" --body "<body>"
    ```

3. PR body template:

    ```markdown
    ## Summary

    [What changed and why, 2-4 bullets]

    Fixes ABC-123

    ## Visuals

    ![<surface> - <state>](image-url)

    ## Testing

    - [the actual check commands you ran]
    ```

    `Fixes ABC-123` is a Linear magic word: with the GitHub integration
    enabled, the issue auto-completes when the PR merges. Always include it.

## 8. Close the loop in Linear

1. Move the issue to the status that represents "in review" in this team's
   workflow (a `started`-type status named like "In Review"). If the team
   has no such status, leave the status alone.
2. Comment on the issue: PR URL, one-line summary of the approach, and the
   screenshot links.

## Gotchas

- MCP tools may be deferred and fail with InputValidationError until loaded
  via ToolSearch. Find and load the Linear tools before the first call.
- Status names vary by team. Resolve them with `list_issue_statuses` and
  match on status `type` (`started`, `completed`) plus name, rather than
  assuming names exist. Never move the issue straight to Done; merging the
  PR does that via the magic word.
- Detect the default branch instead of assuming `main`; branch from it and
  target it as the PR base.
- Use the package manager the repo actually uses (read the lockfile). Don't
  introduce `npm` into a `bun`/`pnpm` repo or vice versa.
- For browser captures: client-rendered controls often do nothing before
  hydration. Wait for the app to be interactive before clicking or filling.
- Never run destructive setup (database migrations/resets, `db push`,
  seeding against a real database) as part of this flow without asking first.
