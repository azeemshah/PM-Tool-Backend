// src/kanban/board/schemas/kanban-board.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KanbanColumn } from '../../column/schemas/column.schema';

export type KanbanBoardDocument = KanbanBoard & Document;

@Schema({ timestamps: true, collection: 'pm_kanbanboards' })
export class KanbanBoard extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;
}
export const KanbanBoardSchema = SchemaFactory.createForClass(KanbanBoard);
