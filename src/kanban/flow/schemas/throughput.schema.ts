// src/kanban/flow/schemas/throughput.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KanbanBoard } from '../../board/schemas/kanban-board.schema';

export type ThroughputDocument = Throughput & Document;

@Schema({ timestamps: true })
export class Throughput extends Document {
  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard', required: true })
  board: Types.ObjectId; // Board for which throughput is calculated

  @Prop({ type: Date, required: true })
  startDate: Date; // Start date of the measurement period

  @Prop({ type: Date, required: true })
  endDate: Date; // End date of the measurement period

  @Prop({ type: Number, required: true })
  completedItems: number; // Number of work items completed in the period
}

export const ThroughputSchema = SchemaFactory.createForClass(Throughput);
