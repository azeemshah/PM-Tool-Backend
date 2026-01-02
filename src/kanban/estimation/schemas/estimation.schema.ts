// src/kanban/estimation/schemas/estimation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem } from '../../work-item/schemas/work-item.schema';

export type EstimationDocument = Estimation & Document;

@Schema({ timestamps: true })
export class Estimation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  workItem: Types.ObjectId; // Reference to the work item

  @Prop({ type: Number, required: true })
  estimatedHours: number; // Estimated hours for completion

  @Prop({ type: Number })
  actualHours?: number; // Actual hours spent (optional)
}

export const EstimationSchema = SchemaFactory.createForClass(Estimation);
