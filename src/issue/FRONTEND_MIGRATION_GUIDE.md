# Frontend API Migration Guide

## Overview
This guide helps frontend developers migrate from the old project management hierarchy to the new unified Issue API with proper Jira hierarchy.

## Old vs New API

### Creating Issues

#### Before (Old API)
```javascript
// Create Epic
POST /projects/epics
{ "title": "User Auth", "description": "..." }

// Create Story under Epic
POST /epics/:epicId/stories
{ "title": "Login page", "description": "..." }

// Create Task under Story (⚠️ WRONG HIERARCHY)
POST /stories/:storyId/tasks
{ "title": "Create form", "description": "..." }

// Create Bug (anywhere)
POST /bugs
{ "title": "XSS", "taskId": "...", "projectId": "..." }

// Create Subtask under Task
POST /tasks/:taskId/subtasks
{ "title": "Add validation", "description": "..." }
```

#### After (New API - Correct Hierarchy)
```javascript
// Create Epic
POST /issues/epic
{ 
  "projectId": "...",
  "title": "User Auth",
  "description": "...",
  "reporter": "..."
}

// Create Story under Epic
POST /issues/epic/:epicId/story
{ 
  "projectId": "...",
  "title": "Login page",
  "description": "...",
  "reporter": "..."
}

// Create Task under Epic (NOW AT SAME LEVEL AS STORY)
POST /issues/epic/:epicId/task
{ 
  "projectId": "...",
  "title": "Create form",
  "description": "...",
  "reporter": "..."
}

// Create Bug under Epic (NOW AT SAME LEVEL AS STORY/TASK)
POST /issues/epic/:epicId/bug
{ 
  "projectId": "...",
  "title": "XSS vulnerability",
  "priority": "highest",
  "reporter": "..."
}

// Create Subtask under ANY (Story/Task/Bug)
POST /issues/:parentId/subtask
{ 
  "projectId": "...",
  "title": "Add validation",
  "description": "...",
  "reporter": "..."
}
```

## Key Differences

### 1. Issue Types and Parent-Child Relationships

| Type | Old Parent | New Parent | Children | Change |
|------|-----------|-----------|----------|--------|
| Epic | None | None | Story, Task, Bug | ✓ Same |
| Story | Epic | Epic | Subtask | ✓ Same |
| Task | **Story** | **Epic** | Subtask | ⚠️ **CHANGED** |
| Bug | Flexible | Epic | Subtask | ⚠️ **CHANGED** |
| Subtask | Task | Story/Task/Bug | None | ✓ More flexible |

### 2. API Endpoint Structure

**Old Pattern** (Nested routes):
```
POST /epics/:epicId/stories
POST /stories/:storyId/tasks
POST /tasks/:taskId/subtasks
POST /bugs (standalone)
```

**New Pattern** (Type-specific):
```
POST /issues/epic
POST /issues/epic/:epicId/story
POST /issues/epic/:epicId/task
POST /issues/epic/:epicId/bug
POST /issues/:parentId/subtask
```

### 3. Required Fields

**For Epic**:
```javascript
{
  projectId: string,     // ✓ Required
  title: string,         // ✓ Required
  reporter: string,      // ✓ Required
  description?: string,
  priority?: string,
  // ✗ Do NOT include: epicId, parentIssueId
}
```

**For Story/Task/Bug**:
```javascript
{
  projectId: string,     // ✓ Required
  title: string,         // ✓ Required
  reporter: string,      // ✓ Required
  epicId?: string,       // ✓ From URL (auto-filled)
  description?: string,
  priority?: string,
  // ✗ Do NOT include: parentIssueId
}
```

**For Subtask**:
```javascript
{
  projectId: string,     // ✓ Required
  title: string,         // ✓ Required
  reporter: string,      // ✓ Required
  parentIssueId?: string, // ✓ From URL (auto-filled)
  description?: string,
  priority?: string,
  // ✗ Do NOT include: epicId
}
```

## UI/Form Migration

### Issue Creation Workflow

#### Old Workflow
```
1. Select Issue Type → 2. Fill Details → 3. Select Parent
   ├── Epic (no parent)
   ├── Story → select Epic
   ├── Task → select Story
   ├── Bug → optional parent
   └── Subtask → select Task
```

#### New Workflow
```
1. Select Type → 2. Provide Parent Context → 3. Fill Details
   ├── Epic
   │   ├── No parent selection needed
   │   └── POST /issues/epic
   │
   ├── Story/Task/Bug
   │   ├── Select Epic first
   │   ├── POST /issues/epic/:epicId/story (or task/bug)
   │   └── parentIssueId auto-from URL
   │
   └── Subtask
       ├── Select Parent Issue (Story/Task/Bug)
       ├── POST /issues/:parentId/subtask
       └── epicId auto-inherited from parent
```

## React Component Migration Examples

### Creating Epic

**Before**:
```jsx
const createEpic = async (data) => {
  const response = await axios.post('/projects/epics', {
    title: data.title,
    description: data.description
  });
  return response.data;
};
```

**After**:
```jsx
const createEpic = async (data) => {
  const response = await axios.post('/issues/epic', {
    projectId: data.projectId,
    title: data.title,
    description: data.description,
    reporter: data.reporterId,
    priority: data.priority
  });
  return response.data;
};
```

### Creating Story

**Before**:
```jsx
const createStory = async (epicId, data) => {
  const response = await axios.post(`/epics/${epicId}/stories`, {
    title: data.title,
    description: data.description
  });
  return response.data;
};
```

**After**:
```jsx
const createStory = async (epicId, data) => {
  const response = await axios.post(`/issues/epic/${epicId}/story`, {
    projectId: data.projectId,
    title: data.title,
    description: data.description,
    reporter: data.reporterId,
    priority: data.priority
    // epicId is in URL, not in body
  });
  return response.data;
};
```

### Creating Task

**Before** (⚠️ Wrong - under Story):
```jsx
const createTask = async (storyId, data) => {
  const response = await axios.post(`/stories/${storyId}/tasks`, {
    title: data.title,
    description: data.description
  });
  return response.data;
};
```

**After** (✓ Correct - under Epic):
```jsx
const createTask = async (epicId, data) => {
  const response = await axios.post(`/issues/epic/${epicId}/task`, {
    projectId: data.projectId,
    title: data.title,
    description: data.description,
    reporter: data.reporterId,
    priority: data.priority
  });
  return response.data;
};
```

### Creating Subtask

**Before**:
```jsx
const createSubtask = async (taskId, data) => {
  const response = await axios.post(`/tasks/${taskId}/subtasks`, {
    title: data.title,
    description: data.description
  });
  return response.data;
};
```

**After**:
```jsx
const createSubtask = async (parentIssueId, data) => {
  const response = await axios.post(`/issues/${parentIssueId}/subtask`, {
    projectId: data.projectId,
    title: data.title,
    description: data.description,
    reporter: data.reporterId,
    priority: data.priority
    // parentIssueId is in URL, not in body
  });
  return response.data;
};
```

## Querying Issues

### Getting Lists

**Before**:
```javascript
// Get all epics
GET /projects/:projectId/epics

// Get stories under epic
GET /epics/:epicId/stories

// Get tasks under story
GET /stories/:storyId/tasks

// Get bugs (filtered)
GET /bugs?projectId=...&taskId=...
```

**After**:
```javascript
// Get all epics
GET /issues/epic/:projectId

// Get Story/Task/Bug under epic
GET /issues/epic/:epicId/children

// Get subtasks under any parent
GET /issues/:parentId/subtasks

// Get all issues in project
GET /issues/project/:projectId

// Get single issue
GET /issues/:id
```

### React Hook Examples

**Before**:
```jsx
useEffect(() => {
  const fetchEpics = async () => {
    const res = await axios.get(`/projects/${projectId}/epics`);
    setEpics(res.data);
  };
  fetchEpics();
}, [projectId]);
```

**After**:
```jsx
useEffect(() => {
  const fetchEpics = async () => {
    const res = await axios.get(`/issues/epic/${projectId}`);
    setEpics(res.data);
  };
  fetchEpics();
}, [projectId]);
```

**Before**:
```jsx
useEffect(() => {
  const fetchTasks = async () => {
    const res = await axios.get(`/stories/${storyId}/tasks`);
    setTasks(res.data);
  };
  fetchTasks();
}, [storyId]);
```

**After**:
```jsx
useEffect(() => {
  const fetchChildren = async () => {
    const res = await axios.get(`/issues/epic/${epicId}/children`);
    // Filter if you need only tasks: res.data.filter(i => i.type === 'task')
    setChildren(res.data);
  };
  fetchChildren();
}, [epicId]);
```

## Form Components

### IssueTypeSelector

**After**:
```jsx
function IssueTypeSelector({ value, onChange }) {
  const types = [
    { value: 'epic', label: '🎯 Epic', icon: 'epic' },
    { value: 'story', label: '📖 Story', icon: 'story' },
    { value: 'task', label: '✓ Task', icon: 'task' },
    { value: 'bug', label: '🐛 Bug', icon: 'bug' },
    { value: 'subtask', label: '→ Subtask', icon: 'subtask' }
  ];

  return (
    <div className="type-selector">
      {types.map(type => (
        <button
          key={type.value}
          onClick={() => onChange(type.value)}
          className={value === type.value ? 'selected' : ''}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
```

### ParentSelector

**After**:
```jsx
function ParentSelector({ issueType, value, onChange }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (issueType === 'subtask') {
      // Fetch Story/Task/Bug issues
      axios.get('/issues/project/:projectId')
        .then(res => {
          const parentTypes = res.data.filter(i => 
            ['story', 'task', 'bug'].includes(i.type)
          );
          setOptions(parentTypes);
        });
    } else if (['story', 'task', 'bug'].includes(issueType)) {
      // Fetch Epics
      axios.get('/issues/epic/:projectId')
        .then(res => setOptions(res.data));
    }
  }, [issueType]);

  if (!['story', 'task', 'bug', 'subtask'].includes(issueType)) {
    return null; // Epic has no parent
  }

  const label = issueType === 'subtask' ? 'Parent Issue' : 'Epic';

  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Select {label}...</option>
      {options.map(option => (
        <option key={option._id} value={option._id}>
          {option.type === 'epic' ? '🎯' : option.type === 'story' ? '📖' : 
           option.type === 'task' ? '✓' : '🐛'} {option.title}
        </option>
      ))}
    </select>
  );
}
```

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Epic cannot have a parent" | Sent epicId/parentIssueId for Epic | Remove these fields |
| "story must have an epicId" | Missing epicId for Story | Provide epicId from parent Epic |
| "story must link to Epic via epicId, not have a parentIssueId" | Used parentIssueId for Story | Use epicId instead |
| "Subtask must have a parentIssueId" | Missing parentIssueId for Subtask | Provide parentIssueId from parent |
| "Subtask should not have epicId" | Sent epicId for Subtask | Remove epicId field |
| "Referenced issue is not an Epic" | epicId points to non-Epic | Verify parent is Epic type |
| "Parent issue must be of type story, task, or bug" | parentIssueId points to Epic/Subtask | Verify parent is Story/Task/Bug |

## Testing Checklist

- [ ] Create Epic form works
- [ ] Create Story form shows Epic selector
- [ ] Create Task form shows Epic selector (not Story)
- [ ] Create Bug form shows Epic selector
- [ ] Create Subtask form shows parent Issue selector (Story/Task/Bug)
- [ ] Cannot create Task under Story
- [ ] Cannot create Bug under Task
- [ ] Deleting Epic cascades to children
- [ ] Deleting Story cascades to subtasks
- [ ] Epic list displays correctly
- [ ] Story/Task/Bug list shows under correct Epic
- [ ] Subtask list shows under correct parent
- [ ] Breadcrumb shows correct hierarchy
- [ ] Validation errors display clearly
- [ ] All CRUD operations work

## Gradual Migration Strategy

1. **Phase 1**: Add new endpoints alongside old ones
   - Create new Issue endpoints
   - Keep old Project Management endpoints

2. **Phase 2**: Dual support in UI
   - Add toggle for "Use new hierarchy"
   - Both create forms work in parallel

3. **Phase 3**: Migrate UI components
   - Update all create forms
   - Update all query logic

4. **Phase 4**: Remove old endpoints
   - Deprecate old APIs
   - Update documentation

5. **Phase 5**: Data migration
   - Migrate Tasks from Story parent to Epic parent
   - Validate all data follows new hierarchy

---

**Migration Timeline**: 2-3 weeks
**Testing Required**: Comprehensive
**Rollback Plan**: Keep old endpoints available for 30 days
