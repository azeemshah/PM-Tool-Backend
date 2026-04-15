import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './schemas/notification.schema';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /* ================= Create Notification ================= */
  async create(payload: Partial<Notification>) {
    const notification = new this.notificationModel({
      ...payload,
      isRead: false,
    });
    let savedNotification = await notification.save();

    // Populate workspace details
    savedNotification = await savedNotification.populate('workspace', 'name');

    // Emit real-time notification
    if (savedNotification.recipient) {
      const recipientId = savedNotification.recipient.toString();
      try {
        this.notificationGateway.sendNotification(recipientId, savedNotification);
      } catch (error) {
        console.error(`NotificationService: Failed to emit notification to ${recipientId}`, error);
      }
    }

    return savedNotification;
  }

  /* ================= Get Notifications by User ================= */
  async findByUser(userId: Types.ObjectId) {
    return this.notificationModel
      .find({ recipient: userId })
      .populate('workspace', 'name')
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
      { recipient: userId, isRead: false },
      { isRead: true },
    );
  }

  /* ================= Delete All Notifications ================= */
  async deleteAll(userId: Types.ObjectId) {
    return this.notificationModel.deleteMany({ recipient: userId });
  }

  /* ================= Delete Notification ================= */
  async delete(notificationId: Types.ObjectId) {
    const notification = await this.notificationModel.findByIdAndDelete(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return {
      message: 'Notification deleted successfully',
    };
  }
}
