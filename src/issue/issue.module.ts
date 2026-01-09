import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IssueController } from './issue.controller';
import { IssueService } from './issue.service';
import { Issue, IssueSchema } from './schemas/issue.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Issue.name, schema: IssueSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [IssueController],
  providers: [IssueService],
})
export class IssueModule {}
