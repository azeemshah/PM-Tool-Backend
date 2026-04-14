// src/kanban/comment/dto/create-comment.dto.ts
import { IsMongoId, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateCommentDto {
  @IsMongoId()
  readonly workItemId: string; // ID of the work item being commented on

  @IsMongoId()
  @IsOptional()
  readonly parentCommentId?: string; // Optional: ID of the parent comment for threaded comments

  @IsString()
  @IsOptional()
  readonly content?: string; // The comment content

  @IsArray()
  @IsOptional()
  readonly attachments?: { fileName: string; fileUrl: string; fileType?: string }[];

  @IsMongoId()
  @IsOptional()
  readonly userId?: string; // Optional: ID of the user making the comment
}
