# Warp Context Rules (Static)

Purpose
- This file is authored in the contx/ submodule and copied to the project root by the setup script.
- It explains how Warp should load context and where the single source of truth lives.

How Warp should think about this project
- The source of truth is in `context-engine/` at the project root.
- Always begin with `context-engine/global-context.md` to understand architecture, constraints, and direction.
- Before writing or modifying any code, you **MUST** consult the documents within the `context-engine/standards/` directory. These documents define the mandatory coding standards, design patterns, and architectural guidelines for this project.
- Domain specifics (auth, database, API, draft workflow, etc.) live under `context-engine/domain-contexts/`.
- Tasks are organized under `context-engine/tasks/` using the documented naming convention (see contx/README.md).

Workflow for agents (Warp)
1) Load `context-engine/global-context.md` first.
2) Load any relevant `context-engine/domain-contexts/*.md` based on the topic.
3) Check for an active task pointer at `context-engine/active-task.json`. If present, prefer that task’s folder under `context-engine/tasks/`.
4) If the user references a task folder (task-*), use the four phase docs in that task: 01-problem-definition, 02-research, 03-plan, 04-implementation.
5) Keep decisions and next steps updated in the task folder to maintain continuity.

Note
- This file is static by design. Do not append dynamic content here. If broader context changes, update `context-engine/global-context.md` and resync.

