BMad + Beads Integration Research
Research Date: December 7, 2025 Researcher: BMad Orchestrator Agent Purpose: Investigate potential integration between BMad-METHOD and Steve Yegge's Beads

Executive Summary
This research explores the relationship between two AI-assisted development frameworks:

BMad-METHOD: A structured Agile methodology with specialized AI agent personas
Beads: A persistent memory system for AI coding agents
Key Finding: No existing integration exists, but the frameworks are highly complementary with clear integration opportunities.

What is BMad-METHOD?
Overview
BMAD-METHOD (Breakthrough Method of Agile AI-driven Development) is a comprehensive framework combining AI agents with Agile development methodologies.

Core Philosophy: "Vibe CEO"
You direct, AI executes: Human provides vision and decisions
Specialized agents: PM, Architect, Dev, QA, etc.
Structured workflows: Template-driven, document-centric
Human oversight: Quality gates and approval checkpoints
Persistence Approach: "Stateless Agents, Stateful Documents"
Primary Memory Layer:

docs/prd.md - Product Requirements Document (source of truth)
docs/architecture.md - System design and technical decisions
docs/stories/\*.md - Individual user story files with complete context
Sharded docs - Broken down sections for focused agent loading
Story File Structure:

Story: Detailed description
Acceptance Criteria: What "done" means
Tasks: [ ] Checkbox tracking
Dev Notes: Implementation guidance
Testing: Expected test coverage
Dev Agent Record:

- Completion Notes: What was done
- Debug Log References: Issues encountered
- File List: All modified files
  QA Results: Review findings
  Change Log: History of changes
  Status: Draft → Approved → InProgress → Done
  Key Workflow Pattern:

SM Agent (fresh chat) → Reads sharded docs → Creates story
Dev Agent (fresh chat) → Reads story + standards → Implements
QA Agent (fresh chat) → Reads story + code → Reviews
Philosophy: Fresh context windows prevent pollution, documents provide persistence

BMad Strengths
✅ Human-readable markdown documents ✅ Git-native version control ✅ Explicit handoffs between agents ✅ Auditable decision trail ✅ Context control (load only what's needed) ✅ IDE integration ✅ Rich documentation (PRD, Architecture, Stories) ✅ Quality gates and validation processes

BMad Limitations
❌ No automatic dependency tracking ❌ Manual status updates (human verifies transitions) ❌ No cross-session agent memory ❌ Relies on document quality ❌ Human bottleneck for workflow advancement

Resources:

BMAD-METHOD GitHub
BMad Codes Website
BMAD Method: From Zero To Hero
What is Beads?
Overview
Beads is a lightweight, distributed issue tracker designed to give AI coding agents persistent memory across sessions. Created by Steve Yegge (former Head of Engineering at Sourcegraph, longtime Amazon and Google engineer).

Core Philosophy: "Agent with Long-Term Memory"
Agent-first design: AI autonomously manages task database
Persistent memory: Perfect recall across sessions and machines
Dependency-aware: Automatic ready-work detection
Distributed: Multi-agent coordination via git
Persistence Approach: "Git-Backed Issue Database"
Dual-Storage Architecture:

.beads/
issues.jsonl # Source of truth (committed to git)
beads.db # SQLite cache (gitignored, fast queries)
config.json # Configuration
Issue Format:

{
"id": "bd-a1b2",
"title": "Implement user auth",
"status": "open",
"priority": "high",
"blocks": ["bd-c3d4"],
"parent": "bd-e5f6",
"created": "2025-12-07T10:30:00Z"
}
Auto-Sync Magic:

Changes export to JSONL after 5 seconds
Git pull triggers automatic import
Reconciliation handles conflicts
Result: Feels like centralized database, but fully distributed
Dependency Tracking: Four relationship types:

Blocks - "Can't work on X until Y is done"
Related - "These issues are connected"
Parent-Child - "This epic contains these stories"
Discovered-From - "Found this issue while working on that one"
Core Agent Workflow:

1. bd ready # Discover unblocked work
2. bd update <id> --status in_progress
3. [Do work, discover new issues]
4. bd create "new issue" --deps discovered-from:<parent>
5. bd close <id> --reason "Done"
6. bd sync # Commit & push
   Beads Strengths
   ✅ Automatic dependency tracking ✅ Cross-session memory ✅ Distributed by design (multi-agent, multi-machine) ✅ Agent autonomy (files and manages issues proactively) ✅ Query-able (fast filtering via SQLite) ✅ Git-integrated (natural branching/merging) ✅ Collision-resistant hash-based IDs ✅ Minimal context overhead (~1-2k tokens via bd prime)

Beads Limitations
❌ No rich documents (just issue metadata) ❌ No role specialization (single agent model) ❌ No quality gates or approval workflows ❌ No templates for consistency ❌ JSONL not human-friendly (requires CLI) ❌ Requires git discipline

Resources:

Beads GitHub Repository
Steve Yegge's Announcement
Beads for Blobfish (Medium)
Beads on Hacker News
Steve Yegge on Agentic Coding (AI Tinkerers)
Research Findings
No Direct Integration Found
After extensive searching:

❌ No BMad issues mentioning Beads
❌ No Beads issues mentioning BMad
❌ No blog posts or discussions about combining them
❌ No community implementations
However, discovered valuable complementary patterns.

Key Discovery: Beads Issue #429
Issue: "Beads seems basically incompatible with Opus 4.5 + Claude Code"

The Critical Insight
Quote from issue discussion:

"TodoWrite handles ephemeral session notes; beads provides structured, persistent issue tracking across days/weeks/months—fundamentally different purposes rather than competitive tools."

Claude Code Skill Solution
Beads provides a Claude Code Skill at examples/claude-code-skill/ that teaches:

Core workflow patterns (discovery, execution, planning phases)
When to use bd vs TodoWrite
Session start protocols and ready work checks
Compaction survival patterns (critical for Claude Code context limits)
Issue lifecycle management with self-check checklists
How bd and other tools coexist
Key Philosophy:

Plugin: Provides slash commands and MCP tools (basic operations)
Skill: Teaches patterns, philosophy, and decision-making (effective usage)
Relevance to BMad
BMad currently uses TodoWrite for task tracking. The discovery that TodoWrite is "ephemeral" while Beads is "persistent" suggests a clear integration path:

BMad could use Beads as its persistent task tracking layer!

Key Discovery: AgentMem Extension
Issue #471: "AgentMem - Project memory layer for Beads"

What is AgentMem?
A complementary extension to Beads that adds project-specific memory:

Six bash-based extensions (bdx):

bdx-prime - Loads accumulated project context at session startup
bdx-context - Records findings and decisions tied to specific issues
bdx-outcome - Captures approach and results when issues close
bdx-journal - Manages project-specific documentation
bdx-search - Enables fuzzy searching across historical data
bdx-stats - Visualizes patterns and success metrics
Why This Matters
AgentMem addresses "the stuff that's unique to each project rather than universal beads workflow."

This is remarkably similar to BMad's document-driven approach!

Beads users independently recognized the need for:

Project-specific context (like BMad's PRD/Architecture)
Decision tracking (like BMad's story files)
Historical documentation (like BMad's change logs)
Insight: Both frameworks converge on needing rich project context beyond task tracking.

Comparative Analysis
Aspect BMad Beads
What persists Rich documents (PRD, Architecture, Stories) Issue metadata & dependencies
How it persists Markdown files edited by agents JSONL database synced via git
Agent model Fresh context, stateless agents Persistent memory, single agent
Dependency tracking Manual (SM sequences stories) Automatic (blocks/parent-child)
Cross-session Human + documents provide continuity Database provides continuity
Human role Orchestrator & quality gate Optional oversight
Context overhead Variable (full documents) Minimal (~1-2k tokens)
Best for Structured methodology & rich docs Long-running, complex task graphs
Specialization Multiple specialized agent roles Single autonomous agent
Quality gates Built-in (SM → Dev → QA) Not provided
Templates Extensive (PRD, Architecture, etc.) Not provided
Integration Opportunities
Philosophy: "Best of Both Worlds"
BMad provides:

Structured Agile methodology
Rich documentation (PRD, Architecture)
Specialized agent expertise
Quality gates and human oversight
Template-driven consistency
Beads provides:

Persistent cross-session memory
Automatic dependency tracking
Ready-work detection
Distributed multi-agent coordination
Autonomous issue discovery
Proposed Architecture
BMad Layer (Methodology + Documents):
├── PRD (docs/prd.md) - Product vision
├── Architecture (docs/architecture.md) - Technical design
├── Stories (docs/stories/\*.md) - Detailed specifications
└── Agents (SM, Dev, QA) - Specialized roles

Beads Layer (Task Memory + Dependencies):
├── bd issues - Persistent task tracking
├── Dependency graph - What blocks what
├── Ready detection - What's available to work on
└── Cross-session memory - Never forget discovered work
Integration Proposal: Hybrid Workflow
Phase 1: Planning (BMad-led)
Traditional BMad workflow:

PM Agent → Create PRD
Architect Agent → Create Architecture
SM Agent → Create stories in docs/stories/
Enhanced with Beads: 4. SM Agent also creates beads for each story:

bd create "Story 1.1: User Authentication" \
 --description "See docs/stories/epic-1.story-1.md for details" \
 --parent epic-1 \
 --priority 0
SM Agent sets up dependencies:
bd create "Story 1.2: Password Reset" \
 --deps blocks:bd-story-1-1 \
 --parent epic-1
Phase 2: Development (Beads-enabled)
Start of Dev Session:

$ bd ready
bd-story-1-1: Story 1.1: User Authentication [Priority: 0]
No blockers | Epic: epic-1
Details: docs/stories/epic-1.story-1.md
Dev Agent Workflow:

Agent sees ready work via bd ready
Claims task: bd update bd-story-1-1 --status in_progress
Reads story file: docs/stories/epic-1.story-1.md (BMad's detailed spec)
Implements code following BMad dev agent patterns
During work, discovers issues:
bd create "Add rate limiting to auth endpoint" \
 --deps discovered-from:bd-story-1-1 \
 --priority 2
Updates story file (BMad pattern) AND beads:

# Update story Dev Agent Record section (BMad)

# Then sync beads:

bd close bd-story-1-1 --reason "Implementation complete, tests passing"
Phase 3: QA Review (Hybrid)
QA Agent:

Reviews code (BMad methodology)
Appends to story's QA Results section (BMad)
If issues found, creates beads:
bd create "Refactor auth error handling" \
 --deps related:bd-story-1-1 \
 --priority 1
Next Dev Session:

$ bd ready
bd-refactor-auth: Refactor auth error handling [Priority: 1]
Related to: bd-story-1-1
bd-story-1-2: Story 1.2: Password Reset [Priority: 0]
Blocked by: Nothing (Story 1.1 complete)
Agent knows exactly what to work on next!

Concrete Implementation Steps

1. Enhance SM Agent
   Add to .bmad-core/agents/sm.md:

dependencies:
tasks: - create-next-story.md (existing) - create-beads-from-story.md (NEW)
New task: create-beads-from-story.md:

# Create Beads from Story

## Purpose

Create persistent beads issue for BMad story with proper dependencies

## Instructions

1. Parse story file for epic number and story number
2. Determine dependencies from epic sequence
3. Create bead:
   ```bash
   bd create "Story {epic}.{story}: {title}" \
     --description "Full spec: docs/stories/epic-{epic}.story-{story}.md" \
     --parent epic-{epic} \
     --priority {priority}
   If story depends on previous stories, add blocks:
   bd update {current-id} --deps blocks:{previous-story-id}
   Add bead ID to story file metadata
   ```

### 2. Enhance Dev Agent

**Modify dev agent activation in `.bmad-core/agents/dev.md`:**

```yaml
activation-instructions:
  - Load story file as usual
  - Check for beads ID in story metadata
  - If found: bd update {id} --status in_progress
  - On story completion: bd close {id} --reason "Story complete"
  - For discovered issues: bd create with discovered-from
Key workflow change:

# Before implementing
bd update bd-story-1-1 --status in_progress

# During work, discover issues
bd create "Fix edge case in password validation" \
  --deps discovered-from:bd-story-1-1

# After completion
bd close bd-story-1-1 --reason "All tasks complete, tests passing"
3. Create Integration Helper Scripts
scripts/bmad-beads-sync.sh:

#!/bin/bash
# Sync BMad stories with Beads

# Create epic parent issues
for epic in docs/prd/epic-*.md; do
  epic_num=$(echo $epic | grep -oP 'epic-\K\d+')
  epic_title=$(head -1 $epic | sed 's/^# //')
  bd create "Epic $epic_num: $epic_title" \
    --description "See $epic" \
    --priority 0
done

# Create story issues with dependencies
for story in docs/stories/*.md; do
  # Parse story file...
  # Create bead with appropriate deps...
done
4. Update BMad Story Template
Add to .bmad-core/templates/story-tmpl.yaml:

metadata:
  beads_id: null  # Will be populated by SM agent
  beads_status: null  # Synced with story Status field
Benefits of Integration
For BMad Users
✅ Persistent memory across sessions

Dev agent picks up where it left off, even days later
No need to manually figure out "what's next"
✅ Automatic dependency tracking

Beads knows what's blocked and what's ready
SM agent doesn't need to manually sequence stories
✅ Discovered issue tracking

Dev agent finds bugs/TODOs during work → files beads automatically
Nothing gets lost between sessions
✅ Multi-developer coordination

Multiple devs working on same project can sync via beads
Distributed task claiming via bd update --status in_progress
✅ Reduced context overhead

bd prime loads minimal task list (~1-2k tokens)
Story file loaded only when working on that specific task
For Beads Users
✅ Rich specification documents

Beads issues reference detailed BMad story files
Full context available when needed (PRD, Architecture, Acceptance Criteria)
✅ Structured workflow methodology

BMad provides the "how" (SM → Dev → QA cycle)
Beads provides the "what" (ready work detection)
✅ Quality gates

BMad's QA agent reviews enforce quality
Beads tracks review-related issues
✅ Specialized agent expertise

PM agent for requirements
Architect agent for technical design
QA agent for code review
All feeding into beads task graph
Challenges and Considerations
1. Dual Persistence Overhead
Challenge: Maintaining both story files AND beads issues

Solution:

Story file = rich specification (what/why/how)
Beads issue = lightweight task tracking (status/deps/priority)
Different purposes, minimal duplication
2. Status Synchronization
Challenge: Story Status field vs beads status can diverge

Solutions:

Make beads the source of truth for status
Script to sync story file Status from beads
Or: Story file remains comprehensive, beads is operational layer
3. Learning Curve
Challenge: Users must learn both BMad AND beads

Solution:

Start with BMad methodology (familiar to users)
Introduce beads as "enhancement" not "requirement"
Provide migration scripts for existing BMad projects
4. Tool Complexity
Challenge: More moving parts = more things to break

Solution:

Clear documentation of integration points
Fallback: BMad works without beads (graceful degradation)
Beads CLI errors shouldn't block BMad workflow
Future Research Directions
1. MCP Integration
Question: Could BMad agents use Beads MCP server instead of CLI?

Benefits:

More seamless integration
Better error handling
Structured data exchange
Research needed:

Test MCP server with BMad agents
Compare context overhead: MCP vs CLI
2. AgentMem + BMad Documents
Question: How does AgentMem's project memory relate to BMad's PRD/Architecture?

Potential:

AgentMem could reference BMad documents
BMad documents could be indexed by AgentMem search
Unified project memory layer
3. Multi-Agent Beads Usage
Question: Can multiple BMad agents (SM, Dev, QA) coordinate via single beads database?

Scenarios:

SM creates issues for stories
Dev claims and implements
QA creates review issues
All coordinated via beads dependency graph
Research needed:

Test concurrent agent access
Define agent-specific beads conventions
4. Brownfield Integration
Question: How does this integration work for existing codebases?

BMad brownfield workflow:

Analyst documents existing project
PM creates brownfield PRD
Architect creates brownfield architecture
Enhanced with beads:

Import existing tickets/issues into beads
Map current work items to BMad stories
Hybrid state: legacy issues + new BMad stories
Recommended Next Steps
For Experimenters
Set up both tools in a test project:
# Install BMad
npx bmad-method install

# Install Beads
brew install steveyegge/beads/beads
cd your-project && bd init
Try manual integration:
Create a story with SM agent
Manually create corresponding bead
Implement with Dev agent
Update both story file and bead
Document what works/breaks
Share findings:
Post results in BMad discussions
Share in Beads issues
Build community knowledge
For Tool Developers
Create proof-of-concept tasks:
create-beads-from-story.md
sync-story-status-from-beads.md
dev-agent-beads-integration.md
Build helper scripts:
Bulk story → beads conversion
Status synchronization
Dependency mapping
Document integration patterns:
Best practices guide
Common pitfalls
Troubleshooting
For Community Leaders
Facilitate discussion:
Cross-post in both communities
Organize video calls/demos
Create shared documentation
Build bridges:
Connect BMad and Beads developers
Share use cases and success stories
Identify integration champions
Create resources:
Integration guide
Video tutorials
Example repositories
Conclusion
BMad and Beads represent complementary approaches to AI-assisted development:

BMad excels at:

Structured methodology
Rich documentation
Specialized agent roles
Human oversight and quality gates
Beads excels at:

Persistent cross-session memory
Automatic dependency tracking
Distributed coordination
Agent autonomy
Together, they could provide:

Best-in-class methodology (BMad) + Best-in-class task memory (Beads)
Rich specifications (BMad) + Smart work detection (Beads)
Human oversight (BMad) + Agent autonomy (Beads)
Document-driven development (BMad) + Issue-driven execution (Beads)
The integration is highly feasible:

Both are git-native
Both use markdown/text files
Both support IDE workflows
Both embrace agent autonomy (differently)
No fundamental conflicts
Current state: Unexplored territory

No existing integration
No community discussion
Clear complementary patterns
Low-hanging implementation fruit
Opportunity: First movers could define best practices for combining structured AI development methodologies with persistent agent memory systems.

Additional Resources
BMad Resources
BMAD-METHOD GitHub
BMad Codes Website
BMAD Method: From Zero To Hero
BMad Issue Tracker
Beads Resources
Beads GitHub Repository
Beads AGENTS.md
Beads README
Steve Yegge's Announcement
Beads for Blobfish (Medium)
Steve Yegge on Agentic Coding (AI Tinkerers)
Beads on Hacker News
Beads MCP Server
Beads Viewer
Key Issues
Beads #471: AgentMem - Project memory layer
Beads #429: Claude Code Compatibility
Document Metadata:

Created: 2025-12-07
Research Duration: ~2 hours
Sources Consulted: 15+ GitHub issues, READMEs, blog posts, and community discussions
Methodology: Web research, issue tracker analysis, documentation review
Status: Initial research complete; implementation pending
License: This research document is provided as-is for community benefit. Feel free to share, modify, and build upon these findings.

Contact: For questions or collaboration, please open issues in the respective GitHub repositories or engage in community discussions.
```
