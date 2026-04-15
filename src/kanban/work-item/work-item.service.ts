// src/work-item/work-item.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    @InjectModel('Member') private memberModel: Model<any>,
    private readonly emailService: EmailService,
    private readonly historyService: HistoryService,
    private readonly notificationService: NotificationService,
  ) {}

  private normalizeId(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (value instanceof Types.ObjectId) return value.toString();
    if (value._id) return this.normalizeId(value._id);
    if (typeof value.toString === 'function') return value.toString();
    return undefined;
  }

  private async resolveWorkspaceIdFromItem(item: any): Promise<string | undefined> {
    const directWorkspaceId = this.normalizeId(item?.spaceid || item?.workspace);
    if (directWorkspaceId) {
      return directWorkspaceId;
    }

    const boardId = this.normalizeId(item?.board);
    if (!boardId) {
      return undefined;
    }

    const board = await this.boardModel.findById(boardId).select('workspaceId').lean();
    return this.normalizeId((board as any)?.workspaceId);
  }

  private async enforceMemberOwnershipRules(
    item: any,
    actorId?: string,
    assigneeTargetId?: string,
  ): Promise<void> {
    if (!actorId) {
      return;
    }

    const workspaceId = await this.resolveWorkspaceIdFromItem(item);
    if (!workspaceId) {
      return;
    }

    const member: any = await this.memberModel
      .findOne({ userId: actorId, workspaceId })
      .select('role')
      .lean();

    if (!member || String(member?.role || '').toLowerCase() !== 'member') {
      return;
    }

    const creatorId = this.normalizeId(item?.createdBy);
    if (!creatorId || creatorId !== actorId) {
      throw new ForbiddenException('Members can edit or delete only tasks they created');
    }

    if (assigneeTargetId && assigneeTargetId !== actorId) {
      throw new ForbiddenException('Members cannot assign tasks to other users');
    }
  }

  private async getRecipientsByBoard(
    boardId?: Types.ObjectId | string,
    actorId?: string,
    workspaceId?: Types.ObjectId | string,
    assigneeId?: string,
    reporterId?: string,
  ): Promise<Types.ObjectId[]> {
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

    if (!workspace) {
      console.warn(
        `[Notification] Workspace not found for board ${boardId} or workspace ${workspaceId}`,
      );
      // If assigneeId is present, we still want to notify them, even if workspace is missing (best effort)
      const fallback: Types.ObjectId[] = [];
      if (assigneeId) fallback.push(new Types.ObjectId(assigneeId));
      if (reporterId) fallback.push(new Types.ObjectId(reporterId));
      return fallback;
    }

    const members = await this.memberModel
      .find({ workspaceId: workspace._id })
      .populate('userId')
      .exec();

    // Check if actor is a Member (to broadcast their actions to everyone)
    let isActorMember = false;
    if (actorId) {
      const actorMember = members.find((m) => {
        if (!m.userId) return false;
        const uid = m.userId._id ? m.userId._id.toString() : m.userId.toString();
        return uid === actorId.toString();
      });
      if (actorMember && actorMember.role && actorMember.role.toLowerCase() === 'member') {
        isActorMember = true;
      }
    }

    const recipientIds: string[] = [];

    // Add Workspace Owner (Always notify)
    if (workspace.OwnedBy) {
      recipientIds.push(workspace.OwnedBy.toString());
    }

    for (const member of members) {
      if (!member.userId) continue;
      const uid = member.userId._id ? member.userId._id.toString() : member.userId.toString();
      const role = member.role;
      const isMember = role && role.toLowerCase() === 'member';

      // Logic:
      // 1. If role is NOT 'Member', always notify.
      // 2. If actor IS 'Member', notify everyone (broadcast).
      // 3. If role IS 'Member' AND actor is NOT 'Member', only notify if they are the assignee OR the reporter.

      if (!isMember || isActorMember) {
        recipientIds.push(uid);
      } else {
        // Role is Member
        // Notify if they are assigned OR they are the reporter
        if ((assigneeId && uid === assigneeId) || (reporterId && uid === reporterId)) {
          recipientIds.push(uid);
        }
      }
    }

    // Force include assignee if they were missed (e.g. Member lookup issue, or just to be safe)
    if (assigneeId && !recipientIds.includes(assigneeId)) {
      recipientIds.push(assigneeId);
    }

    // Force include reporter if they were missed
    if (reporterId && !recipientIds.includes(reporterId)) {
      recipientIds.push(reporterId);
    }

    const unique = Array.from(new Set(recipientIds));

    return unique.map((id) => new Types.ObjectId(id));
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
    let savedItem: WorkItem;
    try {
      // Map incoming DTO fields to schema fields (boardId -> board, etc.)
      const payload: any = { ...createDto };

      let workspaceIdForRoleCheck: string | undefined;
      if ((createDto as any).boardId) {
        const board = await this.boardModel.findById((createDto as any).boardId).select('workspaceId').lean();
        workspaceIdForRoleCheck = this.normalizeId((board as any)?.workspaceId);
      }

      if (actorId && workspaceIdForRoleCheck) {
        const member: any = await this.memberModel
          .findOne({ userId: actorId, workspaceId: workspaceIdForRoleCheck })
          .select('role')
          .lean();

        const isMember = String(member?.role || '').toLowerCase() === 'member';
        const requestedReporter =
          this.normalizeId((createDto as any).reporterId) ||
          this.normalizeId((createDto as any).reporter);

        if (isMember && requestedReporter && requestedReporter !== actorId) {
          throw new ForbiddenException('Member can only set themselves as reporter while creating');
        }

        if (isMember) {
          payload.reporter = actorId;
          delete payload.reporterId;
        }
      }

      if (actorId) {
        payload.createdBy = actorId;
      }
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
      if ((createDto as any).reporterId) {
        payload.reporter = (createDto as any).reporterId;
        delete payload.reporterId;
      }
      if ((createDto as any).dueDate) {
        payload.metadata = payload.metadata || {};
        payload.metadata.dueDate = (createDto as any).dueDate;
        delete payload.dueDate;
      }

      const createdItem = new this.workItemModel(payload);
      savedItem = await createdItem.save();

      // Automatically add to column's workItems array if columnId/column is provided
      if ((createDto as any).columnId) {
        const columnId = (createDto as any).columnId;
        await this.columnModel
          .findByIdAndUpdate(columnId, { $push: { workItems: savedItem._id } }, { new: true })
          .exec();
      }
    } catch (err) {
      console.error('[WorkItemService] Create failed during save/initialization:', err);
      throw err;
    }

    let recipients: Types.ObjectId[] = [];
    let actorName: string | undefined;

    try {
      const assigneeId = (savedItem as any)?.assignee?.toString();
      const reporterId = (savedItem as any)?.reporter?.toString();

      recipients = await this.getRecipientsByBoard(
        (savedItem as any).board,
        actorId,
        (savedItem as any)?.workspace,
        assigneeId,
        reporterId,
      );

      actorName = await this.getActorName(actorId);
      const subject = `New ${savedItem.type} created: ${savedItem.title}`;
      const html = this.emailService.buildActivityTemplate({
        action: 'Item Created',
        title: savedItem.title,
        actorName,
        details: '',
      });

      // Fetch emails for recipients
      if (recipients.length > 0) {
        const users = await this.userModel
          .find({ _id: { $in: recipients } })
          .select('email firstName lastName')
          .exec();
        const emailRecipients = users
          .map((u) => ({
            email: u.email,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          }))
          .filter((r) => r.email);

        await this.emailService.sendActivityEmail(emailRecipients, subject, html);
      }
    } catch (err) {
      console.error('[WorkItemService] Notification failed (non-fatal):', err);
    }

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
      const assigneeId = (savedItem as any)?.assignee?.toString();
      const reporterId = (savedItem as any)?.reporter?.toString();

      for (const recipientId of recipients) {
        // Ensure recipientId is valid string or ObjectId
        const rid =
          recipientId instanceof Types.ObjectId
            ? recipientId
            : new Types.ObjectId(String(recipientId));
        const ridStr = rid.toString();

        if (actorId && ridStr === actorId && ridStr !== reporterId) {
          continue;
        }

        let notifType = NotificationType.WORK_ITEM_CREATED;
        let message = `${actorName || 'Someone'} created ${savedItem.type}: ${savedItem.title}`;

        // Special case: If this recipient is the assignee, send TASK_ASSIGNED
        // But only if they are not the creator (unless they assigned themselves, then "You assigned yourself"?)
        // If I create and assign to myself: "You created..." is fine? Or "You assigned yourself"?
        // Let's stick to "You were assigned" for clarity if they are the assignee.

        if (assigneeId && ridStr === assigneeId && ridStr !== actorId) {
          notifType = NotificationType.TASK_ASSIGNED;
          message = `${actorName || 'Someone'} assigned you to ${savedItem.type}: ${savedItem.title}`;
        }

        await this.notificationService.create({
          recipient: rid,
          sender: actorId ? new Types.ObjectId(actorId) : undefined,
          type: notifType,
          message: message,
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
    const item = await this.workItemModel
      .findById(id)
      .populate('parent')
      .populate('assignee')
      .populate('reporter')
      .populate('labels')
      .populate('tags')
      .exec();

    if (!item) throw new NotFoundException('Work item not found');
    return item;
  }

  /* ================= Update Work Item ================= */
  async update(id: string, updateDto: UpdateWorkItemDto, actorId?: string): Promise<WorkItem> {
    // Get the item before update to compare changes
    const originalItem = await this.workItemModel.findById(id).exec();
    if (!originalItem) throw new NotFoundException('Work item not found');

    const requestedAssigneeId =
      this.normalizeId((updateDto as any).assigneeId) || this.normalizeId((updateDto as any).assignee);
    await this.enforceMemberOwnershipRules(originalItem, actorId, requestedAssigneeId);

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
    if ((updateDto as any).reporterId) {
      updatePayload.reporter = (updateDto as any).reporterId;
      delete updatePayload.reporterId;
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
        (updatedItem as any)?.workspace,
        (updatedItem as any)?.assignee?.toString(),
        (updatedItem as any)?.reporter?.toString(),
      );
      const actorName = await this.getActorName(actorId);

      const newAssigneeId = (updatedItem as any)?.assignee?.toString();
      const oldAssigneeId = (originalItem as any)?.assignee?.toString();
      const isAssigneeChanged = newAssigneeId && newAssigneeId !== oldAssigneeId;

      for (const recipientId of recipients) {
        if (!Types.ObjectId.isValid(recipientId)) continue;

        const ridStr = recipientId.toString();
        if (actorId && ridStr === actorId) {
          continue;
        }

        let notifType = NotificationType.WORK_ITEM_UPDATED;
        let message = `${actorName || 'Someone'} updated ${updatedItem.type}: ${updatedItem.title}`;

        if (isAssigneeChanged && ridStr === newAssigneeId) {
          notifType = NotificationType.TASK_ASSIGNED;
          message = `${actorName || 'Someone'} assigned you to ${updatedItem.type}: ${updatedItem.title}`;
        }

        await this.notificationService.create({
          recipient: recipientId,
          sender: actorId ? new Types.ObjectId(actorId) : undefined,
          type: notifType,
          message: message,
          workspace: (updatedItem as any)?.workspace,
          workItem: updatedItem._id,
        });
      }
    } catch (_) {}

    // Log activity - distinguish between status change and edit
    try {
      const board = await this.boardModel.findById((updatedItem as any).board).exec();
      const workspaceId = (board as any)?.workspaceId;

      // Check if status changed
      const statusChanged = updateDto.status && updateDto.status !== originalItem.status;

      if (statusChanged) {
        // Log status change
        await this.historyService.log({
          userId: actorId,
          projectId: workspaceId,
          taskId: updatedItem._id,
          type: 'status_change',
          from: originalItem.status,
          to: updateDto.status,
          details: { title: updatedItem.title, status: updateDto.status },
        } as any);
      } else if (Object.keys(updatePayload).length > 0) {
        // Log regular edit for other changes
        await this.historyService.log({
          userId: actorId,
          projectId: workspaceId,
          taskId: updatedItem._id,
          type: 'edit',
          details: { title: updatedItem.title, changes: updatePayload },
        } as any);
      }
    } catch (e) {}

    return updatedItem;
  }

  /* ================= Delete Work Item ================= */
  async delete(id: string, actorId?: string): Promise<{ message: string }> {
    const existing = await this.workItemModel.findById(id).exec();
    if (!existing) throw new NotFoundException('Work item not found');

    await this.enforceMemberOwnershipRules(existing, actorId);

    const deleted = await this.workItemModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Work item not found');
    try {
      const recipients = await this.getRecipientsByBoard(
        (existing as any)?.board,
        actorId,
        (existing as any)?.workspace,
        (existing as any)?.assignee?.toString(),
      );
      const actorName = await this.getActorName(actorId);

      for (const recipientId of recipients) {
        const ridStr = recipientId.toString();
        if (actorId && ridStr === actorId) {
          continue;
        }

        await this.notificationService.create({
          recipient: recipientId,
          sender: actorId ? new Types.ObjectId(actorId) : undefined,
          type: NotificationType.WORK_ITEM_DELETED,
          message: `${actorName || 'Someone'} deleted ${existing?.type}: ${existing?.title}`,
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

    await this.enforceMemberOwnershipRules(item, actorId);

    const fromStatus = item.status;
    item.status = toStatus;
    const saved = await item.save();
    try {
      const recipients = await this.getRecipientsByBoard(saved.board, actorId);
      const actorName = await this.getActorName(actorId);

      for (const recipientId of recipients) {
        const ridStr = recipientId.toString();
        if (actorId && ridStr === actorId) {
          continue;
        }

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

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid assignee userId');
    }

    await this.enforceMemberOwnershipRules(item, actorId, userId);

    item.assignee = new Types.ObjectId(userId);
    const saved = await item.save();
    try {
      // Pass userId as assigneeId to ensure Member role logic works
      const recipients = await this.getRecipientsByBoard(
        saved.board,
        actorId,
        (saved as any).spaceid || (saved as any).workspace,
        userId,
      );

      // Safety check: Ensure assignee is in the list
      const recipientStrings = recipients.map((r) => r.toString());
      if (!recipientStrings.includes(userId)) {
        console.warn(
          `[AssignUser] Assignee ${userId} was not returned by getRecipientsByBoard. Force adding.`,
        );
        recipients.push(new Types.ObjectId(userId));
      }

      const actorName = await this.getActorName(actorId);

      for (const recipientId of recipients) {
        const ridStr = recipientId.toString();
        if (actorId && ridStr === actorId) {
          continue;
        }

        let message = `${actorName || 'Someone'} assigned ${saved.title} to a user`;

        if (ridStr === userId) {
          message = `${actorName || 'Someone'} assigned you to ${saved.title}`;
        }

        await this.notificationService.create({
          recipient: recipientId,
          sender: actorId ? new Types.ObjectId(actorId) : undefined,
          type: NotificationType.TASK_ASSIGNED,
          message: message,
          workspace: (saved as any)?.spaceid || (saved as any)?.workspace,
          workItem: saved._id,
        });
      }
    } catch (err) {
      console.error('[AssignUser] Failed to send notifications:', err);
    }
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
