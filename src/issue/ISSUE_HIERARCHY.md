# Issue Hierarchy Documentation

## Overview

The Issue module implements a unified Jira-style issue hierarchy with proper parent-child relationships. This document describes the hierarchy rules, API endpoints, and usage patterns.

## Hierarchy Structure

```
Project
  └── Epic (type: 'epic')
        ├── Story (type: 'story', epicId set, no parentIssueId)
        ├── Task (type: 'task', epicId set, no parentIssueId)
        └── Bug (type: 'bug', epicId set, no parentIssueId)
              ├── Subtask (type: 'subtask', parentIssueId set, no epicId)
              ├── Subtask
              └── ...
```

## Issue Types

### 1. Epic
- **Type**: `'epic'`
- **Parent**: None (top-level)
- **Children**: Story, Task, Bug
- **Fields**:
  - `epicId`: Must be `null` or `undefined`
  - `parentIssueId`: Must be `null` or `undefined`
  - `projectId`: Required (links to Project)
  
**Validation Rules**:
- Cannot have `epicId` or `parentIssueId`
- Must belong to a project via `projectId`

### 2. Story
- **Type**: `'story'`
- **Parent**: Epic (via `epicId`)
- **Children**: Subtask
- **Fields**:
  - `epicId`: Required (must reference an Epic)
  - `parentIssueId`: Must be `null` or `undefined`
  - `projectId`: Required

**Validation Rules**:
- Must have a valid `epicId` pointing to an Epic
- Cannot have `parentIssueId`
- Cannot be a child of Task or Bug

### 3. Task
- **Type**: `'task'`
- **Parent**: Epic (via `epicId`)
- **Children**: Subtask
- **Fields**:
  - `epicId`: Required (must reference an Epic)
  - `parentIssueId`: Must be `null` or `undefined`
  - `projectId`: Required

**Validation Rules**:
- Must have a valid `epicId` pointing to an Epic
- Cannot have `parentIssueId`
- Cannot have Story as a child

### 4. Bug
- **Type**: `'bug'`
- **Parent**: Epic (via `epicId`)
- **Children**: Subtask
- **Fields**:
  - `epicId`: Required (must reference an Epic)
  - `parentIssueId`: Must be `null` or `undefined`
  - `projectId`: Required

**Validation Rules**:
- Must have a valid `epicId` pointing to an Epic
- Cannot have `parentIssueId`
- Cannot be a child of Task

### 5. Subtask
- **Type**: `'subtask'`
- **Parent**: Story, Task, or Bug (via `parentIssueId`)
- **Children**: None
- **Fields**:
  - `parentIssueId`: Required (must reference Story/Task/Bug)
  - `epicId`: Must be `null` or `undefined` (inherited from parent)
  - `projectId`: Required

**Validation Rules**:
- Must have a valid `parentIssueId` pointing to Story/Task/Bug
- Cannot have `epicId` set
- Cannot be nested further

## API Endpoints

### Create Epic
```http
POST /issues/epic
Content-Type: application/json

{
  "projectId": "507f1f77bcf86cd799439011",
  "title": "User Authentication System",
  "description": "Implement secure user auth",
  "priority": "high",
  "reporter": "507f1f77bcf86cd799439012"
}
```

**Response**: `201 Created`
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "type": "epic",
  "projectId": "507f1f77bcf86cd799439011",
  "title": "User Authentication System",
  "key": "PMT-1",
  "status": "todo",
  "priority": "high",
  "reporter": "507f1f77bcf86cd799439012",
  "createdAt": "2025-12-29T10:00:00.000Z"
}
```

### Create Story under Epic
```http
POST /issues/epic/507f1f77bcf86cd799439013/story
Content-Type: application/json

{
  "projectId": "507f1f77bcf86cd799439011",
  "title": "Login Page UI",
  "description": "Design and implement login page",
  "priority": "high",
  "reporter": "507f1f77bcf86cd799439012"
}
```

**Response**: `201 Created`
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "type": "story",
  "epicId": "507f1f77bcf86cd799439013",
  "projectId": "507f1f77bcf86cd799439011",
  "title": "Login Page UI",
  "key": "PMT-2",
  "status": "todo",
  "priority": "high",
  "reporter": "507f1f77bcf86cd799439012"
}
```

### Create Task under Epic
```http
POST /issues/epic/507f1f77bcf86cd799439013/task
Content-Type: application/json

{
  "projectId": "507f1f77bcf86cd799439011",
  "title": "Set up OAuth2",
  "priority": "high",
  "reporter": "507f1f77bcf86cd799439012"
}
```

### Create Bug under Epic
```http
POST /issues/epic/507f1f77bcf86cd799439013/bug
Content-Type: application/json

{
  "projectId": "507f1f77bcf86cd799439011",
  "title": "Password field XSS vulnerability",
  "priority": "highest",
  "reporter": "507f1f77bcf86cd799439012"
}
```

### Create Subtask under Story/Task/Bug
```http
POST /issues/507f1f77bcf86cd799439014/subtask
Content-Type: application/json

{
  "projectId": "507f1f77bcf86cd799439011",
  "title": "Create login form component",
  "priority": "high",
  "reporter": "507f1f77bcf86cd799439012"
}
```

**Response**: `201 Created`
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "type": "subtask",
  "parentIssueId": "507f1f77bcf86cd799439014",
  "projectId": "507f1f77bcf86cd799439011",
  "title": "Create login form component",
  "key": "PMT-3",
  "status": "todo",
  "priority": "high"
}
```

### Get All Issues in Project
```http
GET /issues/project/507f1f77bcf86cd799439011
```

### Get All Epics in Project
```http
GET /issues/epic/507f1f77bcf86cd799439011
```

### Get All Children (Story/Task/Bug) under Epic
```http
GET /issues/epic/507f1f77bcf86cd799439013/children
```

### Get All Subtasks under Parent
```http
GET /issues/507f1f77bcf86cd799439014/subtasks
```

### Get Single Issue
```http
GET /issues/507f1f77bcf86cd799439013
```

### Update Issue
```http
PATCH /issues/507f1f77bcf86cd799439013
Content-Type: application/json

{
  "title": "Updated title",
  "priority": "highest",
  "assignee": "507f1f77bcf86cd799439012"
}
```

**Note**: Cannot change `type` after creation. Parent relationships cannot be modified.

### Change Status
```http
PATCH /issues/507f1f77bcf86cd799439013/status
Content-Type: application/json

{
  "status": "in-progress"
}
```

**Valid Statuses**: `'todo'`, `'in-progress'`, `'done'`

### Assign Issue
```http
PATCH /issues/507f1f77bcf86cd799439013/assign
Content-Type: application/json

{
  "assignee": "507f1f77bcf86cd799439012"
}
```

### Delete Issue (Cascades to Children)
```http
DELETE /issues/507f1f77bcf86cd799439013
```

**Cascade Behavior**:
- Deleting an Epic also deletes all Story/Task/Bug and their Subtasks
- Deleting a Story/Task/Bug also deletes all Subtasks
- Deleting a Subtask only deletes that Subtask

## Validation Rules Summary

### Epic
```
✓ Must have projectId
✗ Must NOT have epicId
✗ Must NOT have parentIssueId
✓ Can have Story/Task/Bug as children
```

### Story/Task/Bug
```
✓ Must have projectId
✓ Must have epicId (pointing to Epic)
✗ Must NOT have parentIssueId
✓ Can have Subtask as children
✗ Cannot have Story as child
✗ Cannot be child of Story (only Epic)
```

### Subtask
```
✓ Must have projectId
✓ Must have parentIssueId (pointing to Story/Task/Bug)
✗ Must NOT have epicId
✗ Cannot have children
✓ Can only be child of Story/Task/Bug
```

## Common Validation Errors

### Error: "Epic cannot have a parent"
**Cause**: Trying to create Epic with `epicId` or `parentIssueId`
**Solution**: Remove both fields when creating Epic

### Error: "story must have an epicId"
**Cause**: Creating Story without `epicId`
**Solution**: Provide valid Epic ID via `epicId` field

### Error: "story must link to Epic via epicId, not have a parentIssueId"
**Cause**: Creating Story with `parentIssueId` instead of `epicId`
**Solution**: Use `epicId` field for Story/Task/Bug, not `parentIssueId`

### Error: "Subtask must have a parentIssueId pointing to Story, Task, or Bug"
**Cause**: Creating Subtask without `parentIssueId`
**Solution**: Provide parent Issue ID via `parentIssueId` field

### Error: "Referenced issue is not an Epic"
**Cause**: Provided `epicId` points to non-Epic issue
**Solution**: Ensure `epicId` references an actual Epic

### Error: "Parent issue must be of type story, task, or bug"
**Cause**: Provided `parentIssueId` points to Epic or Subtask
**Solution**: Ensure `parentIssueId` references Story/Task/Bug

## Database Schema

### Issue Schema Fields
```typescript
{
  projectId: ObjectId,        // Required: Links to Project
  boardId: ObjectId,          // Optional: Links to Board
  sprintId: ObjectId,         // Optional: Links to Sprint
  key: String,                // Unique: Issue key (PMT-1)
  title: String,              // Required: Issue title
  description: String,        // Optional: Rich text description
  type: String,               // Required: 'epic'|'story'|'task'|'bug'|'subtask'
  epicId: ObjectId,           // For Story/Task/Bug only: Links to Epic
  parentIssueId: ObjectId,    // For Subtask only: Links to parent Story/Task/Bug
  priority: String,           // 'lowest'|'low'|'medium'|'high'|'highest'
  status: String,             // 'todo'|'in-progress'|'done'
  assignee: ObjectId,         // Links to User
  reporter: ObjectId,         // Links to User (required)
  labels: [String],           // Array of labels
  estimate: Number,           // Story points
  dueDate: Date,              // Due date
  attachments: [String],      // Array of attachment URLs
  createdAt: Date,            // Auto: Creation timestamp
  updatedAt: Date             // Auto: Update timestamp
}
```

### Indexes
- `{ projectId: 1 }`
- `{ epicId: 1 }`
- `{ parentIssueId: 1 }`
- `{ type: 1 }`
- `{ status: 1 }`
- `{ assignee: 1 }`
- `{ key: 1 }`

## Usage Examples

### Example 1: Create a Complete Hierarchy
```typescript
// 1. Create Epic
const epic = await issueService.create({
  type: 'epic',
  projectId: 'proj123',
  title: 'User Management',
  reporter: 'user456'
});

// 2. Create Story under Epic
const story = await issueService.create({
  type: 'story',
  projectId: 'proj123',
  epicId: epic._id,
  title: 'User Registration',
  reporter: 'user456'
});

// 3. Create Task under Epic
const task = await issueService.create({
  type: 'task',
  projectId: 'proj123',
  epicId: epic._id,
  title: 'Setup OAuth2',
  reporter: 'user456'
});

// 4. Create Subtask under Story
const subtask = await issueService.create({
  type: 'subtask',
  projectId: 'proj123',
  parentIssueId: story._id,
  title: 'Create signup form',
  reporter: 'user456'
});
```

### Example 2: Query Hierarchy
```typescript
// Get all epics in project
const epics = await issueService.getEpicsByProject('proj123');

// Get all Story/Task/Bug under epic
const children = await issueService.getChildrenByEpic(epic._id);

// Get all subtasks
const subtasks = await issueService.getSubtasks(story._id);
```

### Example 3: Update and Status Tracking
```typescript
// Update story
await issueService.update(story._id, {
  priority: 'high',
  assignee: 'user789'
});

// Change status
await issueService.changeStatus(story._id, 'in-progress');

// Delete (cascades to subtasks)
await issueService.delete(story._id);
```

## Migration Notes

### From Old Hierarchy to New Hierarchy

The old structure had:
- Epic (parent: none)
- Story (parent: Epic)
- Task (parent: Story) ❌ **CHANGED**
- Bug (separate, flexible parent) ❌ **CHANGED**
- Subtask (parent: Task)

The new structure has:
- Epic (parent: none)
- Story (parent: Epic)
- Task (parent: Epic) ✓ **FIXED**
- Bug (parent: Epic) ✓ **FIXED**
- Subtask (parent: Story/Task/Bug)

### Breaking Changes
1. **Task is no longer a child of Story** - Now both are under Epic at same level
2. **Bug structure changed** - Now always under Epic, can have Subtasks
3. **parentId semantics changed** - For Story/Task/Bug, use `epicId`; for Subtask, use `parentIssueId`

### Data Migration Strategy
1. Identify all Tasks under Stories - Reassign to their Epic
2. Identify all Bugs - Ensure they have epicId set
3. Update all parent references appropriately
4. Re-validate hierarchy constraints

## Best Practices

1. **Always validate type before creating**: Ensure correct type and parent
2. **Use proper queries**: Use `getEpicsByProject` for epics, not `getByProject`
3. **Handle cascading deletes**: Deleting Epic deletes all children
4. **Populate relationships**: Always populate `assignee`, `reporter` for UI
5. **Use indexes**: Queries on `epicId`, `parentIssueId`, `type` are optimized
6. **Validate before save**: IssueService validates on create and update

---

**Last Updated**: December 29, 2025
**Version**: 1.0.0
