import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsMongoId()
  readonly workspaceId: string;
}
