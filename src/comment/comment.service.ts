import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './schemas/comment.schema';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
  ) {}

  create(data: any) {
    return this.commentModel.create(data);
  }

  getByIssue(issueId: string) {
    return this.commentModel
      .find({ issueId })
      .populate('userId', 'name');
  }

  remove(id: string) {
    return this.commentModel.findByIdAndDelete(id);
  }
}
