import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TagDocument = Tag & Document;

@Schema({ timestamps: true, collection: 'pm_tags' })
export class Tag extends Document {
  @Prop({ required: true, trim: true, lowercase: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Workspaces', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

/* ================= Indexes ================= */
// Ensure unique tag names per workspace (case-insensitive via lowercase)
TagSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
// Index for fast queries by workspace
TagSchema.index({ workspaceId: 1 });
// Index for sorting by creation date
TagSchema.index({ workspaceId: 1, createdAt: -1 });
