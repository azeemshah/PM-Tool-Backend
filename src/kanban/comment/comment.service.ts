// src/kanban/comment/comment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
  ) {}

  // -------------------- Create Comment --------------------
  async createComment(dto: CreateCommentDto): Promise<Comment> {
    const comment = new this.commentModel({
      workItem: new Types.ObjectId(dto.workItemId),
      parentComment: dto.parentCommentId ? new Types.ObjectId(dto.parentCommentId) : null,
      content: dto.content,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
    });
    return comment.save();
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

  // -------------------- Delete Comment --------------------
  async deleteComment(id: string): Promise<{ message: string }> {
    const result = await this.commentModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Comment with ID ${id} not found`);
    return { message: 'Comment deleted successfully' };
  }
}
