// src/kanban/board/dto/create-column.dto.ts
import { IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  readonly name: string; // Name of the column

  @IsOptional()
  @IsString()
  readonly description?: string; // Optional description

  @IsString()
  readonly board: string;

  @IsOptional()
  @IsNumber()
  readonly position?: number; // Optional position/order of the column
}
