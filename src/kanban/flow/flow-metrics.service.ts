// src/kanban/flow/flow-metrics.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CycleTime } from './schemas/cycle-time.schema';
import { LeadTime } from './schemas/lead-time.schema';
import { Throughput } from './schemas/throughput.schema';
import { CycleTimeQueryDto } from './dto/cycle-time-query.dto';
import { LeadTimeQueryDto } from './dto/lead-time-query.dto';
import { WorkItem } from '../work-item/schemas/work-item.schema';

@Injectable()
export class FlowMetricsService {
  constructor(
    @InjectModel(CycleTime.name) private readonly cycleTimeModel: Model<CycleTime>,
    @InjectModel(LeadTime.name) private readonly leadTimeModel: Model<LeadTime>,
    @InjectModel(Throughput.name) private readonly throughputModel: Model<Throughput>,
    @InjectModel(WorkItem.name) private readonly workItemModel: Model<WorkItem>,
  ) {}

  // -------------------- Cycle Time --------------------
  async calculateCycleTime(query: CycleTimeQueryDto) {
    const { boardId, startDate, endDate } = query;

    const match: any = { board: new Types.ObjectId(boardId) };
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };

    const items = await this.workItemModel.find(match).exec();
    if (!items.length) throw new NotFoundException('No work items found for the given board');

    const durations = items.map(item => {
      if (item['createdAt'] && item['updatedAt']) {
        return (item['updatedAt'].getTime() - item['createdAt'].getTime()) / (1000 * 60 * 60 * 24); // in days
      }
      return 0;
    });

    const averageCycleTime = durations.reduce((a, b) => a + b, 0) / durations.length;

    return { boardId, averageCycleTime };
  }

  // -------------------- Lead Time --------------------
  async calculateLeadTime(query: LeadTimeQueryDto) {
    const { boardId, startDate, endDate } = query;

    const match: any = { board: new Types.ObjectId(boardId) };
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };

    const items = await this.workItemModel.find(match).exec();
    if (!items.length) throw new NotFoundException('No work items found for the given board');

    // Lead time = createdAt to status completion (assume 'done' state)
    const durations = items.map(item => {
      const doneDate = item['updatedAt']; // assume updatedAt = done date
      return (doneDate.getTime() - item['createdAt'].getTime()) / (1000 * 60 * 60 * 24); // in days
    });

    const averageLeadTime = durations.reduce((a, b) => a + b, 0) / durations.length;

    return { boardId, averageLeadTime };
  }

  // -------------------- Throughput --------------------
  async calculateThroughput(boardId: string) {
    const items = await this.workItemModel
      .find({ board: new Types.ObjectId(boardId) })
      .exec();

    const completedItems = items.filter(item => item['status'] === 'done').length;

    return { boardId, completedItems };
  }
}
