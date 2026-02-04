import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TimeLog } from './schemas/time-log.schema';
import { Item } from '../work-items/schemas/work-item.schema';
import { HistoryService } from '../kanban/history/history.service';

@Injectable()
export class TimeLogService {
  constructor(
    @InjectModel(TimeLog.name)
    private timeLogModel: Model<TimeLog>,
    @InjectModel(Item.name)
    private itemModel: Model<Item>,
    private historyService: HistoryService,
  ) {}

  // ============ MANUAL TIME LOGGING ============

  /**
   * Create a new time log entry (manual logging)
   */
  async create(data: {
    issueId: string;
    timeSpent: number;
    logDate: Date;
    comment?: string;
    issueType?: string;
    userId: string;
  }) {
    if (!Types.ObjectId.isValid(data.issueId)) {
      throw new BadRequestException('Invalid issue ID');
    }
    if (!data.timeSpent || data.timeSpent <= 0) {
      throw new BadRequestException('timeSpent must be a positive number (minutes)');
    }

    const issue = await this.itemModel.findById(data.issueId);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const timeLog = await this.timeLogModel.create({
      userId: new Types.ObjectId(data.userId),
      workItemId: new Types.ObjectId(data.issueId),
      timeSpent: data.timeSpent,
      logDate: data.logDate || new Date(),
      comment: data.comment,
      issueType: data.issueType || issue.type || 'task',
      isActive: false,
    });

    // Update issue's cached timeSpent
    issue.timeSpent = (issue.timeSpent || 0) + data.timeSpent;
    issue.remainingEstimate = Math.max(0, (issue.originalEstimate || 0) - issue.timeSpent);
    await issue.save();

    // Recalculate parent times if this issue has a parent
    if (issue.parent) {
      await this.recalculateParentTime(issue.parent.toString());
    }

    // Log to activity history
    try {
      await this.historyService.log({
        userId: new Types.ObjectId(data.userId),
        projectId: new Types.ObjectId(issue.workspace.toString()),
        taskId: new Types.ObjectId(data.issueId),
        type: 'time_logged',
        details: {
          timeSpent: data.timeSpent,
          comment: data.comment || '',
          description: `Logged ${data.timeSpent} minutes`,
        },
      });
    } catch (err) {
      console.error('Failed to log activity history:', err);
      // Don't fail the time log creation if history logging fails
    }

    return timeLog;
  }

  // ============ TIMER-BASED LOGGING ============

  /**
   * Start a timer for an issue
   * Prevents multiple active timers per user per issue
   */
  async startTimer(issueId: string, userId: string) {
    if (!Types.ObjectId.isValid(issueId)) {
      throw new BadRequestException('Invalid issue ID');
    }

    const issue = await this.itemModel.findById(issueId);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Check if user already has an active timer on this issue
    const existingActive = await this.timeLogModel.findOne({
      workItemId: new Types.ObjectId(issueId),
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (existingActive) {
      throw new BadRequestException('Timer already running for this issue');
    }

    // Check if user has active timers on OTHER issues (optional: prevent multitasking)
    const otherActive = await this.timeLogModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true,
      workItemId: { $ne: new Types.ObjectId(issueId) },
    });

    if (otherActive) {
      throw new BadRequestException('Stop your current timer before starting a new one');
    }

    const now = new Date();
    const timer = await this.timeLogModel.create({
      userId: new Types.ObjectId(userId),
      workItemId: new Types.ObjectId(issueId),
      startedAt: now,
      isActive: true,
      timeSpent: 0,
      logDate: now,
      issueType: issue.type || 'task',
    });

    return { timer, message: 'Timer started' };
  }

  /**
   * Stop a timer and calculate elapsed time
   */
  async stopTimer(issueId: string, userId: string, comment?: string) {
    if (!Types.ObjectId.isValid(issueId)) {
      throw new BadRequestException('Invalid issue ID');
    }

    const timer = await this.timeLogModel.findOne({
      workItemId: new Types.ObjectId(issueId),
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!timer) {
      throw new NotFoundException('No active timer found for this issue');
    }

    const endedAt = new Date();
    const elapsedMs = endedAt.getTime() - timer.startedAt!.getTime();
    const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000)); // at least 1 minute

    timer.endedAt = endedAt;
    timer.timeSpent = elapsedMinutes;
    timer.isActive = false;
    if (comment) timer.comment = comment;

    await timer.save();

    // Update issue's cached timeSpent
    const issue = await this.itemModel.findById(issueId);
    if (issue) {
      issue.timeSpent = (issue.timeSpent || 0) + elapsedMinutes;
      issue.remainingEstimate = Math.max(0, (issue.originalEstimate || 0) - issue.timeSpent);
      await issue.save();

      // Recalculate parent times if this issue has a parent
      if (issue.parent) {
        await this.recalculateParentTime(issue.parent.toString());
      }

      // Log to activity history
      try {
        await this.historyService.log({
          userId: new Types.ObjectId(userId),
          projectId: new Types.ObjectId(issue.workspace.toString()),
          taskId: new Types.ObjectId(issueId),
          type: 'time_logged',
          details: {
            timeSpent: elapsedMinutes,
            comment: comment || '',
            description: `Logged ${elapsedMinutes} minutes from timer`,
          },
        });
      } catch (err) {
        console.error('Failed to log activity history:', err);
        // Don't fail the timer stop if history logging fails
      }
    }

    return { timer, elapsedMinutes, message: 'Timer stopped and logged' };
  }

  // ============ EDIT & DELETE ============

  /**
   * Edit logged time (permission-based: user can edit own, admin can edit any)
   */
  async update(
    logId: string,
    data: { timeSpent?: number; comment?: string; logDate?: Date },
    userId: string,
    isAdmin: boolean = false,
  ) {
    if (!Types.ObjectId.isValid(logId)) {
      throw new BadRequestException('Invalid log ID');
    }

    const log = await this.timeLogModel.findById(logId);
    if (!log) {
      throw new NotFoundException('Time log not found');
    }

    // Permission check: user can edit own logs, admin can edit any
    const isOwner = log.userId.toString() === userId;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only edit your own time logs');
    }

    const oldTimeSpent = log.timeSpent;
    const issue = await this.itemModel.findById(log.workItemId);

    // Store previous value for audit trail
    log.previousTimeSpent = oldTimeSpent;
    if (data.timeSpent !== undefined) log.timeSpent = data.timeSpent;
    if (data.comment !== undefined) log.comment = data.comment;
    if (data.logDate) log.logDate = data.logDate;
    log.editedBy = new Types.ObjectId(userId);

    await log.save();

    // Recalculate issue totals
    if (issue) {
      const timeDiff = (data.timeSpent || log.timeSpent) - oldTimeSpent;
      issue.timeSpent = Math.max(0, (issue.timeSpent || 0) + timeDiff);
      issue.remainingEstimate = Math.max(0, (issue.originalEstimate || 0) - issue.timeSpent);
      await issue.save();

      // Recalculate parent times if this issue has a parent
      if (issue.parent) {
        await this.recalculateParentTime(issue.parent.toString());
      }

      // Log to activity history
      try {
        const changeDetails: any = {};
        if (data.timeSpent !== undefined && data.timeSpent !== oldTimeSpent) {
          changeDetails.from = oldTimeSpent;
          changeDetails.to = data.timeSpent;
        }
        if (data.comment !== undefined) {
          changeDetails.comment = data.comment;
        }

        await this.historyService.log({
          userId: new Types.ObjectId(userId),
          projectId: new Types.ObjectId(issue.workspace.toString()),
          taskId: new Types.ObjectId(log.workItemId.toString()),
          type: 'time_logged',
          details: {
            action: 'updated',
            ...changeDetails,
            description: `Updated time log from ${oldTimeSpent} to ${data.timeSpent || oldTimeSpent} minutes`,
          },
        });
      } catch (err) {
        console.error('Failed to log activity history:', err);
        // Don't fail the update if history logging fails
      }
    }

    return log;
  }

  /**
   * Delete a time log and restore remaining estimate
   */
  async remove(logId: string, userId: string, isAdmin: boolean = false) {
    if (!Types.ObjectId.isValid(logId)) {
      throw new BadRequestException('Invalid log ID');
    }

    const log = await this.timeLogModel.findById(logId);
    if (!log) {
      throw new NotFoundException('Time log not found');
    }

    // Permission check
    const isOwner = log.userId.toString() === userId;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own time logs');
    }

    // Restore timeSpent from issue
    const issue = await this.itemModel.findById(log.workItemId);
    if (issue) {
      issue.timeSpent = Math.max(0, (issue.timeSpent || 0) - log.timeSpent);
      issue.remainingEstimate = Math.max(0, (issue.originalEstimate || 0) - issue.timeSpent);
      await issue.save();

      // Recalculate parent times if this issue has a parent
      if (issue.parent) {
        await this.recalculateParentTime(issue.parent.toString());
      }

      // Log to activity history
      try {
        await this.historyService.log({
          userId: new Types.ObjectId(userId),
          projectId: new Types.ObjectId(issue.workspace.toString()),
          taskId: new Types.ObjectId(log.workItemId.toString()),
          type: 'time_logged',
          details: {
            action: 'deleted',
            timeSpent: log.timeSpent,
            comment: log.comment || '',
            description: `Deleted time log entry (${log.timeSpent} minutes)`,
          },
        });
      } catch (err) {
        console.error('Failed to log activity history:', err);
        // Don't fail the deletion if history logging fails
      }
    }

    await this.timeLogModel.findByIdAndDelete(logId);

    return { message: 'Time log deleted and issue totals restored' };
  }

  // ============ RETRIEVE LOGS ============

  getByIssue(issueId: string) {
    if (!Types.ObjectId.isValid(issueId)) {
      throw new BadRequestException('Invalid issue ID');
    }
    return this.timeLogModel
      .find({ workItemId: new Types.ObjectId(issueId), isActive: false })
      .sort({ logDate: -1 })
      .populate({ path: 'userId', select: '_id firstName lastName profilePicture' });
  }

  getByUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.timeLogModel
      .find({ userId: new Types.ObjectId(userId), isActive: false })
      .sort({ logDate: -1 })
      .populate({ path: 'workItemId', select: '_id title key' });
  }

  async getActiveTimer(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.timeLogModel
      .findOne({ userId: new Types.ObjectId(userId), isActive: true })
      .populate({ path: 'workItemId', select: '_id title key' });
  }

  // ============ TIMESHEET (STEP 5) ============

  /**
   * Get timesheet for a user with daily/weekly grouping
   * GET /time-logs/timesheet?userId=&from=&to=
   */
  async getTimesheet(userId: string, fromDate: Date, toDate: Date) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const logs = await this.timeLogModel
      .find({
        userId: new Types.ObjectId(userId),
        logDate: { $gte: fromDate, $lte: toDate },
        isActive: false,
      })
      .sort({ logDate: 1 })
      .populate({
        path: 'workItemId',
        select: '_id title key type workspace',
      });

    // Group by date
    const byDate: { [key: string]: any } = {};
    let weekTotals: { [key: string]: number } = {};

    logs.forEach((log: any) => {
      const dateStr = new Date(log.logDate).toISOString().split('T')[0];
      const weekKey = this.getWeekKey(new Date(log.logDate));

      if (!byDate[dateStr]) {
        byDate[dateStr] = { totalMinutes: 0, entries: [] };
      }

      byDate[dateStr].totalMinutes += log.timeSpent;
      byDate[dateStr].entries.push({
        _id: log._id,
        timeSpent: log.timeSpent,
        comment: log.comment,
        workItem: log.workItemId,
        logDate: log.logDate,
      });

      if (!weekTotals[weekKey]) weekTotals[weekKey] = 0;
      weekTotals[weekKey] += log.timeSpent;
    });

    return {
      userId,
      fromDate,
      toDate,
      dailyBreakdown: byDate,
      weeklyTotals: weekTotals,
      totalMinutes: Object.values(byDate).reduce((sum: any, day: any) => sum + day.totalMinutes, 0),
    };
  }

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  // ============ PRIVATE HELPERS FOR TIME CONSISTENCY ============

  /**
   * Recalculate parent item's time totals recursively
   * (Same logic as ItemService.recalculateParentTime)
   */
  private async recalculateParentTime(parentId: string) {
    if (!Types.ObjectId.isValid(parentId)) return;

    const parent = await this.itemModel.findById(parentId);
    if (!parent) return;

    // Sum direct children
    const children = await this.itemModel.find({ parent: parent._id }).lean();
    const sums = children.reduce(
      (acc: any, c: any) => {
        acc.original += Number(c.originalEstimate || 0);
        acc.remaining += Number(c.remainingEstimate || Math.max(0, (c.originalEstimate || 0) - (c.timeSpent || 0)));
        acc.spent += Number(c.timeSpent || 0);
        return acc;
      },
      { original: 0, remaining: 0, spent: 0 },
    );

    // When children exist, parent becomes aggregated
    if (children.length > 0) {
      parent.originalEstimate = sums.original;
      parent.remainingEstimate = Math.max(0, sums.remaining);
      parent.timeSpent = sums.spent;
      await parent.save();
    }

    // Recurse upwards
    if (parent.parent) await this.recalculateParentTime(parent.parent.toString());
  }
}
