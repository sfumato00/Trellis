# Design — Trellis explainer page

## 1. Information architecture (progressive disclosure)

```
0 Hero        一句话：Trellis 让 AI 每次会话都“带着项目记忆和规范上岗”
1 Map         全局总览图（6 个区块 + 箭头），点击跳转 → 也是“你在这里”导航的来源
2 Problem     “没有 Trellis 的一次会话”：7 个痛点卡片（图标 + 一句话）
3 Mapping     问题 → 机制 二分连线图（左 7 痛点，右 6 机制）
4 Workflow    Plan → Execute → Finish 泳道 + 任务状态机 + 产物（prd/design/implement/jsonl）
5 Injection   时间轴：SessionStart / 每轮 breadcrumb / sub-agent 启动 三个注入点
              + 22 平台分类矩阵（9/7/2/3/1），折叠展开平台名
6 Repo        core ↔ cli 边界图（subpath exports，谁拥有什么）
7 Distribute  templates/ → AI_TOOLS → PLATFORM_FUNCTIONS → 用户 repo；
              dogfood 回环：本 repo 也是“用户 repo”，根目录是产出物；scripts 字节一致孪生
8 Update      template-hashes 判定（pristine→自动更新 / modified→保护）+ manifests 迁移
9 Cheat-sheet 贡献者速查：改什么去哪（edit template, not root）、CI 顺序、spec 索引
```
Each section: `<h2>` = core claim (one sentence), one `<figure>` SVG, optional `<details>` with specifics + source path.

## 2. Icon vocabulary (fixed, defined once as `<symbol>` sprite)

| id | Concept | Glyph idea |
|---|---|---|
| i-spec | Spec / conventions | book |
| i-task | Task (PRD dir) | clipboard-check |
| i-journal | Workspace journal / memory | notebook + clock |
| i-hook | Hook / injection | plug / syringe-arrow |
| i-agent | AI agent / sub-agent | robot head |
| i-platform | AI platform / host | window grid |
| i-template | Template source | stencil / layers |
| i-repo | User repo | folder-git |
| i-update | Update / migration | refresh arrows |
| i-warn | Pain point / risk | triangle |
| i-dev | Developer / team | person(s) |
| i-search | `tl mem` recall | magnifier |

Legend rendered once near the top; everything else uses `<use href="#i-…">`. Color carries category consistently: problem = warm (warn), mechanism = accent, architecture = neutral.

## 3. i18n contract (as built — changed from the original dictionary plan)

- Both languages live side by side in the markup as sibling pairs: `<span lang="en">…</span><span lang="zh">…</span>` in HTML, `<tspan lang="en">…</tspan><tspan lang="zh">…</tspan>` inside SVG `<text>`.
- CSS shows one: `:root:not([data-lang="zh"]) [lang="zh"]{display:none}` / `:root[data-lang="zh"] [lang="en"]{display:none}`.
  Why not a key→string dictionary: pairs keep each translation next to the thing it labels (rich inline `<code>` works, no key bookkeeping), and the page renders English with no JS.
- Language-neutral text (paths, code, platform names, counts) is marked `data-neutral` or lives in `<code>` / `.t-c`.
- `setLang(l)` sets `data-lang`, `lang`, and `document.title`. Default: saved choice (try/catch localStorage) → `navigator.language` starting with `zh` → `en`.
- SVG labels are sized for the longer string; `research/verify.mjs` enforces pair parity and flags untagged visible text.

## 4. Theming / layout

- CSS tokens on `:root`; dark under `@media (prefers-color-scheme: dark)` with `:root:not([data-theme="light"])`, plus `:root[data-theme="dark"]`; explicit `body` background. SVGs use `currentColor` / CSS vars, so they follow the theme.
- Layout: centered column max ~960px, 16px gutter; sticky top bar (lang toggle, theme toggle) + "you are here" nav (sticky side rail ≥1024px, horizontal scroll-chip strip on mobile, which scrolls internally, not the page). Active section via IntersectionObserver.
- SVGs: `viewBox` + `width:100%`; wide diagrams get an alternate vertical arrangement on narrow screens (two `<svg>`s toggled by media query) when horizontal layout would make text < ~11px.

## 5. Tooling / verification

- No build step. One file: `docs/explainer/index.html`.
- `research/verify.mjs` (task dir, not shipped): parses the HTML and checks AC1 (no external URLs), AC3 (every `<use>` resolves, no stray icon paths outside sprite), and AC4 (key parity, empty values, untagged visible text nodes, including SVG text).
- Browser screenshots via Chrome tools → `research/screens/`.

## 6. Compatibility / risk

- Not part of the build, tests or the npm package (`packages/cli` `files` don't include `docs/`). Prettier/eslint only cover `packages/cli/src/**/*.ts` → unaffected.
- Facts drift as Trellis evolves: the `<details>` cite source paths, and the page footer states "as of v0.6.17 / 2026-10".
- Rollback: delete `docs/explainer/`; nothing else depends on it.
