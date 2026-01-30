// src/kanban/notification/schemas/notification.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
  MENTION = 'MENTION',
  DUE_DATE_REMINDER = 'DUE_DATE_REMINDER',
  WORK_ITEM_CREATED = 'WORK_ITEM_CREATED',
  WORK_ITEM_UPDATED = 'WORK_ITEM_UPDATED',
  WORK_ITEM_DELETED = 'WORK_ITEM_DELETED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  WORKSPACE_UPDATED = 'WORKSPACE_UPDATED',
  WORKSPACE_DELETED = 'WORKSPACE_DELETED',
  SYSTEM = "SYSTEM",
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender?: Types.ObjectId;

  @Prop({ enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'Workspace' })
  workspace?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, refPath: 'onModel' })
  relatedId?: Types.ObjectId;

  @Prop({ type: String, enum: ['WorkItem', 'KanbanBoard', 'Sprint'] })
  onModel?: string;

  @Prop({ type: Types.ObjectId, ref: 'WorkItem' })
  workItem?: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
