import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Label } from 'src/decorators/label.decorator';

export class UpdateProfileDto {
  @Label('First Name')
  @MaxLength(30)
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @Label('Last Name')
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  last_name: string;

  @Label('Email')
  @MaxLength(255)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Label('Contact Number')
  @MaxLength(20)
  @IsOptional()
  @IsString()
  contact_number?: string;

  @Label('Avatar')
  @IsOptional()
  avatar?: string | null;
}
