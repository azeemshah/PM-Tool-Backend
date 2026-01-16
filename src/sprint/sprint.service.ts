import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sprint, SprintDocument, SprintStatus } from './schemas/sprint.schema';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { StartSprintDto } from './dto/start-sprint.dto';
import { Item, ItemDocument } from '../work-items/schemas/work-item.schema';

@Injectable()
export class SprintService {
  constructor(
    @InjectModel(Sprint.name)
    private sprintModel: Model<SprintDocument>,

    @InjectModel(Item.name)
    private workItemModel: Model<ItemDocument >,
  ) {}

  async createSprint(dto: CreateSprintDto) {
    return this.sprintModel.create(dto);
  }

  async getSprintsByWorkspace(workspaceId: string) {
    return this.sprintModel.find({ workspaceId }).sort({ createdAt: -1 });
  }

  async startSprint(sprintId: string, dto: StartSprintDto) {
    const activeSprint = await this.sprintModel.findOne({
      status: SprintStatus.ACTIVE,
    });

    if (activeSprint) {
      throw new BadRequestException('Only one sprint can be active at a time');
    }

    return this.sprintModel.findByIdAndUpdate(
      sprintId,
      {
        status: SprintStatus.ACTIVE,
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
      { new: true },
    );
  }

  // 🔥 MAIN LOGIC
  async completeSprint(sprintId: string) {
    // 1️⃣ Move unfinished items to BACKLOG
    await this.workItemModel.updateMany(
      {
        sprintId,
        status: { $ne: 'DONE' }, // unfinished
      },
      {
        $set: {
          sprintId: null,
          status: 'BACKLOG',
        },
      },
    );

    // 2️⃣ Mark sprint completed
    return this.sprintModel.findByIdAndUpdate(
      sprintId,
      {
        status: SprintStatus.COMPLETED,
        endDate: new Date(),
      },
      { new: true },
    );
  }
}
