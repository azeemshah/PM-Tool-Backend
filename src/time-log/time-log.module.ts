import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeLog, TimeLogSchema } from './schemas/time-log.schema';
import { TimeLogService } from './time-log.service';
import { TimeLogController } from './time-log.controller';
import { Item, ItemSchema } from '../work-items/schemas/work-item.schema';
import { HistoryModule } from '../kanban/history/history.module';
import { WorkspaceRolesByTimelogGuard } from '../common/guards/workspace-roles-by-timelog.guard';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [
    HistoryModule,
    MemberModule,
    MongooseModule.forFeature([
      { name: TimeLog.name, schema: TimeLogSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
  ],
  providers: [TimeLogService, WorkspaceRolesByTimelogGuard],
  controllers: [TimeLogController],
  exports: [TimeLogService],
})
export class TimeLogModule {}
