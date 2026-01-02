// src/kanban/board/dto/update-board.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  readonly name?: string; // Updated name of the board

  @IsOptional()
  @IsString()
  readonly description?: string; // Updated description
}
