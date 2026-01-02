// src/kanban/time-tracking/dto/update-time-log.dto.ts
import { IsNumber, IsOptional, IsString, IsMongoId } from 'class-validator';

export class UpdateTimeLogDto {
  @IsOptional()
  @IsMongoId()
  readonly workItemId?: string; // Optional: change the work item associated

  @IsOptional()
  @IsNumber()
  readonly hoursSpent?: number; // Optional: update hours spent

  @IsOptional()
  @IsString()
  readonly description?: string; // Optional: update description

  @IsOptional()
  @IsMongoId()
  readonly userId?: string; // Optional: change the user associated
}
