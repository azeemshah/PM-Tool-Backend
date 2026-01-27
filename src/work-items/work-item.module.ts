import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemService } from './work-item.service';
import { ItemController } from './work-item.controller';
import { Item, ItemSchema } from './schemas/work-item.schema';
import { KanbanColumn, ColumnSchema } from '../kanban/column/schemas/column.schema';
import { KanbanBoard, KanbanBoardSchema } from '../kanban/board/schemas/kanban-board.schema';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: KanbanColumn.name, schema: ColumnSchema },
      { name: KanbanBoard.name, schema: KanbanBoardSchema },
    ]),
    EmailModule,
    UsersModule,
  ],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
