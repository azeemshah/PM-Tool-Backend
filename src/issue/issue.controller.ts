import { Controller, Post, Get, Param, Body, Patch } from '@nestjs/common';
import { IssueService } from './issue.service';

@Controller('issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Post()
  create(@Body() body: any) {
    return this.issueService.create(body);
  }

  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string) {
    return this.issueService.getByProject(projectId);
  }

  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.issueService.changeStatus(id, status);
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body('assignee') assignee: string) {
    return this.issueService.assign(id, assignee);
  }
}
