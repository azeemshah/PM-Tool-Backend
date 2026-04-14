import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './schemas/activity.schema';

@Injectable()
export class HistoryService {
  constructor(@InjectModel(Activity.name) private activityModel: Model<Activity>) {}

  async log(dto: Partial<Activity>) {
    try {
      return await this.activityModel.create(dto);
    } catch (err) {
      // swallow logging errors so main flows are not blocked
      console.error('Activity log failed', err);
      return null;
    }
  }

  async list(query: {
    userId?: string;
    projectId?: string;
    taskId?: string;
    type?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 20);
    const skip = (page - 1) * limit;
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const filter: any = {};
    if (query.userId) filter.userId = query.userId;
    if (query.projectId) filter.projectId = query.projectId;
    if (query.taskId) filter.taskId = query.taskId;
    if (query.type) filter.type = query.type;
    if (query.from || query.to) filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);

    // DEBUG: Log the filter and query parameters
    console.log('HistoryService.list filter:', JSON.stringify(filter));
    console.log('HistoryService.list sortOrder:', sortOrder);

    const [items, total] = await Promise.all([
      this.activityModel
        .find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email avatar')
        .populate('taskId', 'title type status')
        .populate('projectId', 'name')
        .lean()
        .exec(),
      this.activityModel.countDocuments(filter),
    ]);

    const formattedItems = items.map((item: any) => {
      if (item.userId) {
        item.userId.name = `${item.userId.firstName || ''} ${item.userId.lastName || ''}`.trim();
      }
      return item;
    });

    // DEBUG: Log the first item to check population
    if (formattedItems.length > 0) {
      console.log('HistoryService.list first item:', JSON.stringify(formattedItems[0], null, 2));
    }

    return {
      total,
      page,
      limit,
      items: formattedItems,
    };
  }

  async getById(id: string) {
    return this.activityModel.findById(id).lean().exec();
  }
}
