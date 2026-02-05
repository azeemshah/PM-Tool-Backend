import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item, ItemStatus, ItemType } from './schemas/work-item.schema';
import { CreateItemDto } from './dto/create-work-item.dto';
import { UpdateItemDto } from './dto/update-work-item.dto';
import { KanbanColumn } from '../kanban/column/schemas/column.schema';
import { KanbanBoard } from '../kanban/board/schemas/kanban-board.schema';
import { Workspace } from '../workspace/schemas/workspace.schema';
import { UsersService } from '../users/users.service';
import { HistoryService } from '../kanban/history/history.service';
import { NotificationService } from '../kanban/notification/notification.service';
import { NotificationType } from '../kanban/notification/schemas/notification.schema';
import { TimeLog } from '../time-log/schemas/time-log.schema';
// (Imports consolidated above; no duplicate imports needed here)

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
    @InjectModel(KanbanColumn.name)
    private readonly columnModel: Model<KanbanColumn>,
    @InjectModel(KanbanBoard.name)
    private readonly boardModel: Model<KanbanBoard>,
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<Workspace>,
    @InjectModel(TimeLog.name)
    private readonly timeLogModel: Model<TimeLog>,
    private readonly notificationService: NotificationService,
    private readonly usersService: UsersService,
    private readonly historyService: HistoryService,
  ) {}

  // ----------------- Estimates & Time Tracking -----------------
  async setEstimate(itemId: string, originalEstimate: number, actorId?: string) {
    if (!Types.ObjectId.isValid(itemId)) throw new BadRequestException('Invalid item id');
    const item = await this.itemModel.findById(itemId);
    if (!item) throw new NotFoundException('Item not found');

    // Prevent manual estimate if item has children
    const childCount = await this.itemModel.countDocuments({ parent: item._id });
    if (childCount > 0) {
      throw new BadRequestException('Cannot manually set estimate on item with children');
    }

    item.originalEstimate = Math.max(0, Number(originalEstimate || 0));
    // initialize remainingEstimate if not present or reset to original
    item.remainingEstimate = Math.max(0, Number(item.originalEstimate) - Number(item.timeSpent || 0));
    await item.save();

    try {
      await this.historyService.log({
        userId: actorId,
        projectId: item.workspace?.toString(),
        taskId: item._id,
        type: 'estimate',
        details: { originalEstimate: item.originalEstimate, remainingEstimate: item.remainingEstimate },
      } as any);
    } catch (_) {}

    // propagate up the tree
    if (item.parent) await this.recalculateParentTime(item.parent.toString());

    return item;
  }

  async logWork(itemId: string, opts: { timeSpent: number; comment?: string; adjustRemaining?: boolean }, userId?: string) {
    const { timeSpent, comment, adjustRemaining = true } = opts;
    if (!Types.ObjectId.isValid(itemId)) throw new BadRequestException('Invalid item id');
    if (!timeSpent || Number(timeSpent) <= 0) throw new BadRequestException('timeSpent must be a positive number (minutes)');

    const item = await this.itemModel.findById(itemId);
    if (!item) throw new NotFoundException('Item not found');

    // Create time log
    const tl = await this.timeLogModel.create({ userId: new Types.ObjectId(userId), workItemId: item._id, timeSpent, logDate: new Date() });

    // Update item's cached timeSpent
    item.timeSpent = (item.timeSpent || 0) + Number(timeSpent);

    if (adjustRemaining) {
      const original = Number(item.originalEstimate || 0);
      item.remainingEstimate = Math.max(0, original - Number(item.timeSpent || 0));
    }

    await item.save();

    try {
      await this.historyService.log({
        userId: userId,
        projectId: item.workspace?.toString(),
        taskId: item._id,
        type: 'time_logged',
        details: { timeSpent, comment },
      } as any);
    } catch (_) {}

    // propagate changes to parents
    if (item.parent) await this.recalculateParentTime(item.parent.toString());

    return { timeLog: tl, item };
  }

  async getTimeTracking(itemId: string) {
    if (!Types.ObjectId.isValid(itemId)) throw new BadRequestException('Invalid item id');
    const item = await this.itemModel.findById(itemId).lean();
    if (!item) throw new NotFoundException('Item not found');

    const logs = await this.timeLogModel.find({ workItemId: item._id }).sort({ createdAt: -1 }).lean();

    const totalTimeSpent = logs.reduce((s, l: any) => s + (Number(l.timeSpent) || 0), 0);

    return {
      item: {
        _id: item._id,
        originalEstimate: item.originalEstimate || 0,
        remainingEstimate: item.remainingEstimate || Math.max(0, (item.originalEstimate || 0) - totalTimeSpent),
        timeSpent: item.timeSpent || totalTimeSpent,
      },
      logs,
    };
  }

  // Recalculate parent aggregates recursively
  async recalculateParentTime(parentId: string) {
    if (!Types.ObjectId.isValid(parentId)) return;
    const parent = await this.itemModel.findById(parentId);
    if (!parent) return;

    // Sum direct children
    const children = await this.itemModel.find({ parent: parent._id }).lean();
    const sums = children.reduce(
      (acc: any, c: any) => {
        acc.original += Number(c.originalEstimate || 0);
        acc.remaining += Number(c.remainingEstimate || Math.max(0, (c.originalEstimate || 0) - (c.timeSpent || 0)));
        acc.spent += Number(c.timeSpent || 0);
        return acc;
      },
      { original: 0, remaining: 0, spent: 0 },
    );

    // When children exist, parent becomes aggregated
    if (children.length > 0) {
      parent.originalEstimate = sums.original;
      parent.remainingEstimate = Math.max(0, sums.remaining);
      parent.timeSpent = sums.spent;
      await parent.save();
    }

    // recurse upwards
    if (parent.parent) await this.recalculateParentTime(parent.parent.toString());
  }

  async create(dto: CreateItemDto, userId?: string): Promise<Item> {
    let path = '';
    console.log('DTO Received in Service:', dto);

    // Set reporter if userId is provided
    if (userId && !dto.reporter) {
      dto.reporter = userId;
    }

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
      let board = await this.boardModel.findOne({
        workspaceId: dto.workspace,
        name: 'Default Board',
      });

      if (!board) {
        board = await this.boardModel.findOneAndUpdate(
          {
            workspaceId: new Types.ObjectId(dto.workspace),
            name: 'Default Board',
          },
          {
            workspaceId: new Types.ObjectId(dto.workspace),
            name: 'Default Board',
            description: 'Auto-created board for workspace items',
          },
          {
            upsert: true,
            new: true,
          },
        );
      }

      if (!board) {
        throw new InternalServerErrorException('Failed to create or find default board');
      }

      let columns = await this.columnModel.find({ BoardId: board._id }).sort({ position: 1 });

      if (columns.length === 0) {
        const defaultColumns = ['To Do', 'In Progress', 'In Review', 'Blocked', 'Done', 'Closed'];

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

    const saved = await item.save();

    await this.notifyUsers(saved, 'created');
    // Log activity for created item
    try {
      await this.historyService.log({
        userId: (dto as any).reporter,
        projectId: (dto as any).workspace,
        taskId: saved._id,
        type: 'create',
        details: { title: saved.title },
      } as any);
    } catch (e) {
      // ignore logging errors
    }
    await this.notifyUsers(saved, 'created', userId);
    return saved;
  }

  async findByWorkspace(
    workspaceId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      type?: string;
      reporter?: string;
      keyword?: string; // <-- add keyword
    },
  ) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      type,
      reporter,
      keyword, // <-- grab it
    } = query;

    const filter: any = { workspace: workspaceId };

    // Apply filters only if present
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (reporter) filter.reporter = reporter;

    // Keyword search: search in title and description
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } }, // case-insensitive
        { description: { $regex: keyword, $options: 'i' } }, // case-insensitive
      ];
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.itemModel
        .find(filter)
        .sort({ path: 1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'assignedTo',
          select: '_id firstName lastName profilePicture',
        })
        .populate({
          path: 'reporter',
          select: '_id firstName lastName profilePicture',
        })
        .populate('tags')
        .lean(),

      this.itemModel.countDocuments(filter),
    ]);

    const formattedTasks = tasks.map((task: any) => ({
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

    return {
      data: formattedTasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemModel
      .findById(id)
      .populate('assignedTo', 'firstName lastName email profilePicture')
      .populate('reporter', 'firstName lastName email profilePicture')
      .populate('parent')
      .populate('tags')
      .exec();

    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  async findTree(rootId: string) {
    const root = await this.itemModel.findById(rootId);
    if (!root) throw new NotFoundException('Item not found');

    return this.itemModel
      .find({ path: { $regex: `^${root.path}` } })
      .sort({ path: 1 })
      .lean();
  }

  async moveToColumn(itemId: string, columnId: string, actorId?: string) {
    const column = await this.columnModel.findById(columnId);
    if (!column) {
      throw new NotFoundException('Target column not found');
    }

    const item = await this.itemModel.findById(itemId).exec();
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const oldStatus = item.status;
    const workspaceId = item.workspace;

    const normalize = (value: string) => (value || '').toLowerCase().replace(/\s/g, '');
    const columnName = normalize(column.name);

    let nextStatus: string = column.name; // Default to column name for custom columns

    if (columnName === 'todo') {
      nextStatus = ItemStatus.TODO;
    } else if (columnName === 'inprogress') {
      nextStatus = ItemStatus.INPROGRESS;
    } else if (columnName === 'inreview' || columnName === 'review') {
      nextStatus = ItemStatus.REVIEW;
    } else if (columnName === 'blocked') {
      nextStatus = ItemStatus.BLOCKED;
    } else if (columnName === 'done') {
      nextStatus = ItemStatus.DONE;
    } else if (columnName === 'closed') {
      nextStatus = ItemStatus.CLOSED;
    } else if (columnName === 'backlog') {
      nextStatus = ItemStatus.BACKLOG;
    }

    const updated = await this.itemModel
      .findByIdAndUpdate(
        itemId,
        {
          status: nextStatus,
          column: new Types.ObjectId(columnId),
        },
        { new: true },
      )
      .exec();

    // Log activity (non-blocking)
    try {
      await this.historyService.log({
        userId: actorId,
        projectId: workspaceId,
        taskId: itemId,
        type: 'move',
        from: oldStatus || 'Unknown',
        to: nextStatus,
        details: { title: item.title, columnName: column.name || columnId },
      } as any);
    } catch (e) {
      console.error('History log error:', e);
    }

    if (updated) {
      await this.notifyUsers(updated, 'updated', actorId);
    }

    return updated;
  }

  async moveToBacklog(itemId: string, userId?: string) {
    const item = await this.itemModel.findByIdAndUpdate(
      itemId,
      {
        status: ItemStatus.BACKLOG,
        column: null,
      },
      { new: true },
    );

    if (item) {
      await this.notifyUsers(item, 'updated', userId);
    }
    return item;
  }

  async update(itemId: string, dto: UpdateItemDto, actorId?: string): Promise<Item> {
    const item = await this.itemModel.findById(itemId);
    if (!item) throw new NotFoundException('Item not found');

    const oldStatus = item.status;
    const oldColumn = item.column;

    // Prevent path corruption
    if ('path' in dto) {
      throw new BadRequestException('Path cannot be updated directly');
    }

    // Optional: validate type change
    if (dto.type && dto.type !== item.type) {
      throw new BadRequestException('Changing item type is not allowed');
    }

    Object.assign(item, dto);
    const saved = await item.save();
    await this.notifyUsers(saved, 'updated', actorId);

    // Log activity for changes
    try {
      // Check if status or column actually changed
      const statusChanged = dto.status && dto.status !== oldStatus;
      const columnChanged = dto.column && dto.column !== oldColumn?.toString();
      
      if (statusChanged || columnChanged) {
        // Log move/status change
        await this.historyService.log({
          userId: actorId,
          projectId: saved.workspace.toString(),
          taskId: saved._id,
          type: 'status_change',
          from: oldStatus,
          to: saved.status,
          details: { title: saved.title, status: saved.status },
        } as any);
      } else if (Object.keys(dto).length > 0) {
        // Only log edit if something else actually changed (not just a no-op)
        await this.historyService.log({
          userId: actorId,
          projectId: saved.workspace.toString(),
          taskId: saved._id,
          type: 'edit',
          details: { title: saved.title, changes: dto },
        } as any);
      }
    } catch (e) {
      console.error('History log error:', e);
    }

    await this.notifyUsers(saved, 'updated', actorId);
    return saved;
  }

  async delete(itemId: string, userId?: string) {
    const item = await this.itemModel.findById(itemId);
    if (!item) throw new NotFoundException('Item not found');

    // Notify users before deletion (so we have the item data)
    await this.notifyUsers(item, 'deleted', userId);

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

    // Log activity for deleted item
    try {
      await this.historyService.log({
        userId: userId,
        projectId: item.workspace?.toString(),
        taskId: item._id,
        type: 'delete',
        details: { title: item.title },
      } as any);
    } catch (e) {
      console.error('History log error:', e);
    }

    return {
      message: 'Item deleted. Children detached and moved to root.',
    };
  }

  private async notifyUsers(
    item: Item,
    action: 'created' | 'updated' | 'deleted',
    actorId?: string,
  ): Promise<void> {
    const ids: string[] = [];

    // Explicitly add actor to ensure they get notified
    if (actorId) {
      ids.push(actorId);
    }

    if (item.assignedTo) ids.push((item.assignedTo as unknown as Types.ObjectId).toString());
    if (item.reporter) ids.push((item.reporter as unknown as Types.ObjectId).toString());

    // Fetch workspace members to notify everyone
    if (item.workspace) {
      try {
        const workspace = await this.workspaceModel.findById(item.workspace).exec();
        if (workspace) {
          console.log(
            'WorkItemService: Workspace found:',
            workspace._id,
            'Members:',
            workspace.members?.length,
            'Owner:',
            workspace.OwnedBy,
          );
          if (workspace.OwnedBy) ids.push(workspace.OwnedBy.toString());
          if (workspace.members) {
            workspace.members.forEach((m) => ids.push(m.toString()));
          }
        } else {
          console.warn('WorkItemService: Workspace not found during notification', item.workspace);
        }
      } catch (e) {
        console.warn('WorkItemService: Error fetching workspace for notifications', e);
      }
    } else {
      console.warn('WorkItemService: Item has no workspace defined', item._id);
    }

    // Get actor details
    let actorName = 'Someone';
    if (actorId) {
      try {
        const actor = await this.usersService.findOne(actorId);
        if (actor) {
          actorName = `${actor.firstName} ${actor.lastName}`;
        }
      } catch (e) {
        console.error('Failed to fetch actor details', e);
      }
    }

    const uniqueIds = Array.from(new Set(ids));

    // User requested to receive notifications for their own actions as well
    const recipients = uniqueIds;

    console.log('WorkItemService: NotifyUsers - Actor:', actorName, actorId);
    console.log('WorkItemService: NotifyUsers - Action:', action);
    console.log('WorkItemService: NotifyUsers - Recipients Count:', recipients.length);
    console.log('WorkItemService: NotifyUsers - Recipients List:', recipients);

    const sender = actorId
      ? new Types.ObjectId(actorId)
      : item.reporter
        ? new Types.ObjectId(item.reporter as any)
        : undefined;

    for (const recipientId of recipients) {
      try {
        let type = NotificationType.WORK_ITEM_UPDATED;
        if (action === 'created') type = NotificationType.WORK_ITEM_CREATED;
        else if (action === 'deleted') type = NotificationType.WORK_ITEM_DELETED;

        // Ensure recipientId is valid
        if (!Types.ObjectId.isValid(recipientId)) {
          console.warn(`Invalid recipient ID: ${recipientId}`);
          continue;
        }

        await this.notificationService.create({
          recipient: new Types.ObjectId(recipientId),
          sender: sender,
          type: type,
          message:
            recipientId === actorId
              ? `You ${action} work item "${item.title || 'work item'}"`
              : `${actorName} ${action} work item "${item.title || 'work item'}"`,
          workspace: item.workspace,
          workItem: action === 'deleted' ? undefined : (item._id as any),
        });
      } catch (err) {
        console.error(`Failed to notify user ${recipientId}`, err);
      }
    }
  }

  async globalSearch(searchTerm: string, userId: string) {
    try {
      if (!userId) {
        return { success: false, data: [], message: 'User not authenticated' };
      }

      // Convert userId to ObjectId if it's a string
      const userObjectId = Types.ObjectId.isValid(userId) 
        ? new Types.ObjectId(userId) 
        : new Types.ObjectId();

      // Get all workspaces where the user is a member or owner
      const userWorkspaces = await this.workspaceModel
        .find({
          $or: [
            { OwnedBy: userObjectId },
            { members: userObjectId },
          ],
        })
        .select('_id')
        .lean()
        .exec();

      if (userWorkspaces.length === 0) {
        return { success: true, data: [], message: 'No workspaces found' };
      }

      const workspaceIds = userWorkspaces.map((ws: any) => ws._id);
      const workspaceStrings = workspaceIds.map((id: any) => id.toString());
      
      console.log('Workspace IDs to search:', workspaceStrings);

      // First check: items with matching workspace (no search term)
      const itemsWithWorkspace = await this.itemModel.countDocuments({
        $or: [
          { workspace: { $in: workspaceIds } },
          { workspace: { $in: workspaceStrings } }
        ]
      });
      console.log('Items with matching workspace:', itemsWithWorkspace);

      // Second check: items matching search term only
      const itemsWithSearchTerm = await this.itemModel.countDocuments({
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
        ]
      });
      console.log('Items matching search term "' + searchTerm + '":', itemsWithSearchTerm);

      // Search items by workspace ID and search term
      const workItems = await this.itemModel
        .find({
          $and: [
            {
              $or: [
                { workspace: { $in: workspaceIds } },
                { workspace: { $in: workspaceStrings } }
              ]
            },
            {
              $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
              ]
            }
          ]
        })
        .populate('assignedTo', 'name profilePicture firstName lastName')
        .populate('reporter', 'name profilePicture firstName lastName')
        .populate('workspace', 'name')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
        .exec();

      console.log('Final search results for term "' + searchTerm + '":', workItems.length);

      return {
        success: true,
        data: workItems,
        count: workItems.length,
      };
    } catch (error) {
      console.error('Global search error:', error);
      return { success: false, data: [], message: `Global search failed: ${error.message}` };
    }
  }
}
