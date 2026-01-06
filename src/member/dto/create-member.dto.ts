import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsOptional()
  role?: string;
}
