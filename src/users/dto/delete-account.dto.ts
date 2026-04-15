import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @IsBoolean()
  deleteOwnedWorkspaces?: boolean;
}
