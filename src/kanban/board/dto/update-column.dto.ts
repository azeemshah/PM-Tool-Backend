// src/kanban/board/dto/update-column.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  readonly name?: string; // Updated name of the column

  @IsOptional()
  @IsString()
  readonly description?: string; // Updated description

  @IsOptional()
  @IsNumber()
  readonly position?: number; // Updated position/order
}
