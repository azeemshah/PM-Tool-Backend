// src/report/schemas/workload-report.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/*
  Workload Report
  Shows distribution of work across users, columns, and work item types
  Used for capacity planning, bottleneck detection, and team balance
*/

@Schema({ timestamps: true })
export class WorkloadReport extends Document {
  /* ================= Workspace ================= */
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspace: Types.ObjectId;

  /* ================= User ================= */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  /* ================= Board & Column ================= */
  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard' })
  board?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'KanbanColumn' })
  column?: Types.ObjectId;

  /* ================= Work Item ================= */
  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  workItem: Types.ObjectId;

  @Prop({ enum: ['epic', 'story', 'task', 'subtask', 'bug'] })
  workItemType: string;

  /* ================= Status ================= */
  @Prop({ enum: ['todo', 'in_progress', 'done'], required: true })
  status: string;

  /* ================= Time Window ================= */
  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  /* ================= Metrics ================= */
  @Prop({ default: 1 })
  itemCount: number;

  @Prop({ default: 0 })
  totalEstimatedHours?: number;

  @Prop({ default: 0 })
  totalLoggedHours?: number;
}

export const WorkloadReportSchema =
  SchemaFactory.createForClass(WorkloadReport);

/* ================= Indexes ================= */
WorkloadReportSchema.index({ workspace: 1, user: 1, startDate: 1 });
WorkloadReportSchema.index({ workItem: 1 });
