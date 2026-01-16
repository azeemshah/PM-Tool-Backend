import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ColumnDocument = KanbanColumn & Document;

@Schema({ timestamps: true })
export class KanbanColumn extends Document {
  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard', required: true })
  BoardId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Number, default: 0 })
  position: number;

  @Prop({ type: [Types.ObjectId], ref: 'WorkItem', default: [] })
  workItems: Types.ObjectId[];
}

export const ColumnSchema = SchemaFactory.createForClass(KanbanColumn);
