import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, Matches, isString, IsMongoId } from 'class-validator';
import { Label } from 'src/decorators/label.decorator';
import { Types } from 'mongoose';


export class CreateUserDto {
  @IsNotEmpty({message: 'First Name should not be empty'})
  @IsString()
  @MaxLength(30)
  @Label('First Name')
  first_name: string;

  @IsNotEmpty({message: 'Last Name should not be empty'})
  @IsString()
  @MaxLength(30)
  @Label('Last Name')
  last_name: string;

  @IsNotEmpty({message: 'Email should not be empty'})
  @IsEmail({}, {message: 'Email must be a valid email address'})
  @MaxLength(255)
  @Label('Email')
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Label('Contact Number')
  contact_number?: string;

  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/, {
    message:
      'Password must be 8-16 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  @Label('Password')
  password: string;

  @Label('User Role')
  @IsMongoId({each: true})
  roles: Types.ObjectId[];

  @IsOptional()
  @Label('Avatar URL')
  avatar?: string | null;
}
