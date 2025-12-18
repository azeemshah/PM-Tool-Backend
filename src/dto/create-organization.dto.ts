import { IsNotEmpty, IsOptional, Matches, MaxLength, MinLength } from 'class-validator';
import { Label } from 'src/decorators/label.decorator';

export class CreateOrganizationDto {
  @IsNotEmpty({message: 'Name should not be empty'})
  @Label('Organization Name')
  name: string;

  @IsNotEmpty()
  @Label('Organization Detail')
  detail: string;

  @IsNotEmpty({message: 'Address should not be empty'})
  @Label('Organization Address')
  address: string;

  @IsNotEmpty({message: 'First Name should not be empty'})
  @Label('First Name')
  first_name: string;

  @IsNotEmpty({message: 'Last Name should not be empty'})
  @Label('Last Name')
  last_name: string;

  @IsNotEmpty({message: 'Email should not be empty'})
  @Label('Email')
  email: string;

  @IsOptional()
  @Label('Contact Number')
  contact_number?: string;

  @IsNotEmpty()
  @MinLength(8, {message: 'Password must be at least 8 characters long'})
  @MaxLength(16, {message: 'Password must not exceed 16 characters'})
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/, {
  message:
      'Password must be 8-16 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  @Label('Password')
  password: string;

}
