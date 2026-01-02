// src/kanban/project/dto/create-kanban-project.dto.ts
import { IsString, IsOptional, IsArray, ArrayUnique } from 'class-validator';
import { Types } from 'mongoose';

export class CreateKanbanProjectDto {
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  readonly users?: Types.ObjectId[]; // Array of user IDs assigned to the project
}
