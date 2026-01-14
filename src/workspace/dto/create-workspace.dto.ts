import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateWorkspaceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(['kanban', 'scrumboard'])
  boardType: string;
}
