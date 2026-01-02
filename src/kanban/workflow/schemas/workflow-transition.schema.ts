// src/kanban/workflow/schemas/workflow-transition.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Workflow } from './workflow.schema';
import { WorkflowState } from './workflow-state.schema';

export type WorkflowTransitionDocument = WorkflowTransition & Document;

@Schema({ timestamps: true })
export class WorkflowTransition extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'WorkflowState', required: true })
  fromState: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkflowState', required: true })
  toState: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workflow', required: true })
  workflow: Types.ObjectId; // Reference to the parent workflow
}

export const WorkflowTransitionSchema = SchemaFactory.createForClass(WorkflowTransition);
