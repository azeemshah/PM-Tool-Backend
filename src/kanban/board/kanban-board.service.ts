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
import { MoveWorkItemDto } from './dto/move-work-item.dto';
import { WorkItem } from '../work-item/schemas/work-item.schema';
import { Workspace } from '../../workspace/schemas/workspace.schema';
import { User } from '../../users/schemas/user.schema';
import { EmailService } from '../../email/email.service';

@Injectable()
export class KanbanBoardService {
  constructor(
    @InjectModel(KanbanBoard.name)
    private readonly boardModel: Model<KanbanBoard>,
    @InjectModel(KanbanColumn.name)
    private readonly columnModel: Model<KanbanColumn>,
    @InjectModel(WorkItem.name)
    private readonly workItemModel: Model<WorkItem>,
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<Workspace>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly emailService: EmailService,
  ) {}

  // -------------------- Board CRUD --------------------

  async createBoard(createBoardDto: CreateBoardDto): Promise<KanbanBoard> {
    const board = new this.boardModel(createBoardDto);
    return board.save();
  }

  async findBoardById(id: string): Promise<any> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) throw new NotFoundException(`Board with ID ${id} not found`);

    const columns = await this.columnModel.find({ BoardId: board._id }).exec();

    return {
      ...board.toObject(),
      columns,
    };
  }

  async findBoardsByWorkspaceId(workspaceId: string): Promise<KanbanBoard[]> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }
    return this.boardModel.find({ workspaceId: new Types.ObjectId(workspaceId) }).exec();
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
    await this.columnModel.updateMany({ BoardId: board._id }, { $pull: { BoardId: board._id } });

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

  async moveWorkItem(
    boardId: string,
    moveWorkItemDto: MoveWorkItemDto,
    userId: string | undefined,
  ) {
    const { workItemId, fromColumnId, toColumnId, position } = moveWorkItemDto;

    if (!Types.ObjectId.isValid(boardId)) {
      throw new BadRequestException('Invalid board ID');
    }
    if (!Types.ObjectId.isValid(workItemId)) {
      throw new BadRequestException('Invalid work item ID');
    }

    try {
      const targetColumn = await this.columnModel.findById(toColumnId);

      if (!targetColumn) {
        throw new NotFoundException('Target column not found');
      }

      const fromColumn = await this.columnModel.findById(fromColumnId);
      if (!fromColumn) {
        throw new NotFoundException('Source column not found');
      }

      const workItem = await this.workItemModel.findById(workItemId);
      if (!workItem) {
        throw new NotFoundException('Work item not found');
      }

      fromColumn.workItems = (fromColumn.workItems || []).filter(
        (id) => id.toString() !== workItemId,
      );

      if (!targetColumn.workItems) {
        targetColumn.workItems = [];
      }

      const insertPos =
        position !== undefined && position >= 0 && position <= targetColumn.workItems.length
          ? position
          : targetColumn.workItems.length;

      targetColumn.workItems.splice(insertPos, 0, new Types.ObjectId(workItemId));

      await fromColumn.save();
      await targetColumn.save();

      await this.workItemModel.findByIdAndUpdate(workItemId, {
        status: targetColumn._id,
      });

      try {
        const board = await this.boardModel.findById(boardId).exec();
        const workspace = board
          ? await this.workspaceModel.findById(board.workspaceId).exec()
          : null;
        const ids = workspace
          ? [
              workspace.OwnedBy?.toString(),
              ...(workspace.members || []).map((m) => m.toString()),
            ].filter(Boolean)
          : [];
        const unique = Array.from(new Set(ids));
        const users = await this.userModel
          .find({ _id: { $in: unique } })
          .select('email firstName lastName')
          .exec();
        const recipients = users.map((u: any) => ({
          email: u.email,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || undefined,
        }));
        const actor = userId
          ? await this.userModel.findById(userId).select('firstName lastName email').exec()
          : null;
        const actorName = actor
          ? `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email
          : undefined;
        const subject = `Status changed: ${workItem.title}`;
        const html = this.emailService.buildActivityTemplate({
          action: 'Status Changed',
          title: workItem.title,
          actorName,
          workspaceName: workspace?.name,
          boardName: board?.name,
          details: `From <strong>${fromColumn.name}</strong> to <strong>${targetColumn.name}</strong>`,
        });
        await this.emailService.sendActivityEmail(recipients, subject, html);
      } catch (_) {}

      return { message: 'Work item moved successfully' };
    } catch (err) {
      console.error('Move Work Item Error:', err);
      if ((err as any).status) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to move work item');
    }
  }

  // -------------------- Reorder Cards in List --------------------

  async reorderCardsInList(
    boardId: string,
    columnId: string,
    cardIds: string[],
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(boardId)) {
      throw new BadRequestException('Invalid board ID');
    }
    if (!Types.ObjectId.isValid(columnId)) {
      throw new BadRequestException('Invalid column ID');
    }

    const column = await this.columnModel.findById(columnId);

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    column.workItems = cardIds.map((id) => new Types.ObjectId(id));
    await column.save();

    return { message: 'Cards reordered successfully' };
  }
}
