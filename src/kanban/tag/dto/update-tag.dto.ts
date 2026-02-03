import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  name?: string;
}
