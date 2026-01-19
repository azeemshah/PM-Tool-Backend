// sprint.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SprintStatus } from '../enums/sprint-status.enum';

@Schema({ timestamps: true })
export class Sprint extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  goal?: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({
    type: String,
    enum: SprintStatus,
    default: SprintStatus.PLANNED,
  })
  status: SprintStatus;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'WorkItem' }],
    default: [],
  })
  workItems: Types.ObjectId[];
}

export const SprintSchema = SchemaFactory.createForClass(Sprint);
