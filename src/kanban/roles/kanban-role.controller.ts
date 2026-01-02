// src/kanban/roles/kanban-role.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { KanbanRoleService } from './kanban-role.service';
import { CreateKanbanRoleDto } from './dto/create-kanban-role.dto';
import { UpdateKanbanRoleDto } from './dto/update-kanban-role.dto';
import { KanbanRole } from './schemas/kanban-role.schema';

@Controller('kanban/roles')
export class KanbanRoleController {
  constructor(private readonly roleService: KanbanRoleService) {}

  // Create a new role
  @Post()
  async create(@Body() createRoleDto: CreateKanbanRoleDto): Promise<KanbanRole> {
    return this.roleService.create(createRoleDto);
  }

  // Get all roles
  @Get()
  async findAll(): Promise<KanbanRole[]> {
    return this.roleService.findAll();
  }

  // Get a role by ID
  @Get(':id')
  async findById(@Param('id') id: string): Promise<KanbanRole> {
    return this.roleService.findById(id);
  }

  // Update a role
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateKanbanRoleDto,
  ): Promise<KanbanRole> {
    return this.roleService.update(id, updateRoleDto);
  }

  // Delete a role
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.roleService.remove(id);
  }
}
