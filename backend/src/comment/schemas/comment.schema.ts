import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {

  @Prop({ type: Types.ObjectId, ref: 'WorkItem', required: true })
  workItemId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  message: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
