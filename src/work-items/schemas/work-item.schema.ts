import { Subtask } from './../../kanban/work-item/schemas/subtask.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ItemType {
  STORY = 'story',
  BUG = 'bug',
  TASK = 'task',
  EPIC = 'epic',
  SUBTASK = 'subtask'
}

export enum ItemStatus {
  BACKLOG = 'backlog',
  BOARD = 'board',
}

@Schema({ timestamps: true })
export class Item extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ enum: ItemType, required: true })
  type: ItemType;

  @Prop({ enum: ItemStatus, required: true, default: ItemStatus.BACKLOG })
  status: ItemStatus;

  // Workspace isolation
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspace: Types.ObjectId;

  // Column only when on board
  @Prop({ type: Types.ObjectId, ref: 'KanbanColumn', default: null })
  column?: Types.ObjectId;

  // Parent item (epic or task)
  @Prop({ type: Types.ObjectId, ref: 'Item', default: null, index: true })
  parent?: Types.ObjectId;

  // Materialized path for fast hierarchy queries
  @Prop({ required: true, index: true })
  path: string;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

// Helpful compound indexes
ItemSchema.index({ workspace: 1, path: 1 });
ItemSchema.index({ workspace: 1, status: 1 });
