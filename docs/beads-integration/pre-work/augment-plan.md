Now let me understand the current task tracking system in BMAD and explore the agent/workflow files to understand what needs to change:

Let me also look at the SM agent and dev agent files to understand the current task management flow:

Now let me look at how dev-story workflow tracks tasks and the beads AGENTS.md to understand the full beads workflow:

Now I have a comprehensive understanding of both systems. Let me acknowledge and provide my analysis.

---

## Understanding Acknowledged

I now have a thorough understanding of both systems:

### **BMAD Method Current Task/Tracking System:**

1. **`sprint-status.yaml`** - The central tracking file containing:
   - Epic statuses: `backlog → in-progress → done`
   - Story statuses: `backlog → ready-for-dev → in-progress → review → done`
   - Retrospective statuses: `optional → done`

2. **Key workflows involved:**
   - `sprint-planning` - Generates `sprint-status.yaml` from epic files
   - `sprint-status` - Reads status file, shows progress, recommends next action
   - `create-story` - Creates story markdown files, marks status as `ready-for-dev`
   - `dev-story` - Dev agent works stories, updates status to `in-progress → review → done`

3. **Current limitations** (as identified in your research):
   - No automatic dependency tracking
   - Manual status updates
   - No cross-session agent memory
   - Human bottleneck for workflow advancement

### **Beads System:**

1. **Core capabilities:**
   - Git-backed JSONL database (`.beads/issues.jsonl`)
   - Dependency tracking: `blocks`, `discovered-from`, `parent-child`, `related`
   - Ready work detection: `bd ready` shows unblocked tasks
   - Status management: `open → in_progress → blocked → closed`
   - Cross-session memory via persistent database

2. **Key commands:**
   - `bd create` - Create issues with dependencies
   - `bd update --status` - Change status
   - `bd close --reason` - Complete issues
   - `bd ready` - Find unblocked work
   - `bd dep` - Manage dependencies
   - `bd sync` - Commit/push changes

---

## Concrete Analysis: How I'll Make the Change

### **Objective:** Replace BMAD's `sprint-status.yaml`-based tracking with Beads while retaining 100% BMAD functionality.

### **Key Principle: Layered Integration**

```
BMAD Layer (unchanged):
├── PRD, Architecture, Epics (docs/*.md)
├── Story Files (stories/*.md)
├── Agent Personas (SM, Dev, QA workflows)
└── Quality Gates & Validation

Beads Layer (replaces sprint-status.yaml):
├── Issues for Epics, Stories, Tasks
├── Dependency graph (blocks, parent-child)
├── Status tracking (in_progress, closed)
└── Ready work detection (bd ready)
```

### **Changes Required:**

#### **1. Workflows to Modify (5 files):**

| Workflow          | Current Behavior                 | New Behavior                                    |
| ----------------- | -------------------------------- | ----------------------------------------------- |
| `sprint-planning` | Creates `sprint-status.yaml`     | Creates beads issues for each epic/story        |
| `sprint-status`   | Reads `sprint-status.yaml`       | Runs `bd ready`, `bd list --status open`        |
| `create-story`    | Updates story status in YAML     | Creates/updates beads issue, sets `in_progress` |
| `dev-story`       | Updates YAML on start/complete   | `bd update --status in_progress`, `bd close`    |
| `code-review`     | Updates story status to `review` | `bd update --status` to represent review state  |

#### **2. Agent Instructions to Enhance (2-3 agents):**

| Agent                                | Addition                                        |
| ------------------------------------ | ----------------------------------------------- |
| SM Agent                             | Add beads commands for story creation/tracking  |
| Dev Agent                            | Add beads commands for claiming/completing work |
| (Optional) Add integration checklist | Beads sync at session end                       |

#### **3. New Components to Add:**

1. **Beads initialization in `workflow-init`** - Run `bd init --quiet` during project setup
2. **Status mapping** - BMAD statuses → Beads statuses:

   ```
   backlog → open (priority 4)
   ready-for-dev → open (priority 2)
   in-progress → in_progress
   review → in_progress with "review" label
   done → closed
   ```

3. **Story-to-Bead linking** - Story files get a `beads_id` metadata field

#### **4. What Remains Unchanged (100% preserved):**

- ✅ All PRD/Architecture/Epic document workflows
- ✅ Story file format and content
- ✅ Agent personas and communication styles
- ✅ Validation checklists
- ✅ Phase structure (Analysis → Planning → Solutioning → Implementation)
- ✅ Quality gates
- ✅ All other non-tracking workflows (34 total, ~5 need modification)

### **Implementation Approach:**

1. **Phase 1: Beads Integration Foundation**
   - Add beads initialization to workflow-init
   - Create status mapping documentation
   - Add `beads_id` field to story template

2. **Phase 2: Sprint Planning Migration**
   - Modify `sprint-planning/instructions.md` to create beads issues
   - Keep `sprint-status.yaml` as optional fallback initially

3. **Phase 3: Sprint Status Migration**
   - Modify `sprint-status/instructions.md` to use `bd ready`/`bd list`
   - Output same summary format, just sourced from beads

4. **Phase 4: Dev Workflow Integration**
   - Modify `dev-story/instructions.xml` to claim/complete via beads
   - Add `bd sync` at end of implementation

5. **Phase 5: Testing & Validation**
   - Test full workflow from sprint-planning → dev-story → review
   - Ensure backwards compatibility

### **Risk Mitigation:**

1. **Fallback mode** - Initially keep sprint-status.yaml generation as backup
2. **Graceful degradation** - If `bd` not installed, workflows still function with manual tracking
3. **Incremental rollout** - Can enable beads per-project via config flag

---

**Ready for your go-ahead to proceed with implementation.** Would you like me to start with a specific phase, or should I create a detailed task list first?
