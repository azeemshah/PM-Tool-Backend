// src/project-management/project-management.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Types } from 'mongoose';
import { ProjectManagementService } from './project-management.service';
import { Project, Epic, Story, Task, Subtask, Bug } from './schemas/project-management.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Multer } from 'multer';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectManagementController {
  constructor(private readonly projectService: ProjectManagementService) { }

  /* ------------------------- Helper Functions ------------------------- */
  private isValidObjectId(id: string) {
    return Types.ObjectId.isValid(id);
  }

  private validateId(id: string, name = 'ID') {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ${name}`);
    }
  }

  /* ------------------------- Project Routes ------------------------- */
  @Post()
  createProject(@Request() req: any, @Body() data: Partial<Project>) {
    return this.projectService.createProject(data, req.user.userId);
  }

  @Get()
  async getProjects(@Query('workspaceId') workspaceId?: string) {
    const projects = await this.projectService.getProjects(workspaceId);
    return { projects };
  }

  @Get(':id')
  async getProjectById(@Param('id') id: string) {
    this.validateId(id, 'Project ID');
    const project = await this.projectService.getProjectById(id);
    return { project };
  }

  @Get(':id/analytics')
  getProjectAnalytics(@Param('id') id: string) {
    this.validateId(id, 'Project ID');
    return this.projectService.getProjectAnalytics(id);
  }

  @Put(':id')
  updateProject(@Param('id') id: string, @Body() data: Partial<Project>) {
    this.validateId(id, 'Project ID');
    return this.projectService.updateProject(id, data);
  }

  @Delete(':id')
  deleteProject(@Param('id') id: string) {
    this.validateId(id, 'Project ID');
    return this.projectService.deleteProject(id);
  }

  /* ------------------------- Epic Routes ------------------------- */
  @Post(':projectId/epics')
  createEpic(@Param('projectId') projectId: string, @Body() data: Partial<Epic>) {
    this.validateId(projectId, 'Project ID');
    return this.projectService.createEpic(projectId, data);
  }

  @Get(':projectId/epics')
  getEpics(@Param('projectId') projectId: string) {
    this.validateId(projectId, 'Project ID');
    return this.projectService.getEpics(projectId);
  }

  @Put('epics/:id')
  updateEpic(@Param('id') id: string, @Body() data: Partial<Epic>) {
    this.validateId(id, 'Epic ID');
    return this.projectService.updateEpic(id, data);
  }

  @Delete('epics/:id')
  deleteEpic(@Param('id') id: string) {
    this.validateId(id, 'Epic ID');
    return this.projectService.deleteEpic(id);
  }

  /* ------------------------- Story Routes ------------------------- */
  @Post('epics/:epicId/stories')
  createStory(@Param('epicId') epicId: string, @Body() data: Partial<Story>) {
    this.validateId(epicId, 'Epic ID');
    return this.projectService.createStory(epicId, data);
  }

  @Get('epics/:epicId/stories')
  getStories(@Param('epicId') epicId: string) {
    this.validateId(epicId, 'Epic ID');
    return this.projectService.getStories(epicId);
  }

  @Put('stories/:id')
  updateStory(@Param('id') id: string, @Body() data: Partial<Story>) {
    this.validateId(id, 'Story ID');
    return this.projectService.updateStory(id, data);
  }

  @Delete('stories/:id')
  deleteStory(@Param('id') id: string) {
    this.validateId(id, 'Story ID');
    return this.projectService.deleteStory(id);
  }

  /* ------------------------- Task Routes ------------------------- */
  @Post('stories/:storyId/tasks')
  createTask(@Param('storyId') storyId: string, @Body() data: Partial<Task>) {
    this.validateId(storyId, 'Story ID');
    return this.projectService.createTask(storyId, data);
  }

  @Get('stories/:storyId/tasks')
  getTasks(@Param('storyId') storyId: string) {
    this.validateId(storyId, 'Story ID');
    return this.projectService.getTasks(storyId);
  }

  @Put('tasks/:id')
  updateTask(@Param('id') id: string, @Body() data: Partial<Task>) {
    this.validateId(id, 'Task ID');
    return this.projectService.updateTask(id, data);
  }

  @Delete('tasks/:id')
  deleteTask(@Param('id') id: string) {
    this.validateId(id, 'Task ID');
    return this.projectService.deleteTask(id);
  }

  @Put('tasks/bulk')
  bulkUpdateTasks(@Body() body: { ids: string[]; data: Partial<Task> }) {
    const { ids, data } = body || { ids: [], data: {} };
    if (!Array.isArray(ids) || ids.length === 0) return { modifiedCount: 0 };
    ids.forEach((i) => this.validateId(i, 'Task ID'));
    return this.projectService.bulkUpdateTasks(ids, data);
  }

  @Delete('tasks/bulk')
  bulkDeleteTasks(@Body() body: { ids: string[] }) {
    const { ids } = body || { ids: [] };
    if (!Array.isArray(ids) || ids.length === 0) return { deletedCount: 0 };
    ids.forEach((i) => this.validateId(i, 'Task ID'));
    return this.projectService.bulkDeleteTasks(ids);
  }

  /* ------------------------- Global Task List (pagination/filter/search) ------------------------- */
  @Get('tasks')
  getAllTasks(
    @Query('workspaceId') workspaceId?: string,
    @Query('projectId') projectId?: string,
    @Query('storyId') storyId?: string,
    @Query('keyword') keyword?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('pageNumber') pageNumber = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    const pNum = parseInt(pageNumber as any, 10) || 1;
    const pSize = Math.min(100, parseInt(pageSize as any, 10) || 10);
    return this.projectService.getAllTasks({
      workspaceId,
      projectId,
      storyId,
      keyword,
      priority,
      status,
      assignedTo,
      pageNumber: pNum,
      pageSize: pSize,
    });
  }

  /* ------------------------- Subtask Routes ------------------------- */
  @Post('tasks/:taskId/subtasks')
  createSubtask(@Param('taskId') taskId: string, @Body() data: Partial<Subtask>) {
    this.validateId(taskId, 'Task ID');
    return this.projectService.createSubtask(taskId, data);
  }

  @Get('tasks/:taskId/subtasks')
  getSubtasks(@Param('taskId') taskId: string) {
    this.validateId(taskId, 'Task ID');
    return this.projectService.getSubtasks(taskId);
  }

  @Put('subtasks/:id')
  updateSubtask(@Param('id') id: string, @Body() data: Partial<Subtask>) {
    this.validateId(id, 'Subtask ID');
    return this.projectService.updateSubtask(id, data);
  }

  @Delete('subtasks/:id')
  deleteSubtask(@Param('id') id: string) {
    this.validateId(id, 'Subtask ID');
    return this.projectService.deleteSubtask(id);
  }

  /* ------------------------- Bug Routes ------------------------- */
  @Post('bugs')
  createBug(@Body() data: Partial<Bug>) {
    return this.projectService.createBug(data);
  }

  @Get('bugs')
  getBugs(
    @Query('taskId') taskId?: string,
    @Query('subtaskId') subtaskId?: string,
    @Query('projectId') projectId?: string,
  ) {
    if (taskId) this.validateId(taskId, 'Task ID');
    if (subtaskId) this.validateId(subtaskId, 'Subtask ID');
    if (projectId) this.validateId(projectId, 'Project ID');
    return this.projectService.getBugs(taskId, subtaskId, projectId);
  }

  @Put('bugs/:id')
  updateBug(@Param('id') id: string, @Body() data: Partial<Bug>) {
    this.validateId(id, 'Bug ID');
    return this.projectService.updateBug(id, data);
  }

  @Delete('bugs/:id')
  deleteBug(@Param('id') id: string) {
    this.validateId(id, 'Bug ID');
    return this.projectService.deleteBug(id);
  }

  /* ------------------------- Attachments Upload ------------------------- */
  @Post('bugs/:id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const name = path.parse(file.originalname).name.replace(/\s+/g, '-');
          const fileExtName = path.extname(file.originalname);
          const timestamp = Date.now();
          cb(null, `${name}-${timestamp}${fileExtName}`);
        },
      }),
    }),
  )
  async uploadBugAttachment(@Param('id') id: string, @UploadedFile() file: Multer.File) {
    this.validateId(id, 'Bug ID');
    if (!file) throw new BadRequestException('File is required');
    const url = `/uploads/${file.filename}`;
    await this.projectService.addAttachmentToBug(id, url);
    return { url };
  }

  @Post('tasks/:id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const name = path.parse(file.originalname).name.replace(/\s+/g, '-');
          const fileExtName = path.extname(file.originalname);
          const timestamp = Date.now();
          cb(null, `${name}-${timestamp}${fileExtName}`);
        },
      }),
    }),
  )
  async uploadTaskAttachment(@Param('id') id: string, @UploadedFile() file: Multer.File) {
    this.validateId(id, 'Task ID');
    if (!file) throw new BadRequestException('File is required');
    const url = `/uploads/${file.filename}`;
    await this.projectService.addAttachmentToTask(id, url);
    return { url };
  }

  @Delete('tasks/:id/attachments')
  async deleteTaskAttachment(@Param('id') id: string, @Query('url') url: string) {
    this.validateId(id, 'Task ID');
    if (!url) throw new BadRequestException('URL is required');
    await this.projectService.removeAttachmentFromTask(id, url);
    return { message: 'Attachment deleted' };
  }

  @Delete('bugs/:id/attachments')
  async deleteBugAttachment(@Param('id') id: string, @Query('url') url: string) {
    this.validateId(id, 'Bug ID');
    if (!url) throw new BadRequestException('URL is required');
    await this.projectService.removeAttachmentFromBug(id, url);
    return { message: 'Attachment deleted' };
  }
}
