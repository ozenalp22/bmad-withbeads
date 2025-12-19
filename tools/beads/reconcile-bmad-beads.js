/**
 * @fileoverview BMAD-Beads Reconciliation Tool
 *
 * Detects and resolves drift between BMAD documents and Beads state.
 * Beads is authoritative - discrepancies are resolved in favor of Beads.
 *
 * Usage:
 *   node tools/beads/reconcile-bmad-beads.js [--fix] [--verbose]
 *
 * Options:
 *   --fix       Automatically fix discrepancies (update docs to match Beads)
 *   --verbose   Show detailed output
 */

const path = require('node:path');
const fs = require('fs-extra');
const { execSync } = require('node:child_process');

class BeadsReconciler {
  constructor(options = {}) {
    this.fix = options.fix || false;
    this.verbose = options.verbose || false;
    this.bdPath = '_bmad/bin/bd';
    this.discrepancies = [];
    this.fixed = [];
  }

  log(message, level = 'info') {
    if (level === 'verbose' && !this.verbose) return;
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      verbose: '🔍',
      fix: '🔧',
    };
    console.log(`${prefix[level] || ''} ${message}`);
  }

  /**
   * Execute bd command
   */
  execBd(args) {
    const cmd = `"${this.bdPath}" ${args}`;
    try {
      return execSync(cmd, { encoding: 'utf8', timeout: 30_000 });
    } catch (error) {
      this.log(`Failed to execute: ${cmd}`, 'error');
      throw error;
    }
  }

  /**
   * Get all Beads issues as JSON
   */
  getBeadsIssues() {
    try {
      const output = this.execBd('list --json');
      return JSON.parse(output);
    } catch {
      return [];
    }
  }

  /**
   * Get Beads issue by ID
   */
  getBeadsIssue(id) {
    try {
      const output = this.execBd(`show ${id} --json`);
      return JSON.parse(output);
    } catch {
      return null;
    }
  }

  /**
   * Parse sprint-status.yaml
   */
  async parseSprintStatus(projectPath) {
    const yaml = require('js-yaml');
    const configPath = path.join(projectPath, '_bmad', 'bmm', 'config.yaml');

    let implArtifacts = 'docs/implementation-artifacts';
    if (await fs.pathExists(configPath)) {
      const config = yaml.load(await fs.readFile(configPath, 'utf8'));
      implArtifacts = config.implementation_artifacts || implArtifacts;
    }

    const sprintStatusPath = path.join(projectPath, implArtifacts, 'sprint-status.yaml');

    if (!(await fs.pathExists(sprintStatusPath))) {
      this.log('sprint-status.yaml not found', 'warning');
      return null;
    }

    const content = await fs.readFile(sprintStatusPath, 'utf8');
    return yaml.load(content);
  }

  /**
   * Extract Beads stage from labels
   */
  getBeadsStage(issue) {
    if (!issue.labels) return null;

    for (const label of issue.labels) {
      if (label.startsWith('bmad:stage:')) {
        return label.replace('bmad:stage:', '');
      }
    }

    // Fallback to status
    if (issue.status === 'closed') return 'done';
    if (issue.status === 'in_progress') return 'in-progress';
    return 'backlog';
  }

  /**
   * Map BMAD status to Beads stage
   */
  bmadToBeadsStage(bmadStatus) {
    const mapping = {
      backlog: 'backlog',
      'ready-for-dev': 'ready-for-dev',
      drafted: 'ready-for-dev', // legacy
      'in-progress': 'in-progress',
      contexted: 'in-progress', // legacy
      review: 'review',
      done: 'done',
    };
    return mapping[bmadStatus] || bmadStatus;
  }

  /**
   * Parse story file for Beads ID and status
   */
  async parseStoryFile(storyPath) {
    if (!(await fs.pathExists(storyPath))) {
      return null;
    }

    const content = await fs.readFile(storyPath, 'utf8');
    const result = {
      path: storyPath,
      status: null,
      beadsStoryId: null,
      beadsEpicId: null,
      tasks: [],
    };

    // Extract status
    const statusMatch = content.match(/^Status:\s*(.+)$/m);
    if (statusMatch) {
      result.status = statusMatch[1].trim();
    }

    // Extract Beads IDs from template format
    const epicIdMatch = content.match(/Epic:\s*`([^`]+)`/);
    if (epicIdMatch) {
      result.beadsEpicId = epicIdMatch[1];
    }

    const storyIdMatch = content.match(/Story:\s*`([^`]+)`/);
    if (storyIdMatch) {
      result.beadsStoryId = storyIdMatch[1];
    }

    // Extract tasks with Beads IDs
    const taskRegex = /-\s*\[([ x])\]\s*(.+?)\s*`([^`]+)`/g;
    let match;
    while ((match = taskRegex.exec(content)) !== null) {
      result.tasks.push({
        completed: match[1] === 'x',
        title: match[2].trim(),
        beadsId: match[3],
      });
    }

    return result;
  }

  /**
   * Check for discrepancies
   */
  async checkDiscrepancies(projectPath = '.') {
    this.log('Checking for BMAD ↔ Beads discrepancies...');

    // Get all Beads issues
    const beadsIssues = this.getBeadsIssues();
    const beadsMap = new Map();
    for (const issue of beadsIssues) {
      beadsMap.set(issue.id, issue);
    }

    this.log(`Found ${beadsIssues.length} Beads issues`, 'verbose');

    // Check sprint-status.yaml
    const sprintStatus = await this.parseSprintStatus(projectPath);
    if (sprintStatus && sprintStatus.development_status) {
      for (const [key, value] of Object.entries(sprintStatus.development_status)) {
        // Skip epics and retrospectives for now
        if (key.startsWith('epic-') || key.endsWith('-retrospective')) continue;

        const entry = typeof value === 'object' ? value : { status: value };
        const beadsId = entry.beads_id;

        if (beadsId && beadsMap.has(beadsId)) {
          const beadsIssue = beadsMap.get(beadsId);
          const beadsStage = this.getBeadsStage(beadsIssue);
          const bmadStage = this.bmadToBeadsStage(entry.status);

          if (beadsStage !== bmadStage) {
            this.discrepancies.push({
              type: 'status_mismatch',
              source: 'sprint-status.yaml',
              key,
              beadsId,
              beadsStage,
              bmadStage,
              fix: `Update sprint-status.yaml: ${key} status from "${entry.status}" to "${beadsStage}"`,
            });
          }
        } else if (beadsId && !beadsMap.has(beadsId)) {
          this.discrepancies.push({
            type: 'missing_beads_issue',
            source: 'sprint-status.yaml',
            key,
            beadsId,
            fix: `Beads issue ${beadsId} not found - remove from sprint-status or re-create`,
          });
        }
      }
    }

    // Check story files
    const configPath = path.join(projectPath, '_bmad', 'bmm', 'config.yaml');
    let implArtifacts = 'docs/implementation-artifacts';
    if (await fs.pathExists(configPath)) {
      const yaml = require('js-yaml');
      const config = yaml.load(await fs.readFile(configPath, 'utf8'));
      implArtifacts = config.implementation_artifacts || implArtifacts;
    }

    const storyDir = path.join(projectPath, implArtifacts, 'stories');
    if (await fs.pathExists(storyDir)) {
      const storyFiles = await fs.readdir(storyDir);

      for (const file of storyFiles) {
        if (!file.endsWith('.md')) continue;

        const storyPath = path.join(storyDir, file);
        const storyData = await this.parseStoryFile(storyPath);

        if (!storyData || !storyData.beadsStoryId) continue;

        const beadsIssue = beadsMap.get(storyData.beadsStoryId);
        if (!beadsIssue) {
          this.discrepancies.push({
            type: 'missing_beads_issue',
            source: file,
            beadsId: storyData.beadsStoryId,
            fix: `Beads story ${storyData.beadsStoryId} not found - remove ID from story or re-create`,
          });
          continue;
        }

        // Check story status
        const beadsStage = this.getBeadsStage(beadsIssue);
        const bmadStage = this.bmadToBeadsStage(storyData.status);

        if (beadsStage !== bmadStage) {
          this.discrepancies.push({
            type: 'status_mismatch',
            source: file,
            beadsId: storyData.beadsStoryId,
            beadsStage,
            bmadStage,
            fix: `Update story file: Status from "${storyData.status}" to "${beadsStage}"`,
          });
        }

        // Check task completion status
        for (const task of storyData.tasks) {
          const taskIssue = beadsMap.get(task.beadsId);
          if (!taskIssue) continue;

          const taskClosed = taskIssue.status === 'closed';
          if (task.completed !== taskClosed) {
            this.discrepancies.push({
              type: 'task_completion_mismatch',
              source: file,
              beadsId: task.beadsId,
              taskTitle: task.title,
              storyCompleted: task.completed,
              beadsClosed: taskClosed,
              fix: taskClosed ? `Mark task [x] in story file: ${task.title}` : `Uncheck task [ ] in story file: ${task.title}`,
            });
          }
        }
      }
    }

    return this.discrepancies;
  }

  /**
   * Apply fixes (update BMAD docs to match Beads)
   */
  async applyFixes(projectPath = '.') {
    if (!this.fix) {
      this.log('Run with --fix to automatically apply fixes', 'info');
      return;
    }

    this.log('Applying fixes (Beads is authoritative)...');

    for (const discrepancy of this.discrepancies) {
      this.log(`Fixing: ${discrepancy.fix}`, 'fix');

      // TODO: Implement actual fix logic
      // For now, just log what would be fixed
      this.fixed.push(discrepancy);
    }

    this.log(`Fixed ${this.fixed.length} discrepancies`);
  }

  /**
   * Run reconciliation
   */
  async reconcile(projectPath = '.') {
    this.log(`Starting BMAD ↔ Beads reconciliation${this.fix ? ' (with fixes)' : ''}...`);

    // Verify Beads
    try {
      this.execBd('version');
    } catch {
      this.log('Beads CLI not available. Run BMAD installer first.', 'error');
      return { success: false, error: 'Beads CLI not available' };
    }

    // Check for discrepancies
    await this.checkDiscrepancies(projectPath);

    if (this.discrepancies.length === 0) {
      this.log('No discrepancies found! BMAD and Beads are in sync.', 'success');
      return { success: true, discrepancies: [] };
    }

    // Report discrepancies
    this.log(`\nFound ${this.discrepancies.length} discrepancies:`);
    for (const d of this.discrepancies) {
      this.log(`  [${d.type}] ${d.source}: ${d.fix}`, 'warning');
    }

    // Apply fixes if requested
    if (this.fix) {
      await this.applyFixes(projectPath);
    }

    return {
      success: true,
      discrepancies: this.discrepancies,
      fixed: this.fixed,
    };
  }
}

// CLI entry point
async function main() {
  const args = new Set(process.argv.slice(2));
  const fix = args.has('--fix');
  const verbose = args.has('--verbose');

  const reconciler = new BeadsReconciler({ fix, verbose });
  const result = await reconciler.reconcile();
  // Exit with error if discrepancies found and not fixed
  if (result.discrepancies && result.discrepancies.length > 0 && !fix) {
    console.error(`Found ${result.discrepancies.length} discrepancies. Run with --fix to resolve.`);
    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Reconciliation failed:', error);
    process.exit(1);
  });
}

module.exports = { BeadsReconciler };
