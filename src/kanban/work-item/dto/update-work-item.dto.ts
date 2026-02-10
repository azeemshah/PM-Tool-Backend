// src/work-item/dto/update-work-item.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkItemDto } from './create-work-item.dto';
import { IsOptional, IsString, IsEnum, IsMongoId, IsISO8601, IsArray } from 'class-validator';
import { WorkItemType } from './create-work-item.dto';

/* 
  UpdateWorkItemDto extends CreateWorkItemDto using PartialType 
  so all fields are optional during update.
*/
export class UpdateWorkItemDto extends PartialType(CreateWorkItemDto) {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(WorkItemType)
  @IsOptional()
  type?: WorkItemType;

  @IsMongoId()
  @IsOptional()
  boardId?: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsMongoId()
  @IsOptional()
  assigneeId?: string;

  @IsMongoId()
  @IsOptional()
  assignee?: string;

  @IsMongoId()
  @IsOptional()
  reporterId?: string;

  @IsMongoId()
  @IsOptional()
  reporter?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;

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
