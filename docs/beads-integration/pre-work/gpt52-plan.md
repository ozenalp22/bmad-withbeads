## GPT-5.2 Plan: BMAD → Beads (bd) as the Primary Task/Work Tracking System

### Context / What this plan is

This document captures **my understanding**, **solution design**, and a **detailed patch plan** to migrate BMAD’s task/todo generation and tracking to **Beads (`bd`)** while retaining BMAD’s methodology and outputs.

### Non‑negotiables (confirmed requirements)

- **BMAD functionality must be retained 100%**: agents, workflows, templates, documents, validation and quality gates remain intact in capability.
- **Beads is required**: BMAD workflows must not “work normally” without Beads. Missing `bd` / missing `.beads` is a **hard error** with remediation steps.
- **Work model**: **Story = Beads issue**, and **Tasks/Subtasks = hierarchical child issues** under that story.
- **Code review findings are blocking (Option A)**: review issues block story completion; story cannot be closed/done until blockers are closed.

---

## Understanding: Where BMAD tracks work today (current state)

### Phase 4 implementation tracking surfaces

BMAD currently maintains two distinct “truths” for execution:

- **Story file checkboxes** are the micro-level execution plan:
  - `src/modules/bmm/workflows/4-implementation/create-story/template.md` includes `## Tasks / Subtasks` with `[ ]/[x]`.
  - `src/modules/bmm/workflows/4-implementation/dev-story/instructions.xml` uses those checkboxes as the authoritative task sequence and marks them complete.

- **`sprint-status.yaml`** is the macro-level story queue/status:
  - `sprint-planning` generates it.
  - `create-story` reads it to pick the next backlog story and updates status to `ready-for-dev`.
  - `dev-story` reads it to pick the next `ready-for-dev` story and updates to `in-progress` / `review`.
  - `code-review` updates status to `done` / `in-progress` and may add follow-up checkboxes in the story.

### Why this needs to change

This file-based system is **document-centric (great)** but:

- It has **no native dependency graph** (blockers, discovered work) across sessions/agents.
- It requires agents to “re-derive” what’s next from text/yaml, rather than query a structured, persistent work graph.

---

## Target architecture: Keep BMAD documents; move “work truth” to Beads

### Layering principle (retain BMAD, swap only tracking substrate)

BMAD remains the **spec + methodology** layer:

- PRD / Architecture / Epics / Story documents stay as-is.
- Agents retain roles, guardrails, and quality gates.
- Story files remain the “rich context bible” for implementation details, ACs, dev notes, file lists, and audit trails.

Beads becomes the **operational work graph** layer:

- Source of truth for: what work exists, what’s next, status, dependencies, discovered work, review blockers.
- Queried via `bd ready`, `bd list --json`, `bd show --json`, and dependency commands.

### High-level data model mapping

- **BMAD Epic** → Beads issue type `epic`
- **BMAD Story** → Beads issue type `task` (labeled as BMAD story)
- **BMAD Task** → Beads child issue (hierarchical) under Story
- **BMAD Subtask** → Beads child issue (hierarchical) under Task
- **BMAD Review Findings** → Beads child issues under Story **AND** they **block** story completion

### Status/stage mapping (Beads statuses + BMAD stage labels)

Beads built-in statuses are:

- `open`, `in_progress`, `blocked`, `closed`

BMAD has additional stages (`ready-for-dev`, `review`, etc.). We will represent BMAD stages using **labels** while keeping Beads’ built-in statuses authoritative.

Recommended mapping:

- **Backlog story**: `status=open`, label `bmad:stage:backlog`
- **Ready for dev**: `status=open`, label `bmad:stage:ready-for-dev`
- **In progress**: `status=in_progress`, label `bmad:stage:in-progress`
- **In review**: `status=in_progress`, label `bmad:stage:review`
- **Done**: `status=closed` (optionally remove stage labels)

Why labels (not custom statuses):

- `bd ready` is optimized around built-in statuses (`open` + `in_progress`) and blocker logic.
- Labels allow BMAD to slice the ready queue precisely (e.g., only `bmad:stage:ready-for-dev` for dev execution).

---

## Beads graph rules (ensuring BMAD semantics are preserved)

### Ordering and “what’s next”

BMAD’s dev workflow depends on executing tasks in a defined order. We preserve this by:

- **Task sequencing**: each task \(n\) is blocked by task \(n-1\)
  - `bd dep add <task_n_id> <task_n_minus_1_id> --type blocks`
- **Story sequencing within an epic** (default): story \(n\) blocked by story \(n-1\)
  - `bd dep add <story_n_id> <story_n_minus_1_id> --type blocks`

This enables canonical ready detection via Beads:

- “Next story” is found with `bd ready` filtered to BMAD story labels.
- “Next task within a story” can be found by listing hierarchical children and choosing the first `open`/`in_progress` that has no blockers (or simply by numeric order, since blockers enforce readiness).

### Review blockers (Option A)

When code review finds High/Medium issues:

- Create a Beads issue for each finding (child of the story).
- Add a **blocking dependency** such that the **story depends on the finding**:
  - `bd dep add <story_id> <review_issue_id> --type blocks`

Result:

- Story will not appear as “ready” (and BMAD will not mark it done) until review blockers are closed.

---

## Beads availability strategy (hard requirement)

### Requirement

In any BMAD-managed project, the agent must be able to run `bd …` reliably, independent of the host project language (Node, Python, Go, etc.).

### Implementation approach

We will **vendor a project-local bd binary under `_bmad/`**, provisioned by the BMAD installer.

Key design constraints:

- Must not require the host project to be a Node project.
- Must be deterministic for BMAD workflows: the command to run is always `{project-root}/_bmad/bin/bd …`.

Provisioning approach:

- During `bmad install` (module installer phase), create:
  - `{project-root}/_bmad/_tools/beads/` (a BMAD-managed Node workspace)
  - `{project-root}/_bmad/bin/` (stable executable location)
- In `_bmad/_tools/beads/`, run:
  - `npm install @beads/bd@<pinned-version>`
  - Ensure install runs with `CI` unset so `@beads/bd` postinstall downloads the native binary.
- Copy the native binary from:
  - `_bmad/_tools/beads/node_modules/@beads/bd/bin/bd` (or `bd.exe`)
  - into `_bmad/bin/bd` (or `_bmad/bin/bd.exe`)
- Run:
  - `_bmad/bin/bd init --quiet` (or fail with remediation if git not initialized / permissions issues)

Notes:

- This makes Beads a **hard dependency** without polluting the host project root.
- `@beads/bd` skips binary download when `CI` is set; we will explicitly override env for the installer subprocess to ensure the binary is present for real installs.

---

## Workflow changes (solutioning)

### Guiding rule

BMAD documents remain rich specs; Beads becomes the tracker. Workflows should:

- Create/update Beads issues as the authoritative representation of work.
- Reference story files from Beads issues (path in description and/or `external_ref`).
- Reference Beads IDs inside story files (stable link from doc → issue).

### Phase 3: create epics and stories (planning → work graph creation)

When epics/stories are produced from PRD/architecture:

- Create Beads epic issues for each BMAD epic.
- Create Beads story issues for each story under the epic.
- Add `blocks` dependencies between sequential stories (default).
- Set stage labels:
  - early stories: `bmad:stage:backlog`

This ensures Beads already “knows” the work graph before Phase 4 begins.

### Phase 4: create-story

Today: picks story from `sprint-status.yaml`, writes story file, updates yaml status.

New behavior:

- Select next story issue from Beads (e.g., first `bmad:story` in `bmad:stage:backlog` with no blockers).
- Generate the story file as today.
- Update Beads story:
  - label `bmad:stage:ready-for-dev`
  - ensure story description points to story file path.
- Parse Tasks/Subtasks and create Beads children:
  - task issues: `--parent <story-id>`
  - subtask issues: `--parent <task-id>`
  - apply sequential blockers between tasks/subtasks

### Phase 4: dev-story

Today: finds story via `sprint-status.yaml`, then executes story checkboxes.

New behavior:

- Find story via `bd ready --label bmad:story --label bmad:stage:ready-for-dev --json`
- `bd update <story> --status in_progress` + label stage `bmad:stage:in-progress`
- Execute work by iterating Beads tasks in order:
  - For each task/subtask:
    - implement + tests as today
    - `bd update/close` the corresponding task/subtask issue
- On story completion:
  - set story file status to `review` (BMAD behavior preserved)
  - set story label to `bmad:stage:review`

### Phase 4: code-review (Option A)

Today: adds follow-up checkboxes + can set done.

New behavior:

- If High/Medium findings exist:
  - create a Beads issue per finding under the story
  - add `blocks` dependencies from story to those finding issues
  - story stays non-closed until all those finding issues are closed
- If no High/Medium findings:
  - close story issue (or move to done policy)

---

## Detailed patch plan (ordered patch sets)

### Patch set 0: Add a shared BMAD↔Beads convention doc (internal)

- **Add** `src/modules/bmm/data/beads-conventions.md`
  - canonical labels
  - title formats
  - how to map story file ↔ beads issue
  - required commands and flags (`--json` usage)

### Patch set 1: Installer: provision `bd` into `_bmad/` (hard requirement)

Files:

- **Update** `tools/cli/installers/lib/core/installer.js`
- **Update** `src/core/_module-installer/installer.js` (or add a module-level installer hook if more appropriate)
- **Add** a small helper module (preferred):
  - `tools/cli/lib/beads/provision.js` (download/install/copy/init)

Implementation details:

- Create `_bmad/_tools/beads/package.json` (minimal) and run `npm install @beads/bd@<pinned>`
- Copy native binary into `_bmad/bin/`
- Validate by running `_bmad/bin/bd version`
- Initialize `.beads` if missing: `_bmad/bin/bd init --quiet`
- If `.git` missing and `bd init` requires it: fail with message “run `git init` first”

### Patch set 2: BMM config: record tracking choice and Beads settings

Files:

- **Update** `src/modules/bmm/module.yaml`

Add config keys:

- `tracking_system`: single-select with default `beads` (only supported value for now)
- (optional) `beads_labels_prefix`: default `bmad`
- (optional) `beads_actor`: default `{user_name}` or `BMad`

### Patch set 3: Story template: persist Beads link in every story file

Files:

- **Update** `src/modules/bmm/workflows/4-implementation/create-story/template.md`

Changes:

- Add a small metadata block near top:
  - `Beads Story ID: <bd-...>`
  - `Beads Epic ID: <bd-...>`
  - `Beads Tracking: _bmad/bin/bd`
- Replace/augment “Tasks / Subtasks” section to indicate:
  - tasks/subtasks tracked in Beads, and (optionally) mirrored for humans

### Patch set 4: Solutioning workflow: create Beads epics/stories when epics/stories are generated

Files:

- **Update** `src/modules/bmm/workflows/3-solutioning/create-epics-and-stories/steps/step-03-create-stories.md`
- Potentially also:
  - `step-02-design-epics.md`
  - `step-04-final-validation.md`

Changes:

- Instruct SM to:
  - create epic issues (`bd create … -t epic`)
  - create story issues under epics (use `--parent <epic-id>`)
  - add sequential `blocks` dependencies between stories
  - label stories with `bmad:story` and initial stage `bmad:stage:backlog`

### Patch set 5: Phase 4 workflow: create-story now selects story from Beads and generates Beads child tasks/subtasks

Files:

- **Update** `src/modules/bmm/workflows/4-implementation/create-story/instructions.xml`
- **Update** `src/modules/bmm/workflows/4-implementation/create-story/workflow.yaml` (variables/notes)
- **Update** `src/modules/bmm/workflows/4-implementation/create-story/checklist.md` (validation references)

Changes:

- Replace “discover story from sprint-status.yaml backlog” with:
  - `bd ready --label bmad:story --label bmad:stage:backlog --json`
  - choose first returned story
- After story file generation:
  - update story issue labels to `ready-for-dev`
  - create task/subtask child issues and link sequential blockers
  - write Beads IDs into story file

### Patch set 6: Phase 4 workflow: dev-story uses Beads to drive task execution

Files:

- **Update** `src/modules/bmm/workflows/4-implementation/dev-story/instructions.xml`
- **Update** `src/modules/bmm/workflows/4-implementation/dev-story/checklist.md`

Changes:

- Step 1: story selection via `bd ready` filtered to `ready-for-dev`
- Step 4: mark story `in_progress` in Beads
- Step 5/8: mark tasks/subtasks closed in Beads as completed
- Completion: move story to `review` stage label in Beads

### Patch set 7: Phase 4 workflow: code-review creates blocking review issues

Files:

- **Update** `src/modules/bmm/workflows/4-implementation/code-review/instructions.xml`
- **Update** `src/modules/bmm/workflows/4-implementation/code-review/checklist.md`

Changes:

- On findings:
  - create review issues under story
  - add `blocks` deps story → finding
- On approval:
  - close story (only if no blockers remain)

### Patch set 8: Update agent personas to enforce Beads-first guardrails

Files:

- **Update** `src/modules/bmm/agents/sm.agent.yaml`
- **Update** `src/modules/bmm/agents/dev.agent.yaml`
- Optionally:
  - `src/modules/bmm/agents/quick-flow-solo-dev.agent.yaml`

Changes:

- Add/adjust principles + critical_actions to:
  - treat Beads as authoritative work tracker
  - always create discovered work via `discovered-from`
  - never mark story done unless Beads tasks + review blockers are closed

### Patch set 9: Migration tool for existing BMAD projects (one-time conversion)

Files (new):

- `tools/beads/migrate-bmad-to-beads.js` (or similar)

Behavior:

- scan existing story files and epics
- create missing epic/story issues
- parse story checkboxes to create child task/subtask issues
- map story status to Beads labels/status
- write Beads IDs back into story files

### Patch set 10: Tests + docs

- Update installation docs (`CLAUDE.md` and/or module docs) to state:
  - Beads is required
  - `bd` lives at `_bmad/bin/bd`
- Add a minimal test that:
  - runs the installer in a temp directory (mocking npm download if needed)
  - verifies `_bmad/bin/bd` exists and `.beads/` is initialized

---

## Implementation notes / risks (and mitigation)

### Risk: `@beads/bd` skips binary download when `CI` is set

Mitigation:

- Installer subprocess should run `npm install` with `CI` unset (explicit env override).
- For BMAD’s own CI tests, if we add tests that exercise provisioning, provide a test flag to bypass real downloads and use a stub `bd` binary.

### Risk: host project may not be a git repo

Mitigation:

- Detect `.git/` at install time; if missing, show a hard error:
  - “Beads requires a git repo; run `git init` (or initialize your repo) then re-run BMAD install.”

---

## Acceptance criteria (what “done” looks like)

- Running `bmad install` results in:
  - `_bmad/bin/bd` exists and is executable
  - `.beads/` exists (initialized)
- SM workflows create Beads epic/story issues and dependencies automatically (by instruction).
- Dev workflows select work via Beads, and completion updates Beads (tasks/subtasks + story stage).
- Code review findings (high/medium) block story completion in Beads until resolved.
- BMAD’s story documents, quality gates, and agent behaviors remain intact in capability and output.
