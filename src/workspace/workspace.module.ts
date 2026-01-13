import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { MemberSchema } from '../member/schemas/member.schema';
import { Issue, IssueSchema } from '../issue/schemas/issue.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: 'Member', schema: MemberSchema },
      { name: Issue.name, schema: IssueSchema },
    ]),
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
