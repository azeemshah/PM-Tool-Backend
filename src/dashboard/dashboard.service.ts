import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../project-management/schemas/project-management.schema';
import { Issue } from '../issue/schemas/issue.schema';
import { TimeLog } from '../time-log/schemas/time-log.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Issue.name) private issueModel: Model<Issue>,
    @InjectModel(TimeLog.name) private timeLogModel: Model<TimeLog>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getOverview() {
    const [totalProjects, totalUsers, totalIssues] = await Promise.all([
      this.projectModel.countDocuments(),
      this.userModel.countDocuments(),
      this.issueModel.countDocuments(),
    ]);

    const issuesByStatus = await this.issueModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return { totalProjects, totalUsers, totalIssues, issuesByStatus };
  }

  async getProjectDashboard(projectId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) return null;

    const issuesByStatus = await this.issueModel.aggregate([
      { $match: { project: projectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const issuesByPriority = await this.issueModel.aggregate([
      { $match: { project: projectId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const totalIssues = await this.issueModel.countDocuments({ project: projectId });

    return { totalIssues, issuesByStatus, issuesByPriority };
  }

  async getUserDashboard(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) return null;

    const myIssues = await this.issueModel.find({ assignee: userId });

    const completed = myIssues.filter((i) => i.status === 'DONE').length;
    const pending = myIssues.length - completed;

    const timeLogged = await this.timeLogModel.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalMinutes: { $sum: '$timeSpent' } } },
    ]);

    return {
      totalTasks: myIssues.length,
      completed,
      pending,
      timeLogged: timeLogged[0]?.totalMinutes || 0,
    };
  }

  async getSprintStats(sprintId: string) {
    const issues = await this.issueModel.find({ sprint: sprintId });
    if (!issues || issues.length === 0) return null;

    const done = issues.filter((i) => i.status === 'DONE').length;

    return {
      sprintId,
      totalIssues: issues.length,
      completedIssues: done,
      completionRate: Math.round((done / issues.length) * 100),
    };
  }
}
