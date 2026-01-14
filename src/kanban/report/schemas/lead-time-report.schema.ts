// src/report/schemas/lead-time-report.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/*
  Lead Time Report
  Measures time from work item creation → completion
  Used for delivery forecasting, SLA, customer satisfaction
*/

@Schema({ timestamps: true })
export class LeadTimeReport extends Document {
  /* ================= Workspace ================= */
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspace: Types.ObjectId;

  /* ================= Work Item ================= */
  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  workItem: Types.ObjectId;

  /* ================= Workflow States ================= */
  @Prop({ type: Types.ObjectId, ref: 'WorkflowState' })
  startState?: Types.ObjectId; // usually "Backlog" or "To Do"

  @Prop({ type: Types.ObjectId, ref: 'WorkflowState', required: true })
  endState: Types.ObjectId; // usually "Done"

  /* ================= Time Tracking ================= */
  @Prop({ required: true })
  createdDate: Date;

  @Prop({ required: true })
  completedDate: Date;

  @Prop({ required: true })
  leadTimeInHours: number;

  /* ================= Metadata ================= */
  @Prop({ enum: ['epic', 'story', 'task', 'subtask', 'bug', 'improvement'] })
  workItemType: string;

  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard' })
  board?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'KanbanColumn' })
  column?: Types.ObjectId;
}

export const LeadTimeReportSchema = SchemaFactory.createForClass(LeadTimeReport);

/* ================= Indexes ================= */
LeadTimeReportSchema.index({ workspace: 1, completedDate: 1 });
LeadTimeReportSchema.index({ workItem: 1 }, { unique: true });
