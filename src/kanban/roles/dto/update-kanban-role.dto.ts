// src/kanban/roles/dto/update-kanban-role.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateKanbanRoleDto {
  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;
}
