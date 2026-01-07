import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkItem } from './schemas/work-item.schema';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';

export enum WorkStatus {
  CREATE = 'CREATE',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

const WORKFLOW_TRANSITIONS = {
  CREATE: [WorkStatus.TODO],
  TODO: [WorkStatus.IN_PROGRESS],
  IN_PROGRESS: [WorkStatus.IN_REVIEW],
  IN_REVIEW: [WorkStatus.DONE, WorkStatus.IN_PROGRESS],
  DONE: [],
};

@Injectable()
export class WorkItemsService {
  constructor(
    @InjectModel(WorkItem.name)
    private readonly workItemModel: Model<WorkItem>,
  ) {}

  /**
   * Validates work item hierarchy:
   * - Epic: No parent
   * - Story/Task/Bug: Must have epicId, no parentId
   * - Subtask: Must have parentId (pointing to Story/Task/Bug), no epicId
   */
  private validateHierarchy(dto: CreateWorkItemDto) {
    const { issueType, parentId, epicId } = dto;

    if (issueType === 'epic') {
      if (parentId || epicId) {
        throw new BadRequestException('Epic cannot have a parent');
      }
    } else if (['story', 'task', 'bug'].includes(issueType)) {
      if (!epicId) {
        throw new BadRequestException(`${issueType} must have an epicId`);
      }
      if (parentId) {
        throw new BadRequestException(`${issueType} must link to Epic via epicId, not parentId`);
      }
    } else if (issueType === 'subtask') {
      if (!parentId) {
        throw new BadRequestException(
          'Subtask must have a parentId pointing to Story, Task, or Bug',
        );
      }
      if (epicId) {
        throw new BadRequestException('Subtask should not have epicId, only parentId');
      }
    }
  }

  /* ================= CREATE ================= */

  async create(dto: CreateWorkItemDto): Promise<WorkItem> {
    // Validate hierarchy
    this.validateHierarchy(dto);

    const workItem = new this.workItemModel({
      ...dto,
      status: WorkStatus.CREATE,
    });

    return workItem.save();
  }

  /* ================= READ ================= */

  async findById(id: string): Promise<WorkItem> {
    const item = await this.workItemModel.findById(id);
    if (!item) throw new NotFoundException('Work item not found');
    return item;
  }

  async findByProject(projectId: string): Promise<WorkItem[]> {
    return this.workItemModel.find({
      projectId: new Types.ObjectId(projectId),
    });
  }

  /* ================= UPDATE ================= */

  async update(id: string, dto: UpdateWorkItemDto): Promise<WorkItem> {
    const item = await this.workItemModel.findById(id);
    if (!item) throw new NotFoundException('Work item not found');

    // Validate hierarchy if issueType or parent references are being changed
    if (dto.issueType || 'parentId' in dto || 'epicId' in dto) {
      const merged = { ...item.toObject(), ...dto };
      this.validateHierarchy(merged as CreateWorkItemDto);
    }

    const updated = await this.workItemModel.findByIdAndUpdate(id, dto, { new: true });

    if (!updated) throw new NotFoundException('Work item not found');
    return updated;
  }

  /* ================= STATUS / WORKFLOW ================= */

  async changeStatus(id: string, newStatus: WorkStatus): Promise<WorkItem> {
    const item = await this.findById(id);

    const allowedTransitions = WORKFLOW_TRANSITIONS[item.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${item.status} to ${newStatus}`,
      );
    }

    item.status = newStatus;

    if (newStatus === WorkStatus.DONE) {
      item.resolution = 'DONE';
      item.resolutionDate = new Date();
    }

    return item.save();
  }

  /* ================= DELETE ================= */

  async remove(id: string): Promise<void> {
    const result = await this.workItemModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Work item not found');
  }
}
