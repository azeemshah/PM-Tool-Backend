import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { Label } from 'src/decorators/label.decorator';
import { Types } from 'mongoose';


export class UpdateUserDto {
  @Label('First Name')
  @MaxLength(30)
  @IsString()
  @IsNotEmpty({ message: 'First Name should not be empty' })
  first_name: string;

  @Label('Last Name')
  @IsString()
  @IsNotEmpty({ message: 'Last Name should not be empty' })
  @MaxLength(30)
  last_name: string;

  @Label('Email')
  @MaxLength(255)
  @IsEmail()
  @IsNotEmpty({ message: 'Email should not be empty' })
  email: string;

  @Label('Contact Number')
  @MaxLength(20)
  @IsNotEmpty({ message: 'Contact Number should not be empty' })
  @IsString()
  contact_number?: string;

  @Label('User Role')
  @IsMongoId({each: true})
  roles: Types.ObjectId[];
}
