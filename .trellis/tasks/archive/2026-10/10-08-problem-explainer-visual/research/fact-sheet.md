# Fact Sheet — Trellis explainer

The page's single source of truth. Every factual claim on the page must map to one row here; every row cites a source path.
Collected 2026-10-08 against `main` @ f089cb32.

## A. The problem (pain points)

| # | Claim | Source |
|---|---|---|
| A1 | Single-file rules (`CLAUDE.md` / `AGENTS.md` / `.cursorrules`) tend to become monolithic | README.md § FAQ |
| A2 | Without injection, conventions must be repeated every session ("instead of repeating yourself") | README.md § Why Trellis |
| A3 | Conversations get compacted, files don't → anything not persisted is lost | .trellis/workflow.md § Core Principles #3 |
| A4 | AI should get guidelines injected, not recall them from memory | .trellis/workflow.md § Core Principles #2 |
| A5 | Each AI tool would otherwise need its own workflow rebuilt | README.md § Why Trellis (Multi-platform row) |
| A6 | One person's hard-won rules don't spread to the team unless versioned in repo | README.md § Why Trellis (Team-shared row) |
| A7 | Earlier SessionStart payloads injected full workflow and crossed host truncation thresholds → now inject compact orientation only, details on demand | .trellis/spec/cli/backend/platform-integration.md § "Inject Orientation, Not References" |
| A8 | If a mandatory step isn't in the per-turn breadcrumb, the AI silently skips it (planning gate + commit skip manifested this way) | .trellis/workflow.md breadcrumb contract comment |

## B. The solution (mechanisms)

| # | Claim | Source |
|---|---|---|
| B1 | `.trellis/spec/` — scoped specs, injected per task | README.md § Why Trellis |
| B2 | `.trellis/tasks/<MM-DD-slug>/` — `task.json`, `prd.md`, optional `design.md` / `implement.md` / `research/`, `implement.jsonl` / `check.jsonl` | .trellis/workflow.md § Task System |
| B3 | `.trellis/workspace/<dev>/journal-N.md` (≤2000 lines each) — per-developer session memory, separate per dev → no team conflicts | .trellis/workflow.md § Workspace System; README FAQ |
| B4 | 3 phases: Plan → Execute → Finish; task status `planning` → `in_progress` → archived (`completed`) | .trellis/workflow.md § Phase Index, Current-task mechanism |
| B5 | README frames it as a 4-phase loop: Plan (brainstorm) → Implement (sub-agent) → Verify (check sub-agent) → Finish (update-spec writes learnings back) | README.md § How It Works |
| B6 | SessionStart hook injects compact orientation: current state, phase index, artifact read order, task-status | platform-integration.md § Inject Orientation |
| B7 | UserPromptSubmit hook (`inject-workflow-state.py`) injects a `<workflow-state>` breadcrumb every turn; text comes from `[workflow-state:STATUS]` blocks in workflow.md (single source of truth) | workflow-state-contract.md; workflow.md comment |
| B8 | Sub-agent context = `prd.md` + spec files listed in `implement.jsonl` / `check.jsonl` | platform-integration.md § Subagent Context Injection |
| B9 | Task creation approval ≠ implementation approval; `task.py start` refuses empty manifests | .trellis/workflow.md § Guardrails, Task System |
| B10 | `tl mem` — cross-platform search over past AI sessions (Claude Code, Codex, Devin, OpenCode, Pi, ZCode adapters) | .trellis/spec/cli/backend/commands-mem.md § Package boundary |
| B11 | `trellis channel` — multi-agent collaboration runtime (events.jsonl protocol, per-worker supervisor, claude/codex adapters) | .trellis/spec/cli/backend/index.md Guidelines Index row |
| B12 | `trellis ablate` / `restore` — reversible removal for with/without comparison | README.md § FAQ |
| B13 | Lightweight tasks may be PRD-only; complex tasks need `design.md` + `implement.md` before `task.py start` | .trellis/workflow.md § Planning Artifacts |
| B14 | Step details load on demand: `get_context.py --mode phase --step <X.Y>` | .trellis/workflow.md § Context Script; platform-integration.md § Inject Orientation |
| B15 | Sub-agent context read order: jsonl entries → `prd.md` → `design.md` → `implement.md` (shown on the page as "PRD + plan + specs") | .trellis/workflow.md step 2.1 ("Injects `prd.md`, `design.md` if present, and `implement.md` if present") |

## C. Platforms (22 in registry)

Registry: `packages/cli/src/types/ai-tools.ts` `AI_TOOLS` has **22** keys (README also says 22; CLAUDE.md's "~21" is stale — use 22).

| Context-delivery class | Platforms | Source |
|---|---|---|
| Class-1 Hook-inject (9) | Claude Code, Cursor, OpenCode, Kiro, CodeBuddy, Codex, Factory Droid, ZCode, Snow | platform-integration.md § Subagent Context Injection |
| Class-2 Pull-based prelude (7) | Gemini CLI, Qoder, Copilot, Reasonix, Trae, Grok, Kimi Code | same § Class-2 |
| Class-3 Extension-backed (2) | Pi, Oh My Pi | same § Class-3 |
| No hooks / no sub-agents — commands + skills only (3) | Kilo, Antigravity, Devin | platform-integration.md § Workflow State Injection "Deliberately absent" |
| Skills-first pull-based (1) | DeepSeek Harness (dsh) | ai-tools.ts `dsh` comment |

## D. Internal architecture (for contributors)

| # | Claim | Source |
|---|---|---|
| D1 | pnpm monorepo: `packages/core` (`@mindfoldhq/trellis-core`) + `packages/cli` (`@mindfoldhq/trellis`, bins `trellis`/`tl`); CLI depends on core via `workspace:*`; versions locked | CLAUDE.md § Project |
| D2 | Core subpath exports: `.`, `./channel`, `./mem`, `./task`, `./testing` | packages/core/package.json |
| D3 | Core owns: channel storage/reducers, task record helpers, shared types, pure validation, `mem` retrieval domain. CLI owns: commands/argv, terminal output, prompts/exit codes, template copying, migrations, update UX, release scripts | .trellis/spec/cli/backend/trellis-core-sdk.md § Package boundary |
| D4 | Shipped source = `packages/cli/src/templates/` (per-platform dirs + `common/` + `shared-hooks/` + `trellis/` + `markdown/`) | CLAUDE.md § Architecture; `ls templates` |
| D5 | `shared-hooks/`: `session-start.py`, `inject-workflow-state.py`, `inject-subagent-context.py`, `inject-shell-session-context.py` | `ls packages/cli/src/templates/shared-hooks` |
| D6 | `common/`: commands (start, continue, finish-work), skills (before-dev, brainstorm, break-loop, check, update-spec), bundled-skills (trellis-channel, trellis-meta, trellis-session-insight, trellis-spec-bootstrap) — rendered per platform via `{{placeholder}}` | `ls templates/common/*`; CLAUDE.md |
| D7 | `AI_TOOLS` registry → `PLATFORM_FUNCTIONS` (`fromTemplates(collect<Platform>Templates)`) → one file map drives both `init` and `update` | CLAUDE.md § Platform registry |
| D8 | Repo-root `.trellis/`, `.claude/`, `.cursor/`, … are Trellis installed into itself (dogfood) — outputs, not build inputs; edit the template instead | CLAUDE.md § Shipped templates |
| D9 | `.trellis/scripts/**/*.py` must be byte-identical to `templates/trellis/scripts/**`, enforced by `test/regression.test.ts` | CLAUDE.md |
| D10 | `trellis update`: `.trellis/.template-hashes.json` records installed bytes → pristine files auto-update, user-modified files are protected (prompt / skip / `.new`); written atomically | commands-update.md § Hashing & Idempotency |
| D11 | Per-version manifests `src/migrations/manifests/<version>.json` (149 today); data-only migration types `rename` / `rename-dir` / `delete` / `safe-file-delete`; no code change needed | migrations.md; commands-update.md § Boundaries |
| D12 | `AGENTS.md` merges only the `<!-- TRELLIS:START -->…END` block; `workflow.md` updates whole-file | commands-update.md § Update Plan Composition |
| D14 | Root `.trellis/spec/` is this repo's own specs (not shipped); never hand-edit `packages/cli/dist/**` or `.trellis/.backup-*/**` | CLAUDE.md § Shipped templates |
| D15 | Page labels for core exports: `.` → shared types/validation and `./testing` → test helpers are summaries of D3 + export names, not separate source statements | packages/core/package.json; trellis-core-sdk.md |
| D13 | CI order: py_compile (3.9) → typecheck → lint:py → lint → build → test; integration tests spawn `bin/trellis.js` → build before test | CLAUDE.md § Commands |
