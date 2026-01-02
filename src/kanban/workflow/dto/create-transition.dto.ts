// src/kanban/workflow/dto/create-transition.dto.ts
import { IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateTransitionDto {
  @IsString()
  readonly name: string; // name of the transition

  @IsString()
  readonly fromState: string | Types.ObjectId; // ID of the starting state

  @IsString()
  readonly toState: string | Types.ObjectId; // ID of the ending state
}
