# 用认知卸载方法（diagram + 图标）深入浅出介绍 Trellis 解决的问题

## Goal

产出一个单页、可交互的中英双语 HTML 讲解页，给**新贡献者**看。页面用认知卸载（cognitive offloading）的方式讲清三层内容：

1. **问题**：用 AI 写代码时，没有 Trellis 会出什么问题；
2. **解法**：Trellis 的哪个机制对应解决哪个问题；
3. **内部架构**：这个 repo 自身是怎么组织的，模板如何从 repo 分发到用户项目，以及如何更新。

## 已确认的决策（2026-10-08，与用户确认）

| 项 | 决定 |
|---|---|
| 载体 | 单页、自包含的交互 HTML，图解用内联 SVG |
| 受众 | 新贡献者 |
| 语言 | 中英双语，页内切换；默认语言跟随浏览器（`zh*` → 中文，否则英文），手动切换后记住选择 |
| 范围 | 问题 + 解法映射 + 内部架构 |
| 存放 | repo 内 `docs/explainer/index.html`，同时发布为私有 Artifact 链接 |
| 入口链接 | 暂不在 README / CONTRIBUTING 中加链接 |
| 方法论 | 空间化代替长文字；一套固定的图标词汇贯穿全页；每节只讲一个核心观点、配一张图；先总览后细节，细节可折叠；页面常驻一个“你在这里”导航 |

## Requirements

### R1 内容
- R1.1 **问题层**：至少覆盖事实底稿 A1–A8 中的这些痛点：单文件规则膨胀、每次会话都要重复规范、上下文被压缩后丢失、跨会话失忆、多平台各自重建、团队规范无法共享、AI 跳过必需步骤。
- R1.2 **解法层**：每个痛点都映射到一个 Trellis 机制（spec / task / workspace journal / hooks 注入 / 每轮 breadcrumb / sub-agent JSONL / `tl mem` / 多平台模板），并且用“问题 → 机制”的图来表达连线关系。
- R1.3 **工作流**：画出 Plan → Execute → Finish 三个阶段，以及任务状态的变化（planning → in_progress → archived）。
- R1.4 **上下文注入**：画出 SessionStart、每轮 UserPromptSubmit、sub-agent 启动这三个注入时机；画出 22 个平台按上下文投递方式的分类（Class-1/2/3、仅 commands+skills、skills-first），平台数量以 registry 为准。
- R1.5 **内部架构**：
  - core ↔ CLI 的边界和 subpath exports；
  - `templates/` → `AI_TOOLS` → `PLATFORM_FUNCTIONS` → 用户 repo 的分发流程；
  - dogfood 陷阱：根目录的 `.trellis/`、`.claude/` 等是产出物，不是源码；`.trellis/scripts` 与模板必须字节一致；
  - `update` 流程：template hashes 区分原始文件与用户改动文件，再按版本 manifest 做迁移。
- R1.6 页面上的每条事实都必须能在 `research/fact-sheet.md` 中找到出处。不允许编造数字或机制。

### R2 认知卸载形式
- R2.1 定义一套固定的图标词汇，约 8–12 个，在页面顶部用图例集中展示一次，之后全页只引用，不新增临时图标。
- R2.2 每节结构固定：一句核心观点（标题），一张图，可选的折叠细节。正文段落要短。
- R2.3 页面常驻一个导航（“你在这里”），高亮当前所在的章节。
- R2.4 先给全局总览图，再逐层深入。

### R3 双语
- R3.1 所有可见文本都有 zh 和 en 两个版本，包括 SVG 里的 `<text>`、图例、导航和 `<title>`。
- R3.2 切换语言不刷新页面、不改变布局；SVG 标签的宽度按两种语言中较长的那个来设计。

### R4 工程约束
- R4.1 单文件、离线可用：不依赖外部脚本或字体，所有图标和图都内联。
- R4.2 支持亮色和暗色两种主题（跟随系统，并可手动切换）。
- R4.3 手机宽度（375px）下没有横向滚动。
- R4.4 `localStorage` 的读写都包在 try/catch 里，存储不可用时页面也能正常渲染。
- R4.5 只新增 `docs/explainer/index.html` 和任务目录内的文件，不改动工作区里已有的其它改动。

## Acceptance Criteria

- [ ] AC1 `docs/explainer/index.html` 存在，是单文件，并且不包含任何 `http(s)://` 的 script/link/img 资源引用（用 grep 验证）。
- [ ] AC2 页面包含以下章节，每节都有一张图：总览、问题、问题→机制映射、工作流、上下文注入与平台分类、内部架构（core/cli）、模板分发与 dogfood、update/迁移。
- [ ] AC3 图标来自一个 SVG `<symbol>` sprite，全页只通过 `<use href="#i-…">` 引用。脚本检查：每个 `<use>` 都能在 sprite 中找到对应的 `<symbol>`，且 sprite 外没有其它内联图标 path。
- [ ] AC4 双语完整性：脚本检查每个 `data-i18n` 键在 zh 和 en 字典里都存在且非空；DOM 中没有未翻译的可见文本节点（包括 SVG `<text>`）。
- [ ] AC5 在浏览器中截图验证 {桌面 1280px, 手机 375px} × {zh, en} × {light, dark}，确认没有横向滚动、没有文字溢出或重叠，并把截图存进任务目录。
- [ ] AC6 页面上的每条事实都能对应到 `research/fact-sheet.md` 的某一行（check 阶段逐条核对）。平台数为 22，分类计数为 9 / 7 / 2 / 3 / 1。
- [ ] AC7 已发布为私有 Artifact，并把链接交给用户。
- [ ] AC8 提交只包含本任务自己的路径；pre-commit（完整的 `pnpm test`）通过。如果失败是工作区里已有的改动导致的，停下来问用户。

## Out of Scope

- 修改 README / CONTRIBUTING，或修改 docs-site 子模块。
- 修改任何 CLI 代码或 templates。
- 动画演示、视频、幻灯片版本。
