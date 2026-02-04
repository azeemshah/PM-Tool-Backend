import { PartialType } from '@nestjs/mapped-types';
import { CreateItemDto } from './create-work-item.dto';
import { IsOptional, IsString, IsEnum, IsMongoId, IsISO8601, IsArray } from 'class-validator';
import { ItemPriority, ItemType } from '../schemas/work-item.schema';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ItemType)
  @IsOptional()
  type?: ItemType;

  @IsString()
  @IsOptional()
  status?: string;

  @IsEnum(ItemPriority)
  @IsOptional()
  priority?: ItemPriority;

  @IsMongoId()
  @IsOptional()
  assignedTo?: string;

  @IsMongoId()
  @IsOptional()
  reporter?: string;

  @IsISO8601()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  tags?: string[];

  @IsMongoId()
  @IsOptional()
  workspace?: string;

  @IsMongoId()
  @IsOptional()
  column?: string;

  @IsMongoId()
  @IsOptional()
  parent?: string;
}
