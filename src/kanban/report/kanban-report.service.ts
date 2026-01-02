// src/report/kanban-report.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CumulativeFlowReport } from './schemas/cumulative-flow-report.schema';
import { CycleTimeReport } from './schemas/cycle-time-report.schema';
import { LeadTimeReport } from './schemas/lead-time-report.schema';
import { WorkloadReport } from './schemas/workload-report.schema';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class KanbanReportService {
  constructor(
    @InjectModel(CumulativeFlowReport.name)
    private readonly cumulativeFlowModel: Model<CumulativeFlowReport>,

    @InjectModel(CycleTimeReport.name)
    private readonly cycleTimeModel: Model<CycleTimeReport>,

    @InjectModel(LeadTimeReport.name)
    private readonly leadTimeModel: Model<LeadTimeReport>,

    @InjectModel(WorkloadReport.name)
    private readonly workloadModel: Model<WorkloadReport>,
  ) {}

  /* ================= Cumulative Flow ================= */
  async getCumulativeFlow(query: ReportQueryDto) {
    const filter: any = {};
    if (query.projectId) filter.project = new Types.ObjectId(query.projectId);
    if (query.fromDate || query.toDate) {
      filter.date = {};
      if (query.fromDate) filter.date.$gte = new Date(query.fromDate);
      if (query.toDate) filter.date.$lte = new Date(query.toDate);
    }

    return this.cumulativeFlowModel
      .find(filter)
      .sort({ date: 1 })
      .exec();
  }

  /* ================= Cycle Time ================= */
  async getCycleTime(query: ReportQueryDto) {
    const filter: any = {};
    if (query.projectId) filter.project = new Types.ObjectId(query.projectId);
    if (query.fromDate || query.toDate) {
      filter.endDate = {};
      if (query.fromDate) filter.endDate.$gte = new Date(query.fromDate);
      if (query.toDate) filter.endDate.$lte = new Date(query.toDate);
    }

    if (query.workItemTypes?.length) {
      filter.workItemType = { $in: query.workItemTypes };
    }

    return this.cycleTimeModel.find(filter).exec();
  }

  /* ================= Lead Time ================= */
  async getLeadTime(query: ReportQueryDto) {
    const filter: any = {};
    if (query.projectId) filter.project = new Types.ObjectId(query.projectId);
    if (query.fromDate || query.toDate) {
      filter.completedDate = {};
      if (query.fromDate) filter.completedDate.$gte = new Date(query.fromDate);
      if (query.toDate) filter.completedDate.$lte = new Date(query.toDate);
    }

    if (query.workItemTypes?.length) {
      filter.workItemType = { $in: query.workItemTypes };
    }

    return this.leadTimeModel.find(filter).exec();
  }

  /* ================= Workload ================= */
  async getWorkload(query: ReportQueryDto) {
    const filter: any = {};
    if (query.projectId) filter.project = new Types.ObjectId(query.projectId);
    if (query.userIds?.length) {
      filter.user = { $in: query.userIds.map(id => new Types.ObjectId(id)) };
    }
    if (query.fromDate || query.toDate) {
      filter.startDate = {};
      if (query.fromDate) filter.startDate.$gte = new Date(query.fromDate);
      if (query.toDate) filter.startDate.$lte = new Date(query.toDate);
    }

    return this.workloadModel.find(filter).exec();
  }
}
