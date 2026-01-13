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

@Injectable()
export class WorkItemService {
  constructor(
    @InjectModel(WorkItem.name) private workItemModel: Model<WorkItem>,
    @InjectModel(KanbanColumn.name) private columnModel: Model<KanbanColumn>,
  ) {}

  /* ================= Create Work Item ================= */
  async create(createDto: CreateWorkItemDto): Promise<WorkItem> {
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
  async update(id: string, updateDto: UpdateWorkItemDto): Promise<WorkItem> {
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
    return updatedItem;
  }

  /* ================= Delete Work Item ================= */
  async delete(id: string): Promise<{ message: string }> {
    const deleted = await this.workItemModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Work item not found');
    return { message: 'Work item deleted successfully' };
  }

  /* ================= Move Status ================= */
  async moveStatus(moveDto: MoveStatusDto): Promise<WorkItem> {
    const { workItemId, toStatus } = moveDto;
    const item = await this.workItemModel.findById(workItemId).exec();
    if (!item) throw new NotFoundException('Work item not found');

    item.status = toStatus;
    return item.save();
  }

  /* ================= Assign User ================= */
  async assignUser(assignDto: AssignUserDto): Promise<WorkItem> {
    const { workItemId, userId } = assignDto;
    const item = await this.workItemModel.findById(workItemId).exec();
    if (!item) throw new NotFoundException('Work item not found');

    item.assignee = new Types.ObjectId(userId);
    return item.save();
  }
}
