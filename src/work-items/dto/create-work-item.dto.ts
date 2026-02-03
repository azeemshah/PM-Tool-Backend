import { IsEnum, IsMongoId, IsOptional, IsString, IsDateString, IsArray } from 'class-validator';
import { ItemStatus, ItemType, ItemPriority } from '../schemas/work-item.schema';

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
}
