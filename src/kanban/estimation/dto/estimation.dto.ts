// src/kanban/estimation/dto/estimation.dto.ts
import { IsMongoId, IsNumber, IsOptional } from 'class-validator';

export class EstimationDto {
  @IsMongoId()
  readonly workItemId: string; // ID of the work item to estimate

  @IsNumber()
  readonly estimatedHours: number; // Estimated hours for completion

  @IsOptional()
  @IsNumber()
  readonly actualHours?: number; // Optional actual hours spent
}
