import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimeLog } from './schemas/time-log.schema';

@Injectable()
export class TimeLogService {
  constructor(
    @InjectModel(TimeLog.name)
    private timeLogModel: Model<TimeLog>,
  ) {}

  create(data: any) {
    return this.timeLogModel.create(data);
  }

  getByIssue(issueId: string) {
    return this.timeLogModel.find({ issueId });
  }

  getByUser(userId: string) {
    return this.timeLogModel.find({ userId });
  }

  remove(id: string) {
    return this.timeLogModel.findByIdAndDelete(id);
  }
}
