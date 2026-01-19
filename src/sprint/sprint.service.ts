// sprint.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sprint } from './schemas/sprint.schema';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { SprintStatus } from './enums/sprint-status.enum';
import { Item, ItemDocument } from '../work-items/schemas/work-item.schema';
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
      workItems: dto.workItems?.map(id => new Types.ObjectId(id)) || [],
    });
  }

  async getWorkspaceSprints(workspaceId: string) {
    return this.sprintModel
      .find({ workspaceId })
      .populate('workItems');
  }

  async startSprint(sprintId: string) {
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) throw new NotFoundException('Sprint not found');

    sprint.status = SprintStatus.ACTIVE;

    // Move work-items from BACKLOG → IN_PROGRESS
    await this.workItemModel.updateMany(
      { _id: { $in: sprint.workItems } },
      { status: 'IN_PROGRESS' },
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
        status: { $ne: 'DONE' },
      },
      { status: 'BACKLOG' },
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

  sprint.status = SprintStatus.ACTIVE;  // ✅ Enum-safe
  return sprint.save();
}


  // sprint.service.ts
async addWorkItemsToSprintAndUpdateStatus(
  sprintId: string,
  dto: AddWorkItemsToSprintDto,
) {
  const sprint = await this.sprintModel.findById(sprintId);
  if (!sprint) throw new NotFoundException('Sprint not found');

  if (sprint.status === 'COMPLETED') {
    throw new BadRequestException('Cannot add work-items to completed sprint');
  }

  // Fetch valid work-items (same workspace)
  const workItems = await this.workItemModel.find({
    _id: { $in: dto.workItemIds },
    workspaceId: sprint.workspaceId,
  });

  if (!workItems.length) {
    throw new NotFoundException('No valid work-items found');
  }

  // Remove duplicates
  const newWorkItemIds = workItems
    .map(wi => wi._id)
    .filter(
      id => !sprint.workItems.some(existing => existing.equals(id)),
    );

  // Add to sprint
  sprint.workItems.push(...newWorkItemIds);

  // 🎯 Decide new status
  const newStatus =
    sprint.status === 'ACTIVE'
      ? 'IN_PROGRESS'
      : 'BACKLOG';

  // 🔁 Update status of added work-items
  await this.workItemModel.updateMany(
    { _id: { $in: newWorkItemIds } },
    { status: newStatus },
  );

  await sprint.save();

  return {
    message: 'Work-items added to sprint successfully',
    sprintStatus: sprint.status,
    workItemStatusUpdatedTo: newStatus,
    addedWorkItemCount: newWorkItemIds.length,
  };
}
}
