import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Board } from './schemas/board.schema';

@Injectable()
export class BoardService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<Board>,
  ) {}

  create(data: any) {
    return this.boardModel.create(data);
  }

  getByProject(projectId: string) {
    return this.boardModel.find({ projectId });
  }
}
