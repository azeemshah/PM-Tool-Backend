// dto/create-sprint.dto.ts
import { IsArray, IsDateString, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateSprintDto {
  @IsMongoId()
  workspaceId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsArray()
  workItems?: string[];
}
