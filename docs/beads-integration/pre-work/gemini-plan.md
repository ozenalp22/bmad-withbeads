I have completed the analysis of both BMAD and Beads and formulated a concrete integration plan.

### **Acknowledgement of Understanding**

I understand the objective is to integrate **Beads** (a persistent, graph-based task tracking system) into the **BMAD** (Agile AI development framework) ecosystem.

- **Goal:** BMAD's agents (SM, Dev) and workflows must migrate to using Beads as their primary tool for task generation, tracking, and "source of truth" for what work is available.
- **Constraint:** Full BMAD functionality (rich documents, specific agent roles, step-file workflows) must be retained 100%. The integration should be additive and complementary, replacing only the _mechanism_ of task tracking, not the _substance_ of the work.

### **Concrete Analysis & Integration Plan**

My analysis of the codebase confirms that BMAD relies heavily on `sprint-status.yaml` and individual Markdown story files (`docs/stories/*.md`) for state. Beads can seamlessly layer on top of this by mapping "Stories" to "Beads".

Here is the step-by-step plan to implement this change:

#### **1. Story Template & Metadata (`template.md`)**

**Change:** Modify `src/modules/bmm/workflows/4-implementation/create-story/template.md`. **Detail:** Add a `beads_id` field to the story file metadata. **Reason:** This links the rich document (BMAD) to the tracking node (Beads), allowing agents to cross-reference them.

#### **2. Agent Persona Updates (`sm.agent.yaml` & `dev.agent.yaml`)**

**Change:** Update the `critical_actions` and `principles` in both agent definition files. **Detail:**

- **SM Agent:** "When creating stories, YOU MUST create a corresponding Bead using `bd create` and link dependencies."
- **Dev Agent:** "Use `bd ready` to find your next task. When starting, `bd update ... --status in_progress`. When finishing, `bd close`." **Reason:** Agents follow their persona definitions strictly. This ensures they "think" in Beads terms.

#### **3. Story Creation Workflow (`step-03-create-stories.md`)**

**Change:** Modify the step file used by the SM to generate epics and stories. **Detail:** Add instructions to the "Execution Protocols" or "Story Generation Process" to execute `bd create` commands for every story generated.

- Example: `bd create "Story 1.1: Title" --priority 0` **Reason:** This ensures that as soon as a story exists conceptually in the docs, it exists physically in the Beads database.

#### **4. "Ultimate" Story Context Workflow (`create-story/instructions.xml`)**

**Change:** Update the workflow that prepares a story for development. **Detail:**

- In **Step 6 (Finalize)**: Instead of just updating `sprint-status.yaml`, the workflow will also verify the Bead exists and set its status to a "ready" state (if not already handled by Beads' dependency logic). **Reason:** This keeps the "Ready for Dev" signal valid in both systems.

#### **5. Development Workflow (`dev-story/instructions.xml`)**

**Change:** This is the most critical integration point. **Detail:**

- **Step 1 (Find Story):** Add logic to run `bd ready` to discover the next available task, prioritizing it over `sprint-status.yaml` scanning.
- **Step 4 (Mark In-Progress):** Add `bd update <id> --status in_progress`.
- **Step 5 (Implementation):** If the agent discovers new sub-tasks or bugs, instruct it to use `bd create ... --deps discovered-from:<id>`.
- **Step 8/9 (Completion):** Add `bd close <id>` when the story is verified complete. **Reason:** This fully migrates the "loop" of work to Beads.

#### **6. Retention of BMAD Functionality**

- **Redundancy:** I will **not** remove the updates to `sprint-status.yaml` initially. We will update _both_ Beads and the YAML file. This ensures that any legacy tools or workflows that strictly look for the YAML file will continue to work 100%.
- **Rich Context:** The `bd` description will point to the `docs/stories/story-X.md` file. The Dev agent will still read the full BMAD story file for the "Ultimate Context", ensuring the depth of BMAD is not lost to the brevity of Beads.

### **Next Steps**

I am ready to proceed with these edits upon your approval. I will implement them file-by-file, verifying the syntax and logic at each step.
