# BMad Method & BMad Core

[![Stable Version](https://img.shields.io/npm/v/bmad-method?color=blue&label=stable)](https://www.npmjs.com/package/bmad-method)
[![Alpha Version](https://img.shields.io/npm/v/bmad-method/alpha?color=orange&label=alpha)](https://www.npmjs.com/package/bmad-method)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289da?logo=discord&logoColor=white)](https://discord.gg/gk8jAdXWmj)

---

<div align="center">

## 🔀 Fork Notice: BMAD + Beads Integration

**This is a fork of [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) with deep integration of [Beads](https://github.com/steveyegge/beads)** — Steve Yegge's distributed, git-backed issue tracker designed specifically for AI agents.

</div>

### What is Beads?

[Beads](https://github.com/steveyegge/beads) is a lightweight, dependency-aware issue tracker that lives in your git repository. Unlike traditional issue trackers (Jira, Linear, GitHub Issues), Beads is optimized for AI agents:

- **Git-native**: Issues are stored in `.beads/issues.jsonl` and sync with your code
- **Dependency-aware**: `bd ready` shows only unblocked work items
- **Hierarchical**: Parent-child relationships for epic → story → task → subtask
- **AI-optimized**: JSON output, simple CLI, perfect for LLM tool use

### Why This Fork?

BMAD Method is powerful for AI-driven development, but its task tracking relied on markdown checkboxes and YAML files — which are stateless between AI sessions. **Beads solves this** by providing persistent, dependency-aware task tracking that AI agents can query and update.

**Key Integration Points:**

| BMAD Phase                  | Beads Integration                                                                 |
| --------------------------- | --------------------------------------------------------------------------------- |
| **Phase 3: Solutioning**    | Epic/story creation automatically generates Beads issues with sequential blockers |
| **Phase 4: Implementation** | `bd ready` drives work discovery; `bd close` marks completion                     |
| **Code Review**             | High/medium findings create blocking dependencies, preventing story closure       |

### What Changed?

- **Beads is mandatory** — BMAD core workflows require `bd` CLI to function. The installer provisions Beads unconditionally and will fail if provisioning is unsuccessful.
- **bmad-beads module is required** — The bmad-beads module is automatically selected and cannot be deselected during installation. It provides essential agents and workflows for Beads integration.
- **Always provisioned** — `npm install @beads/bd` runs automatically during every BMAD installation (not conditional on module selection)
- **Source of truth shifted** — Task status lives in Beads, not markdown checkboxes
- **Agents updated** — SM, Dev, and Quick Flow agents use Beads for work discovery
- **New conventions** — See `_bmad/bmm/data/beads-conventions.md` after installation
- **Workflow guards** — Core implementation workflows (dev-story, create-story, code-review) include preflight checks and will halt if Beads is unavailable

### Quick Start (This Fork)

```bash
# Install this fork with Beads integration
npx bmad-method@alpha install

# Beads CLI is provisioned automatically to _bmad/bin/bd
# Verify it works:
_bmad/bin/bd version

# Find your next ready work item:
_bmad/bin/bd ready
```

### Learn More

- **[Beads GitHub](https://github.com/steveyegge/beads)** — Full documentation for the `bd` CLI
- **[Integration Details](./docs/beads-integration/20251219-beads-integration-results.md)** — Complete technical documentation
- **[Beads Conventions](./src/modules/bmm/data/beads-conventions.md)** — Labels, hierarchy, and workflow rules

---

<div align="center">

## 🎉 NEW: BMAD V6 Installer - Create & Share Custom Content!

The completely revamped **BMAD V6 installer** now includes built-in support for creating, installing, and sharing custom modules, agents, workflows, templates, and tools! Build your own AI solutions or share them with your team - and real soon, with the whole BMad Community througha verified community sharing portal!

**✨ What's New:**

- 📦 **Streamlined Custom Module Installation** - Package your custom content as installable modules
- 🤖 **Agent & Workflow Sharing** - Distribute standalone agents and workflows
- 🔄 **Unitary Module Support** - Install individual components without full modules
- ⚙️ **Dependency Management** - Automatic handling of module dependencies
- 🛡️ **Update-Safe Customization** - Your custom content persists through updates

**📚 Learn More:**

- [**Custom Content Overview**](./docs/custom-content.md) - Discover all supported content types
- [**Installation Guide**](./docs/custom-content-installation.md) - Learn to create and install custom content
- [**Detail Content Docs**](./src/modules/bmb/docs/README.md) - Reference details for agents, modules, workflows and the bmad builder
- [**2 Very simple Custom Modules of questionable quality**](./docs/sample-custom-modules/README.md) - if you want to download and try to install a custom shared module, get an idea of how to bundle and share your own, or create your own personal agents, workflows and modules.

</div>

---

## AI-Driven Agile Development That Scales From Bug Fixes to Enterprise

**Build More, Architect Dreams** (BMAD) with **21 specialized AI agents** across 4 official modules, and **50+ guided workflows** that adapt to your project's complexity—from quick bug fixes to enterprise platforms, and new step file workflows that allow for incredibly long workflows to stay on the rails longer than ever before!

Additionally - when we say 'Build More, Architect Dreams' - we mean it! The BMad Builder has landed, and now as of Alpha.15 is fully supported in the installation flow via NPX - custom stand along agents, workflows and the modules of your dreams! The community forge will soon open, endless possibility awaits!

> **🚀 v6 is a MASSIVE upgrade from v4!** Complete architectural overhaul, scale-adaptive intelligence, visual workflows, and the powerful BMad Core framework. v4 users: this changes everything. [See what's new →](#whats-new-in-v6)

> **📌 v6 Alpha Status:** Near-beta quality with vastly improved stability. Documentation is being finalized. New videos coming soon to [BMadCode YouTube](https://www.youtube.com/@BMadCode).

## 🎯 Why BMad Method?

Unlike generic AI coding assistants, BMad Method provides **structured, battle-tested workflows** powered by specialized agents who understand agile development. Each agent has deep domain expertise—from product management to architecture to testing—working together seamlessly.

**✨ Key Benefits:**

- **Scale-Adaptive Intelligence** - Automatically adjusts planning depth from bug fixes to enterprise systems
- **Complete Development Lifecycle** - Analysis → Planning → Architecture → Implementation
- **Specialized Expertise** - 19 agents with specific roles (PM, Architect, Developer, UX Designer, etc.)
- **Proven Methodologies** - Built on agile best practices with AI amplification
- **IDE Integration** - Works with Claude Code, Cursor, Windsurf, VS Code

## 🏗️ The Power of BMad Core

**BMad Method** is actually a sophisticated module built on top of **BMad Core** (**C**ollaboration **O**ptimized **R**eflection **E**ngine). This revolutionary architecture means:

- **BMad Core** provides the universal framework for human-AI collaboration
- **BMad Method** leverages Core to deliver agile development workflows
- **BMad Builder** lets YOU create custom modules as powerful as BMad Method itself

With **BMad Builder**, you can architect both simple agents and vastly complex domain-specific modules (legal, medical, finance, education, creative) that will soon be sharable in an **official community marketplace**. Imagine building and sharing your own specialized AI team!

## 📊 See It In Action

<p align="center">
  <img src="./src/modules/bmm/docs/images/workflow-method-greenfield.svg" alt="BMad Method Workflow" width="100%">
</p>

<p align="center">
  <em>Complete BMad Method workflow showing all phases, agents, and decision points</em>
</p>

## 🚀 Get Started in 3 Steps

### 1. Install BMad Method

```bash
# Install v6 Alpha (recommended)
npx bmad-method@alpha install

# Or stable v4 for production
npx bmad-method install
```

### 2. Initialize Your Project

Load any agent in your IDE and run:

```
*workflow-init
```

This analyzes your project and recommends the right workflow track.

### 3. Choose Your Track

BMad Method adapts to your needs with three intelligent tracks:

| Track              | Use For                   | Planning                | Time to Start |
| ------------------ | ------------------------- | ----------------------- | ------------- |
| **⚡ Quick Flow**  | Bug fixes, small features | Tech spec only          | < 5 minutes   |
| **📋 BMad Method** | Products, platforms       | PRD + Architecture + UX | < 15 minutes  |
| **🏢 Enterprise**  | Compliance, scale         | Full governance suite   | < 30 minutes  |

> **Not sure?** Run `*workflow-init` and let BMad analyze your project goal.

## 🔄 How It Works: 4-Phase Methodology

BMad Method guides you through a proven development lifecycle:

1. **📊 Analysis** (Optional) - Brainstorm, research, and explore solutions
2. **📝 Planning** - Create PRDs, tech specs, or game design documents
3. **🏗️ Solutioning** - Design architecture, UX, and technical approach
4. **⚡ Implementation** - Story-driven development with continuous validation

Each phase has specialized workflows and agents working together to deliver exceptional results.

## 🤖 Meet Your Team

**12 Specialized Agents** working in concert:

| Development | Architecture   | Product       | Leadership     |
| ----------- | -------------- | ------------- | -------------- |
| Developer   | Architect      | PM            | Scrum Master   |
| UX Designer | Test Architect | Analyst       | BMad Master    |
| Tech Writer | Game Architect | Game Designer | Game Developer |

**Test Architect** integrates with `@seontechnologies/playwright-utils` for production-ready fixture-based utilities.

Each agent brings deep expertise and can be customized to match your team's style.

## 📦 What's Included

### Core Modules

- **BMad Method (BMM)** - Complete agile development framework
  - 12 specialized agents
  - 34 workflows across 4 phases
  - Scale-adaptive planning
  - [→ Documentation Hub](./src/modules/bmm/docs/README.md)

- **BMad Builder (BMB)** - Create custom agents and workflows
  - Build anything from simple agents to complex modules
  - Create domain-specific solutions (legal, medical, finance, education)
  - [→ Builder Guide](src/modules/bmb/docs/README.md) marketplace
  - [→ Builder Guide](./src/modules/bmb/README.md)

- **Creative Intelligence Suite (CIS)** - Innovation & problem-solving
  - Brainstorming, design thinking, storytelling
  - 5 creative facilitation workflows
  - [→ Creative Workflows](./src/modules/cis/README.md)

### Key Features

- **🎨 Customizable Agents** - Modify personalities, expertise, and communication styles
- **🌐 Multi-Language Support** - Separate settings for communication and code output
- **📄 Document Sharding** - 90% token savings for large projects
- **🔄 Update-Safe** - Your customizations persist through updates
- **🚀 Web Bundles** - Use in ChatGPT, Claude Projects, or Gemini Gems

## 📚 Documentation

### Quick Links

- **[Quick Start Guide](./src/modules/bmm/docs/quick-start.md)** - 15-minute introduction
- **[Complete BMM Documentation](./src/modules/bmm/docs/README.md)** - All guides and references
- **[Agent Customization](./docs/agent-customization-guide.md)** - Personalize your agents
- **[All Documentation](./docs/index.md)** - Complete documentation index

### For v4 Users

- **[v4 Documentation](https://github.com/bmad-code-org/BMAD-METHOD/tree/V4)**
- **[v4 to v6 Upgrade Guide](./docs/v4-to-v6-upgrade.md)**

## 💬 Community & Support

- **[Discord Community](https://discord.gg/gk8jAdXWmj)** - Get help, share projects
- **[GitHub Issues](https://github.com/bmad-code-org/BMAD-METHOD/issues)** - Report bugs, request features
- **[YouTube Channel](https://www.youtube.com/@BMadCode)** - Video tutorials and demos
- **[Web Bundles](https://bmad-code-org.github.io/bmad-bundles/)** - Pre-built agent bundles
- **[Code of Conduct](.github/CODE_OF_CONDUCT.md)** - Community guidelines

## 🛠️ Development

For contributors working on the BMad codebase:

```bash
# Run all quality checks
npm test

# Development commands
npm run lint:fix      # Fix code style
npm run format:fix    # Auto-format code
npm run bundle        # Build web bundles
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full development guidelines.

## What's New in v6

**v6 represents a complete architectural revolution from v4:**

### 🚀 Major Upgrades

- **BMad Core Framework** - Modular architecture enabling custom domain solutions
- **Scale-Adaptive Intelligence** - Automatic adjustment from bug fixes to enterprise
- **Visual Workflows** - Beautiful SVG diagrams showing complete methodology
- **BMad Builder Module** - Create and share your own AI agent teams
- **50+ Workflows** - Up from 20 in v4, covering every development scenario
- **19 Specialized Agents** - Enhanced with customizable personalities and expertise
- **Update-Safe Customization** - Your configs persist through all updates
- **Web Bundles** - Use agents in ChatGPT, Claude, and Gemini
- **Multi-Language Support** - Separate settings for communication and code
- **Document Sharding** - 90% token savings for large projects

### 🔄 For v4 Users

- **[Comprehensive Upgrade Guide](./docs/v4-to-v6-upgrade.md)** - Step-by-step migration
- **[v4 Documentation Archive](https://github.com/bmad-code-org/BMAD-METHOD/tree/V4)** - Legacy reference
- Backwards compatibility where possible
- Smooth migration path with installer detection

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

**Trademarks:** BMad™ and BMAD-METHOD™ are trademarks of BMad Code, LLC.

Supported by:&nbsp;&nbsp;<a href="https://m.do.co/c/00f11bd932bb"><img src="https://opensource.nyc3.cdn.digitaloceanspaces.com/attribution/assets/SVG/DO_Logo_horizontal_blue.svg" height="24" alt="DigitalOcean" style="vertical-align: middle;"></a>

---

<p align="center">
  <a href="https://github.com/bmad-code-org/BMAD-METHOD/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=bmad-code-org/BMAD-METHOD" alt="Contributors">
  </a>
</p>

<p align="center">
  <sub>Built with ❤️ for the human-AI collaboration community</sub>
</p>
