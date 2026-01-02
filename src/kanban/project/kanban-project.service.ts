// src/kanban/project/kanban-project.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KanbanProject } from './schemas/kanban-project.schema';
import { CreateKanbanProjectDto } from './dto/create-kanban-project.dto';
import { UpdateKanbanProjectDto } from './dto/update-kanban-project.dto';
import { AssignUserDto } from './dto/assign-user.dto';

@Injectable()
export class KanbanProjectService {
  constructor(
    @InjectModel(KanbanProject.name) private readonly projectModel: Model<KanbanProject>,
  ) {}

  /** Create a new Kanban Project */
  async create(createProjectDto: CreateKanbanProjectDto): Promise<KanbanProject> {
    try {
      const newProject = new this.projectModel(createProjectDto);
      return await newProject.save();
    } catch (err) {
      console.error('Create Project Error:', err);
      throw new InternalServerErrorException('Failed to create project');
    }
  }

  /** Get all Kanban Projects */
  async findAll(): Promise<KanbanProject[]> {
    try {
      return await this.projectModel.find().exec();
    } catch (err) {
      console.error('Find All Projects Error:', err);
      throw new InternalServerErrorException('Failed to fetch projects');
    }
  }

  /** Get a single Kanban Project by ID */
  async findById(id: string): Promise<KanbanProject> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Project ID');
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return project;
  }

  /** Update a Kanban Project */
  async update(id: string, updateProjectDto: UpdateKanbanProjectDto): Promise<KanbanProject> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Project ID');
    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { new: true })
      .exec();
    if (!updatedProject) throw new NotFoundException(`Project with ID ${id} not found`);
    return updatedProject;
  }

  /** Delete a Kanban Project */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Project ID');
    const result = await this.projectModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Project with ID ${id} not found`);
  }

  /** Assign a user to a project */
  async assignUser(id: string, assignUserDto: AssignUserDto): Promise<KanbanProject> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Project ID');
    if (!Types.ObjectId.isValid(assignUserDto.userId)) throw new BadRequestException('Invalid User ID');

    const project = await this.findById(id);

    if (!project.users) project.users = [];

    const userId = new Types.ObjectId(assignUserDto.userId);

    // Prevent duplicate users
    if (!project.users.some(u => u.equals(userId))) {
      project.users.push(userId);
      await project.save();
    }

    return project;
  }

  /** Remove a user from a project */
  async removeUser(id: string, userId: string): Promise<KanbanProject> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Project ID');
    if (!Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid User ID');

    const project = await this.findById(id);

    project.users = project.users.filter(u => u.toString() !== userId);

    await project.save();

    return project;
  }

  /** Remove multiple users from a project */
  async removeUsers(id: string, userIds: string[]): Promise<KanbanProject> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Project ID');
    const invalidIds = userIds.filter(u => !Types.ObjectId.isValid(u));
    if (invalidIds.length) throw new BadRequestException('One or more User IDs are invalid');

    const project = await this.findById(id);

    project.users = project.users.filter(u => !userIds.includes(u.toString()));

    await project.save();

    return project;
  }

  /** Clear all users from a project */
  async clearUsers(id: string): Promise<KanbanProject> {
    const project = await this.findById(id);
    project.users = [];
    await project.save();
    return project;
  }
}
