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

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    @InjectModel(WorkItem.name) private readonly workItemModel: Model<WorkItem>,
    @InjectModel(KanbanBoard.name) private readonly boardModel: Model<KanbanBoardDocument>,
    @InjectModel(KanbanColumn.name) private readonly columnModel: Model<ColumnDocument>,
    private readonly historyService: HistoryService,
  ) { }

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

  // -------------------- Delete Comment --------------------
  async deleteComment(id: string): Promise<{ message: string }> {
    const result = await this.commentModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Comment with ID ${id} not found`);
    return { message: 'Comment deleted successfully' };
  }
}
