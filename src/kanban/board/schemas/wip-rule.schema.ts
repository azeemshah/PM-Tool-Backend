// src/kanban/board/schemas/wip-rule.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KanbanColumn } from '../../column/schemas/column.schema';

export type WipRuleDocument = WipRule & Document;

@Schema({ timestamps: true })
export class WipRule extends Document {
  @Prop({ type: Types.ObjectId, ref: 'KanbanColumn', required: true })
  column: Types.ObjectId; // Column to which the WIP rule applies

  @Prop({ type: Number, required: true })
  limit: number; // Maximum allowed work items in the column

  @Prop({ default: true })
  active: boolean; // Whether the rule is active
}

export const WipRuleSchema = SchemaFactory.createForClass(WipRule);
