// src/kanban/workflow/dto/create-state.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateStateDto {
  @IsString()
  readonly name: string; // name of the state

  @IsOptional()
  @IsString()
  readonly description?: string; // optional description of the state
}
