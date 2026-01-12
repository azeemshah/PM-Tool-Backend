// src/work-item/work-item.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { WorkItemService } from './work-item.service';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { MoveStatusDto } from './dto/move-status.dto';
import { AssignUserDto } from './dto/assign-user.dto';

@Controller('kanban/items')
export class WorkItemController {
  constructor(private readonly workItemService: WorkItemService) {}

  /* ================= Create Work Item ================= */
  @Post()
  async createWorkItem(@Body() createDto: CreateWorkItemDto) {
    console.log('DTO Received in Controller:', createDto);
    return this.workItemService.create(createDto);
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
  @Put(':id')
  async updateWorkItem(@Param('id') id: string, @Body() updateDto: UpdateWorkItemDto) {
    return this.workItemService.update(id, updateDto);
  }

  /* ================= Delete Work Item ================= */
  @Delete(':id')
  async deleteWorkItem(@Param('id') id: string) {
    return this.workItemService.delete(id);
  }

  /* ================= Move Work Item Status ================= */
  @Put(':id/move-status')
  async moveStatus(@Body() moveDto: MoveStatusDto) {
    return this.workItemService.moveStatus(moveDto);
  }

  /* ================= Assign User to Work Item ================= */
  @Put(':id/assign-user')
  async assignUser(@Body() assignDto: AssignUserDto) {
    return this.workItemService.assignUser(assignDto);
  }
}
