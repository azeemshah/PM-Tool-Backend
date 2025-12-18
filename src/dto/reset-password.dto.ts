import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Label } from 'src/decorators/label.decorator';
import { Match } from 'src/validators/match.validator';

export class ResetPasswordDto {
  @Label('Token')
  @IsNotEmpty()
  token: string;

  @Label('New Password')
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,30}$/, {
    message:
        'Password must be 8-30 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  newPassword: string;

  @Label('Confirm Password')
  @IsNotEmpty()
  @Match('newPassword', {
    message: 'Confirm password must match new password',
  })
  confirmPassword: string;
}
