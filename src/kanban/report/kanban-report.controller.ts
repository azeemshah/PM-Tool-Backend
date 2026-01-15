// src/report/kanban-report.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { KanbanReportService } from './kanban-report.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('kanban/reports')
export class KanbanReportController {
  constructor(private readonly reportService: KanbanReportService) {}

  /* ================= Cumulative Flow ================= */
  @Get('cumulative-flow')
  getCumulativeFlowReport(@Query() query: ReportQueryDto) {
    return this.reportService.getCumulativeFlow(query);
  }

  /* ================= Cycle Time ================= */
  @Get('cycle-time')
  getCycleTimeReport(@Query() query: ReportQueryDto) {
    return this.reportService.getCycleTime(query);
  }

  /* ================= Lead Time ================= */
  @Get('lead-time')
  getLeadTimeReport(@Query() query: ReportQueryDto) {
    return this.reportService.getLeadTime(query);
  }

  /* ================= Workload ================= */
  @Get('workload')
  getWorkloadReport(@Query() query: ReportQueryDto) {
    return this.reportService.getWorkload(query);
  }
}
