// src/kanban/time-tracking/schemas/timesheet.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TimeLog } from './time-log.schema';
//import { User, UserSchema } from '../..users/schemas/user.schema'; 

export type TimesheetDocument = Timesheet & Document;

@Schema({ timestamps: true })
export class Timesheet extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId; // User for whom the timesheet is recorded

  @Prop({ type: [{ type: Types.ObjectId, ref: 'TimeLog' }] })
  timeLogs: Types.ObjectId[]; // Array of time log references

  @Prop({ type: Date, required: true })
  weekStart: Date; // Start date of the timesheet week

  @Prop({ type: Date, required: true })
  weekEnd: Date; // End date of the timesheet week

  @Prop({ type: Number })
  totalHours?: number; // Total hours for the week, optional calculated field
}

export const TimesheetSchema = SchemaFactory.createForClass(Timesheet);
