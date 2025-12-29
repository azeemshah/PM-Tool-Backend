import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TimeLog extends Document {

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  workItemId: Types.ObjectId;

  @Prop({ required: true })
  timeSpent: number; // in minutes

  @Prop()
  logDate: Date;
}

// ✅ THIS LINE WAS MISSING
export const TimeLogSchema = SchemaFactory.createForClass(TimeLog);
