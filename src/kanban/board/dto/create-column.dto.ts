// src/kanban/board/dto/create-column.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  readonly name: string; // Name of the column

  @IsOptional()
  @IsString()
  readonly description?: string; // Optional description

  @IsOptional()
  @IsNumber()
  readonly position?: number; // Optional position/order of the column
}
