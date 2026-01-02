// src/kanban/linking/dto/create-link.dto.ts
import { IsMongoId, IsString, IsEnum, IsOptional } from 'class-validator';

export enum LinkType {
  BLOCKS = 'blocks',
  RELATES_TO = 'relates_to',
  DUPLICATES = 'duplicates',
  DEPENDS_ON = 'depends_on',
}

export class CreateLinkDto {
  @IsMongoId()
  readonly sourceWorkItemId: string; // ID of the source work item

  @IsMongoId()
  readonly targetWorkItemId: string; // ID of the target work item

  @IsEnum(LinkType)
  readonly type: LinkType; // Type of link

  @IsOptional()
  @IsString()
  readonly description?: string; // Optional description of the link
}
