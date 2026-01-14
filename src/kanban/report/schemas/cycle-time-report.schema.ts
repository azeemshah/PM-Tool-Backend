// src/reports/schemas/cycle-time-report.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/*
  Cycle Time Report
  Measures time taken from "In Progress" → "Done"
  Used for performance, SLA, and trend analysis
*/

@Schema({ timestamps: true })
export class CycleTimeReport extends Document {
  /* ================= Workspace ================= */
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspace: Types.ObjectId;

  /* ================= Work Item ================= */
  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  workItem: Types.ObjectId;

  /* ================= Workflow States ================= */
  @Prop({ type: Types.ObjectId, ref: 'WorkflowState', required: true })
  startState: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkflowState', required: true })
  endState: Types.ObjectId;

  /* ================= Time Tracking ================= */
  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  cycleTimeInHours: number;

  /* ================= Metadata ================= */
  @Prop({ enum: ['epic', 'story', 'task', 'subtask', 'bug', 'improvement'] })
  workItemType: string;

  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard' })
  board?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'KanbanColumn' })
  column?: Types.ObjectId;
}

export const CycleTimeReportSchema = SchemaFactory.createForClass(CycleTimeReport);

/* ================= Indexes ================= */
CycleTimeReportSchema.index({ workspace: 1, endDate: 1 });
CycleTimeReportSchema.index({ workItem: 1 }, { unique: true });
