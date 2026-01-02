// src/kanban/time-tracking/dto/create-time-log.dto.ts
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTimeLogDto {
  @IsMongoId()
  readonly workItemId: string; // ID of the work item being tracked

  @IsNumber()
  readonly hoursSpent: number; // Number of hours spent in this log

  @IsOptional()
  @IsString()
  readonly description?: string; // Optional description of the work done

  @IsOptional()
  @IsMongoId()
  readonly userId?: string; // Optional user ID for whom the log is created
}
