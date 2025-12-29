import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog extends Document {

  @Prop({ type: Types.ObjectId })
  entityId: Types.ObjectId;

  @Prop({ required: true })
  entityType: string; // Project | WorkItem

  @Prop({ required: true })
  action: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  performedBy: Types.ObjectId;

  @Prop()
  oldValue: string;

  @Prop()
  newValue: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
