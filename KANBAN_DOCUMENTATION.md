# Kanban Module - Backend Documentation

**Project**: PM-Tool-Backend (Jira-related Project Management)  
**Module**: Kanban  
**Language**: TypeScript (NestJS)  
**Database**: MongoDB  
**Last Updated**: December 2025

---

## 📋 Table of Contents

1. [Module Overview](#module-overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [API Endpoints](#api-endpoints)
5. [Data Models/Schemas](#data-modelsschemas)
6. [Features & Functionalities](#features--functionalities)
7. [Dependencies & Related Modules](#dependencies--related-modules)

---

## 🎯 Module Overview

The **Kanban Module** is a comprehensive project management feature that implements the Kanban board methodology. It provides complete functionality for managing projects, workflows, work items, and related processes in a Kanban-based system.

### Key Capabilities:
- ✅ Project Management with team assignments
- ✅ Workflow Management with states and transitions
- ✅ Kanban Board with columns and swim lanes
- ✅ Work Item Management (Epic, Story, Task, Subtask, Bug, Improvement)
- ✅ Flow Metrics (Cycle Time, Lead Time, Throughput)
- ✅ Time Tracking and Estimation
- ✅ Work Item Linking and Dependencies
- ✅ Comments and Attachments
- ✅ Role-Based Access Control
- ✅ Advanced Reporting and Analytics
- ✅ Notifications System
- ✅ Audit Logging
- ✅ Search and Filtering

---

## 🏗️ Architecture

### Module Structure
```
src/kanban/
├── kanban.module.ts              (Main module configuration)
├── project/                      (Project Management)
├── roles/                        (Role Management)
├── workflow/                     (Workflow Management)
├── board/                        (Kanban Board)
├── work-item/                    (Work Items CRUD)
├── flow/                         (Flow Metrics)
├── estimation/                   (Estimation Management)
├── time-tracking/               (Time Tracking)
├── linking/                      (Work Item Linking)
├── comment/                      (Comments)
├── attachment/                   (Attachments)
├── notification/                 (Notifications)
├── report/                       (Reporting & Analytics)
├── dashboard/                    (Dashboard Widgets)
├── audit/                        (Audit Logging)
└── search/                       (Search & Filtering)
```

### Design Pattern
- **Service Layer**: Business logic encapsulation
- **Controller Layer**: HTTP endpoint handling
- **Schema Layer**: MongoDB data models
- **DTO Layer**: Data transfer objects for validation

---

## 📦 Core Components

### 1️⃣ **Kanban Project Module**
Manages Kanban projects with team members and metadata.

**Service**: `KanbanProjectService`  
**Controller**: `KanbanProjectController`  
**Route**: `/kanban/projects`

**Key Methods**:
- `create()` - Create a new Kanban project
- `findAll()` - Get all projects
- `findById()` - Get project by ID
- `update()` - Update project details
- `remove()` - Delete project
- `assignUser()` - Assign user to project
- `removeUser()` - Remove user from project

---

### 2️⃣ **Kanban Board Module**
Manages Kanban boards with columns, swim lanes, and WIP rules.

**Service**: `KanbanBoardService`  
**Controller**: `KanbanBoardController`  
**Route**: `/kanban/boards`

**Key Methods**:
- **Board Operations**:
  - `createBoard()` - Create Kanban board
  - `findAllBoards()` - Get all boards
  - `findBoardById()` - Get board by ID
  - `updateBoard()` - Update board
  - `deleteBoard()` - Delete board

- **Column Operations**:
  - `createColumn()` - Add column to board
  - `updateColumn()` - Update column
  - `deleteColumn()` - Remove column

- **Work Item Operations**:
  - `moveWorkItem()` - Move work item between columns

**Key Concepts**:
- Multiple columns per board (To Do, In Progress, In Review, Done, etc.)
- Swim lanes for grouping by team/priority
- WIP (Work In Progress) limits per column
- Drag-and-drop work item movement

---

### 3️⃣ **Work Item Module**
Central management for all types of work items.

**Service**: `WorkItemService`  
**Controller**: `WorkItemController`  
**Route**: `/kanban/items`

**Supported Work Item Types**:
- 🔹 **Epic** - Large features
- 🔹 **Story** - User stories/features
- 🔹 **Task** - Development tasks
- 🔹 **Subtask** - Sub-tasks of stories/tasks
- 🔹 **Bug** - Issues/bugs
- 🔹 **Improvement** - Enhancements

**Key Methods**:
- `create()` - Create work item
- `findAll()` - Get all work items
- `findById()` - Get work item by ID
- `update()` - Update work item
- `delete()` - Delete work item
- `moveStatus()` - Move item between workflow states
- `assignUser()` - Assign user to work item

**Key Attributes**:
- Title, description, priority, status
- Assignee, reporter, labels
- Created/updated timestamps
- Related epics and subtasks

---

### 4️⃣ **Workflow Management Module**
Defines workflow states, transitions, and activities.

**Service**: `WorkflowService`  
**Controller**: `WorkflowController`  
**Route**: `/workflows`

**Key Methods**:
- **Workflow CRUD**:
  - `create()` - Create workflow
  - `findAll()` - Get all workflows
  - `findById()` - Get workflow by ID
  - `update()` - Update workflow
  - `remove()` - Delete workflow

- **Workflow States**:
  - `createState()` - Add state to workflow
  - `getStates()` - Get all states
  - `removeState()` - Remove state

- **Workflow Transitions**:
  - `createTransition()` - Define state transition
  - `getTransitions()` - Get all transitions
  - `removeTransition()` - Remove transition

**Workflow States** (Example):
- Backlog → To Do → In Progress → In Review → Done
- Customizable per project

**Workflow Activities**: Track state change history

---

### 5️⃣ **Flow Metrics Module**
Calculates key performance indicators for Kanban.

**Service**: `FlowMetricsService`  
**Controller**: `FlowMetricsController`  
**Route**: `/kanban/metrics`

**Key Metrics**:

1. **Cycle Time**
   - Time from start to completion of a work item
   - Calculation: `completionDate - startDate`
   - Query: `GET /flow-metrics/cycle-time`

2. **Lead Time**
   - Time from request creation to completion
   - Calculation: `completionDate - createdDate`
   - Query: `GET /flow-metrics/lead-time`

3. **Throughput**
   - Number of items completed in a time period
   - Query: `GET /flow-metrics/throughput?boardId=xxx`

**Schemas**: 
- `CycleTime` - Stores cycle time data
- `LeadTime` - Stores lead time data
- `Throughput` - Stores throughput metrics

---

### 6️⃣ **Estimation Module**
Manages story points and effort estimation.

**Service**: `EstimationService`  
**Controller**: `EstimationController`  
**Route**: `/estimations`

**Key Methods**:
- `createEstimation()` - Create estimation
- `getAllEstimations()` - Get all estimations
- `getEstimationById()` - Get estimation by ID
- `updateEstimation()` - Update estimation
- `deleteEstimation()` - Delete estimation

**Estimation Types**:
- Story Points (1, 2, 3, 5, 8, 13, 21, etc.)
- Time-based estimation (hours/days)
- Custom scales

---

### 7️⃣ **Time Tracking Module**
Tracks time spent on work items and generates timesheets.

**Service**: `TimeTrackingService`  
**Controller**: `TimeTrackingController`  
**Route**: `/kanban/time-logs`

**Key Methods**:

- **Time Log Operations**:
  - `createTimeLog()` - Log time on work item
  - `getAllTimeLogs()` - Get all time logs
  - `getTimeLogById()` - Get specific time log
  - `updateTimeLog()` - Update time log
  - `deleteTimeLog()` - Delete time log

- **Timesheet Operations**:
  - `getTimesheet()` - Get timesheet for user/period
  - Parameters: `userId`, `weekStart`, `weekEnd`

**Data Tracked**:
- Time spent per work item
- User who logged time
- Date and duration
- Description/notes

---

### 8️⃣ **Work Item Linking Module**
Manages dependencies and relationships between work items.

**Service**: `WorkItemLinkService`  
**Controller**: `WorkItemLinkController`  
**Route**: `/kanban/links`

**Link Types**:
- **Depends on** - Item A depends on Item B
- **Blocks** - Item A blocks Item B
- **Relates to** - General relationship
- **Duplicates** - Item A duplicates Item B
- **Child of** - Subtask relationship
- **Parent of** - Epic/Story relationship

**Key Methods**:
- `createLink()` - Create link between items
- `getAllLinks()` - Get all links
- `getLinkById()` - Get link by ID
- `deleteLink()` - Remove link

---

### 9️⃣ **Comment Module**
Enables discussion on work items.

**Service**: `CommentService`  
**Controller**: `CommentController`  
**Route**: `/kanban/comments`

**Key Methods**:
- `createComment()` - Add comment to work item
- `getAllComments()` - Get all comments
- `getCommentById()` - Get specific comment
- `deleteComment()` - Delete comment

**Comment Features**:
- Text content
- Author information
- Timestamps
- Related work item
- Mentions support

---

### 🔟 **Attachment Module**
Manages file attachments on work items.

**Service**: `AttachmentService`  
**Controller**: `AttachmentController`  
**Route**: `/kanban/files`

**Key Methods**:
- `uploadAttachment()` - Upload file attachment
- `getAllAttachments()` - Get all attachments
- `getAttachmentById()` - Get attachment by ID
- `deleteAttachment()` - Delete attachment

**Supported**:
- File upload/download
- File metadata (name, size, type)
- Associated work items

---

### 1️⃣1️⃣ **Notification Module**
Manages user notifications and updates.

**Service**: `NotificationService`  
**Controller**: `NotificationController`  
**Route**: `/kanban/notifications`

**Key Methods**:
- `create()` - Create notification
- `findByUser()` - Get notifications for user
- `markAsRead()` - Mark notification as read
- `markAllAsRead()` - Mark all as read
- `delete()` - Delete notification

**Notification Triggers**:
- Work item assignment
- Status changes
- Comments added
- Mention in comments
- Assignment changes

---

### 1️⃣2️⃣ **Role Management Module**
Defines roles and permissions for Kanban projects.

**Service**: `KanbanRoleService`  
**Controller**: `KanbanRoleController`  
**Route**: `/kanban/roles`

**Key Methods**:
- `create()` - Create role
- `findAll()` - Get all roles
- `findById()` - Get role by ID
- `update()` - Update role
- `remove()` - Delete role

**Typical Roles**:
- Admin - Full control
- Lead/Manager - Team oversight
- Developer - Can work on items
- Viewer - Read-only access
- Custom roles

---

### 1️⃣3️⃣ **Report Module**
Advanced analytics and reporting.

**Service**: `KanbanReportService`  
**Controller**: `KanbanReportController`  
**Route**: `/kanban/reports`

**Report Types**:

1. **Cumulative Flow Report** (`GET /cumulative-flow`)
   - Shows count of items in each state over time
   - Helps identify bottlenecks
   - Data: `CumulativeFlowReport` schema

2. **Cycle Time Report** (`GET /cycle-time`)
   - Analysis of cycle times
   - Average, min, max, median
   - Trends over time

3. **Lead Time Report** (`GET /lead-time`)
   - Analysis of lead times
   - SLA compliance tracking
   - Forecast analysis

4. **Workload Report** (`GET /workload`)
   - Team member workload distribution
   - Utilization metrics
   - Capacity planning

**Query Parameters**: 
- `projectId` - Filter by project
- Date range filters

---

### 1️⃣4️⃣ **Dashboard Module**
Customizable dashboard widgets for visualization.

**Service**: `DashboardService`  
**Controller**: `DashboardController`  
**Route**: `/kanban/dashboard`

**Key Methods**:
- `createWidget()` - Add widget to dashboard
- `getWidgets()` - Get widgets for user/project
- `getWidget()` - Get single widget
- `updateWidget()` - Update widget
- `deleteWidget()` - Remove widget
- `toggleVisibility()` - Show/hide widget

**Widget Types**:
- Work item count
- Flow metrics
- Team workload
- Reports
- Burn-down charts
- Custom queries

---

### 1️⃣5️⃣ **Audit Module**
Tracks all changes and activities in the system.

**Service**: `AuditService`  
**Controller**: `AuditController`  
**Route**: `/kanban/audit`

**Key Methods**:
- `getAllLogs()` - Get audit logs with filters
- `getLogsByUser()` - Logs by user
- `getLogsByProject()` - Logs by project
- `getLogsByTarget()` - Logs for specific target

**Tracked Actions**:
- Create, Update, Delete operations
- Status changes
- Assignment changes
- Permission changes

**Log Data**:
- Action (create/update/delete)
- User who performed action
- Timestamp
- Target type (work item, board, etc.)
- Changes made

---

### 1️⃣6️⃣ **Search Module**
Advanced search and filtering capabilities.

**Service**: `SearchService`  
**Controller**: `SearchController`  
**Route**: `/kanban/search`

**Key Methods**:
- `createFilter()` - Save search filter
- `getFilters()` - Get saved filters
- `getFilter()` - Get filter details
- `updateFilter()` - Update saved filter
- `deleteFilter()` - Remove filter

**Search Criteria**:
- Work item status
- Assignee
- Priority
- Labels/tags
- Date ranges
- Custom fields
- Text search

**Saved Filters**:
- Store complex queries
- Reuse frequently used searches
- Share with team members

---

## 🔌 API Endpoints

### **Project Management** (`/kanban-projects`)
```
POST   /kanban-projects                  → Create project
GET    /kanban-projects                  → List all projects
GET    /kanban-projects/:id              → Get project by ID
PUT    /kanban-projects/:id              → Update project
DELETE /kanban-projects/:id              → Delete project
POST   /kanban-projects/:id/assign-user  → Assign user to project
POST   /kanban-projects/:id/remove-user/:userId → Remove user
```

### **Kanban Board** (`/boards`)
```
POST   /boards                           → Create board
GET    /boards                           → List all boards
GET    /boards/:id                       → Get board by ID
PUT    /boards/:id                       → Update board
DELETE /boards/:id                       → Delete board

POST   /boards/:boardId/columns          → Create column
PUT    /boards/:boardId/columns/:columnId → Update column
DELETE /boards/:boardId/columns/:columnId → Delete column

POST   /boards/:boardId/move-work-item   → Move item between columns
```

### **Work Items** (`/work-items`)
```
POST   /work-items                       → Create work item
GET    /work-items                       → List all work items
GET    /work-items/:id                   → Get work item by ID
PUT    /work-items/:id                   → Update work item
DELETE /work-items/:id                   → Delete work item
PUT    /work-items/:id/move-status       → Move to different status
PUT    /work-items/:id/assign-user       → Assign user
```

### **Workflow** (`/workflows`)
```
POST   /workflows                        → Create workflow
GET    /workflows                        → List all workflows
GET    /workflows/:id                    → Get workflow by ID
PUT    /workflows/:id                    → Update workflow
DELETE /workflows/:id                    → Delete workflow

POST   /workflows/:workflowId/states     → Create state
GET    /workflows/:workflowId/states     → Get states
DELETE /workflows/:workflowId/states/:stateId → Delete state

POST   /workflows/:workflowId/transitions → Create transition
GET    /workflows/:workflowId/transitions → Get transitions
DELETE /workflows/:workflowId/transitions/:transitionId → Delete transition
```

### **Flow Metrics** (`/flow-metrics`)
```
GET    /flow-metrics/cycle-time          → Calculate cycle time
GET    /flow-metrics/lead-time           → Calculate lead time
GET    /flow-metrics/throughput?boardId=xxx → Get throughput
```

### **Estimation** (`/estimations`)
```
POST   /estimations                      → Create estimation
GET    /estimations                      → Get all estimations
GET    /estimations/:id                  → Get estimation by ID
PUT    /estimations/:id                  → Update estimation
DELETE /estimations/:id                  → Delete estimation
```

### **Time Tracking** (`/time-tracking`)
```
POST   /time-tracking/logs               → Create time log
GET    /time-tracking/logs               → Get all time logs
GET    /time-tracking/logs/:id           → Get time log by ID
PUT    /time-tracking/logs/:id           → Update time log
DELETE /time-tracking/logs/:id           → Delete time log
GET    /time-tracking/timesheets/:userId?weekStart=&weekEnd= → Get timesheet
```

### **Work Item Links** (`/work-item-links`)
```
POST   /work-item-links                  → Create link
GET    /work-item-links                  → Get all links
GET    /work-item-links/:id              → Get link by ID
DELETE /work-item-links/:id              → Delete link
```

### **Comments** (`/comments`)
```
POST   /comments                         → Create comment
GET    /comments                         → Get all comments
GET    /comments/:id                     → Get comment by ID
DELETE /comments/:id                     → Delete comment
```

### **Attachments** (`/attachments`)
```
POST   /attachments                      → Upload attachment
GET    /attachments                      → Get all attachments
GET    /attachments/:id                  → Get attachment by ID
DELETE /attachments/:id                  → Delete attachment
```

### **Notifications** (`/notifications`)
```
POST   /notifications                    → Create notification
GET    /notifications/user/:userId       → Get user notifications
PATCH  /notifications/:id/read           → Mark as read
PATCH  /notifications/user/:userId/read-all → Mark all as read
DELETE /notifications/:id                → Delete notification
```

### **Roles** (`/kanban-roles`)
```
POST   /kanban-roles                     → Create role
GET    /kanban-roles                     → List all roles
GET    /kanban-roles/:id                 → Get role by ID
PUT    /kanban-roles/:id                 → Update role
DELETE /kanban-roles/:id                 → Delete role
```

### **Reports** (`/kanban/reports`)
```
GET    /kanban/reports/cumulative-flow?projectId=&dateFrom=&dateTo= → Cumulative flow
GET    /kanban/reports/cycle-time?projectId=&dateFrom=&dateTo= → Cycle time
GET    /kanban/reports/lead-time?projectId=&dateFrom=&dateTo= → Lead time
GET    /kanban/reports/workload?projectId= → Workload
```

### **Dashboard** (`/kanban/dashboard`)
```
POST   /kanban/dashboard/widget          → Create widget
GET    /kanban/dashboard/widgets?projectId=&userId= → Get widgets
GET    /kanban/dashboard/widget/:id      → Get widget by ID
PUT    /kanban/dashboard/widget/:id      → Update widget
DELETE /kanban/dashboard/widget/:id      → Delete widget
PUT    /kanban/dashboard/widget/:id/toggle-visibility → Toggle visibility
```

### **Audit** (`/kanban/audit`)
```
GET    /kanban/audit?projectId=&userId=&action=&targetType= → Get audit logs
GET    /kanban/audit/user/:userId        → Logs by user
GET    /kanban/audit/project/:projectId  → Logs by project
GET    /kanban/audit/target/:targetType/:targetId → Logs by target
```

### **Search** (`/kanban/search`)
```
POST   /kanban/search/filter             → Save filter
GET    /kanban/search/filters?projectId=&userId= → Get filters
GET    /kanban/search/filter/:id         → Get filter by ID
PUT    /kanban/search/filter/:id         → Update filter
DELETE /kanban/search/filter/:id         → Delete filter
```

---

## 📊 Data Models/Schemas

### **KanbanProject Schema**
```typescript
{
  _id: ObjectId,
  name: string,                 // Project name
  description: string,
  key: string,                  // Short key (e.g., "JIRA")
  owner: ObjectId,              // User reference
  members: ObjectId[],          // Team members
  roles: KanbanRole[],          // Role assignments
  workflows: ObjectId[],        // Associated workflows
  boards: ObjectId[],           // Associated boards
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

### **KanbanBoard Schema**
```typescript
{
  _id: ObjectId,
  name: string,
  projectId: ObjectId,
  columns: KanbanColumn[],      // Board columns
  swimlanes: Swimlane[],        // Swim lanes
  wipRules: WipRule[],          // WIP limits
  workflowId: ObjectId,
  createdAt: Date,
  updatedAt: Date,
}
```

### **KanbanColumn Schema**
```typescript
{
  _id: ObjectId,
  name: string,
  position: number,
  wipLimit: number,             // Work in progress limit
  workItems: ObjectId[],        // Items in column
  color: string,                // UI color
  createdAt: Date,
}
```

### **WorkItem Schema** (Base)
```typescript
{
  _id: ObjectId,
  key: string,                  // Unique identifier (e.g., "JIRA-123")
  type: string,                 // Epic, Story, Task, Bug, etc.
  title: string,
  description: string,
  status: string,               // Workflow state
  priority: string,             // High, Medium, Low
  assignee: ObjectId,           // User reference
  reporter: ObjectId,
  labels: string[],
  storyPoints: number,
  estimatedHours: number,
  actualHours: number,
  createdAt: Date,
  updatedAt: Date,
  dueDate: Date,
  epicId: ObjectId,             // Parent epic (if applicable)
  parentId: ObjectId,           // Parent item (for subtasks)
  subtasks: ObjectId[],         // Child items
  links: ObjectId[],            // Related work items
  comments: ObjectId[],
  attachments: ObjectId[],
}
```

### **Workflow Schema**
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  projectId: ObjectId,
  states: WorkflowState[],      // Workflow states
  transitions: WorkflowTransition[], // State transitions
  activities: WorkflowActivity[],    // Activity history
  isDefault: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

### **WorkflowState Schema**
```typescript
{
  _id: ObjectId,
  name: string,
  workflowId: ObjectId,
  category: string,             // "TODO", "IN_PROGRESS", "DONE"
  isInitial: boolean,           // Starting state
  isFinal: boolean,             // Ending state
  color: string,
}
```

### **WorkflowTransition Schema**
```typescript
{
  _id: ObjectId,
  workflowId: ObjectId,
  fromStateId: ObjectId,
  toStateId: ObjectId,
  name: string,
  conditions: string[],         // Conditions for transition
  actions: string[],            // Actions on transition
}
```

### **Estimation Schema**
```typescript
{
  _id: ObjectId,
  workItemId: ObjectId,
  type: string,                 // "STORY_POINTS", "HOURS", "DAYS"
  value: number,
  originalEstimate: number,
  remainingEstimate: number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
}
```

### **TimeLog Schema**
```typescript
{
  _id: ObjectId,
  workItemId: ObjectId,
  userId: ObjectId,
  duration: number,             // In hours
  date: Date,
  description: string,          // What was worked on
  billable: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

### **WorkItemLink Schema**
```typescript
{
  _id: ObjectId,
  sourceItemId: ObjectId,
  targetItemId: ObjectId,
  linkType: string,             // "DEPENDS_ON", "BLOCKS", "RELATES_TO", etc.
  description: string,
  createdAt: Date,
}
```

### **Comment Schema**
```typescript
{
  _id: ObjectId,
  workItemId: ObjectId,
  author: ObjectId,
  content: string,
  mentions: ObjectId[],         // Mentioned users
  createdAt: Date,
  updatedAt: Date,
}
```

### **Attachment Schema**
```typescript
{
  _id: ObjectId,
  workItemId: ObjectId,
  fileName: string,
  fileUrl: string,
  fileSize: number,
  fileType: string,
  uploadedBy: ObjectId,
  uploadedAt: Date,
}
```

### **Notification Schema**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  type: string,                 // "ASSIGNED", "COMMENTED", "STATUS_CHANGED"
  title: string,
  message: string,
  targetId: ObjectId,           // Related entity
  isRead: boolean,
  createdAt: Date,
}
```

### **KanbanRole Schema**
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  permissions: string[],        // Permission list
  projectId: ObjectId,
  isSystem: boolean,            // System roles
  createdAt: Date,
}
```

### **AuditLog Schema**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  action: string,               // "CREATE", "UPDATE", "DELETE"
  targetType: string,           // Entity type
  targetId: ObjectId,
  changes: Object,              // What changed
  projectId: ObjectId,
  timestamp: Date,
}
```

### **SavedFilter Schema**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  projectId: ObjectId,
  name: string,
  filterCriteria: Object,       // Filter query
  isShared: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

### **CumulativeFlowReport Schema**
```typescript
{
  _id: ObjectId,
  projectId: ObjectId,
  boardId: ObjectId,
  date: Date,
  stateData: {
    [stateName]: number,        // Count of items in each state
  },
  createdAt: Date,
}
```

---

## ✨ Features & Functionalities

### 🎯 Project Management
- Create/manage multiple Kanban projects
- Assign team members with roles
- Project settings and configurations
- Project archiving/deletion

### 📋 Board Management
- Multiple boards per project
- Customizable columns
- Swim lanes for grouping (by priority, team, epic, etc.)
- WIP limit enforcement
- Drag-and-drop work item movement
- Column sorting and organization

### 🏷️ Work Item Management
- Support for 6 work item types: Epic, Story, Task, Subtask, Bug, Improvement
- Full CRUD operations
- Status tracking through workflow
- Priority levels
- Assignee management
- Due dates and estimates
- Labels and categorization
- Hierarchical relationships (Epic → Story → Task → Subtask)

### 🔄 Workflow Management
- Custom workflow definitions per project
- States and transitions
- Workflow activity tracking
- Default workflow templates
- Conditional transitions
- Action automation on transitions

### 📊 Flow Metrics & Analytics
- **Cycle Time**: Track time from start to completion
- **Lead Time**: Track time from creation to completion
- **Throughput**: Items completed per time period
- Helps identify process bottlenecks
- Data-driven decision making

### ⏱️ Estimation & Tracking
- Story point estimation
- Time-based estimation (hours/days)
- Actual time logging
- Remaining estimate tracking
- Burn-down tracking
- Capacity planning

### ⏰ Time Tracking
- Log time spent on work items
- Daily/weekly time logging
- Timesheet generation
- Team utilization reports
- Billable hours tracking

### 🔗 Work Item Linking
- Define dependencies between items
- Block relationships
- Duplicate identification
- Parent-child relationships
- Impact analysis on changes

### 💬 Collaboration Features
- Add comments to work items
- @mention team members
- Threaded discussions
- File attachments
- Discussion history

### 📎 Attachment Management
- Upload files to work items
- File versioning
- Access control
- Multiple attachment support
- File type tracking

### 🔔 Notifications
- Real-time notifications
- Assignment alerts
- Status change notifications
- Comment mentions
- Read/unread tracking
- Notification management

### 👥 Role-Based Access Control
- System roles (Admin, Lead, Developer, Viewer)
- Custom role creation
- Permission management
- Project-level role assignment
- Fine-grained access control

### 📈 Reporting & Analytics
- Cumulative Flow Diagram
- Cycle Time distribution
- Lead Time analysis
- Workload distribution
- Team velocity
- SLA tracking
- Custom report generation
- Export capabilities

### 📊 Dashboard
- Customizable dashboard widgets
- Drag-and-drop widget arrangement
- Widget visibility toggle
- User-specific dashboards
- Project-level dashboards
- Real-time metric updates

### 🔍 Search & Filtering
- Advanced search capabilities
- Multi-criteria filtering
- Saved filter management
- Text search
- Date range filtering
- Custom field filtering
- Shared filters

### 📝 Audit & Compliance
- Complete audit logging
- User action tracking
- Change history
- Compliance reporting
- Data integrity verification
- Audit trails

---

## 🔌 Dependencies & Related Modules

### **External Dependencies**
- **NestJS**: Framework core
- **MongoDB/Mongoose**: Database
- **Node.js**: Runtime environment

### **Related Modules**
```
├── Auth Module
│   └── Used for: User authentication, permissions
├── Users Module  
│   └── Used for: User profiles, team members
├── Email Module
│   └── Used for: Notification emails, alerts
├── Common Module
│   └── Used for: Guards, decorators, utilities
├── Project Management Module
│   └── Used for: Project integration
└── Audit Log Module
    └── Used for: Centralized audit tracking
```

### **Integration Points**
- **Auth**: Token verification, role checks
- **Users**: User profiles, avatar, contact info
- **Email**: Send notifications, reports
- **Common Guards**: Access control, rate limiting
- **Database**: MongoDB persistence
- **Event Emitters**: Real-time updates (WebSocket ready)

---

## 🚀 Key Features Summary

| Feature | Status | Implementation |
|---------|--------|-----------------|
| Project Management | ✅ Implemented | Full CRUD + team assignment |
| Kanban Board | ✅ Implemented | Columns, swim lanes, WIP limits |
| Work Items (6 types) | ✅ Implemented | Epic, Story, Task, Subtask, Bug, Improvement |
| Workflow States | ✅ Implemented | Custom states, transitions |
| Flow Metrics | ✅ Implemented | Cycle time, lead time, throughput |
| Time Tracking | ✅ Implemented | Time logs, timesheets |
| Estimation | ✅ Implemented | Story points, hours |
| Work Item Linking | ✅ Implemented | Dependencies, blocks, relates-to |
| Comments | ✅ Implemented | Threaded discussions, mentions |
| Attachments | ✅ Implemented | File uploads, metadata |
| Notifications | ✅ Implemented | Real-time alerts, user preferences |
| Roles & Permissions | ✅ Implemented | System & custom roles |
| Reporting | ✅ Implemented | CFD, cycle time, lead time, workload |
| Dashboard | ✅ Implemented | Customizable widgets, visualizations |
| Audit Logging | ✅ Implemented | Complete action tracking |
| Search/Filtering | ✅ Implemented | Advanced search, saved filters |

---

## 📚 Usage Examples

### Create a Project
```bash
POST /kanban-projects
{
  "name": "Mobile App Development",
  "description": "Build new mobile app",
  "key": "MAD"
}
```

### Create a Work Item
```bash
POST /work-items
{
  "title": "Implement login screen",
  "type": "Story",
  "priority": "High",
  "storyPoints": 5,
  "assignee": "userId123"
}
```

### Move Work Item
```bash
PUT /work-items/itemId/move-status
{
  "newStatus": "In Progress",
  "fromStatus": "To Do"
}
```

### Get Flow Metrics
```bash
GET /flow-metrics/cycle-time?boardId=boardId123&dateFrom=2025-01-01&dateTo=2025-12-31
```

### Generate Report
```bash
GET /kanban/reports/cumulative-flow?projectId=projectId123&dateFrom=2025-01-01&dateTo=2025-12-31
```

---

## 🎓 Best Practices

1. **Workflow Design**: Keep workflows simple but meaningful
2. **Estimation**: Use story points for relative sizing
3. **Time Tracking**: Log time regularly for accuracy
4. **Audit**: Review audit logs regularly for compliance
5. **Roles**: Assign appropriate roles to prevent data access issues
6. **Notifications**: Configure notifications to reduce noise
7. **Reporting**: Use reports for decision-making
8. **Backlog**: Maintain and prioritize backlog regularly

---

## 📞 Support & Documentation

For more information or issues:
- Check the controller classes for API implementations
- Review schemas for data structure details
- Check DTOs for request/response validation
- Review service layer for business logic

---

**End of Kanban Module Documentation**
