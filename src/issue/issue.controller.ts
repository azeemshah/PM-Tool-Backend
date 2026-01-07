import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { IssueService } from './issue.service';

/**
 * Issue Controller - Unified API for Jira-style issue hierarchy
 *
 * Hierarchy:
 * - POST   /issues/epic                        - Create Epic
 * - POST   /issues/epic/:epicId/story          - Create Story under Epic
 * - POST   /issues/epic/:epicId/task           - Create Task under Epic
 * - POST   /issues/epic/:epicId/bug            - Create Bug under Epic
 * - POST   /issues/:parentId/subtask           - Create Subtask under Story/Task/Bug
 *
 * - GET    /issues/project/:projectId          - Get all issues
 * - GET    /issues/epic/:projectId             - Get all Epics
 * - GET    /issues/epic/:epicId/children       - Get all Story/Task/Bug under Epic
 * - GET    /issues/:parentId/subtasks          - Get all Subtasks under parent
 * - GET    /issues/:id                         - Get single issue
 *
 * - PATCH  /issues/:id                         - Update issue
 * - PATCH  /issues/:id/status                  - Change status
 * - PATCH  /issues/:id/assign                  - Assign issue
 * - DELETE /issues/:id                         - Delete issue (cascades to children)
 */
@Controller('issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  /**
   * ============ EPIC ENDPOINTS ============
   */

  /**
   * Create an Epic (top-level issue)
   * POST /issues/epic
   */
  @Post('epic')
  createEpic(@Body() body: any) {
    if (!body.projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!body.title) {
      throw new BadRequestException('title is required');
    }
    return this.issueService.create({
      ...body,
      type: 'epic',
      // Epic must NOT have epicId or parentIssueId
      epicId: undefined,
      parentIssueId: undefined,
    });
  }

  /**
   * ============ STORY/TASK/BUG ENDPOINTS ============
   */

  /**
   * Create a Story under an Epic
   * POST /issues/epic/:epicId/story
   */
  @Post('epic/:epicId/story')
  createStory(@Param('epicId') epicId: string, @Body() body: any) {
    if (!body.projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!body.title) {
      throw new BadRequestException('title is required');
    }
    return this.issueService.create({
      ...body,
      type: 'story',
      epicId,
      parentIssueId: undefined,
    });
  }

  /**
   * Create a Task under an Epic
   * POST /issues/epic/:epicId/task
   */
  @Post('epic/:epicId/task')
  createTask(@Param('epicId') epicId: string, @Body() body: any) {
    if (!body.projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!body.title) {
      throw new BadRequestException('title is required');
    }
    return this.issueService.create({
      ...body,
      type: 'task',
      epicId,
      parentIssueId: undefined,
    });
  }

  /**
   * Create a Bug under an Epic
   * POST /issues/epic/:epicId/bug
   */
  @Post('epic/:epicId/bug')
  createBug(@Param('epicId') epicId: string, @Body() body: any) {
    if (!body.projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!body.title) {
      throw new BadRequestException('title is required');
    }
    return this.issueService.create({
      ...body,
      type: 'bug',
      epicId,
      parentIssueId: undefined,
    });
  }

  /**
   * ============ SUBTASK ENDPOINTS ============
   */

  /**
   * Create a Subtask under Story/Task/Bug
   * POST /issues/:parentId/subtask
   */
  @Post(':parentId/subtask')
  createSubtask(@Param('parentId') parentId: string, @Body() body: any) {
    if (!body.projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!body.title) {
      throw new BadRequestException('title is required');
    }
    return this.issueService.create({
      ...body,
      type: 'subtask',
      parentIssueId: parentId,
      epicId: undefined,
    });
  }

  /**
   * ============ READ ENDPOINTS ============
   */

  /**
   * Get issue by ID
   * GET /issues/:id
   */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.issueService.findById(id);
  }

  /**
   * Get all issues in a project
   * GET /issues/project/:projectId
   */
  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string) {
    return this.issueService.getByProject(projectId);
  }

  /**
   * Get all Epics in a project
   * GET /issues/epic/:projectId
   */
  @Get('epic/:projectId')
  getEpics(@Param('projectId') projectId: string) {
    return this.issueService.getEpicsByProject(projectId);
  }

  /**
   * Get all Story/Task/Bug under an Epic
   * GET /issues/epic/:epicId/children
   */
  @Get('epic/:epicId/children')
  getChildrenByEpic(@Param('epicId') epicId: string) {
    return this.issueService.getChildrenByEpic(epicId);
  }

  /**
   * Get all Subtasks under a parent issue
   * GET /issues/:parentId/subtasks
   */
  @Get(':parentId/subtasks')
  getSubtasks(@Param('parentId') parentId: string) {
    return this.issueService.getSubtasks(parentId);
  }

  /**
   * ============ UPDATE ENDPOINTS ============
   */

  /**
   * Update an issue
   * PATCH /issues/:id
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.issueService.update(id, body);
  }

  /**
   * Change issue status
   * PATCH /issues/:id/status
   */
  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.issueService.changeStatus(id, status);
  }

  /**
   * Assign issue to user
   * PATCH /issues/:id/assign
   */
  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body('assignee') assignee: string) {
    return this.issueService.assign(id, assignee);
  }

  /**
   * ============ DELETE ENDPOINTS ============
   */

  /**
   * Delete an issue (cascades to children)
   * DELETE /issues/:id
   */
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.issueService.delete(id);
  }
}
