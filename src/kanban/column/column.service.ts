import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkItem } from '../work-item/schemas/work-item.schema';
import { UpdateColumnDto } from './dto/update-column.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { KanbanColumn } from './schemas/column.schema';
import { KanbanBoard } from '../board/schemas/kanban-board.schema';

@Injectable()
export class ColumnService {
  getBoardColumns(boardId: string): KanbanColumn[] | PromiseLike<KanbanColumn[]> {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectModel(KanbanColumn.name)
    private readonly columnModel: Model<KanbanColumn>,
    @InjectModel(KanbanBoard.name)
    private readonly boardModel: Model<KanbanBoard>,
    @InjectModel(WorkItem.name)
    private readonly workItemModel: Model<WorkItem>,
  ) { }

  // -------------------- Column CRUD --------------------

  async createColumn(createColumnDto: CreateColumnDto): Promise<KanbanColumn> {
    // Find the board
    const board = await this.boardModel.findById(createColumnDto.board).exec();
    if (!board) throw new NotFoundException('Board not found');

    // Count existing columns for this board
    const columnCount = await this.columnModel.countDocuments({ BoardId: board._id });

    // Create new column with position set after existing columns
    const column = new this.columnModel({
      ...createColumnDto,
      BoardId: board._id,
      position: columnCount, // sets position as next available slot
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

    if (!column) throw new NotFoundException(`Column with ID ${columnId} not found`);

    return column;
  }

  async deleteColumn(columnId: string): Promise<void> {
    const column = await this.columnModel.findById(columnId).exec();
    if (!column) throw new NotFoundException(`Column with ID ${columnId} not found`);

    await this.workItemModel.deleteMany({ status: column._id }).exec();
    await column.deleteOne();
  }

  async moveColumn(
    columnId: string,
    newPosition: number,
  ): Promise<KanbanColumn> {
    const column = await this.columnModel.findById(columnId).exec();
    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const boardId = column.BoardId;
    const oldPosition = column.position;

    if (newPosition === oldPosition) {
      return column;
    }

    // Moving column forward (e.g. pos 2 → 5)
    if (newPosition > oldPosition) {
      await this.columnModel.updateMany(
        {
          BoardId: boardId,
          position: { $gt: oldPosition, $lte: newPosition },
        },
        { $inc: { position: -1 } },
      );
    }

    // Moving column backward (e.g. pos 5 → 2)
    if (newPosition < oldPosition) {
      await this.columnModel.updateMany(
        {
          BoardId: boardId,
          position: { $gte: newPosition, $lt: oldPosition },
        },
        { $inc: { position: 1 } },
      );
    }

    column.position = newPosition;
    return column.save();
  }

}
