// src/work-item/schemas/subtask.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem, WorkItemType } from './work-item.schema';

@Schema({ timestamps: true })
export class Subtask extends WorkItem {
  @Prop({
    type: String,
    enum: WorkItemType,
    default: WorkItemType.SUBTASK,
    required: true,
  })
  type: WorkItemType;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  task: Types.ObjectId; // Parent Task

  @Prop({ type: String })
  dueDate?: string; // Optional due date for Subtask
}

export const SubtaskSchema = SchemaFactory.createForClass(Subtask);

/* ================= Indexes ================= */
SubtaskSchema.index({ project: 1, task: 1, status: 1 });
SubtaskSchema.index({ assignee: 1 });
