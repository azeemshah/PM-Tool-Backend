// src/audit/schemas/audit-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/*
  Audit Log
  Tracks all significant actions performed by users in the Kanban system
  Used for accountability, compliance, and activity history
*/

@Schema({ timestamps: true, collection: 'pm_auditlogs' })
export class AuditLog extends Document {
  /* ================= User ================= */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  /* ================= Action ================= */
  @Prop({ required: true })
  action: string; // e.g., "create-task", "update-status", "delete-comment"

  /* ================= Target ================= */
  @Prop({ type: String })
  targetType?: string; // e.g., "WorkItem", "Board", "Comment"

  @Prop({ type: Types.ObjectId })
  targetId?: Types.ObjectId; // ID of the affected document

  /* ================= Workspace Context ================= */
  @Prop({ type: Types.ObjectId, ref: 'Workspace' })
  workspace?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard' })
  board?: Types.ObjectId;

  /* ================= Additional Details ================= */
  @Prop({ type: Object, default: {} })
  details?: Record<string, any>; // Store extra metadata (old value, new value, etc.)

  /* ================= Metadata ================= */
  @Prop({ default: 'system' })
  performedBy: string; // can be 'system' or 'userId'
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

/* ================= Indexes ================= */
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ workspace: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
