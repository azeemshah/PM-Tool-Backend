// src/kanban/flow/flow-metrics.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { FlowMetricsService } from './flow-metrics.service';
import { CycleTimeQueryDto } from './dto/cycle-time-query.dto';
import { LeadTimeQueryDto } from './dto/lead-time-query.dto';

@Controller('kanban/metrics')
export class FlowMetricsController {
  constructor(private readonly flowMetricsService: FlowMetricsService) {}

  // -------------------- Cycle Time --------------------
  @Get('cycle-time')
  async getCycleTime(@Query() query: CycleTimeQueryDto) {
    return this.flowMetricsService.calculateCycleTime(query);
  }

  // -------------------- Lead Time --------------------
  @Get('lead-time')
  async getLeadTime(@Query() query: LeadTimeQueryDto) {
    return this.flowMetricsService.calculateLeadTime(query);
  }

  // -------------------- Throughput --------------------
  @Get('throughput')
  async getThroughput(@Query('boardId') boardId: string) {
    return this.flowMetricsService.calculateThroughput(boardId);
  }
}
