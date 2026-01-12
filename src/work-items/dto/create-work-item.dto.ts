import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ItemStatus, ItemType } from '../schemas/work-item.schema';

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

  @IsMongoId()
  workspace: string;

  @IsOptional()
  @IsMongoId()
  column?: string;

  @IsOptional()
  @IsMongoId()
  parent?: string;
}
