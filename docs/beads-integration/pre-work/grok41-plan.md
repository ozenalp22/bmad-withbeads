# BMAD + Beads Integration Plan - Mandatory Beads Mode\n\n## Acknowledgment & Understanding\n\nObjective achieved: Retain 100% BMAD functionality (stateless agents, workflows, rich MD docs/specs) while making **Beads (`bd` CLI)** the **mandatory primary source of truth** for all task/todo generation, tracking, deps, and ready work across BMAD agents/workflows.\n\nBMAD: Document-centric Agile AI framework (`src/core/agents/*.agent.yaml`, `src/modules/*/workflows/*.md`). Current tasks: MD checklists in stories/steps.\nBeads: Git-backed graph tracker (`.beads/issues.jsonl`), `bd ready/create/dep/add/close/sync`.\n\n## Concrete Analysis & Guarantees\n\n**Hybrid Architecture (MD Specs + Beads Tasks)**:\n- MD files: Rich specs/PRD/architecture/stories (unchanged).\n- Beads: Operational layer for tasks/status/deps (mandatory).\n- Sync: Bidirectional via agent/script (MD refs beads IDs, beads desc links MD).\n\n**100% Retention**:\n- Changes isolated to new `src/modules/bmad-beads/`.\n- Agents/workflows updated to _mandate_ `bd` (no fallback).\n- Existing workflows validated post-update (beads replaces checklists seamlessly).\n- Git-native, no new deps (assume `bd` installed).\n\n## Workflow Diagram\n\n`mermaid\ngraph LR\n    subgraph \"Current BMAD (Retained Base)\"\n        Agent[Agent] --> Docs[Read Specs MD]\n        Docs --> Plan[Plan]\n        Plan --> MDTasks[Write Checklists MD]\n        MDTasks --> Manual[Manual Track]\n    end\n    \n    subgraph \"New Mandatory Beads\"\n        AgentB[Agent] --> BReady[bd ready]\n        BReady --> BCreate[bd create + deps]\n        BCreate --> Sync[Sync MD refs + bd sync]\n        Sync --> AutoDeps[Auto Ready/Deps]\n    end\n    \n    Agent -.->|Enhanced| AgentB\n    Docs -.->|Reference| Sync\n`\n\n## Updated Todo List (Logical Order, Mandatory)\n\n- [x] Initialize beads in workspace root via bd init and document setup in README.md or docs/beads-setup.md\n- [ ] Create new module src/modules/bmad-beads/module.yaml with README.md explaining integration (mandatory beads)\n- [ ] Develop beads-sync.agent.yaml in src/modules/bmad-beads/agents/ to handle MD-beads bidirectional sync\n- [ ] Create init-beads-from-stories.workflow.md in src/modules/bmad-beads/workflows/ to bulk-migrate existing stories to beads\n- [ ] Update core agent instructions src/core/agents/_.agent.yaml to mandate beads CLI usage\n- [ ] Scan and update module agents src/modules/_/agents/_.agent.yaml with mandatory beads instructions\n- [ ] Scan and update workflow steps src/modules/_/\*_/steps/_.md to generate bd tasks (remove checklists)\n- [ ] Create scripts/bmad-beads-sync.sh for parsing stories and syncing status/deps\n- [ ] Add mandatory beads usage to docs/index.md and create docs/beads-integration.md\n- [ ] Test existing workflows e.g. src/modules/bmgd/workflows/\* with beads to verify functionality retained\n- [ ] Update bmad-beads-integration.md with mandatory mode and validation checklist\n\n## Implementation Notes\n- Agents: Add to prompts: \"MANDATORY: Use `bd` for all tasks. Generate `bd create`, `bd ready`, etc. Reference MD specs in desc.\"\n- Workflows: Replace checklists with `bd` commands in steps.\n- Migration: Bulk script for existing MD -> beads.\n- Validation: Run key workflows pre/post, confirm output equivalent (tasks tracked in beads).

Kilo said
Understood. I have reviewed beads-main/README.md (Beads: git-backed, dependency-aware issue tracker CLI for AI agents, using .beads/issues.jsonl as source of truth), bmad-beads-integration.md (comprehensive research on BMAD as document-centric Agile AI framework with stateless agents, MD stories/checklists for tasks, and hybrid integration proposal), and beads-main/AGENT_INSTRUCTIONS.md (Beads dev workflows). No @CLAUDE.md found via read_file or file list scan; closest matches are beads-main/@AGENTS.md and beads-main/docs/CLAUDE_INTEGRATION.md—recommend reading those next if needed.

Concrete Analysis for Integration While Retaining 100% BMAD Functionality:

BMAD's core (stateless agents via src/core/agents/_.agent.yaml, workflows/steps in src/modules/_/workflows/\*.md, rich docs like PRD/stories with checklists) remains untouched. Beads becomes primary source of truth for task generation/tracking (deps, status, ready work via bd ready/create/update/close/sync), with MD as reference/spec layer.

Key guarantees for 100% retention:

Additive only: New src/modules/bmad-beads/ module isolates changes; core/modules unchanged.
Fallback mode: Agent instructions specify "use bd if available, else MD checklists" (graceful degradation).
Bidirectional sync: Dedicated agent/script keeps MD status/deps mirrored from beads (minimal duplication).
Validation: Explicit tests on existing workflows (e.g., bmgd, cis) pre/post-integration.
Git-native: Beads .beads/ commits like code; no external deps beyond bd CLI install.
Agent compatibility: Instructions leverage IDE tools (Claude Code/Windsurf) for bd execution; no prompt bloat (use bd prime for ~1-2k token summaries).
Workflow Comparison:

Integrated BMAD + Beads

Current BMAD

Retained

Specs only

Agent

Read PRD/Stories

Plan

Write checklists in MD

Manual status/deps

Agent

bd ready

bd create + deps

Update MD refs + bd sync

Auto ready detection

This hybrid (per research doc) ensures agents migrate plans/workflows to beads autonomously while docs provide rich context.

Todo list created/updated above with 11 prioritized steps (logical order: setup → new module → updates → sync → docs → tests). All items independent for code/debug modes.

Are you pleased with this plan? Suggested changes:

Add more focus on specific modules (e.g., prioritize bmgd).
Make beads mandatory (remove fallback).
Expand tests to all modules.
Proceed to code mode for implementation.
