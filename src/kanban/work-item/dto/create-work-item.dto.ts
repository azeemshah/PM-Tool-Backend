// src/work-item/dto/create-work-item.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsMongoId, IsISO8601, IsArray } from 'class-validator';

export enum WorkItemType {
  EPIC = 'Epic',
  STORY = 'Story',
  TASK = 'Task',
  SUBTASK = 'Subtask',
  BUG = 'Bug',
  IMPROVEMENT = 'Improvement',
}

export class CreateWorkItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(WorkItemType)
  @IsNotEmpty()
  type: WorkItemType;

  @IsMongoId()
  @IsOptional()
  boardId?: string; // Associated Kanban board

  @IsMongoId()
  @IsOptional()
  columnId?: string; // Associated Kanban column

  @IsMongoId()
  @IsOptional()
  parentId?: string; // Parent item (for Story -> Epic, Task -> Story, Subtask -> Task)

  @IsMongoId()
  @IsOptional()
  assigneeId?: string; // Assigned user

  @IsMongoId()
  @IsOptional()
  assignee?: string; // Assigned user (Alias for assigneeId to support frontend payload)

  @IsMongoId()
  @IsOptional()
  reporterId?: string; // Reporter user

  @IsMongoId()
  @IsOptional()
  reporter?: string; // Reporter user (Alias for reporterId to support frontend payload)

  @IsString()
  @IsOptional()
  status?: string; // e.g., 'To Do', 'In Progress', 'Done'

  @IsString()
  @IsOptional()
  priority?: string; // e.g., 'Low', 'Medium', 'High'

  @IsISO8601()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  tags?: string[]; // Array of tag IDs to assign to this work item
}
