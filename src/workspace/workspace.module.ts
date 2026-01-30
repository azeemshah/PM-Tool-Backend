import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { MemberSchema } from '../member/schemas/member.schema';
import { WorkItem, WorkItemSchema } from '../kanban/work-item/schemas/work-item.schema';
import { KanbanBoard, KanbanBoardSchema } from '../kanban/board/schemas/kanban-board.schema';
import { KanbanColumn, ColumnSchema } from '../kanban/column/schemas/column.schema';
import { Item, ItemSchema } from '@/work-items/schemas/work-item.schema';
import { CommentSchema } from '../kanban/comment/schemas/comment.schema';
import { AttachmentSchema } from '../kanban/attachment/schemas/attachment.schema';
import { TimeLogSchema } from '../kanban/time-tracking/schemas/time-log.schema';
import { NotificationSchema } from '../kanban/notification/schemas/notification.schema';
import { SavedFilterSchema } from '../kanban/search/schemas/saved-filter.schema';
import { SprintSchema } from '../sprint/schemas/sprint.schema';
import { WorkspacePermissionGuard } from '../common/guards/workspace-permission.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: 'Member', schema: MemberSchema },
      { name: Item.name, schema: ItemSchema },
      { name: KanbanBoard.name, schema: KanbanBoardSchema },
      { name: KanbanColumn.name, schema: ColumnSchema },
      { name: 'Comment', schema: CommentSchema },
      { name: 'Attachment', schema: AttachmentSchema },
      { name: 'TimeLog', schema: TimeLogSchema },
      { name: 'Notification', schema: NotificationSchema },
      { name: 'SavedFilter', schema: SavedFilterSchema },
      { name: 'Sprint', schema: SprintSchema },
    ]),
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspacePermissionGuard],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
