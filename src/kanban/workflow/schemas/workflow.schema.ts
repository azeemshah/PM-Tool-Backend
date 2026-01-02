// src/kanban/workflow/schemas/workflow.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkflowState } from './workflow-state.schema';
import { WorkflowTransition } from './workflow-transition.schema';

export type WorkflowDocument = Workflow & Document;

@Schema({ timestamps: true })
export class Workflow extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'WorkflowState' }], default: [] })
  states: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'WorkflowTransition' }], default: [] })
  transitions: Types.ObjectId[];
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);
