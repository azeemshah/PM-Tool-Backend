import { Controller, Get, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GetProjectDashboardDto, GetUserDashboardDto, GetSprintStatsDto } from './dto/dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Overall system stats
  @Get('overview')
  @ApiOperation({ summary: 'Get overall system statistics' })
  @ApiResponse({ status: 200, description: 'System stats returned successfully' })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  // Project-specific dashboard
  @Get('project')
  @ApiOperation({ summary: 'Get project-specific dashboard' })
  @ApiQuery({ name: 'projectId', required: true })
  async getProjectDashboard(@Query() query: GetProjectDashboardDto) {
    const dashboard = await this.dashboardService.getProjectDashboard(query.projectId);
    if (!dashboard) throw new NotFoundException('Project not found');
    return dashboard;
  }

  // User dashboard (My Tasks)
  @Get('my-work')
  @ApiOperation({ summary: 'Get user-specific dashboard' })
  @ApiQuery({ name: 'userId', required: true })
  async getMyWork(@Query() query: GetUserDashboardDto) {
    const dashboard = await this.dashboardService.getUserDashboard(query.userId);
    if (!dashboard) throw new NotFoundException('User not found');
    return dashboard;
  }

  // Sprint progress
  @Get('sprint')
  @ApiOperation({ summary: 'Get sprint statistics' })
  @ApiQuery({ name: 'sprintId', required: true })
  async getSprintStats(@Query() query: GetSprintStatsDto) {
    const dashboard = await this.dashboardService.getSprintStats(query.sprintId);
    if (!dashboard) throw new NotFoundException('Sprint not found');
    return dashboard;
  }
}
