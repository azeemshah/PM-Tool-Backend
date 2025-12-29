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

  /* ================= CREATE ================= */

  async create(dto: CreateWorkItemDto): Promise<WorkItem> {
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

  async update(
    id: string,
    dto: UpdateWorkItemDto,
  ): Promise<WorkItem> {
    const updated = await this.workItemModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!updated) throw new NotFoundException('Work item not found');
    return updated;
  }

  /* ================= STATUS / WORKFLOW ================= */

  async changeStatus(
    id: string,
    newStatus: WorkStatus,
  ): Promise<WorkItem> {
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
