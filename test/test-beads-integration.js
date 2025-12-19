/**
 * @fileoverview Tests for BMAD-Beads integration
 *
 * These tests use mock bd responses to verify integration behavior
 * without requiring network access or the actual bd binary.
 */

const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

// Load mock responses
const mockResponses = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/beads-integration/mock-bd-responses.json'), 'utf8'));

describe('BMAD-Beads Integration', () => {
  describe('Mock Responses Structure', () => {
    it('should have version response', () => {
      assert.ok(mockResponses.version);
      assert.strictEqual(mockResponses.version.exitCode, 0);
      assert.ok(mockResponses.version.output.includes('bd version'));
    });

    it('should have list_epics response', () => {
      assert.ok(Array.isArray(mockResponses.list_epics.output));
      assert.strictEqual(mockResponses.list_epics.output.length, 2);

      const epic = mockResponses.list_epics.output[0];
      assert.strictEqual(epic.type, 'epic');
      assert.ok(epic.labels.some((l) => l.startsWith('bmad:stage:')));
    });

    it('should have list_stories response with proper labels', () => {
      assert.ok(Array.isArray(mockResponses.list_stories.output));

      for (const story of mockResponses.list_stories.output) {
        assert.ok(story.labels.includes('bmad:story'));
        assert.ok(story.labels.some((l) => l.startsWith('bmad:stage:')));
        assert.ok(story.parent_id); // Stories should have parent epic
      }
    });

    it('should have ready_stories response', () => {
      const readyStories = mockResponses.ready_stories.output;
      assert.ok(Array.isArray(readyStories));

      for (const story of readyStories) {
        assert.ok(story.labels.includes('bmad:stage:ready-for-dev'));
      }
    });

    it('should have story_tasks response with hierarchy', () => {
      const tasks = mockResponses.story_tasks.output;
      assert.ok(Array.isArray(tasks));

      for (const task of tasks) {
        assert.ok(task.labels.includes('bmad:task'));
        assert.strictEqual(task.parent_id, 'proj-a3f8.2'); // All belong to same story
      }
    });

    it('should have ready_tasks response respecting blockers', () => {
      const readyTasks = mockResponses.ready_tasks.output;
      assert.ok(Array.isArray(readyTasks));
      // Only first task should be ready (others blocked)
      assert.strictEqual(readyTasks.length, 1);
      assert.strictEqual(readyTasks[0].id, 'proj-a3f8.2.1');
    });

    it('should have dep_list_blocks response for review blockers', () => {
      // Story without blockers
      assert.ok(Array.isArray(mockResponses.dep_list_blocks.output));
      assert.strictEqual(mockResponses.dep_list_blocks.output.length, 0);

      // Story with blockers (review findings)
      const blockers = mockResponses.dep_list_blocks_with_findings.output;
      assert.ok(Array.isArray(blockers));
      assert.strictEqual(blockers.length, 1);
      assert.ok(blockers[0].labels.includes('bmad:review-finding'));
      assert.ok(blockers[0].labels.includes('bmad:severity:high'));
    });
  });

  describe('Label Conventions', () => {
    it('should use bmad:stage: prefix for workflow stages', () => {
      const validStages = new Set(['backlog', 'ready-for-dev', 'in-progress', 'review', 'done']);

      for (const story of mockResponses.list_stories.output) {
        const stageLabel = story.labels.find((l) => l.startsWith('bmad:stage:'));
        assert.ok(stageLabel, `Story ${story.id} should have a stage label`);

        const stage = stageLabel.replace('bmad:stage:', '');
        assert.ok(validStages.has(stage), `Stage "${stage}" should be valid`);
      }
    });

    it('should use bmad:story label for stories', () => {
      for (const story of mockResponses.list_stories.output) {
        assert.ok(story.labels.includes('bmad:story'));
      }
    });

    it('should use bmad:task label for tasks', () => {
      for (const task of mockResponses.story_tasks.output) {
        assert.ok(task.labels.includes('bmad:task'));
      }
    });

    it('should use bmad:review-finding for code review findings', () => {
      const findings = mockResponses.dep_list_blocks_with_findings.output;
      for (const finding of findings) {
        assert.ok(finding.labels.includes('bmad:review-finding'));
      }
    });

    it('should use bmad:severity: prefix for severity levels', () => {
      const validSeverities = new Set(['high', 'medium', 'low']);

      const findings = mockResponses.dep_list_blocks_with_findings.output;
      for (const finding of findings) {
        const severityLabel = finding.labels.find((l) => l.startsWith('bmad:severity:'));
        assert.ok(severityLabel, 'Review finding should have severity label');

        const severity = severityLabel.replace('bmad:severity:', '');
        assert.ok(validSeverities.has(severity), `Severity "${severity}" should be valid`);
      }
    });
  });

  describe('Hierarchical Issue IDs', () => {
    it('should have epic IDs without dots', () => {
      for (const epic of mockResponses.list_epics.output) {
        assert.ok(!epic.id.includes('.'), `Epic ID ${epic.id} should not contain dots`);
      }
    });

    it('should have story IDs with one dot (epic.story)', () => {
      for (const story of mockResponses.list_stories.output) {
        const parts = story.id.split('.');
        assert.strictEqual(parts.length, 2, `Story ID ${story.id} should have format epic.story`);
      }
    });

    it('should have task IDs with two dots (epic.story.task)', () => {
      for (const task of mockResponses.story_tasks.output) {
        const parts = task.id.split('.');
        assert.strictEqual(parts.length, 3, `Task ID ${task.id} should have format epic.story.task`);
      }
    });

    it('should have parent_id linking to parent issue', () => {
      // Stories link to epics
      for (const story of mockResponses.list_stories.output) {
        const epicId = story.id.split('.')[0] + '-' + story.id.split('-')[1].split('.')[0];
        // Parent should be the epic portion
        assert.ok(story.parent_id.startsWith('proj-'), `Story parent should be an epic ID`);
      }

      // Tasks link to stories
      for (const task of mockResponses.story_tasks.output) {
        assert.ok(task.parent_id.includes('.'), `Task parent should be a story ID`);
      }
    });
  });

  describe('Command Structure', () => {
    it('should have create_issue with proper flags', () => {
      const cmd = mockResponses.create_issue.command;
      assert.ok(cmd.includes('--parent'));
      assert.ok(cmd.includes('--type'));
      assert.ok(cmd.includes('--label'));
    });

    it('should have add_blocker with --type blocks', () => {
      const cmd = mockResponses.add_blocker.command;
      assert.ok(cmd.includes('bd dep add'));
      assert.ok(cmd.includes('--type blocks'));
    });

    it('should have label commands', () => {
      assert.ok(mockResponses.label_add.command.includes('bd label add'));
      assert.ok(mockResponses.label_remove.command.includes('bd label remove'));
    });
  });
});

// Note: These tests are designed to be run with mocha or another test runner.
// Example: npx mocha test/test-beads-integration.js
// The tests validate mock response structures without requiring the actual bd binary.
