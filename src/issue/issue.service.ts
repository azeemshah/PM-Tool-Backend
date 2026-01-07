import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Issue } from './schemas/issue.schema';

@Injectable()
export class IssueService {
  constructor(@InjectModel(Issue.name) private issueModel: Model<Issue>) {}

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
   * Creates an issue with hierarchy validation
   */
  async create(data: any): Promise<Issue> {
    this.validateHierarchy(data);

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
    return this.issueModel.find({ projectId }).populate('assignee reporter').exec();
  }

  /**
   * Get all epics for a project
   */
  async getEpicsByProject(projectId: string): Promise<Issue[]> {
    return this.issueModel.find({ projectId, type: 'epic' }).populate('assignee reporter').exec();
  }

  /**
   * Get all Story/Task/Bug under an Epic
   */
  async getChildrenByEpic(epicId: string): Promise<Issue[]> {
    return this.issueModel
      .find({ epicId, type: { $in: ['story', 'task', 'bug'] } })
      .populate('assignee reporter')
      .exec();
  }

  /**
   * Get all Subtasks under a parent issue (Story/Task/Bug)
   */
  async getSubtasks(parentIssueId: string): Promise<Issue[]> {
    return this.issueModel
      .find({ parentIssueId, type: 'subtask' })
      .populate('assignee reporter')
      .exec();
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
    const validStatuses = ['todo', 'in-progress', 'done'];
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
