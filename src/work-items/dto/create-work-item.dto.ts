import { IsEnum, IsMongoId, IsOptional, IsString, IsDateString } from 'class-validator';
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
  @IsEnum(ItemStatus)
  status?: ItemStatus;

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
