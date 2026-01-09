import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkItem } from '../work-item/schemas/work-item.schema';
import { UpdateColumnDto } from './dto/update-column.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { KanbanColumn } from './schemas/column.schema';

@Injectable()
export class ColumnService {
  getBoardColumns(boardId: string): KanbanColumn[] | PromiseLike<KanbanColumn[]> {
      throw new Error('Method not implemented.');
  }
  constructor(
    @InjectModel(KanbanColumn.name)
    private readonly columnModel: Model<KanbanColumn>,
    @InjectModel(WorkItem.name)
    private readonly workItemModel: Model<WorkItem>,
  ) {}

  // -------------------- Column CRUD --------------------

  async createColumn(
    createColumnDto: CreateColumnDto,
  ): Promise<KanbanColumn> {
    const board = await this.columnModel
      .findById(createColumnDto.BoardId)
      .exec();

    if (!board) throw new NotFoundException('Board not found');

    const column = new this.columnModel({
      ...createColumnDto,
      BoardId: board._id,
    });

    return column.save();
  }

  async updateColumn(
    boardId: string,
    columnId: string,
    updateColumnDto: UpdateColumnDto,
  ): Promise<KanbanColumn> {
    if (!Types.ObjectId.isValid(boardId)) {
      throw new BadRequestException('Invalid board ID');
    }

    const column = await this.columnModel.findOneAndUpdate(
      { _id: columnId, BoardId: boardId },
      updateColumnDto,
      { new: true },
    );

    if (!column)
      throw new NotFoundException(`Column with ID ${columnId} not found`);

    return column;
  }

  async deleteColumn(columnId: string): Promise<void> {
    const column = await this.columnModel.findById(columnId).exec();
    if (!column)
      throw new NotFoundException(`Column with ID ${columnId} not found`);

    await this.workItemModel.deleteMany({ status: column._id }).exec();
    await column.deleteOne();
  }
}
