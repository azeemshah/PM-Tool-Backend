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

@Injectable()
export class WorkItemService {
  constructor(
    @InjectModel(WorkItem.name) private workItemModel: Model<WorkItem>,
    @InjectModel(KanbanColumn.name) private columnModel: Model<KanbanColumn>,
    @InjectModel(KanbanBoard.name) private boardModel: Model<KanbanBoard>,
    @InjectModel(Workspace.name) private workspaceModel: Model<Workspace>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly emailService: EmailService,
  ) {}

  private async getWorkspaceBoardNames(boardId?: Types.ObjectId | string) {
    if (!boardId) return { workspaceName: undefined, boardName: undefined };
    const board = await this.boardModel.findById(boardId).exec();
    const workspace = board ? await this.workspaceModel.findById(board.workspaceId).exec() : null;
    return { workspaceName: workspace?.name, boardName: board?.name };
  }

  private async getRecipientsByBoard(boardId?: Types.ObjectId | string, actorId?: string) {
    if (!boardId) return [];
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) return [];
    const workspace = await this.workspaceModel.findById(board.workspaceId).exec();
    if (!workspace) return [];
    const ids = [
      workspace.OwnedBy?.toString(),
      ...(workspace.members || []).map((m) => m.toString()),
    ].filter(Boolean) as string[];
    const unique = Array.from(new Set(ids));
    const users = await this.userModel
      .find({ _id: { $in: unique } })
      .select('email firstName lastName')
      .exec();
    return users.map((u: any) => ({
      email: u.email,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || undefined,
    }));
  }

  private async getActorName(actorId?: string) {
    if (!actorId) return undefined;
    const user = await this.userModel.findById(actorId).select('firstName lastName email').exec();
    if (!user) return undefined;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email;
  }

  private async resolveStatusName(status: any): Promise<string | undefined> {
    if (!status) return undefined;
    try {
      const id = status?.toString?.() ?? status;
      if (Types.ObjectId.isValid(id)) {
        const col = await this.columnModel.findById(status).select('name').exec();
        return col?.name;
      }
      return String(status);
    } catch {
      return undefined;
    }
  }

  private async getUserDisplay(userId?: Types.ObjectId | string): Promise<string | undefined> {
    if (!userId) return undefined;
    const u = await this.userModel.findById(userId).select('firstName lastName email').exec();
    if (!u) return undefined;
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return name ? `${name} (${u.email})` : u.email;
  }

  private async getParentTitle(parentId?: Types.ObjectId | string): Promise<string | undefined> {
    if (!parentId) return undefined;
    const p = await this.workItemModel.findById(parentId).select('title type').exec();
    return p ? `${(p as any).title} (${(p as any).type || ''})` : undefined;
  }

  private buildDetailsHtml(params: {
    type?: string;
    statusName?: string;
    priority?: string;
    assignee?: string;
    parent?: string;
    description?: string;
    dueDate?: string | Date;
  }): string {
    const lines: string[] = [];
    if (params.type) lines.push(`<li><strong>Type:</strong> ${params.type}</li>`);
    if (params.statusName) lines.push(`<li><strong>Status:</strong> ${params.statusName}</li>`);
    if (params.priority) lines.push(`<li><strong>Priority:</strong> ${params.priority}</li>`);
    if (params.assignee) lines.push(`<li><strong>Assignee:</strong> ${params.assignee}</li>`);
    if (params.parent) lines.push(`<li><strong>Parent:</strong> ${params.parent}</li>`);
    if (params.dueDate) lines.push(`<li><strong>Due Date:</strong> ${params.dueDate}</li>`);
    const desc =
      params.description && String(params.description).trim().length > 0
        ? `<div style="margin-top:8px;"><strong>Description:</strong> ${String(params.description).slice(0, 300)}</div>`
        : '';
    return `
      <ul style="margin:0;padding-left:18px;">
        ${lines.join('\n')}
      </ul>
      ${desc}
    `;
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

    try {
      const recipients = await this.getRecipientsByBoard(payload.board, actorId);
      const actorName = await this.getActorName(actorId);
      const { workspaceName, boardName } = await this.getWorkspaceBoardNames(payload.board);
      const statusName = await this.resolveStatusName((createDto as any).columnId || savedItem.status);
      const assignee = await this.getUserDisplay(savedItem.assignee);
      const parent = await this.getParentTitle(savedItem.parent);
      const details = this.buildDetailsHtml({
        type: savedItem.type,
        statusName,
        priority: (savedItem as any).priority,
        assignee,
        parent,
        description: (savedItem as any).description,
        dueDate: savedItem?.metadata?.dueDate,
      });
      const subject = `New ${savedItem.type} created: ${savedItem.title}`;
      const html = this.emailService.buildActivityTemplate({
        action: 'Item Created',
        title: savedItem.title,
        actorName,
        workspaceName,
        boardName,
        details,
      });
      await this.emailService.sendActivityEmail(recipients, subject, html);
    } catch (_) {}
    return savedItem;
  }

  /* ================= Find All Work Items ================= */
  async findAll(): Promise<WorkItem[]> {
    return this.workItemModel.find().exec();
  }

  /* ================= Find Work Item by ID ================= */
  async findById(id: string): Promise<WorkItem> {
    const item = await this.workItemModel.findById(id).exec();
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
      );
      const actorName = await this.getActorName(actorId);
      const { workspaceName, boardName } = await this.getWorkspaceBoardNames(
        updatePayload.board || updatedItem.board,
      );
      const statusName = await this.resolveStatusName(updatedItem.status);
      const assignee = await this.getUserDisplay(updatedItem.assignee);
      const parent = await this.getParentTitle(updatedItem.parent);
      const details = this.buildDetailsHtml({
        type: updatedItem.type,
        statusName,
        priority: (updatedItem as any).priority,
        assignee,
        parent,
        description: (updatedItem as any).description,
        dueDate: updatedItem?.metadata?.dueDate,
      });
      const subject = `Item updated: ${updatedItem.title}`;
      const html = this.emailService.buildActivityTemplate({
        action: 'Item Updated',
        title: updatedItem.title,
        actorName,
        workspaceName,
        boardName,
        details,
      });
      await this.emailService.sendActivityEmail(recipients, subject, html);
    } catch (_) {}
    return updatedItem;
  }

  /* ================= Delete Work Item ================= */
  async delete(id: string, actorId?: string): Promise<{ message: string }> {
    const existing = await this.workItemModel.findById(id).exec();
    const deleted = await this.workItemModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Work item not found');
    try {
      const recipients = await this.getRecipientsByBoard((existing as any)?.board, actorId);
      const actorName = await this.getActorName(actorId);
      const subject = `Item deleted: ${existing?.title || id}`;
      const html = this.emailService.buildActivityTemplate({
        action: 'Item Deleted',
        title: existing?.title || id,
        actorName,
        details: '',
      });
      await this.emailService.sendActivityEmail(recipients, subject, html);
    } catch (_) {}
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
      const { workspaceName, boardName } = await this.getWorkspaceBoardNames(saved.board);
      const fromCol = await this.resolveStatusName(fromStatus);
      const toCol = await this.resolveStatusName(toStatus);
      const assignee = await this.getUserDisplay(saved.assignee);
      const info = this.buildDetailsHtml({
        type: saved.type,
        statusName: toCol || undefined,
        priority: (saved as any).priority,
        assignee,
        parent: await this.getParentTitle(saved.parent),
        description: (saved as any).description,
        dueDate: saved?.metadata?.dueDate,
      });
      const subject = `Status changed: ${saved.title}`;
      const html = this.emailService.buildActivityTemplate({
        action: 'Status Changed',
        title: saved.title,
        actorName,
        workspaceName,
        boardName,
        details: `From <strong>${fromCol || fromStatus}</strong> to <strong>${toCol || toStatus}</strong>${info}`,
      });
      await this.emailService.sendActivityEmail(recipients, subject, html);
    } catch (_) {}
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
      const { workspaceName, boardName } = await this.getWorkspaceBoardNames(saved.board);
      const assignedTo = await this.getUserDisplay(userId);
      const subject = `Assignee changed: ${saved.title}`;
      const html = this.emailService.buildActivityTemplate({
        action: 'Assignee Updated',
        title: saved.title,
        actorName,
        workspaceName,
        boardName,
        details: `Assigned to ${assignedTo || userId}`,
      });
      await this.emailService.sendActivityEmail(recipients, subject, html);
    } catch (_) {}
    return saved;
  }
}
