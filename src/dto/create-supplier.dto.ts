import {
  IsNotEmpty,
  IsString,
} from 'class-validator';


export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  crn: string;

  @IsNotEmpty()
  @IsString()
  street_name?: string;

  @IsNotEmpty()
  @IsString()
  building_number?: string;

  @IsNotEmpty()
  @IsString()
  plot_identification?: string;

  @IsNotEmpty()
  @IsString()
  city_subdivision_name?: string;

  @IsNotEmpty()
  @IsString()
  city_name?: string;

  @IsNotEmpty()
  @IsString()
  postal_zone?: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsNotEmpty()
  @IsString()
  vat_Number?: string;

  @IsNotEmpty()
  @IsString()
  vat_name?: string;
}