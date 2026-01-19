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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: 'Member', schema: MemberSchema },
      { name: Item.name, schema: ItemSchema },
      { name: KanbanBoard.name, schema: KanbanBoardSchema },
      { name: KanbanColumn.name, schema: ColumnSchema },
    ]),
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
