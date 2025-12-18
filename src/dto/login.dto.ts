import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'validation.isEmail' })
  email: string;

  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  password: string;
}
