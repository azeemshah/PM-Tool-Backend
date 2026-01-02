// src/kanban/time-tracking/schemas/time-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem } from '../../work-item/schemas/work-item.schema';

export type TimeLogDocument = TimeLog & Document;

@Schema({ timestamps: true })
export class TimeLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  workItem: Types.ObjectId; // Reference to the work item

  @Prop({ type: Number, required: true })
  hoursSpent: number; // Number of hours spent

  @Prop({ type: String })
  description?: string; // Optional description of the work done

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // Optional user associated with the log
}

export const TimeLogSchema = SchemaFactory.createForClass(TimeLog);
