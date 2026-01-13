// src/work-item/schemas/story.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem, WorkItemType } from './work-item.schema';

@Schema({ timestamps: true })
export class Story extends WorkItem {
  @Prop({
    type: String,
    enum: WorkItemType,
    default: WorkItemType.STORY,
  })
  type: WorkItemType;

  @Prop({ type: Types.ObjectId, ref: 'Epic', required: true })
  epic: Types.ObjectId; // Parent Epic

  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  tasks: Types.ObjectId[]; // Tasks under this Story

  @Prop({ type: String })
  dueDate?: string; // Optional due date for the Story
}

export const StorySchema = SchemaFactory.createForClass(Story);

/* ================= Indexes ================= */
StorySchema.index({ spaceid: 1, epic: 1, status: 1 });
