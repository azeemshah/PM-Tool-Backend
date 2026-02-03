// src/work-item/work-item.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkItem } from './schemas/work-item.schema';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { MoveStatusDto } from './dto/move-status.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { KanbanColumn } from '../column/schemas/column.schema';
import { KanbanBoard } from '../board/schemas/kanban-board.schema';
import { Workspace } from '../../workspace/schemas/workspace.schema';
import { User } from '../../users/schemas/user.schema';
import { EmailService } from '../../email/email.service';
import { HistoryService } from '../history/history.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/schemas/notification.schema';

@Injectable()
export class WorkItemService {
  constructor(
    @InjectModel(WorkItem.name) private workItemModel: Model<WorkItem>,
    @InjectModel(KanbanColumn.name) private columnModel: Model<KanbanColumn>,
    @InjectModel(KanbanBoard.name) private boardModel: Model<KanbanBoard>,
    @InjectModel(Workspace.name) private workspaceModel: Model<Workspace>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly emailService: EmailService,
    private readonly historyService: HistoryService,
    private readonly notificationService: NotificationService,
  ) {}

  private async getRecipientsByBoard(boardId?: Types.ObjectId | string, actorId?: string, workspaceId?: Types.ObjectId | string): Promise<Types.ObjectId[]> {
    let workspace;

    if (boardId) {
      const board = await this.boardModel.findById(boardId).exec();
      if (board) {
        workspace = await this.workspaceModel.findById(board.workspaceId).exec();
      }
    }

    // Fallback to workspaceId if board lookup failed or boardId wasn't provided
    if (!workspace && workspaceId) {
      workspace = await this.workspaceModel.findById(workspaceId).exec();
    }

    const ids = workspace ? [
      workspace.OwnedBy?.toString(),
      ...(workspace.members || []).map((m) => m.toString()),
    ].filter(Boolean) as string[] : [];

    // Explicitly add actorId to ensure they get notified
    if (actorId && !ids.includes(actorId)) {
        ids.push(actorId);
    }
    
    const unique = Array.from(new Set(ids));
    
    return unique.map(id => new Types.ObjectId(id));
  }

  private async getActorName(actorId?: string) {
    if (!actorId) return undefined;
    const user = await this.userModel.findById(actorId).select('firstName lastName email').exec();
    if (!user) return undefined;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email;
  }

  /* ================= Create Work Item ================= */
  async create(createDto: CreateWorkItemDto, actorId?: string): Promise<WorkItem> {
    // Map incoming DTO fields to schema fields (boardId -> board, etc.)
    const payload: any = { ...createDto };
    if ((createDto as any).boardId) {
      payload.board = (createDto as any).boardId;
      delete payload.boardId;
    }
    // If a columnId is provided, set the WorkItem.status to that column ID
    if ((createDto as any).columnId) {
      payload.status = (createDto as any).columnId;
    }
    if ((createDto as any).parentId) {
      payload.parent = (createDto as any).parentId;
      delete payload.parentId;
    }
    if ((createDto as any).assigneeId) {
      payload.assignee = (createDto as any).assigneeId;
      delete payload.assigneeId;
    }
    if ((createDto as any).dueDate) {
      payload.metadata = payload.metadata || {};
      payload.metadata.dueDate = (createDto as any).dueDate;
      delete payload.dueDate;
    }

    const createdItem = new this.workItemModel(payload);
    const savedItem = await createdItem.save();

    // Automatically add to column's workItems array if columnId/column is provided
    if ((createDto as any).columnId) {
      const columnId = (createDto as any).columnId;
      await this.columnModel
        .findByIdAndUpdate(columnId, { $push: { workItems: savedItem._id } }, { new: true })
        .exec();
    }

    let recipients: Types.ObjectId[] = [];
    let actorName: string | undefined;

    try {
      console.log('KanbanWorkItemService: notifying users for create', payload.board);
      recipients = await this.getRecipientsByBoard(payload.board, actorId, (savedItem as any)?.workspace);
      console.log('KanbanWorkItemService: recipients found', recipients.length, recipients);
      actorName = await this.getActorName(actorId);
      const subject = `New ${savedItem.type} created: ${savedItem.title}`;
      const html = this.emailService.buildActivityTemplate({
        action: 'Item Created',
        title: savedItem.title,
        actorName,
        details: '',
      });
      // emailService may expect a different recipient shape; cast to any to avoid type mismatch here
      await this.emailService.sendActivityEmail(recipients as any, subject, html);
    } catch (_) {}

    // Log activity
    try {
      const board = await this.boardModel.findById((savedItem as any).board).exec();
      const workspaceId = (board as any)?.workspaceId;
      await this.historyService.log({
        userId: actorId,
        projectId: workspaceId,
        taskId: savedItem._id,
        type: 'create',
        details: { title: savedItem.title },
      } as any);
    } catch (e) {
      // ignore history errors
    }

    // Notify via notificationService
    try {
      for (const recipientId of recipients) {
        // Ensure recipientId is valid string or ObjectId
        const rid = recipientId instanceof Types.ObjectId ? recipientId : new Types.ObjectId(String(recipientId));
        await this.notificationService.create({
          recipient: rid,
          sender: actorId ? new Types.ObjectId(actorId) : undefined,
          type: NotificationType.WORK_ITEM_CREATED,
          message:
            rid.toString() === actorId
              ? `You created ${savedItem.type}: ${savedItem.title}`
              : `${actorName || 'Someone'} created ${savedItem.type}: ${savedItem.title}`,
          workspace: (savedItem as any)?.workspace,
          workItem: savedItem._id,
        });
      }
    } catch (err) {
      console.error('WorkItemService: Failed to notify on create', err);
    }
    return savedItem;
  }

  /* ================= Find All Work Items ================= */
  async findAll(): Promise<WorkItem[]> {
    return this.workItemModel.find().exec();
  }

  /* ================= Find Work Item by ID ================= */
  async findById(id: string): Promise<WorkItem> {
    const item = await this.workItemModel.findById(id)
      .populate('parent')
      .populate('assignee')
      .populate('reporter')
      .populate('labels')
      .exec();
    if (!item) throw new NotFoundException('Work item not found');
    return item;
  }

  /* ================= Update Work Item ================= */
  async update(id: string, updateDto: UpdateWorkItemDto, actorId?: string): Promise<WorkItem> {
    // Map DTO fields to schema fields before updating
    const updatePayload: any = { ...updateDto };
    if ((updateDto as any).boardId) {
      updatePayload.board = (updateDto as any).boardId;
      delete updatePayload.boardId;
    }
    if ((updateDto as any).parentId) {
      updatePayload.parent = (updateDto as any).parentId;
      delete updatePayload.parentId;
    }
    if ((updateDto as any).assigneeId) {
      updatePayload.assignee = (updateDto as any).assigneeId;
      delete updatePayload.assigneeId;
    }
    if ((updateDto as any).dueDate) {
      updatePayload.metadata = updatePayload.metadata || {};
      updatePayload.metadata.dueDate = (updateDto as any).dueDate;
      delete updatePayload.dueDate;
    }

    const updatedItem = await this.workItemModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();
    if (!updatedItem) throw new NotFoundException('Work item not found');
    try {
      const recipients = await this.getRecipientsByBoard(
        updatePayload.board || updatedItem.board,
        actorId,
        (updatedItem as any)?.workspace
      );
      const actorName = await this.getActorName(actorId);
      
      for (const recipientId of recipients) {
          if (!Types.ObjectId.isValid(recipientId)) continue;
          await this.notificationService.create({
              recipient: recipientId,
              sender: actorId ? new Types.ObjectId(actorId) : undefined,
              type: NotificationType.WORK_ITEM_UPDATED,
              message: recipientId.toString() === actorId
                ? `You updated ${updatedItem.type}: ${updatedItem.title}`
                : `${actorName || 'Someone'} updated ${updatedItem.type}: ${updatedItem.title}`,
              workspace: (updatedItem as any)?.workspace,
              workItem: updatedItem._id,
          });
      }
    } catch (_) {}
    // Log activity
    try {
      const board = await this.boardModel.findById((updatedItem as any).board).exec();
      const workspaceId = (board as any)?.workspaceId;
      await this.historyService.log({
        userId: actorId,
        projectId: workspaceId,
        taskId: updatedItem._id,
        type: 'edit',
        details: { title: updatedItem.title, changes: updatePayload },
      } as any);
    } catch (e) {}
    return updatedItem;
  }

  /* ================= Delete Work Item ================= */
  async delete(id: string, actorId?: string): Promise<{ message: string }> {
    const existing = await this.workItemModel.findById(id).exec();
    const deleted = await this.workItemModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Work item not found');
    try {
      const recipients = await this.getRecipientsByBoard(
          (existing as any)?.board, 
          actorId,
          (existing as any)?.workspace
      );
      const actorName = await this.getActorName(actorId);
      
      for (const recipientId of recipients) {
          await this.notificationService.create({
              recipient: recipientId,
              sender: actorId ? new Types.ObjectId(actorId) : undefined,
              type: NotificationType.WORK_ITEM_DELETED,
              message: recipientId.toString() === actorId
                ? `You deleted ${existing?.type}: ${existing?.title}`
                : `${actorName || 'Someone'} deleted ${existing?.type}: ${existing?.title}`,
              workspace: (existing as any)?.workspace,
              workItem: existing?._id,
          });
      }
    } catch (_) {}
    // Log activity
    try {
      const board = await this.boardModel.findById((existing as any)?.board).exec();
      const workspaceId = (board as any)?.workspaceId;
      await this.historyService.log({
        userId: actorId,
        projectId: workspaceId,
        taskId: existing?._id,
        type: 'delete',
        details: { title: existing?.title },
      } as any);
    } catch (e) {}
    return { message: 'Work item deleted successfully' };
  }

  /* ================= Move Status ================= */
  async moveStatus(moveDto: MoveStatusDto, actorId?: string): Promise<WorkItem> {
    const { workItemId, toStatus } = moveDto;
    const item = await this.workItemModel.findById(workItemId).exec();
    if (!item) throw new NotFoundException('Work item not found');

    const fromStatus = item.status;
    item.status = toStatus;
    const saved = await item.save();
    try {
      const recipients = await this.getRecipientsByBoard(saved.board, actorId);
      const actorName = await this.getActorName(actorId);
      
      for (const recipientId of recipients) {
          await this.notificationService.create({
              recipient: recipientId,
              sender: actorId ? new Types.ObjectId(actorId) : undefined,
              type: NotificationType.STATUS_CHANGED,
              message: `${actorName || 'Someone'} moved ${saved.title} to ${toStatus}`,
              workspace: (saved as any)?.workspace,
              workItem: saved._id,
          });
      }
    } catch (_) {}
    // Log activity
    try {
      const board = await this.boardModel.findById((saved as any).board).exec();
      const workspaceId = (board as any)?.workspaceId;
      await this.historyService.log({
        userId: actorId,
        projectId: workspaceId,
        taskId: saved._id,
        type: 'status_change',
        from: fromStatus,
        to: toStatus,
        details: { title: saved.title, board: saved.board },
      } as any);
    } catch (e) {}
    return saved;
  }

  /* ================= Assign User ================= */
  async assignUser(assignDto: AssignUserDto, actorId?: string): Promise<WorkItem> {
    const { workItemId, userId } = assignDto;
    const item = await this.workItemModel.findById(workItemId).exec();
    if (!item) throw new NotFoundException('Work item not found');

    item.assignee = new Types.ObjectId(userId);
    const saved = await item.save();
    try {
      const recipients = await this.getRecipientsByBoard(saved.board, actorId);
      const actorName = await this.getActorName(actorId);
      
      for (const recipientId of recipients) {
          await this.notificationService.create({
              recipient: recipientId,
              sender: actorId ? new Types.ObjectId(actorId) : undefined,
              type: NotificationType.TASK_ASSIGNED,
              message: recipientId.toString() === actorId
                ? `You assigned ${saved.title} to a user`
                : `${actorName || 'Someone'} assigned ${saved.title} to a user`,
              workspace: (saved as any)?.workspace,
              workItem: saved._id,
          });
      }
    } catch (_) {}
    // Log activity
    try {
      const board = await this.boardModel.findById((saved as any).board).exec();
      const workspaceId = (board as any)?.workspaceId;
      await this.historyService.log({
        userId: actorId,
        projectId: workspaceId,
        taskId: saved._id,
        type: 'edit',
        details: { title: saved.title, assigneeId: userId },
      } as any);
    } catch (e) {}
    return saved;
  }
}
