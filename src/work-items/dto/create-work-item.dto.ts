import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Types } from 'mongoose';

/**
 * Updated IssueType enum to match unified Issue schema
 * - Epic: Top level (no parent)
 * - Story: Under Epic
 * - Task: Under Epic
 * - Bug: Under Epic
 * - Subtask: Under Story/Task/Bug
 */
export enum IssueType {
  EPIC = 'epic',
  STORY = 'story',
  TASK = 'task',
  BUG = 'bug',
  SUBTASK = 'subtask',
}

export enum Priority {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest',
}

export class CreateWorkItemDto {
  @ApiProperty({ description: 'Project ID' })
  projectId: Types.ObjectId;

  @ApiProperty({ enum: IssueType, description: 'Type of issue following Jira hierarchy' })
  @IsEnum(IssueType)
  issueType: IssueType;

  @ApiProperty()
  @IsString()
  summary: string;

  @ApiPropertyOptional({ description: 'Rich text / HTML' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: Priority })
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional()
  @IsOptional()
  assigneeId?: Types.ObjectId;

  @ApiProperty()
  reporterId: Types.ObjectId;

  @ApiPropertyOptional()
  @IsOptional()
  sprintId?: Types.ObjectId;

  @ApiPropertyOptional()
  @IsOptional()
  teamId?: Types.ObjectId;

  /**
   * For Subtask ONLY: Parent issue ID (Story/Task/Bug)
   * For Epic/Story/Task/Bug: Use epicId field instead
   */
  @ApiPropertyOptional({
    description: 'Parent issue ID - only for Subtask type. For Story/Task/Bug, use epicId.',
  })
  @IsOptional()
  parentId?: Types.ObjectId;

  /**
   * For Story/Task/Bug ONLY: Epic ID
   * For Subtask: Leave empty, use parentId instead
   */
  @ApiPropertyOptional({
    description: 'Epic ID - only for Story/Task/Bug under an Epic',
  })
  @IsOptional()
  epicId?: Types.ObjectId;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  labels?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  storyPoints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}
