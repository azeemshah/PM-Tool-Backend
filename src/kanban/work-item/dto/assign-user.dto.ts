// src/work-item/dto/assign-user.dto.ts
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignUserDto {
  @IsMongoId()
  @IsNotEmpty()
  workItemId: string; // ID of the work item

  @IsMongoId()
  @IsNotEmpty()
  userId: string; // ID of the user to assign
}
