// src/work-item/schemas/work-item.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum WorkItemType {
  EPIC = 'Epic',
  STORY = 'Story',
  TASK = 'Task',
  SUBTASK = 'Subtask',
  BUG = 'Bug',
  IMPROVEMENT = 'Improvement',
}

@Schema({ timestamps: true, collection: 'pm_workitems' })
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

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reporter?: Types.ObjectId;

  @Prop({ default: 'To Do' })
  status: string;

  @Prop({ default: 'Medium' })
  priority: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'KanbanLabel' }], default: [] })
  labels: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tag' }], default: [] })
  tags: Types.ObjectId[]; // Tags for organizing and filtering work items

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>; // Additional info like labels, tags, attachments
}

export const WorkItemSchema = SchemaFactory.createForClass(WorkItem);

/* ================= Indexes ================= */
WorkItemSchema.index({ spaceid: 1, board: 1, status: 1 });
WorkItemSchema.index({ assignee: 1 });
WorkItemSchema.index({ parent: 1 });
WorkItemSchema.index({ tags: 1 });
WorkItemSchema.index({ spaceid: 1, tags: 1 }); // For filtering by tags in workspace
