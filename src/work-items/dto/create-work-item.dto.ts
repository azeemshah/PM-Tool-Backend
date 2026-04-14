import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemStatus, ItemType, ItemPriority } from '../schemas/work-item.schema';

export enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DROPDOWN = 'dropdown',
  MULTI_SELECT = 'multi-select',
  CHECKBOX = 'checkbox',
  DATE = 'date',
  USER = 'user',
  URL = 'url',
}

export class CustomFieldDto {
  @IsString()
  name: string;

  @IsEnum(CustomFieldType)
  fieldType: CustomFieldType;

  // value can be different types depending on fieldType; keep optional and flexible
  @IsOptional()
  value?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsMongoId()
  userValue?: string;
}

export class CreateItemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ItemType)
  type: ItemType;

  @IsOptional()
  @IsString()
  status?: string;

  // ---------------- New fields ----------------

  @IsOptional()
  @IsEnum(ItemPriority)
  priority?: ItemPriority;

  @IsOptional()
  @IsMongoId()
  assignedTo?: string;

  @IsOptional()
  @IsMongoId()
  reporter?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  tags?: string[];

  // ---------------- Existing relations ----------------

  @IsMongoId()
  workspace: string;

  @IsOptional()
  @IsMongoId()
  column?: string;

  @IsOptional()
  @IsMongoId()
  parent?: string;

  // ---------------- Estimates & story points (minutes)
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalEstimate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingEstimate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  storyPoints?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldDto)
  @IsArray()
  customFields?: CustomFieldDto[];
}
