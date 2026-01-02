// src/kanban/flow/dto/cycle-time-query.dto.ts
import { IsMongoId, IsOptional, IsDateString } from 'class-validator';

export class CycleTimeQueryDto {
  @IsMongoId()
  readonly boardId: string; // ID of the board to calculate cycle time for

  @IsOptional()
  @IsDateString()
  readonly startDate?: string; // Optional start date filter

  @IsOptional()
  @IsDateString()
  readonly endDate?: string; // Optional end date filter
}
