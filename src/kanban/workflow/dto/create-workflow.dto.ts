// src/kanban/workflow/dto/create-workflow.dto.ts
import { IsString, IsOptional, IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class CreateWorkflowDto {
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsArray()
  readonly states?: Types.ObjectId[]; // optional initial states

  @IsOptional()
  @IsArray()
  readonly transitions?: Types.ObjectId[]; // optional initial transitions
}
