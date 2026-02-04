import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KanbanLabelDocument = KanbanLabel & Document;

@Schema({ timestamps: true })
export class KanbanLabel extends Document {
  @Prop({ type: Types.ObjectId, ref: 'KanbanBoard', required: true })
  board: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, default: '#3b82f6' }) // blue-500 default
  color: string;
}

export const KanbanLabelSchema = SchemaFactory.createForClass(KanbanLabel);

// Ensure unique label names per board
KanbanLabelSchema.index({ board: 1, name: 1 }, { unique: true });
