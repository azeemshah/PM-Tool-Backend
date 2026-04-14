import { Controller, Get, Query, Req } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('pm-history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async list(
    @Query('userId') userId: string,
    @Query('projectId') projectId: string,
    @Query('taskId') taskId: string,
    @Query('type') type: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sortOrder') sortOrder = 'desc',
  ) {
    const result = await this.historyService.list({
      userId,
      projectId,
      taskId,
      type,
      from,
      to,
      page: Number(page),
      limit: Number(limit),
      sortOrder: sortOrder as 'asc' | 'desc',
    });
    return result;
  }
}
