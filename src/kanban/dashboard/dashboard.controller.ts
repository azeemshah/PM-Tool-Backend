// src/dashboard/dashboard.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardWidget } from './schemas/dashboard-widget.schema';

@Controller('pm-kanban/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /* ================= Create Widget ================= */
  @Post('widget')
  createWidget(@Body() widgetData: Partial<DashboardWidget>) {
    return this.dashboardService.createWidget(widgetData);
  }

  /* ================= Get All Widgets ================= */
  @Get('widgets')
  getWidgets(@Query('workspaceId') workspaceId: string, @Query('userId') userId: string) {
    return this.dashboardService.getWidgets(workspaceId, userId);
  }

  /* ================= Get Single Widget ================= */
  @Get('widget/:id')
  getWidget(@Param('id') id: string) {
    return this.dashboardService.getWidget(id);
  }

  /* ================= Update Widget ================= */
  @Put('widget/:id')
  updateWidget(@Param('id') id: string, @Body() widgetData: Partial<DashboardWidget>) {
    return this.dashboardService.updateWidget(id, widgetData);
  }

  /* ================= Delete Widget ================= */
  @Delete('widget/:id')
  deleteWidget(@Param('id') id: string) {
    return this.dashboardService.deleteWidget(id);
  }

  /* ================= Toggle Visibility ================= */
  @Put('widget/:id/toggle-visibility')
  toggleVisibility(@Param('id') id: string) {
    return this.dashboardService.toggleVisibility(id);
  }
}
