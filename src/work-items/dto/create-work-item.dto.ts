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

export enum IssueType {
  TASK = 'TASK',
  BUG = 'BUG',
  STORY = 'STORY',
  EPIC = 'EPIC',
  FEATURE = 'FEATURE',
  REQUEST = 'REQUEST',
}

export enum Priority {
  LOWEST = 'LOWEST',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  HIGHEST = 'HIGHEST',
}

export class CreateWorkItemDto {
  @ApiProperty({ description: 'Project (Space) ID' })
  projectId: Types.ObjectId;

  @ApiProperty({ enum: IssueType })
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

  @ApiPropertyOptional()
  @IsOptional()
  parentId?: Types.ObjectId;

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
