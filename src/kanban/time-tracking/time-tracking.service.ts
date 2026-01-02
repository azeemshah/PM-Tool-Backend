// src/kanban/time-tracking/time-tracking.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TimeLog, TimeLogDocument } from './schemas/time-log.schema';
import { Timesheet, TimesheetDocument } from './schemas/timesheet.schema';
import { CreateTimeLogDto } from './dto/create-time-log.dto';
import { UpdateTimeLogDto } from './dto/update-time-log.dto';

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectModel(TimeLog.name) private readonly timeLogModel: Model<TimeLogDocument>,
    @InjectModel(Timesheet.name) private readonly timesheetModel: Model<TimesheetDocument>,
  ) {}

  // -------------------- Create Time Log --------------------
  async createTimeLog(dto: CreateTimeLogDto): Promise<TimeLog> {
    const timeLog = new this.timeLogModel({
      workItem: new Types.ObjectId(dto.workItemId),
      hoursSpent: dto.hoursSpent,
      description: dto.description,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
    });
    return timeLog.save();
  }

  // -------------------- Get All Time Logs --------------------
  async getAllTimeLogs(): Promise<TimeLog[]> {
    return this.timeLogModel.find().populate('workItem').populate('userId').exec();
  }

  // -------------------- Get Time Log by ID --------------------
  async getTimeLogById(id: string): Promise<TimeLog> {
    const timeLog = await this.timeLogModel.findById(id).populate('workItem').populate('userId').exec();
    if (!timeLog) throw new NotFoundException(`Time log with ID ${id} not found`);
    return timeLog;
  }

  // -------------------- Update Time Log --------------------
  async updateTimeLog(id: string, dto: UpdateTimeLogDto): Promise<TimeLog> {
    const updated = await this.timeLogModel
      .findByIdAndUpdate(
        id,
        {
          ...(dto.workItemId && { workItem: new Types.ObjectId(dto.workItemId) }),
          ...(dto.hoursSpent !== undefined && { hoursSpent: dto.hoursSpent }),
          ...(dto.description && { description: dto.description }),
          ...(dto.userId && { userId: new Types.ObjectId(dto.userId) }),
        },
        { new: true },
      )
      .populate('workItem')
      .populate('userId')
      .exec();

    if (!updated) throw new NotFoundException(`Time log with ID ${id} not found`);
    return updated;
  }

  // -------------------- Delete Time Log --------------------
  async deleteTimeLog(id: string): Promise<{ message: string }> {
    const result = await this.timeLogModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Time log with ID ${id} not found`);
    return { message: 'Time log deleted successfully' };
  }

  // -------------------- Get Timesheet by User --------------------
  async getTimesheet(userId: string, weekStart: Date, weekEnd: Date): Promise<Timesheet> {
    // Fetch all time logs for the user in the week
    const logs = await this.timeLogModel
      .find({
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: weekStart, $lte: weekEnd },
      })
      .exec();

    const totalHours = logs.reduce((sum, log) => sum + log.hoursSpent, 0);

    // Either create or update the timesheet
    let timesheet = await this.timesheetModel.findOne({
      user: new Types.ObjectId(userId),
      weekStart,
      weekEnd,
    });

    if (!timesheet) {
      timesheet = new this.timesheetModel({
        user: new Types.ObjectId(userId),
        weekStart,
        weekEnd,
        timeLogs: logs.map(log => log._id),
        totalHours,
      });
    } else {
      timesheet.timeLogs = logs.map(log => log._id);
      timesheet.totalHours = totalHours;
    }

    return timesheet.save();
  }
}
