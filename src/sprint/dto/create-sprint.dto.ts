import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSprintDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsNotEmpty()
  @IsString()
  workspaceId: string;
}
