// src/kanban/board/dto/create-board.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  readonly name: string; // Name of the board

  @IsOptional()
  @IsString()
  readonly description?: string; // Optional description of the board

  @IsOptional()
  @IsString()
  projectId?: string;
}
