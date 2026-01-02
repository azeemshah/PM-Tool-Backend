// src/kanban/roles/dto/create-kanban-role.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateKanbanRoleDto {
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly description?: string;
}
