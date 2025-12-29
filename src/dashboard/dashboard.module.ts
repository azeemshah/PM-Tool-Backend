import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Project, ProjectSchema } from '../project-management/schemas/project-management.schema';
import { Issue, IssueSchema } from '../issue/schemas/issue.schema';
import { Sprint, SprintSchema } from '../sprint/schemas/sprint.schema';
import { TimeLog, TimeLogSchema } from '../time-log/schemas/time-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AuthModule } from '../auth/auth.module'; // Provides JwtAuthGuard

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Issue.name, schema: IssueSchema },
      { name: Sprint.name, schema: SprintSchema },
      { name: TimeLog.name, schema: TimeLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule, // Added to provide JwtAuthGuard
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
