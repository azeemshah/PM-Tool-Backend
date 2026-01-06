// src/kanban/board/kanban-board.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KanbanBoard } from './schemas/kanban-board.schema';
import { KanbanColumn } from './schemas/kanban-column.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { MoveWorkItemDto } from './dto/move-work-item.dto';
import { CreateWorkItemDto } from '../work-item/dto/create-work-item.dto';
import { WorkItem } from '../work-item/schemas/work-item.schema';

@Injectable()
export class KanbanBoardService {
  workItemModel: any;
  constructor(
    @InjectModel(KanbanBoard.name) private readonly boardModel: Model<KanbanBoard>,
    @InjectModel(KanbanColumn.name) private readonly columnModel: Model<KanbanColumn>,
  ) {}

  // -------------------- Board CRUD --------------------

  async createBoard(createBoardDto: CreateBoardDto): Promise<KanbanBoard> {
    const board = new this.boardModel(createBoardDto);
    return board.save();
  }

  // Nested populate to get work items inside columns
  async findAllBoards(): Promise<KanbanBoard[]> {
    return this.boardModel
      .find()
      .populate({
        path: 'columns',
        populate: { path: 'workItems' },
      })
      .exec();
  }

  async findBoardById(id: string): Promise<KanbanBoard> {
    const board = await this.boardModel
      .findById(id)
      .populate({
        path: 'columns',
        populate: { path: 'workItems' },
      })
      .exec();

    if (!board) throw new NotFoundException(`Board with ID ${id} not found`);
    return board;
  }

  async updateBoard(id: string, updateBoardDto: UpdateBoardDto): Promise<KanbanBoard> {
    const updated = await this.boardModel
      .findByIdAndUpdate(id, updateBoardDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`Board with ID ${id} not found`);
    return updated;
  }

  async deleteBoard(id: string): Promise<void> {
    const result = await this.boardModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Board with ID ${id} not found`);
  }

  // Get all columns for a board
  async getBoardColumns(boardId: string): Promise<KanbanColumn[]> {
    const board = await this.findBoardById(boardId);
    return board.columns as any;
  }

  // -------------------- Column CRUD --------------------

  async createColumn(boardId: string, createColumnDto: CreateColumnDto): Promise<KanbanColumn> {
    const board = await this.findBoardById(boardId);
    const column = new this.columnModel({ ...createColumnDto, board: board._id });
    await column.save();
    board.columns.push(column._id);
    await board.save();
    return column;
  }

  async updateColumn(
    boardId: string,
    columnId: string,
    updateColumnDto: UpdateColumnDto,
  ): Promise<KanbanColumn> {
    await this.findBoardById(boardId);
    const column = await this.columnModel
      .findByIdAndUpdate(columnId, updateColumnDto, { new: true })
      .exec();
    if (!column) throw new NotFoundException(`Column with ID ${columnId} not found`);
    return column;
  }

  async deleteColumn(boardId: string, columnId: string): Promise<void> {
    const board = await this.findBoardById(boardId);
    const column = await this.columnModel.findByIdAndDelete(columnId).exec();
    if (!column) throw new NotFoundException(`Column with ID ${columnId} not found`);
    board.columns = board.columns.filter((id) => id.toString() !== columnId);
    await board.save();
  }

  // -------------------- Move Work Item --------------------

  async moveWorkItem(boardId: string, moveWorkItemDto: MoveWorkItemDto) {
    const { workItemId, fromColumnId, toColumnId, position } = moveWorkItemDto;

    // Validate IDs
    if (!Types.ObjectId.isValid(boardId)) throw new BadRequestException('Invalid board ID');
    if (!Types.ObjectId.isValid(workItemId)) throw new BadRequestException('Invalid work item ID');
    if (!Types.ObjectId.isValid(fromColumnId))
      throw new BadRequestException('Invalid source column ID');
    if (!Types.ObjectId.isValid(toColumnId))
      throw new BadRequestException('Invalid target column ID');

    try {
      // Find board
      const board = await this.boardModel.findById(boardId).populate('columns').exec();
      if (!board) throw new NotFoundException('Board not found');

      // Ensure target column belongs to this board
      if (!board.columns.map((c) => c._id.toString()).includes(toColumnId)) {
        throw new BadRequestException('Target column does not belong to this board');
      }

      // Find columns
      const fromColumn = await this.columnModel.findById(fromColumnId).exec();
      const toColumn = await this.columnModel.findById(toColumnId).exec();
      if (!fromColumn) throw new NotFoundException('Source column not found');
      if (!toColumn) throw new NotFoundException('Target column not found');

      // Check work item exists in source column
      if (
        !fromColumn.workItems ||
        !fromColumn.workItems.find((id) => id.toString() === workItemId)
      ) {
        throw new NotFoundException('Work item not found in source column');
      }

      // Remove work item from source column
      fromColumn.workItems = fromColumn.workItems.filter((id) => id.toString() !== workItemId);

      // Add work item to target column at correct position
      if (!toColumn.workItems) toColumn.workItems = [];
      const insertPos =
        position !== undefined && position >= 0 && position <= toColumn.workItems.length
          ? position
          : toColumn.workItems.length;
      toColumn.workItems.splice(insertPos, 0, new Types.ObjectId(workItemId));

      // Save columns
      await fromColumn.save();
      await toColumn.save();

      return { message: 'Work item moved successfully' };
    } catch (err) {
      console.error('Move Work Item Error:', err);
      if (err.status && err.response) throw err;
      throw new InternalServerErrorException('Failed to move work item');
    }
  }
}
