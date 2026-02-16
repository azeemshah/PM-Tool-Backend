import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkItem } from '../work-item/schemas/work-item.schema';
import { UpdateColumnDto } from './dto/update-column.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { KanbanColumn } from './schemas/column.schema';
import { KanbanBoard } from '../board/schemas/kanban-board.schema';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/schemas/notification.schema';

@Injectable()
export class ColumnService {
  constructor(
    @InjectModel(KanbanColumn.name)
    private readonly columnModel: Model<KanbanColumn>,
    @InjectModel(KanbanBoard.name)
    private readonly boardModel: Model<KanbanBoard>,
    @InjectModel(WorkItem.name)
    private readonly workItemModel: Model<WorkItem>,
    private readonly notificationService: NotificationService,
    @InjectModel('Workspace') private readonly workspaceModel: Model<any>,
  ) {}

  // -------------------- Column CRUD --------------------

  async createColumn(createColumnDto: CreateColumnDto, userId: string): Promise<KanbanColumn> {
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

    const savedColumn = await column.save();

    // Notify workspace members about the new column
    if (board.workspaceId) {
      this.notifyBoardMembers(
        board.workspaceId.toString(),
        userId,
        `New column "${savedColumn.name}" created in board "${board.name}"`,
        NotificationType.SYSTEM,
        board._id,
      );
    }

    return savedColumn;
  }

  async updateColumn(columnId: string, updateColumnDto: UpdateColumnDto): Promise<KanbanColumn> {
    const column = await this.columnModel.findByIdAndUpdate(columnId, updateColumnDto, {
      new: true,
    });

    if (!column) throw new NotFoundException(`Column with ID ${columnId} not found`);

    return column;
  }

  async deleteColumn(columnId: string, userId?: string): Promise<void> {
    const column = await this.columnModel.findById(columnId).exec();
    if (!column) throw new NotFoundException(`Column with ID ${columnId} not found`);

    await this.workItemModel.deleteMany({ status: column._id }).exec();
    await column.deleteOne();

    // Notify
    const board = await this.boardModel.findById(column.BoardId).select('workspaceId name').lean();
    if (board && board.workspaceId && userId) {
      this.notifyBoardMembers(
        board.workspaceId.toString(),
        userId,
        `Column "${column.name}" deleted from board "${board.name}"`,
        NotificationType.SYSTEM,
        board._id,
      );
    }
  }

  // Helper to notify members
  private async notifyBoardMembers(
    workspaceId: string,
    senderId: string,
    message: string,
    type: NotificationType,
    boardId: any,
  ) {
    try {
      // Cast to any to bypass strict type checking on the generic Model<any>
      const workspace = await (this.workspaceModel as any)
        .findById(workspaceId)
        .select('members OwnedBy')
        .lean();
      if (!workspace) return;

      const memberIds = workspace.members ? workspace.members.map((m: any) => m.toString()) : [];
      if (workspace.OwnedBy) memberIds.push(workspace.OwnedBy.toString());

      const uniqueRecipients = new Set(memberIds);

      for (const recipientId of uniqueRecipients) {
        if (recipientId === senderId) continue;

        await this.notificationService.create({
          recipient: new Types.ObjectId(recipientId as string),
          type,
          message,
          workspace: new Types.ObjectId(workspaceId),
          relatedId: new Types.ObjectId(boardId),
          onModel: 'KanbanBoard',
        } as any);
      }
    } catch (error) {
      console.error('Failed to notify board members:', error);
    }
  }

  async getBoardColumns(boardId: string): Promise<KanbanColumn[]> {
    if (!Types.ObjectId.isValid(boardId)) {
      throw new BadRequestException('Invalid board ID');
    }

    const columns = await this.columnModel
      .find({ BoardId: new Types.ObjectId(boardId) })
      .sort({ position: 1 })
      .exec();

    return columns;
  }

  async reorderColumns(boardId: string, columnIds: string[]): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(boardId)) {
      throw new BadRequestException('Invalid board ID');
    }

    // Update positions for all columns
    for (let i = 0; i < columnIds.length; i++) {
      if (!Types.ObjectId.isValid(columnIds[i])) {
        throw new BadRequestException(`Invalid column ID at index ${i}`);
      }

      await this.columnModel.findByIdAndUpdate(columnIds[i], { position: i }, { new: true });
    }

    return { message: 'Columns reordered successfully' };
  }

  async moveColumn(columnId: string, newPosition: number): Promise<KanbanColumn> {
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
