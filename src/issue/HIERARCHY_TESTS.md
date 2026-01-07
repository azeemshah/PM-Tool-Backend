/**
 * Jira Issue Hierarchy - Validation Test Cases
 * 
 * This file documents the validation rules and expected behaviors
 * Run these tests to verify the hierarchy implementation
 */

// ============ TEST CASES ============

// 1. EPIC CREATION
// ✓ Should allow: Create Epic with projectId
// ✗ Should reject: Create Epic with epicId
// ✗ Should reject: Create Epic with parentIssueId

const testCreateEpic = {
  valid: {
    type: 'epic',
    projectId: 'proj123',
    title: 'User Management',
    reporter: 'user456',
  },
  invalid_with_epicId: {
    type: 'epic',
    projectId: 'proj123',
    title: 'User Management',
    reporter: 'user456',
    epicId: 'epic789', // Should fail
  },
  invalid_with_parentIssueId: {
    type: 'epic',
    projectId: 'proj123',
    title: 'User Management',
    reporter: 'user456',
    parentIssueId: 'story789', // Should fail
  },
};

// 2. STORY CREATION
// ✓ Should allow: Create Story with epicId
// ✗ Should reject: Create Story without epicId
// ✗ Should reject: Create Story with parentIssueId
// ✗ Should reject: Create Story if epicId doesn't reference an Epic

const testCreateStory = {
  valid: {
    type: 'story',
    projectId: 'proj123',
    epicId: 'epic123',
    title: 'User Registration',
    reporter: 'user456',
  },
  invalid_no_epicId: {
    type: 'story',
    projectId: 'proj123',
    title: 'User Registration',
    reporter: 'user456',
    // Missing epicId - should fail
  },
  invalid_with_parentIssueId: {
    type: 'story',
    projectId: 'proj123',
    epicId: 'epic123',
    title: 'User Registration',
    reporter: 'user456',
    parentIssueId: 'task789', // Should fail
  },
};

// 3. TASK CREATION
// ✓ Should allow: Create Task with epicId
// ✗ Should reject: Create Task without epicId
// ✗ Should reject: Create Task with parentIssueId
// ✗ Should reject: Create Task if epicId doesn't reference an Epic
// ✗ Should reject: Create Task under Story

const testCreateTask = {
  valid: {
    type: 'task',
    projectId: 'proj123',
    epicId: 'epic123',
    title: 'Setup OAuth2',
    reporter: 'user456',
  },
  invalid_no_epicId: {
    type: 'task',
    projectId: 'proj123',
    title: 'Setup OAuth2',
    reporter: 'user456',
    // Missing epicId - should fail
  },
  invalid_with_parentIssueId: {
    type: 'task',
    projectId: 'proj123',
    epicId: 'epic123',
    title: 'Setup OAuth2',
    reporter: 'user456',
    parentIssueId: 'story789', // Should fail - task under story not allowed
  },
};

// 4. BUG CREATION
// ✓ Should allow: Create Bug with epicId
// ✗ Should reject: Create Bug without epicId
// ✗ Should reject: Create Bug with parentIssueId
// ✗ Should reject: Create Bug if epicId doesn't reference an Epic
// ✗ Should reject: Bug under Task or Subtask

const testCreateBug = {
  valid: {
    type: 'bug',
    projectId: 'proj123',
    epicId: 'epic123',
    title: 'XSS vulnerability',
    priority: 'highest',
    reporter: 'user456',
  },
  invalid_no_epicId: {
    type: 'bug',
    projectId: 'proj123',
    title: 'XSS vulnerability',
    reporter: 'user456',
    // Missing epicId - should fail
  },
  invalid_with_parentIssueId: {
    type: 'bug',
    projectId: 'proj123',
    epicId: 'epic123',
    title: 'XSS vulnerability',
    reporter: 'user456',
    parentIssueId: 'task789', // Should fail
  },
};

// 5. SUBTASK CREATION
// ✓ Should allow: Create Subtask with parentIssueId (pointing to Story/Task/Bug)
// ✗ Should reject: Create Subtask without parentIssueId
// ✗ Should reject: Create Subtask with epicId
// ✗ Should reject: Create Subtask if parentIssueId doesn't point to Story/Task/Bug
// ✗ Should reject: Create Subtask under Epic or Subtask

const testCreateSubtask = {
  valid_under_story: {
    type: 'subtask',
    projectId: 'proj123',
    parentIssueId: 'story123', // Valid: Story
    title: 'Create signup form',
    reporter: 'user456',
  },
  valid_under_task: {
    type: 'subtask',
    projectId: 'proj123',
    parentIssueId: 'task123', // Valid: Task
    title: 'Configure OAuth provider',
    reporter: 'user456',
  },
  valid_under_bug: {
    type: 'subtask',
    projectId: 'proj123',
    parentIssueId: 'bug123', // Valid: Bug
    title: 'Add error handler',
    reporter: 'user456',
  },
  invalid_no_parentIssueId: {
    type: 'subtask',
    projectId: 'proj123',
    title: 'Create signup form',
    reporter: 'user456',
    // Missing parentIssueId - should fail
  },
  invalid_with_epicId: {
    type: 'subtask',
    projectId: 'proj123',
    parentIssueId: 'story123',
    epicId: 'epic123', // Should fail - subtask doesn't use epicId
    title: 'Create signup form',
    reporter: 'user456',
  },
  invalid_under_epic: {
    type: 'subtask',
    projectId: 'proj123',
    parentIssueId: 'epic123', // Invalid: Epic is not allowed as parent
    title: 'Create signup form',
    reporter: 'user456',
  },
  invalid_under_subtask: {
    type: 'subtask',
    projectId: 'proj123',
    parentIssueId: 'subtask123', // Invalid: Cannot nest subtasks
    title: 'Nested subtask',
    reporter: 'user456',
  },
};

// 6. HIERARCHY QUERIES
// ✓ getEpicsByProject(projectId) - Returns only type='epic'
// ✓ getChildrenByEpic(epicId) - Returns type in ['story','task','bug']
// ✓ getSubtasks(parentIssueId) - Returns only type='subtask'
// ✓ Cascading delete: Delete Epic → delete children and subtasks
// ✓ Cascading delete: Delete Story/Task/Bug → delete subtasks

const testQueries = {
  epicQuery: {
    endpoint: 'GET /issues/epic/:projectId',
    returns: 'All issues with type=epic',
    example: [
      { _id: 'epic1', type: 'epic', title: 'User Mgmt' },
      { _id: 'epic2', type: 'epic', title: 'Payments' },
    ],
  },
  childrenQuery: {
    endpoint: 'GET /issues/epic/:epicId/children',
    returns: 'All Story/Task/Bug with epicId=:epicId',
    example: [
      { _id: 'story1', type: 'story', epicId: 'epic1' },
      { _id: 'task1', type: 'task', epicId: 'epic1' },
      { _id: 'bug1', type: 'bug', epicId: 'epic1' },
    ],
  },
  subtasksQuery: {
    endpoint: 'GET /issues/:parentId/subtasks',
    returns: 'All Subtasks with parentIssueId=:parentId',
    example: [
      { _id: 'st1', type: 'subtask', parentIssueId: 'story1' },
      { _id: 'st2', type: 'subtask', parentIssueId: 'story1' },
    ],
  },
};

// 7. TYPE CHANGE PREVENTION
// ✗ Should reject: Changing type after creation
const testTypeChangePrevention = {
  attempt: {
    originalType: 'story',
    attemptedChange: { type: 'task' },
    expectedError: 'Cannot change issue type. Create a new issue instead.',
  },
};

// ============ EXPECTED ERROR MESSAGES ============

const expectedErrors = {
  epic_with_parent: 'Epic cannot have a parent. Remove epicId and parentIssueId.',
  story_no_epic: 'story must have an epicId. Cannot have parentIssueId.',
  story_with_parent: 'story must link to Epic via epicId, not have a parentIssueId.',
  task_no_epic: 'task must have an epicId. Cannot have parentIssueId.',
  task_with_parent: 'task must link to Epic via epicId, not have a parentIssueId.',
  bug_no_epic: 'bug must have an epicId. Cannot have parentIssueId.',
  bug_with_parent: 'bug must link to Epic via epicId, not have a parentIssueId.',
  subtask_no_parent: 'Subtask must have a parentIssueId pointing to Story, Task, or Bug.',
  subtask_with_epic: 'Subtask should not have epicId. Use parentIssueId instead.',
  invalid_epic_reference: 'Referenced issue is not an Epic',
  invalid_parent_reference: 'Parent issue must be of type story, task, or bug. Found: ...',
  type_change_not_allowed: 'Cannot change issue type. Create a new issue with the desired type instead.',
};

export {
  testCreateEpic,
  testCreateStory,
  testCreateTask,
  testCreateBug,
  testCreateSubtask,
  testQueries,
  testTypeChangePrevention,
  expectedErrors,
};
