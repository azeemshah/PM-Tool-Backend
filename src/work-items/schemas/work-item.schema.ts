import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * WorkItem Schema - Maps to unified Issue hierarchy
 * Maintained for backwards compatibility with work-items endpoints
 * 
 * Maps to Issue types:
 * - EPIC -> epic
 * - STORY -> story
 * - TASK -> task
 * - BUG -> bug
 * - SUBTASK -> subtask
 */
@Schema({ timestamps: true })
export class WorkItem extends Document {
  @Prop({ required: true })
  projectId: Types.ObjectId;

  /**
   * Issue type following Jira hierarchy:
   * - epic: Top level (no parent)
   * - story: Under epic
   * - task: Under epic
   * - bug: Under epic
   * - subtask: Under story/task/bug (only via parentId)
   */
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

  /**
   * For Subtask: Parent issue ID (Story/Task/Bug)
   * For others: null
   */
  @Prop()
  parentId: Types.ObjectId;

  /**
   * For Story/Task/Bug: Epic ID
   * For Subtask: null
   */
  @Prop()
  epicId: Types.ObjectId;

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
