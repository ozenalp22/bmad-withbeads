Granular Integration Strategy

1.  Baseline + Impact Analysis
1.  Trace current task lifecycle
    • Files: src/modules/bmm/workflows/\*\*, story templates in .bmad-core/templates/, CLI
    helpers under tools/cli/commands.
    • Goal: map every point where stories are created, status updated, or tasks
    enumerated so we know precisely where to hook beads without altering existing
    semantics.
1.  Classify touchpoints
    • Categorize into creation (SM workflows), execution (Dev/QA agent scripts),
    reporting (status fields, CLI summaries), and persistence (docs/stories).
    • Reasoning: ensures each bead integration has a corresponding rollback path and
    avoids regressions by modifying only one category at a time.

1.  Story ↔ Bead Linking Fabric
1.  Story metadata extension
    • Add beads_id, beads_status, beads_last_sync to the story frontmatter template plus
    schema validators (if any).
    • Rationale: keeps markdown as the human-readable source, while the new fields act as
    pointers into beads; existing tooling sees unchanged sections.
1.  SM workflow augmentation
    • Modify the SM agent task (likely src/modules/bmm/tasks/create-story or equivalent)
    to call a new helper tools/beads/story-create.js.
    • Helper responsibilities: parse epic/story IDs, call bd create (via child_process),
    capture JSON output, write bead ID back to the story atomically.
    • Reasoning: isolates bead logic so the SM agent instructions remain simple, and
    failures can be caught to fall back to doc-only mode.
1.  Backfill/migration script
    • Script scans docs/stories/\*_/_.md, detects missing beads_id, and either maps to
    existing beads (if metadata comments exist) or creates new ones with parent/block
    relationships inferred from filenames.
    • Provides --dry-run to show actions before applying.
    • Reasoning: ensures legacy projects don’t require manual re-entry and prevents
    divergence between the two systems.

1.  Runtime Agent Flow Integration
1.  Dev agent entry hook
    • Wrapper (e.g., tools/beads/dev-session.js) reads the story metadata, runs bd update
    <id> --status in_progress, and logs failures without crashing.
    • Dev instructions updated to use the wrapper before editing code; still record
    progress in story “Dev Agent Record”.
    • Reasoning: beads becomes the authoritative state tracker, but the human-auditable
    notes remain untouched.
1.  Discovery + child issues
    • Provide small utility (maybe CLI subcommand npm run beads:create-discovery --
    --story path --title …) that Dev/QA agents call to log follow-up work with --deps
    discovered-from:<parentId>.
    • Reasoning: enforces consistent formatting and ensures dependency threads are
    captured even when multiple agents are active.
1.  Completion + QA
    • Dev completion script closes the bead (bd close … --reason …) only after story
    “Status” flips to ReadyForQA; QA script reopens or creates new beads if defects
    found.
    • Status sync tool (next section) verifies docs vs bd alignment nightly or in CI.
    • Reasoning: keeps BMAD quality gates intact—stories can’t be marked Done unless both
    markdown and bead reflect the same terminal state.

1.  Sync + Validation Layer
1.  Status reconciliation tool
    • tools/beads/status-sync.js: reads all story files, fetches bead states via bd show
    --json, compares statuses, emits diff report, optionally updates markdown or bead
    status depending on config.
    • Integrated into npm test pipeline as a fast check (mocking beads for CI if needed).

    • Reasoning: prevents silent divergence; automated gate guards against regressions
    caused by human edits to either side.

1.  Dependency verification
    • Optional script ensuring bead blocks relationships mirror story ordering or
    explicit metadata (e.g., depends_on).
    • Reasoning: maintains BMAD’s planned sequencing while leveraging beads’ ready-list
    features; errors surface early if someone mislabels dependencies.
1.  Feature flag + graceful degradation
    • Config (env var BMAD_USE_BEADS=true) toggles new behavior. All helpers check the
    flag and wrap CLI invocations, logging warnings when beads is unavailable but
    letting BMAD proceed with markdown-only tracking.
    • Reasoning: ensures 100% BMAD functionality even if beads CLI isn’t installed or
    .beads/ gets corrupted.

1.  Testing, Tooling, and Rollout
1.  Unit/integration tests
    • Mock bd CLI responses (using fixtures under test/fixtures/beads/) to validate
    helper scripts and ensure no story files are mutated unexpectedly.
    • Extend existing schema tests to include new frontmatter fields.
    • Reasoning: regression safety net covering both doc and CLI changes.
1.  End-to-end dry run
    • Create sample epic/story, run SM→Dev→QA workflow with beads flag on, confirm bd
    ready shows expected transitions while markdown remains identical except for
    metadata.
    • Reasoning: proves parity before shipping.
1.  Developer guidance (internal)
    • Draft internal notes/playbook (not README unless later requested) on enabling the
    integration, running migration script, and common failure modes.
    • Reasoning: smooth adoption while keeping public docs untouched per instruction.
