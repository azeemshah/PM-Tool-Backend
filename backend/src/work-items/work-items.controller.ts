import { Controller, Post, Body, Patch, Param, Get, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkItemsService, WorkStatus } from './work-items.service';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Work Items')
@Controller('work-items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkItemsController {
  constructor(private readonly service: WorkItemsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MEMBER)
  @ApiOperation({ summary: 'Create work item' })
  create(@Body() dto: CreateWorkItemDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MEMBER)
  @ApiOperation({ summary: 'Update work item' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkItemDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MEMBER)
  @ApiOperation({ summary: 'Change work item status' })
  changeStatus(
    @Param('id') id: string,
    @Body('status') status: WorkStatus,
  ) {
    return this.service.changeStatus(id, status);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiOperation({ summary: 'View work item' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete work item (Admin only)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
