// src/project-management/project-management.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProjectManagementService } from './project-management.service';
import { Project, Epic, Story, Task, Subtask, Bug } from './schemas/project-management.schema';

@Controller('projects')
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
  createProject(@Body() data: Partial<Project>) {
    return this.projectService.createProject(data);
  }

  @Get()
  getProjects() {
    return this.projectService.getProjects();
  }

  @Get(':id')
  getProjectById(@Param('id') id: string) {
    this.validateId(id, 'Project ID');
    return this.projectService.getProjectById(id);
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
}
