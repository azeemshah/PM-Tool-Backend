import { IsEmail } from 'class-validator';
import { Label } from 'src/decorators/label.decorator';

export class ForgotPasswordDto {
  @IsEmail()
  @Label("Email")
  email: string;
}
