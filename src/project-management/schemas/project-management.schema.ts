// src/schemas/project-management.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/* ----------------------------- Bug Schema ----------------------------- */
@Schema({ timestamps: true })
export class Bug extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ enum: ['lowest', 'low', 'high', 'highest'] })
  priority?: string;

  @Prop({ enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reporter?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  taskId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subtask' })
  subtaskId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop([String])
  attachments?: string[];
}

export const BugSchema = SchemaFactory.createForClass(Bug);

/* ----------------------------- Subtask Schema ----------------------------- */
@Schema({ timestamps: true })
export class Subtask extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ enum: ['lowest', 'low', 'high', 'highest'] })
  priority?: string;

  @Prop({ enum: ['todo', 'in-progress', 'done'], default: 'todo' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop([BugSchema])
  bugs?: Bug[];
}

export const SubtaskSchema = SchemaFactory.createForClass(Subtask);

/* ----------------------------- Task Schema ----------------------------- */
@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ enum: ['lowest', 'low', 'high', 'highest'] })
  priority?: string;

  @Prop({ enum: ['todo', 'in-progress', 'done'], default: 'todo' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reporter?: Types.ObjectId;

  @Prop()
  dueDate?: Date;

  @Prop([SubtaskSchema])
  subtasks?: Subtask[];

  @Prop([BugSchema])
  bugs?: Bug[];

  @Prop({ type: Types.ObjectId, ref: 'Story' })
  storyId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

/* ----------------------------- Story Schema ----------------------------- */
@Schema({ timestamps: true })
export class Story extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop([TaskSchema])
  tasks?: Task[];

  @Prop({ type: Types.ObjectId, ref: 'Epic' })
  epicId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;
}

export const StorySchema = SchemaFactory.createForClass(Story);

/* ----------------------------- Epic Schema ----------------------------- */
@Schema({ timestamps: true })
export class Epic extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop([StorySchema])
  stories?: Story[];

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;
}

export const EpicSchema = SchemaFactory.createForClass(Epic);

/* ----------------------------- Project Schema ----------------------------- */
@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop([EpicSchema])
  epics?: Epic[];

  @Prop([StorySchema])
  stories?: Story[];

  @Prop([TaskSchema])
  tasks?: Task[];

  @Prop([SubtaskSchema])
  subtasks?: Subtask[];

  @Prop([BugSchema])
  bugs?: Bug[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
