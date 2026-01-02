// src/kanban/roles/schemas/kanban-role.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KanbanRoleDocument = KanbanRole & Document;

@Schema({ timestamps: true })
export class KanbanRole extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;
}

export const KanbanRoleSchema = SchemaFactory.createForClass(KanbanRole);
