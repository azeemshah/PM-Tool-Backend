// src/kanban/attachment/schemas/attachment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem } from '../../work-item/schemas/work-item.schema';

export type AttachmentDocument = Attachment & Document;

@Schema({ timestamps: true })
export class Attachment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  workItem: Types.ObjectId; // The work item the attachment belongs to

  @Prop({ type: String, required: true })
  fileName: string; // Name of the uploaded file

  @Prop({ type: String, required: true })
  fileUrl: string; // URL or path of the uploaded file

  @Prop({ type: String })
  description?: string; // Optional description

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // Optional user who uploaded the attachment
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);
