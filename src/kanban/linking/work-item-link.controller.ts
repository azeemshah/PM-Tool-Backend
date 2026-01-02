// src/kanban/linking/work-item-link.controller.ts
import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { WorkItemLinkService } from './work-item-link.service';
import { CreateLinkDto } from './dto/create-link.dto';

@Controller('kanban/links')
export class WorkItemLinkController {
  constructor(private readonly workItemLinkService: WorkItemLinkService) {}

  // -------------------- Create Work Item Link --------------------
  @Post()
  async createLink(@Body() dto: CreateLinkDto) {
    return this.workItemLinkService.createLink(dto);
  }

  // -------------------- Get All Work Item Links --------------------
  @Get()
  async getAllLinks() {
    return this.workItemLinkService.getAllLinks();
  }

  // -------------------- Get Link by ID --------------------
  @Get(':id')
  async getLinkById(@Param('id') id: string) {
    return this.workItemLinkService.getLinkById(id);
  }

  // -------------------- Delete Link --------------------
  @Delete(':id')
  async deleteLink(@Param('id') id: string) {
    return this.workItemLinkService.deleteLink(id);
  }
}
