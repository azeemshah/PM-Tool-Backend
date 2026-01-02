// src/kanban/board/schemas/kanban-board.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KanbanColumn } from './kanban-column.schema';

export type KanbanBoardDocument = KanbanBoard & Document;

@Schema({ timestamps: true })
export class KanbanBoard extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'KanbanColumn' }], default: [] })
  columns: Types.ObjectId[];

}


export const KanbanBoardSchema = SchemaFactory.createForClass(KanbanBoard);
