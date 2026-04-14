import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}