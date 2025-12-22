// src/schemas/jira.schemas.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// --------------------- Project ---------------------
@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  key: string; // e.g., PROJ

  @Prop()
  description: string;

  @Prop({ required: true })
  type: string; // software | business | service


  @Prop({ type: [Types.ObjectId], ref: 'User' })
  members: Types.ObjectId[];

  @Prop({ default: 'active' })
  status: string; // active | archived
}
export const ProjectSchema = SchemaFactory.createForClass(Project);
