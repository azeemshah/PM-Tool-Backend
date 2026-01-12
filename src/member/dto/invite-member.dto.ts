import { IsEmail, IsEnum } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(['USER', 'VIEWER'])
  role: 'USER' | 'VIEWER';
}
