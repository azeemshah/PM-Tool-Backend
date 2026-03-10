// src/search/schemas/saved-filter.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/*
  Saved Filter
  Stores user-defined search filters for Kanban boards, work items, and reports
*/

@Schema({ timestamps: true, collection: 'pm_savedfilters' })
export class SavedFilter extends Document {
  /* ================= Filter Name ================= */
  @Prop({ required: true })
  name: string;

  /* ================= Description ================= */
  @Prop()
  description?: string;

  /* ================= Workspace Context ================= */
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspace: Types.ObjectId;

  /* ================= Owner ================= */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  /* ================= Filter Criteria ================= */
  @Prop({ type: Object, required: true })
  filterCriteria: Record<string, any>; // Example: { status: ['todo','in-progress'], assignee: 'userId' }

  /* ================= Optional Column Preferences ================= */
  @Prop({ type: [String], default: [] })
  columns: string[];
}

export const SavedFilterSchema = SchemaFactory.createForClass(SavedFilter);

/* ================= Indexes ================= */
SavedFilterSchema.index({ workspace: 1, user: 1, name: 1 }, { unique: true });
