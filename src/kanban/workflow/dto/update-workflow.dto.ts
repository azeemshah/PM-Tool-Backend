// src/kanban/workflow/dto/update-workflow.dto.ts
import { IsString, IsOptional, IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsArray()
  readonly states?: Types.ObjectId[]; // optional updated states

  @IsOptional()
  @IsArray()
  readonly transitions?: Types.ObjectId[]; // optional updated transitions
}
