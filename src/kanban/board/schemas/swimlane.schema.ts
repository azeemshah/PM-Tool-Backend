// src/kanban/board/schemas/swimlane.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KanbanBoard } from './kanban-board.schema';

export type SwimlaneDocument = Swimlane & Document;

@Schema({ timestamps: true, collection: 'pm_swimlanes' })
export class Swimlane extends Document {
  @Prop({ required: true })
  name: string; // Name of the swimlane

  @Prop()
  description?: string; // Optional description

  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard', required: true })
  board: Types.ObjectId; // Reference to the parent board

  @Prop({ type: Number, default: 0 })
  position: number; // Order of the swimlane
}

export const SwimlaneSchema = SchemaFactory.createForClass(Swimlane);
