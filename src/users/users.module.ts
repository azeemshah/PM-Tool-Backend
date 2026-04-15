import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { UserCurrentController } from './user.current.controller';
import { MemberSchema } from '../member/schemas/member.schema';
import { WorkspaceSchema } from '../workspace/schemas/workspace.schema';
import { Item, ItemSchema } from '../work-items/schemas/work-item.schema';
import { KanbanBoard, KanbanBoardSchema } from '../kanban/board/schemas/kanban-board.schema';
import { KanbanColumn, ColumnSchema } from '../kanban/column/schemas/column.schema';
import { CommentSchema } from '../kanban/comment/schemas/comment.schema';
import { AttachmentSchema } from '../kanban/attachment/schemas/attachment.schema';
import { NotificationSchema } from '../kanban/notification/schemas/notification.schema';
import { SavedFilterSchema } from '../kanban/search/schemas/saved-filter.schema';
import { SprintSchema } from '../sprint/schemas/sprint.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: 'Member', schema: MemberSchema },
      { name: 'Workspace', schema: WorkspaceSchema },
      { name: Item.name, schema: ItemSchema },
      { name: KanbanBoard.name, schema: KanbanBoardSchema },
      { name: KanbanColumn.name, schema: ColumnSchema },
      { name: 'Comment', schema: CommentSchema },
      { name: 'Attachment', schema: AttachmentSchema },
      { name: 'Notification', schema: NotificationSchema },
      { name: 'SavedFilter', schema: SavedFilterSchema },
      { name: 'Sprint', schema: SprintSchema },
    ]),
  ],
  controllers: [UsersController, UserCurrentController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
