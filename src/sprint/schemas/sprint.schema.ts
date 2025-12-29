import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Sprint extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  boardId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  goal: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ default: 'planned' })
  status: string; // planned | active | completed
}

export const SprintSchema = SchemaFactory.createForClass(Sprint);
