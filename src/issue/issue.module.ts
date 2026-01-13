import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IssueController } from './issue.controller';
import { IssueService } from './issue.service';
import { IssueEventsGateway } from './events.gateway';
import { Issue, IssueSchema } from './schemas/issue.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { Project, ProjectSchema } from '../project-management/schemas/project-management.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Issue.name, schema: IssueSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [IssueController],
  providers: [IssueService, IssueEventsGateway],
})
export class IssueModule {}
