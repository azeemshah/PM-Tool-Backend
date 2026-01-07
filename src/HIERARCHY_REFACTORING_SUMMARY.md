# Jira Issue Hierarchy Refactoring - Summary

## Overview
Fixed the Jira issue hierarchy to follow real Jira rules with a single unified `Issue` entity using type field and proper parent-child relationships.

## Changes Made

### 1. Issue Schema (`src/issue/schemas/issue.schema.ts`)
**Changes**:
- Added comprehensive type field enum: `'epic' | 'story' | 'task' | 'bug' | 'subtask'`
- Added `epicId` field: For Story/Task/Bug to link to parent Epic
- Added `parentIssueId` field: For Subtask ONLY to link to parent Story/Task/Bug
- Added field-level documentation explaining hierarchy rules
- Added database indexes for performance: `projectId`, `epicId`, `parentIssueId`, `type`, `status`, `assignee`, `key`

**Key Properties**:
- Epic: `epicId=null`, `parentIssueId=null` (top-level)
- Story/Task/Bug: `epicId=<epic>`, `parentIssueId=null` (under Epic)
- Subtask: `epicId=null`, `parentIssueId=<story|task|bug>` (under Story/Task/Bug)

### 2. Issue Service (`src/issue/issue.service.ts`)
**New Features**:
- **Hierarchy Validation**: `validateHierarchy()` method validates all Jira rules
  - Epic: No parents allowed
  - Story/Task/Bug: Must have epicId, no parentIssueId
  - Subtask: Must have parentIssueId, no epicId
  
- **Create with Validation**: Validates parent references exist and are correct type
- **New Query Methods**:
  - `getEpicsByProject(projectId)`: Get all epics
  - `getChildrenByEpic(epicId)`: Get Story/Task/Bug under epic
  - `getSubtasks(parentIssueId)`: Get subtasks under parent
  
- **Cascade Delete**: 
  - Deleting Epic → deletes all children and subtasks
  - Deleting Story/Task/Bug → deletes all subtasks
  
- **Type Safety**: Cannot change issue type after creation

### 3. Issue Controller (`src/issue/issue.controller.ts`)
**New Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/issues/epic` | Create Epic |
| POST | `/issues/epic/:epicId/story` | Create Story under Epic |
| POST | `/issues/epic/:epicId/task` | Create Task under Epic |
| POST | `/issues/epic/:epicId/bug` | Create Bug under Epic |
| POST | `/issues/:parentId/subtask` | Create Subtask under Story/Task/Bug |
| GET | `/issues/:id` | Get single issue |
| GET | `/issues/project/:projectId` | Get all issues |
| GET | `/issues/epic/:projectId` | Get all epics |
| GET | `/issues/epic/:epicId/children` | Get Story/Task/Bug under Epic |
| GET | `/issues/:parentId/subtasks` | Get subtasks under parent |
| PATCH | `/issues/:id` | Update issue |
| PATCH | `/issues/:id/status` | Change status |
| PATCH | `/issues/:id/assign` | Assign issue |
| DELETE | `/issues/:id` | Delete issue (cascades) |

### 4. WorkItems DTO (`src/work-items/dto/create-work-item.dto.ts`)
**Changes**:
- Updated IssueType enum to match new hierarchy: `epic | story | task | bug | subtask`
- Changed Priority enum values to lowercase: `lowest | low | medium | high | highest`
- Added `epicId` field for Story/Task/Bug
- Updated documentation for parentId vs epicId distinction

### 5. WorkItems Schema (`src/work-items/schemas/work-item.schema.ts`)
**Changes**:
- Added `epicId` field for Story/Task/Bug
- Updated schema documentation
- Maintains backwards compatibility with work-items endpoints

### 6. WorkItems Service (`src/work-items/work-items.service.ts`)
**Changes**:
- Added `validateHierarchy()` method matching Issue service rules
- Updated `create()` to validate hierarchy
- Updated `update()` to validate hierarchy when parent references change
- Ensures consistency with Issue hierarchy rules

## Hierarchy Rules Enforced

### Epic (Top Level)
```
✓ Must have projectId
✗ Cannot have epicId
✗ Cannot have parentIssueId
✓ Can contain Story, Task, Bug
```

### Story/Task/Bug (Same Level Under Epic)
```
✓ Must have projectId
✓ Must have epicId (pointing to Epic)
✗ Cannot have parentIssueId
✓ Can contain Subtask
✗ Task cannot be under Story
✗ Bug cannot be under Task
```

### Subtask (Leaf Level)
```
✓ Must have projectId
✓ Must have parentIssueId (pointing to Story/Task/Bug)
✗ Cannot have epicId
✗ Cannot have children
```

## Validation Examples

### ✓ Valid Hierarchies
```
Epic "User Management"
  ├── Story "User Registration" (epicId=Epic._id)
  │   └── Subtask "Create signup form" (parentIssueId=Story._id)
  ├── Task "Setup OAuth2" (epicId=Epic._id)
  │   └── Subtask "Configure provider" (parentIssueId=Task._id)
  └── Bug "Login timeout" (epicId=Epic._id)
      └── Subtask "Add timeout handler" (parentIssueId=Bug._id)
```

### ✗ Invalid (Now Prevented)
```
❌ Task under Story (was allowed, now rejected)
❌ Bug under Task (was allowed, now rejected)
❌ Story without Epic (was allowed, now rejected)
❌ Subtask with epicId (was allowed, now rejected)
❌ Task with parentIssueId pointing to Story
```

## Breaking Changes & Migration

### Old API → New API
| Old Endpoint | New Endpoint | Change |
|---|---|---|
| POST `/issues` with type | POST `/issues/epic` | Type-specific endpoints |
| POST `/stories/:id/tasks` | POST `/issues/epic/:id/task` | Tasks now under Epic |
| POST `/tasks/:id/subtasks` | POST `/issues/:id/subtask` | Parent-agnostic |
| Various | GET `/issues/epic/:id/children` | New unified query |

### Data Model Changes
| Field | Old | New | Impact |
|---|---|---|---|
| Parent for Story/Task/Bug | Nested | epicId | Use epicId field |
| Subtask Parent | storyId | parentIssueId | More flexible |
| Issue Type | String (any) | Enum (strict) | Validation enforced |

## Files Modified

1. **Backend**:
   - `src/issue/schemas/issue.schema.ts` - Unified schema
   - `src/issue/issue.service.ts` - Hierarchy logic
   - `src/issue/issue.controller.ts` - New endpoints
   - `src/work-items/dto/create-work-item.dto.ts` - Updated DTO
   - `src/work-items/schemas/work-item.schema.ts` - Alignment
   - `src/work-items/work-items.service.ts` - Validation

2. **Documentation**:
   - `src/issue/ISSUE_HIERARCHY.md` - Complete hierarchy guide
   - `src/project-management/PROJECT_MANAGEMENT.md` - Existing (unchanged)

## Not Modified (As Requested)

- ✓ Workspace module (unchanged)
- ✓ Project module (unchanged)
- ✓ Auth module (unchanged)
- ✓ Board module (unchanged)
- ✓ Any other modules (unchanged)

## Backward Compatibility

### API Stability
- Old `/issues` simple endpoints preserved in new controller
- New type-specific endpoints provide clearer intent
- All existing CRUD operations still work

### Frontend Migration Path
1. Update issue creation to use type-specific endpoints
2. When querying, use new hierarchy methods:
   - `getEpicsByProject()` instead of filtering by type
   - `getChildrenByEpic()` for story/task/bug
   - `getSubtasks()` for subtasks
3. Update forms to show epicId/parentIssueId appropriately

## Testing Checklist

- [ ] Create Epic without parent → Success
- [ ] Create Epic with epicId → Validation error
- [ ] Create Story with epicId → Success
- [ ] Create Story without epicId → Validation error
- [ ] Create Task with epicId → Success
- [ ] Create Task under Story → Validation error
- [ ] Create Bug with epicId → Success
- [ ] Create Subtask with parentIssueId → Success
- [ ] Create Subtask without parentIssueId → Validation error
- [ ] Delete Epic → Cascades to children
- [ ] Delete Story → Cascades to subtasks
- [ ] Query epics by project
- [ ] Query children of epic
- [ ] Query subtasks of parent
- [ ] Update issue status
- [ ] Assign issue
- [ ] Cannot change issue type

## Next Steps for Frontend

1. **Update Issue Creation Form**:
   - Step 1: Select type (Epic, Story, Task, Bug, Subtask)
   - Step 2: If Story/Task/Bug, select Epic
   - Step 3: If Subtask, select parent Issue

2. **Update Issue Display**:
   - Show issue type prominently
   - Show parent Epic for Story/Task/Bug
   - Show parent Issue for Subtask
   - Disable parentId field for non-subtask issues

3. **Update Issue Queries**:
   - Use `getEpicsByProject()` for epic lists
   - Use `getChildrenByEpic()` for story/task/bug lists
   - Use `getSubtasks()` for subtask lists

4. **Update Hierarchy Navigation**:
   - Show parent-child relationships
   - Enable drill-down from Epic → Children → Subtasks
   - Show breadcrumb: Epic > Story/Task/Bug > Subtask

---

**Status**: ✓ Complete
**Date**: December 29, 2025
**Version**: 1.0.0
