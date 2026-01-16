// src/work-items/dto/update-work-item.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateItemDto } from './create-work-item.dto';

export class UpdateItemDto extends PartialType(CreateItemDto) {}
