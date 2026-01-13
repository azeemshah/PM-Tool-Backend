// src/work-item/schemas/work-item.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum WorkItemType {
  EPIC = 'epic',
  STORY = 'story',
  TASK = 'task',
  SUBTASK = 'subtask',
  BUG = 'bug',
}

@Schema({ timestamps: true })
export class WorkItem extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ enum: WorkItemType, required: true })
  type: WorkItemType;

  @Prop({ type: Types.ObjectId, ref: 'Workspaces' })
  spaceid?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard' })
  board?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkItem' })
  parent?: Types.ObjectId; // Epic -> Story, Story -> Task, Task -> Subtask

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;

  @Prop({ default: 'To Do' })
  status: string;

  @Prop({ default: 'Medium' })
  priority: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>; // Additional info like labels, tags, attachments
}

export const WorkItemSchema = SchemaFactory.createForClass(WorkItem);

/* ================= Indexes ================= */
WorkItemSchema.index({ spaceid: 1, board: 1, status: 1 });
WorkItemSchema.index({ assignee: 1 });
WorkItemSchema.index({ parent: 1 });
