import { Subtask } from './../../kanban/work-item/schemas/subtask.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export enum ItemPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ItemType {
  STORY = 'story',
  BUG = 'bug',
  TASK = 'task',
  EPIC = 'epic',
  SUBTASK = 'subtask',
  IMPROVEMENT = 'improvement',
}

export enum ItemStatus {
  BACKLOG = 'Backlog',
  TODO = 'To Do',
  INPROGRESS = 'In Progress',
  REVIEW = 'In Review',
  BLOCKED = 'Blocked',
  DONE = 'Done',
  CLOSED = 'Closed',
}

@Schema({ timestamps: true, collection: 'pm_items' })
export class Item extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ enum: ItemType, required: true })
  type: ItemType;

  @Prop({ required: true, default: ItemStatus.BACKLOG })
  status: string;

  // Workspace isolation
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspace: Types.ObjectId;

  // Column only when on board
  @Prop({ type: Types.ObjectId, ref: 'KanbanColumn', default: null })
  column?: Types.ObjectId;

  // Parent item (epic or task)
  @Prop({ type: Types.ObjectId, ref: 'Item', default: null, index: true })
  parent?: Types.ObjectId;

  @Prop({
    enum: ItemPriority,
    default: ItemPriority.MEDIUM,
    index: true,
  })
  priority?: ItemPriority;

  // User assigned to this item
  // (This likely already existed but needed proper ref + default)
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  })
  assignedTo?: Types.ObjectId;

  // User who reported/created the issue
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  })
  reporter?: Types.ObjectId;

  // Start date for timeline (Gantt Chart)
  @Prop({
    type: Date,
    default: null,
  })
  startDate?: Date;

  // Due date for completion
  @Prop({
    type: Date,
    default: null,
  })
  dueDate?: Date;

  @Prop({ type: [String], default: [] })
  labels: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tag' }], default: [] })
  tags: Types.ObjectId[];

  // Custom fields support (flexible storage for workspace-specific custom fields)
  @Prop({
    type: [
      {
        name: String,
        fieldType: String, // e.g., text, number, dropdown, multi-select, checkbox, date, user, url
        value: MongooseSchema.Types.Mixed,
        options: [String], // for dropdown / multi-select
        userValue: { type: Types.ObjectId, ref: 'User', default: null }, // for user picker
      },
    ],
    default: [],
  })
  customFields: any[];

  // Time tracking & estimation (minutes)
  @Prop({ type: Number, default: 0 })
  originalEstimate?: number;

  @Prop({ type: Number, default: 0 })
  remainingEstimate?: number;

  @Prop({ type: Number, default: 0 })
  timeSpent?: number;

  @Prop({ type: Number, default: null })
  storyPoints?: number;

  // Materialized path for fast hierarchy queries
  @Prop({ required: true, index: true })
  path: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
export type ItemDocument = Item & Document;

// Helpful compound indexes
ItemSchema.index({ workspace: 1, path: 1 });
ItemSchema.index({ workspace: 1, status: 1 });
