---
name: repo-tour
description: >
  Give a new developer a guided tour of a repository that explains how the
  pieces connect, not just what files exist. Use when the user says "give me a
  tour", "walk me through this repo/codebase", "how does this all connect",
  "explain this project", "I'm new here, where do I start", "what does this do",
  "onboard me", or asks what would confuse someone handed the repo cold. Traces
  entry points, the central organizing idea, the dependency/data flow between
  parts, and surfaces placeholder, unused, misleadingly-named, or half-migrated
  things. NOT for reviewing code quality or finding bugs (use code-review), for
  removing dead code (use cruft), or for explaining a single function/file
  (just read it).
---

# Repo Tour

Give someone the mental model they'd otherwise spend a week assembling: what this
repo is, the one idea that organizes it, how the parts connect, and where the
traps are.

## The core principle

A bad tour lists the file tree. A good tour explains **connections and intent**.
The deliverable answers "how does this fit together and why," not "what folders
exist." A reader can see the folders themselves.

Two questions drive everything:
1. **What is the central organizing idea?** The one concept that, once you know
   it, makes the rest of the repo make sense. If a newcomer is missing it,
   everything else looks arbitrary.
2. **What would confuse someone handed this cold?** Name the traps explicitly.
   This is the highest-value part of the tour and the part a generic walkthrough
   always skips.

## Procedure

Work top-down. Don't read every file; read the ones that reveal structure.

1. **Orient.** Read the manifest(s) and docs that declare what this is:
   `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` / `*.csproj`,
   any README, `CLAUDE.md`/`AGENTS.md`, and the monorepo/workspace config
   (`turbo.json`, `pnpm-workspace.yaml`, `nx.json`, `lerna.json`, etc.). Learn:
   language, framework, build tooling, and whether it's one app or many.

2. **Find the entry points.** Where does execution actually start? Look for
   `main`/`bin` fields, `src/index.*`, route manifests, server bootstrap, app
   `root`, CLI command registration. The entry points anchor the whole tour.

3. **Map the parts and how they connect.** For a monorepo, list the apps and
   packages and draw the dependency direction (who imports whom). For a single
   app, identify the layers (routes → services → data, or equivalent). Build a
   small dependency picture, not a flat inventory.

4. **Trace one real path end-to-end.** Pick a representative flow (a request, a
   page load, a CLI command) and follow it across files. One traced path teaches
   more than ten described folders.

5. **Surface the friction** (see Gotchas below). This is mandatory, not optional.

6. **Deliver** using the output template.

For a large or unfamiliar repo, fan out: dispatch parallel `Explore` agents over
different areas (apps, packages, tooling) in a single message, then synthesize.
Tell each one to report connections and confusing things, not file dumps.

## Gotchas — verify, don't assume

The traps below are what make a tour valuable. Hunt for them deliberately.

- **Names lie. Verify against code.** A package called `validation` may export
  schemas that don't exist; `ui-mcp` may be a server binary, not a UI import.
  Open the thing and confirm what it actually is.
- **Existence ≠ usage.** Don't claim a package/module is "used" because it's
  there. Grep for imports of it across the codebase. Flag packages that exist but
  nothing imports — they read as load-bearing and aren't.
- **Distinguish scaffold from real logic.** Placeholder copy ("this is where your
  content will live"), demo branding, and near-duplicate apps are template
  residue. Say so plainly so the reader doesn't hunt for meaning that isn't there.
- **Catch near-duplicates and unexplained splits.** Two apps that are byte-for-
  byte identical except a color or a port — explain what the split is *for*, since
  the code won't.
- **Spot half-finished migrations.** Deleted-and-replaced config (e.g. ESLint
  legacy → flat), uncommitted version bumps, dual old/new patterns. Check
  `git status` for staged/untracked churn that a fresh clone wouldn't have.
- **Flag undocumented machinery.** Tooling/config directories the docs never
  mention. Note what they are so they don't look like clutter to delete.
- **Note name-vs-reality and declared-vs-actual mismatches.** Exports pointing at
  missing files, deps in the wrong section (`devDependencies` vs `dependencies`),
  docs describing something the code no longer does.

## Output template

Structure the tour like this. Keep it tight; link `path:line` so claims are
clickable and checkable.

```
## What this is
One paragraph: the kind of project, the stack, one app or many.

## The central idea
The single organizing concept. What clicks once you know it.

## How it connects
The parts and their dependency/data flow. A short diagram or arrow list
(portal → @repo/ui → theme.css) beats prose. Then one traced path end-to-end.

## Where to start
The 3-5 files to read first, in order, with one line on why each matters.

## What would confuse you (and the truth)
The friction list. Each item: what looks wrong + what's actually going on.
This is the payload — be specific and honest, including "this is unfinished".
```

Match depth to the repo and the ask. A quick "what is this" gets a short tour; a
full onboarding gets the complete template. Always include the friction section —
it's the part the reader can't get by browsing.
