import { IsNotEmpty } from 'class-validator';
import { Label } from 'src/decorators/label.decorator';

export class UpdateOrganizationDto {

 @IsNotEmpty()
  @Label('Organization Name')
  name: string;

  @IsNotEmpty()
  @Label('Organization Detail')
  detail: string;

  @IsNotEmpty()
  @Label('Organization Address')
  address: string;
}
