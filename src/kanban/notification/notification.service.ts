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
    console.log('NotificationService: Creating notification', payload);
    const notification = new this.notificationModel({
      ...payload,
      isRead: false,
    });
    const savedNotification = await notification.save();
    console.log('NotificationService: Saved notification', savedNotification._id);
    
    // Emit real-time notification
    if (savedNotification.recipient) {
        console.log('NotificationService: Emitting to gateway for recipient', savedNotification.recipient.toString());
        this.notificationGateway.sendNotification(savedNotification.recipient.toString(), savedNotification);
    }
    
    return savedNotification;
  }

  /* ================= Get Notifications by User ================= */
  async findByUser(userId: Types.ObjectId) {
    return this.notificationModel.find({ recipient: userId }).sort({ createdAt: -1 }).exec();
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
    return this.notificationModel.updateMany({ recipient: userId, isRead: false }, { isRead: true });
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
