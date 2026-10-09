# Implement — Trellis explainer page

## Ordered checklist

1. [ ] Load `artifact-design` + `artifact-diagramming` skills (Artifact quickstart, intent `other`).
2. [ ] Skeleton: tokens, theme, top bar, nav, section shells, i18n engine, icon sprite + legend.
   → verify: `node research/verify.mjs` passes on the skeleton; open in browser, toggle lang/theme.
3. [ ] Sections 0–3 (hero, map, problem, mapping diagrams).
   → verify: verify.mjs; screenshot desktop zh/en.
4. [ ] Sections 4–5 (workflow, injection timeline + platform matrix 9/7/2/3/1).
   → verify: counts cross-checked against fact-sheet § C.
5. [ ] Sections 6–9 (core/cli, distribution + dogfood, update/migrations, cheat-sheet).
   → verify: each claim against fact-sheet § D.
6. [ ] Full matrix screenshots {1280, 375} × {zh, en} × {light, dark} → `research/screens/`; check that `scrollWidth <= clientWidth` at 375.
7. [ ] Fact audit: walk every claim on the page → fact-sheet row (trellis-check).
8. [ ] Publish the Artifact from `docs/explainer/index.html`; record the URL in this file.
9. [ ] Commit only `docs/explainer/index.html` + this task dir (explicit paths). Run `detect_changes` first. If pre-commit fails because of pre-existing dirty files → stop and ask.

## Validation commands

```bash
node docs/explainer/verify.mjs docs/explainer/index.html     # moved next to the page so it outlives the task
grep -nE '(src|href)="https?://' docs/explainer/index.html   # expect no output
```

## Progress log (2026-10-08)

- [x] 1–5 Page written in one pass (sections 0–9, 13-symbol sprite, 8 diagrams, en/zh pairs).
- [x] verify.mjs: passes; mutation test (stray text, missing zh, unknown icon, external script) → all 4 caught, exit 1.
- [x] Browser geometry check (Chrome): no SVG text outside viewBox, no text overflowing its box, no text overlap — en + zh, quirks (file://) and standards-mode wrapper.
- [x] 6 Screenshots `research/screens/{1280,375}-{en,zh}-{light,dark}.webp`; verified distinct (md5), language (height), theme (mean brightness 28–34 dark / 232–240 light). 375px: `scrollWidth == clientWidth` with every `<details>` open.
- [x] Fixes found by looking: legend row misalignment (`align-content:start`), core/cli arrows hidden under the core box, stale nav highlight after jump-to-top (IntersectionObserver → scroll-position calc), "section 5" reference to unnumbered sections, "Two files" summary over a 3-item list, zh label 2px outside viewBox, long code paths overflowing on mobile (`overflow-wrap:anywhere`).
- [x] 7 Fact audit: every page claim maps to fact-sheet rows (B13–B15, D14–D15 added for claims that were sourced but unlisted).
- [x] 8 Published: https://claude.ai/artifact/1yFQVpABSVY3wHXYqmpMuQ (private).
- Decisions taken without asking (user: "工程决定全部由你做"): implemented inline instead of dispatching `trellis-implement` (sub-agent has no Skill tool for the artifact design guidance); skipped the mid-way draft review gate; no `trellis-check` sub-agent — nothing in `packages/` changed, so lint/typecheck/test are unaffected and the page checks above are the relevant ones.
- Debug note: an apparent "page scrolls by itself" during screenshots was real wheel input from the visible Chrome window (captured `wheel` events), not a page bug.

## Review gates
- After step 3: show the user the published draft link for direction feedback before doing the remaining sections.
- After step 7: final review.

## Rollback
- `git rm -r docs/explainer` (single new dir; no other files touched).
