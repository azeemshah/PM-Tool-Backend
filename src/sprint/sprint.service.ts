// sprint.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sprint } from './schemas/sprint.schema';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { SprintStatus } from './enums/sprint-status.enum';
import { Item, ItemDocument, ItemStatus } from '../work-items/schemas/work-item.schema';
import { AddWorkItemsToSprintDto } from './dto/add-workitems-to-sprint.dto';
import { NotificationService } from '../kanban/notification/notification.service';
import { NotificationType } from '../kanban/notification/schemas/notification.schema';
import { Workspace } from '../workspace/schemas/workspace.schema';

@Injectable()
export class SprintService {
  constructor(
    @InjectModel(Sprint.name) private sprintModel: Model<Sprint>,
    @InjectModel(Item.name) private workItemModel: Model<ItemDocument>,
    @InjectModel(Workspace.name) private workspaceModel: Model<Workspace>,
    private readonly notificationService: NotificationService,
  ) {}

  private async notifyWorkspaceMembers(
    sprint: Sprint,
    type: NotificationType,
    message: string,
    actorId?: string,
  ) {
    if (!sprint.workspaceId) return;

    try {
      const workspace = await this.workspaceModel.findById(sprint.workspaceId).exec();
      if (!workspace) return;

      const recipientIds = new Set<string>();

      // Add workspace owner
      if (workspace.OwnedBy) recipientIds.add(workspace.OwnedBy.toString());

      // Add workspace members
      if (workspace.members) {
        workspace.members.forEach((m) => recipientIds.add(m.toString()));
      }

      // Remove actor from recipients if provided
      if (actorId) {
        recipientIds.delete(actorId);
      }

      const notifications = Array.from(recipientIds).map((recipient) => ({
        recipient: new Types.ObjectId(recipient),
        sender: actorId ? new Types.ObjectId(actorId) : undefined,
        type,
        message,
        workspace: sprint.workspaceId,
        onModel: 'Sprint',
        relatedId: sprint._id as Types.ObjectId,
        isRead: false,
      }));

      // Send notifications in parallel
      await Promise.all(notifications.map((n) => this.notificationService.create(n)));
    } catch (error) {
      console.error('SprintService: Failed to send notifications', error);
    }
  }

  async createSprint(dto: CreateSprintDto, actorId?: string) {
    const sprint = await this.sprintModel.create({
      ...dto,
      workspaceId: new Types.ObjectId(dto.workspaceId),
      workItems: dto.workItems?.map((id) => new Types.ObjectId(id)) || [],
    });

    await this.notifyWorkspaceMembers(
      sprint,
      NotificationType.SPRINT_CREATED,
      `New sprint "${sprint.name}" created`,
      actorId,
    );

    return sprint;
  }

  async getWorkspaceSprints(workspaceId: string) {
    return this.sprintModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate('workItems');
  }

  async startSprint(sprintId: string, actorId?: string) {
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) throw new NotFoundException('Sprint not found');

    sprint.status = SprintStatus.ACTIVE;
    const savedSprint = await sprint.save();

    await this.notifyWorkspaceMembers(
      savedSprint,
      NotificationType.SPRINT_STARTED,
      `Sprint "${sprint.name}" has started`,
      actorId,
    );

    return savedSprint;
  }

  async completeSprint(sprintId: string, targetSprintId?: string, actorId?: string) {
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) throw new NotFoundException('Sprint not found');

    sprint.status = SprintStatus.COMPLETED;

    // Get all non-done work items
    const nonDoneItems = await this.workItemModel.find({
      _id: { $in: sprint.workItems },
      status: { $ne: ItemStatus.DONE },
    });

    const nonDoneItemIds = nonDoneItems.map((item) => item._id);

    if (targetSprintId) {
      // Move items to target sprint with their current statuses
      const targetSprint = await this.sprintModel.findById(targetSprintId);
      if (!targetSprint) throw new NotFoundException('Target sprint not found');

      // Add work items to target sprint
      targetSprint.workItems = [...new Set([...targetSprint.workItems, ...nonDoneItemIds])];
      await targetSprint.save();

      // Update work items to reference the target sprint (keep their current statuses)
      // Note: Items maintain their current status instead of being moved to BACKLOG
    } else {
      // ❗ Not done → Backlog (original behavior)
      await this.workItemModel.updateMany(
        {
          _id: { $in: nonDoneItemIds },
        },
        { status: ItemStatus.BACKLOG },
      );
    }

    // Remove non-done items from the completed sprint
    sprint.workItems = sprint.workItems.filter(
      (itemId) => !nonDoneItemIds.some((id) => id.toString() === itemId.toString()),
    );

    const savedSprint = await sprint.save();

    await this.notifyWorkspaceMembers(
      savedSprint,
      NotificationType.SPRINT_COMPLETED,
      `Sprint "${sprint.name}" completed`,
      actorId,
    );

    return savedSprint;
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

    // 1. Fetch by IDs first (ignoring workspace for now to debug)
    const candidates = await this.workItemModel.find({
      _id: { $in: dto.workItemIds.map((id) => new Types.ObjectId(id)) },
    });

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

    // Move all items in the sprint to backlog
    if (sprint.workItems && sprint.workItems.length > 0) {
      await this.workItemModel.updateMany(
        { _id: { $in: sprint.workItems } },
        { status: ItemStatus.BACKLOG },
      );
    }

    return { message: 'Sprint deleted successfully', sprintId };
  }
}
