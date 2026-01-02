// src/kanban/roles/kanban-role.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KanbanRole } from './schemas/kanban-role.schema';
import { CreateKanbanRoleDto } from './dto/create-kanban-role.dto';
import { UpdateKanbanRoleDto } from './dto/update-kanban-role.dto';

@Injectable()
export class KanbanRoleService {
  constructor(
    @InjectModel(KanbanRole.name) private readonly roleModel: Model<KanbanRole>,
  ) {}

  // Create a new role
  async create(createRoleDto: CreateKanbanRoleDto): Promise<KanbanRole> {
    const newRole = new this.roleModel(createRoleDto);
    return newRole.save();
  }

  // Get all roles
  async findAll(): Promise<KanbanRole[]> {
    return this.roleModel.find().exec();
  }

  // Get a role by ID
  async findById(id: string): Promise<KanbanRole> {
    const role = await this.roleModel.findById(id).exec();
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  // Update a role
  async update(id: string, updateRoleDto: UpdateKanbanRoleDto): Promise<KanbanRole> {
    const updatedRole = await this.roleModel
      .findByIdAndUpdate(id, updateRoleDto, { new: true })
      .exec();
    if (!updatedRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return updatedRole;
  }

  // Delete a role
  async remove(id: string): Promise<void> {
    const result = await this.roleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }
}
