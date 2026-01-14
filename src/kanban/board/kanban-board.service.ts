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
import { KanbanColumn } from '../column/schemas/column.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateColumnDto } from '../column/dto/create-column.dto';
import { UpdateColumnDto } from '../column/dto/update-column.dto';
import { MoveWorkItemDto } from './dto/move-work-item.dto';
import { WorkItem } from '../work-item/schemas/work-item.schema';

@Injectable()
export class KanbanBoardService {
  constructor(
    @InjectModel(KanbanBoard.name)
    private readonly boardModel: Model<KanbanBoard>,
    @InjectModel(KanbanColumn.name)
    private readonly columnModel: Model<KanbanColumn>,
    @InjectModel(WorkItem.name)
    private readonly workItemModel: Model<WorkItem>,
  ) {}

  // -------------------- Board CRUD --------------------

  async createBoard(createBoardDto: CreateBoardDto): Promise<KanbanBoard> {
    const board = new this.boardModel(createBoardDto);
    return board.save();
  }

  async findBoardById(id: string): Promise<any> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) throw new NotFoundException(`Board with ID ${id} not found`);

    const columns = await this.columnModel
      .find({ BoardId: board._id })
      .exec();

    return {
      ...board.toObject(),
      columns,
    };
  }

  async findBoardsByWorkspaceId(workspaceId: string): Promise<KanbanBoard[]> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }
    return this.boardModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .exec();
  }

  async updateBoard(id: string, updateBoardDto: UpdateBoardDto): Promise<KanbanBoard> {
    const updated = await this.boardModel
      .findByIdAndUpdate(id, updateBoardDto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException(`Board with ID ${id} not found`);
    return updated;
  }

  async deleteBoard(id: string): Promise<void> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) throw new NotFoundException(`Board with ID ${id} not found`);

    // Remove board reference from all columns
    await this.columnModel.updateMany(
      { BoardId: board._id },
      { $pull: { BoardId: board._id } },
    );

    await board.deleteOne();
  }

  // -------------------- Get Board Columns --------------------

  async getBoardColumns(boardId: string): Promise<KanbanColumn[]> {
    if (!Types.ObjectId.isValid(boardId)) {
      throw new BadRequestException('Invalid board ID');
    }

    return this.columnModel
      .find({ BoardId: new Types.ObjectId(boardId) })
      .populate('workItems')
      .exec();
  }

  
  // -------------------- Move Work Item --------------------

  // async moveWorkItem(boardId: string, moveWorkItemDto: MoveWorkItemDto) {
  //   const { workItemId, fromColumnId, toColumnId, position } = moveWorkItemDto;

  //   if (!Types.ObjectId.isValid(boardId)) throw new BadRequestException('Invalid board ID');
  //   if (!Types.ObjectId.isValid(workItemId))
  //     throw new BadRequestException('Invalid work item ID');

  //   try {
  //     // Ensure target column belongs to board
  //     const targetColumn = await this.columnModel.findOne({
  //       _id: toColumnId,
  //       BoardId: boardId,
  //     });

  //     if (!targetColumn) {
  //       throw new BadRequestException('Target column does not belong to this board');
  //     }

  //     const fromColumn = await this.columnModel.findById(fromColumnId);
  //     if (!fromColumn) throw new NotFoundException('Source column not found');

  //     const workItem = await this.workItemModel.findById(workItemId);
  //     if (!workItem) throw new NotFoundException('Work item not found');

  //     // Remove from source column
  //     fromColumn.workItems = (fromColumn.workItems || []).filter(
  //       (id) => id.toString() !== workItemId,
  //     );

  //     // Insert into target column
  //     if (!targetColumn.workItems) targetColumn.workItems = [];

  //     const insertPos =
  //       position !== undefined &&
  //       position >= 0 &&
  //       position <= targetColumn.workItems.length
  //         ? position
  //         : targetColumn.workItems.length;

  //     targetColumn.workItems.splice(insertPos, 0, new Types.ObjectId(workItemId));

  //     await fromColumn.save();
  //     await targetColumn.save();

  //     await this.workItemModel.findByIdAndUpdate(workItemId, {
  //       status: targetColumn._id,
  //     });

  //     return { message: 'Work item moved successfully' };
  //   } catch (err) {
  //     console.error('Move Work Item Error:', err);
  //     if (err.status) throw err;
  //     throw new InternalServerErrorException('Failed to move work item');
  //   }
  // }

  // -------------------- Reorder Cards in List --------------------

//   async reorderCardsInList(
//     boardId: string,
//     columnId: string,
//     cardIds: string[],
//   ): Promise<{ message: string }> {
//     if (!Types.ObjectId.isValid(boardId)) throw new BadRequestException('Invalid board ID');
//     if (!Types.ObjectId.isValid(columnId)) throw new BadRequestException('Invalid column ID');

//     const column = await this.columnModel.findOne({
//       _id: columnId,
//       BoardId: boardId,
//     });

//     if (!column) {
//       throw new BadRequestException('Column does not belong to this board');
//     }

//     column.workItems = cardIds.map((id) => new Types.ObjectId(id));
//     await column.save();

//     return { message: 'Cards reordered successfully' };
//   }
}
