import { IsEmail, IsEnum, IsNotEmpty, IsMongoId } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(['ADMIN', 'TEAM_LEAD', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER', 'WATCHER'])
  role: 'ADMIN' | 'TEAM_LEAD' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER' | 'WATCHER';

  @IsNotEmpty({ message: 'workspaceId should not be empty' })
  @IsMongoId({ message: 'workspaceId must be a valid MongoDB ID' })
  workspaceId: string;
}
