// src/work-item/schemas/bug.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem, WorkItemType } from './work-item.schema';

@Schema({ timestamps: true })
export class Bug extends WorkItem {
@Prop({
  type: String,
  enum: WorkItemType,
  default: WorkItemType.BUG,
})
type: WorkItemType;

  @Prop({ type: Types.ObjectId, ref: 'Story', required: false })
  story?: Types.ObjectId; // Optional parent Story if bug is linked

  @Prop({ type: String })
  severity?: string; // e.g., Critical, Major, Minor

  @Prop({ type: String })
  stepsToReproduce?: string; // Optional description of steps to reproduce

  @Prop({ type: String })
  environment?: string; // Optional environment info (e.g., "Prod", "Staging")
}

export const BugSchema = SchemaFactory.createForClass(Bug);

/* ================= Indexes ================= */
BugSchema.index({ spaceid: 1, status: 1 });
BugSchema.index({ assignee: 1 });
