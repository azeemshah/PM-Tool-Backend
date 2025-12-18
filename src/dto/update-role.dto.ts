import {
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ArrayNotEmpty,
} from 'class-validator';
import { Label } from 'src/decorators/label.decorator';

export class UpdateRoleDto {

  @Label('Role Name')
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @Label('Permissions')
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}
