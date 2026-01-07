import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Unified Issue Schema following real Jira hierarchy:
 * - Epic (parent level, no parent)
 * - Story (same level as Task/Bug under Epic)
 * - Task (same level as Story/Bug under Epic)
 * - Bug (same level as Story/Task under Epic)
 * - Subtask (only child level, can only be child of Story/Task/Bug)
 */
@Schema({ timestamps: true })
export class Issue extends Document {
  // ============ BASIC INFO ============
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

  // ============ HIERARCHY ============
  /**
   * type: 'epic' | 'story' | 'task' | 'bug' | 'subtask'
   *
   * Hierarchy Rules:
   * - Epic: Top level, no parentIssueId allowed
   * - Story/Task/Bug: Under Epic only, epicId must be set, no parentIssueId
   * - Subtask: Under Story/Task/Bug only, parentIssueId must be set, no epicId
   */
  @Prop({
    enum: ['epic', 'story', 'task', 'bug', 'subtask'],
    default: 'task',
  })
  type: string;

  /**
   * For Epic: null/undefined (top level)
   * For Story/Task/Bug: ObjectId of parent Epic
   * For Subtask: null/undefined (use parentIssueId instead)
   */
  @Prop({ type: Types.ObjectId, ref: 'Issue' })
  epicId?: Types.ObjectId;

  /**
   * ONLY for Subtask: ObjectId of parent Story/Task/Bug
   * For all other types: null/undefined
   */
  @Prop({ type: Types.ObjectId, ref: 'Issue' })
  parentIssueId?: Types.ObjectId;

  // ============ STATUS & PRIORITY ============
  @Prop({ default: 'medium' })
  priority: string; // lowest | low | medium | high | highest

  @Prop({
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
  })
  status: string;

  // ============ ASSIGNMENT ============
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter: Types.ObjectId;

  // ============ METADATA ============
  @Prop({ type: [String] })
  labels: string[];

  @Prop()
  estimate: number; // story points

  @Prop()
  dueDate?: Date;

  @Prop({ type: [String] })
  attachments?: string[];
}

export const IssueSchema = SchemaFactory.createForClass(Issue);

// Indexes for performance
IssueSchema.index({ projectId: 1 });
IssueSchema.index({ epicId: 1 });
IssueSchema.index({ parentIssueId: 1 });
IssueSchema.index({ type: 1 });
IssueSchema.index({ status: 1 });
IssueSchema.index({ assignee: 1 });
IssueSchema.index({ key: 1 });
