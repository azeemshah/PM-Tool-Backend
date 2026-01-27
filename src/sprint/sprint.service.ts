// sprint.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sprint } from './schemas/sprint.schema';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { SprintStatus } from './enums/sprint-status.enum';
import { Item, ItemDocument, ItemStatus } from '../work-items/schemas/work-item.schema';
import { AddWorkItemsToSprintDto } from './dto/add-workitems-to-sprint.dto';

@Injectable()
export class SprintService {
  constructor(
    @InjectModel(Sprint.name) private sprintModel: Model<Sprint>,
    @InjectModel(Item.name) private workItemModel: Model<ItemDocument>,
  ) {}

  async createSprint(dto: CreateSprintDto) {
    return this.sprintModel.create({
      ...dto,
      workspaceId: new Types.ObjectId(dto.workspaceId),
      workItems: dto.workItems?.map((id) => new Types.ObjectId(id)) || [],
    });
  }

  async getWorkspaceSprints(workspaceId: string) {
    return this.sprintModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate('workItems');
  }

  async startSprint(sprintId: string) {
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) throw new NotFoundException('Sprint not found');

    sprint.status = SprintStatus.ACTIVE;

    // Move work-items to TODO (ensure they start in To Do column)
    await this.workItemModel.updateMany(
      { _id: { $in: sprint.workItems } },
      { status: ItemStatus.TODO },
    );

    return sprint.save();
  }

  async completeSprint(sprintId: string) {
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) throw new NotFoundException('Sprint not found');

    sprint.status = SprintStatus.COMPLETED;

    // ❗ Not done → Backlog
    await this.workItemModel.updateMany(
      {
        _id: { $in: sprint.workItems },
        status: { $ne: ItemStatus.DONE },
      },
      { status: ItemStatus.BACKLOG },
    );

    return sprint.save();
  }

  // sprint.service.ts
  async reopenSprint(sprintId: string) {
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) throw new NotFoundException('Sprint not found');

    if (sprint.status !== SprintStatus.COMPLETED) {
      throw new BadRequestException('Only completed sprints can be reopened');
    }

    sprint.status = SprintStatus.ACTIVE; // ✅ Enum-safe
    return sprint.save();
  }

  // sprint.service.ts
  async addWorkItemsToSprintAndUpdateStatus(sprintId: string, dto: AddWorkItemsToSprintDto) {
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) throw new NotFoundException('Sprint not found');

    if (sprint.status === 'COMPLETED') {
      throw new BadRequestException('Cannot add work-items to completed sprint');
    }

    // Fetch valid work-items (same workspace)
    console.log('🔍 addWorkItemsToSprintAndUpdateStatus - Searching for items:', {
      ids: dto.workItemIds,
      workspace: sprint.workspaceId,
    });

    // 1. Fetch by IDs first (ignoring workspace for now to debug)
    const candidates = await this.workItemModel.find({
      _id: { $in: dto.workItemIds.map((id) => new Types.ObjectId(id)) },
    });

    console.log(`✅ Found ${candidates.length} candidate items`);

    // 2. Filter by workspace in memory (safest)
    const workItems = candidates.filter((item) => {
      const itemWs = item.workspace?.toString();
      const sprintWs = sprint.workspaceId?.toString();
      const match = itemWs === sprintWs;
      if (!match) {
        console.warn(`⚠️ Item ${item._id} workspace (${itemWs}) != Sprint workspace (${sprintWs})`);
      }
      return match;
    });

    if (!workItems.length) {
      console.error('❌ No valid work-items found for IDs:', dto.workItemIds);
      throw new NotFoundException('No valid work-items found (Workspace mismatch or invalid IDs)');
    }

    // Remove duplicates
    const newWorkItemIds = workItems
      .map((wi) => wi._id)
      .filter((id) => !sprint.workItems.some((existing) => existing.equals(id)));

    // Add to sprint
    sprint.workItems.push(...newWorkItemIds);

    // 🎯 Decide new status
    // Always move to TODO when adding to a sprint (whether Planned or Active)
    const newStatus = ItemStatus.TODO;

    // 🔁 Update status of ALL added work-items (even if they were already in the sprint list)
    // This fixes the issue where items moved to backlog from a completed sprint couldn't be re-added to the same sprint after reopening
    const allWorkItemIds = workItems.map((wi) => wi._id);
    await this.workItemModel.updateMany({ _id: { $in: allWorkItemIds } }, { status: newStatus });

    // 🧹 Remove these items from OTHER active/planned sprints to prevent duplicates
    // This fixes the issue where moving an item to a new sprint didn't remove it from the old reopened sprint
    await this.sprintModel.updateMany(
      {
        _id: { $ne: sprint._id },
        workspaceId: sprint.workspaceId,
        status: { $in: [SprintStatus.ACTIVE, SprintStatus.PLANNED] },
        workItems: { $in: allWorkItemIds },
      },
      {
        $pull: { workItems: { $in: allWorkItemIds } },
      },
    );

    await sprint.save();

    return {
      message: 'Work-items added to sprint successfully',
      sprintStatus: sprint.status,
      workItemStatusUpdatedTo: newStatus,
      addedWorkItemCount: newWorkItemIds.length,
    };
  }

  async updateSprintColumns(sprintId: string, columns: string[]) {
    const sprint = await this.sprintModel.findByIdAndUpdate(sprintId, { columns }, { new: true });
    if (!sprint) throw new NotFoundException('Sprint not found');
    return sprint;
  }

  async updateSprintDetails(
    sprintId: string,
    body: Partial<{ name: string; goal?: string; startDate: string; endDate: string }>,
  ) {
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) throw new NotFoundException('Sprint not found');
    if (typeof body.name === 'string') sprint.name = body.name;
    if (typeof body.goal !== 'undefined') sprint.goal = body.goal || '';
    if (typeof body.startDate === 'string') sprint.startDate = new Date(body.startDate) as any;
    if (typeof body.endDate === 'string') sprint.endDate = new Date(body.endDate) as any;
    return sprint.save();
  }

  async deleteSprint(sprintId: string) {
    const sprint = await this.sprintModel.findByIdAndDelete(sprintId);
    if (!sprint) throw new NotFoundException('Sprint not found');
    return { message: 'Sprint deleted successfully', sprintId };
  }
}
