# Project Management Module Documentation

## Table of Contents
1. [Overview](#overview)
2. [Module Architecture](#module-architecture)
3. [Data Models & Schemas](#data-models--schemas)
4. [API Endpoints](#api-endpoints)
5. [Service Methods](#service-methods)
6. [Usage Examples](#usage-examples)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Overview

The **Project Management Module** is a comprehensive NestJS module designed to manage hierarchical project workflows. It implements a complete project management system with support for:

- **Projects**: Top-level organizational units
- **Epics**: Large features or initiatives within projects
- **Stories**: User stories that belong to epics
- **Tasks**: Individual work items within stories
- **Subtasks**: Smaller work units within tasks
- **Bugs**: Issues and defects that can be attached to tasks, subtasks, or projects

### Key Features
- ✅ Hierarchical relationship management (Project → Epic → Story → Task → Subtask)
- ✅ Bug tracking with flexible attachment options
- ✅ Priority levels (lowest, low, high, highest)
- ✅ Status tracking (todo, in-progress, done, open, resolved, closed)
- ✅ User assignment and reporting
- ✅ Attachment support
- ✅ Timestamps for audit trails
- ✅ MongoDB integration via Mongoose

---

## Module Architecture

### File Structure
```
project-management/
├── project-management.module.ts      # Module definition
├── project-management.controller.ts  # HTTP request handlers
├── project-management.service.ts     # Business logic
└── schemas/
    └── project-management.schema.ts  # Mongoose schemas
```

### Module Registration
```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Epic.name, schema: EpicSchema },
      { name: Story.name, schema: StorySchema },
      { name: Task.name, schema: TaskSchema },
      { name: Subtask.name, schema: SubtaskSchema },
      { name: Bug.name, schema: BugSchema },
    ]),
  ],
  controllers: [ProjectManagementController],
  providers: [ProjectManagementService],
})
export class ProjectManagementModule {}
```

---

## Data Models & Schemas

### 1. Project Schema
Top-level entity that contains all other entities.

```typescript
@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  name: string;                    // Project name (required)
  
  @Prop()
  description?: string;            // Project description (optional)
  
  @Prop([EpicSchema])
  epics?: Epic[];                  // Associated epics
  
  @Prop([StorySchema])
  stories?: Story[];               // Associated stories
  
  @Prop([TaskSchema])
  tasks?: Task[];                  // Associated tasks
  
  @Prop([SubtaskSchema])
  subtasks?: Subtask[];            // Associated subtasks
  
  @Prop([BugSchema])
  bugs?: Bug[];                    // Associated bugs
}
```

**Properties:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | Project name |
| `description` | String | ❌ No | Project description |
| `epics` | Epic[] | ❌ No | Embedded epics |
| `stories` | Story[] | ❌ No | Embedded stories |
| `tasks` | Task[] | ❌ No | Embedded tasks |
| `subtasks` | Subtask[] | ❌ No | Embedded subtasks |
| `bugs` | Bug[] | ❌ No | Embedded bugs |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

---

### 2. Epic Schema
Large features or initiatives within a project.

```typescript
@Schema({ timestamps: true })
export class Epic extends Document {
  @Prop({ required: true })
  title: string;                   // Epic title (required)
  
  @Prop()
  description?: string;            // Epic description (optional)
  
  @Prop([StorySchema])
  stories?: Story[];               // Associated stories
  
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;       // Reference to parent project
}
```

**Properties:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | ✅ Yes | Epic title |
| `description` | String | ❌ No | Epic description |
| `stories` | Story[] | ❌ No | Embedded stories |
| `projectId` | ObjectId | ✅ Yes | Parent project reference |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

---

### 3. Story Schema
User stories that belong to epics.

```typescript
@Schema({ timestamps: true })
export class Story extends Document {
  @Prop({ required: true })
  title: string;                   // Story title (required)
  
  @Prop()
  description?: string;            // Story description (optional)
  
  @Prop([TaskSchema])
  tasks?: Task[];                  // Associated tasks
  
  @Prop({ type: Types.ObjectId, ref: 'Epic' })
  epicId?: Types.ObjectId;         // Reference to parent epic
  
  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;      // Reference to parent project
}
```

**Properties:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | ✅ Yes | Story title |
| `description` | String | ❌ No | Story description |
| `tasks` | Task[] | ❌ No | Embedded tasks |
| `epicId` | ObjectId | ❌ No | Parent epic reference |
| `projectId` | ObjectId | ❌ No | Parent project reference |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

---

### 4. Task Schema
Individual work items within stories.

```typescript
@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title: string;                   // Task title (required)
  
  @Prop()
  description?: string;            // Task description (optional)
  
  @Prop({ enum: ['lowest', 'low', 'high', 'highest'] })
  priority?: string;               // Priority level (optional)
  
  @Prop({ enum: ['todo', 'in-progress', 'done'], default: 'todo' })
  status: string;                  // Task status (default: 'todo')
  
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;       // Assigned user
  
  @Prop({ type: Types.ObjectId, ref: 'User' })
  reporter?: Types.ObjectId;       // User who reported the task
  
  @Prop()
  dueDate?: Date;                  // Task due date (optional)
  
  @Prop([SubtaskSchema])
  subtasks?: Subtask[];            // Associated subtasks
  
  @Prop([BugSchema])
  bugs?: Bug[];                    // Associated bugs
  
  @Prop({ type: Types.ObjectId, ref: 'Story' })
  storyId?: Types.ObjectId;        // Reference to parent story
  
  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;      // Reference to parent project
}
```

**Properties:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | String | ✅ Yes | - | Task title |
| `description` | String | ❌ No | - | Task description |
| `priority` | String | ❌ No | - | Priority: 'lowest', 'low', 'high', 'highest' |
| `status` | String | ❌ No | 'todo' | Status: 'todo', 'in-progress', 'done' |
| `assignee` | ObjectId | ❌ No | - | Assigned user reference |
| `reporter` | ObjectId | ❌ No | - | Reporter user reference |
| `dueDate` | Date | ❌ No | - | Due date of task |
| `subtasks` | Subtask[] | ❌ No | - | Embedded subtasks |
| `bugs` | Bug[] | ❌ No | - | Embedded bugs |
| `storyId` | ObjectId | ❌ No | - | Parent story reference |
| `projectId` | ObjectId | ❌ No | - | Parent project reference |
| `createdAt` | Date | Auto | - | Creation timestamp |
| `updatedAt` | Date | Auto | - | Last update timestamp |

---

### 5. Subtask Schema
Smaller work units within tasks.

```typescript
@Schema({ timestamps: true })
export class Subtask extends Document {
  @Prop({ required: true })
  title: string;                   // Subtask title (required)
  
  @Prop()
  description?: string;            // Subtask description (optional)
  
  @Prop({ enum: ['lowest', 'low', 'high', 'highest'] })
  priority?: string;               // Priority level (optional)
  
  @Prop({ enum: ['todo', 'in-progress', 'done'], default: 'todo' })
  status: string;                  // Subtask status (default: 'todo')
  
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;       // Assigned user
  
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: Types.ObjectId;          // Reference to parent task (required)
  
  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;      // Reference to parent project
  
  @Prop([BugSchema])
  bugs?: Bug[];                    // Associated bugs
}
```

**Properties:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | String | ✅ Yes | - | Subtask title |
| `description` | String | ❌ No | - | Subtask description |
| `priority` | String | ❌ No | - | Priority: 'lowest', 'low', 'high', 'highest' |
| `status` | String | ❌ No | 'todo' | Status: 'todo', 'in-progress', 'done' |
| `assignee` | ObjectId | ❌ No | - | Assigned user reference |
| `taskId` | ObjectId | ✅ Yes | - | Parent task reference |
| `projectId` | ObjectId | ❌ No | - | Parent project reference |
| `bugs` | Bug[] | ❌ No | - | Embedded bugs |
| `createdAt` | Date | Auto | - | Creation timestamp |
| `updatedAt` | Date | Auto | - | Last update timestamp |

---

### 6. Bug Schema
Issues and defects that can be attached to tasks, subtasks, or projects.

```typescript
@Schema({ timestamps: true })
export class Bug extends Document {
  @Prop({ required: true })
  title: string;                   // Bug title (required)
  
  @Prop()
  description?: string;            // Bug description (optional)
  
  @Prop({ enum: ['lowest', 'low', 'high', 'highest'] })
  priority?: string;               // Bug priority (optional)
  
  @Prop({ enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' })
  status: string;                  // Bug status (default: 'open')
  
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;       // Assigned user
  
  @Prop({ type: Types.ObjectId, ref: 'User' })
  reporter?: Types.ObjectId;       // User who reported the bug
  
  @Prop({ type: Types.ObjectId, ref: 'Task' })
  taskId?: Types.ObjectId;         // Reference to parent task
  
  @Prop({ type: Types.ObjectId, ref: 'Subtask' })
  subtaskId?: Types.ObjectId;      // Reference to parent subtask
  
  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;      // Reference to parent project
  
  @Prop([String])
  attachments?: string[];          // Array of attachment URLs/paths
}
```

**Properties:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | String | ✅ Yes | - | Bug title |
| `description` | String | ❌ No | - | Bug description |
| `priority` | String | ❌ No | - | Priority: 'lowest', 'low', 'high', 'highest' |
| `status` | String | ❌ No | 'open' | Status: 'open', 'in-progress', 'resolved', 'closed' |
| `assignee` | ObjectId | ❌ No | - | Assigned user reference |
| `reporter` | ObjectId | ❌ No | - | Reporter user reference |
| `taskId` | ObjectId | ❌ No | - | Parent task reference |
| `subtaskId` | ObjectId | ❌ No | - | Parent subtask reference |
| `projectId` | ObjectId | ❌ No | - | Parent project reference |
| `attachments` | String[] | ❌ No | - | Array of attachment URLs |
| `createdAt` | Date | Auto | - | Creation timestamp |
| `updatedAt` | Date | Auto | - | Last update timestamp |

---

## API Endpoints

### Project Endpoints

#### Create Project
```http
POST /projects
Content-Type: application/json

{
  "name": "Project Name",
  "description": "Project Description"
}
```
**Response:** `201 Created`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Project Name",
  "description": "Project Description",
  "createdAt": "2025-12-29T10:00:00.000Z",
  "updatedAt": "2025-12-29T10:00:00.000Z"
}
```

#### Get All Projects
```http
GET /projects
```
**Response:** `200 OK`
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Project Name",
    "description": "Project Description",
    "createdAt": "2025-12-29T10:00:00.000Z",
    "updatedAt": "2025-12-29T10:00:00.000Z"
  }
]
```

#### Get Project by ID
```http
GET /projects/:id
```
**Response:** `200 OK` or `404 Not Found`

#### Update Project
```http
PUT /projects/:id
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated Description"
}
```
**Response:** `200 OK`

#### Delete Project
```http
DELETE /projects/:id
```
**Response:** `200 OK`
```json
{
  "message": "Project and related resources deleted successfully"
}
```

**Note:** Deleting a project will cascade and remove related epics, stories, tasks, subtasks and bugs, and will attempt to remove uploaded attachment files stored under the `uploads/` folder.

---

### Epic Endpoints

#### Create Epic
```http
POST /projects/:projectId/epics
Content-Type: application/json

{
  "title": "Epic Title",
  "description": "Epic Description"
}
```
**Response:** `201 Created`

#### Get Epics by Project
```http
GET /projects/:projectId/epics
```
**Response:** `200 OK` (returns array of epics for the project)

#### Update Epic
```http
PUT /epics/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated Description"
}
```
**Response:** `200 OK`

#### Delete Epic
```http
DELETE /epics/:id
```
**Response:** `200 OK`
```json
{
  "message": "Epic deleted successfully"
}
```

---

### Story Endpoints

#### Create Story
```http
POST /epics/:epicId/stories
Content-Type: application/json

{
  "title": "Story Title",
  "description": "Story Description"
}
```
**Response:** `201 Created`

#### Get Stories by Epic
```http
GET /epics/:epicId/stories
```
**Response:** `200 OK` (returns array of stories for the epic)

#### Update Story
```http
PUT /stories/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated Description"
}
```
**Response:** `200 OK`

#### Delete Story
```http
DELETE /stories/:id
```
**Response:** `200 OK`
```json
{
  "message": "Story deleted successfully"
}
```

---

### Task Endpoints

#### Create Task
```http
POST /stories/:storyId/tasks
Content-Type: application/json

{
  "title": "Task Title",
  "description": "Task Description",
  "priority": "high",
  "status": "todo",
  "dueDate": "2025-12-31T23:59:59.000Z"
}
```
**Response:** `201 Created`

#### Get Tasks by Story
```http
GET /stories/:storyId/tasks
```
**Response:** `200 OK` (returns array of tasks for the story)

#### Update Task
```http
PUT /tasks/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "in-progress",
  "priority": "highest"
}
```
**Response:** `200 OK`

#### Delete Task
```http
DELETE /tasks/:id
```
**Response:** `200 OK`
```json
{
  "message": "Task deleted successfully"
}
```

---

### Subtask Endpoints

#### Create Subtask
```http
POST /tasks/:taskId/subtasks
Content-Type: application/json

{
  "title": "Subtask Title",
  "description": "Subtask Description",
  "priority": "medium"
}
```
**Response:** `201 Created`

#### Get Subtasks by Task
```http
GET /tasks/:taskId/subtasks
```
**Response:** `200 OK` (returns array of subtasks for the task)

#### Update Subtask
```http
PUT /subtasks/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "done"
}
```
**Response:** `200 OK`

#### Delete Subtask
```http
DELETE /subtasks/:id
```
**Response:** `200 OK`
```json
{
  "message": "Subtask deleted successfully"
}
```

---

### Bug Endpoints

#### Create Bug
```http
POST /bugs
Content-Type: application/json

{
  "title": "Bug Title",
  "description": "Bug Description",
  "priority": "high",
  "status": "open",
  "taskId": "507f1f77bcf86cd799439011",
  "attachments": ["https://example.com/screenshot.png"]
}
```
**Response:** `201 Created`

#### Get Bugs (with optional filters)
```http
GET /bugs
GET /bugs?taskId=507f1f77bcf86cd799439011
GET /bugs?subtaskId=507f1f77bcf86cd799439012
GET /bugs?projectId=507f1f77bcf86cd799439013
```
**Response:** `200 OK` (returns filtered bugs)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `taskId` | String | Filter bugs by task |
| `subtaskId` | String | Filter bugs by subtask |
| `projectId` | String | Filter bugs by project |

#### Update Bug
```http
PUT /bugs/:id
Content-Type: application/json

{
  "status": "resolved",
  "priority": "low"
}
```
**Response:** `200 OK`

#### Delete Bug
```http
DELETE /bugs/:id
```
**Response:** `200 OK`
```json
{
  "message": "Bug deleted successfully"
}
```

---

## Service Methods

### ProjectManagementService

#### Project Methods

```typescript
// Create a new project
createProject(data: Partial<Project>): Promise<Project>

// Get all projects
getProjects(): Promise<Project[]>

// Get project by ID
getProjectById(id: string): Promise<Project>

// Update project
updateProject(id: string, data: Partial<Project>): Promise<Project>

// Delete project
deleteProject(id: string): Promise<{ message: string }>
```

#### Epic Methods

```typescript
// Create epic in a project
createEpic(projectId: string, data: Partial<Epic>): Promise<Epic>

// Get epics (optionally filtered by projectId)
getEpics(projectId?: string): Promise<Epic[]>

// Update epic
updateEpic(id: string, data: Partial<Epic>): Promise<Epic>

// Delete epic
deleteEpic(id: string): Promise<{ message: string }>
```

#### Story Methods

```typescript
// Create story in an epic
createStory(epicId: string, data: Partial<Story>): Promise<Story>

// Get stories (optionally filtered by epicId)
getStories(epicId?: string): Promise<Story[]>

// Update story
updateStory(id: string, data: Partial<Story>): Promise<Story>

// Delete story
deleteStory(id: string): Promise<{ message: string }>
```

#### Task Methods

```typescript
// Create task in a story
createTask(storyId: string, data: Partial<Task>): Promise<Task>

// Get tasks (optionally filtered by storyId)
getTasks(storyId?: string): Promise<Task[]>

// Update task
updateTask(id: string, data: Partial<Task>): Promise<Task>

// Delete task
deleteTask(id: string): Promise<{ message: string }>
```

#### Subtask Methods

```typescript
// Create subtask in a task
createSubtask(taskId: string, data: Partial<Subtask>): Promise<Subtask>

// Get subtasks (optionally filtered by taskId)
getSubtasks(taskId?: string): Promise<Subtask[]>

// Update subtask
updateSubtask(id: string, data: Partial<Subtask>): Promise<Subtask>

// Delete subtask
deleteSubtask(id: string): Promise<{ message: string }>
```

#### Bug Methods

```typescript
// Create a bug
createBug(data: Partial<Bug>): Promise<Bug>

// Get bugs with optional filters
getBugs(taskId?: string, subtaskId?: string, projectId?: string): Promise<Bug[]>

// Update bug
updateBug(id: string, data: Partial<Bug>): Promise<Bug>

// Delete bug
deleteBug(id: string): Promise<{ message: string }>
```

---

## Usage Examples

### 1. Create a Complete Project Hierarchy

```typescript
// Step 1: Create a project
const project = await projectService.createProject({
  name: "E-Commerce Platform",
  description: "Build a modern e-commerce application"
});

// Step 2: Create an epic under the project
const epic = await projectService.createEpic(project._id.toString(), {
  title: "User Authentication",
  description: "Implement user login and registration system"
});

// Step 3: Create a story under the epic
const story = await projectService.createStory(epic._id.toString(), {
  title: "Login Page",
  description: "Create user login page with validation"
});

// Step 4: Create a task under the story
const task = await projectService.createTask(story._id.toString(), {
  title: "Implement login form component",
  description: "Build React component for login form",
  priority: "high",
  status: "todo",
  assignee: new Types.ObjectId("USER_ID"),
  dueDate: new Date("2025-12-31")
});

// Step 5: Create subtasks
const subtask1 = await projectService.createSubtask(task._id.toString(), {
  title: "Create form inputs",
  status: "todo",
  priority: "high"
});

const subtask2 = await projectService.createSubtask(task._id.toString(), {
  title: "Add form validation",
  status: "todo",
  priority: "high"
});

// Step 6: Create a bug
const bug = await projectService.createBug({
  title: "Password validation not working",
  description: "Password field accepts less than 6 characters",
  priority: "highest",
  status: "open",
  taskId: task._id,
  assignee: new Types.ObjectId("USER_ID")
});
```

### 2. Get Complete Project Details

```typescript
// Get all details of a project
const projectDetails = await projectService.getProjectById(projectId);

// Get all epics in a project
const epics = await projectService.getEpics(projectId);

// Get all stories in an epic
const stories = await projectService.getStories(epicId);

// Get all tasks in a story
const tasks = await projectService.getTasks(storyId);

// Get all subtasks in a task
const subtasks = await projectService.getSubtasks(taskId);

// Get all bugs in a project
const projectBugs = await projectService.getBugs(undefined, undefined, projectId);
```

### 3. Update Status Progression

```typescript
// Update task status to in-progress
await projectService.updateTask(taskId, {
  status: "in-progress"
});

// Complete a subtask
await projectService.updateSubtask(subtaskId, {
  status: "done"
});

// Mark all subtasks as done
const allSubtasks = await projectService.getSubtasks(taskId);
for (const subtask of allSubtasks) {
  await projectService.updateSubtask(subtask._id.toString(), {
    status: "done"
  });
}

// Update task status to done
await projectService.updateTask(taskId, {
  status: "done"
});
```

### 4. Bug Management

```typescript
// Find bugs for a specific task
const taskBugs = await projectService.getBugs(taskId);

// Find critical bugs across a project
const allProjectBugs = await projectService.getBugs(undefined, undefined, projectId);
const criticalBugs = allProjectBugs.filter(bug => bug.priority === "highest");

// Resolve a bug
await projectService.updateBug(bugId, {
  status: "resolved"
});

// Reassign bug
await projectService.updateBug(bugId, {
  assignee: new Types.ObjectId("NEW_USER_ID")
});
```

### 5. Filter and Query Bugs

```typescript
// Get bugs for a specific task
const taskBugs = await projectService.getBugs(taskId);

// Get bugs for a specific subtask
const subtaskBugs = await projectService.getBugs(undefined, subtaskId);

// Get all bugs in a project
const projectBugs = await projectService.getBugs(undefined, undefined, projectId);

// Get bugs by priority (after fetching)
const highPriorityBugs = projectBugs.filter(bug => bug.priority === "high" || bug.priority === "highest");
```

---

## Error Handling

The controller implements comprehensive error handling:

### Validation Errors

```typescript
// Invalid ID format throws BadRequestException
@Get(':id')
getProjectById(@Param('id') id: string) {
  this.validateId(id, 'Project ID');  // Throws BadRequestException if invalid
  return this.projectService.getProjectById(id);
}
```

### Not Found Errors

```typescript
// Service methods throw NotFoundException
async getProjectById(id: string): Promise<Project> {
  const project = await this.projectModel.findById(id).exec();
  if (!project) throw new NotFoundException('Project not found');
  return project;
}
```

### Common Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| 400 | BadRequestException | Invalid MongoDB ID format |
| 404 | NotFoundException | Resource not found in database |
| 500 | Internal Server Error | Unexpected server error |

### Example Error Handling in Client

```typescript
try {
  const project = await projectService.getProjectById(projectId);
} catch (error) {
  if (error instanceof NotFoundException) {
    console.error("Project not found");
  } else if (error instanceof BadRequestException) {
    console.error("Invalid project ID format");
  }
}
```

---

## Best Practices

### 1. ID Validation
Always validate IDs before performing operations:
```typescript
private validateId(id: string, name = 'ID') {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException(`Invalid ${name}`);
  }
}
```

### 2. Hierarchical Consistency
Maintain the hierarchical structure:
```
Project
  └── Epic
        └── Story
              └── Task
                    └── Subtask
                    └── Bug
```

### 3. Status Management
Use appropriate status values for different entities:
- **Tasks/Subtasks:** 'todo', 'in-progress', 'done'
- **Bugs:** 'open', 'in-progress', 'resolved', 'closed'

### 4. Priority Levels
Use consistent priority levels across all entities:
```
'lowest' < 'low' < 'high' < 'highest'
```

### 5. User References
When assigning tasks, always use valid user IDs:
```typescript
const task = await projectService.updateTask(taskId, {
  assignee: new Types.ObjectId(userId)
});
```

### 6. Timestamp Tracking
All entities automatically track timestamps:
```typescript
// Automatically set by MongoDB
createdAt: "2025-12-29T10:00:00.000Z"
updatedAt: "2025-12-29T10:00:00.000Z"
```

### 7. Bug Attachment Management
Store attachment URLs/paths in the bugs:
```typescript
const bug = await projectService.createBug({
  title: "UI Issue",
  attachments: [
    "https://cdn.example.com/screenshot1.png",
    "https://cdn.example.com/error-log.txt"
  ]
});
```

### 8. Query Filtering
Use optional parameters for flexible querying:
```typescript
// Get bugs for specific task
const bugs = await projectService.getBugs(taskId, undefined, undefined);

// Get all project bugs
const bugs = await projectService.getBugs(undefined, undefined, projectId);
```

### 9. Error Response Consistency
All operations return consistent response formats:
```json
// Success
{ "_id": "...", "title": "...", ... }

// Deletion
{ "message": "Entity deleted successfully" }

// Error
{ "message": "Error description", "statusCode": 400 }
```

### 10. Pagination Consideration
For large datasets, consider implementing pagination (future enhancement):
```typescript
getProjects(page: number = 1, limit: number = 10): Promise<Project[]>
```

---

## Module Integration

To use this module in your NestJS application, import it in your `AppModule`:

```typescript
import { ProjectManagementModule } from './project-management/project-management.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/pm-tool'),
    ProjectManagementModule,
    // ... other modules
  ],
})
export class AppModule {}
```

---

## Future Enhancements

- [ ] Add pagination support for list endpoints
- [ ] Implement filtering by priority, status, and assignee
- [ ] Add bulk operations for updating multiple items
- [ ] Implement cascading deletes for hierarchical cleanup
- [ ] Add activity/audit logging for all operations
- [ ] Implement permission-based access control
- [ ] Add performance metrics and analytics
- [ ] Implement export functionality (CSV, PDF, etc.)
- [ ] Add search and full-text search capabilities
- [ ] Implement webhooks for external integrations

---

**Last Updated:** December 29, 2025
**Module Version:** 1.0.0
**NestJS Version:** Latest (18+)
**Node.js Version:** 18+
