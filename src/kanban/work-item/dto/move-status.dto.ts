// src/work-item/dto/move-status.dto.ts
import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class MoveStatusDto {
  @IsMongoId()
  @IsNotEmpty()
  workItemId: string; // ID of the work item to move

  @IsString()
  @IsNotEmpty()
  fromStatus: string; // Current status of the work item

  @IsString()
  @IsNotEmpty()
  toStatus: string; // Target status to move the work item to

  @IsMongoId()
  @IsNotEmpty()
  boardId: string; // Board where the work item belongs

  @IsMongoId()
  @IsNotEmpty()
  projectId: string; // Project where the work item belongs
}
