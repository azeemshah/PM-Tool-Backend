// src/kanban/notification/notification.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  /* ================= Create Notification ================= */
  async create(payload: Partial<Notification>) {
    const notification = new this.notificationModel({
      ...payload,
      isRead: false,
    });
    return notification.save();
  }

  /* ================= Get Notifications by User ================= */
  async findByUser(userId: Types.ObjectId) {
    return this.notificationModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /* ================= Mark Single Notification as Read ================= */
  async markAsRead(notificationId: Types.ObjectId) {
    const notification = await this.notificationModel.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /* ================= Mark All Notifications as Read ================= */
  async markAllAsRead(userId: Types.ObjectId) {
    return this.notificationModel.updateMany(
      { user: userId, isRead: false },
      { isRead: true },
    );
  }

  /* ================= Delete Notification ================= */
  async delete(notificationId: Types.ObjectId) {
    const notification = await this.notificationModel.findByIdAndDelete(
      notificationId,
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return {
      message: 'Notification deleted successfully',
    };
  }
}
