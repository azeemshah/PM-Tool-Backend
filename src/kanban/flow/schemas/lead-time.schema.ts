// src/kanban/flow/schemas/lead-time.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KanbanBoard } from '../../board/schemas/kanban-board.schema';

export type LeadTimeDocument = LeadTime & Document;

@Schema({ timestamps: true })
export class LeadTime extends Document {
  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard', required: true })
  board: Types.ObjectId; // Board for which lead time is calculated

  @Prop({ type: Date, required: true })
  startDate: Date; // Start date of the lead time measurement

  @Prop({ type: Date, required: true })
  endDate: Date; // End date of the lead time measurement

  @Prop({ type: Number, required: true })
  duration: number; // Duration in days/hours
}

export const LeadTimeSchema = SchemaFactory.createForClass(LeadTime);
