import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Delete,
  Request,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { TimeLogService } from './time-log.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'; // Adjust path as needed

@Controller('time-logs')
@UseGuards(JwtAuthGuard)
export class TimeLogController {
  constructor(private readonly timeLogService: TimeLogService) {}

  // ============ MANUAL TIME LOGGING ============

  /**
   * POST /time-logs
   * Manual time logging
   */
  @Post()
  async logTime(@Body() body: any, @Request() req: any) {
    return this.timeLogService.create({
      issueId: body.issueId,
      timeSpent: body.timeSpent,
      logDate: body.logDate ? new Date(body.logDate) : new Date(),
      comment: body.comment,
      issueType: body.issueType,
      userId: req.user?.userId,
    });
  }

  // ============ TIMER-BASED LOGGING ============

  /**
   * POST /time-logs/start
   * Start a timer for an issue
   */
  @Post('start')
  async startTimer(@Body() body: { issueId: string }, @Request() req: any) {
    return this.timeLogService.startTimer(body.issueId, req.user?.userId);
  }

  /**
   * POST /time-logs/stop
   * Stop the active timer and save elapsed time
   */
  @Post('stop')
  async stopTimer(@Body() body: { issueId: string; comment?: string }, @Request() req: any) {
    return this.timeLogService.stopTimer(body.issueId, req.user?.userId, body.comment);
  }

  /**
   * GET /time-logs/active/:userId
   * Get the active timer for a user (if any)
   */
  @Get('active/:userId')
  async getActiveTimer(@Param('userId') userId: string) {
    return this.timeLogService.getActiveTimer(userId);
  }

  // ============ RETRIEVE LOGS ============

  /**
   * GET /time-logs/issue/:issueId
   * Get all time logs for an issue
   */
  @Get('issue/:issueId')
  getByIssue(@Param('issueId') issueId: string) {
    return this.timeLogService.getByIssue(issueId);
  }

  /**
   * GET /time-logs/user/:userId
   * Get all time logs for a user
   */
  @Get('user/:userId')
  getByUser(@Param('userId') userId: string) {
    return this.timeLogService.getByUser(userId);
  }

  // ============ TIMESHEET ============

  /**
   * GET /time-logs/timesheet?userId=&from=&to=
   * Get timesheet with daily/weekly grouping
   */
  @Get('timesheet')
  async getTimesheet(
    @Query('userId') userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!userId || !from || !to) {
      throw new BadRequestException('userId, from, and to query parameters are required');
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 (YYYY-MM-DD)');
    }

    return this.timeLogService.getTimesheet(userId, fromDate, toDate);
  }

  // ============ EDIT & DELETE ============

  /**
   * PUT /time-logs/:id
   * Edit a time log (user can edit own, admin can edit any)
   */
  @Put(':id')
  async updateTimeLog(
    @Param('id') id: string,
    @Body() body: { timeSpent?: number; comment?: string; logDate?: string },
    @Request() req: any,
  ) {
    const isAdmin = req.user?.role === 'admin'; // Adjust based on your auth structure
    const updateData: any = {};

    if (body.timeSpent !== undefined) updateData.timeSpent = body.timeSpent;
    if (body.comment !== undefined) updateData.comment = body.comment;
    if (body.logDate) updateData.logDate = new Date(body.logDate);

    return this.timeLogService.update(id, updateData, req.user?.userId, isAdmin);
  }

  /**
   * DELETE /time-logs/:id
   * Delete a time log and restore remaining estimate
   */
  @Delete(':id')
  async deleteTimeLog(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user?.role === 'admin'; // Adjust based on your auth structure
    return this.timeLogService.remove(id, req.user?.userId, isAdmin);
  }
}
