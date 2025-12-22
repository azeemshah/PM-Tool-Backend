import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../projects/schemas/project.schema';
import { Issue } from '../issue/schemas/issue.schema';
import { Sprint } from '../sprint/schemas/sprint.schema';
import { TimeLog } from '../time-log/schemas/time-log.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Issue.name) private issueModel: Model<Issue>,
    @InjectModel(Sprint.name) private sprintModel: Model<Sprint>,
    @InjectModel(TimeLog.name) private timeLogModel: Model<TimeLog>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getOverview() {
    const [
      totalProjects,
      totalUsers,
      totalIssues,
      activeSprints,
    ] = await Promise.all([
      this.projectModel.countDocuments(),
      this.userModel.countDocuments(),
      this.issueModel.countDocuments(),
      this.sprintModel.countDocuments({ status: 'ACTIVE' }),
    ]);

    const issuesByStatus = await this.issueModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return { totalProjects, totalUsers, totalIssues, activeSprints, issuesByStatus };
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

    const completed = myIssues.filter(i => i.status === 'DONE').length;
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
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) return null;

    const issues = await this.issueModel.find({ sprint: sprintId });
    const done = issues.filter(i => i.status === 'DONE').length;

    return {
      sprintId,
      totalIssues: issues.length,
      completedIssues: done,
      completionRate: issues.length === 0 ? 0 : Math.round((done / issues.length) * 100),
    };
  }
}
