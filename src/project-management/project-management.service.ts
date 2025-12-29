// src/project-management/project-management.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Project,
  Epic,
  Story,
  Task,
  Subtask,
  Bug,
} from './schemas/project-management.schema';

@Injectable()
export class ProjectManagementService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Epic.name) private readonly epicModel: Model<Epic>,
    @InjectModel(Story.name) private readonly storyModel: Model<Story>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Subtask.name) private readonly subtaskModel: Model<Subtask>,
    @InjectModel(Bug.name) private readonly bugModel: Model<Bug>,
  ) {}

  /* ------------------------- Project CRUD ------------------------- */
  async createProject(data: Partial<Project>): Promise<Project> {
    const project = new this.projectModel(data);
    return project.save();
  }

  async getProjects(): Promise<Project[]> {
    return this.projectModel.find().exec();
  }

  async getProjectById(id: string): Promise<Project> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const project = await this.projectModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    const result = await this.projectModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Project not found');
    return { message: 'Project deleted successfully' };
  }

  /* ------------------------- Epic CRUD ------------------------- */
  async createEpic(projectId: string, data: Partial<Epic>): Promise<Epic> {
    const epic = new this.epicModel({ ...data, projectId: new Types.ObjectId(projectId) });
    return epic.save();
  }

  async getEpics(projectId?: string): Promise<Epic[]> {
    if (projectId) {
      return this.epicModel.find({ projectId }).exec();
    }
    return this.epicModel.find().exec();
  }

  async updateEpic(id: string, data: Partial<Epic>): Promise<Epic> {
    const epic = await this.epicModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!epic) throw new NotFoundException('Epic not found');
    return epic;
  }

  async deleteEpic(id: string): Promise<{ message: string }> {
    const result = await this.epicModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Epic not found');
    return { message: 'Epic deleted successfully' };
  }

  /* ------------------------- Story CRUD ------------------------- */
  async createStory(epicId: string, data: Partial<Story>): Promise<Story> {
    const story = new this.storyModel({
      ...data,
      epicId: new Types.ObjectId(epicId),
    });
    return story.save();
  }

  async getStories(epicId?: string): Promise<Story[]> {
    if (epicId) {
      return this.storyModel.find({ epicId }).exec();
    }
    return this.storyModel.find().exec();
  }

  async updateStory(id: string, data: Partial<Story>): Promise<Story> {
    const story = await this.storyModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!story) throw new NotFoundException('Story not found');
    return story;
  }

  async deleteStory(id: string): Promise<{ message: string }> {
    const result = await this.storyModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Story not found');
    return { message: 'Story deleted successfully' };
  }

  /* ------------------------- Task CRUD ------------------------- */
  async createTask(storyId: string, data: Partial<Task>): Promise<Task> {
    const task = new this.taskModel({
      ...data,
      storyId: new Types.ObjectId(storyId),
    });
    return task.save();
  }

  async getTasks(storyId?: string): Promise<Task[]> {
    if (storyId) return this.taskModel.find({ storyId }).exec();
    return this.taskModel.find().exec();
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const task = await this.taskModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    const result = await this.taskModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Task not found');
    return { message: 'Task deleted successfully' };
  }

  /* ------------------------- Subtask CRUD ------------------------- */
  async createSubtask(taskId: string, data: Partial<Subtask>): Promise<Subtask> {
    const subtask = new this.subtaskModel({
      ...data,
      taskId: new Types.ObjectId(taskId),
    });
    return subtask.save();
  }

  async getSubtasks(taskId?: string): Promise<Subtask[]> {
    if (taskId) return this.subtaskModel.find({ taskId }).exec();
    return this.subtaskModel.find().exec();
  }

  async updateSubtask(id: string, data: Partial<Subtask>): Promise<Subtask> {
    const subtask = await this.subtaskModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!subtask) throw new NotFoundException('Subtask not found');
    return subtask;
  }

  async deleteSubtask(id: string): Promise<{ message: string }> {
    const result = await this.subtaskModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Subtask not found');
    return { message: 'Subtask deleted successfully' };
  }

  /* ------------------------- Bug CRUD ------------------------- */
  async createBug(data: Partial<Bug>): Promise<Bug> {
    const bug = new this.bugModel(data);
    return bug.save();
  }

  async getBugs(taskId?: string, subtaskId?: string, projectId?: string): Promise<Bug[]> {
    const filter: any = {};
    if (taskId) filter.taskId = taskId;
    if (subtaskId) filter.subtaskId = subtaskId;
    if (projectId) filter.projectId = projectId;
    return this.bugModel.find(filter).exec();
  }

  async updateBug(id: string, data: Partial<Bug>): Promise<Bug> {
    const bug = await this.bugModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!bug) throw new NotFoundException('Bug not found');
    return bug;
  }

  async deleteBug(id: string): Promise<{ message: string }> {
    const result = await this.bugModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Bug not found');
    return { message: 'Bug deleted successfully' };
  }
}
