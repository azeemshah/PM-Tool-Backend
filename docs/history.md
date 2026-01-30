**History Section — Documentation**

Overview
- Purpose: Provide a user-centric timeline/table view that shows everything a user did in the project: tasks created, edited, moved between boards/statuses, time logged on tasks, and status transitions (e.g., To Do -> In Progress -> Done).
- Where: new UI route `/history` (frontend) + backend API `/api/history`.

User Stories
- As a user I can view my activity history across projects and tasks.
- As a user I can filter by date range, event type (create/edit/move/time-logged/status-change), task, and project.
- As a user I can sort and paginate through history entries.

**Data model (Activity / Audit log)**
- Collection/table name: `activities` (or `activity_logs`)
- Example fields (Mongo/Mongoose):

```js
const ActivitySchema = new Schema({
  userId: { type: ObjectId, required: true, ref: 'User' },
  projectId: { type: ObjectId, ref: 'Project' },
  taskId: { type: ObjectId, ref: 'Task' },
  type: { type: String, enum: ['create','edit','move','status_change','time_logged','comment'], required: true },
  details: { type: Object }, // free-form details depending on type
  from: { type: String },   // used for move/status_change (e.g. "To Do")
  to: { type: String },     // used for move/status_change (e.g. "In Progress")
  timeSpentSeconds: { type: Number }, // used for time_logged
  metadata: { type: Object }, // e.g., diff, changedFields, ip, userAgent
  createdAt: { type: Date, default: Date.now }
});
```

Notes:
- `details` should include useful context: edited fields, old/new values, comment text, board/column ids for moves.
- Keep schema minimal and append `metadata` for future flexibility.

**API design (backend)**
- GET /api/history?userId={id}&projectId={id}&type={type}&from={date}&to={date}&page=1&limit=20
  - Returns paginated history for the requested user (admin can query other users)
- GET /api/projects/:projectId/history?userId={id}&... (project-scoped view)
- POST /api/activities (internal) — used by backend services to create an activity record

Sample response (GET /api/history):

```json
{
  "total": 124,
  "page": 1,
  "limit": 20,
  "items": [
    {
      "_id":"...",
      "userId":"...",
      "taskId":"...",
      "projectId":"...",
      "type":"move",
      "from":"Backlog",
      "to":"In Progress",
      "details": { "columnId": ".." },
      "createdAt":"2026-01-27T11:22:33.000Z"
    }
  ]
}
```

**Backend implementation notes (NestJS / existing repo)**
- New service: `ActivityService` (suggested location: [src/common/services/activity.service.ts](src/common/services/activity.service.ts))
  - Methods: `log(activityDto)`, `list(query)`, `getById(id)`
- New controller: `HistoryController` or `ActivityController` (suggested: [src/kanban/history.controller.ts](src/kanban/history.controller.ts)) with `GET /api/history`.
- Integration points: in `TaskService` (where tasks are created/edited/moved) call `ActivityService.log(...)` with appropriate payload.
- For time logging: when a user logs time (the existing time-log service), call `ActivityService.log({ type: 'time_logged', timeSpentSeconds, taskId, userId, projectId })`.
- Keep log creation fire-and-forget or non-blocking (do not block task operations on logging).

**Frontend UI (History page)**
- Route: `/history`
- Visual: Table similar to the attached screenshot (see examples in images). Show one row per activity.
- Recommended columns:
  - Checkbox (multi-select)
  - Timestamp (when activity happened)
  - Event Type (badge: Create/Edit/Move/Status/Time)
  - Task Title (link to task)
  - Details (compact summary: "Moved from Backlog to In Progress", "Edited: title, dueDate")
  - Time Spent (if any, humanized, e.g., "1h 30m")
  - Project / Board
  - Performed By (avatar + name)
  - Actions (open task, view full activity details)

UX / Filtering
- Filters: date range, event type, task, project, assignedTo
- Sorting: newest first (default), allow time asc/desc
- Pagination: server-side (page+limit)

**Table behavior matching the screenshot**
- Keep the overall layout and controls (filters above, columns dropdown, rows per page control, pagination controls).
- For each row show a small colored badge for `type` and a human-friendly timestamp (e.g., "Jan 27, 2026 — 11:22 AM").

**Sample front-end data mapping**
- API item -> UI row mapping:
  - `createdAt` -> Timestamp
  - `type` -> Badge
  - `taskId` -> fetch task title (or include `taskTitle` in activity record)
  - `from` + `to` or `details` -> Details column
  - `timeSpentSeconds` -> Time Spent column

**Security & privacy**
- Only show history entries the requesting user is allowed to see. Project-level permissions apply.
- Admin roles may request history for other users.

**Performance**
- Index `createdAt`, `userId`, `taskId`, and `projectId` to enable fast queries.
- Use pagination and limit response fields for list endpoints.

**Implementation checklist (next steps)**
1. Add Mongoose schema and index for `activities` (DB). 
2. Add `ActivityService` and `ActivityController` endpoints.
3. Add log calls in `TaskService`, `TimeLogService`, and other places where relevant.
4. Create frontend `History` page and table component, wire to API.
5. Add seed data + a small e2e test to validate entries appear in UI.

**Example Mongoose model & simple service snippet**
```js
// src/common/schemas/activity.schema.ts
import { Schema } from 'mongoose';
export const ActivitySchema = new Schema({ /* schema from above */ });

// src/common/services/activity.service.ts
class ActivityService {
  constructor(@InjectModel('Activity') private activityModel){}
  async log(dto){
    return this.activityModel.create(dto);
  }
  async list(query){
    // implement filtering, sorting, pagination
  }
}
```

**Wireframe note (based on attachment)**
- Use a table with light borders and badges for event types, mirroring the look in the second attachment. Add a right-side actions menu for each row.

---

If you want, I can now: implement the backend schema and endpoints, or scaffold the frontend History page. Which should I do next? (I can start with the DB + backend so the API is ready for the UI.)
