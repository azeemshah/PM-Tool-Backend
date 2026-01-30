// src/kanban/comment/comment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { WorkItem } from '../work-item/schemas/work-item.schema';
import { HistoryService } from '../history/history.service';
import { KanbanBoard, KanbanBoardDocument } from '../board/schemas/kanban-board.schema';
import { KanbanColumn, ColumnDocument } from '../column/schemas/column.schema';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { WorkItem } from '../work-item/schemas/work-item.schema';
import { Item } from '@/work-items/schemas/work-item.schema';
import { User } from '../../users/schemas/user.schema';
import { Workspace } from '../../workspace/schemas/workspace.schema';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/schemas/notification.schema';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    @InjectModel(WorkItem.name) private readonly workItemModel: Model<WorkItem>,
    @InjectModel(KanbanBoard.name) private readonly boardModel: Model<KanbanBoardDocument>,
    @InjectModel(KanbanColumn.name) private readonly columnModel: Model<ColumnDocument>,
    private readonly historyService: HistoryService,
  ) { }
    @InjectModel(Item.name) private readonly itemModel: Model<Item>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
    private readonly notificationService: NotificationService,
  ) { }

  private async getActorName(actorId?: string) {
    if (!actorId) return undefined;
    const user = await this.userModel.findById(actorId).select('firstName lastName email').exec();
    if (!user) return undefined;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email;
  }

  // -------------------- Create Comment --------------------
  async createComment(dto: CreateCommentDto, actorId?: string): Promise<Comment> {
    const comment = new this.commentModel({
      workItem: new Types.ObjectId(dto.workItemId),
      parentComment: dto.parentCommentId ? new Types.ObjectId(dto.parentCommentId) : null,
      content: dto.content,
      userId: (dto.userId || actorId) ? new Types.ObjectId(dto.userId || actorId!) : undefined,
    });
    const savedComment = await comment.save();

    // Log activity
    try {
      const workItem = await this.workItemModel.findById(dto.workItemId).exec();
      if (workItem) {
        let projectId = workItem.spaceid;

        // Strategy 1: Try to get workspaceId from board if not on workItem
        if (!projectId && workItem.board) {
          const board = await this.boardModel.findById(workItem.board).select('workspaceId').exec();
          if (board) {
            projectId = board.workspaceId;
          }
        }

        // Strategy 2: Try to get workspaceId from column (via status) if status is an ID
        if (!projectId && workItem.status && Types.ObjectId.isValid(workItem.status)) {
          const column = await this.columnModel.findById(workItem.status).select('BoardId').exec();
          if (column && column.BoardId) {
            const board = await this.boardModel.findById(column.BoardId).select('workspaceId').exec();
            if (board) {
              projectId = board.workspaceId;
            }
          }
        }

        if (projectId) {
          await this.historyService.log({
            userId: (dto.userId || actorId) ? new Types.ObjectId(dto.userId || actorId!) : undefined,
            projectId: projectId,
            taskId: workItem._id,
            type: 'comment',
            details: {
              description: dto.content,
            },
          } as any);
        } else {
          console.warn(`[CommentService] Failed to log activity: No workspaceId found for workItem ${dto.workItemId}`);
        }
      }
    } catch (e) {
      console.error('Failed to log comment activity', e);
    
    // Notify relevant users
    try {
        let workItem: any = await this.workItemModel.findById(dto.workItemId).exec();
        if (!workItem) {
             workItem = await this.itemModel.findById(dto.workItemId).exec();
        }

        if (workItem) {
            const actorId = dto.userId;
            const actorName = await this.getActorName(actorId);
            const recipients = new Set<string>();

            // Notify Assignee (even if commenter)
            if (workItem.assignee) {
                recipients.add(workItem.assignee.toString());
            }

            // Notify Reporter/Creator (if not the commenter)
            const reporter = (workItem as any).reporter;
            if (reporter) {
                recipients.add(reporter.toString());
            }

            // Fetch workspace members to notify everyone
            const workspaceId = (workItem as any).workspace || (workItem as any).spaceid;
            if (workspaceId) {
                const workspace = await this.workspaceModel.findById(workspaceId).exec();
                if (workspace) {
                     if (workspace.OwnedBy) recipients.add(workspace.OwnedBy.toString());
                     if (workspace.members) {
                         workspace.members.forEach(m => recipients.add(m.toString()));
                     }
                }
            }
            
            // Also if it's a reply to a comment, notify the parent comment author?
            if (dto.parentCommentId) {
                const parent = await this.commentModel.findById(dto.parentCommentId);
                if (parent && parent.userId) {
                    recipients.add(parent.userId.toString());
                }
            }

            for (const recipientId of recipients) {
                await this.notificationService.create({
                    recipient: new Types.ObjectId(recipientId),
                    sender: actorId ? new Types.ObjectId(actorId) : undefined,
                    type: NotificationType.COMMENT_ADDED,
                    message: `${actorName || 'Someone'} commented on ${workItem.title}`,
                    workspace: workspaceId,
                    workItem: workItem._id,
                });
            }
        }
    } catch (err) {
        console.error('Failed to send comment notification', err);
    }

    return savedComment.populate('userId');
  }

  // -------------------- Get All Comments --------------------
  async getAllComments(): Promise<Comment[]> {
    return this.commentModel
      .find()
      .populate('workItem')
      .populate('parentComment')
      .populate('userId')
      .exec();
  }

  // -------------------- Get Comments by Work Item ID --------------------
  async getCommentsByWorkItem(workItemId: string): Promise<Comment[]> {
    return this.commentModel
      .find({ workItem: new Types.ObjectId(workItemId) })
      .populate('userId')
      .sort({ createdAt: -1 }) // Newest first
      .exec();
  }

  // -------------------- Get Comment by ID --------------------
  async getCommentById(id: string): Promise<Comment> {
    const comment = await this.commentModel
      .findById(id)
      .populate('workItem')
      .populate('parentComment')
      .populate('userId')
      .exec();
    if (!comment) throw new NotFoundException(`Comment with ID ${id} not found`);
    return comment;
  }

  // -------------------- Update Comment --------------------
  async updateComment(id: string, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.commentModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .populate('userId')
      .exec();
    if (!comment) throw new NotFoundException(`Comment with ID ${id} not found`);
    return comment;
  }

  // -------------------- Delete Comment --------------------
  async deleteComment(id: string): Promise<{ message: string }> {
    const result = await this.commentModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Comment with ID ${id} not found`);
    return { message: 'Comment deleted successfully' };
  }
}
