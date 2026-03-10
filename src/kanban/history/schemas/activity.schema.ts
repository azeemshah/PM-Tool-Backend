import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'pm_activities' })
export class Activity extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace' })
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Item' })
  taskId?: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'create',
      'edit',
      'move',
      'status_change',
      'time_logged',
      'comment',
      'delete',
      'estimate',
    ],
  })
  type: string;

  @Prop({ type: Object, default: {} })
  details?: Record<string, any>;

  @Prop({ type: String })
  from?: string;

  @Prop({ type: String })
  to?: string;

  @Prop({ type: Number })
  timeSpentSeconds?: number;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ projectId: 1, taskId: 1, createdAt: -1 });
