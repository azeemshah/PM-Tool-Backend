import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type EmailQueueDocument = EmailQueue & Document;

@Schema({ timestamps: true, collection: 'pm_email_queue' })
export class EmailQueue {
  @Prop({ required: true, trim: true })
  to: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  html: string;

  @Prop({ type: SchemaTypes.Mixed })
  context?: Record<string, any>;

  @Prop({ enum: ['PENDING', 'FAILED'], default: 'PENDING' })
  status: 'PENDING' | 'FAILED';

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  failedAt?: Date;

  @Prop()
  lastError?: string;
}

export const EmailQueueSchema = SchemaFactory.createForClass(EmailQueue);

EmailQueueSchema.index({ status: 1, retryCount: 1, createdAt: 1 });
