// dto/update-sprint-status.dto.ts
import { IsEnum } from 'class-validator';
import { SprintStatus } from '../enums/sprint-status.enum';

export class UpdateSprintStatusDto {
  @IsEnum(SprintStatus)
  status: SprintStatus;
}
