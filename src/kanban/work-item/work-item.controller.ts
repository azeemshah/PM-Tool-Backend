// src/work-item/work-item.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { WorkItemService } from './work-item.service';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { MoveStatusDto } from './dto/move-status.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkspaceRolesGuard } from '@/common/guards/workspace-roles.guard';

@Controller('kanban/items')
@UseGuards(JwtAuthGuard)
export class WorkItemController {
  constructor(private readonly workItemService: WorkItemService) {}

  /* ================= Create Work Item ================= */
  @Roles('Owner', 'Admin', 'Member')
  @UseGuards(WorkspaceRolesGuard)
  @Post()
  async createWorkItem(
    @Body() createDto: CreateWorkItemDto,
    @CurrentUser('userId') userId?: string,
  ) {
    console.log('DTO Received in Controller:', createDto);
    return this.workItemService.create(createDto, userId);
  }

  /* ================= Get All Work Items ================= */
  
  @Get()
  async getAllWorkItems() {
    return this.workItemService.findAll();
  }

  /* ================= Get Work Item by ID ================= */
  @Get(':id')
  async getWorkItem(@Param('id') id: string) {
    return this.workItemService.findById(id);
  }

  /* ================= Update Work Item ================= */
    @Roles('Owner', 'Admin', 'Member')
  @UseGuards(WorkspaceRolesGuard)
  @Put(':id')
  async updateWorkItem(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkItemDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.workItemService.update(id, updateDto, userId);
  }

  /* ================= Delete Work Item ================= */
    @Roles('Owner', 'Admin')
  @UseGuards(WorkspaceRolesGuard)
  @Delete(':id')
  async deleteWorkItem(@Param('id') id: string, @CurrentUser('userId') userId?: string) {
    return this.workItemService.delete(id, userId);
  }

  /* ================= Move Work Item Status ================= */
    @Roles('Owner', 'Admin', 'Member')
  @UseGuards(WorkspaceRolesGuard)
  @Put(':id/move-status')
  async moveStatus(@Body() moveDto: MoveStatusDto, @CurrentUser('userId') userId?: string) {
    return this.workItemService.moveStatus(moveDto, userId);
  }

  /* ================= Assign User to Work Item ================= */
    @Roles('Owner', 'Admin', 'Member')
  @UseGuards(WorkspaceRolesGuard)
  @Put(':id/assign-user')
  async assignUser(@Body() assignDto: AssignUserDto, @CurrentUser('userId') userId?: string) {
    return this.workItemService.assignUser(assignDto, userId);
  }
}
