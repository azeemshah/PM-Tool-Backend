// src/kanban/attachment/dto/upload-attachment.dto.ts
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class UploadAttachmentDto {
  @IsMongoId()
  readonly workItemId: string; // ID of the work item the attachment belongs to

  @IsString()
  readonly fileName: string; // Name of the uploaded file

  @IsString()
  readonly fileUrl: string; // URL or path where the file is stored

  @IsOptional()
  @IsString()
  readonly description?: string; // Optional description of the attachment

  @IsOptional()
  @IsMongoId()
  readonly userId?: string; // Optional ID of the user uploading the file
}
