// src/kanban/board/schemas/kanban-column.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KanbanBoard } from './kanban-board.schema';

export type KanbanColumnDocument = KanbanColumn & Document;

@Schema({ timestamps: true })
export class KanbanColumn extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard', required: true })
  board: Types.ObjectId; // Reference to parent board

  @Prop({ type: Number, default: 0 })
  position: number; // Column order

  @Prop({ type: [{ type: Types.ObjectId, ref: 'WorkItem' }], default: [] })
  workItems: Types.ObjectId[]; // Work items under this column
}

export const KanbanColumnSchema = SchemaFactory.createForClass(KanbanColumn);
