// src/kanban/comment/schemas/comment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem } from '../../work-item/schemas/work-item.schema';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true, collection: 'pm_comments' })
export class Comment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  workItem: Types.ObjectId; // The work item the comment belongs to

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parentComment?: Types.ObjectId; // Optional parent comment for threaded comments

  @Prop({ type: String, required: false, default: '' })
  content: string; // The comment content

  @Prop({ type: [{ fileName: String, fileUrl: String, fileType: String }], default: [] })
  attachments: { fileName: string; fileUrl: string; fileType?: string }[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // Optional user who made the comment
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
