import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SprintController } from './sprint.controller';
import { SprintService } from './sprint.service';
import { Sprint, SprintSchema } from './schemas/sprint.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sprint.name, schema: SprintSchema },
    ]),
  ],
  controllers: [SprintController],
  providers: [SprintService],
})
export class SprintModule {}
