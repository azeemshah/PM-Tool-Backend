// src/kanban/workflow/schemas/workflow-state.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Workflow } from './workflow.schema';

export type WorkflowStateDocument = WorkflowState & Document;

@Schema({ timestamps: true })
export class WorkflowState extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Workflow', required: true })
  workflow: Types.ObjectId; // Reference to the parent workflow
}

export const WorkflowStateSchema = SchemaFactory.createForClass(WorkflowState);
