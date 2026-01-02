// src/kanban/comment/dto/create-comment.dto.ts
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsMongoId()
  readonly workItemId: string; // ID of the work item being commented on

  @IsMongoId()
  @IsOptional()
  readonly parentCommentId?: string; // Optional: ID of the parent comment for threaded comments

  @IsString()
  readonly content: string; // The comment content

  @IsMongoId()
  @IsOptional()
  readonly userId?: string; // Optional: ID of the user making the comment
}
