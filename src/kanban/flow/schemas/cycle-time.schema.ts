// src/kanban/flow/schemas/cycle-time.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KanbanBoard } from '../../board/schemas/kanban-board.schema';

export type CycleTimeDocument = CycleTime & Document;

@Schema({ timestamps: true })
export class CycleTime extends Document {
  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard', required: true })
  board: Types.ObjectId; // Board for which cycle time is calculated

  @Prop({ type: Date, required: true })
  startDate: Date; // Start date of the cycle

  @Prop({ type: Date, required: true })
  endDate: Date; // End date of the cycle

  @Prop({ type: Number, required: true })
  duration: number; // Duration in days/hours
}

export const CycleTimeSchema = SchemaFactory.createForClass(CycleTime);
