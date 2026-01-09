import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Issue } from './schemas/issue.schema';
import { Counter } from './schemas/counter.schema';

@Injectable()
export class IssueService {
  constructor(
    @InjectModel(Issue.name) private issueModel: Model<Issue>,
    @InjectModel(Counter.name) private counterModel: Model<Counter>,
  ) {}

  /**
   * Validates issue hierarchy according to Jira rules:
   * - Epic: No parent (epicId and parentIssueId must be null)
   * - Story/Task/Bug: Must have epicId, no parentIssueId
   * - Subtask: Must have parentIssueId pointing to Story/Task/Bug, no epicId
   */
  private validateHierarchy(data: any) {
    const { type, epicId, parentIssueId } = data;

    if (type === 'epic') {
      // Epic: must be top level
      if (epicId || parentIssueId) {
        throw new BadRequestException(
          'Epic cannot have a parent. Remove epicId and parentIssueId.',
        );
      }
    } else if (['story', 'task', 'bug'].includes(type)) {
      // Story/Task/Bug: must be under Epic
      if (!epicId) {
        throw new BadRequestException(`${type} must have an epicId. Cannot have parentIssueId.`);
      }
      if (parentIssueId) {
        throw new BadRequestException(
          `${type} must link to Epic via epicId, not have a parentIssueId.`,
        );
      }
    } else if (type === 'subtask') {
      // Subtask: must have parent Story/Task/Bug
      if (!parentIssueId) {
        throw new BadRequestException(
          'Subtask must have a parentIssueId pointing to Story, Task, or Bug.',
        );
      }
      if (epicId) {
        throw new BadRequestException('Subtask should not have epicId. Use parentIssueId instead.');
      }
    }
  }

  /**
   * Generates a unique issue key atomically using MongoDB counter
   * Format: ISS-123
   * Uses findOneAndUpdate to prevent race conditions
   * Falls back to finding next available key if counter conflicts with existing keys
   */
  private async generateIssueKey(projectId: string): Promise<string> {
    const counterId = `issue_counter_${projectId}`;

    // Try up to 10 times to find an unused key
    for (let attempt = 0; attempt < 10; attempt++) {
      const counter = await this.counterModel.findOneAndUpdate(
        { counterId: counterId },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true },
      );

      const key = `ISS-${counter.sequence}`;

      // Check if this key already exists
      const existing = await this.issueModel.findOne({ key }).exec();
      if (!existing) {
        return key;
      }

      // If key exists, continue loop to get next sequence number
    }

    // Fallback: find highest existing key and use next one
    const maxKey = await this.issueModel
      .findOne({ key: /^ISS-\d+$/ })
      .sort({ createdAt: -1 })
      .exec();

    if (!maxKey || !maxKey.key) {
      return 'ISS-1';
    }

    const match = maxKey.key.match(/^ISS-(\d+)$/);
    const nextNum = match ? parseInt(match[1]) + 1 : 1;
    return `ISS-${nextNum}`;
  }

  /**
   * Creates an issue with hierarchy validation
   */
  async create(data: any): Promise<Issue> {
    this.validateHierarchy(data);

    // Generate unique key if not provided
    if (!data.key) {
      data.key = await this.generateIssueKey(data.projectId);
    }

    // If parentIssueId is provided, validate that parent is Story/Task/Bug
    if (data.parentIssueId) {
      const parentIssue = await this.issueModel.findById(data.parentIssueId).exec();
      if (!parentIssue) {
        throw new NotFoundException('Parent issue not found');
      }
      if (!['story', 'task', 'bug'].includes(parentIssue.type)) {
        throw new BadRequestException(
          `Parent issue must be of type story, task, or bug. Found: ${parentIssue.type}`,
        );
      }
    }

    // If epicId is provided, validate that it's actually an Epic
    if (data.epicId) {
      const epic = await this.issueModel.findById(data.epicId).exec();
      if (!epic) {
        throw new NotFoundException('Epic not found');
      }
      if (epic.type !== 'epic') {
        throw new BadRequestException('Referenced issue is not an Epic');
      }
    }

    return this.issueModel.create(data);
  }

  /**
   * Get all issues for a project
   */
  async getByProject(projectId: string): Promise<Issue[]> {
    return this.issueModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .populate('assignee reporter')
      .exec();
  }

  /**
   * Get all epics for a project
   */
  async getEpicsByProject(projectId: string): Promise<Issue[]> {
    // First try as ObjectId
    let epics = await this.issueModel
      .find({ projectId: new Types.ObjectId(projectId), type: 'epic' })
      .populate('assignee reporter')
      .exec();

    // If no results, try as string (in case projectId was stored as string)
    if (!epics || epics.length === 0) {
      epics = await this.issueModel
        .find({ projectId: projectId as any, type: 'epic' })
        .populate('assignee reporter')
        .exec();
    }

    return epics || [];
  }

  /**
   * Get all Story/Task/Bug under an Epic
   */
  async getChildrenByEpic(epicId: string): Promise<Issue[]> {
    // Try matching as ObjectId first (normal case)
    try {
      const children = await this.issueModel
        .find({ epicId: new Types.ObjectId(epicId), type: { $in: ['story', 'task', 'bug'] } })
        .populate('assignee reporter')
        .exec();
      if (children && children.length > 0) return children;
    } catch (e) {
      // ignore cast errors and fall back to string match
    }

    // Fallback: match epicId stored as string (some records may have string IDs)
    const fallback = await this.issueModel
      .find({ epicId: epicId as any, type: { $in: ['story', 'task', 'bug'] } })
      .populate('assignee reporter')
      .exec();
    return fallback || [];
  }

  /**
   * Get all Subtasks under a parent issue (Story/Task/Bug)
   */
  async getSubtasks(parentIssueId: string): Promise<Issue[]> {
    // Try matching as ObjectId first
    try {
      const subtasks = await this.issueModel
        .find({ parentIssueId: new Types.ObjectId(parentIssueId), type: 'subtask' })
        .populate('assignee reporter')
        .exec();
      if (subtasks && subtasks.length > 0) return subtasks;
    } catch (e) {
      // ignore
    }

    // Fallback to string match
    const fallback = await this.issueModel
      .find({ parentIssueId: parentIssueId as any, type: 'subtask' })
      .populate('assignee reporter')
      .exec();
    return fallback || [];
  }

  /**
   * Update an issue with hierarchy validation
   */
  async update(id: string, data: any): Promise<Issue> {
    const issue = await this.issueModel.findById(id).exec();
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Prevent changing type if it would break hierarchy
    if (data.type && data.type !== issue.type) {
      throw new BadRequestException(
        'Cannot change issue type. Create a new issue with the desired type instead.',
      );
    }

    // Validate hierarchy for updated data
    this.validateHierarchy({ ...issue.toObject(), ...data });

    const updated = await this.issueModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!updated) throw new NotFoundException('Issue not found');
    return updated;
  }

  /**
   * Change issue status
   */
  async changeStatus(id: string, status: string): Promise<Issue> {
    const validStatuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const updated = await this.issueModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!updated) throw new NotFoundException('Issue not found');
    return updated;
  }

  /**
   * Assign issue to user
   */
  async assign(id: string, assignee: string): Promise<Issue> {
    const updated = await this.issueModel
      .findByIdAndUpdate(id, { assignee: new Types.ObjectId(assignee) }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Issue not found');
    return updated;
  }

  /**
   * Delete an issue and handle cascading
   */
  async delete(id: string): Promise<{ message: string }> {
    const issue = await this.issueModel.findById(id).exec();
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // If deleting an Epic, also delete all Story/Task/Bug under it
    if (issue.type === 'epic') {
      const children = await this.issueModel.find({ epicId: id }).exec();
      for (const child of children) {
        // Delete subtasks under each child
        await this.issueModel.deleteMany({ parentIssueId: child._id }).exec();
      }
      // Delete children
      await this.issueModel.deleteMany({ epicId: id }).exec();
    }
    // If deleting Story/Task/Bug, also delete subtasks
    else if (['story', 'task', 'bug'].includes(issue.type)) {
      await this.issueModel.deleteMany({ parentIssueId: id }).exec();
    }

    // Finally delete the issue itself
    await this.issueModel.findByIdAndDelete(id).exec();
    return { message: 'Issue deleted successfully' };
  }

  /**
   * Get issue by ID
   */
  async findById(id: string): Promise<Issue> {
    const issue = await this.issueModel.findById(id).populate('assignee reporter').exec();
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    return issue;
  }
}
