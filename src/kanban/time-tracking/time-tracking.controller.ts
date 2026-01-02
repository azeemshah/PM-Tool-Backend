// src/kanban/time-tracking/time-tracking.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeLogDto } from './dto/create-time-log.dto';
import { UpdateTimeLogDto } from './dto/update-time-log.dto';

@Controller('kanban/time-logs')
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  // -------------------- Create Time Log --------------------
  @Post('logs')
  async createTimeLog(@Body() dto: CreateTimeLogDto) {
    return this.timeTrackingService.createTimeLog(dto);
  }

  // -------------------- Get All Time Logs --------------------
  @Get('logs')
  async getAllTimeLogs() {
    return this.timeTrackingService.getAllTimeLogs();
  }

  // -------------------- Get Time Log by ID --------------------
  @Get('logs/:id')
  async getTimeLogById(@Param('id') id: string) {
    return this.timeTrackingService.getTimeLogById(id);
  }

  // -------------------- Update Time Log --------------------
  @Put('logs/:id')
  async updateTimeLog(@Param('id') id: string, @Body() dto: UpdateTimeLogDto) {
    return this.timeTrackingService.updateTimeLog(id, dto);
  }

  // -------------------- Delete Time Log --------------------
  @Delete('logs/:id')
  async deleteTimeLog(@Param('id') id: string) {
    return this.timeTrackingService.deleteTimeLog(id);
  }

  // -------------------- Get Timesheet by User --------------------
  @Get('timesheets/:userId')
  async getTimesheetByUser(@Param('userId') userId: string, @Query('weekStart') weekStart: string, @Query('weekEnd') weekEnd: string) {
    return this.timeTrackingService.getTimesheet(userId, new Date(weekStart), new Date(weekEnd));
  }
}
