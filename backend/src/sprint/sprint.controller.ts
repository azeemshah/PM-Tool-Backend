import { Controller, Post, Get, Param, Body, Patch } from '@nestjs/common';
import { SprintService } from './sprint.service';

@Controller('sprints')
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  create(@Body() body: any) {
    return this.sprintService.create(body);
  }

  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string) {
    return this.sprintService.getByProject(projectId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.sprintService.updateStatus(id, status);
  }
}
