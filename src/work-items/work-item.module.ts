import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemService } from './work-item.service';
import { ItemController } from './work-item.controller';
import { Item, ItemSchema } from './schemas/work-item.schema';
import { KanbanColumn, ColumnSchema } from '../kanban/column/schemas/column.schema';
import { KanbanBoard, KanbanBoardSchema } from '../kanban/board/schemas/kanban-board.schema';
import { UsersModule } from '../users/users.module';
import { MemberSchema } from '../member/schemas/member.schema';
import { WorkspacePermissionGuard } from '../common/guards/workspace-permission.guard';
import { Workspace, WorkspaceSchema } from '../workspace/schemas/workspace.schema';
import { HistoryService } from '../kanban/history/history.service';
import { Activity, ActivitySchema } from '../kanban/history/schemas/activity.schema';
import { NotificationModule } from '../kanban/notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: KanbanColumn.name, schema: ColumnSchema },
      { name: KanbanBoard.name, schema: KanbanBoardSchema },
      { name: 'Member', schema: MemberSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
    UsersModule,
    NotificationModule,
  ],
  controllers: [ItemController],
  providers: [ItemService, HistoryService, WorkspacePermissionGuard],
  exports: [ItemService],
})
export class ItemModule {}
