// sprint.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SprintController } from './sprint.controller';
import { SprintService } from './sprint.service';
import { Sprint, SprintSchema } from './schemas/sprint.schema';
import { Item, ItemSchema } from '../work-items/schemas/work-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sprint.name, schema: SprintSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
  ],
  controllers: [SprintController],
  providers: [SprintService],
})
export class SprintModule {}
