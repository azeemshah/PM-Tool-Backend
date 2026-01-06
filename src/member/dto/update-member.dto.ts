import { IsString, IsOptional } from 'class-validator';

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  roleId?: string;
}
