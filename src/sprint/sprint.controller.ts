import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SprintService } from './sprint.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { StartSprintDto } from './dto/start-sprint.dto';

@Controller('sprints')
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  create(@Body() dto: CreateSprintDto) {
    return this.sprintService.createSprint(dto);
  }

  @Get('workspace/:workspaceId')
  getByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.sprintService.getSprintsByWorkspace(workspaceId);
  }

  @Patch(':id/start')
  start(
    @Param('id') sprintId: string,
    @Body() dto: StartSprintDto,
  ) {
    return this.sprintService.startSprint(sprintId, dto);
  }

  @Patch(':id/complete')
  complete(@Param('id') sprintId: string) {
    return this.sprintService.completeSprint(sprintId);
  }
}
