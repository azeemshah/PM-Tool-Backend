import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { Label } from 'src/decorators/label.decorator';

export class ChangePasswordDto {
    @Label('Old Password')
    @IsNotEmpty()
    currentPassword: string;

    @Label('New Password')
    @IsNotEmpty()
    @MinLength(8, {message: 'Password must be at least 8 characters long'})
    @MaxLength(16, {message: 'Password must not exceed 16 characters'})
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/, {
    message:
        'Password must be 8-16 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    })
    newPassword: string;
}
