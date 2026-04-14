// src/dashboard/dashboard.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DashboardWidget } from './schemas/dashboard-widget.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(DashboardWidget.name)
    private readonly dashboardModel: Model<DashboardWidget>,
  ) {}

  /* ================= Create Widget ================= */
  async createWidget(data: Partial<DashboardWidget>) {
    const widget = new this.dashboardModel({
      ...data,
      workspace: new Types.ObjectId(data.workspace),
      user: new Types.ObjectId(data.user),
    });
    return widget.save();
  }

  /* ================= Get All Widgets for User/Workspace ================= */
  async getWidgets(workspaceId: string, userId: string) {
    return this.dashboardModel
      .find({
        workspace: new Types.ObjectId(workspaceId),
        user: new Types.ObjectId(userId),
      })
      .sort({ positionY: 1, positionX: 1 })
      .exec();
  }

  /* ================= Get Single Widget ================= */
  async getWidget(widgetId: string) {
    const widget = await this.dashboardModel.findById(widgetId).exec();
    if (!widget) throw new NotFoundException('Widget not found');
    return widget;
  }

  /* ================= Update Widget ================= */
  async updateWidget(widgetId: string, data: Partial<DashboardWidget>) {
    const widget = await this.dashboardModel.findByIdAndUpdate(
      widgetId,
      { $set: data },
      { new: true },
    );
    if (!widget) throw new NotFoundException('Widget not found');
    return widget;
  }

  /* ================= Delete Widget ================= */
  async deleteWidget(widgetId: string) {
    const widget = await this.dashboardModel.findByIdAndDelete(widgetId);
    if (!widget) throw new NotFoundException('Widget not found');
    return { deleted: true };
  }

  /* ================= Toggle Widget Visibility ================= */
  async toggleVisibility(widgetId: string) {
    const widget = await this.getWidget(widgetId);
    widget.isVisible = !widget.isVisible;
    return widget.save();
  }
}
