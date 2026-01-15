// src/dashboard/schemas/dashboard-widget.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/*
  Dashboard Widget
  Stores user-specific or team-specific widget configurations for Kanban dashboards
*/

@Schema({ timestamps: true })
export class DashboardWidget extends Document {
  /* ================= Workspace ================= */
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspace: Types.ObjectId;

  /* ================= Widget Type ================= */
  @Prop({
    required: true,
    enum: ['cumulativeFlow', 'cycleTime', 'leadTime', 'workload', 'custom'],
  })
  widgetType: string;

  /* ================= User / Team ================= */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  /* ================= Widget Settings ================= */
  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  /* ================= Layout ================= */
  @Prop({ type: Number, default: 0 })
  positionX: number;

  @Prop({ type: Number, default: 0 })
  positionY: number;

  @Prop({ type: Number, default: 1 })
  width: number;

  @Prop({ type: Number, default: 1 })
  height: number;

  /* ================= Visibility ================= */
  @Prop({ default: true })
  isVisible: boolean;
}

export const DashboardWidgetSchema = SchemaFactory.createForClass(DashboardWidget);

/* ================= Indexes ================= */
DashboardWidgetSchema.index({ workspace: 1, user: 1 });
DashboardWidgetSchema.index({ widgetType: 1 });
