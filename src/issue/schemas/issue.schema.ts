import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Issue extends Document {

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Board' })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sprint' })
  sprintId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  key: string; // PMT-1

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ default: 'task' })
  type: string; // task | bug | story | epic

  @Prop({ default: 'medium' })
  priority: string; // low | medium | high

  @Prop({ default: 'todo' })
  status: string; // todo | in-progress | done

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter: Types.ObjectId;

  @Prop({ type: [String] })
  labels: string[];

  @Prop()
  estimate: number; // story points
}

export const IssueSchema = SchemaFactory.createForClass(Issue);
