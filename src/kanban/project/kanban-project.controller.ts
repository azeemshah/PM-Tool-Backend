// src/kanban/project/kanban-project.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { KanbanProjectService } from './kanban-project.service';
import { CreateKanbanProjectDto } from './dto/create-kanban-project.dto';
import { UpdateKanbanProjectDto } from './dto/update-kanban-project.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { KanbanProject } from './schemas/kanban-project.schema';

@Controller('kanban/projects')
export class KanbanProjectController {
  constructor(private readonly projectService: KanbanProjectService) {}

  // Create a new project
  @Post()
  async create(@Body() createProjectDto: CreateKanbanProjectDto): Promise<KanbanProject> {
    return this.projectService.create(createProjectDto);
  }

  // Get all projects
  @Get()
  async findAll(): Promise<KanbanProject[]> {
    return this.projectService.findAll();
  }

  // Get a project by ID
  @Get(':id')
  async findById(@Param('id') id: string): Promise<KanbanProject> {
    return this.projectService.findById(id);
  }

  // Update a project
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateKanbanProjectDto,
  ): Promise<KanbanProject> {
    return this.projectService.update(id, updateProjectDto);
  }

  // Delete a project
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.projectService.remove(id);
  }

  // Assign a user to a project
  @Post(':id/assign-user')
  async assignUser(
    @Param('id') id: string,
    @Body() assignUserDto: AssignUserDto,
  ): Promise<KanbanProject> {
    return this.projectService.assignUser(id, assignUserDto);
  }

  // Remove a user from a project
  @Post(':id/remove-user/:userId')
  async removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<KanbanProject> {
    return this.projectService.removeUser(id, userId);
  }
}
