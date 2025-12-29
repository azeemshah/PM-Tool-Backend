import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { TimeLogService } from './time-log.service';

@Controller('time-logs')
export class TimeLogController {
  constructor(private readonly timeLogService: TimeLogService) {}

  @Post()
  logTime(@Body() body: any) {
    return this.timeLogService.create(body);
  }

  @Get('issue/:issueId')
  getByIssue(@Param('issueId') issueId: string) {
    return this.timeLogService.getByIssue(issueId);
  }

  @Get('user/:userId')
  getByUser(@Param('userId') userId: string) {
    return this.timeLogService.getByUser(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timeLogService.remove(id);
  }
}
