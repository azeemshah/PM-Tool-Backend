// src/kanban/project/dto/assign-user.dto.ts
import { IsString } from 'class-validator';

export class AssignUserDto {
  @IsString()
  readonly userId: string; // ID of the user to assign
}
