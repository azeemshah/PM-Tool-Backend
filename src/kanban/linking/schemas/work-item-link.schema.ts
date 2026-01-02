// src/kanban/linking/schemas/work-item-link.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkItem } from '../../work-item/schemas/work-item.schema';

export type WorkItemLinkDocument = WorkItemLink & Document;

export enum LinkType {
  BLOCKS = 'blocks',
  RELATES_TO = 'relates_to',
  DUPLICATES = 'duplicates',
  DEPENDS_ON = 'depends_on',
}

@Schema({ timestamps: true })
export class WorkItemLink extends Document {
  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  sourceWorkItem: Types.ObjectId; // Source work item

  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  targetWorkItem: Types.ObjectId; // Target work item

  @Prop({ type: String, enum: LinkType, required: true })
  type: LinkType; // Type of link

  @Prop({ type: String })
  description?: string; // Optional description
}

export const WorkItemLinkSchema = SchemaFactory.createForClass(WorkItemLink);
