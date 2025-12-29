import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class WorkItem extends Document {
  @Prop({ required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  issueType: string;

  @Prop({ required: true })
  summary: string;

  @Prop()
  description: string;

  @Prop({ default: 'CREATE' })
  status: string;

  @Prop()
  priority: string;

  @Prop()
  assigneeId: Types.ObjectId;

  @Prop({ required: true })
  reporterId: Types.ObjectId;

  @Prop()
  sprintId: Types.ObjectId;

  @Prop()
  teamId: Types.ObjectId;

  @Prop()
  parentId: Types.ObjectId;

  @Prop({ type: [String] })
  labels: string[];

  @Prop()
  storyPoints: number;

  @Prop()
  startDate: Date;

  @Prop()
  dueDate: Date;

  @Prop({ default: false })
  isFlagged: boolean;

  @Prop()
  resolution: string;

  @Prop()
  resolutionDate: Date;
}

export const WorkItemSchema = SchemaFactory.createForClass(WorkItem);
