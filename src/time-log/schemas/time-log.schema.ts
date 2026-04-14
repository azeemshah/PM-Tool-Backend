import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'pm_timelogs' })
export class TimeLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  workItemId: Types.ObjectId;

  @Prop({ required: true })
  timeSpent: number; // in minutes

  @Prop({ required: true, default: () => new Date() })
  logDate: Date; // YYYY-MM-DD format (when the work was done)

  // Optional comment on this log
  @Prop({ default: null })
  comment?: string;

  // Issue type for audit trail (task | subtask | bug | improvement)
  @Prop({ enum: ['epic', 'story', 'task', 'bug', 'improvement', 'subtask'], default: 'task' })
  issueType?: string;

  // Timer fields: for auto-calculated/timer-based logs
  @Prop({ default: null })
  startedAt?: Date; // Timer start time

  @Prop({ default: null })
  endedAt?: Date; // Timer end time

  // Is this an active timer? (prevents multiple concurrent timers per user per issue)
  @Prop({ default: false })
  isActive?: boolean;

  // Reference to original log if this was an edit (for audit trail)
  @Prop({ type: Types.ObjectId, ref: 'TimeLog', default: null })
  originalLogId?: Types.ObjectId;

  // Edited by user (for permission checks)
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  editedBy?: Types.ObjectId;

  // Previous time spent (for edit history)
  @Prop({ default: null })
  previousTimeSpent?: number;
}

export const TimeLogSchema = SchemaFactory.createForClass(TimeLog);
