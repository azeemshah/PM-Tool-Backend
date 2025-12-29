// src/project-management/project-management.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectManagementService } from './project-management.service';
import { ProjectManagementController } from './project-management.controller';
import { Project, ProjectSchema, Epic, EpicSchema, Story, StorySchema, Task,
  TaskSchema,
  Subtask,
  SubtaskSchema,
  Bug,
  BugSchema,
} from './schemas/project-management.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Epic.name, schema: EpicSchema },
      { name: Story.name, schema: StorySchema },
      { name: Task.name, schema: TaskSchema },
      { name: Subtask.name, schema: SubtaskSchema },
      { name: Bug.name, schema: BugSchema },
    ]),
  ],
  controllers: [ProjectManagementController],
  providers: [ProjectManagementService],
})
export class ProjectManagementModule {}
