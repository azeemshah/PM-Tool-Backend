// src/reports/schemas/cumulative-flow-report.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/*
  Cumulative Flow Report
  Used for CFD charts:
  - Shows how many work items exist in each status per day
*/

@Schema({ timestamps: true })
export class CumulativeFlowReport extends Document {
  /* ================= Project ================= */
  @Prop({ type: Types.ObjectId, ref: 'KanbanProject', required: true })
  project: Types.ObjectId;

  /* ================= Report Date ================= */
  @Prop({ required: true })
  date: Date;

  /* ================= Status Distribution ================= */
  @Prop({
    type: [
      {
        statusId: { type: Types.ObjectId, ref: 'WorkflowState' },
        count: { type: Number, default: 0 },
      },
    ],
    default: [],
  })
  statusCounts: {
    statusId: Types.ObjectId;
    count: number;
  }[];

  /* ================= Total Items ================= */
  @Prop({ default: 0 })
  totalWorkItems: number;
}

export const CumulativeFlowReportSchema =
  SchemaFactory.createForClass(CumulativeFlowReport);

/* ================= Indexes ================= */
CumulativeFlowReportSchema.index(
  { project: 1, date: 1 },
  { unique: true },
);
