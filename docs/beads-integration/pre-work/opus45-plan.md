## Understanding Acknowledgment & Integration Analysis

### Systems Reviewed

**BMAD (from [`CLAUDE.md`](CLAUDE.md)):**

- AI-driven agile framework with 12 agents (SM, Dev, PM, Architect, etc.)
- 34 workflows across 4 phases (Analysis → Planning → Solutioning → Implementation)
- Current task tracking via story file checkboxes (`- [ ] Task`) and `sprint-status.yaml`

**Beads (from [`beads-main/README.md`](beads-main/README.md)):**

- Git-backed graph issue tracker for AI agents
- Persistent memory via `.beads/issues.jsonl` + SQLite cache
- Dependency graph: `blocks`, `parent-child`, `related`, `discovered-from`
- Commands: `bd ready`, `bd create`, `bd close`, `bd dep add`

**Integration Research (from [`bmad-beads-integration.md`](bmad-beads-integration.md)):**

- No existing integration; frameworks are complementary
- Key insight: TodoWrite = ephemeral session notes; Beads = persistent structured tracking

---

### Concrete Analysis: What Changes vs What Stays

**REPLACED BY BEADS:**
| Current BMAD | Beads Replacement |
|--------------|-------------------|
| `- [ ] Task` checkboxes in story files | `bd create`, `bd close` commands |
| `sprint-status.yaml` status values | `bd` issue status field |
| Manual SM story sequencing | `bd dep add` for blocks/parent-child |
| "Find ready-for-dev" YAML parsing | `bd ready` command |

**100% PRESERVED:**

- Agent personas, expertise, and menu triggers
- Workflow phases and step structure
- Story file rich content (acceptance criteria, dev notes, references)
- Quality gates (code review, validation workflows)
- PRD, Architecture, Epics documents
- All 34 workflows continue functioning

---

### Files Requiring Modification

1. **Agent Definitions** (persona stays, critical_actions updated):
   - [`sm.agent.yaml`](src/modules/bmm/agents/sm.agent.yaml:23-24) - Add beads creation
   - [`dev.agent.yaml`](src/modules/bmm/agents/dev.agent.yaml:26-35) - Use `bd ready/update/close`

2. **Workflow Instructions**:
   - [`sprint-planning/instructions.md`](src/modules/bmm/workflows/4-implementation/sprint-planning/instructions.md) - Generate beads from epics
   - [`create-story/template.md`](src/modules/bmm/workflows/4-implementation/create-story/template.md) - Add `beads_id` metadata
   - [`dev-story/instructions.xml`](src/modules/bmm/workflows/4-implementation/dev-story/instructions.xml) - Replace YAML ops with `bd` commands
   - [`workflow-status/init/instructions.md`](src/modules/bmm/workflows/workflow-status/init/instructions.md) - Add `bd init` step

3. **New Components**:
   - Beads-mapping reference doc
   - Migration script for existing sprint-status.yaml files

---

### Implementation Phases (When You're Ready)

| Phase             | Scope                                               | Key Change               |
| ----------------- | --------------------------------------------------- | ------------------------ |
| 1. Foundation     | `bd init` in workflow-init, story template metadata | Beads becomes available  |
| 2. Story Creation | SM creates beads with parent-child hierarchy        | Stories tracked in beads |
| 3. Development    | Dev uses `bd ready`/`bd update`/`bd close`          | Beads is source of truth |
| 4. Dependencies   | Automatic `blocks` relationships, `discovered-from` | Smart work detection     |

**Fallback**: If beads not installed, workflows gracefully use current system.

---

Awaiting your instruction to proceed with implementation planning (Session.md creation).
