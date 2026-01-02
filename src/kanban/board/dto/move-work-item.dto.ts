// src/kanban/board/dto/move-work-item.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class MoveWorkItemDto {
  @IsString()
  readonly workItemId: string; // ID of the work item to move

  @IsString()
  readonly fromColumnId: string; // ID of the source column

  @IsString()
  readonly toColumnId: string; // ID of the target column

  @IsOptional()
  @IsNumber()
  readonly position?: number; // Optional position in the target column
}
