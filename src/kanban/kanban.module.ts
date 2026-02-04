// src/kanban/kanban.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailModule } from '../email/email.module';
import { MemberModule } from '../member/member.module';
import { WorkspacePermissionGuard } from '../common/guards/workspace-permission.guard';

import { Workspace, WorkspaceSchema } from '../workspace/schemas/workspace.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MemberSchema } from '../member/schemas/member.schema';
import { Item, ItemSchema } from '@/work-items/schemas/work-item.schema';

// Board
import { KanbanBoardController } from './board/kanban-board.controller';
import { KanbanBoardService } from './board/kanban-board.service';
import { KanbanBoard, KanbanBoardSchema } from './board/schemas/kanban-board.schema';
import { ColumnSchema } from './column/schemas/column.schema';
import { WipRule, WipRuleSchema } from './board/schemas/wip-rule.schema';
import { Swimlane, SwimlaneSchema } from './board/schemas/swimlane.schema';

// Work Item
import { WorkItemController } from './work-item/work-item.controller';
import { WorkItemService } from './work-item/work-item.service';
import { WorkItem, WorkItemSchema } from './work-item/schemas/work-item.schema';
import { Epic, EpicSchema } from './work-item/schemas/epic.schema';
import { Story, StorySchema } from './work-item/schemas/story.schema';
import { Task, TaskSchema } from './work-item/schemas/task.schema';
import { Subtask, SubtaskSchema } from './work-item/schemas/subtask.schema';
import { Bug, BugSchema } from './work-item/schemas/bug.schema';
import { Improvement, ImprovementSchema } from './work-item/schemas/improvement.schema';

// Estimation
import { EstimationController } from './estimation/estimation.controller';
import { EstimationService } from './estimation/estimation.service';
import { Estimation, EstimationSchema } from './estimation/schemas/estimation.schema';

// Time Tracking
// DISABLED: Using new TimeLogModule from src/time-log instead

// Comment
import { CommentController } from './comment/comment.controller';
import { CommentService } from './comment/comment.service';
import { Comment, CommentSchema } from './comment/schemas/comment.schema';

// Attachment
import { AttachmentController } from './attachment/attachment.controller';
import { AttachmentService } from './attachment/attachment.service';
import { Attachment, AttachmentSchema } from './attachment/schemas/attachment.schema';

// Notification
import { NotificationModule } from './notification/notification.module';

// Report
import { KanbanReportController } from './report/kanban-report.controller';
import { KanbanReportService } from './report/kanban-report.service';
import {
  CumulativeFlowReport,
  CumulativeFlowReportSchema,
} from './report/schemas/cumulative-flow-report.schema';
import { CycleTimeReport, CycleTimeReportSchema } from './report/schemas/cycle-time-report.schema';
import { LeadTimeReport, LeadTimeReportSchema } from './report/schemas/lead-time-report.schema';
import { WorkloadReport, WorkloadReportSchema } from './report/schemas/workload-report.schema';

// Dashboard
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import {
  DashboardWidget,
  DashboardWidgetSchema,
} from './dashboard/schemas/dashboard-widget.schema';

// Audit
import { AuditController } from './audit/audit.controller';
import { AuditService } from './audit/audit.service';
import { AuditLog, AuditLogSchema } from './audit/schemas/audit-log.schema';
// History
import { HistoryController } from './history/history.controller';
import { HistoryService } from './history/history.service';
import { Activity, ActivitySchema } from './history/schemas/activity.schema';

// Search
import { SearchController } from './search/search.controller';
import { SearchService } from './search/search.service';
import { SavedFilter, SavedFilterSchema } from './search/schemas/saved-filter.schema';

// Column
import { KanbanColumn } from './column/schemas/column.schema';
import { ColumnService } from './column/column.service';
import { ColumnController } from './column/column.controller';

@Module({
  imports: [
    NotificationModule,
    EmailModule,
    MemberModule, // ✅ REQUIRED for MemberService in guards

    EmailModule,
    MemberModule, // ✅ REQUIRED for MemberService in guards

    NotificationModule,
    MongooseModule.forFeature([
      // Board
      { name: KanbanBoard.name, schema: KanbanBoardSchema },
      { name: WipRule.name, schema: WipRuleSchema },
      { name: Swimlane.name, schema: SwimlaneSchema },

      // Column
      { name: KanbanColumn.name, schema: ColumnSchema },

      // Work Item
      { name: WorkItem.name, schema: WorkItemSchema },
      { name: Epic.name, schema: EpicSchema },
      { name: Story.name, schema: StorySchema },
      { name: Task.name, schema: TaskSchema },
      { name: Subtask.name, schema: SubtaskSchema },
      { name: Bug.name, schema: BugSchema },
      { name: Improvement.name, schema: ImprovementSchema },

      // Estimation
      { name: Estimation.name, schema: EstimationSchema },

      // Comment
      { name: Comment.name, schema: CommentSchema },

      // Attachment
      { name: Attachment.name, schema: AttachmentSchema },

      // Report
      { name: CumulativeFlowReport.name, schema: CumulativeFlowReportSchema },
      { name: CycleTimeReport.name, schema: CycleTimeReportSchema },
      { name: LeadTimeReport.name, schema: LeadTimeReportSchema },
      { name: WorkloadReport.name, schema: WorkloadReportSchema },

      // Dashboard
      { name: DashboardWidget.name, schema: DashboardWidgetSchema },

      // Audit
      { name: AuditLog.name, schema: AuditLogSchema },
      // Activity / History
      { name: Activity.name, schema: ActivitySchema },

      // Search
      { name: SavedFilter.name, schema: SavedFilterSchema },

      // Workspace & User
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: User.name, schema: UserSchema },
      { name: 'Member', schema: MemberSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
  ],

  controllers: [
    KanbanBoardController,
    WorkItemController,
    // TimeTrackingController, // DISABLED: Using new TimeLogModule from src/time-log instead
    AttachmentController,
    KanbanReportController,
    DashboardController,
    AuditController,
    HistoryController,
    SearchController,
    ColumnController,
    CommentController,
    EstimationController,
  ],

  providers: [
    KanbanBoardService,
    WorkItemService,
    // TimeTrackingService, // DISABLED: Using new TimeLogModule from src/time-log instead
    AttachmentService,
    KanbanReportService,
    DashboardService,
    AuditService,
    HistoryService,
    SearchService,
    ColumnService,
    CommentService,
    EstimationService,
    WorkspacePermissionGuard,
  ],
})
export class KanbanModule {}
