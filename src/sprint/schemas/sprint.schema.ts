import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SprintDocument = Sprint & Document;

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

@Schema({ timestamps: true })
export class Sprint {
  @Prop({ required: true })
  name: string;

  @Prop()
  goal: string;

  @Prop({
    enum: SprintStatus,
    default: SprintStatus.PLANNED,
  })
  status: SprintStatus;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  // 🔥 IMPORTANT CHANGE
  @Prop({ required: true })
  workspaceId: string;
}

export const SprintSchema = SchemaFactory.createForClass(Sprint);
