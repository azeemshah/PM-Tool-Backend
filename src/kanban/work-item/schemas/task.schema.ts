// src/work-item/schemas/task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem, WorkItemType } from './work-item.schema';

@Schema({ timestamps: true })
export class Task extends WorkItem {
    @Prop({
    type: String,
    enum: WorkItemType,
    default: WorkItemType.TASK,
    required: true,
  })
  type: WorkItemType;

  @Prop({ type: Types.ObjectId, ref: 'Story', required: true })
  story: Types.ObjectId; // Parent Story

  @Prop({ type: [Types.ObjectId], ref: 'Subtask', default: [] })
  subtasks: Types.ObjectId[]; // Subtasks under this Task

  @Prop({ type: String })
  dueDate?: string; // Optional due date for Task
}

export const TaskSchema = SchemaFactory.createForClass(Task);

/* ================= Indexes ================= */
TaskSchema.index({ spaceid: 1, story: 1, status: 1 });
TaskSchema.index({ assignee: 1 });
