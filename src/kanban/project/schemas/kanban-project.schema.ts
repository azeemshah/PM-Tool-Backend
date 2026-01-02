// src/kanban/project/schemas/kanban-project.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KanbanProjectDocument = KanbanProject & Document;

@Schema({ timestamps: true })
export class KanbanProject extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  users: Types.ObjectId[]; // Array of user IDs assigned to the project
}

export const KanbanProjectSchema = SchemaFactory.createForClass(KanbanProject);
