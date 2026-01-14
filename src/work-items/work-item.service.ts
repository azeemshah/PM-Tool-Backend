import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item, ItemStatus } from './schemas/work-item.schema';
import { CreateItemDto } from './dto/create-work-item.dto';

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
  ) {}

  async create(dto: CreateItemDto): Promise<Item> {
    let path = '';
    console.log('DTO Received in Service:', dto);

    if (dto.parent) {
      const parent = await this.itemModel.findById(dto.parent);
      if (!parent) throw new NotFoundException('Parent item not found');

      path = `${parent.path}.${parent._id}`;
    } else {
      path = 'root';
    }

    const item = new this.itemModel({
      ...dto,
      status: dto.status ?? ItemStatus.BACKLOG,
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
}
