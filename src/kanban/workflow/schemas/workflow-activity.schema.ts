// src/kanban/workflow/schemas/workflow-activity.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Workflow } from './workflow.schema';
import { WorkflowState } from './workflow-state.schema';
import { WorkflowTransition } from './workflow-transition.schema';

export type WorkflowActivityDocument = WorkflowActivity & Document;

@Schema({ timestamps: true })
export class WorkflowActivity extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workflow', required: true })
  workflow: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkflowState' })
  fromState?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkflowState' })
  toState?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkflowTransition' })
  transition?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  occurredAt: Date;
}

export const WorkflowActivitySchema = SchemaFactory.createForClass(WorkflowActivity);
