/**
 * @fileoverview BMAD to Beads Migration Tool
 *
 * Migrates existing BMAD projects to use Beads for task tracking.
 * Converts epics, stories, and tasks/subtasks from markdown files
 * into Beads issues with proper hierarchy and blocking dependencies.
 *
 * Usage:
 *   node tools/beads/migrate-bmad-to-beads.js [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run   Show what would be created without actually creating issues
 *   --verbose   Show detailed output
 */

const path = require('node:path');
const fs = require('fs-extra');
const { execSync } = require('node:child_process');

class BeadsMigrator {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.bdPath = '_bmad/bin/bd';
    this.createdIssues = [];
    this.errors = [];
  }

  log(message, level = 'info') {
    if (level === 'verbose' && !this.verbose) return;
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      verbose: '🔍',
    };
    console.log(`${prefix[level] || ''} ${message}`);
  }

  /**
   * Execute bd command
   */
  execBd(args, options = {}) {
    const cmd = `"${this.bdPath}" ${args}`;
    if (this.dryRun && !options.readOnly) {
      this.log(`[DRY RUN] Would execute: ${cmd}`, 'verbose');
      return JSON.stringify({ id: `dry-run-${Date.now()}` });
    }

    try {
      return execSync(cmd, { encoding: 'utf8', timeout: 30_000 });
    } catch (error) {
      this.errors.push(`Failed to execute: ${cmd}\n${error.message}`);
      throw error;
    }
  }

  /**
   * Verify bd is available
   */
  verifyBeads() {
    try {
      const version = this.execBd('version', { readOnly: true });
      this.log(`Beads CLI version: ${version.trim()}`, 'verbose');
      return true;
    } catch {
      this.log('Beads CLI not available. Run BMAD installer first.', 'error');
      return false;
    }
  }

  /**
   * Parse epic file(s) to extract epics and stories
   */
  async parseEpics(epicsPath) {
    const epics = [];

    // Check for single file or sharded
    if (await fs.pathExists(epicsPath)) {
      const stat = await fs.stat(epicsPath);
      if (stat.isFile()) {
        return this.parseEpicFile(epicsPath);
      } else if (stat.isDirectory()) {
        // Sharded epics
        const files = await fs.readdir(epicsPath);
        for (const file of files.sort()) {
          if (file.endsWith('.md') && file !== 'index.md') {
            const fileEpics = await this.parseEpicFile(path.join(epicsPath, file));
            epics.push(...fileEpics);
          }
        }
      }
    }

    return epics;
  }

  /**
   * Parse a single epic markdown file
   */
  async parseEpicFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const epics = [];
    let currentEpic = null;
    let currentStory = null;

    const lines = content.split('\n');

    for (const line of lines) {
      // Epic header: ## Epic 1: Title
      const epicMatch = line.match(/^##\s+Epic\s+(\d+):\s*(.+)/i);
      if (epicMatch) {
        if (currentEpic) {
          if (currentStory) currentEpic.stories.push(currentStory);
          epics.push(currentEpic);
        }
        currentEpic = {
          number: parseInt(epicMatch[1], 10),
          title: epicMatch[2].trim(),
          stories: [],
          beadsId: null,
        };
        currentStory = null;
        continue;
      }

      // Story header: ### Story 1.1: Title or ### Story 1.1: Title [beads-id]
      const storyMatch = line.match(/^###\s+Story\s+(\d+)\.(\d+):\s*(.+?)(?:\s*\[([^\]]+)\])?$/i);
      if (storyMatch && currentEpic) {
        if (currentStory) {
          currentEpic.stories.push(currentStory);
        }
        currentStory = {
          epicNumber: parseInt(storyMatch[1], 10),
          storyNumber: parseInt(storyMatch[2], 10),
          title: storyMatch[3].trim(),
          existingBeadsId: storyMatch[4] || null,
          beadsId: null,
        };
        continue;
      }
    }

    // Don't forget the last items
    if (currentStory && currentEpic) {
      currentEpic.stories.push(currentStory);
    }
    if (currentEpic) {
      epics.push(currentEpic);
    }

    return epics;
  }

  /**
   * Parse story file to extract tasks/subtasks
   */
  async parseStoryFile(storyPath) {
    if (!(await fs.pathExists(storyPath))) {
      return null;
    }

    const content = await fs.readFile(storyPath, 'utf8');
    const tasks = [];
    let currentTask = null;
    let inTasksSection = false;

    const lines = content.split('\n');

    for (const line of lines) {
      // Check for Tasks/Subtasks section
      if (/^##\s*Tasks\s*\/?\s*Subtasks/i.test(line)) {
        inTasksSection = true;
        continue;
      }

      // Check for next section (exit tasks section)
      if (inTasksSection && /^##\s+/.test(line)) {
        inTasksSection = false;
        continue;
      }

      if (!inTasksSection) continue;

      // Task: - [ ] Task description or - [x] Task description
      const taskMatch = line.match(/^-\s*\[([ x])\]\s*(.+?)(?:\s*`([^`]+)`)?$/);
      if (taskMatch) {
        if (currentTask) {
          tasks.push(currentTask);
        }
        currentTask = {
          title: taskMatch[2].trim(),
          completed: taskMatch[1] === 'x',
          existingBeadsId: taskMatch[3] || null,
          subtasks: [],
          beadsId: null,
        };
        continue;
      }

      // Subtask: indented - [ ] or - [x]
      const subtaskMatch = line.match(/^\s+-\s*\[([ x])\]\s*(.+?)(?:\s*`([^`]+)`)?$/);
      if (subtaskMatch && currentTask) {
        currentTask.subtasks.push({
          title: subtaskMatch[2].trim(),
          completed: subtaskMatch[1] === 'x',
          existingBeadsId: subtaskMatch[3] || null,
          beadsId: null,
        });
      }
    }

    if (currentTask) {
      tasks.push(currentTask);
    }

    return tasks;
  }

  /**
   * Create Beads issue and return the ID
   */
  createBeadsIssue(title, options = {}) {
    const args = [`create "${title.replaceAll('"', String.raw`\"`)}"`];

    if (options.type) args.push(`--type ${options.type}`);
    if (options.parent) args.push(`--parent ${options.parent}`);
    if (options.labels) {
      for (const label of options.labels) {
        args.push(`--label "${label}"`);
      }
    }

    const output = this.execBd(args.join(' '));

    // Parse the created issue ID from output
    // Beads typically outputs the issue ID
    const match = output.match(/([a-z]+-[a-z0-9]+(?:\.\d+)*)/i);
    const id = match ? match[1] : `created-${Date.now()}`;

    this.createdIssues.push({ id, title, type: options.type || 'task' });
    return id;
  }

  /**
   * Add blocking dependency
   */
  addBlocker(blockedId, blockerId) {
    this.execBd(`dep add ${blockedId} ${blockerId} --type blocks`);
    this.log(`Added blocker: ${blockerId} blocks ${blockedId}`, 'verbose');
  }

  /**
   * Run the migration
   */
  async migrate(projectPath = '.') {
    this.log(`Starting BMAD to Beads migration${this.dryRun ? ' (DRY RUN)' : ''}...`);

    // Verify Beads
    if (!this.verifyBeads()) {
      return { success: false, error: 'Beads CLI not available' };
    }

    // Find BMAD config
    const bmadDir = path.join(projectPath, '_bmad');
    if (!(await fs.pathExists(bmadDir))) {
      this.log('No _bmad directory found. Is this a BMAD project?', 'error');
      return { success: false, error: 'Not a BMAD project' };
    }

    // Load config to find paths
    const configPath = path.join(bmadDir, 'bmm', 'config.yaml');
    let config = {};
    if (await fs.pathExists(configPath)) {
      const yaml = require('js-yaml');
      config = yaml.load(await fs.readFile(configPath, 'utf8'));
    }

    // Find epics
    const planningArtifacts = config.planning_artifacts || 'docs/project-planning-artifacts';
    const epicsPath = path.join(projectPath, planningArtifacts, 'epics.md');
    const epicsDir = path.join(projectPath, planningArtifacts, 'epics');

    let epicSource = epicsPath;
    if (!(await fs.pathExists(epicsPath)) && (await fs.pathExists(epicsDir))) {
      epicSource = epicsDir;
    }

    this.log(`Looking for epics at: ${epicSource}`, 'verbose');

    const epics = await this.parseEpics(epicSource);
    this.log(`Found ${epics.length} epics`);

    // Find story files
    const implArtifacts = config.implementation_artifacts || 'docs/implementation-artifacts';
    const storyDir = path.join(projectPath, implArtifacts, 'stories');

    // Create Beads issues
    let previousEpicId = null;

    for (const epic of epics) {
      this.log(`Processing Epic ${epic.number}: ${epic.title}`);

      // Create epic issue
      const epicId = this.createBeadsIssue(`Epic: ${epic.title}`, {
        type: 'epic',
        labels: ['bmad:stage:backlog'],
      });
      epic.beadsId = epicId;

      // Add sequential blocker for epic ordering
      if (previousEpicId) {
        this.addBlocker(epicId, previousEpicId);
      }
      previousEpicId = epicId;

      // Process stories
      let previousStoryId = null;

      for (const story of epic.stories) {
        this.log(`  Processing Story ${story.epicNumber}.${story.storyNumber}: ${story.title}`, 'verbose');

        // Skip if already has Beads ID
        if (story.existingBeadsId) {
          this.log(`  Story already has Beads ID: ${story.existingBeadsId}`, 'verbose');
          story.beadsId = story.existingBeadsId;
          previousStoryId = story.beadsId;
          continue;
        }

        // Create story issue
        const storyId = this.createBeadsIssue(story.title, {
          type: 'task',
          parent: epicId,
          labels: ['bmad:story', 'bmad:stage:backlog'],
        });
        story.beadsId = storyId;

        // Add sequential blocker for story ordering
        if (previousStoryId) {
          this.addBlocker(storyId, previousStoryId);
        }
        previousStoryId = storyId;

        // Find and parse story file for tasks
        const storyKey = `${story.epicNumber}-${story.storyNumber}-${story.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`;
        const storyFilePath = path.join(storyDir, `${storyKey}.md`);

        const tasks = await this.parseStoryFile(storyFilePath);
        if (tasks && tasks.length > 0) {
          this.log(`    Found ${tasks.length} tasks`, 'verbose');

          let previousTaskId = null;

          for (const task of tasks) {
            if (task.existingBeadsId) {
              task.beadsId = task.existingBeadsId;
              previousTaskId = task.beadsId;
              continue;
            }

            const status = task.completed ? 'bmad:stage:done' : 'bmad:stage:backlog';
            const taskId = this.createBeadsIssue(task.title, {
              type: 'task',
              parent: storyId,
              labels: ['bmad:task', status],
            });
            task.beadsId = taskId;

            // Close if already completed
            if (task.completed && !this.dryRun) {
              this.execBd(`close ${taskId}`);
            }

            // Add sequential blocker
            if (previousTaskId) {
              this.addBlocker(taskId, previousTaskId);
            }
            previousTaskId = taskId;

            // Process subtasks
            let previousSubtaskId = null;

            for (const subtask of task.subtasks) {
              if (subtask.existingBeadsId) {
                subtask.beadsId = subtask.existingBeadsId;
                previousSubtaskId = subtask.beadsId;
                continue;
              }

              const subtaskStatus = subtask.completed ? 'bmad:stage:done' : 'bmad:stage:backlog';
              const subtaskId = this.createBeadsIssue(subtask.title, {
                type: 'task',
                parent: taskId,
                labels: ['bmad:subtask', subtaskStatus],
              });
              subtask.beadsId = subtaskId;

              if (subtask.completed && !this.dryRun) {
                this.execBd(`close ${subtaskId}`);
              }

              if (previousSubtaskId) {
                this.addBlocker(subtaskId, previousSubtaskId);
              }
              previousSubtaskId = subtaskId;
            }
          }
        }
      }
    }

    // Summary
    this.log(`\nMigration ${this.dryRun ? 'would create' : 'created'} ${this.createdIssues.length} Beads issues`);
    if (this.errors.length > 0) {
      this.log(`${this.errors.length} errors occurred`, 'warning');
      for (const error of this.errors) {
        this.log(error, 'error');
      }
    }

    return {
      success: this.errors.length === 0,
      created: this.createdIssues,
      errors: this.errors,
      epics,
    };
  }
}

// CLI entry point
async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const verbose = args.has('--verbose');

  const migrator = new BeadsMigrator({ dryRun, verbose });
  const result = await migrator.migrate();

  process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { BeadsMigrator };
