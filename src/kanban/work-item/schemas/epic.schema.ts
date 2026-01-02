// src/work-item/schemas/epic.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem, WorkItemType } from './work-item.schema';

@Schema({ timestamps: true })
export class Epic extends WorkItem {
    @Prop({
    type: String,                  
    enum: WorkItemType,
    default: WorkItemType.EPIC,
  })
  type: WorkItemType;

  @Prop({ type: [Types.ObjectId], ref: 'Story', default: [] })
  stories: Types.ObjectId[]; // Stories belonging to this Epic

  @Prop({ type: String })
  color?: string; // Optional color for visual boards

  @Prop({ type: String })
  dueDate?: string; // Optional due date for Epic
}

export const EpicSchema = SchemaFactory.createForClass(Epic);

/* ================= Indexes ================= */
EpicSchema.index({ project: 1, status: 1 });
