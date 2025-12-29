import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkItemsService } from './work-items.service';
import { WorkItemsController } from './work-items.controller';
import { WorkItem, WorkItemSchema } from './schemas/work-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkItem.name, schema: WorkItemSchema },
    ]),
  ],
  controllers: [WorkItemsController],
  providers: [WorkItemsService],
  exports: [WorkItemsService],
})
export class WorkItemsModule {}
