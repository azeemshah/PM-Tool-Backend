Time logging already exists (backend):

Time-log schema & API: time-log.schema.ts, time-log.controller.ts, time-log.service.ts
Fields present: workItemId, userId, timeSpent (minutes), logDate.
Summary of implemented time & estimation changes

Work item schema: work-item.schema.ts
Missing: originalEstimate, remainingEstimate, storyPoints, aggregated timeSpent on the item.
TimeLog exists (backend): `src/time-log/schemas/time-log.schema.ts`, `src/time-log/time-log.controller.ts`, `src/time-log/time-log.service.ts`. Fields: `workItemId`, `userId`, `timeSpent` (minutes), `logDate`.
Work item schema now includes estimation/time fields: `originalEstimate`, `remainingEstimate`, `timeSpent`, `storyPoints` (see `src/work-items/schemas/work-item.schema.ts`). All time fields use minutes and default to `0` (storyPoints default null).
Frontend types and UI:

Issue/Item types: index.ts — no estimation fields.
Task/Issue UI and creation dialog: Issues.tsx, IssueCreateDialog.tsx — current UI does not surface estimates or time logging.
Frontend currently supports issue types epic | story | task | bug | subtask (confirmed in UI/types).
Entities present and hierarchy:

Entities supported: Epic, Story, Task, Subtask, Bug (see frontend types and backend Item.type enum).
Parent relationships:
Epic is top-level.
Story/Task/Bug can have parent pointing to an epic.
Subtask has parent pointing to Story/Task/Bug.
Materialized path stored on Item for hierarchy queries.
Files: index.ts, work-item.schema.ts
Where status changes and logging hook in now:

Status / column moves are handled in backend:
ItemService.moveToColumn() and ItemService.moveToBacklog() — status changes on column moves: work-item.service.ts
Generic updates go through ItemService.update() which logs moves when status or column changes.
Time logging endpoint is separate: /time-logs (POST) → TimeLogService.create() and read endpoints /time-logs/issue/:issueId, /time-logs/user/:userId.
Hook points to integrate: after TimeLogService.create() (update issue remaining estimate / aggregate), and in ItemService.update() / moveToColumn() to record history or adjust estimates on transitions (if desired).
Notes / Recommendations (do not duplicate existing APIs):

Extend existing Item schema (backend) — do NOT create new separate fields elsewhere:

Add fields: originalEstimate?: number (minutes), remainingEstimate?: number (minutes), storyPoints?: number.
Optionally add totalTimeSpent?: number (computed/cached) or compute on demand by summing TimeLog entries for the item.
Update DTOs: CreateItemDto, UpdateItemDto to accept these fields.
Update backend indexes if you need queries by estimates.
Time-log behavior:

Keep existing /time-logs APIs.
In TimeLogService.create() (or via a new helper), after creating a time log:
	- The project now exposes item-level endpoints to manage estimates and log work. Use these instead of directly calling `/time-logs` when you want automatic aggregation.
	- New endpoints (under `items` controller):
		- `POST /items/:id/estimate` — set `originalEstimate` (minutes). Rejected when the item has children.
		- `POST /items/:id/log-work` — log work against an item; request body `{ timeSpent:number (minutes), comment?:string, adjustRemaining?:boolean }`. Creates a `TimeLog` entry and updates the item's `timeSpent` and `remainingEstimate` (if `adjustRemaining` is true). Propagates aggregation to parents.
		- `GET  /items/:id/time-tracking` — returns item estimate summary and a list of time logs.

	- The `ItemService` exposes helpers: `setEstimate`, `logWork`, `getTimeTracking`, `recalculateParentTime`.
Ensure history/audit logging uses existing historyService.log() calls so activity appears in history.
Frontend changes:

Extend types (CreateItemDto, TaskType, Issue) to include originalEstimate, remainingEstimate, storyPoints.
File to update: index.ts
Update IssueCreateDialog to optionally accept originalEstimate and storyPoints on create.
Add a lightweight "Log Work" UI on issue view and/or issue list row that calls POST /time-logs with { workItemId, userId, timeSpent, logDate }.
On success, re-fetch item and time-log list.
Add a UI to show aggregated timeSpent and remainingEstimate on the issue details and in the issue list/table.
Hook points to implement (minimal, non-breaking):

Schema + DTO updates (backend).
Update ItemService.create() to set originalEstimate / remainingEstimate when present.
Enhance TimeLogService.create() to update Item's remainingEstimate and optionally totalTimeSpent. Keep creation idempotent for tests.
Frontend: add fields in create/edit dialogs and a "Log Work" dialog or quick action that calls existing /time-logs API.
Add small README docs describing fields, units (minutes), and expected behavior (remainingEstimate auto-decrement vs manual control).
Next suggested tasks (I can implement these next):

Patch backend Item schema + DTOs to add originalEstimate, remainingEstimate, storyPoints.
Update TimeLogService.create() to update the associated Item's remaining estimate safely.
Add frontend type updates and minimal UI for "Log Work" and showing estimates.
Add small documentation markdown describing API contract and UI changes.
Which next step would you like me to implement first? Options:

A) Backend schema + DTO + service changes (safe, minimal).
B) Frontend type + create-dialog + log-work UI.
C) Add backend automatic remainingEstimate update on time-log create.
D) Generate documentation only (design + API spec).