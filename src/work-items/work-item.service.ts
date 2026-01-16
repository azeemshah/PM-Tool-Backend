import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item, ItemStatus, ItemType } from './schemas/work-item.schema';
import { CreateItemDto } from './dto/create-work-item.dto';
import { UpdateItemDto } from './dto/update-work-item.dto';
import { KanbanColumn } from '../kanban/column/schemas/column.schema';
import { KanbanBoard } from '../kanban/board/schemas/kanban-board.schema';

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
    @InjectModel(KanbanColumn.name)
    private readonly columnModel: Model<KanbanColumn>,
    @InjectModel(KanbanBoard.name)
    private readonly boardModel: Model<KanbanBoard>,
  ) { }

  async create(dto: CreateItemDto): Promise<Item> {
    let path = '';
    console.log('DTO Received in Service:', dto);

    let parent: Item | null = null;

    if (dto.parent) {
      parent = await this.itemModel.findById(dto.parent);
      if (!parent) throw new NotFoundException('Parent item not found');
    }

    switch (dto.type) {
      case ItemType.SUBTASK: {
        if (!parent) {
          throw new BadRequestException(
            'Subtask must be assigned to a parent issue (Story/Task/Bug)',
          );
        }

        if (
          parent.type !== ItemType.STORY &&
          parent.type !== ItemType.TASK &&
          parent.type !== ItemType.BUG
        ) {
          throw new BadRequestException('Parent issue must be of type story, task, or bug');
        }
        break;
      }
      case ItemType.STORY:
      case ItemType.TASK:
      case ItemType.BUG: {
        if (parent && parent.type !== ItemType.EPIC) {
          throw new BadRequestException('Referenced issue is not an Epic');
        }
        break;
      }
      case ItemType.EPIC: {
        if (parent) {
          throw new BadRequestException('Epic cannot have a parent');
        }
        break;
      }
      default:
        break;
    }

    if (parent) {
      path = `${parent.path}.${parent._id}`;
    } else {
      path = 'root';
    }

    let columnId = dto.column;
    const initialStatus = dto.status ?? ItemStatus.BACKLOG;

    if (!columnId) {
      let board = await this.boardModel.findOne({ workspaceId: dto.workspace });

      if (!board) {
        board = await this.boardModel.create({
          workspaceId: new Types.ObjectId(dto.workspace),
          name: 'Default Board',
          description: 'Auto-created board for workspace items',
        });
      }

      let columns = await this.columnModel.find({ BoardId: board._id }).sort({ position: 1 });

      if (columns.length === 0) {
        const defaultColumns = ['To Do', 'In Progress', 'In Review', 'Done'];

        const createdColumns = await Promise.all(
          defaultColumns.map((name, index) =>
            this.columnModel.create({
              BoardId: board._id,
              name,
              position: index,
            }),
          ),
        );

        columns = createdColumns;
      }

      if (columns.length > 0) {
        const statusString = initialStatus.toString().toLowerCase().replace(/\s/g, '');

        const matchedColumn = columns.find(
          (col) => col.name.toLowerCase().replace(/\s/g, '') === statusString,
        );

        const targetColumn = matchedColumn ?? columns[0];

        columnId = targetColumn._id.toString();
      }
    }

    const item = new this.itemModel({
      ...dto,
      status: initialStatus,
      column: columnId,
      path,
    });

    return item.save();
  }

  async findByWorkspace(workspaceId: string) {
    const tasks = await this.itemModel
      .find({ workspace: workspaceId })
      .sort({ path: 1 })
      .populate({
        path: 'assignedTo',
        select: '_id firstName lastName profilePicture',
      })
      .populate({
        path: 'reporter',
        select: '_id firstName lastName profilePicture',
      })
      .lean();

    return tasks.map((task: any) => ({
      ...task,
      assignedTo: task.assignedTo
        ? {
          _id: task.assignedTo._id,
          name: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
          profilePicture: task.assignedTo.profilePicture,
        }
        : null,
      reporter: task.reporter
        ? {
          _id: task.reporter._id,
          name: `${task.reporter.firstName} ${task.reporter.lastName}`,
          profilePicture: task.reporter.profilePicture,
        }
        : null,
    }));
  }

  async findTree(rootId: string) {
    const root = await this.itemModel.findById(rootId);
    if (!root) throw new NotFoundException('Item not found');

    return this.itemModel
      .find({ path: { $regex: `^${root.path}` } })
      .sort({ path: 1 })
      .lean();
  }

  async moveToColumn(itemId: string, columnId: string) {
    return this.itemModel.findByIdAndUpdate(
      itemId,
      {
        status: ItemStatus.TODO,
        column: new Types.ObjectId(columnId),
      },
      { new: true },
    );
  }

  async moveToBacklog(itemId: string) {
    return this.itemModel.findByIdAndUpdate(
      itemId,
      {
        status: ItemStatus.BACKLOG,
        column: null,
      },
      { new: true },
    );
  }

  async update(itemId: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.itemModel.findById(itemId);
    if (!item) throw new NotFoundException('Item not found');

    // Prevent path corruption
    if ('path' in dto) {
      throw new BadRequestException('Path cannot be updated directly');
    }

    // Optional: validate type change
    if (dto.type && dto.type !== item.type) {
      throw new BadRequestException('Changing item type is not allowed');
    }

    Object.assign(item, dto);
    return item.save();
  }

async delete(itemId: string) {
  const item = await this.itemModel.findById(itemId);
  if (!item) throw new NotFoundException('Item not found');

  // 1. Detach direct children
  await this.itemModel.updateMany(
    { parent: item._id },
    {
      $set: {
        parent: null,
        path: 'root',
        status: ItemStatus.BACKLOG,
        column: null,
      },
    },
  );

  // 2. Delete only the item itself
  await this.itemModel.deleteOne({ _id: item._id });

  return {
    message: 'Item deleted. Children detached and moved to root.',
  };
}



}
