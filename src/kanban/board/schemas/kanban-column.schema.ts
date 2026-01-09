import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KanbanBoard } from './kanban-board.schema';

export type KanbanColumnDocument = KanbanColumn & Document;

@Schema({ timestamps: true })
export class KanbanColumn extends Document {
  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard', required: true })
  BoardId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Number, default: 0 })
  position: number; // Column order
}

export const KanbanColumnSchema = SchemaFactory.createForClass(KanbanColumn);
