// src/work-item/schemas/improvement.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem, WorkItemType } from './work-item.schema';

@Schema({ timestamps: true })
export class Improvement extends WorkItem {
  @Prop({
    type: String,
    enum: WorkItemType,
    default: WorkItemType.IMPROVEMENT,
  })
  type: WorkItemType;

  @Prop({ type: Types.ObjectId, ref: 'Story', required: false })
  story?: Types.ObjectId; // Optional parent Story if linked

  @Prop({ type: String })
  impact?: string; // Description of impact or benefit of the improvement

  @Prop({ type: String })
  dueDate?: string; // Optional due date for planning purposes
}

export const ImprovementSchema = SchemaFactory.createForClass(Improvement);

/* ================= Indexes ================= */
ImprovementSchema.index({ spaceid: 1, status: 1 });
ImprovementSchema.index({ assignee: 1 });
