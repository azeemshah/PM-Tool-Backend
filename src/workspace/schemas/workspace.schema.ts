import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkspaceDocument = Workspace & Document;

@Schema({ timestamps: true })
export class Workspace {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  members: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Project', default: [] })
  projects: Types.ObjectId[];

  @Prop({ default: 'active', enum: ['active', 'inactive', 'archived'] })
  status: string;

  @Prop({ default: null })
  avatar: string;

  @Prop({ default: null })
  logo: string;

  @Prop({ type: Map, default: {} })
  settings: Record<string, any>;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
