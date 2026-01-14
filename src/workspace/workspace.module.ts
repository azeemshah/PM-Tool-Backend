import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { MemberSchema } from '../member/schemas/member.schema';
import { WorkItem, WorkItemSchema } from '../kanban/work-item/schemas/work-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: 'Member', schema: MemberSchema },
      { name: WorkItem.name, schema: WorkItemSchema },
    ]),
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
