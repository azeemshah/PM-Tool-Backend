// src/project-management/project-management.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, Epic, Story, Task, Subtask, Bug } from './schemas/project-management.schema';
import { Workspace } from '../workspace/schemas/workspace.schema';

@Injectable()
export class ProjectManagementService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Epic.name) private readonly epicModel: Model<Epic>,
    @InjectModel(Story.name) private readonly storyModel: Model<Story>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Subtask.name) private readonly subtaskModel: Model<Subtask>,
    @InjectModel(Bug.name) private readonly bugModel: Model<Bug>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
  ) {}

  /* ------------------------- Project CRUD ------------------------- */
  async createProject(
    data: Partial<Project>,
    userId: string,
  ): Promise<{ message: string; project: Project }> {
    // Handle both 'workspace' and 'workspaceId' fields
    const workspaceId = (data as any).workspaceId || data.workspace;

    // Convert workspaceId string to ObjectId
    const projectData = {
      ...data,
      createdBy: new Types.ObjectId(userId),
      workspace: workspaceId
        ? typeof workspaceId === 'string'
          ? new Types.ObjectId(workspaceId)
          : workspaceId
        : undefined,
    };

    // Remove workspaceId from payload if it exists (it's not a schema field)
    delete (projectData as any).workspaceId;
    const project = new this.projectModel(projectData);
    const savedProject = await project.save();

    // Add project to workspace's projects array
    if (savedProject.workspace) {
      await this.workspaceModel
        .findByIdAndUpdate(
          savedProject.workspace,
          { $push: { projects: savedProject._id } },
          { new: true },
        )
        .exec();
    }

    // Populate createdBy user details
    const populatedProject = await this.projectModel
      .findById(savedProject._id)
      .populate('createdBy', 'firstName lastName email avatar name')
      .exec();

    if (!populatedProject) throw new NotFoundException('Project not found');

    return {
      message: 'Project created successfully',
      project: populatedProject,
    };
  }

  async getProjects(workspaceId?: string): Promise<any[]> {
    const filter = workspaceId ? { workspace: new Types.ObjectId(workspaceId) } : {};
    return this.projectModel
      .find(filter)
      .populate('createdBy', 'firstName lastName email avatar name')
      .exec();
  }

  async getProjectById(id: string): Promise<Project> {
    const project = await this.projectModel
      .findById(id)
      .populate('createdBy', 'firstName lastName email avatar name')
      .exec();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const project = await this.projectModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    // Verify project exists
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException('Project not found');

    // Cascade delete related resources
    // 1. Epics
    const epics = await this.epicModel.find({ projectId: id }).exec();
    const epicIds = epics.map((e) => e._id.toString());

    // 2. Stories
    const stories = await this.storyModel.find({ epicId: { $in: epicIds } }).exec();
    const storyIds = stories.map((s) => s._id.toString());

    // 3. Tasks
    const tasks = await this.taskModel.find({ storyId: { $in: storyIds } }).exec();
    const taskIds = tasks.map((t) => t._id.toString());

    // 4. Subtasks
    const subtasks = await this.subtaskModel.find({ taskId: { $in: taskIds } }).exec();
    const subtaskIds = subtasks.map((st) => st._id.toString());

    // 5. Bugs related to project, tasks or subtasks
    const bugFilter: any = { $or: [{ projectId: id }] };
    if (taskIds.length) bugFilter.$or.push({ taskId: { $in: taskIds } });
    if (subtaskIds.length) bugFilter.$or.push({ subtaskId: { $in: subtaskIds } });
    const bugs = await this.bugModel.find(bugFilter).exec();

    // Remove uploaded attachment files referenced by tasks and bugs
    try {
      // lazy import fs/path to avoid issues in environments
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path');

      const filesToRemove: string[] = [];

      const collectAttachments = (items: any[]) => {
        items.forEach((it) => {
          if (Array.isArray(it.attachments)) {
            it.attachments.forEach((url: string) => {
              if (!url) return;
              // Expect stored url like `/uploads/<filename>` or `uploads/<filename>` or full URL
              const parts = url.split('/');
              const filename = parts[parts.length - 1];
              if (filename) filesToRemove.push(filename);
            });
          }
        });
      };

      collectAttachments(tasks);
      collectAttachments(bugs);

      for (const fname of filesToRemove) {
        try {
          const uploadPath = path.join(process.cwd(), 'uploads', fname);
          if (fs.existsSync(uploadPath)) {
            fs.unlinkSync(uploadPath);
          }
        } catch (e) {
          // ignore individual file errors
        }
      }
    } catch (e) {
      // if filesystem removal fails, continue with DB cleanup
    }

    // Delete subtasks, tasks, stories, epics, bugs
    if (subtaskIds.length) await this.subtaskModel.deleteMany({ _id: { $in: subtaskIds } }).exec();
    if (taskIds.length) await this.taskModel.deleteMany({ _id: { $in: taskIds } }).exec();
    if (storyIds.length) await this.storyModel.deleteMany({ _id: { $in: storyIds } }).exec();
    if (epicIds.length) await this.epicModel.deleteMany({ _id: { $in: epicIds } }).exec();
    if (bugs.length) {
      const bugIds = bugs.map((b) => b._id.toString());
      await this.bugModel.deleteMany({ _id: { $in: bugIds } }).exec();
    }

    // Finally delete the project
    await this.projectModel.findByIdAndDelete(id).exec();
    return { message: 'Project and related resources deleted successfully' };
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

  // New: global tasks with filters, pagination and search
  async getAllTasks(options: {
    workspaceId?: string;
    projectId?: string;
    storyId?: string;
    keyword?: string;
    priority?: string;
    status?: string;
    assignedTo?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<{
    tasks: Task[];
    pagination: { totalCount: number; pageNumber: number; pageSize: number };
  }> {
    const {
      projectId,
      storyId,
      keyword,
      priority,
      status,
      assignedTo,
      pageNumber = 1,
      pageSize = 10,
    } = options || {};

    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (storyId) filter.storyId = storyId;
    if (priority) filter.priority = { $in: Array.isArray(priority) ? priority : [priority] };
    if (status) filter.status = { $in: Array.isArray(status) ? status : [status] };
    if (assignedTo) filter.assignee = assignedTo;
    if (keyword) filter.$text = { $search: keyword };

    const skip = (pageNumber - 1) * pageSize;

    const [tasks, totalCount] = await Promise.all([
      this.taskModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
      this.taskModel.countDocuments(filter).exec(),
    ]);

    return { tasks, pagination: { totalCount, pageNumber, pageSize } };
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const task = await this.taskModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async bulkUpdateTasks(ids: string[], data: Partial<Task>): Promise<{ modifiedCount: number }> {
    if (!Array.isArray(ids) || ids.length === 0) return { modifiedCount: 0 };
    const result: any = await this.taskModel
      .updateMany({ _id: { $in: ids } }, { $set: data })
      .exec();
    return { modifiedCount: result?.modifiedCount ?? result?.nModified ?? 0 };
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    const result = await this.taskModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Task not found');
    return { message: 'Task deleted successfully' };
  }

  async bulkDeleteTasks(ids: string[]): Promise<{ deletedCount: number }> {
    if (!Array.isArray(ids) || ids.length === 0) return { deletedCount: 0 };

    // 1. Find subtasks for tasks
    const subtasks = await this.subtaskModel.find({ taskId: { $in: ids } }).exec();
    const subtaskIds = subtasks.map((st) => st._id.toString());

    // 2. Find bugs related to tasks or subtasks
    const bugFilter: any = { $or: [] };
    bugFilter.$or.push({ taskId: { $in: ids } });
    if (subtaskIds.length) bugFilter.$or.push({ subtaskId: { $in: subtaskIds } });
    const bugs = await this.bugModel.find(bugFilter).exec();

    // 3. Collect attachments from tasks and bugs
    const tasks = await this.taskModel.find({ _id: { $in: ids } }).exec();

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path');

      const filesToRemove: string[] = [];

      const collectAttachments = (items: any[]) => {
        items.forEach((it) => {
          if (Array.isArray(it.attachments)) {
            it.attachments.forEach((url: string) => {
              if (!url) return;
              const parts = url.split('/');
              const filename = parts[parts.length - 1];
              if (filename) filesToRemove.push(filename);
            });
          }
        });
      };

      collectAttachments(tasks);
      collectAttachments(bugs);

      for (const fname of filesToRemove) {
        try {
          const uploadPath = path.join(process.cwd(), 'uploads', fname);
          if (fs.existsSync(uploadPath)) {
            fs.unlinkSync(uploadPath);
          }
        } catch (e) {
          // ignore individual file errors
        }
      }
    } catch (e) {
      // continue with DB cleanup even if filesystem ops fail
    }

    // 4. Delete subtasks, bugs, tasks
    if (subtaskIds.length) await this.subtaskModel.deleteMany({ _id: { $in: subtaskIds } }).exec();
    if (bugs.length) {
      const bugIds = bugs.map((b) => b._id.toString());
      await this.bugModel.deleteMany({ _id: { $in: bugIds } }).exec();
    }

    const delResult: any = await this.taskModel.deleteMany({ _id: { $in: ids } }).exec();
    const deletedCount = delResult?.deletedCount ?? delResult?.n ?? 0;
    return { deletedCount };
  }

  // New: project analytics
  async getProjectAnalytics(
    projectId: string,
  ): Promise<{ analytics: { totalTasks: number; overdueTasks: number; completedTasks: number } }> {
    const totalTasks = await this.taskModel.countDocuments({ projectId }).exec();
    const overdueTasks = await this.taskModel
      .countDocuments({ projectId, dueDate: { $lt: new Date() }, status: { $ne: 'done' } })
      .exec();
    const completedTasks = await this.taskModel
      .countDocuments({ projectId, status: 'done' })
      .exec();
    return { analytics: { totalTasks, overdueTasks, completedTasks } };
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

  // Add attachment URL to bug
  async addAttachmentToBug(bugId: string, url: string): Promise<Bug> {
    const bug = await this.bugModel
      .findByIdAndUpdate(bugId, { $push: { attachments: url } }, { new: true })
      .exec();
    if (!bug) throw new NotFoundException('Bug not found');
    return bug;
  }

  // Add attachment URL to task
  async addAttachmentToTask(taskId: string, url: string): Promise<Task> {
    const task = await this.taskModel
      .findByIdAndUpdate(taskId, { $push: { attachments: url } }, { new: true })
      .exec();
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // Remove attachment URL from task
  async removeAttachmentFromTask(taskId: string, url: string): Promise<Task> {
    const task = await this.taskModel
      .findByIdAndUpdate(taskId, { $pull: { attachments: url } }, { new: true })
      .exec();
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // Remove attachment URL from bug
  async removeAttachmentFromBug(bugId: string, url: string): Promise<Bug> {
    const bug = await this.bugModel
      .findByIdAndUpdate(bugId, { $pull: { attachments: url } }, { new: true })
      .exec();
    if (!bug) throw new NotFoundException('Bug not found');
    return bug;
  }
}
